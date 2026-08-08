// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IAlchemyProofFurnace {
    function consumeMaturedProof(bytes32 proofId)
        external
        returns (address beneficiary, uint256 kufoAmount);
}

interface IKUFOMinter {
    function mintFromMaturedProof(bytes32 proofId) external returns (address beneficiary, uint256 amount);
}

/**
 * @title KUFOClaimWormhole
 * @notice Point 511111 claim organ. Callers cannot redirect the burn-time beneficiary.
 */
contract KUFOClaimWormhole {
    IAlchemyProofFurnace public immutable furnace;
    IKUFOMinter public immutable kufo;

    event KUFOClaimed(bytes32 indexed proofId, address indexed beneficiary, uint256 kufoAmount, address indexed caller);

    constructor(address furnace18911, address kufoToken) {
        require(furnace18911 != address(0) && kufoToken != address(0), "ZERO_ADDRESS");
        furnace = IAlchemyProofFurnace(furnace18911);
        kufo = IKUFOMinter(kufoToken);
    }

    function claim(bytes32 proofId) external returns (address beneficiary, uint256 kufoAmount) {
        (beneficiary, kufoAmount) = furnace.consumeMaturedProof(proofId);
        (address verifiedBeneficiary, uint256 verifiedAmount) = kufo.mintFromMaturedProof(proofId);
        require(verifiedBeneficiary == beneficiary && verifiedAmount == kufoAmount, "LINEAGE_MISMATCH");
        emit KUFOClaimed(proofId, beneficiary, kufoAmount, msg.sender);
    }
}
