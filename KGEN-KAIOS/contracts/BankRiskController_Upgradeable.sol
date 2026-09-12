// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {LingxiaoBankModuleBaseUpgradeable} from "./LingxiaoBankModuleBaseUpgradeable.sol";

contract BankRiskController_Upgradeable is LingxiaoBankModuleBaseUpgradeable {
    bytes32 public constant MODULE_ID = keccak256("KAIOS.BANK.MODULE.RISK_CONTROLLER");

    uint256 public reserveFloor;
    uint256 public alertThreshold;
    uint64 public lastAssessmentAt;
    bytes32 public lastAssessmentHash;

    error InvalidRiskParameters();
    event RiskParametersApplied(uint256 reserveFloor, uint256 alertThreshold);
    event RiskAssessmentRecorded(bytes32 indexed assessmentHash, uint64 assessedAt, uint256 balance, uint256 available);

    function initialize(address bankAddress, address governance, address upgrader) external initializer {
        __LingxiaoBankModule_init(bankAddress, governance, upgrader, MODULE_ID);
    }

    function version() external pure returns (string memory) { return "1.0.0"; }

    function applyRiskParameters(uint256 newReserveFloor, uint256 newAlertThreshold)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        if (newAlertThreshold < newReserveFloor) revert InvalidRiskParameters();
        reserveFloor = newReserveFloor;
        alertThreshold = newAlertThreshold;
        bank.setReserveRequirement(newReserveFloor);
        emit RiskParametersApplied(newReserveFloor, newAlertThreshold);
    }

    function recordAssessment(bytes32 assessmentHash) external onlyRole(GOVERNANCE_ROLE) {
        if (assessmentHash == bytes32(0)) revert InvalidRiskParameters();
        lastAssessmentHash = assessmentHash;
        lastAssessmentAt = uint64(block.timestamp);
        emit RiskAssessmentRecorded(assessmentHash, lastAssessmentAt, bank.kaiosBalance(), bank.availableKaios());
    }

    function riskStatus()
        external
        view
        returns (uint256 balance, uint256 available, uint256 reserve, uint256 alert, bool belowAlert, bool bankPaused)
    {
        balance = bank.kaiosBalance();
        available = bank.availableKaios();
        reserve = reserveFloor;
        alert = alertThreshold;
        belowAlert = balance < alertThreshold;
        bankPaused = bank.paused();
    }

    uint256[46] private __gap;
}
