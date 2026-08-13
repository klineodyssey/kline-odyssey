// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface ICelestialEligibility {
    function canonicalBeneficiary(bytes32 lifeId) external view returns (address);
    function redemptionEligible(bytes32 lifeId) external view returns (bool);
    function civilizationQualified(bytes32 lifeId) external view returns (bool);
}
