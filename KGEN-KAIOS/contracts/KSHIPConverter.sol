// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
// Engineering revision 2026-11-13: original PR637 9dc02605 / integrated main33967045.
// Exact build commit, source hashes and deployment gates: KAIOS_18911_KUFO_THREE_AUTUMNS_V4.md.
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IKUFOCarrierBurnable {
    function burnForCarrier(address owner, address beneficiary, uint256 amount, bytes32 proofId) external returns (uint256 expectedKship);
    function burnForCarrierGroups(address owner, address beneficiary, uint256 amount, bytes32 proofId, uint256[] calldata groupIds)
        external returns (uint256 expectedKship);
}
interface IKSHIPMinter {
    function mintFromCarrierProof(bytes32 proofId) external returns (address beneficiary, uint256 amount);
}

/** @title KSHIPConverter
 * @notice Holder-authorized KUFO conversion, including selected immutable birth groups.
 * @dev Every conversion consumes the holder's KUFO allowance to this converter.
 */
contract KSHIPConverter is ReentrancyGuard {
    IKUFOCarrierBurnable public immutable kufo;
    IKSHIPMinter public immutable kship;
    uint256 public conversionCount;
    event KSHIPConversion(bytes32 indexed proofId, address indexed owner, address indexed beneficiary, uint256 kufoBurned, uint256 kshipMinted);
    constructor(address kufoToken, address kshipToken) {
        require(kufoToken != address(0) && kshipToken != address(0), "ZERO_ADDRESS");
        kufo = IKUFOCarrierBurnable(kufoToken);
        kship = IKSHIPMinter(kshipToken);
    }
    function convert(uint256 amount, address beneficiary) external nonReentrant returns (bytes32 proofId, uint256 kshipAmount) {
        proofId = _nextProof(amount, beneficiary);
        kshipAmount = kufo.burnForCarrier(msg.sender, beneficiary, amount, proofId);
        _mintAndVerify(proofId, beneficiary, amount, kshipAmount);
    }
    function convertGroups(uint256 amount, address beneficiary, uint256[] calldata groupIds)
        external nonReentrant returns (bytes32 proofId, uint256 kshipAmount)
    {
        proofId = _nextProof(amount, beneficiary);
        kshipAmount = kufo.burnForCarrierGroups(msg.sender, beneficiary, amount, proofId, groupIds);
        _mintAndVerify(proofId, beneficiary, amount, kshipAmount);
    }
    function _nextProof(uint256 amount, address beneficiary) private returns (bytes32) {
        uint256 number = ++conversionCount;
        return keccak256(abi.encode(block.chainid, address(this), number, msg.sender, beneficiary, amount));
    }
    function _mintAndVerify(bytes32 proofId, address beneficiary, uint256 burned, uint256 expected) private {
        (address verifiedBeneficiary, uint256 verifiedAmount) = kship.mintFromCarrierProof(proofId);
        require(verifiedBeneficiary == beneficiary && verifiedAmount == expected, "LINEAGE_MISMATCH");
        emit KSHIPConversion(proofId, msg.sender, beneficiary, burned, expected);
    }
}
