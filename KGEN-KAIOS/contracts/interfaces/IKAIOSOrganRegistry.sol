// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IKAIOSOrganRegistry {
    function organ(bytes32 organId) external view returns (address);
}
