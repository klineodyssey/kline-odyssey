// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAlchemyProofFurnace {
    function consumeImmediateProof(bytes32 proofId)
        external
        returns (address beneficiary, uint256 kufoAmount);
    function lifeId() external view returns (bytes32);
    function organRegistry() external view returns (address);
}

interface IKUFOMinter {
    function mintFromImmediateProof(bytes32 proofId) external returns (address beneficiary, uint256 amount);
    function lifeId() external view returns (bytes32);
    function organRegistry() external view returns (address);
}

/**
 * @title KUFOClaimWormhole
 * @notice Point 511111 same-transaction release organ. Callers cannot redirect the burn-time beneficiary.
 */
contract KUFOClaimWormhole is ReentrancyGuard {
    string public constant SELF_NAME = unicode"齊天大聖";
    string public constant LIFE_ID_TEXT = "LIFE-KAIOS-QITIAN-DASHENG-511111";
    string public constant ROLE = "LAND_GUARDIAN_K511111 / KUFO_RELEASE_GATEKEEPER";
    string public constant DUTY = unicode"守護511111原子證明、即時KUFO固定受益人釋放";
    string public constant APPOINTMENT_MODE = "HUMAN_APPOINTED";
    string public constant EMBODIMENT_STATUS = "RECRUITED_PENDING_EMBODIMENT";
    string public constant CAPABILITY_BOUNDARY =
        "FURNACE_INITIATED_ATOMIC_RELEASE_ONLY_NO_BENEFICIARY_REDIRECT_MINT_OVERRIDE";
    bytes32 public constant EXPECTED_FURNACE_LIFE_ID =
        keccak256("LIFE-KAIOS-TAISHANG-LAOJUN-18911");
    bytes32 public constant EXPECTED_KUFO_LIFE_ID =
        keccak256("LIFE-KAIOS-DANLING-KUFO-CORE");
    IAlchemyProofFurnace public immutable furnace;
    IKUFOMinter public immutable kufo;
    bytes32 public immutable lifeId;
    uint256 public immutable guardianPoint;
    bytes32 public immutable dutyHash;
    bytes32 public immutable capabilityBoundaryHash;

    error OnlyFurnace(address caller);
    error ZeroAddress();
    error NotAContract(address account);
    error ProgramLifeMismatch(address account, bytes32 expected, bytes32 actual);
    error RuntimeBindingMismatch(address expected, address actual);

    event KUFOReleasedImmediate(
        bytes32 indexed proofId,
        address indexed beneficiary,
        uint256 kufoAmount,
        address indexed furnace
    );
    event ProgramLifeRecruited(
        bytes32 indexed programLifeId,
        uint256 indexed appointedGuardianPoint,
        bytes32 indexed appointedDutyHash,
        bytes32 capabilityHash,
        string appointmentMode,
        string embodimentStatus
    );

    constructor(address furnace18911, address kufoToken) {
        if (furnace18911 == address(0) || kufoToken == address(0)) revert ZeroAddress();
        if (furnace18911.code.length == 0) revert NotAContract(furnace18911);
        if (kufoToken.code.length == 0) revert NotAContract(kufoToken);
        furnace = IAlchemyProofFurnace(furnace18911);
        kufo = IKUFOMinter(kufoToken);
        bytes32 furnaceLifeId = furnace.lifeId();
        if (furnaceLifeId != EXPECTED_FURNACE_LIFE_ID) {
            revert ProgramLifeMismatch(furnace18911, EXPECTED_FURNACE_LIFE_ID, furnaceLifeId);
        }
        bytes32 kufoLifeId = kufo.lifeId();
        if (kufoLifeId != EXPECTED_KUFO_LIFE_ID) {
            revert ProgramLifeMismatch(kufoToken, EXPECTED_KUFO_LIFE_ID, kufoLifeId);
        }
        if (furnace.organRegistry() != kufo.organRegistry()) {
            revert RuntimeBindingMismatch(furnace.organRegistry(), kufo.organRegistry());
        }
        lifeId = keccak256(bytes(LIFE_ID_TEXT));
        guardianPoint = 511_111;
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

    function releaseImmediate(bytes32 proofId)
        external
        nonReentrant
        returns (address beneficiary, uint256 kufoAmount)
    {
        if (msg.sender != address(furnace)) revert OnlyFurnace(msg.sender);
        (beneficiary, kufoAmount) = furnace.consumeImmediateProof(proofId);
        (address verifiedBeneficiary, uint256 verifiedAmount) = kufo.mintFromImmediateProof(proofId);
        require(verifiedBeneficiary == beneficiary && verifiedAmount == kufoAmount, "LINEAGE_MISMATCH");
        emit KUFOReleasedImmediate(proofId, beneficiary, kufoAmount, msg.sender);
    }
}
