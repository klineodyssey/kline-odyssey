// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {LingxiaoBankModuleBaseUpgradeable} from "./LingxiaoBankModuleBaseUpgradeable.sol";

contract ExchangeSettlement11520_Upgradeable is LingxiaoBankModuleBaseUpgradeable {
    bytes32 public constant MODULE_ID = keccak256("KAIOS.BANK.MODULE.EXCHANGE_SETTLEMENT_11520");
    address public universalExchange11520;
    mapping(bytes32 settlementId => bool executed) public settlementExecuted;
    uint256 public totalSettled;

    error InvalidSettlement();
    event UniversalExchange11520Bound(address indexed exchange);
    event ExchangeSettlementExecuted(bytes32 indexed settlementId, address indexed exchange, uint256 amount, bytes32 indexed listingId);

    function initialize(address bankAddress, address governance, address upgrader, address exchange)
        external
        initializer
    {
        __LingxiaoBankModule_init(bankAddress, governance, upgrader, MODULE_ID);
        if (exchange == address(0) || exchange.code.length == 0) revert NotAContract(exchange);
        universalExchange11520 = exchange;
        emit UniversalExchange11520Bound(exchange);
    }

    function version() external pure returns (string memory) { return "1.0.0"; }

    function settle(bytes32 settlementId, uint256 amount, bytes32 listingId) external onlyRole(GOVERNANCE_ROLE) nonReentrant {
        if (settlementId == bytes32(0) || amount == 0 || listingId == bytes32(0) || settlementExecuted[settlementId]) revert InvalidSettlement();
        settlementExecuted[settlementId] = true;
        _pay(keccak256(abi.encode(MODULE_ID, settlementId)), universalExchange11520, amount);
        totalSettled += amount;
        emit ExchangeSettlementExecuted(settlementId, universalExchange11520, amount, listingId);
    }

    uint256[47] private __gap;
}
