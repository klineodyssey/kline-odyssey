// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Test-only dust fragmentation harness. It is not a deployable KAIOS organ.
 */
contract KUFOFragmentationHarness {
    function fragmentAndReturn(address token, uint256 count) external {
        for (uint256 index = 0; index < count; ++index) {
            require(IERC20(token).transferFrom(msg.sender, address(this), 1), "PULL_FAILED");
        }
        for (uint256 index = 0; index < count; ++index) {
            require(IERC20(token).transfer(msg.sender, 1), "RETURN_FAILED");
        }
    }
}
