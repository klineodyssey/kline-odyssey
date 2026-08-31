// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAlchemyProofFurnaceV4 {
    function consumeImmediateProof(bytes32 proofId)
        external
        returns (address beneficiary, uint256 kufoAmount);
}

interface IKUFOMinterV4 {
    function mintFromImmediateProof(bytes32 proofId, address beneficiary, uint256 amount)
        external;
}

/**
 * @title KUFOClaimWormholeV4
 * @notice K511111 successor candidate. It releases one already-bound K18911 proof exactly once.
 */
contract KUFOClaimWormholeV4 is ReentrancyGuard {
    IAlchemyProofFurnaceV4 public immutable furnace;
    IKUFOMinterV4 public immutable kufo;

    error ZeroAddress();
    error OnlyFurnace(address caller);

    event KUFOReleased(
        bytes32 indexed proofId,
        address indexed beneficiary,
        uint256 kufoAmount,
        bytes32 indexed outputPoint
    );

    bytes32 public constant OUTPUT_POINT_168888 = keccak256("KAIOS.POINT.168888.KUFO.OUTLET");

    constructor(address furnace18911, address kufoToken) {
        if (furnace18911 == address(0) || kufoToken == address(0)) revert ZeroAddress();
        furnace = IAlchemyProofFurnaceV4(furnace18911);
        kufo = IKUFOMinterV4(kufoToken);
    }

    function releaseImmediate(bytes32 proofId)
        external
        nonReentrant
        returns (address beneficiary, uint256 kufoAmount)
    {
        if (msg.sender != address(furnace)) revert OnlyFurnace(msg.sender);
        (beneficiary, kufoAmount) = furnace.consumeImmediateProof(proofId);
        kufo.mintFromImmediateProof(proofId, beneficiary, kufoAmount);
        emit KUFOReleased(proofId, beneficiary, kufoAmount, OUTPUT_POINT_168888);
    }
}
