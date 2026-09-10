// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAlchemyFurnaceOutputSource {
    function consumeImmediateProof(bytes32 proofId) external returns (address beneficiary, uint256 kufoAmount);
}

interface IKUFOMinter {
    function mintFromImmediateProof(bytes32 proofId, address beneficiary, uint256 amount) external returns (uint256 lotId);
}

/**
 * @title KUFOClaimWormhole
 * @notice K511111 蟲洞: fixed-beneficiary immediate KUFO birth outlet for K18911.
 * @dev It cannot change beneficiary or amount and it holds no user assets.
 */
contract KUFOClaimWormhole is ReentrancyGuard {
    string public constant VERSION = "4.0.0";
    bytes32 public constant VERSION_ID = keccak256("KAIOS.KUFO_CLAIM_WORMHOLE.V4.0.0");
    uint256 public constant OUTPUT_POINT = 511_111;
    uint256 public constant SOURCE_FURNACE_POINT = 18_911;
    uint256 public constant TOKEN_POINT = 511_111;

    IAlchemyFurnaceOutputSource public immutable furnace;
    IKUFOMinter public immutable kufo;

    error ZeroAddress();
    error OnlyFurnace(address caller);

    event KUFOReleased(bytes32 indexed proofId, address indexed beneficiary, uint256 kufoAmount, uint256 indexed lotId);

    constructor(address furnace18911, address kufoToken511111) {
        if (furnace18911 == address(0) || kufoToken511111 == address(0)) revert ZeroAddress();
        furnace = IAlchemyFurnaceOutputSource(furnace18911);
        kufo = IKUFOMinter(kufoToken511111);
    }

    function releaseImmediate(bytes32 proofId) external nonReentrant returns (address beneficiary, uint256 kufoAmount) {
        if (msg.sender != address(furnace)) revert OnlyFurnace(msg.sender);
        (beneficiary, kufoAmount) = furnace.consumeImmediateProof(proofId);
        uint256 lotId = kufo.mintFromImmediateProof(proofId, beneficiary, kufoAmount);
        emit KUFOReleased(proofId, beneficiary, kufoAmount, lotId);
    }
}
