// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockKGEN is ERC20 {
    uint256 public constant GENESIS_SUPPLY = 72_000_000 ether;
    uint256 public transferFee;

    constructor(address recipient) ERC20("Mock KGEN", "mKGEN") {
        _mint(recipient, GENESIS_SUPPLY);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function setTransferFee(uint256 amount) external {
        transferFee = amount;
    }

    function _update(address from, address to, uint256 value) internal override {
        uint256 fee = transferFee;
        if (fee != 0 && from != address(0) && to != address(0)) {
            require(value > fee, "FEE_TOO_LARGE");
            super._update(from, to, value - fee);
            super._update(from, address(0), fee);
            return;
        }
        super._update(from, to, value);
    }
}
