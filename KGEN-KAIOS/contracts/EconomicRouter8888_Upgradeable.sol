// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {LingxiaoBankModuleBaseUpgradeable} from "./LingxiaoBankModuleBaseUpgradeable.sol";

contract EconomicRouter8888_Upgradeable is LingxiaoBankModuleBaseUpgradeable {
    bytes32 public constant MODULE_ID = keccak256("KAIOS.BANK.MODULE.ECONOMIC_ROUTER_8888");
    address public economicBank8888;
    mapping(bytes32 routeId => bool executed) public routeExecuted;
    uint256 public totalRouted;

    error InvalidRoute();
    event EconomicBank8888Bound(address indexed economicBank8888);
    event EconomicCapitalRouted(bytes32 indexed routeId, address indexed economicBank8888, uint256 amount, bytes32 indexed purposeHash);

    function initialize(address bankAddress, address governance, address upgrader, address economicBank)
        external
        initializer
    {
        __LingxiaoBankModule_init(bankAddress, governance, upgrader, MODULE_ID);
        if (economicBank == address(0) || economicBank.code.length == 0) revert NotAContract(economicBank);
        economicBank8888 = economicBank;
        emit EconomicBank8888Bound(economicBank);
    }

    function version() external pure returns (string memory) { return "1.0.0"; }

    function routeCapital(bytes32 routeId, uint256 amount, bytes32 purposeHash) external onlyRole(GOVERNANCE_ROLE) nonReentrant {
        if (routeId == bytes32(0) || amount == 0 || purposeHash == bytes32(0) || routeExecuted[routeId]) revert InvalidRoute();
        routeExecuted[routeId] = true;
        _pay(keccak256(abi.encode(MODULE_ID, routeId)), economicBank8888, amount);
        totalRouted += amount;
        emit EconomicCapitalRouted(routeId, economicBank8888, amount, purposeHash);
    }

    uint256[47] private __gap;
}
