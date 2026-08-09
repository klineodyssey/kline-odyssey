// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ILingxiaoCelestialBank18888} from "./interfaces/ILingxiaoCelestialBank18888.sol";

abstract contract LingxiaoBankModuleBaseUpgradeable is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    ILingxiaoCelestialBank18888 public bank;
    bytes32 public moduleId;
    bool public governanceFinalized;

    error ZeroAddress();
    error NotAContract(address account);
    error GovernanceAlreadyFinalized();

    event BankModuleInitialized(
        bytes32 indexed moduleId,
        address indexed bank,
        address indexed governance,
        address upgrader
    );
    event ModuleGovernanceFinalized(
        bytes32 indexed moduleId,
        address indexed governanceContract,
        address indexed bootstrapGovernance
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function __LingxiaoBankModule_init(
        address bankAddress,
        address governance,
        address upgrader,
        bytes32 canonicalModuleId
    ) internal onlyInitializing {
        if (
            bankAddress == address(0) || governance == address(0) || upgrader == address(0)
                || canonicalModuleId == bytes32(0)
        ) revert ZeroAddress();
        if (bankAddress.code.length == 0) revert NotAContract(bankAddress);
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        bank = ILingxiaoCelestialBank18888(bankAddress);
        moduleId = canonicalModuleId;
        _grantRole(DEFAULT_ADMIN_ROLE, governance);
        _grantRole(GOVERNANCE_ROLE, governance);
        _grantRole(UPGRADER_ROLE, upgrader);
        emit BankModuleInitialized(canonicalModuleId, bankAddress, governance, upgrader);
    }

    function _pay(bytes32 paymentId, address beneficiary, uint256 amount) internal {
        bank.executeModulePayment(paymentId, beneficiary, amount);
    }

    function finalizeModuleGovernance(address governanceContract)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (governanceFinalized) revert GovernanceAlreadyFinalized();
        if (governanceContract == address(0)) revert ZeroAddress();
        if (governanceContract.code.length == 0) revert NotAContract(governanceContract);
        governanceFinalized = true;
        _grantRole(DEFAULT_ADMIN_ROLE, governanceContract);
        _grantRole(GOVERNANCE_ROLE, governanceContract);
        _revokeRole(GOVERNANCE_ROLE, msg.sender);
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
        emit ModuleGovernanceFinalized(moduleId, governanceContract, msg.sender);
    }

    function _authorizeUpgrade(address) internal override onlyRole(UPGRADER_ROLE) {}

    uint256[47] private __gap;
}
