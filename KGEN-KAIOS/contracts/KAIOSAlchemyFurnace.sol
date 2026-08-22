// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

interface IKAIOSAlchemyBurnable {
    function burnForAlchemy(
        address owner,
        address beneficiary,
        uint256 kaiosAmount,
        bytes32 lifeId,
        bytes32 destinationCode
    ) external returns (bytes32 alchemyProofId, uint256 expectedKufo);

    function KGEN() external view returns (address);
    function ORGAN_REGISTRY() external view returns (address);
    function expectedKufoForKAIOS(uint256 kaiosAmount) external view returns (uint256);
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
    bytes32 public constant ORGAN_FURNACE_18911 = keccak256("KAIOS.ORGAN.FURNACE.18911");
    address public constant PREDECESSOR = 0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1;
    uint64 public constant EMBODIMENT_VERSION = 3;
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
    IERC20 public immutable kaiosToken;
    IERC20 public immutable kgen;
    address public immutable catalystBank;
    IKAIOSOrganRegistry public immutable organRegistry;
    bytes32 public immutable lifeId;
    uint256 public immutable guardianPoint;
    bytes32 public immutable dutyHash;
    bytes32 public immutable capabilityBoundaryHash;
    bytes32 public immutable kaiosRuntimeCodeHash;
    bytes32 public immutable kgenRuntimeCodeHash;
    bytes32 public immutable organRegistryCodeHash;
    bytes32 public immutable catalystBankCodeHash;
    uint256 public totalKgenContributedToBank;

    mapping(bytes32 => Proof) private _proofs;

    error ZeroAddress();
    error NotAContract(address account);
    error RuntimeCodeHashMismatch(address account, bytes32 expected, bytes32 actual);
    error RuntimeBindingMismatch(address expected, address actual);
    error RuntimeInterfaceMismatch(address account);
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
    error IncorrectExactAllowance(address asset, uint256 currentAllowance, uint256 requiredAllowance);

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
    event SuccessorEmbodimentDeclared(
        bytes32 indexed programLifeId,
        address indexed predecessor,
        uint64 indexed embodimentVersion,
        address candidateBody
    );

    constructor(
        address kaiosTokenAddress,
        address canonicalKgen,
        address immutableCatalystBank,
        address registry,
        bytes32 expectedKaiosRuntimeCodeHash,
        bytes32 expectedKgenRuntimeCodeHash,
        bytes32 expectedRegistryCodeHash,
        bytes32 expectedCatalystBankCodeHash
    ) {
        if (
            kaiosTokenAddress == address(0) ||
            canonicalKgen == address(0) ||
            immutableCatalystBank == address(0) ||
            registry == address(0)
        ) revert ZeroAddress();
        _requireRuntime(kaiosTokenAddress, expectedKaiosRuntimeCodeHash);
        _requireRuntime(canonicalKgen, expectedKgenRuntimeCodeHash);
        _requireRuntime(immutableCatalystBank, expectedCatalystBankCodeHash);
        _requireRuntime(registry, expectedRegistryCodeHash);
        kaios = IKAIOSAlchemyBurnable(kaiosTokenAddress);
        kaiosToken = IERC20(kaiosTokenAddress);
        kgen = IERC20(canonicalKgen);
        catalystBank = immutableCatalystBank;
        organRegistry = IKAIOSOrganRegistry(registry);
        kaiosRuntimeCodeHash = expectedKaiosRuntimeCodeHash;
        kgenRuntimeCodeHash = expectedKgenRuntimeCodeHash;
        organRegistryCodeHash = expectedRegistryCodeHash;
        catalystBankCodeHash = expectedCatalystBankCodeHash;
        if (kaios.KGEN() != canonicalKgen) {
            revert RuntimeBindingMismatch(canonicalKgen, kaios.KGEN());
        }
        if (kaios.ORGAN_REGISTRY() != registry) {
            revert RuntimeBindingMismatch(registry, kaios.ORGAN_REGISTRY());
        }
        if (kaios.expectedKufoForKAIOS(1 ether) != 1_000 ether) {
            revert RuntimeInterfaceMismatch(kaiosTokenAddress);
        }
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
        emit SuccessorEmbodimentDeclared(lifeId, PREDECESSOR, EMBODIMENT_VERSION, address(this));
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
        uint256 kaiosAllowance = kaiosToken.allowance(msg.sender, address(this));
        if (kaiosAllowance != kaiosAmount) {
            revert IncorrectExactAllowance(address(kaiosToken), kaiosAllowance, kaiosAmount);
        }
        uint256 kgenAllowance = kgen.allowance(msg.sender, address(this));
        if (kgenAllowance != catalystAmount) {
            revert IncorrectExactAllowance(address(kgen), kgenAllowance, catalystAmount);
        }
        uint256 bankBalanceBefore = kgen.balanceOf(catalystBank);
        kgen.safeTransferFrom(msg.sender, catalystBank, catalystAmount);
        uint256 bankBalanceAfter = kgen.balanceOf(catalystBank);
        uint256 bankDelta = bankBalanceAfter >= bankBalanceBefore ? bankBalanceAfter - bankBalanceBefore : 0;
        if (bankDelta != catalystAmount) {
            revert CatalystBankBalanceDeltaMismatch(catalystAmount, bankDelta);
        }

        (proofId, expectedKufo) = kaios.burnForAlchemy(
            msg.sender,
            beneficiary,
            kaiosAmount,
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

    function isActiveBody() external view returns (bool) {
        return organRegistry.organ(ORGAN_FURNACE_18911) == address(this);
    }

    function _requireRuntime(address account, bytes32 expectedCodeHash) private view {
        if (account.code.length == 0) revert NotAContract(account);
        bytes32 actualCodeHash = account.codehash;
        if (expectedCodeHash == bytes32(0) || actualCodeHash != expectedCodeHash) {
            revert RuntimeCodeHashMismatch(account, expectedCodeHash, actualCodeHash);
        }
    }
}
