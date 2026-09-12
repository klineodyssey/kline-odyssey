// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @dev Deliberately lacks IERC1822Proxiable.proxiableUUID().
contract MockNonUUPS {
    function version() external pure returns (string memory) {
        return "MALICIOUS_NON_UUPS";
    }
}
