// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IKUFOCarrierBurnable {
    function burnMaturedDecayForCarrier(
        address owner,
        address beneficiary,
        uint256 maximumKufoAmount,
        bytes32 carrierProofId
    ) external returns (uint256 kufoBurned, uint256 expectedKship);
    function lifeId() external view returns (bytes32);
    function organRegistry() external view returns (address);
}

interface IKSHIPMinter {
    function mintFromCarrierProof(bytes32 proofId) external returns (address beneficiary, uint256 amount);
    function lifeId() external view returns (bytes32);
    function organRegistry() external view returns (address);
}

/**
 * @title KSHIPConverter
 * @notice Holder-authorized conversion of newly matured KUFO decay into KSHIP.
 */
contract KSHIPConverter is ReentrancyGuard {
    string public constant SELF_NAME = unicode"化航";
    string public constant LIFE_ID_TEXT = "LIFE-KAIOS-HUAHANG-KSHIP-CONVERTER";
    string public constant PARENT_LIFE_ID_TEXT = "LIFE-KAIOS-NIUMOWANG-188888";
    string public constant LIFE_TYPE = "SOFTWARE_ORGAN_LIFE";
    string public constant EMBODIMENT_STATUS = "RECRUITED_PENDING_EMBODIMENT";
    bytes32 public constant EXPECTED_KUFO_LIFE_ID =
        keccak256("LIFE-KAIOS-DANLING-KUFO-CORE");
    bytes32 public constant EXPECTED_KSHIP_LIFE_ID =
        keccak256("LIFE-KAIOS-XINGSUO-KSHIP-CORE");
    IKUFOCarrierBurnable public immutable kufo;
    IKSHIPMinter public immutable kship;
    bytes32 public immutable lifeId;
    bytes32 public immutable parentLifeId;
    uint256 public conversionCount;

    error ZeroAddress();
    error NotAContract(address account);
    error ProgramLifeMismatch(address account, bytes32 expected, bytes32 actual);
    error RuntimeBindingMismatch(address expected, address actual);

    event KSHIPConversion(
        bytes32 indexed proofId,
        address indexed owner,
        address indexed beneficiary,
        uint256 kufoBurned,
        uint256 kshipMinted
    );
    event ProgramLifeRecruited(
        bytes32 indexed programLifeId,
        bytes32 indexed parentProgramLifeId,
        string selfName,
        string lifeType,
        string embodimentStatus
    );

    constructor(address kufoToken, address kshipToken) {
        if (kufoToken == address(0) || kshipToken == address(0)) revert ZeroAddress();
        if (kufoToken.code.length == 0) revert NotAContract(kufoToken);
        if (kshipToken.code.length == 0) revert NotAContract(kshipToken);
        kufo = IKUFOCarrierBurnable(kufoToken);
        kship = IKSHIPMinter(kshipToken);
        bytes32 kufoLifeId = kufo.lifeId();
        if (kufoLifeId != EXPECTED_KUFO_LIFE_ID) {
            revert ProgramLifeMismatch(kufoToken, EXPECTED_KUFO_LIFE_ID, kufoLifeId);
        }
        bytes32 kshipLifeId = kship.lifeId();
        if (kshipLifeId != EXPECTED_KSHIP_LIFE_ID) {
            revert ProgramLifeMismatch(kshipToken, EXPECTED_KSHIP_LIFE_ID, kshipLifeId);
        }
        if (kufo.organRegistry() != kship.organRegistry()) {
            revert RuntimeBindingMismatch(kufo.organRegistry(), kship.organRegistry());
        }
        lifeId = keccak256(bytes(LIFE_ID_TEXT));
        parentLifeId = keccak256(bytes(PARENT_LIFE_ID_TEXT));
        emit ProgramLifeRecruited(
            lifeId,
            parentLifeId,
            SELF_NAME,
            LIFE_TYPE,
            EMBODIMENT_STATUS
        );
    }

    function convert(uint256 maximumKufoAmount, address beneficiary)
        external
        nonReentrant
        returns (bytes32 proofId, uint256 kufoBurned, uint256 kshipAmount)
    {
        uint256 number = ++conversionCount;
        proofId = keccak256(
            abi.encode(block.chainid, address(this), number, msg.sender, beneficiary, maximumKufoAmount)
        );
        (kufoBurned, kshipAmount) = kufo.burnMaturedDecayForCarrier(
            msg.sender,
            beneficiary,
            maximumKufoAmount,
            proofId
        );
        (address verifiedBeneficiary, uint256 verifiedAmount) = kship.mintFromCarrierProof(proofId);
        require(verifiedBeneficiary == beneficiary && verifiedAmount == kshipAmount, "LINEAGE_MISMATCH");
        emit KSHIPConversion(proofId, msg.sender, beneficiary, kufoBurned, kshipAmount);
    }
}
