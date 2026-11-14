// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
// Engineering revision 2026-11-13: original PR637 9dc02605 / integrated main33967045.
// Exact build commit, source hashes and deployment gates: KAIOS_18911_KUFO_THREE_AUTUMNS_V4.md.
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAlchemyFurnaceOutputSource {
    function consumeImmediateProof(bytes32 proofId) external returns (address beneficiary, uint256 amount);
}
interface IKUFOMinter {
    function mintFromImmediateProof(bytes32 proofId, address beneficiary, uint256 amount) external returns (uint256 groupId);
}

/** @title KUFOOutputJindouyun168888
 * @notice Fixed-beneficiary immediate KUFO outlet; it holds no user assets.
 */
contract KUFOOutputJindouyun168888 is ReentrancyGuard {
    uint256 public constant OUTPUT_POINT = 168_888;
    uint256 public constant SOURCE_FURNACE_POINT = 18_911;
    uint256 public constant TOKEN_POINT = 18_911;
    IAlchemyFurnaceOutputSource public immutable furnace;
    IKUFOMinter public immutable kufo;
    error ZeroAddress();
    error OnlyFurnace(address caller);
    event KUFOReleased(bytes32 indexed proofId, address indexed beneficiary, uint256 amount, uint256 indexed groupId);
    constructor(address furnace18911, address kufoToken) {
        if (furnace18911 == address(0) || kufoToken == address(0)) revert ZeroAddress();
        furnace = IAlchemyFurnaceOutputSource(furnace18911);
        kufo = IKUFOMinter(kufoToken);
    }
    function releaseImmediate(bytes32 proofId) external nonReentrant returns (address beneficiary, uint256 amount) {
        if (msg.sender != address(furnace)) revert OnlyFurnace(msg.sender);
        (beneficiary, amount) = furnace.consumeImmediateProof(proofId);
        uint256 groupId = kufo.mintFromImmediateProof(proofId, beneficiary, amount);
        emit KUFOReleased(proofId, beneficiary, amount, groupId);
    }
}
