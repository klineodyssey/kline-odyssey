// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

interface IKAIOSShipIdentityReader {
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
interface IKGENWhiteHoleBurnVerifier {
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

interface IKGENWhiteHoleTokenPolicy {
    function TAX_BPS_BURN() external view returns (uint16);
    function isMarketMakerPair(address account) external view returns (bool);
    function isTaxExempt(address account) external view returns (bool);
}

interface IKGENWhiteHoleBurnReplayRegistry {
    function consume(bytes32 burnId) external;
    function consumed(bytes32 burnId) external view returns (bool);
}

/**
 * @title KGENWhiteHoleBurnReplayRegistry
 * @notice Append-only replay ledger shared by every approved White-Hole verifier version.
 * @dev The canonical organ registry may replace the verifier after its governance delay, but no
 *      verifier version can clear or reuse an already-consumed transaction/log burn coordinate.
 */
contract KGENWhiteHoleBurnReplayRegistry {
    string public constant VERSION = "1.0.0";
    bytes32 public constant VERSION_ID = keccak256("KAIOS.KGEN.WHITE_HOLE.BURN.REPLAY.REGISTRY.V1.0.0");
    bytes32 public constant ORGAN_WHITE_HOLE_BURN_VERIFIER =
        keccak256("KAIOS.ORGAN.KGEN.WHITE_HOLE.BURN_VERIFIER");

    IKAIOSOrganRegistry public immutable organRegistry;
    mapping(bytes32 => bool) public consumed;

    error ZeroAddress();
    error InvalidBurnId();
    error OnlyCurrentVerifier(address caller);
    error BurnAlreadyConsumed(bytes32 burnId);

    event BurnConsumed(bytes32 indexed burnId, address indexed verifier);

    constructor(address registry) {
        if (registry == address(0)) revert ZeroAddress();
        organRegistry = IKAIOSOrganRegistry(registry);
    }

    function consume(bytes32 burnId) external {
        if (burnId == bytes32(0)) revert InvalidBurnId();
        address verifier = organRegistry.organ(ORGAN_WHITE_HOLE_BURN_VERIFIER);
        if (verifier == address(0) || msg.sender != verifier) revert OnlyCurrentVerifier(msg.sender);
        if (consumed[burnId]) revert BurnAlreadyConsumed(burnId);
        consumed[burnId] = true;
        emit BurnConsumed(burnId, msg.sender);
    }
}

/**
 * @title KGENWhiteHoleBurnVerifier
 * @notice Immutable dual-attestor adapter for recent KGEN AMM burn receipts.
 * @dev EVM contracts cannot read historical transaction logs directly. Two distinct immutable
 *      attestors therefore sign the same block-anchored EIP-191 evidence. This contract checks the
 *      live KGEN AMM/tax policy, recomputes the burn from the gross KGEN amount, fixes the physical
 *      conversion scale at deployment, rejects tax-exempt trade endpoints, and consumes each
 *      transaction-log coordinate in the shared append-only replay registry. It has no owner,
 *      mutable verifier set, token transfer, mint, burn, rescue, or upgrade function.
 */
contract KGENWhiteHoleBurnVerifier is IKGENWhiteHoleBurnVerifier {
    using MessageHashUtils for bytes32;

    string public constant VERSION = "1.0.0";
    bytes32 public constant VERSION_ID = keccak256("KAIOS.KGEN.WHITE_HOLE.BURN_VERIFIER.V1.0.0");
    uint256 private constant BPS = 10_000;

    IKGENWhiteHoleTokenPolicy public immutable kgen;
    IKGENWhiteHoleBurnReplayRegistry public immutable replayRegistry;
    address public immutable attestorA;
    address public immutable attestorB;
    uint256 public immutable matterPerKgenNumerator;
    uint256 public immutable matterPerKgenDenominator;

    struct BurnEvidence {
        bytes32 transactionHash;
        uint64 blockNumber;
        bytes32 blockHash;
        uint32 logIndex;
        address pair;
        address trader;
        address burnSource;
        uint256 grossTradeKgen;
    }

    mapping(bytes32 => VerifiedBurn) private _verifiedBurns;

    error ZeroAddress();
    error InvalidAttestors();
    error InvalidScale();
    error InvalidEvidence();
    error InvalidBlockEvidence(uint256 blockNumber, bytes32 blockHash);
    error PairNotRegistered(address pair);
    error TaxExemptTradeEndpoint(address endpoint);
    error BurnSourceNotTradeBound(address burnSource);
    error ZeroBurn();
    error InvalidAttestations(address signerA, address signerB);
    error EvidenceAlreadyConsumed(bytes32 evidenceId);

    event BurnReceiptVerified(
        bytes32 indexed burnId,
        bytes32 indexed transactionHash,
        uint32 indexed logIndex,
        address pair,
        address trader,
        address burnSource,
        uint256 grossTradeKgen,
        uint256 burnedKgen,
        uint256 positiveMatterEquivalent
    );

    constructor(
        address kgenToken,
        address sharedReplayRegistry,
        address firstAttestor,
        address secondAttestor,
        uint256 scaleNumerator,
        uint256 scaleDenominator
    ) {
        if (kgenToken == address(0) || sharedReplayRegistry == address(0)) revert ZeroAddress();
        if (firstAttestor == address(0) || secondAttestor == address(0) || firstAttestor == secondAttestor) {
            revert InvalidAttestors();
        }
        if (scaleNumerator == 0 || scaleDenominator == 0) revert InvalidScale();
        kgen = IKGENWhiteHoleTokenPolicy(kgenToken);
        replayRegistry = IKGENWhiteHoleBurnReplayRegistry(sharedReplayRegistry);
        attestorA = firstAttestor;
        attestorB = secondAttestor;
        matterPerKgenNumerator = scaleNumerator;
        matterPerKgenDenominator = scaleDenominator;
    }

    function burnIdFor(BurnEvidence calldata evidence) public view returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(kgen), evidence.transactionHash, evidence.logIndex));
    }

    function evidenceDigest(BurnEvidence calldata evidence) public view returns (bytes32) {
        return keccak256(
            abi.encode(
                VERSION_ID,
                block.chainid,
                address(this),
                address(kgen),
                evidence.transactionHash,
                evidence.blockNumber,
                evidence.blockHash,
                evidence.logIndex,
                evidence.pair,
                evidence.trader,
                evidence.burnSource,
                evidence.grossTradeKgen,
                matterPerKgenNumerator,
                matterPerKgenDenominator
            )
        );
    }

    function submitVerifiedBurn(BurnEvidence calldata evidence, bytes calldata signatureA, bytes calldata signatureB)
        external returns (bytes32 burnId, uint256 burnedKgen, uint256 positiveMatterEquivalent)
    {
        if (
            evidence.transactionHash == bytes32(0) || evidence.blockHash == bytes32(0) ||
            evidence.pair == address(0) || evidence.trader == address(0) || evidence.burnSource == address(0) ||
            evidence.grossTradeKgen == 0
        ) revert InvalidEvidence();
        if (
            evidence.blockNumber >= block.number || block.number - evidence.blockNumber > 256 ||
            blockhash(evidence.blockNumber) != evidence.blockHash
        ) revert InvalidBlockEvidence(evidence.blockNumber, evidence.blockHash);
        if (!kgen.isMarketMakerPair(evidence.pair)) revert PairNotRegistered(evidence.pair);
        if (kgen.isTaxExempt(evidence.trader)) revert TaxExemptTradeEndpoint(evidence.trader);
        if (kgen.isTaxExempt(evidence.pair)) revert TaxExemptTradeEndpoint(evidence.pair);
        if (evidence.burnSource != evidence.trader && evidence.burnSource != evidence.pair) {
            revert BurnSourceNotTradeBound(evidence.burnSource);
        }

        burnedKgen = Math.mulDiv(evidence.grossTradeKgen, kgen.TAX_BPS_BURN(), BPS);
        if (burnedKgen == 0) revert ZeroBurn();
        positiveMatterEquivalent = Math.mulDiv(burnedKgen, matterPerKgenNumerator, matterPerKgenDenominator);
        if (positiveMatterEquivalent == 0) revert ZeroBurn();

        bytes32 digest = evidenceDigest(evidence).toEthSignedMessageHash();
        address signerA = ECDSA.recover(digest, signatureA);
        address signerB = ECDSA.recover(digest, signatureB);
        bool correctAttestors =
            (signerA == attestorA && signerB == attestorB) || (signerA == attestorB && signerB == attestorA);
        if (!correctAttestors) revert InvalidAttestations(signerA, signerB);

        burnId = burnIdFor(evidence);
        if (replayRegistry.consumed(burnId) || _verifiedBurns[burnId].valid) revert EvidenceAlreadyConsumed(burnId);
        replayRegistry.consume(burnId);
        _verifiedBurns[burnId] = VerifiedBurn({
            burnId: burnId,
            tradeId: evidence.transactionHash,
            pairId: bytes32(uint256(uint160(evidence.pair))),
            trader: evidence.trader,
            burnedKgen: burnedKgen,
            positiveMatterEquivalent: positiveMatterEquivalent,
            valid: true,
            ammTrade: true,
            selfMatch: false,
            washTrade: false
        });

        emit BurnReceiptVerified(
            burnId,
            evidence.transactionHash,
            evidence.logIndex,
            evidence.pair,
            evidence.trader,
            evidence.burnSource,
            evidence.grossTradeKgen,
            burnedKgen,
            positiveMatterEquivalent
        );
    }

    function verifiedBurn(bytes32 burnId) external view returns (VerifiedBurn memory) {
        return _verifiedBurns[burnId];
    }

    function transactionLogConsumed(bytes32 burnId) external view returns (bool) {
        return replayRegistry.consumed(burnId);
    }
}

/**
 * @title KGENWhiteHoleMatterSource
 * @notice Converts verified, irreversible KGEN White-Hole AMM burn receipts into non-transferable
 *         positive-matter credit owned by an authenticated ship ID.
 * @dev No KGEN is minted, restored, transferred or rescued here. A burn proof can be credited once.
 *      Only the authenticated ship reactor may consume that ship's credit. Invalid/self-match/wash
 *      receipts fail closed. `positiveMatterEquivalent` is supplied by the canonical burn verifier
 *      so this contract does not invent a KGEN<->KSHIP physical scale.
 */
contract KGENWhiteHoleMatterSource {
    string public constant VERSION = "1.0.0";
    bytes32 public constant VERSION_ID = keccak256("KAIOS.KGEN.WHITE_HOLE.MATTER_SOURCE.V1.0.0");

    IKGENWhiteHoleBurnVerifier public immutable burnVerifier;
    IKAIOSShipIdentityReader public immutable shipRegistry;

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
        burnVerifier = IKGENWhiteHoleBurnVerifier(verifier);
        shipRegistry = IKAIOSShipIdentityReader(ships);
    }

    function claimBurnForShip(bytes32 burnId, bytes32 shipId) external returns (uint256 creditedMatter) {
        if (shipId == bytes32(0)) revert ZeroShipId();
        if (_burnCredits[burnId].claimedAt != 0) revert BurnAlreadyCredited(burnId);

        IKAIOSShipIdentityReader.ShipIdentity memory ship = shipRegistry.ship(shipId);
        if (!ship.active) revert UnknownOrInactiveShip(shipId);
        if (msg.sender != ship.controller && msg.sender != ship.tradingEngine) revert UnauthorizedClaimant(msg.sender);

        IKGENWhiteHoleBurnVerifier.VerifiedBurn memory burn = burnVerifier.verifiedBurn(burnId);
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

        IKAIOSShipIdentityReader.ShipIdentity memory ship = shipRegistry.ship(shipId);
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
