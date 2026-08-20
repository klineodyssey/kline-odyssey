// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

interface IKAIOSAlchemyBurnable {
    function burnForAlchemy(
        address owner,
        address catalystOwner,
        address beneficiary,
        uint256 kaiosAmount,
        uint256 requiredKgenCatalyst,
        bytes32 subjectLifeId,
        bytes32 destinationCode
    ) external returns (bytes32 alchemyProofId, uint256 expectedKufo);
}

/**
 * @title KAIOSAlchemyFurnace
 * @notice Point 18911 holder-authorized KAIOS burn, KGEN catalyst escrow and 49-epoch proof runtime.
 * @dev KGEN is returned atomically by the registered 511111 Wormhole; it is never burned or retained.
 */
contract KAIOSAlchemyFurnace is ReentrancyGuard {
    using SafeERC20 for IERC20;

    string public constant SELF_NAME = unicode"太上老君";
    string public constant LIFE_ID_TEXT = "LIFE-KAIOS-TAISHANG-LAOJUN-18911";
    string public constant ROLE = "LAND_GUARDIAN_K18911 / ALCHEMY_MASTER";
    string public constant DUTY = unicode"守護18911煉丹審核、催化託管與不可重放血統";
    string public constant APPOINTMENT_MODE = "HUMAN_APPOINTED";
    string public constant EMBODIMENT_STATUS = "RECRUITED_PENDING_EMBODIMENT";
    string public constant CAPABILITY_BOUNDARY =
        "ALCHEMY_ONLY_NO_CATALYST_WITHDRAW_RESCUE_REDIRECT";
    bytes32 public constant ORGAN_WORMHOLE_511111 = keccak256("KAIOS.ORGAN.WORMHOLE.511111");
    uint256 public constant KAIOS_WEI_PER_KGEN_CATALYST_WEI = 1_000;
    uint64 public constant MATURATION_EPOCHS = 49;

    struct Proof {
        address owner;
        address catalystOwner;
        address beneficiary;
        uint256 kaiosBurned;
        uint256 kgenCatalystAmount;
        uint256 kufoAmount;
        bytes32 lifeId;
        bytes32 destinationCode;
        bytes32 memorialProofId;
        uint64 burnEpoch;
        uint64 maturityEpoch;
        bool consumed;
        bool catalystReturned;
    }

    IKAIOSAlchemyBurnable public immutable kaios;
    IERC20 public immutable kgen;
    IKAIOSOrganRegistry public immutable organRegistry;
    uint64 public immutable epochSeconds;
    bytes32 public immutable lifeId;
    uint256 public immutable guardianPoint;
    bytes32 public immutable dutyHash;
    bytes32 public immutable capabilityBoundaryHash;
    uint256 public totalCatalystEscrowed;
    uint256 public totalCatalystReturned;

    mapping(bytes32 => Proof) private _proofs;

    error ZeroAddress();
    error ZeroAmount();
    error NotAContract(address account);
    error InvalidEpochDuration();
    error InexactKgenCatalystRatio(uint256 kaiosAmount);
    error CatalystBalanceDeltaMismatch(uint256 expectedAmount, uint256 actualAmount);
    error UnknownProof(bytes32 proofId);
    error ProofNotMature(uint64 currentEpoch, uint64 maturityEpoch);
    error ProofAlreadyConsumed(bytes32 proofId);
    error OnlyCurrentWormhole(address caller);

    event CatalystEscrowed(bytes32 indexed proofId, address indexed catalystOwner, uint256 kgenCatalystAmount);
    event CatalystReturned(bytes32 indexed proofId, address indexed catalystOwner, uint256 kgenCatalystAmount);
    event LaojunMemorialRecorded(
        bytes32 indexed memorialProofId,
        bytes32 indexed proofId,
        address indexed catalystOwner,
        bytes32 lifeId
    );
    event AlchemyProofCreated(
        bytes32 indexed proofId,
        address indexed owner,
        address indexed beneficiary,
        address catalystOwner,
        uint256 kaiosBurned,
        uint256 kgenCatalystAmount,
        uint256 kufoAmount,
        bytes32 memorialProofId,
        uint64 burnEpoch,
        uint64 maturityEpoch
    );
    event AlchemyProofConsumed(bytes32 indexed proofId, address indexed beneficiary, uint256 kufoAmount);
    event ProgramLifeRecruited(
        bytes32 indexed programLifeId,
        uint256 indexed appointedGuardianPoint,
        bytes32 indexed appointedDutyHash,
        bytes32 capabilityHash,
        string appointmentMode,
        string embodimentStatus
    );

    constructor(address kaiosToken, address canonicalKgen, address registry, uint64 epochDurationSeconds) {
        if (kaiosToken == address(0) || canonicalKgen == address(0) || registry == address(0)) {
            revert ZeroAddress();
        }
        if (kaiosToken.code.length == 0) revert NotAContract(kaiosToken);
        if (canonicalKgen.code.length == 0) revert NotAContract(canonicalKgen);
        if (registry.code.length == 0) revert NotAContract(registry);
        if (epochDurationSeconds == 0) revert InvalidEpochDuration();
        kaios = IKAIOSAlchemyBurnable(kaiosToken);
        kgen = IERC20(canonicalKgen);
        organRegistry = IKAIOSOrganRegistry(registry);
        epochSeconds = epochDurationSeconds;
        lifeId = keccak256(bytes(LIFE_ID_TEXT));
        guardianPoint = 18_911;
        dutyHash = keccak256(bytes(DUTY));
        capabilityBoundaryHash = keccak256(bytes(CAPABILITY_BOUNDARY));
        emit ProgramLifeRecruited(
            lifeId,
            guardianPoint,
            dutyHash,
            capabilityBoundaryHash,
            APPOINTMENT_MODE,
            EMBODIMENT_STATUS
        );
    }

    function burnForKufo(
        uint256 kaiosAmount,
        address beneficiary,
        bytes32 subjectLifeId,
        bytes32 destinationCode
    ) external nonReentrant returns (bytes32 proofId, uint256 expectedKufo) {
        if (kaiosAmount == 0) revert ZeroAmount();
        if (beneficiary == address(0)) revert ZeroAddress();
        if (kaiosAmount % KAIOS_WEI_PER_KGEN_CATALYST_WEI != 0) {
            revert InexactKgenCatalystRatio(kaiosAmount);
        }

        uint256 catalystAmount = kaiosAmount / KAIOS_WEI_PER_KGEN_CATALYST_WEI;
        uint256 escrowBalanceBefore = kgen.balanceOf(address(this));
        kgen.safeTransferFrom(msg.sender, address(this), catalystAmount);
        uint256 escrowBalanceAfter = kgen.balanceOf(address(this));
        if (escrowBalanceAfter - escrowBalanceBefore != catalystAmount) {
            revert CatalystBalanceDeltaMismatch(catalystAmount, escrowBalanceAfter - escrowBalanceBefore);
        }

        (proofId, expectedKufo) = kaios.burnForAlchemy(
            msg.sender,
            msg.sender,
            beneficiary,
            kaiosAmount,
            catalystAmount,
            subjectLifeId,
            destinationCode
        );

        uint64 burnEpoch = currentEpoch();
        uint64 maturityEpoch = burnEpoch + MATURATION_EPOCHS;
        bytes32 memorialProofId = keccak256(
            abi.encode("LAOJUN.ALCHEMY.MEMORIAL.V1", block.chainid, address(this), proofId)
        );
        _proofs[proofId] = Proof({
            owner: msg.sender,
            catalystOwner: msg.sender,
            beneficiary: beneficiary,
            kaiosBurned: kaiosAmount,
            kgenCatalystAmount: catalystAmount,
            kufoAmount: expectedKufo,
            lifeId: subjectLifeId,
            destinationCode: destinationCode,
            memorialProofId: memorialProofId,
            burnEpoch: burnEpoch,
            maturityEpoch: maturityEpoch,
            consumed: false,
            catalystReturned: false
        });
        totalCatalystEscrowed += catalystAmount;

        emit CatalystEscrowed(proofId, msg.sender, catalystAmount);
        emit LaojunMemorialRecorded(memorialProofId, proofId, msg.sender, subjectLifeId);
        emit AlchemyProofCreated(
            proofId,
            msg.sender,
            beneficiary,
            msg.sender,
            kaiosAmount,
            catalystAmount,
            expectedKufo,
            memorialProofId,
            burnEpoch,
            maturityEpoch
        );
    }

    function consumeMaturedProof(bytes32 proofId)
        external
        nonReentrant
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
        storedProof.catalystReturned = true;
        beneficiary = storedProof.beneficiary;
        kufoAmount = storedProof.kufoAmount;
        totalCatalystReturned += storedProof.kgenCatalystAmount;

        uint256 escrowBalanceBefore = kgen.balanceOf(address(this));
        uint256 ownerBalanceBefore = kgen.balanceOf(storedProof.catalystOwner);
        kgen.safeTransfer(storedProof.catalystOwner, storedProof.kgenCatalystAmount);
        uint256 escrowDelta = escrowBalanceBefore - kgen.balanceOf(address(this));
        uint256 ownerDelta = kgen.balanceOf(storedProof.catalystOwner) - ownerBalanceBefore;
        if (escrowDelta != storedProof.kgenCatalystAmount || ownerDelta != storedProof.kgenCatalystAmount) {
            revert CatalystBalanceDeltaMismatch(storedProof.kgenCatalystAmount, ownerDelta);
        }

        emit CatalystReturned(proofId, storedProof.catalystOwner, storedProof.kgenCatalystAmount);
        emit AlchemyProofConsumed(proofId, beneficiary, kufoAmount);
    }

    function proof(bytes32 proofId) external view returns (Proof memory) {
        return _proofs[proofId];
    }

    function currentEpoch() public view returns (uint64) {
        return uint64(block.timestamp / epochSeconds);
    }

    function catalystLiability() external view returns (uint256) {
        return totalCatalystEscrowed - totalCatalystReturned;
    }
}
