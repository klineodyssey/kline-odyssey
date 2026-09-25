// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {KGEN_PositionEngine_V1_0_0 as PositionEngine} from "./KGEN_PositionEngine.sol";
import {KGEN_MarketRiskKernel_V1_0_0 as Risk} from "./KGEN_MarketRiskKernel.sol";

interface ITriggerBrain {
    function availablePrincipal(address trader) external view returns(uint256);
}

/**
 * VERSION: 1.0.0; STATUS: CANDIDATE_NOT_DEPLOYED
 * SOURCE: Human Owner settlement engineering order, 2026-09-25.
 * Existing Brain owns custody; existing PositionEngine owns settlement.
 * No public browser quote, arbitrary trader parameter, or keeper-supplied price.
 * Configure PositionEngine.executor to this contract, never an EOA.
 */
contract KGEN_OrderTriggerEngine is ReentrancyGuard {
    enum Status { NONE, PENDING, FILLED, CANCELLED, REJECTED }
    struct Order {
        uint256 orderId; address trader; PositionEngine.Market market;
        int256 c; uint256 lots; uint256 triggerPrice; uint256 createdAt;
        uint256 triggeredAt; uint256 observedPrice; uint256 fillPrice;
        uint256 positionId; Status status; uint256 previousPrice; uint256 observedAt; uint256 observationSequence;
    }
    struct FillReceipt {
        uint256 orderId; uint256 positionId; address trader; PositionEngine.Market market;
        int256 c; uint256 lots; uint256 createdAt; uint256 triggeredAt;
        uint256 previousPrice; uint256 triggerPrice; uint256 observedPrice;
        uint256 fillPrice; uint256 walletBefore; uint256 marginLocked; uint256 walletAfter;
        int8 side; uint256 observationSequence;
    }
    PositionEngine public immutable engine;
    ITriggerBrain public immutable brain;
    address public immutable admin;
    address public keeper;
    bool public paused;
    uint256 public nextOrderId=1;
    mapping(uint256=>Order) private _orders;
    mapping(uint256=>FillReceipt) private _receipts;
    event OrderCreated(uint256 indexed orderId,address indexed trader);
    event OrderFilled(uint256 indexed orderId,uint256 indexed positionId,uint256 price);
    event OrderTerminated(uint256 indexed orderId,Status status);
    event KeeperSet(address indexed keeper);
    event PauseSet(bool paused);
    error Unauthorized(); error InvalidOrder(); error InvalidObservation(); error Paused();
    modifier onlyKeeper(){if(msg.sender!=keeper)revert Unauthorized();_;}
    modifier onlyAdmin(){if(msg.sender!=admin)revert Unauthorized();_;}
    constructor(address positionEngine,address initialKeeper){
        if(positionEngine.code.length==0 || initialKeeper==address(0))revert InvalidOrder();
        engine=PositionEngine(positionEngine); brain=ITriggerBrain(address(engine.brainSettlement()));
        admin=msg.sender; keeper=initialKeeper;
    }
    function setKeeper(address next) external onlyAdmin {
        if(next==address(0))revert InvalidOrder(); keeper=next; emit KeeperSet(next);
    }
    function setPaused(bool value) external onlyAdmin {paused=value;emit PauseSet(value);}
    function order(uint256 id) external view returns(Order memory){return _orders[id];}
    function fillReceipt(uint256 id) external view returns(FillReceipt memory){return _receipts[id];}
    function touches(uint256 previous,uint256 trigger,uint256 current) public pure returns(bool){
        return current==trigger || (previous<trigger && current>trigger) || (previous>trigger && current<trigger);
    }
    function createOrder(PositionEngine.Market market,int256 c,uint256 lots,uint256 triggerPrice) external nonReentrant returns(uint256 id){
        if(paused)revert Paused(); Risk.validateOrder(c,lots);
        if(triggerPrice==0 || triggerPrice>1e36)revert InvalidOrder();
        (uint256 previous,uint256 observedAt,uint256 sequence)=engine.acceptMarketObservation(market);
        id=nextOrderId++;
        Order storage o=_orders[id]; o.orderId=id;o.trader=msg.sender;o.market=market;
        o.c=c;o.lots=lots;o.triggerPrice=triggerPrice;o.createdAt=block.timestamp;
        o.status=Status.PENDING;o.previousPrice=previous;o.observedAt=observedAt;o.observationSequence=sequence;
        emit OrderCreated(id,msg.sender);
    }
    function cancelOrder(uint256 id) external {
        Order storage o=_orders[id];if(o.trader!=msg.sender)revert Unauthorized();
        if(o.status!=Status.PENDING)revert InvalidOrder();o.status=Status.CANCELLED;
        emit OrderTerminated(id,o.status);
    }
    function rejectUnfundedOrder(uint256 id) external onlyKeeper {
        Order storage o=_orders[id];
        if(o.status!=Status.PENDING || brain.availablePrincipal(o.trader)>=o.lots*1e18)revert InvalidOrder();
        o.status=Status.REJECTED;emit OrderTerminated(id,o.status);
    }
    function observeOrder(uint256 id) external onlyKeeper nonReentrant returns(bool filled){
        if(paused)revert Paused();Order storage o=_orders[id];
        if(o.status!=Status.PENDING)revert InvalidOrder();
        (uint256 price,uint256 observedAt,uint256 sequence)=engine.acceptMarketObservation(o.market);
        // Same observation is only meaningful for an exact touch on creation.
        if(sequence<o.observationSequence || (sequence==o.observationSequence && (price!=o.previousPrice || price!=o.triggerPrice)))revert InvalidObservation();
        if(!touches(o.previousPrice,o.triggerPrice,price)){
            o.previousPrice=price;o.observedAt=observedAt;o.observationSequence=sequence;return false;
        }
        uint256 walletBefore=brain.availablePrincipal(o.trader);
        // Effects before interaction; any reserve/open/receipt failure rolls all back.
        o.status=Status.FILLED;o.triggeredAt=block.timestamp;o.observedPrice=price;o.fillPrice=price;
        uint256 positionId=engine.openCPosition(o.trader,o.market,o.c,o.lots,id,sequence);
        o.positionId=positionId;
        FillReceipt storage r=_receipts[id];
        r.orderId=id;r.positionId=positionId;r.trader=o.trader;r.market=o.market;r.c=o.c;r.lots=o.lots;
        r.createdAt=o.createdAt;r.triggeredAt=o.triggeredAt;r.previousPrice=o.previousPrice;
        r.triggerPrice=o.triggerPrice;r.observedPrice=price;r.fillPrice=price;
        r.walletBefore=walletBefore;r.marginLocked=o.lots*1e18;r.walletAfter=brain.availablePrincipal(o.trader);
        r.side=o.c>0?int8(1):int8(-1);r.observationSequence=sequence;
        o.previousPrice=price;o.observedAt=observedAt;o.observationSequence=sequence;
        emit OrderFilled(id,positionId,price);return true;
    }
    function observePosition(uint256 id) external onlyKeeper nonReentrant returns(bool){return engine.observePosition(id);}
    function closePosition(uint256 id) external nonReentrant {
        if(engine.positionSnapshot(id).trader!=msg.sender)revert Unauthorized();
        engine.closePosition(id);
    }
}
