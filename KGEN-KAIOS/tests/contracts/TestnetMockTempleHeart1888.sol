// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice TEST_MOCK_HEART used only for the BSC Testnet FortuneGame rehearsal.
/// @dev Models the TempleHeart 1888 survival gate without custody of a real token.
contract TestnetMockTempleHeart1888 {
    uint256 public constant SURVIVAL_GATE = 1_888 ether;

    address public immutable admin;
    address public fortuneGame;
    uint256 public mockBalance;
    mapping(address => uint256) public paid;

    error Unauthorized();
    error GameSurvivalGateClosed();

    constructor(address admin_, uint256 initialBalance_) {
        admin = admin_;
        mockBalance = initialBalance_;
    }

    function setFortuneGame(address game) external {
        if (msg.sender != admin) revert Unauthorized();
        fortuneGame = game;
    }

    function refill(uint256 amount) external {
        if (msg.sender != admin) revert Unauthorized();
        mockBalance += amount;
    }

    function isHeartGameOperational() external view returns (bool) {
        return mockBalance >= SURVIVAL_GATE;
    }

    function gamePayout(address player, uint256 amount) external {
        if (msg.sender != fortuneGame) revert Unauthorized();
        if (mockBalance < amount || mockBalance - amount < SURVIVAL_GATE) {
            revert GameSurvivalGateClosed();
        }
        mockBalance -= amount;
        paid[player] += amount;
    }
}
