// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IKUFOCarrierBurnable {
    function burnForCarrier(
        address owner,
        address beneficiary,
        uint256 kufoAmount,
        bytes32 carrierProofId
    ) external returns (uint256 expectedKship);
}

interface IKSHIPMinter {
    function mintFromCarrierProof(bytes32 proofId) external returns (address beneficiary, uint256 amount);
}

/**
 * @title KSHIPConverter
 * @notice Holder-authorized KUFO burn to KSHIP carrier accounting conversion.
 */
contract KSHIPConverter {
    IKUFOCarrierBurnable public immutable kufo;
    IKSHIPMinter public immutable kship;
    uint256 public conversionCount;

    event KSHIPConversion(
        bytes32 indexed proofId,
        address indexed owner,
        address indexed beneficiary,
        uint256 kufoBurned,
        uint256 kshipMinted
    );

    constructor(address kufoToken, address kshipToken) {
        require(kufoToken != address(0) && kshipToken != address(0), "ZERO_ADDRESS");
        kufo = IKUFOCarrierBurnable(kufoToken);
        kship = IKSHIPMinter(kshipToken);
    }

    function convert(uint256 kufoAmount, address beneficiary)
        external
        returns (bytes32 proofId, uint256 kshipAmount)
    {
        uint256 number = ++conversionCount;
        proofId = keccak256(
            abi.encode(block.chainid, address(this), number, msg.sender, beneficiary, kufoAmount)
        );
        kshipAmount = kufo.burnForCarrier(msg.sender, beneficiary, kufoAmount, proofId);
        (address verifiedBeneficiary, uint256 verifiedAmount) = kship.mintFromCarrierProof(proofId);
        require(verifiedBeneficiary == beneficiary && verifiedAmount == kshipAmount, "LINEAGE_MISMATCH");
        emit KSHIPConversion(proofId, msg.sender, beneficiary, kufoAmount, kshipAmount);
    }
}
