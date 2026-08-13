// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface ILingxiaoCelestialBank18888 {
    function executeModulePayment(bytes32 paymentId, address beneficiary, uint256 amount) external;
    function synchronizeAccounting() external returns (uint256 newInflow);
    function setReserveRequirement(uint256 newReserve) external;
    function kgen() external view returns (address);
    function kaios() external view returns (address);
    function kaiosBalance() external view returns (uint256);
    function availableKaios() external view returns (uint256);
    function paused() external view returns (bool);
}
