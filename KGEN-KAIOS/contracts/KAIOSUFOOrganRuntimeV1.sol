// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

interface IKAIOSShipIdentityRead {
    struct ShipIdentity {
        bytes32 shipId;
        address controller;
        address tradingEngine;
        address reactor;
        uint64 registeredAt;
        bool active;
    }

    function ship(bytes32 shipId) external view returns (ShipIdentity memory);
}

/**
 * @title KAIOSUFOOrganRuntimeV1
 * @notice Read-only organ projection for one authenticated KAIOS UFO.
 * @dev This runtime does not own assets and cannot replace organ implementations.
 *      It reads the canonical organ registry and ship identity registry and exposes
 *      a fail-closed readiness view for apps and the UFO life runtime.
 */
contract KAIOSUFOOrganRuntimeV1 {
    string public constant VERSION = "1.0.0";
    bytes32 public constant VERSION_ID = keccak256("KAIOS.UFO.ORGAN_RUNTIME.V1.0.0");

    bytes32 public constant ORGAN_TRADING_ENGINE = keccak256("KAIOS.ORGAN.UFO.TRADING_ENGINE");
    bytes32 public constant ORGAN_WHITE_HOLE_MATTER = keccak256("KAIOS.ORGAN.K108000.POSITIVE_MATTER_SOURCE");
    bytes32 public constant ORGAN_K108000_REACTOR = keccak256("KAIOS.ORGAN.K108000.MASS_ENERGY_REACTOR");
    bytes32 public constant ORGAN_KSHIP = keccak256("KAIOS.ORGAN.KSHIP.TOKEN");
    bytes32 public constant ORGAN_KGOD = keccak256("KAIOS.ORGAN.KGOD.TOKEN");
    bytes32 public constant ORGAN_ATM_BANK = keccak256("KAIOS.ORGAN.K8888.MOBILE_ATM_BANK");
    bytes32 public constant ORGAN_NAVIGATION = keccak256("KAIOS.ORGAN.UFO.NAVIGATION");

    IKAIOSOrganRegistry public immutable organRegistry;
    IKAIOSShipIdentityRead public immutable shipIdentity;
    bytes32 public immutable shipId;

    error ZeroAddress();
    error ZeroShipId();

    constructor(address registry, address shipIdentityRegistry, bytes32 ufoShipId) {
        if (registry == address(0) || shipIdentityRegistry == address(0)) revert ZeroAddress();
        if (ufoShipId == bytes32(0)) revert ZeroShipId();
        organRegistry = IKAIOSOrganRegistry(registry);
        shipIdentity = IKAIOSShipIdentityRead(shipIdentityRegistry);
        shipId = ufoShipId;
    }

    function controller() external view returns (address) {
        return shipIdentity.ship(shipId).controller;
    }

    function organ(bytes32 organId) public view returns (address) {
        return organRegistry.organ(organId);
    }

    function criticalOrgansBound() public view returns (bool) {
        IKAIOSShipIdentityRead.ShipIdentity memory currentShip = shipIdentity.ship(shipId);
        return _criticalOrgansBound(currentShip);
    }

    function _criticalOrgansBound(IKAIOSShipIdentityRead.ShipIdentity memory currentShip)
        private
        view
        returns (bool)
    {
        return currentShip.tradingEngine != address(0)
            && currentShip.reactor != address(0)
            && organ(ORGAN_TRADING_ENGINE) == currentShip.tradingEngine
            && organ(ORGAN_WHITE_HOLE_MATTER) != address(0)
            && organ(ORGAN_K108000_REACTOR) == currentShip.reactor
            && organ(ORGAN_KSHIP) != address(0)
            && organ(ORGAN_NAVIGATION) != address(0);
    }

    function readyForFlight() external view returns (bool) {
        IKAIOSShipIdentityRead.ShipIdentity memory currentShip = shipIdentity.ship(shipId);
        return currentShip.active
            && currentShip.controller != address(0)
            && _criticalOrgansBound(currentShip);
    }

    function readyForCogeneration() external view returns (bool) {
        IKAIOSShipIdentityRead.ShipIdentity memory currentShip = shipIdentity.ship(shipId);
        return currentShip.active
            && currentShip.controller != address(0)
            && _criticalOrgansBound(currentShip)
            && organ(ORGAN_KGOD) != address(0);
    }

    function readyForMobileATM() external view returns (bool) {
        IKAIOSShipIdentityRead.ShipIdentity memory currentShip = shipIdentity.ship(shipId);
        return currentShip.active
            && currentShip.controller != address(0)
            && organ(ORGAN_ATM_BANK) != address(0);
    }
}
