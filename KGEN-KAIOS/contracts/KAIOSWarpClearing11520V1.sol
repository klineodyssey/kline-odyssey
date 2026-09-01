// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Warp11520 {
    function transfer(address to,uint256 value) external returns(bool);
    function transferFrom(address from,address to,uint256 value) external returns(bool);
}

/// @notice Fully-collateralized V1 clearing candidate for the 11520 KAIOS warp market.
/// @dev KAIOS is the only margin/PnL unit. Prices use E8 and warp uses E8 (1C = 1e8).
///      Each position locks player collateral plus equal counterparty reserve, so both
///      maximum loss and maximum profit are bounded by posted collateral. This makes
///      V1 solvent without inventing unsecured KAIOS. Oracle trust remains an explicit
///      production-review gate.
contract KAIOSWarpClearing11520V1 {
    struct Mark { uint256 priceE8; uint64 observedAt; }
    struct Position {
        address player;
        bytes32 symbol;
        bool isLong;
        uint128 warpE8;
        uint256 collateral;
        uint256 entryE8;
        uint64 openedAt;
        bool open;
    }

    IERC20Warp11520 public immutable kaios;
    address public immutable administrator;
    address public oracle;
    uint64 public maxMarkAge = 60;
    uint128 public maxWarpE8 = 1000e8;
    uint256 public nextPositionId = 1;
    uint256 public liquidityReserve;
    uint256 public lockedReserve;
    uint256 private lockState = 1;

    mapping(address => uint256) public cashBalance;
    mapping(address => uint256) public lockedMargin;
    mapping(bytes32 => Mark) public marks;
    mapping(uint256 => Position) public positions;

    event Deposited(address indexed player,uint256 amount);
    event Withdrawn(address indexed player,uint256 amount);
    event ReserveFunded(address indexed provider,uint256 amount);
    event OracleChanged(address indexed oldOracle,address indexed newOracle);
    event MarkUpdated(bytes32 indexed symbol,uint256 priceE8,uint64 observedAt);
    event PositionOpened(uint256 indexed positionId,address indexed player,bytes32 indexed symbol,bool isLong,uint128 warpE8,uint256 collateral,uint256 entryE8);
    event PositionClosed(uint256 indexed positionId,address indexed player,uint256 exitE8,int256 pnlKaiosWei,uint256 playerCashAfter);

    modifier nonReentrant(){require(lockState==1,"REENTRANCY");lockState=2;_;lockState=1;}
    modifier onlyAdmin(){require(msg.sender==administrator,"ONLY_ADMIN");_;}
    modifier onlyOracle(){require(msg.sender==oracle,"ONLY_ORACLE");_;}

    constructor(address kaiosToken,address initialOracle){
        require(kaiosToken!=address(0)&&initialOracle!=address(0),"ZERO_ADDRESS");
        kaios=IERC20Warp11520(kaiosToken);
        administrator=msg.sender;
        oracle=initialOracle;
    }

    function _safeTransfer(address to,uint256 value) private {
        (bool ok,bytes memory data)=address(kaios).call(abi.encodeWithSelector(kaios.transfer.selector,to,value));
        require(ok&&(data.length==0||abi.decode(data,(bool))),"TRANSFER_FAILED");
    }
    function _safeTransferFrom(address from,address to,uint256 value) private {
        (bool ok,bytes memory data)=address(kaios).call(abi.encodeWithSelector(kaios.transferFrom.selector,from,to,value));
        require(ok&&(data.length==0||abi.decode(data,(bool))),"TRANSFER_FROM_FAILED");
    }

    function setOracle(address nextOracle) external onlyAdmin {
        require(nextOracle!=address(0),"ZERO_ORACLE");
        address old=oracle; oracle=nextOracle; emit OracleChanged(old,nextOracle);
    }
    function setRiskCaps(uint64 markAge,uint128 warpCapE8) external onlyAdmin {
        require(markAge>=5&&markAge<=3600,"BAD_MARK_AGE");
        require(warpCapE8>=1&&warpCapE8<=1000e8,"BAD_WARP_CAP");
        maxMarkAge=markAge; maxWarpE8=warpCapE8;
    }
    function setMark(bytes32 symbol,uint256 priceE8,uint64 observedAt) external onlyOracle {
        require(symbol!=bytes32(0)&&priceE8>0,"BAD_MARK");
        require(observedAt<=block.timestamp&&block.timestamp-observedAt<=maxMarkAge,"STALE_MARK_INPUT");
        Mark memory prior=marks[symbol];
        require(observedAt>=prior.observedAt,"MARK_TIME_REGRESSION");
        marks[symbol]=Mark(priceE8,observedAt);
        emit MarkUpdated(symbol,priceE8,observedAt);
    }
    function currentMark(bytes32 symbol) public view returns(uint256) {
        Mark memory m=marks[symbol];
        require(m.priceE8>0,"NO_MARK");
        require(block.timestamp-m.observedAt<=maxMarkAge,"STALE_MARK");
        return m.priceE8;
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount>0,"ZERO_AMOUNT");
        _safeTransferFrom(msg.sender,address(this),amount);
        cashBalance[msg.sender]+=amount;
        emit Deposited(msg.sender,amount);
    }
    function withdraw(uint256 amount) external nonReentrant {
        require(amount>0&&cashBalance[msg.sender]>=amount,"INSUFFICIENT_CASH");
        cashBalance[msg.sender]-=amount;
        _safeTransfer(msg.sender,amount);
        emit Withdrawn(msg.sender,amount);
    }
    function fundReserve(uint256 amount) external nonReentrant {
        require(amount>0,"ZERO_AMOUNT");
        _safeTransferFrom(msg.sender,address(this),amount);
        liquidityReserve+=amount;
        emit ReserveFunded(msg.sender,amount);
    }

    function openPosition(bytes32 symbol,bool isLong,uint128 warpE8,uint256 collateral) external nonReentrant returns(uint256 id) {
        require(warpE8>0&&warpE8<=maxWarpE8,"WARP_CAP");
        require(collateral>0&&cashBalance[msg.sender]>=collateral,"INSUFFICIENT_MARGIN");
        require(liquidityReserve-lockedReserve>=collateral,"INSUFFICIENT_COUNTERPARTY_RESERVE");
        uint256 mark=currentMark(symbol);
        cashBalance[msg.sender]-=collateral;
        lockedMargin[msg.sender]+=collateral;
        lockedReserve+=collateral;
        id=nextPositionId++;
        positions[id]=Position(msg.sender,symbol,isLong,warpE8,collateral,mark,uint64(block.timestamp),true);
        emit PositionOpened(id,msg.sender,symbol,isLong,warpE8,collateral,mark);
    }

    function previewPnl(uint256 positionId,uint256 exitE8) public view returns(int256 pnlWei) {
        Position memory p=positions[positionId];
        require(p.open&&exitE8>0,"POSITION_NOT_OPEN");
        uint256 delta=p.entryE8>exitE8?p.entryE8-exitE8:exitE8-p.entryE8;
        // deltaE8 * warpE8 * 100 = KAIOS wei because E8*E8 -> E16 and 1 KAIOS = 1e18 wei.
        uint256 magnitude=delta*uint256(p.warpE8)*100;
        if(magnitude>p.collateral)magnitude=p.collateral;
        bool favorable=p.isLong?exitE8>=p.entryE8:exitE8<=p.entryE8;
        pnlWei=favorable?int256(magnitude):-int256(magnitude);
    }

    function closePosition(uint256 positionId) external nonReentrant returns(int256 pnlWei) {
        Position storage p=positions[positionId];
        require(p.open&&p.player==msg.sender,"POSITION_NOT_OWNED_OPEN");
        uint256 exitE8=currentMark(p.symbol);
        pnlWei=previewPnl(positionId,exitE8);
        p.open=false;
        lockedMargin[msg.sender]-=p.collateral;
        lockedReserve-=p.collateral;
        uint256 payout;
        if(pnlWei>=0){
            uint256 win=uint256(pnlWei);
            require(liquidityReserve>=win,"RESERVE_UNDERFLOW");
            liquidityReserve-=win;
            payout=p.collateral+win;
        }else{
            uint256 loss=uint256(-pnlWei);
            liquidityReserve+=loss;
            payout=p.collateral-loss;
        }
        cashBalance[msg.sender]+=payout;
        emit PositionClosed(positionId,msg.sender,exitE8,pnlWei,cashBalance[msg.sender]);
    }
}
