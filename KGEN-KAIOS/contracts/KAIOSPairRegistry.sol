// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KAIOSPairRegistry
 * @notice Governance metadata for external AMM pairs. It has no token-transfer authority.
 */
contract KAIOSPairRegistry is Ownable2Step {
    struct PairRecord {
        address tokenA;
        address tokenB;
        address pair;
        bytes32 venue;
        bool active;
    }

    mapping(bytes32 => PairRecord) private _pairs;

    error ZeroAddress();
    error NotAContract(address account);
    error InvalidPair();

    event PairRegistered(
        bytes32 indexed pairId,
        address indexed tokenA,
        address indexed tokenB,
        address pair,
        bytes32 venue
    );
    event PairStatusUpdated(bytes32 indexed pairId, bool active);

    constructor(address initialOwner) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
    }

    function registerPair(address tokenA, address tokenB, address pairAddress, bytes32 venue)
        external
        onlyOwner
        returns (bytes32 pairId)
    {
        if (tokenA == address(0) || tokenB == address(0) || pairAddress == address(0)) revert ZeroAddress();
        if (tokenA == tokenB) revert InvalidPair();
        if (pairAddress.code.length == 0) revert NotAContract(pairAddress);
        (address first, address second) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        pairId = keccak256(abi.encode(first, second, pairAddress, venue));
        _pairs[pairId] = PairRecord(first, second, pairAddress, venue, true);
        emit PairRegistered(pairId, first, second, pairAddress, venue);
    }

    function setPairActive(bytes32 pairId, bool active) external onlyOwner {
        if (_pairs[pairId].pair == address(0)) revert InvalidPair();
        _pairs[pairId].active = active;
        emit PairStatusUpdated(pairId, active);
    }

    function pair(bytes32 pairId) external view returns (PairRecord memory) {
        return _pairs[pairId];
    }
}
