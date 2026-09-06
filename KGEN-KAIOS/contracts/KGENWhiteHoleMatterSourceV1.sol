// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IKAIOSShipIdentityReaderV1 {
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
 * @notice Adapter contract MUST attest only already-burned KGEN White-Hole AMM burn proofs.
 *         The 0.10% burn calculation belongs upstream in KGEN trade-tax/burn lineage and MUST NOT
 *         be applied a second time here.
 */
interface IKGENWhiteHoleBurnVerifierV1 {
    struct VerifiedBurn {
        bytes32 burnId;
        bytes32 tradeId;
        bytes32 pairId;
        address trader;
        uint256 burnedKgen;
        uint256 positiveMatterEquivalent;
        bool valid;
        bool ammTrade;
        bool selfMatch;
        bool washTrade;
    }
    function verifiedBurn(bytes32 burnId) external view returns (VerifiedBurn memory);
}

/**
 * @title KGENWhiteHoleMatterSourceV1
 * @notice Converts verified, irreversible KGEN White-Hole AMM burn receipts into non-transferable
 *         positive-matter credit owned by an authenticated ship ID.
 * @dev No KGEN is minted, restored, transferred or rescued here. A burn proof can be credited once.
 *      Only the authenticated ship reactor may consume that ship's credit. Invalid/self-match/wash
 *      receipts fail closed. `positiveMatterEquivalent` is supplied by the canonical burn verifier
 *      so this contract does not invent a KGEN<->KSHIP physical scale.
 */
contract KGENWhiteHoleMatterSourceV1 {
    string public constant VERSION = "1.0.0";
    bytes32 public constant VERSION_ID = keccak256("KAIOS.KGEN.WHITE_HOLE.MATTER_SOURCE.V1.0.0");

    IKGENWhiteHoleBurnVerifierV1 public immutable burnVerifier;
    IKAIOSShipIdentityReaderV1 public immutable shipRegistry;

    struct BurnCredit {
        bytes32 shipId;
        address trader;
        uint256 burnedKgen;
        uint256 creditedMatter;
        uint256 remainingMatter;
        uint64 claimedAt;
    }

    mapping(bytes32 => BurnCredit) private _burnCredits;
    mapping(bytes32 => uint256) public shipMatterBalance;
    mapping(bytes32 => uint256) public shipMatterConsumed;
    mapping(bytes32 => bool) public reactionMatterConsumed;

    error ZeroAddress();
    error ZeroShipId();
    error UnknownOrInactiveShip(bytes32 shipId);
    error UnauthorizedClaimant(address caller);
    error InvalidBurn(bytes32 burnId);
    error NonAmmBurn(bytes32 burnId);
    error SelfMatchBurn(bytes32 burnId);
    error WashTradeBurn(bytes32 burnId);
    error BurnAlreadyCredited(bytes32 burnId);
    error TraderNotShipBound(address trader);
    error OnlyShipReactor(address caller);
    error InsufficientMatter(uint256 available, uint256 required);
    error ReactionAlreadyConsumed(bytes32 reactionProofId);
    error ZeroAmount();

    event WhiteHoleMatterCredited(
        bytes32 indexed burnId,
        bytes32 indexed shipId,
        address indexed trader,
        uint256 burnedKgen,
        uint256 positiveMatterEquivalent
    );
    event WhiteHoleMatterConsumed(
        bytes32 indexed reactionProofId,
        bytes32 indexed shipId,
        uint256 positiveMatterConsumed
    );

    constructor(address verifier, address ships) {
        if (verifier == address(0) || ships == address(0)) revert ZeroAddress();
        burnVerifier = IKGENWhiteHoleBurnVerifierV1(verifier);
        shipRegistry = IKAIOSShipIdentityReaderV1(ships);
    }

    function claimBurnForShip(bytes32 burnId, bytes32 shipId) external returns (uint256 creditedMatter) {
        if (shipId == bytes32(0)) revert ZeroShipId();
        if (_burnCredits[burnId].claimedAt != 0) revert BurnAlreadyCredited(burnId);

        IKAIOSShipIdentityReaderV1.ShipIdentity memory ship = shipRegistry.ship(shipId);
        if (!ship.active) revert UnknownOrInactiveShip(shipId);
        if (msg.sender != ship.controller && msg.sender != ship.tradingEngine) revert UnauthorizedClaimant(msg.sender);

        IKGENWhiteHoleBurnVerifierV1.VerifiedBurn memory burn = burnVerifier.verifiedBurn(burnId);
        if (!burn.valid || burn.burnId != burnId || burn.burnedKgen == 0 || burn.positiveMatterEquivalent == 0) {
            revert InvalidBurn(burnId);
        }
        if (!burn.ammTrade) revert NonAmmBurn(burnId);
        if (burn.selfMatch) revert SelfMatchBurn(burnId);
        if (burn.washTrade) revert WashTradeBurn(burnId);
        if (burn.trader != ship.controller && burn.trader != ship.tradingEngine) revert TraderNotShipBound(burn.trader);

        creditedMatter = burn.positiveMatterEquivalent;
        _burnCredits[burnId] = BurnCredit(
            shipId,
            burn.trader,
            burn.burnedKgen,
            creditedMatter,
            creditedMatter,
            uint64(block.timestamp)
        );
        shipMatterBalance[shipId] += creditedMatter;

        emit WhiteHoleMatterCredited(burnId, shipId, burn.trader, burn.burnedKgen, creditedMatter);
    }

    function consumeMatter(bytes32 shipId, address owner, uint256 matterAmount, bytes32 reactionProofId)
        external
        returns (uint256 consumedMatter)
    {
        if (matterAmount == 0) revert ZeroAmount();
        if (reactionMatterConsumed[reactionProofId]) revert ReactionAlreadyConsumed(reactionProofId);

        IKAIOSShipIdentityReaderV1.ShipIdentity memory ship = shipRegistry.ship(shipId);
        if (!ship.active || ship.controller != owner) revert UnknownOrInactiveShip(shipId);
        if (msg.sender != ship.reactor) revert OnlyShipReactor(msg.sender);

        uint256 available = shipMatterBalance[shipId];
        if (available < matterAmount) revert InsufficientMatter(available, matterAmount);

        reactionMatterConsumed[reactionProofId] = true;
        shipMatterBalance[shipId] = available - matterAmount;
        shipMatterConsumed[shipId] += matterAmount;
        consumedMatter = matterAmount;

        emit WhiteHoleMatterConsumed(reactionProofId, shipId, matterAmount);
    }

    function burnCredit(bytes32 burnId) external view returns (BurnCredit memory) {
        return _burnCredits[burnId];
    }

    function conservationInvariantHolds(bytes32 shipId, uint256 totalCreditedMatter) external view returns (bool) {
        return shipMatterBalance[shipId] + shipMatterConsumed[shipId] == totalCreditedMatter;
    }
}
