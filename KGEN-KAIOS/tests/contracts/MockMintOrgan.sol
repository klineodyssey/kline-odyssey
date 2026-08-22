// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IMockKUFO {
    function mintFromImmediateProof(bytes32 proofId) external returns (address, uint256);
}

interface IMockKSHIP {
    function mintFromCarrierProof(bytes32 proofId) external returns (address, uint256);
}

contract MockMintOrgan {
    function attemptKufoMint(address kufo, bytes32 proofId) external {
        IMockKUFO(kufo).mintFromImmediateProof(proofId);
    }

    function attemptKshipMint(address kship, bytes32 proofId) external {
        IMockKSHIP(kship).mintFromCarrierProof(proofId);
    }
}
