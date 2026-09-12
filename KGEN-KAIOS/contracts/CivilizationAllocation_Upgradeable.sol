// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {LingxiaoBankModuleBaseUpgradeable} from "./LingxiaoBankModuleBaseUpgradeable.sol";

contract CivilizationAllocation_Upgradeable is LingxiaoBankModuleBaseUpgradeable {
    bytes32 public constant MODULE_ID = keccak256("KAIOS.BANK.MODULE.CIVILIZATION_ALLOCATION");

    struct Allocation {
        address beneficiary;
        uint256 amount;
        uint64 executableAt;
        bytes32 purposeHash;
        bool executed;
        bool cancelled;
    }

    mapping(bytes32 allocationId => Allocation) private _allocations;
    uint256 public totalAllocated;

    error InvalidAllocation();
    error AllocationClosed(bytes32 allocationId);

    event AllocationCreated(bytes32 indexed allocationId, address indexed beneficiary, uint256 amount, bytes32 indexed purposeHash, uint64 executableAt);
    event AllocationCancelled(bytes32 indexed allocationId);
    event AllocationExecuted(bytes32 indexed allocationId, address indexed beneficiary, uint256 amount, address triggeredBy);

    function initialize(address bankAddress, address governance, address upgrader) external initializer {
        __LingxiaoBankModule_init(bankAddress, governance, upgrader, MODULE_ID);
    }

    function version() external pure returns (string memory) { return "1.0.0"; }
    function allocation(bytes32 allocationId) external view returns (Allocation memory) { return _allocations[allocationId]; }

    function createAllocation(bytes32 allocationId, address beneficiary, uint256 amount, uint64 executableAt, bytes32 purposeHash)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        if (allocationId == bytes32(0) || beneficiary == address(0) || amount == 0 || purposeHash == bytes32(0)) revert InvalidAllocation();
        if (_allocations[allocationId].beneficiary != address(0)) revert AllocationClosed(allocationId);
        _allocations[allocationId] = Allocation(beneficiary, amount, executableAt, purposeHash, false, false);
        emit AllocationCreated(allocationId, beneficiary, amount, purposeHash, executableAt);
    }

    function cancelAllocation(bytes32 allocationId) external onlyRole(GOVERNANCE_ROLE) {
        Allocation storage stored = _allocations[allocationId];
        if (stored.beneficiary == address(0) || stored.executed || stored.cancelled) revert AllocationClosed(allocationId);
        stored.cancelled = true;
        emit AllocationCancelled(allocationId);
    }

    function executeAllocation(bytes32 allocationId) external nonReentrant {
        Allocation storage stored = _allocations[allocationId];
        if (stored.beneficiary == address(0) || stored.executed || stored.cancelled || block.timestamp < stored.executableAt) revert AllocationClosed(allocationId);
        stored.executed = true;
        _pay(keccak256(abi.encode(MODULE_ID, allocationId)), stored.beneficiary, stored.amount);
        totalAllocated += stored.amount;
        emit AllocationExecuted(allocationId, stored.beneficiary, stored.amount, msg.sender);
    }

    uint256[48] private __gap;
}
