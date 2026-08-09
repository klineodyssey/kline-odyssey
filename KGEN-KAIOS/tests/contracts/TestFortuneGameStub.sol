// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface ITempleHeartGamePayout {
    function gamePayout(address player, uint256 amount) external;
}

/// @notice Minimal testnet-only caller stub for TempleHeart `gamePayout`.
contract TestFortuneGameStub {
    function payout(address heart, address player, uint256 amount) external {
        ITempleHeartGamePayout(heart).gamePayout(player, amount);
    }
}
