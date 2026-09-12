// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {LingxiaoBankModuleBaseUpgradeable} from "./LingxiaoBankModuleBaseUpgradeable.sol";

contract BankGovernance_Upgradeable is LingxiaoBankModuleBaseUpgradeable {
    bytes32 public constant MODULE_ID = keccak256("KAIOS.BANK.MODULE.GOVERNANCE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant APPROVER_ROLE = keccak256("APPROVER_ROLE");

    struct Proposal {
        address target;
        uint256 value;
        bytes32 dataHash;
        uint64 executableAt;
        address proposer;
        address approver;
        bool executed;
        bool cancelled;
    }

    uint64 public governanceDelay;
    mapping(bytes32 proposalId => Proposal) private _proposals;

    error InvalidProposal();
    error ProposalClosed(bytes32 proposalId);
    error ProposalNotReady(bytes32 proposalId);
    error SameProposerAndApprover();
    error ProposalExecutionFailed(bytes reason);

    event GovernanceProposalCreated(bytes32 indexed proposalId, address indexed target, bytes32 indexed dataHash, uint64 executableAt, address proposer);
    event GovernanceProposalApproved(bytes32 indexed proposalId, address indexed approver);
    event GovernanceProposalCancelled(bytes32 indexed proposalId);
    event GovernanceProposalExecuted(bytes32 indexed proposalId, address indexed target, bytes32 indexed dataHash);

    function initialize(address bankAddress, address governance, address upgrader, uint64 minimumDelay)
        external
        initializer
    {
        if (minimumDelay < 1 hours) revert InvalidProposal();
        __LingxiaoBankModule_init(bankAddress, governance, upgrader, MODULE_ID);
        governanceDelay = minimumDelay;
        _grantRole(PROPOSER_ROLE, governance);
        _grantRole(APPROVER_ROLE, governance);
    }

    function version() external pure returns (string memory) { return "1.0.0"; }
    function proposal(bytes32 proposalId) external view returns (Proposal memory) { return _proposals[proposalId]; }

    function propose(bytes32 proposalId, address target, uint256 value, bytes calldata data)
        external
        onlyRole(PROPOSER_ROLE)
    {
        if (proposalId == bytes32(0) || target == address(0) || target.code.length == 0 || value != 0 || _proposals[proposalId].target != address(0)) revert InvalidProposal();
        uint64 executableAt = uint64(block.timestamp) + governanceDelay;
        bytes32 dataHash = keccak256(data);
        _proposals[proposalId] = Proposal(target, value, dataHash, executableAt, msg.sender, address(0), false, false);
        emit GovernanceProposalCreated(proposalId, target, dataHash, executableAt, msg.sender);
    }

    function approve(bytes32 proposalId) external onlyRole(APPROVER_ROLE) {
        Proposal storage stored = _proposals[proposalId];
        if (stored.target == address(0) || stored.executed || stored.cancelled || stored.approver != address(0)) revert ProposalClosed(proposalId);
        if (stored.proposer == msg.sender) revert SameProposerAndApprover();
        stored.approver = msg.sender;
        emit GovernanceProposalApproved(proposalId, msg.sender);
    }

    function cancel(bytes32 proposalId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Proposal storage stored = _proposals[proposalId];
        if (stored.target == address(0) || stored.executed || stored.cancelled) revert ProposalClosed(proposalId);
        stored.cancelled = true;
        emit GovernanceProposalCancelled(proposalId);
    }

    function execute(bytes32 proposalId, bytes calldata data) external nonReentrant returns (bytes memory result) {
        Proposal storage stored = _proposals[proposalId];
        if (stored.target == address(0) || stored.executed || stored.cancelled) revert ProposalClosed(proposalId);
        if (stored.approver == address(0) || block.timestamp < stored.executableAt || keccak256(data) != stored.dataHash) revert ProposalNotReady(proposalId);
        stored.executed = true;
        (bool success, bytes memory returnData) = stored.target.call(data);
        if (!success) revert ProposalExecutionFailed(returnData);
        emit GovernanceProposalExecuted(proposalId, stored.target, stored.dataHash);
        return returnData;
    }

    uint256[48] private __gap;
}
