// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockKGEN is ERC20 {
    uint256 public constant GENESIS_SUPPLY = 72_000_000 ether;

    constructor(address recipient) ERC20("Mock KGEN", "mKGEN") {
        _mint(recipient, GENESIS_SUPPLY);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}

// Explicit TEST legacy read source. Deployment scripts use this only on chain97
// or local EVM. Mainnet Heart requires the real immutable V3.2.6 address instead.
contract MockLegacyHeart {
    address public immutable kgen;
    address private immutable controller;
    mapping(address => uint256) private fortuneHistory;
    mapping(address => uint256) private heartbeatHistory;
    mapping(address => uint256) private igniteHistory;
    bool public failReads;
    error LegacyReadUnavailable();
    constructor(address token) { kgen = token; controller = msg.sender; }
    function setHistory(address user, uint256 fortune, uint256 heartbeat, uint256 ignite) external {
        require(msg.sender == controller);
        fortuneHistory[user] = fortune;
        heartbeatHistory[user] = heartbeat;
        igniteHistory[user] = ignite;
    }
    function setReadFailure(bool fail) external { require(msg.sender == controller); failReads = fail; }
    function lastFortuneAt(address user) external view returns (uint256) {
        if (failReads) revert LegacyReadUnavailable();
        return fortuneHistory[user];
    }
    function lastHeartbeatAt(address user) external view returns (uint256) {
        if (failReads) revert LegacyReadUnavailable();
        return heartbeatHistory[user];
    }
    function lastIgniteDay(address user) external view returns (uint256) {
        if (failReads) revert LegacyReadUnavailable();
        return igniteHistory[user];
    }
}

// TEST-only distinct claimant for bounded BSC97/local cap rehearsals. This is
// never a production wallet, proof signer, token or economic authority.
contract RehearsalActor {
    address public immutable controller = msg.sender;
    error ControllerOnly();
    error BatchLengthMismatch();
    function execute(address target, bytes calldata data) external returns (bytes memory) {
        if (msg.sender != controller) revert ControllerOnly();
        return _execute(target, data);
    }
    function executeBatch(address[] calldata targets, bytes[] calldata data) external {
        if (msg.sender != controller) revert ControllerOnly();
        if (targets.length != data.length) revert BatchLengthMismatch();
        for (uint256 i; i < targets.length; ++i) _execute(targets[i], data[i]);
    }
    function _execute(address target, bytes calldata data) private returns (bytes memory result) {
        bool ok;
        (ok, result) = target.call(data);
        if (!ok) assembly { revert(add(result, 32), mload(result)) }
    }
}

// Local adversarial test token only; never a deployment-package token.
contract ReentrantMockKGEN is MockKGEN {
    address public target;
    bytes public attackData;
    bool public attackRejected;
    bytes4 public attackError;
    bool private inCallback;

    constructor(address recipient) MockKGEN(recipient) {}

    function arm(address heart, bytes calldata data) external {
        target = heart;
        attackData = data;
    }

    function _update(address from, address to, uint256 amount) internal override {
        super._update(from, to, amount);
        if (target != address(0) && from == target && !inCallback) {
            inCallback = true;
            (bool ok, bytes memory result) = target.call(attackData);
            attackRejected = !ok;
            if (result.length >= 4) attackError = bytes4(result);
            inCallback = false;
        }
    }
}
