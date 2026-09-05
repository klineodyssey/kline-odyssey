// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

/**
 * @title KUFOV4
 * @notice KUFO successor candidate with immediate alchemy output and Three-Autumn decay.
 * @dev Autumn 1 converts 50% of original lot, Autumn 2 reaches 75%, Autumn 3 converts all remainder.
 *      Matured KUFO is burned only through the current KSHIP converter, which then mints KSHIP from
 *      the recorded carrier proof. This guarantees zero residual KUFO dust after three K280 years.
 */
contract KUFOV4 is ERC20, ERC20Capped {
    bytes32 public constant ORGAN_OUTPUT_168888 = keccak256("KAIOS.ORGAN.KUFO.OUTPUT.168888");
    bytes32 public constant ORGAN_KSHIP_CONVERTER = keccak256("KAIOS.ORGAN.KSHIP.CONVERTER");
    uint256 public constant TOKEN_POINT_511111 = 511_111;
    uint256 public constant OUTPUT_POINT_168888 = 168_888;
    uint256 public constant KSHIP_PER_KUFO = 1_000;
    uint256 public constant K280_YEAR_SECONDS = 31_556_926;
    uint256 public constant MAX_SUPPLY = 72_000_000_000_000 ether;
    uint256 public constant MAX_LOTS_PER_OPERATION = 64;

    struct Lot {
        address owner;
        uint256 initialAmount;
        uint256 convertedAmount;
        uint256 firstAutumnTarget;
        uint256 secondAutumnTarget;
        uint64 bornAt;
        bytes32 sourceProof;
    }

    struct CarrierBurnRecord {
        address owner;
        address beneficiary;
        address converter;
        uint256 kufoBurned;
        uint256 expectedKship;
    }

    IKAIOSOrganRegistry public immutable organRegistry;
    mapping(bytes32 => bool) public proofMinted;
    mapping(bytes32 => CarrierBurnRecord) private _carrierBurnRecords;
    mapping(uint256 => Lot) private _lots;
    mapping(address => uint256) private _head;
    mapping(address => uint256) private _tail;
    mapping(uint256 => uint256) private _next;
    mapping(uint256 => uint256) private _prev;
    mapping(address => uint256) public activeLotCount;
    uint256 public nextLotId = 1;
    uint256 public totalMintedFromAlchemy;
    uint256 public totalDecayedForKship;
    bool private _decayBurn;

    error ZeroAddress();
    error ZeroAmount();
    error OnlyCurrentOutput(address caller);
    error OnlyCurrentKshipConverter(address caller);
    error ProofAlreadyUsed(bytes32 proofId);
    error UnknownLot(uint256 lotId);
    error LotTraversalLimit();
    error LineageBalanceMismatch(address owner, uint256 missing);
    error InsufficientMaturedDecay(address owner, uint256 requested, uint256 available);

    event ImmediateAlchemyMinted(bytes32 indexed proofId, uint256 indexed lotId, address indexed beneficiary, uint256 kufoAmount, uint64 bornAt);
    event LotSplit(uint256 indexed parentLotId, uint256 indexed childLotId, address indexed newOwner, uint256 childInitial, uint256 childConverted);
    event ThreeAutumnDecay(uint256 indexed lotId, address indexed owner, address indexed beneficiary, uint256 kufoBurned, uint256 expectedKship, uint8 autumn);
    event CarrierBurnRecorded(bytes32 indexed proofId, address indexed owner, address indexed beneficiary, address converter, uint256 kufoBurned, uint256 expectedKship);

    constructor(address registry)
        ERC20("KUFO Alchemy Mass", "KUFO")
        ERC20Capped(MAX_SUPPLY)
    {
        if (registry == address(0)) revert ZeroAddress();
        organRegistry = IKAIOSOrganRegistry(registry);
    }

    function mintFromImmediateProof(bytes32 proofId, address beneficiary, uint256 amount) external returns (uint256 lotId) {
        address output = organRegistry.organ(ORGAN_OUTPUT_168888);
        if (msg.sender != output || output == address(0)) revert OnlyCurrentOutput(msg.sender);
        if (beneficiary == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (proofMinted[proofId]) revert ProofAlreadyUsed(proofId);

        proofMinted[proofId] = true;
        totalMintedFromAlchemy += amount;
        _mint(beneficiary, amount);
        lotId = _createLot(
            beneficiary,
            amount,
            0,
            amount / 2,
            amount * 3 / 4,
            uint64(block.timestamp),
            proofId
        );
        emit ImmediateAlchemyMinted(proofId, lotId, beneficiary, amount, uint64(block.timestamp));
    }

    function targetConvertedAmount(uint256 lotId) public view returns (uint256) {
        Lot memory item = _lots[lotId];
        if (item.owner == address(0)) revert UnknownLot(lotId);
        uint256 elapsed = block.timestamp > item.bornAt ? block.timestamp - item.bornAt : 0;
        if (elapsed < K280_YEAR_SECONDS) return 0;
        if (elapsed < 2 * K280_YEAR_SECONDS) return item.firstAutumnTarget;
        if (elapsed < 3 * K280_YEAR_SECONDS) return item.secondAutumnTarget;
        return item.initialAmount;
    }

    function claimableDecay(uint256 lotId) public view returns (uint256) {
        Lot memory item = _lots[lotId];
        uint256 target = targetConvertedAmount(lotId);
        return target > item.convertedAmount ? target - item.convertedAmount : 0;
    }

    function currentAutumn(uint256 lotId) public view returns (uint8) {
        Lot memory item = _lots[lotId];
        if (item.owner == address(0)) revert UnknownLot(lotId);
        return currentAutumnForTimestamp(item.bornAt);
    }

    /**
     * @notice Existing KSHIPConverter-compatible entry point.
     * @dev The converter may burn only KUFO that has become claimable under the Three-Autumn schedule.
     *      The proof record is consumed by KSHIP.mintFromCarrierProof in the same converter transaction.
     */
    function burnForCarrier(address owner, address beneficiary, uint256 kufoAmount, bytes32 carrierProofId)
        external returns (uint256 expectedKship)
    {
        address converter = organRegistry.organ(ORGAN_KSHIP_CONVERTER);
        if (msg.sender != converter || converter == address(0)) revert OnlyCurrentKshipConverter(msg.sender);
        if (owner == address(0) || beneficiary == address(0)) revert ZeroAddress();
        if (kufoAmount == 0) revert ZeroAmount();
        if (_carrierBurnRecords[carrierProofId].owner != address(0)) revert ProofAlreadyUsed(carrierProofId);

        uint256 remaining = kufoAmount;
        uint256 available;
        uint256 cursor = _head[owner];
        uint256 processed;

        while (cursor != 0 && remaining > 0 && processed < MAX_LOTS_PER_OPERATION) {
            uint256 following = _next[cursor];
            Lot storage item = _lots[cursor];
            uint256 target = targetConvertedAmount(cursor);
            uint256 claimable = target > item.convertedAmount ? target - item.convertedAmount : 0;
            available += claimable;

            if (claimable != 0) {
                uint256 take = claimable < remaining ? claimable : remaining;
                item.convertedAmount += take;
                totalDecayedForKship += take;
                remaining -= take;
                emit ThreeAutumnDecay(
                    cursor,
                    owner,
                    beneficiary,
                    take,
                    take * KSHIP_PER_KUFO,
                    currentAutumnForTimestamp(item.bornAt)
                );
                if (item.convertedAmount == item.initialAmount) _remove(owner, cursor);
            }

            cursor = following;
            unchecked { ++processed; }
        }

        if (remaining != 0) {
            if (cursor != 0) revert LotTraversalLimit();
            revert InsufficientMaturedDecay(owner, kufoAmount, available);
        }

        expectedKship = kufoAmount * KSHIP_PER_KUFO;
        _carrierBurnRecords[carrierProofId] = CarrierBurnRecord(
            owner,
            beneficiary,
            msg.sender,
            kufoAmount,
            expectedKship
        );

        _decayBurn = true;
        _burn(owner, kufoAmount);
        _decayBurn = false;

        emit CarrierBurnRecorded(carrierProofId, owner, beneficiary, msg.sender, kufoAmount, expectedKship);
    }

    function carrierBurnRecord(bytes32 proofId) external view returns (CarrierBurnRecord memory) {
        return _carrierBurnRecords[proofId];
    }

    function currentAutumnForTimestamp(uint64 bornAt) public view returns (uint8) {
        uint256 elapsed = block.timestamp > bornAt ? block.timestamp - bornAt : 0;
        if (elapsed < K280_YEAR_SECONDS) return 0;
        if (elapsed < 2 * K280_YEAR_SECONDS) return 1;
        if (elapsed < 3 * K280_YEAR_SECONDS) return 2;
        return 3;
    }

    function lot(uint256 lotId) external view returns (Lot memory) { return _lots[lotId]; }

    function ownerLotIds(address owner) external view returns (uint256[] memory ids) {
        uint256 count = activeLotCount[owner];
        if (count > MAX_LOTS_PER_OPERATION) revert LotTraversalLimit();
        ids = new uint256[](count);
        uint256 cursor = _head[owner];
        for (uint256 i; i < count; ++i) { ids[i] = cursor; cursor = _next[cursor]; }
    }

    function conservationInvariantHolds() external view returns (bool) {
        return totalSupply() + totalDecayedForKship == totalMintedFromAlchemy;
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Capped) {
        if (from != address(0) && to != address(0) && from != to) _moveLots(from, to, value);
        if (to == address(0) && !_decayBurn) revert LineageBalanceMismatch(from, value);
        super._update(from, to, value);
    }

    function _moveLots(address from, address to, uint256 amount) private {
        uint256 remaining = amount;
        uint256 cursor = _head[from];
        uint256 processed;
        while (cursor != 0 && remaining > 0 && processed < MAX_LOTS_PER_OPERATION) {
            uint256 following = _next[cursor];
            Lot storage item = _lots[cursor];
            uint256 liveAmount = item.initialAmount - item.convertedAmount;
            uint256 take = liveAmount < remaining ? liveAmount : remaining;
            if (take == liveAmount) {
                _remove(from, cursor);
                item.owner = to;
                _append(to, cursor);
            } else {
                uint256 originalInitial = item.initialAmount;
                uint256 childInitial = originalInitial * take / liveAmount;
                if (childInitial < take) childInitial = take;
                uint256 childConverted = childInitial - take;
                uint256 childFirstAutumnTarget =
                    item.firstAutumnTarget * childInitial / originalInitial;
                uint256 childSecondAutumnTarget =
                    item.secondAutumnTarget * childInitial / originalInitial;

                item.initialAmount -= childInitial;
                item.convertedAmount -= childConverted;
                item.firstAutumnTarget -= childFirstAutumnTarget;
                item.secondAutumnTarget -= childSecondAutumnTarget;

                uint256 child = _createLot(
                    to,
                    childInitial,
                    childConverted,
                    childFirstAutumnTarget,
                    childSecondAutumnTarget,
                    item.bornAt,
                    item.sourceProof
                );
                emit LotSplit(cursor, child, to, childInitial, childConverted);
            }
            remaining -= take;
            cursor = following;
            unchecked { ++processed; }
        }
        if (remaining != 0) {
            if (cursor != 0) revert LotTraversalLimit();
            revert LineageBalanceMismatch(from, remaining);
        }
    }

    function _createLot(
        address owner,
        uint256 initialAmount,
        uint256 convertedAmount,
        uint256 firstAutumnTarget,
        uint256 secondAutumnTarget,
        uint64 bornAt,
        bytes32 proofId
    ) private returns (uint256 lotId) {
        lotId = nextLotId++;
        _lots[lotId] = Lot(
            owner,
            initialAmount,
            convertedAmount,
            firstAutumnTarget,
            secondAutumnTarget,
            bornAt,
            proofId
        );
        _append(owner, lotId);
    }

    function _append(address owner, uint256 lotId) private {
        uint256 tailId = _tail[owner];
        if (tailId == 0) _head[owner] = lotId;
        else { _next[tailId] = lotId; _prev[lotId] = tailId; }
        _tail[owner] = lotId;
        unchecked { ++activeLotCount[owner]; }
    }

    function _remove(address owner, uint256 lotId) private {
        uint256 previous = _prev[lotId];
        uint256 following = _next[lotId];
        if (previous == 0) _head[owner] = following; else _next[previous] = following;
        if (following == 0) _tail[owner] = previous; else _prev[following] = previous;
        delete _prev[lotId];
        delete _next[lotId];
        unchecked { --activeLotCount[owner]; }
    }
}
