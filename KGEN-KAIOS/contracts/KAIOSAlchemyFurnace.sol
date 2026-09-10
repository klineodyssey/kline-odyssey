// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

interface IKAIOSAlchemyBurnable {
    function burnForAlchemy(address owner, address beneficiary, uint256 kaiosAmount, bytes32 lifeId, bytes32 destinationCode)
        external returns (bytes32 alchemyProofId, uint256 expectedKufo);
}

interface IKUFOImmediateOutput {
    function releaseImmediate(bytes32 proofId) external returns (address beneficiary, uint256 kufoAmount);
}

/**
 * @title KAIOSAlchemyFurnace
 * @notice K18911 successor: immediate KAIOS -> KUFO, gated only by current KGEN wallet balance.
 * @dev No KGEN transfer/burn/lock/allowance/holding-age/tax-history/catalyst-bank requirement exists here.
 */
contract KAIOSAlchemyFurnace is ReentrancyGuard {
    string public constant VERSION = "4.0.0";
    bytes32 public constant VERSION_ID = keccak256("KAIOS.ALCHEMY_FURNACE.V4.0.0");
    bytes32 public constant ORGAN_WORMHOLE_511111 = keccak256("KAIOS.ORGAN.WORMHOLE.511111");
    bytes32 public constant DESTINATION_511111 = keccak256("KAIOS.POINT.511111.KUFO.WORMHOLE");
    uint256 public constant FURNACE_POINT = 18_911;
    uint256 public constant TOKEN_POINT = 511_111;
    uint256 public constant KAIOS_PER_KGEN = 1_000;
    uint256 public constant KUFO_PER_KAIOS = 1_000;
    uint256 public constant MIN_KAIOS_WEI = 1_000;

    struct Proof {
        address owner;
        address beneficiary;
        uint256 kaiosBurned;
        uint256 requiredKgenBalance;
        uint256 observedKgenBalance;
        uint256 kufoAmount;
        bytes32 lifeId;
        bytes32 destinationCode;
        uint64 createdAt;
        bool consumed;
    }

    IKAIOSAlchemyBurnable public immutable kaios;
    IERC20 public immutable kgen;
    IKAIOSOrganRegistry public immutable organRegistry;
    mapping(bytes32 => Proof) private _proofs;

    error ZeroAddress();
    error AlchemyAmountTooSmall(uint256 provided, uint256 minimum);
    error InexactRatio(uint256 kaiosAmount);
    error InsufficientKgenBalance(uint256 observed, uint256 required);
    error UnexpectedKufoOutput(uint256 expected, uint256 actual);
    error UnknownProof(bytes32 proofId);
    error ProofAlreadyConsumed(bytes32 proofId);
    error OnlyCurrentWormhole(address caller);
    error WormholeNotBound();
    error ReleaseResultMismatch(address beneficiary, uint256 amount);

    event KgenBalanceVerified(bytes32 indexed proofId, address indexed owner, uint256 observedKgenBalance, uint256 requiredKgenBalance);
    event ImmediateAlchemyCreated(bytes32 indexed proofId, address indexed owner, address indexed beneficiary, uint256 kaiosBurned, uint256 kufoAmount, bytes32 destinationCode);
    event ImmediateAlchemyConsumed(bytes32 indexed proofId, address indexed beneficiary, uint256 kufoAmount);

    constructor(address kaiosToken, address kgenToken, address registry) {
        if (kaiosToken == address(0) || kgenToken == address(0) || registry == address(0)) revert ZeroAddress();
        kaios = IKAIOSAlchemyBurnable(kaiosToken);
        kgen = IERC20(kgenToken);
        organRegistry = IKAIOSOrganRegistry(registry);
    }

    function burnForKufo(uint256 kaiosAmount, address beneficiary, bytes32 lifeId, bytes32 purposeCode)
        external nonReentrant returns (bytes32 proofId, uint256 expectedKufo)
    {
        return _burnForKufo(kaiosAmount, beneficiary, lifeId, purposeCode);
    }

    function _burnForKufo(uint256 kaiosAmount, address beneficiary, bytes32 lifeId, bytes32 purposeCode)
        private returns (bytes32 proofId, uint256 expectedKufo)
    {
        if (beneficiary == address(0)) revert ZeroAddress();
        if (kaiosAmount < MIN_KAIOS_WEI) revert AlchemyAmountTooSmall(kaiosAmount, MIN_KAIOS_WEI);
        if (kaiosAmount % KAIOS_PER_KGEN != 0) revert InexactRatio(kaiosAmount);

        uint256 requiredKgen = kaiosAmount / KAIOS_PER_KGEN;
        uint256 observedKgen = kgen.balanceOf(msg.sender);
        if (observedKgen < requiredKgen) revert InsufficientKgenBalance(observedKgen, requiredKgen);

        (proofId, expectedKufo) = kaios.burnForAlchemy(msg.sender, beneficiary, kaiosAmount, lifeId, purposeCode);
        uint256 exactKufo = kaiosAmount * KUFO_PER_KAIOS;
        if (expectedKufo != exactKufo) revert UnexpectedKufoOutput(exactKufo, expectedKufo);

        _proofs[proofId] = Proof(msg.sender, beneficiary, kaiosAmount, requiredKgen, observedKgen, expectedKufo, lifeId, purposeCode, uint64(block.timestamp), false);
        emit KgenBalanceVerified(proofId, msg.sender, observedKgen, requiredKgen);
        emit ImmediateAlchemyCreated(proofId, msg.sender, beneficiary, kaiosAmount, expectedKufo, purposeCode);

        address wormhole = organRegistry.organ(ORGAN_WORMHOLE_511111);
        if (wormhole == address(0)) revert WormholeNotBound();
        (address releasedBeneficiary, uint256 releasedAmount) = IKUFOImmediateOutput(wormhole).releaseImmediate(proofId);
        if (releasedBeneficiary != beneficiary || releasedAmount != expectedKufo) revert ReleaseResultMismatch(releasedBeneficiary, releasedAmount);
    }

    function consumeImmediateProof(bytes32 proofId) external returns (address beneficiary, uint256 kufoAmount) {
        address wormhole = organRegistry.organ(ORGAN_WORMHOLE_511111);
        if (msg.sender != wormhole || wormhole == address(0)) revert OnlyCurrentWormhole(msg.sender);
        Proof storage stored = _proofs[proofId];
        if (stored.owner == address(0)) revert UnknownProof(proofId);
        if (stored.consumed) revert ProofAlreadyConsumed(proofId);
        stored.consumed = true;
        beneficiary = stored.beneficiary;
        kufoAmount = stored.kufoAmount;
        emit ImmediateAlchemyConsumed(proofId, beneficiary, kufoAmount);
    }

    function proof(bytes32 proofId) external view returns (Proof memory) { return _proofs[proofId]; }
}
