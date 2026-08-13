// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IKAIOSAlchemyFurnaceProof {
    struct Proof {
        address owner;
        address beneficiary;
        uint256 kaiosBurned;
        uint256 kufoAmount;
        bytes32 lifeId;
        bytes32 destinationCode;
        uint64 burnEpoch;
        uint64 maturityEpoch;
        bool consumed;
    }

    function kaios() external view returns (address);
    function MATURATION_EPOCHS() external view returns (uint64);
    function currentEpoch() external view returns (uint64);
    function proof(bytes32 proofId) external view returns (Proof memory);
}
