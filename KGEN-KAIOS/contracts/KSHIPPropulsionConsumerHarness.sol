// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IKSHIPPropulsion {
    function consumePropulsion(
        address holder,
        bytes32 ufoLifeId,
        bytes32 tripId,
        address beneficiary,
        uint256 amount
    ) external;
}

/**
 * @title KSHIPPropulsionConsumerHarness
 * @notice Review-only caller used to prove the Organ Registry propulsion boundary.
 * @dev This is not a UFO product, factory, canonical consumer or deployment candidate.
 */
contract KSHIPPropulsionConsumerHarness {
    function consume(
        address kship,
        address holder,
        bytes32 ufoLifeId,
        bytes32 tripId,
        address beneficiary,
        uint256 amount
    ) external {
        IKSHIPPropulsion(kship).consumePropulsion(
            holder,
            ufoLifeId,
            tripId,
            beneficiary,
            amount
        );
    }
}
