// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title KAIOSShipIdentityRegistryV1
 * @notice Minimal immutable-lineage registry for unique KUFO/UFO ship identities.
 * @dev The registrar may register or deactivate ships; it cannot spend ship assets.
 *      Each ship binds one controller, one trading engine and one K108000 reactor endpoint.
 */
contract KAIOSShipIdentityRegistryV1 {
    string public constant VERSION = "1.0.0";
    bytes32 public constant VERSION_ID = keccak256("KAIOS.SHIP.IDENTITY.REGISTRY.V1.0.0");

    struct ShipIdentity {
        bytes32 shipId;
        address controller;
        address tradingEngine;
        address reactor;
        uint64 registeredAt;
        bool active;
    }

    address public immutable registrar;
    mapping(bytes32 => ShipIdentity) private _ships;

    error OnlyRegistrar(address caller);
    error ZeroAddress();
    error ZeroShipId();
    error ShipAlreadyRegistered(bytes32 shipId);
    error UnknownShip(bytes32 shipId);

    event ShipRegistered(bytes32 indexed shipId, address indexed controller, address indexed tradingEngine, address reactor);
    event ShipStatusChanged(bytes32 indexed shipId, bool active);

    constructor(address registrar_) {
        if (registrar_ == address(0)) revert ZeroAddress();
        registrar = registrar_;
    }

    function registerShip(bytes32 shipId, address controller, address tradingEngine, address reactor) external {
        if (msg.sender != registrar) revert OnlyRegistrar(msg.sender);
        if (shipId == bytes32(0)) revert ZeroShipId();
        if (controller == address(0) || tradingEngine == address(0) || reactor == address(0)) revert ZeroAddress();
        if (_ships[shipId].registeredAt != 0) revert ShipAlreadyRegistered(shipId);

        _ships[shipId] = ShipIdentity(shipId, controller, tradingEngine, reactor, uint64(block.timestamp), true);
        emit ShipRegistered(shipId, controller, tradingEngine, reactor);
    }

    function setShipActive(bytes32 shipId, bool active) external {
        if (msg.sender != registrar) revert OnlyRegistrar(msg.sender);
        ShipIdentity storage ship = _ships[shipId];
        if (ship.registeredAt == 0) revert UnknownShip(shipId);
        ship.active = active;
        emit ShipStatusChanged(shipId, active);
    }

    function ship(bytes32 shipId) external view returns (ShipIdentity memory) {
        ShipIdentity memory record = _ships[shipId];
        if (record.registeredAt == 0) revert UnknownShip(shipId);
        return record;
    }

    function isAuthorizedController(bytes32 shipId, address account) external view returns (bool) {
        ShipIdentity memory record = _ships[shipId];
        return record.active && record.controller == account;
    }

    function isAuthorizedTradingEngine(bytes32 shipId, address account) external view returns (bool) {
        ShipIdentity memory record = _ships[shipId];
        return record.active && record.tradingEngine == account;
    }

    function isAuthorizedReactor(bytes32 shipId, address account) external view returns (bool) {
        ShipIdentity memory record = _ships[shipId];
        return record.active && record.reactor == account;
    }
}
