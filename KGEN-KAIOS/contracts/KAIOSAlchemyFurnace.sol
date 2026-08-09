// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

interface IKAIOSAlchemyBurnable {
    function burnForAlchemy(
        address owner,
        address beneficiary,
        uint256 kaiosAmount,
        bytes32 lifeId,
        bytes32 destinationCode
    ) external returns (bytes32 alchemyProofId, uint256 expectedKufo);
}

/**
 * @title KAIOSAlchemyFurnace
 * @notice Point 18911 holder-authorized KAIOS burn and 49-epoch proof runtime.
 */
contract KAIOSAlchemyFurnace {
    bytes32 public constant ORGAN_WORMHOLE_511111 = keccak256("KAIOS.ORGAN.WORMHOLE.511111");
    uint64 public constant MATURATION_EPOCHS = 49;

    struct Proof {
        address owner;
        address beneficiary;
        uint256 kaiosBurned;
        uint256 kufoAmount;
        bytes32 lifeId;
        bytes32 destinationCode;
        uint64 burnEpoch;
        uint64 maturityEpoch;
        bool consumed;
    }

    IKAIOSAlchemyBurnable public immutable kaios;
    IKAIOSOrganRegistry public immutable organRegistry;
    uint64 public immutable epochSeconds;

    mapping(bytes32 => Proof) private _proofs;

    error ZeroAddress();
    error InvalidEpochDuration();
    error UnknownProof(bytes32 proofId);
    error ProofNotMature(uint64 currentEpoch, uint64 maturityEpoch);
    error ProofAlreadyConsumed(bytes32 proofId);
    error OnlyCurrentWormhole(address caller);

    event AlchemyProofCreated(
        bytes32 indexed proofId,
        address indexed owner,
        address indexed beneficiary,
        uint256 kaiosBurned,
        uint256 kufoAmount,
        uint64 burnEpoch,
        uint64 maturityEpoch
    );
    event AlchemyProofConsumed(bytes32 indexed proofId, address indexed beneficiary, uint256 kufoAmount);

    constructor(address kaiosToken, address registry, uint64 epochDurationSeconds) {
        if (kaiosToken == address(0) || registry == address(0)) revert ZeroAddress();
        if (epochDurationSeconds == 0) revert InvalidEpochDuration();
        kaios = IKAIOSAlchemyBurnable(kaiosToken);
        organRegistry = IKAIOSOrganRegistry(registry);
        epochSeconds = epochDurationSeconds;
    }

    function burnForKufo(
        uint256 kaiosAmount,
        address beneficiary,
        bytes32 lifeId,
        bytes32 destinationCode
    ) external returns (bytes32 proofId, uint256 expectedKufo) {
        (proofId, expectedKufo) = kaios.burnForAlchemy(
            msg.sender,
            beneficiary,
            kaiosAmount,
            lifeId,
            destinationCode
        );

        uint64 burnEpoch = currentEpoch();
        uint64 maturityEpoch = burnEpoch + MATURATION_EPOCHS;
        _proofs[proofId] = Proof({
            owner: msg.sender,
            beneficiary: beneficiary,
            kaiosBurned: kaiosAmount,
            kufoAmount: expectedKufo,
            lifeId: lifeId,
            destinationCode: destinationCode,
            burnEpoch: burnEpoch,
            maturityEpoch: maturityEpoch,
            consumed: false
        });

        emit AlchemyProofCreated(
            proofId,
            msg.sender,
            beneficiary,
            kaiosAmount,
            expectedKufo,
            burnEpoch,
            maturityEpoch
        );
    }

    function consumeMaturedProof(bytes32 proofId)
        external
        returns (address beneficiary, uint256 kufoAmount)
    {
        address wormhole = organRegistry.organ(ORGAN_WORMHOLE_511111);
        if (msg.sender != wormhole || wormhole == address(0)) {
            revert OnlyCurrentWormhole(msg.sender);
        }

        Proof storage storedProof = _proofs[proofId];
        if (storedProof.owner == address(0)) revert UnknownProof(proofId);
        if (storedProof.consumed) revert ProofAlreadyConsumed(proofId);
        uint64 epoch = currentEpoch();
        if (epoch < storedProof.maturityEpoch) revert ProofNotMature(epoch, storedProof.maturityEpoch);

        storedProof.consumed = true;
        beneficiary = storedProof.beneficiary;
        kufoAmount = storedProof.kufoAmount;
        emit AlchemyProofConsumed(proofId, beneficiary, kufoAmount);
    }

    function proof(bytes32 proofId) external view returns (Proof memory) {
        return _proofs[proofId];
    }

    function currentEpoch() public view returns (uint64) {
        return uint64(block.timestamp / epochSeconds);
    }
}
