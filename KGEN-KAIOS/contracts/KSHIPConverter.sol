// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
// Engineering revision 2026-11-13: original PR637 9dc02605 / integrated main33967045.
// Exact build commit, source hashes and deployment gates: KAIOS_18911_KUFO_THREE_AUTUMNS_V4.md.
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IKUFOCarrierBurnable {
    struct CarrierBurnRecord {
        address owner;
        address beneficiary;
        address converter;
        uint256 kufoBurned;
        uint256 expectedKship;
    }
    function organRegistry() external view returns (address);
    function carrierBurnRecord(bytes32 proofId) external view returns (CarrierBurnRecord memory);
    function burnForCarrier(address owner, address beneficiary, uint256 amount, bytes32 proofId) external returns (uint256 expectedKship);
    function burnForCarrierGroups(address owner, address beneficiary, uint256 amount, bytes32 proofId, uint256[] calldata groupIds)
        external returns (uint256 expectedKship);
}
interface IKSHIPMinter {
    function kufo() external view returns (address);
    function organRegistry() external view returns (address);
    function totalSupply() external view returns (uint256);
    function totalMintedFromKufo() external view returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function carrierProofMinted(bytes32 proofId) external view returns (bool);
    function mintFromCarrierProof(bytes32 proofId) external returns (address beneficiary, uint256 amount);
}

/** @title KSHIPConverter
 * @notice Holder-authorized KUFO conversion, including selected immutable birth groups.
 * @dev Every conversion consumes the holder's KUFO allowance to this converter.
 */
contract KSHIPConverter is ReentrancyGuard {
    uint256 private constant KSHIP_PER_KUFO = 1_000;
    struct MintBaseline {
        uint256 supply;
        uint256 totalMinted;
        uint256 beneficiaryBalance;
    }
    IKUFOCarrierBurnable public immutable kufo;
    IKSHIPMinter public immutable kship;
    uint256 public conversionCount;
    error NotAContract(address account);
    error CanonicalBindingMismatch();
    error InvalidCarrierBurnRecord(bytes32 proofId);
    error CanonicalKshipReleaseMissing(bytes32 proofId);
    error KshipProofAlreadyUsed(bytes32 proofId);
    event KSHIPConversion(bytes32 indexed proofId, address indexed owner, address indexed beneficiary, uint256 kufoBurned, uint256 kshipMinted);
    constructor(address kufoToken, address kshipToken) {
        require(kufoToken != address(0) && kshipToken != address(0), "ZERO_ADDRESS");
        if (kufoToken.code.length == 0) revert NotAContract(kufoToken);
        if (kshipToken.code.length == 0) revert NotAContract(kshipToken);
        IKUFOCarrierBurnable source = IKUFOCarrierBurnable(kufoToken);
        IKSHIPMinter target = IKSHIPMinter(kshipToken);
        address registry = source.organRegistry();
        if (target.kufo() != kufoToken || registry == address(0) ||
            target.organRegistry() != registry) revert CanonicalBindingMismatch();
        kufo = source;
        kship = target;
    }
    function convert(uint256 amount, address beneficiary) external nonReentrant returns (bytes32 proofId, uint256 kshipAmount) {
        proofId = _nextProof(amount, beneficiary);
        MintBaseline memory before = _snapshot(proofId, beneficiary);
        kshipAmount = kufo.burnForCarrier(msg.sender, beneficiary, amount, proofId);
        _mintAndVerify(proofId, beneficiary, amount, kshipAmount, before);
    }
    function convertGroups(uint256 amount, address beneficiary, uint256[] calldata groupIds)
        external nonReentrant returns (bytes32 proofId, uint256 kshipAmount)
    {
        proofId = _nextProof(amount, beneficiary);
        MintBaseline memory before = _snapshot(proofId, beneficiary);
        kshipAmount = kufo.burnForCarrierGroups(msg.sender, beneficiary, amount, proofId, groupIds);
        _mintAndVerify(proofId, beneficiary, amount, kshipAmount, before);
    }
    function _nextProof(uint256 amount, address beneficiary) private returns (bytes32) {
        uint256 number = ++conversionCount;
        return keccak256(abi.encode(block.chainid, address(this), number, msg.sender, beneficiary, amount));
    }
    function _snapshot(bytes32 proofId, address beneficiary) private view returns (MintBaseline memory before) {
        if (kship.carrierProofMinted(proofId)) revert KshipProofAlreadyUsed(proofId);
        before = MintBaseline(kship.totalSupply(), kship.totalMintedFromKufo(), kship.balanceOf(beneficiary));
    }
    function _mintAndVerify(bytes32 proofId, address beneficiary, uint256 burned, uint256 expected, MintBaseline memory before) private {
        IKUFOCarrierBurnable.CarrierBurnRecord memory record = kufo.carrierBurnRecord(proofId);
        if (record.owner != msg.sender || record.beneficiary != beneficiary || record.converter != address(this) ||
            record.kufoBurned != burned || record.expectedKship != burned * KSHIP_PER_KUFO ||
            expected != record.expectedKship) revert InvalidCarrierBurnRecord(proofId);
        (address verifiedBeneficiary, uint256 verifiedAmount) = kship.mintFromCarrierProof(proofId);
        require(verifiedBeneficiary == beneficiary && verifiedAmount == expected, "LINEAGE_MISMATCH");
        if (!kship.carrierProofMinted(proofId) || kship.totalSupply() != before.supply + expected ||
            kship.totalMintedFromKufo() != before.totalMinted + expected ||
            kship.balanceOf(beneficiary) != before.beneficiaryBalance + expected) revert CanonicalKshipReleaseMissing(proofId);
        emit KSHIPConversion(proofId, msg.sender, beneficiary, burned, expected);
    }
}
