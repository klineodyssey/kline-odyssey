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

interface IKGODAuditMint {
    function mintFromReactionProof(bytes32 proofId) external returns (address beneficiary, uint256 amount);
}

/** @notice TEST-ONLY forged reaction source used to prove KGOD stays bound to its immutable reactor. */
contract K108000ReactionSpoofMock {
    struct ReactionRecord {
        bytes32 shipId;
        address owner;
        address beneficiary;
        uint8 mode;
        uint256 kshipAntimatterConsumed;
        uint256 positiveMatterConsumed;
        uint256 totalInputEquivalent;
        uint256 propulsionEnergy;
        uint256 recoverableEnergy;
        uint256 kgodMassEquivalent;
        uint256 radiationHeat;
        uint256 blockNumber;
        uint256 timestamp;
        bool kgodMinted;
    }

    ReactionRecord private _record;

    function mintWithoutFuel(address kgod, bytes32 proofId, address beneficiary, uint256 amount) external {
        _record = ReactionRecord({
            shipId: keccak256("TEST.SPOOF.SHIP"),
            owner: msg.sender,
            beneficiary: beneficiary,
            mode: 2,
            kshipAntimatterConsumed: amount,
            positiveMatterConsumed: amount,
            totalInputEquivalent: amount * 2,
            propulsionEnergy: 0,
            recoverableEnergy: 0,
            kgodMassEquivalent: amount,
            radiationHeat: amount,
            blockNumber: block.number,
            timestamp: block.timestamp,
            kgodMinted: false
        });
        IKGODAuditMint(kgod).mintFromReactionProof(proofId);
    }

    function reactionRecord(bytes32) external view returns (ReactionRecord memory) {
        return _record;
    }
}
