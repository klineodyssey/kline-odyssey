// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAlchemyFurnaceV4OutputSource {
    function consumeImmediateProof(bytes32 proofId) external returns (address beneficiary, uint256 kufoAmount);
}

interface IKUFOV4Minter {
    function mintFromImmediateProof(bytes32 proofId, address beneficiary, uint256 amount) external returns (uint256 lotId);
}

/**
 * @title KUFOOutputJindouyun168888V4
 * @notice K168888 筋斗雲: fixed-beneficiary immediate KUFO outlet for K18911.
 * @dev It cannot change beneficiary or amount and it holds no user assets.
 */
contract KUFOOutputJindouyun168888V4 is ReentrancyGuard {
    uint256 public constant OUTPUT_POINT = 168_888;
    uint256 public constant SOURCE_FURNACE_POINT = 18_911;
    uint256 public constant TOKEN_POINT = 511_111;

    IAlchemyFurnaceV4OutputSource public immutable furnace;
    IKUFOV4Minter public immutable kufo;

    error ZeroAddress();
    error OnlyFurnace(address caller);

    event KUFOReleased(bytes32 indexed proofId, address indexed beneficiary, uint256 kufoAmount, uint256 indexed lotId);

    constructor(address furnace18911, address kufoToken511111) {
        if (furnace18911 == address(0) || kufoToken511111 == address(0)) revert ZeroAddress();
        furnace = IAlchemyFurnaceV4OutputSource(furnace18911);
        kufo = IKUFOV4Minter(kufoToken511111);
    }

    function releaseImmediate(bytes32 proofId) external nonReentrant returns (address beneficiary, uint256 kufoAmount) {
        if (msg.sender != address(furnace)) revert OnlyFurnace(msg.sender);
        (beneficiary, kufoAmount) = furnace.consumeImmediateProof(proofId);
        uint256 lotId = kufo.mintFromImmediateProof(proofId, beneficiary, kufoAmount);
        emit KUFOReleased(proofId, beneficiary, kufoAmount, lotId);
    }
}
