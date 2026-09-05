// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {LingxiaoBankModuleBaseUpgradeable} from "./LingxiaoBankModuleBaseUpgradeable.sol";

contract BankMigration_Upgradeable is LingxiaoBankModuleBaseUpgradeable {
    bytes32 public constant MODULE_ID = keccak256("KAIOS.BANK.MODULE.MIGRATION");

    struct MigrationRecord {
        uint256 destinationChainId;
        address successor;
        bytes32 stateRoot;
        bytes32 manifestHash;
        uint64 proposedAt;
        uint64 acknowledgedAt;
        bool cancelled;
    }

    mapping(bytes32 migrationId => MigrationRecord) private _migrations;

    error InvalidMigration();
    event MigrationProposed(bytes32 indexed migrationId, uint256 indexed destinationChainId, address indexed successor, bytes32 stateRoot, bytes32 manifestHash);
    event MigrationAcknowledged(bytes32 indexed migrationId, uint64 acknowledgedAt);
    event MigrationCancelled(bytes32 indexed migrationId);

    function initialize(address bankAddress, address governance, address upgrader) external initializer {
        __LingxiaoBankModule_init(bankAddress, governance, upgrader, MODULE_ID);
    }

    function version() external pure returns (string memory) { return "1.0.0"; }
    function migration(bytes32 migrationId) external view returns (MigrationRecord memory) { return _migrations[migrationId]; }

    function proposeMigration(bytes32 migrationId, uint256 destinationChainId, address successor, bytes32 stateRoot, bytes32 manifestHash)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        if (migrationId == bytes32(0) || destinationChainId == 0 || successor == address(0) || stateRoot == bytes32(0) || manifestHash == bytes32(0) || _migrations[migrationId].successor != address(0)) revert InvalidMigration();
        _migrations[migrationId] = MigrationRecord(destinationChainId, successor, stateRoot, manifestHash, uint64(block.timestamp), 0, false);
        emit MigrationProposed(migrationId, destinationChainId, successor, stateRoot, manifestHash);
    }

    function acknowledgeMigration(bytes32 migrationId) external onlyRole(GOVERNANCE_ROLE) {
        MigrationRecord storage stored = _migrations[migrationId];
        if (stored.successor == address(0) || stored.cancelled || stored.acknowledgedAt != 0) revert InvalidMigration();
        stored.acknowledgedAt = uint64(block.timestamp);
        emit MigrationAcknowledged(migrationId, stored.acknowledgedAt);
    }

    function cancelMigration(bytes32 migrationId) external onlyRole(GOVERNANCE_ROLE) {
        MigrationRecord storage stored = _migrations[migrationId];
        if (stored.successor == address(0) || stored.cancelled || stored.acknowledgedAt != 0) revert InvalidMigration();
        stored.cancelled = true;
        emit MigrationCancelled(migrationId);
    }

    uint256[49] private __gap;
}
