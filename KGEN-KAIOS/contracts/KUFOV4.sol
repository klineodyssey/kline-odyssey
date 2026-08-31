// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

/**
 * @title KUFOV4
 * @notice KUFO successor candidate: immediate alchemy output, one K280-year lifetime, then one-way KUFO -> KSHIP conversion.
 * @dev This is a deterministic expiry/decay epoch, not continuous exponential decay. Transfers preserve each lot birth time.
 */
contract KUFOV4 is ERC20, ERC20Capped {
    bytes32 public constant ORGAN_WORMHOLE_511111 = keccak256("KAIOS.ORGAN.WORMHOLE.511111");
    bytes32 public constant ORGAN_KSHIP_CONVERTER = keccak256("KAIOS.ORGAN.KSHIP.CONVERTER");
    uint256 public constant KSHIP_PER_KUFO = 1_000;
    uint256 public constant K280_YEAR_SECONDS = 31_556_926;
    uint256 public constant MAX_SUPPLY = 72_000_000_000_000 ether;
    uint256 public constant MAX_LOTS_PER_TRANSFER = 64;

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
    mapping(address => uint256) private _head;
    mapping(address => uint256) private _tail;
    mapping(uint256 => uint256) private _next;
    mapping(uint256 => uint256) private _prev;
    mapping(address => uint256) public activeLotCount;
    uint256 public nextLotId = 1;
    uint256 public totalMintedFromAlchemy;
    uint256 public totalDecayedForKship;
    bool private _controlledDecayBurn;

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
    error LotTraversalLimit(uint256 limit);
    error LineageBalanceMismatch(address owner, uint256 remaining);
    error UnauthorizedBurn();

    event ImmediateAlchemyMinted(
        bytes32 indexed proofId,
        uint256 indexed lotId,
        address indexed beneficiary,
        uint256 kufoAmount,
        uint64 bornAt
    );
    event LotSplit(
        uint256 indexed parentLotId,
        uint256 indexed childLotId,
        address indexed newOwner,
        uint256 amount,
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
        uint256 lotId = _createLot(beneficiary, amount, uint64(block.timestamp), proofId);
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
        _removeLot(owner, lotId);
        expectedKship = kufoAmount * KSHIP_PER_KUFO;
        totalDecayedForKship += kufoAmount;
        _controlledDecayBurn = true;
        _burn(owner, kufoAmount);
        _controlledDecayBurn = false;
        emit KUFODecayedToKSHIP(lotId, owner, beneficiary, kufoAmount, expectedKship);
    }

    function lot(uint256 lotId) external view returns (Lot memory) {
        return _lots[lotId];
    }

    function lotIds(address owner, uint256 limit) external view returns (uint256[] memory ids) {
        if (limit == 0 || limit > MAX_LOTS_PER_TRANSFER) revert LotTraversalLimit(limit);
        ids = new uint256[](limit);
        uint256 cursor = _head[owner];
        uint256 count;
        while (cursor != 0 && count < limit) {
            ids[count] = cursor;
            cursor = _next[cursor];
            unchecked { ++count; }
        }
        assembly ("memory-safe") { mstore(ids, count) }
    }

    function expiresAt(uint256 lotId) external view returns (uint256) {
        Lot memory item = _lots[lotId];
        if (item.owner == address(0) && !item.decayed) revert UnknownLot(lotId);
        return uint256(item.bornAt) + K280_YEAR_SECONDS;
    }

    function conservationInvariantHolds() external view returns (bool) {
        return totalSupply() + totalDecayedForKship == totalMintedFromAlchemy;
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
    {
        if (from != address(0) && to != address(0) && from != to) {
            _moveLots(from, to, value);
        } else if (to == address(0) && !_controlledDecayBurn) {
            revert UnauthorizedBurn();
        }
        super._update(from, to, value);
    }

    function _moveLots(address from, address to, uint256 amount) private {
        uint256 remaining = amount;
        uint256 cursor = _head[from];
        uint256 processed;
        while (cursor != 0 && remaining > 0 && processed < MAX_LOTS_PER_TRANSFER) {
            uint256 following = _next[cursor];
            Lot storage item = _lots[cursor];
            uint256 take = item.amount <= remaining ? item.amount : remaining;
            if (take == item.amount) {
                _removeLot(from, cursor);
                item.owner = to;
                _appendLot(to, cursor);
            } else {
                item.amount -= take;
                uint256 childId = _createLot(to, take, item.bornAt, item.sourceProof);
                emit LotSplit(cursor, childId, to, take, item.bornAt);
            }
            remaining -= take;
            cursor = following;
            unchecked { ++processed; }
        }
        if (remaining != 0) {
            if (cursor != 0) revert LotTraversalLimit(MAX_LOTS_PER_TRANSFER);
            revert LineageBalanceMismatch(from, remaining);
        }
    }

    function _createLot(address owner, uint256 amount, uint64 bornAt, bytes32 sourceProof)
        private
        returns (uint256 lotId)
    {
        lotId = nextLotId++;
        _lots[lotId] = Lot({
            owner: owner,
            amount: amount,
            bornAt: bornAt,
            sourceProof: sourceProof,
            decayed: false
        });
        _appendLot(owner, lotId);
    }

    function _appendLot(address owner, uint256 lotId) private {
        uint256 tail = _tail[owner];
        if (tail == 0) _head[owner] = lotId;
        else {
            _next[tail] = lotId;
            _prev[lotId] = tail;
        }
        _tail[owner] = lotId;
        unchecked { ++activeLotCount[owner]; }
    }

    function _removeLot(address owner, uint256 lotId) private {
        uint256 previous = _prev[lotId];
        uint256 following = _next[lotId];
        if (previous == 0) _head[owner] = following;
        else _next[previous] = following;
        if (following == 0) _tail[owner] = previous;
        else _prev[following] = previous;
        delete _prev[lotId];
        delete _next[lotId];
        unchecked { --activeLotCount[owner]; }
    }
}
