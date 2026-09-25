// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {KGEN_MarketRiskKernel_V1_0_0} from "./KGEN_MarketRiskKernel.sol";

interface IKGENBrainSettlementV4 {
    function reservePositionCollateral(bytes32 positionKey, address user, uint256 amountWei) external;
    function releasePositionCollateral(bytes32 positionKey) external;
    function settlePositionCollateral(bytes32 positionKey, int256 realizedPnlWei, uint256 badDebtWei) external;
}

interface IKGENPriceFeedV1 {
    function decimals() external view returns (uint8);
    function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

/**
 * KGEN_PositionEngine
 * VERSION: 1.0.0
 * STATUS: DRAFT_REAL_FUNDS_CANDIDATE
 * SOURCE_OF_TRUTH: CANDIDATE
 * Formal organ filename is versionless; version remains metadata.
 *
 * Candidate position state machine for KX/KY/KZ markets.
 */
contract KGEN_PositionEngine_V1_0_0 {
    uint256 internal constant BPS = 10_000;
    uint8 internal constant MAX_ORACLE_SOURCES = 3;
    enum Market { KX, KY, KZ }
    enum Status { NONE, OPEN, CLOSED, LIQUIDATED }
    struct MarketConfig { uint16 initialMarginBps; uint16 maintenanceMarginBps; uint32 maxOracleAge; uint256 minPriceWad; uint256 maxPriceWad; bool enabled; }
    struct OracleConfig { address[3] feeds; uint8 feedCount; uint8 minValidSources; uint16 maxDeviationBps; }
    struct Position { address trader; Market market; int256 sizeWad; uint256 collateralWad; uint256 entryPriceWad; uint64 openedAt; uint64 closedAt; uint256 exitPriceWad; int256 rawPnlWad; int256 realizedPnlWad; uint256 badDebtWad; Status status; }

    address public admin;
    address public executor;
    IKGENBrainSettlementV4 public immutable brainSettlement;
    uint256 public nextPositionId = 1;
    mapping(Market => MarketConfig) public marketConfig;
    mapping(Market => OracleConfig) private _oracleConfig;
    mapping(uint256 => Position) public positions;
    struct OrderTerms { uint256 orderId; int256 cWad; uint256 lots; uint256 lastPrice; uint256 observedAt; uint256 observationSequence; }
    struct OracleSample { address feed; uint80 roundId; uint256 updatedAt; uint256 answer; }
    struct OracleObservation { OracleSample[3] samples; uint256 price; uint256 oldestAt; uint8 count; }
    mapping(Market => mapping(address => OracleSample)) public oracleWatermark;
    mapping(Market => uint256) public marketObservationSequence;
    mapping(Market => bytes32) private _observationHash;
    struct SettlementReceipt {
        uint256 positionId; uint256 orderId; Market market; int256 cWad; uint256 lots;
        uint256 entryPrice; uint256 liquidationTrigger; uint256 previousPrice; uint256 observedPrice;
        uint256 observedAt; uint256 settledAt; uint256 marginBefore; uint256 marginAfter;
        int256 rawPnl; int256 realizedPnl; uint256 badDebt; Status status;
        address trader; int8 side; uint256 settlementPrice; uint256 triggeredAt; uint256 observationSequence;
    }
    mapping(uint256 => OrderTerms) public orderTerms;
    mapping(uint256 => SettlementReceipt) private _receipts;
    mapping(uint256 => bool) public usedOrderIds;
    bool public paused;
    error Paused(); error OrderAlreadyUsed(); error OutOfOrderPrice();

    function setPaused(bool value) external onlyAdmin { paused = value; }
    function settlementReceipt(uint256 id) external view returns (SettlementReceipt memory) { return _receipts[id]; }
    function positionSnapshot(uint256 id) external view returns (Position memory) { return positions[id]; }

    function openCPosition(address trader, Market market, int256 cWad, uint256 lots, uint256 orderId, uint256 expectedSequence) external onlyExecutor returns (uint256 id) {
        if (orderId == 0 || usedOrderIds[orderId]) revert OrderAlreadyUsed();
        uint256 leverage = KGEN_MarketRiskKernel_V1_0_0.validateOrder(cWad, lots);
        (uint256 price,uint256 observedAt,uint256 sequence) = _acceptMarketObservation(market);
        if (sequence != expectedSequence) revert OutOfOrderPrice();
        uint256 margin = lots * 1e18;
        if ((leverage * lots * _config(market).initialMarginBps + BPS - 1) / BPS > margin) revert InitialMarginTooLow();
        uint256 size = margin * leverage / price;
        id = _openPosition(trader,market,cWad < 0 ? -int256(size) : int256(size),margin,price);
        usedOrderIds[orderId] = true;
        orderTerms[id] = OrderTerms(orderId,cWad,lots,price,observedAt,sequence);
    }

    event ExecutorSet(address indexed executor);
    event MarketConfigured(Market indexed market, uint16 initialMarginBps, uint16 maintenanceMarginBps, uint32 maxOracleAge, uint256 minPriceWad, uint256 maxPriceWad, bool enabled);
    event OracleConfigured(Market indexed market, address feed0, address feed1, address feed2, uint8 feedCount, uint8 minValidSources, uint16 maxDeviationBps);
    event PositionOpened(uint256 indexed positionId, address indexed trader, Market indexed market, int256 sizeWad, uint256 collateralWad, uint256 entryPriceWad, bytes32 positionKey);
    event PositionClosed(uint256 indexed positionId, uint256 exitPriceWad, int256 rawPnlWad, int256 realizedPnlWad, uint256 badDebtWad);
    event PositionLiquidated(uint256 indexed positionId, uint256 markPriceWad, int256 rawPnlWad, int256 realizedPnlWad, uint256 badDebtWad);

    error NotAdmin(); error NotExecutor(); error ZeroAddress(); error InvalidRiskConfig(); error InvalidOracleConfig(); error MarketDisabled(); error OracleQuorumUnavailable(); error OracleDeviationExceeded(); error InvalidTrader(); error InvalidCollateral(); error InitialMarginTooLow(); error PositionNotOpen(); error NotLiquidatable();

    modifier onlyAdmin() { if (msg.sender != admin) revert NotAdmin(); _; }
    modifier onlyExecutor() { if (msg.sender != executor) revert NotExecutor(); _; }

    constructor(address initialAdmin, address initialExecutor, address initialBrainSettlement) {
        if (initialAdmin == address(0) || initialExecutor == address(0) || initialBrainSettlement == address(0)) revert ZeroAddress();
        admin = initialAdmin; executor = initialExecutor; brainSettlement = IKGENBrainSettlementV4(initialBrainSettlement); emit ExecutorSet(initialExecutor);
    }

    function setExecutor(address nextExecutor) external onlyAdmin { if (nextExecutor == address(0)) revert ZeroAddress(); executor = nextExecutor; emit ExecutorSet(nextExecutor); }
    function positionKey(uint256 positionId) public view returns (bytes32) { return keccak256(abi.encodePacked(address(this), positionId)); }

    function configureMarket(Market market,uint16 initialMarginBps,uint16 maintenanceMarginBps,uint32 maxOracleAge,uint256 minPriceWad,uint256 maxPriceWad,bool enabled) external onlyAdmin {
        if (initialMarginBps < 100 || maintenanceMarginBps == 0 || maintenanceMarginBps >= initialMarginBps || initialMarginBps > BPS || maxOracleAge == 0 || minPriceWad == 0 || maxPriceWad <= minPriceWad || maxPriceWad > 1e36) revert InvalidRiskConfig();
        marketConfig[market] = MarketConfig(initialMarginBps,maintenanceMarginBps,maxOracleAge,minPriceWad,maxPriceWad,enabled);
        emit MarketConfigured(market,initialMarginBps,maintenanceMarginBps,maxOracleAge,minPriceWad,maxPriceWad,enabled);
    }

    function configureOracle(Market market,address[] calldata feeds,uint8 minValidSources,uint16 maxDeviationBps) external onlyAdmin {
        if (feeds.length < 2 || feeds.length > MAX_ORACLE_SOURCES || minValidSources < 2 || minValidSources > feeds.length || maxDeviationBps == 0 || maxDeviationBps > 2_000) revert InvalidOracleConfig();
        OracleConfig storage cfg = _oracleConfig[market]; for (uint256 i=0;i<MAX_ORACLE_SOURCES;i++) cfg.feeds[i]=address(0);
        for (uint256 i=0;i<feeds.length;i++) { if (feeds[i]==address(0)) revert ZeroAddress(); for (uint256 j=0;j<i;j++) if (feeds[i]==feeds[j]) revert InvalidOracleConfig(); cfg.feeds[i]=feeds[i]; }
        cfg.feedCount=uint8(feeds.length); cfg.minValidSources=minValidSources; cfg.maxDeviationBps=maxDeviationBps;
        emit OracleConfigured(market,cfg.feeds[0],cfg.feeds[1],cfg.feeds[2],cfg.feedCount,cfg.minValidSources,cfg.maxDeviationBps);
    }

    function getOracleConfig(Market market) external view returns (address[3] memory feeds,uint8 feedCount,uint8 minValidSources,uint16 maxDeviationBps) { OracleConfig storage cfg=_oracleConfig[market]; return (cfg.feeds,cfg.feedCount,cfg.minValidSources,cfg.maxDeviationBps); }
    function readMarketPrice(Market market) external view returns (uint256 priceWad,uint256 observedAt,uint8 validSources) { return _readOracle(market); }
    function acceptMarketObservation(Market market) external onlyExecutor returns (uint256 priceWad,uint256 observedAt,uint256 sequence) { return _acceptMarketObservation(market); }

    function openPosition(address trader,Market market,int256 sizeWad,uint256 collateralWad) external onlyExecutor returns (uint256 positionId) {
        (uint256 price,,)=_acceptMarketObservation(market);
        return _openPosition(trader,market,sizeWad,collateralWad,price);
    }

    function _openPosition(address trader,Market market,int256 sizeWad,uint256 collateralWad,uint256 validated) internal returns (uint256 positionId) {
        if (paused) revert Paused();
        if (trader==address(0)) revert InvalidTrader(); if (collateralWad==0 || collateralWad>uint256(type(int256).max)) revert InvalidCollateral();
        if (collateralWad % 1e18 != 0 || collateralWad > 100e18) revert InvalidCollateral();
        MarketConfig memory cfg=_config(market); uint256 sizeAbs=_abs(sizeWad); uint256 notionalWad=KGEN_MarketRiskKernel_V1_0_0.notional(sizeAbs,validated); uint256 minInitialMargin=(notionalWad*cfg.initialMarginBps+BPS-1)/BPS; if (collateralWad<minInitialMargin || notionalWad > collateralWad*100) revert InitialMarginTooLow();
        positionId=nextPositionId++; bytes32 key=positionKey(positionId); brainSettlement.reservePositionCollateral(key,trader,collateralWad);
        positions[positionId]=Position(trader,market,sizeWad,collateralWad,validated,uint64(block.timestamp),0,0,0,0,0,Status.OPEN);
        emit PositionOpened(positionId,trader,market,sizeWad,collateralWad,validated,key);
    }

    function markPosition(uint256 positionId) public view returns (int256 unrealizedPnlWad,int256 equityWad,uint256 maintenanceMarginWad,bool liquidatable) {
        Position storage p=positions[positionId]; if (p.status!=Status.OPEN) revert PositionNotOpen(); MarketConfig memory cfg=_config(p.market); (uint256 mark,,)=_readOracle(p.market);
        uint256 notionalWad; (unrealizedPnlWad,notionalWad)=_metrics(positionId,mark); maintenanceMarginWad=KGEN_MarketRiskKernel_V1_0_0.maintenanceMargin(notionalWad,cfg.maintenanceMarginBps); equityWad=KGEN_MarketRiskKernel_V1_0_0.equity(int256(p.collateralWad),unrealizedPnlWad); liquidatable=KGEN_MarketRiskKernel_V1_0_0.liquidatable(p.collateralWad,unrealizedPnlWad,notionalWad,cfg.maintenanceMarginBps);
    }

    function closePosition(uint256 positionId) external onlyExecutor returns (int256 realizedPnlWad,uint256 badDebtWad) {
        if (orderTerms[positionId].orderId != 0) return _settleOrderPosition(positionId,false);
        Position storage p=positions[positionId]; if (p.status!=Status.OPEN) revert PositionNotOpen(); (uint256 exitPrice,,)=_readOracle(p.market); (int256 rawPnlWad,int256 boundedPnlWad,uint256 gapDebtWad)=_settlementOutcome(p.sizeWad,p.entryPriceWad,exitPrice,p.collateralWad);
        p.exitPriceWad=exitPrice; p.rawPnlWad=rawPnlWad; p.realizedPnlWad=boundedPnlWad; p.badDebtWad=gapDebtWad; p.closedAt=uint64(block.timestamp); p.status=Status.CLOSED;
        brainSettlement.settlePositionCollateral(positionKey(positionId),boundedPnlWad,gapDebtWad); emit PositionClosed(positionId,exitPrice,rawPnlWad,boundedPnlWad,gapDebtWad); return (boundedPnlWad,gapDebtWad);
    }

    function liquidatePosition(uint256 positionId) external onlyExecutor returns (int256 realizedPnlWad,uint256 badDebtWad) {
        if (orderTerms[positionId].orderId != 0) return _settleOrderPosition(positionId,true);
        Position storage p=positions[positionId]; if (p.status!=Status.OPEN) revert PositionNotOpen(); MarketConfig memory cfg=_config(p.market); (uint256 mark,,)=_readOracle(p.market);
        int256 rawPnlWad=KGEN_MarketRiskKernel_V1_0_0.pnl(p.sizeWad,p.entryPriceWad,mark); uint256 notionalWad=KGEN_MarketRiskKernel_V1_0_0.notional(_abs(p.sizeWad),mark);
        bool shouldLiquidate=KGEN_MarketRiskKernel_V1_0_0.liquidatable(p.collateralWad,rawPnlWad,notionalWad,cfg.maintenanceMarginBps); if (!shouldLiquidate) revert NotLiquidatable();
        (,int256 boundedPnlWad,uint256 gapDebtWad)=_settlementOutcome(p.sizeWad,p.entryPriceWad,mark,p.collateralWad);
        p.exitPriceWad=mark; p.rawPnlWad=rawPnlWad; p.realizedPnlWad=boundedPnlWad; p.badDebtWad=gapDebtWad; p.closedAt=uint64(block.timestamp); p.status=Status.LIQUIDATED;
        brainSettlement.settlePositionCollateral(positionKey(positionId),boundedPnlWad,gapDebtWad); emit PositionLiquidated(positionId,mark,rawPnlWad,boundedPnlWad,gapDebtWad); return (boundedPnlWad,gapDebtWad);
    }

    function _metrics(uint256 id,uint256 mark) internal view returns (int256 raw,uint256 notional) {
        Position storage p=positions[id]; OrderTerms storage t=orderTerms[id];
        if (t.orderId==0) return (KGEN_MarketRiskKernel_V1_0_0.pnl(p.sizeWad,p.entryPriceWad,mark),KGEN_MarketRiskKernel_V1_0_0.notional(_abs(p.sizeWad),mark));
        raw=KGEN_MarketRiskKernel_V1_0_0.orderPnl(t.cWad,t.lots,p.entryPriceWad,mark);
        notional=_abs(t.cWad)*t.lots*mark/p.entryPriceWad;
    }

    // Every accepted keeper observation checks the boundary in the same atomic tx.
    // This cannot observe an off-chain tick never delivered by the configured feeds.
    function observePosition(uint256 id) external onlyExecutor returns (bool liquidated) {
        Position storage p=positions[id]; if (p.status!=Status.OPEN) revert PositionNotOpen();
        (uint256 mark,uint256 observedAt,uint256 sequence)=_acceptMarketObservation(p.market); OrderTerms storage t=orderTerms[id];
        if(t.orderId==0 || sequence<=t.observationSequence) revert OutOfOrderPrice();
        (int256 raw,uint256 notional)=_metrics(id,mark);
        if(KGEN_MarketRiskKernel_V1_0_0.liquidatable(p.collateralWad,raw,notional,_config(p.market).maintenanceMarginBps)) {
            _settleOrderPosition(id,true); return true;
        }
        t.lastPrice=mark; t.observedAt=observedAt; t.observationSequence=sequence;
    }

    // Guaranteed-trigger reporting threshold. The exact integer predicate remains
    // authoritative and can trigger slightly before the conservative long value.
    function liquidationBoundary(uint256 id) public view returns (uint256 boundary) {
        Position storage p=positions[id]; OrderTerms storage t=orderTerms[id];
        uint256 lev=_abs(t.cWad); uint256 mm=_config(p.market).maintenanceMarginBps;
        uint256 exposure=lev*t.lots;
        if(t.cWad>0) {
            if(lev<=1e18 || mm>=BPS) return 0;
            boundary=p.entryPriceWad*(lev-1e18)*BPS/(lev*(BPS-mm));
            if(boundary==0 || _boundaryTriggers(id,boundary,mm)) return boundary;
            // Correlated PnL/notional floors put long equity-minus-MM less than
            // two KGEN wei above its continuous value. Move adversely by >=2.
            uint256 denominator=exposure*(BPS-mm);
            uint256 shift=(2*p.entryPriceWad*BPS+denominator-1)/denominator;
            if(shift>=boundary) return 0; // No representable positive trigger.
            boundary-=shift;
        } else {
            // For shorts raw loss=floor(notional)-exposure. Solve the integer
            // requirement q+floor(q*MM/BPS)>=margin+exposure before pricing q.
            uint256 target=(t.lots*1e18+exposure)*BPS;
            uint256 q=(target+BPS+mm-1)/(BPS+mm);
            boundary=(q*p.entryPriceWad+exposure-1)/exposure;
        }
        if(!_boundaryTriggers(id,boundary,mm)) revert NotLiquidatable();
    }

    function _boundaryTriggers(uint256 id,uint256 mark,uint256 mm) internal view returns (bool) {
        // This is a derived reporting price, not an accepted oracle input. Low-C
        // short thresholds may exceed 1e36; the derived products remain bounded.
        OrderTerms storage t=orderTerms[id]; uint256 entry=positions[id].entryPriceWad;
        int256 raw=(int256(mark)-int256(entry))*t.cWad*int256(t.lots)/int256(entry);
        uint256 notional=_abs(t.cWad)*t.lots*mark/entry;
        return KGEN_MarketRiskKernel_V1_0_0.liquidatable(t.lots*1e18,raw,notional,uint16(mm));
    }

    function _settleOrderPosition(uint256 id,bool liquidation) internal returns (int256 realized,uint256 debt) {
        Position storage p=positions[id]; if(p.status!=Status.OPEN) revert PositionNotOpen();
        OrderTerms storage t=orderTerms[id];
        SettlementReceipt storage r=_receipts[id];
        r.positionId=id; r.orderId=t.orderId; r.market=p.market; r.cWad=t.cWad; r.lots=t.lots;
        r.entryPrice=p.entryPriceWad; r.liquidationTrigger=liquidationBoundary(id); r.previousPrice=t.lastPrice;
        (r.observedPrice,r.observedAt,r.observationSequence)=_acceptMarketObservation(p.market);
        if(r.observationSequence<t.observationSequence || (r.observationSequence==t.observationSequence && r.observedPrice!=t.lastPrice)) revert OutOfOrderPrice();
        r.trader=p.trader; r.side=t.cWad>0?int8(1):int8(-1); r.settlementPrice=r.observedPrice; r.triggeredAt=block.timestamp;
        r.settledAt=block.timestamp; r.marginBefore=p.collateralWad; r.marginAfter=0;
        _classifySettlement(id,liquidation);
        p.exitPriceWad=r.observedPrice; p.rawPnlWad=r.rawPnl; p.realizedPnlWad=r.realizedPnl; p.badDebtWad=r.badDebt;
        p.closedAt=uint64(block.timestamp); p.status=r.status; p.collateralWad=0;
        t.lastPrice=r.observedPrice; t.observedAt=r.observedAt; t.observationSequence=r.observationSequence;
        brainSettlement.settlePositionCollateral(positionKey(id),r.realizedPnl,r.badDebt);
        if(r.status==Status.LIQUIDATED) emit PositionLiquidated(id,r.observedPrice,r.rawPnl,r.realizedPnl,r.badDebt);
        else emit PositionClosed(id,r.observedPrice,r.rawPnl,r.realizedPnl,r.badDebt);
        return (r.realizedPnl,r.badDebt);
    }

    function _classifySettlement(uint256 id,bool liquidation) internal {
        SettlementReceipt storage r=_receipts[id];
        uint256 notional; (r.rawPnl,notional)=_metrics(id,r.observedPrice);
        bool atBoundary=KGEN_MarketRiskKernel_V1_0_0.liquidatable(r.marginBefore,r.rawPnl,notional,_config(r.market).maintenanceMarginBps);
        if(liquidation && !atBoundary) revert NotLiquidatable();
        r.status=atBoundary?Status.LIQUIDATED:Status.CLOSED;
        r.realizedPnl=r.rawPnl;
        if(r.rawPnl < -int256(r.marginBefore)) {
            r.realizedPnl=-int256(r.marginBefore);
            r.badDebt=uint256(-(r.rawPnl+1))+1-r.marginBefore;
        }
    }

    function _readOracle(Market market) internal view returns (uint256 priceWad,uint256 observedAt,uint8 validSources) {
        OracleObservation memory observation=_collectObservation(market);
        return (observation.price,observation.oldestAt,observation.count);
    }

    // Freshness uses the oldest source time; observation identity does not.
    // Independent feeds may update without moving that minimum timestamp.
    function _acceptMarketObservation(Market market) internal returns (uint256 priceWad,uint256 observedAt,uint256 sequence) {
        OracleObservation memory observation=_collectObservation(market);
        bytes32 snapshot=keccak256(abi.encode(observation.samples));
        if(snapshot!=_observationHash[market]) {
            _observationHash[market]=snapshot;
            marketObservationSequence[market]++;
            for(uint256 i=0;i<observation.count;i++) {
                OracleSample memory sample=observation.samples[i];
                oracleWatermark[market][sample.feed]=sample;
            }
        }
        return (observation.price,observation.oldestAt,marketObservationSequence[market]);
    }

    function _collectObservation(Market market) internal view returns (OracleObservation memory observation) {
        MarketConfig memory marketCfg=_config(market);
        OracleConfig storage cfg=_oracleConfig[market];
        if(cfg.feedCount<2 || cfg.minValidSources<2) revert InvalidOracleConfig();
        uint256[3] memory prices;
        observation.oldestAt=type(uint256).max;
        for(uint256 i=0;i<cfg.feedCount;i++) {
            OracleSample memory sample=_readFeed(cfg.feeds[i],marketCfg);
            if(sample.feed==address(0)) continue;
            OracleSample storage prior=oracleWatermark[market][sample.feed];
            if(prior.feed!=address(0)) {
                if(sample.roundId<prior.roundId || sample.updatedAt<prior.updatedAt) revert OutOfOrderPrice();
                if(sample.roundId==prior.roundId && (sample.updatedAt!=prior.updatedAt || sample.answer!=prior.answer)) revert OutOfOrderPrice();
                if(sample.updatedAt==prior.updatedAt && sample.answer!=prior.answer) revert OutOfOrderPrice();
            }
            observation.samples[observation.count]=sample;
            prices[observation.count++]=sample.answer;
            if(sample.updatedAt<observation.oldestAt) observation.oldestAt=sample.updatedAt;
        }
        if(observation.count<cfg.minValidSources) revert OracleQuorumUnavailable();
        for(uint256 i=0;i<observation.count;i++) for(uint256 j=i+1;j<observation.count;j++) if(prices[j]<prices[i]) {
            uint256 swap=prices[i]; prices[i]=prices[j]; prices[j]=swap;
        }
        observation.price=observation.count==2 ? (prices[0]/2)+(prices[1]/2)+((prices[0]%2+prices[1]%2)/2) : prices[1];
        uint256 spread=prices[observation.count-1]-prices[0];
        if(spread*BPS>observation.price*cfg.maxDeviationBps) revert OracleDeviationExceeded();
    }

    function _readFeed(address feedAddress,MarketConfig memory cfg) internal view returns (OracleSample memory sample) {
        IKGENPriceFeedV1 feed=IKGENPriceFeedV1(feedAddress);
        uint8 decimalsValue;
        try feed.decimals() returns (uint8 d) { decimalsValue=d; } catch { return sample; }
        if(decimalsValue>36) return sample;
        try feed.latestRoundData() returns (uint80 roundId,int256 answer,uint256,uint256 updatedAt,uint80 answeredInRound) {
            if(roundId==0 || answer<=0 || updatedAt==0 || updatedAt>block.timestamp || answeredInRound<roundId || block.timestamp-updatedAt>cfg.maxOracleAge) return sample;
            // Invalid sources must not overflow normalization and disable a healthy quorum.
            if(decimalsValue<18 && uint256(answer)>cfg.maxPriceWad/(10**uint256(18-decimalsValue))) return sample;
            uint256 normalized=_normalizeToWad(uint256(answer),decimalsValue);
            if(normalized<cfg.minPriceWad || normalized>cfg.maxPriceWad) return sample;
            return OracleSample(feedAddress,roundId,updatedAt,normalized);
        } catch { return sample; }
    }

    function _normalizeToWad(uint256 answer,uint8 decimalsValue) internal pure returns (uint256) { if (decimalsValue==18) return answer; if (decimalsValue<18) return answer*(10**uint256(18-decimalsValue)); return answer/(10**uint256(decimalsValue-18)); }
    function _settlementOutcome(int256 sizeWad,uint256 entryPriceWad,uint256 exitPriceWad,uint256 collateralWad) internal pure returns (int256 rawPnlWad,int256 realizedPnlWad,uint256 badDebtWad) { rawPnlWad=KGEN_MarketRiskKernel_V1_0_0.pnl(sizeWad,entryPriceWad,exitPriceWad); if (rawPnlWad>=0) return (rawPnlWad,rawPnlWad,0); uint256 rawLossWad=uint256(-(rawPnlWad+1))+1; if (rawLossWad<=collateralWad) return (rawPnlWad,rawPnlWad,0); realizedPnlWad=-int256(collateralWad); badDebtWad=rawLossWad-collateralWad; }
    function _config(Market market) internal view returns (MarketConfig memory cfg) { cfg=marketConfig[market]; if (!cfg.enabled) revert MarketDisabled(); }
    function _abs(int256 value) internal pure returns (uint256) { if (value==0) revert KGEN_MarketRiskKernel_V1_0_0.ZeroSize(); if (value==type(int256).min) revert KGEN_MarketRiskKernel_V1_0_0.SignedOverflow(); return uint256(value>0?value:-value); }
}
