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
        address catalystBank,
        bytes32 subjectLifeId,
        bytes32 destinationCode
    ) external returns (bytes32 alchemyProofId, uint256 expectedKufo);
}

interface IImmediateKUFOReleaseGate {
    function releaseImmediate(bytes32 proofId)
        external
        returns (address beneficiary, uint256 kufoAmount);
}

/**
 * @title KAIOSAlchemyFurnace
 * @notice Point 18911 atomic KGEN-bank contribution, KAIOS burn and immediate KUFO release runtime.
 * @dev KGEN moves directly from the contributor to the immutable catalyst bank. It is never burned,
 *      held by this contract or returned. A registered 511111 release gate must consume and mint the
 *      proof in the same call stack; any failure reverts the bank contribution and KAIOS burn.
 */
contract KAIOSAlchemyFurnace is ReentrancyGuard {
    using SafeERC20 for IERC20;

    string public constant SELF_NAME = unicode"太上老君";
    string public constant LIFE_ID_TEXT = "LIFE-KAIOS-TAISHANG-LAOJUN-18911";
    string public constant ROLE = "LAND_GUARDIAN_K18911 / ALCHEMY_MASTER";
    string public constant DUTY = unicode"守護18911新鮮銀行貢獻、原子燃燒與即時KUFO血統";
    string public constant APPOINTMENT_MODE = "HUMAN_APPOINTED";
    string public constant EMBODIMENT_STATUS = "RECRUITED_PENDING_EMBODIMENT";
    string public constant CAPABILITY_BOUNDARY =
        "ATOMIC_ALCHEMY_ONLY_NO_KGEN_ESCROW_WITHDRAW_RESCUE_REDIRECT";
    bytes32 public constant ORGAN_WORMHOLE_511111 = keccak256("KAIOS.ORGAN.WORMHOLE.511111");
    uint256 public constant KAIOS_WEI_PER_KGEN_CATALYST_WEI = 1_000;
    uint256 public constant MIN_ALCHEMY_AMOUNT = 1 ether;
    uint64 public constant CONTRIBUTION_FRESHNESS_WINDOW_DAYS = 130;

    struct Proof {
        address owner;
        address catalystOwner;
        address beneficiary;
        address catalystBank;
        uint256 kaiosBurned;
        uint256 kgenCatalystAmount;
        uint256 kufoAmount;
        bytes32 lifeId;
        bytes32 destinationCode;
        bytes32 memorialProofId;
        uint64 contributionBlock;
        uint64 contributionTimestamp;
        bool bankContributionVerified;
        bool releaseAuthorized;
        bool consumed;
    }

    IKAIOSAlchemyBurnable public immutable kaios;
    IERC20 public immutable kgen;
    address public immutable catalystBank;
    IKAIOSOrganRegistry public immutable organRegistry;
    bytes32 public immutable lifeId;
    uint256 public immutable guardianPoint;
    bytes32 public immutable dutyHash;
    bytes32 public immutable capabilityBoundaryHash;
    uint256 public totalKgenContributedToBank;

    mapping(bytes32 => Proof) private _proofs;

    error ZeroAddress();
    error NotAContract(address account);
    error AlchemyAmountBelowMinimum(uint256 provided, uint256 minimum);
    error InexactKgenCatalystRatio(uint256 kaiosAmount);
    error CatalystBankBalanceDeltaMismatch(uint256 expectedAmount, uint256 actualAmount);
    error UnknownProof(bytes32 proofId);
    error ProofAlreadyConsumed(bytes32 proofId);
    error ImmediateReleaseNotAuthorized(bytes32 proofId);
    error ImmediateReleaseBlockMismatch(uint64 contributionBlock, uint64 currentBlock);
    error OnlyCurrentWormhole(address caller);
    error UnexpectedKufoOutput(uint256 expected, uint256 actual);
    error ReleaseResultMismatch(address beneficiary, uint256 amount);

    event CatalystBankContribution(
        bytes32 indexed proofId,
        address indexed contributor,
        address indexed catalystBank,
        uint256 kgenAmount,
        uint64 contributionBlock,
        uint64 contributionTimestamp
    );
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
        address catalystBank,
        uint256 kaiosBurned,
        uint256 kgenCatalystAmount,
        uint256 kufoAmount,
        bytes32 memorialProofId,
        uint64 contributionBlock,
        uint64 contributionTimestamp
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

    constructor(address kaiosToken, address canonicalKgen, address immutableCatalystBank, address registry) {
        if (
            kaiosToken == address(0) ||
            canonicalKgen == address(0) ||
            immutableCatalystBank == address(0) ||
            registry == address(0)
        ) revert ZeroAddress();
        if (kaiosToken.code.length == 0) revert NotAContract(kaiosToken);
        if (canonicalKgen.code.length == 0) revert NotAContract(canonicalKgen);
        if (immutableCatalystBank.code.length == 0) revert NotAContract(immutableCatalystBank);
        if (registry.code.length == 0) revert NotAContract(registry);
        kaios = IKAIOSAlchemyBurnable(kaiosToken);
        kgen = IERC20(canonicalKgen);
        catalystBank = immutableCatalystBank;
        organRegistry = IKAIOSOrganRegistry(registry);
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
        if (beneficiary == address(0)) revert ZeroAddress();
        if (kaiosAmount < MIN_ALCHEMY_AMOUNT) {
            revert AlchemyAmountBelowMinimum(kaiosAmount, MIN_ALCHEMY_AMOUNT);
        }
        if (kaiosAmount % KAIOS_WEI_PER_KGEN_CATALYST_WEI != 0) {
            revert InexactKgenCatalystRatio(kaiosAmount);
        }

        uint256 catalystAmount = kaiosAmount / KAIOS_WEI_PER_KGEN_CATALYST_WEI;
        uint256 bankBalanceBefore = kgen.balanceOf(catalystBank);
        kgen.safeTransferFrom(msg.sender, catalystBank, catalystAmount);
        uint256 bankBalanceAfter = kgen.balanceOf(catalystBank);
        uint256 bankDelta = bankBalanceAfter >= bankBalanceBefore ? bankBalanceAfter - bankBalanceBefore : 0;
        if (bankDelta != catalystAmount) {
            revert CatalystBankBalanceDeltaMismatch(catalystAmount, bankDelta);
        }

        (proofId, expectedKufo) = kaios.burnForAlchemy(
            msg.sender,
            msg.sender,
            beneficiary,
            kaiosAmount,
            catalystAmount,
            catalystBank,
            subjectLifeId,
            destinationCode
        );
        uint256 exactKufoOutput = kaiosAmount * 1_000;
        if (expectedKufo != exactKufoOutput) {
            revert UnexpectedKufoOutput(exactKufoOutput, expectedKufo);
        }

        uint64 contributionBlock = uint64(block.number);
        uint64 contributionTimestamp = uint64(block.timestamp);
        bytes32 memorialProofId = keccak256(
            abi.encode("LAOJUN.ALCHEMY.MEMORIAL.V2", block.chainid, address(this), proofId)
        );
        _proofs[proofId] = Proof({
            owner: msg.sender,
            catalystOwner: msg.sender,
            beneficiary: beneficiary,
            catalystBank: catalystBank,
            kaiosBurned: kaiosAmount,
            kgenCatalystAmount: catalystAmount,
            kufoAmount: expectedKufo,
            lifeId: subjectLifeId,
            destinationCode: destinationCode,
            memorialProofId: memorialProofId,
            contributionBlock: contributionBlock,
            contributionTimestamp: contributionTimestamp,
            bankContributionVerified: true,
            releaseAuthorized: true,
            consumed: false
        });
        totalKgenContributedToBank += catalystAmount;

        emit CatalystBankContribution(
            proofId,
            msg.sender,
            catalystBank,
            catalystAmount,
            contributionBlock,
            contributionTimestamp
        );
        emit LaojunMemorialRecorded(memorialProofId, proofId, msg.sender, subjectLifeId);
        emit AlchemyProofCreated(
            proofId,
            msg.sender,
            beneficiary,
            msg.sender,
            catalystBank,
            kaiosAmount,
            catalystAmount,
            expectedKufo,
            memorialProofId,
            contributionBlock,
            contributionTimestamp
        );

        address wormhole = organRegistry.organ(ORGAN_WORMHOLE_511111);
        if (wormhole == address(0)) revert OnlyCurrentWormhole(address(0));
        (address releasedBeneficiary, uint256 releasedAmount) =
            IImmediateKUFOReleaseGate(wormhole).releaseImmediate(proofId);
        if (releasedBeneficiary != beneficiary || releasedAmount != expectedKufo) {
            revert ReleaseResultMismatch(releasedBeneficiary, releasedAmount);
        }
    }

    function consumeImmediateProof(bytes32 proofId)
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
        if (!storedProof.releaseAuthorized) revert ImmediateReleaseNotAuthorized(proofId);
        if (storedProof.contributionBlock != uint64(block.number)) {
            revert ImmediateReleaseBlockMismatch(storedProof.contributionBlock, uint64(block.number));
        }

        storedProof.releaseAuthorized = false;
        storedProof.consumed = true;
        beneficiary = storedProof.beneficiary;
        kufoAmount = storedProof.kufoAmount;
        emit AlchemyProofConsumed(proofId, beneficiary, kufoAmount);
    }

    function proof(bytes32 proofId) external view returns (Proof memory) {
        return _proofs[proofId];
    }

    function catalystLiability() external pure returns (uint256) {
        return 0;
    }
}
