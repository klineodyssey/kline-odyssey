// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @notice TEST-ONLY positive-matter source for local K108000 EVM verification.
 *         This is not a production matter asset or canonical organ.
 */
contract K108000PositiveMatterSourceMock {
    mapping(address => uint256) public matterBalance;
    mapping(bytes32 => bool) public consumedProof;

    error InsufficientMatter(uint256 observed, uint256 required);
    error ProofAlreadyUsed(bytes32 proofId);

    function setMatter(address owner, uint256 amount) external {
        matterBalance[owner] = amount;
    }

    function consumeMatter(address owner, uint256 matterAmount, bytes32 reactionProofId) external returns (uint256) {
        if (consumedProof[reactionProofId]) revert ProofAlreadyUsed(reactionProofId);
        uint256 observed = matterBalance[owner];
        if (observed < matterAmount) revert InsufficientMatter(observed, matterAmount);
        consumedProof[reactionProofId] = true;
        matterBalance[owner] = observed - matterAmount;
        return matterAmount;
    }
}
