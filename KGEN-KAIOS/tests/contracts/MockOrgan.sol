// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract MockOrgan {}

interface ITestTempleHeartGamePayout {
    function gamePayout(address player, uint256 amount) external;
}

contract TestFortuneGame {
    event TestGamePayout(address indexed heart, address indexed player, uint256 amount);

    function payout(address heart, address player, uint256 amount) external {
        ITestTempleHeartGamePayout(heart).gamePayout(player, amount);
        emit TestGamePayout(heart, player, amount);
    }
}
