// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

/**
 * @title KUFOV4
 * @notice KUFO successor candidate: immediate alchemy output, one K280-year lifetime, then one-way KUFO -> KSHIP conversion.
 * @dev This is a deterministic expiry/decay epoch, not continuous exponential decay. KSHIP does not decay here.
 */
contract KUFOV4 is ERC20, ERC20Capped {
    bytes32 public constant ORGAN_WORMHOLE_511111 = keccak256("KAIOS.ORGAN.WORMHOLE.511111");
    bytes32 public constant ORGAN_KSHIP_CONVERTER = keccak256("KAIOS.ORGAN.KSHIP.CONVERTER");
    uint256 public constant KSHIP_PER_KUFO = 1_000;
    uint256 public constant K280_YEAR_SECONDS = 31_556_926;
    uint256 public constant MAX_SUPPLY = 72_000_000_000_000 ether;

    struct Lot {
        address owner;
        uint256 amount;
        uint64 bornAt;
        bytes32 sourceProof;
        bool decayed;
    }

    IKAIOSOrganRegistry public immutable organRegistry;
    mapping(bytes32 => bool) public proofMinted;
    mapping(uint256 => Lot) private _lots;
    mapping(address => uint256[]) private _ownerLots;
    uint256 public nextLotId = 1;
    uint256 public totalMintedFromAlchemy;
    uint256 public totalDecayedForKship;

    error ZeroAddress();
    error ZeroAmount();
    error OnlyCurrentWormhole(address caller);
    error OnlyCurrentKshipConverter(address caller);
    error ProofAlreadyUsed(bytes32 proofId);
    error UnknownLot(uint256 lotId);
    error WrongLotOwner(address expected, address actual);
    error LotNotExpired(uint256 lotId, uint256 expiresAt, uint256 currentTime);
    error LotAlreadyDecayed(uint256 lotId);
    error LotAmountMismatch(uint256 lotAmount, uint256 requested);

    event ImmediateAlchemyMinted(
        bytes32 indexed proofId,
        uint256 indexed lotId,
        address indexed beneficiary,
        uint256 kufoAmount,
        uint64 bornAt
    );
    event KUFODecayedToKSHIP(
        uint256 indexed lotId,
        address indexed owner,
        address indexed beneficiary,
        uint256 kufoBurned,
        uint256 expectedKship
    );

    constructor(address registry)
        ERC20("KUFO Alchemy Mass", "KUFO")
        ERC20Capped(MAX_SUPPLY)
    {
        if (registry == address(0)) revert ZeroAddress();
        organRegistry = IKAIOSOrganRegistry(registry);
    }

    function mintFromImmediateProof(bytes32 proofId, address beneficiary, uint256 amount) external {
        address wormhole = organRegistry.organ(ORGAN_WORMHOLE_511111);
        if (msg.sender != wormhole || wormhole == address(0)) revert OnlyCurrentWormhole(msg.sender);
        if (beneficiary == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (proofMinted[proofId]) revert ProofAlreadyUsed(proofId);

        proofMinted[proofId] = true;
        totalMintedFromAlchemy += amount;
        _mint(beneficiary, amount);

        uint256 lotId = nextLotId++;
        _lots[lotId] = Lot({
            owner: beneficiary,
            amount: amount,
            bornAt: uint64(block.timestamp),
            sourceProof: proofId,
            decayed: false
        });
        _ownerLots[beneficiary].push(lotId);
        emit ImmediateAlchemyMinted(proofId, lotId, beneficiary, amount, uint64(block.timestamp));
    }

    function decayLotForKship(
        uint256 lotId,
        address owner,
        address beneficiary,
        uint256 kufoAmount
    ) external returns (uint256 expectedKship) {
        address converter = organRegistry.organ(ORGAN_KSHIP_CONVERTER);
        if (msg.sender != converter || converter == address(0)) revert OnlyCurrentKshipConverter(msg.sender);
        if (owner == address(0) || beneficiary == address(0)) revert ZeroAddress();
        if (kufoAmount == 0) revert ZeroAmount();

        Lot storage lot = _lots[lotId];
        if (lot.owner == address(0)) revert UnknownLot(lotId);
        if (lot.owner != owner) revert WrongLotOwner(lot.owner, owner);
        if (lot.decayed) revert LotAlreadyDecayed(lotId);
        uint256 expiresAt = uint256(lot.bornAt) + K280_YEAR_SECONDS;
        if (block.timestamp < expiresAt) revert LotNotExpired(lotId, expiresAt, block.timestamp);
        if (lot.amount != kufoAmount) revert LotAmountMismatch(lot.amount, kufoAmount);

        lot.decayed = true;
        expectedKship = kufoAmount * KSHIP_PER_KUFO;
        totalDecayedForKship += kufoAmount;
        _burn(owner, kufoAmount);
        emit KUFODecayedToKSHIP(lotId, owner, beneficiary, kufoAmount, expectedKship);
    }

    function lot(uint256 lotId) external view returns (Lot memory) {
        return _lots[lotId];
    }

    function ownerLots(address owner) external view returns (uint256[] memory) {
        return _ownerLots[owner];
    }

    function conservationInvariantHolds() external view returns (bool) {
        return totalSupply() + totalDecayedForKship == totalMintedFromAlchemy;
    }
}
