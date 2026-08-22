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
    string public constant SELF_NAME = unicode"試航童子";
    string public constant LIFE_ID_TEXT = "LIFE-KAIOS-SHIHANG-TONGZI-TEST-0001";
    string public constant LIFE_TYPE = "TEST_LIFE";
    string public constant EMBODIMENT_STATUS = "TEST_ONLY_NON_DEPLOYABLE";
    bool public constant DEPLOYABLE = false;
    bool public constant EMPLOYABLE = false;
    bytes32 public constant LIFE_ID = keccak256(bytes(LIFE_ID_TEXT));

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
