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
