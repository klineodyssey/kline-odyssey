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

contract MockKAIOSForTreasury is ERC20 {
    address public immutable KGEN;
    address public immutable LINGXIAO_TREASURY_18888;

    constructor(address canonicalKgen, address treasury18888)
        ERC20("Mock KAIOS", "mKAIOS")
    {
        KGEN = canonicalKgen;
        LINGXIAO_TREASURY_18888 = treasury18888;
    }

    function mintToTreasury(uint256 amount) external {
        _mint(LINGXIAO_TREASURY_18888, amount);
    }
}
