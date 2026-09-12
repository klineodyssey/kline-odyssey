// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

interface IKAIOSAlchemyBurnableV4 {
    function burnForAlchemy(address owner, address beneficiary, uint256 kaiosAmount, bytes32 lifeId, bytes32 destinationCode)
        external returns (bytes32 alchemyProofId, uint256 expectedKufo);
}

interface IKUFOImmediateOutputV4 {
    function releaseImmediate(bytes32 proofId) external returns (address beneficiary, uint256 kufoAmount);
}

/**
 * @title KAIOSAlchemyFurnaceV4
 * @notice K18911 successor: immediate KAIOS -> KUFO, gated only by current KGEN wallet balance.
 * @dev No KGEN transfer/burn/lock/allowance/holding-age/tax-history/catalyst-bank requirement exists here.
 */
contract KAIOSAlchemyFurnaceV4 is ReentrancyGuard {
    bytes32 public constant ORGAN_OUTPUT_168888 = keccak256("KAIOS.ORGAN.KUFO.OUTPUT.168888");
    bytes32 public constant DESTINATION_168888 = keccak256("KAIOS.POINT.168888.JINDOUYUN.KUFO.OUTLET");
    uint256 public constant FURNACE_POINT = 18_911;
    uint256 public constant TOKEN_POINT = 511_111;
    uint256 public constant OUTPUT_POINT = 168_888;
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

    IKAIOSAlchemyBurnableV4 public immutable kaios;
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
    error OnlyCurrentOutput(address caller);
    error OutputNotBound();
    error ReleaseResultMismatch(address beneficiary, uint256 amount);

    event KgenBalanceVerified(bytes32 indexed proofId, address indexed owner, uint256 observedKgenBalance, uint256 requiredKgenBalance);
    event ImmediateAlchemyCreated(bytes32 indexed proofId, address indexed owner, address indexed beneficiary, uint256 kaiosBurned, uint256 kufoAmount, bytes32 destinationCode);
    event ImmediateAlchemyConsumed(bytes32 indexed proofId, address indexed beneficiary, uint256 kufoAmount);

    constructor(address kaiosToken, address kgenToken, address registry) {
        if (kaiosToken == address(0) || kgenToken == address(0) || registry == address(0)) revert ZeroAddress();
        kaios = IKAIOSAlchemyBurnableV4(kaiosToken);
        kgen = IERC20(kgenToken);
        organRegistry = IKAIOSOrganRegistry(registry);
    }

    function burnForKufo(uint256 kaiosAmount, address beneficiary, bytes32 lifeId)
        external nonReentrant returns (bytes32 proofId, uint256 expectedKufo)
    {
        if (beneficiary == address(0)) revert ZeroAddress();
        if (kaiosAmount < MIN_KAIOS_WEI) revert AlchemyAmountTooSmall(kaiosAmount, MIN_KAIOS_WEI);
        if (kaiosAmount % KAIOS_PER_KGEN != 0) revert InexactRatio(kaiosAmount);

        uint256 requiredKgen = kaiosAmount / KAIOS_PER_KGEN;
        uint256 observedKgen = kgen.balanceOf(msg.sender);
        if (observedKgen < requiredKgen) revert InsufficientKgenBalance(observedKgen, requiredKgen);

        (proofId, expectedKufo) = kaios.burnForAlchemy(msg.sender, beneficiary, kaiosAmount, lifeId, DESTINATION_168888);
        uint256 exactKufo = kaiosAmount * KUFO_PER_KAIOS;
        if (expectedKufo != exactKufo) revert UnexpectedKufoOutput(exactKufo, expectedKufo);

        _proofs[proofId] = Proof(msg.sender, beneficiary, kaiosAmount, requiredKgen, observedKgen, expectedKufo, lifeId, DESTINATION_168888, uint64(block.timestamp), false);
        emit KgenBalanceVerified(proofId, msg.sender, observedKgen, requiredKgen);
        emit ImmediateAlchemyCreated(proofId, msg.sender, beneficiary, kaiosAmount, expectedKufo, DESTINATION_168888);

        address output = organRegistry.organ(ORGAN_OUTPUT_168888);
        if (output == address(0)) revert OutputNotBound();
        (address releasedBeneficiary, uint256 releasedAmount) = IKUFOImmediateOutputV4(output).releaseImmediate(proofId);
        if (releasedBeneficiary != beneficiary || releasedAmount != expectedKufo) revert ReleaseResultMismatch(releasedBeneficiary, releasedAmount);
    }

    function consumeImmediateProof(bytes32 proofId) external returns (address beneficiary, uint256 kufoAmount) {
        address output = organRegistry.organ(ORGAN_OUTPUT_168888);
        if (msg.sender != output || output == address(0)) revert OnlyCurrentOutput(msg.sender);
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
