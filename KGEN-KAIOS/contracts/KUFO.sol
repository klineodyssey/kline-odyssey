// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
// Engineering revision 2026-11-13: original PR637 9dc02605 / integrated main33967045.
// Exact build commit, source hashes and deployment gates: KAIOS_18911_KUFO_THREE_AUTUMNS_V4.md.

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

interface IKAIOSBurnRecordSource {
    function ORGAN_REGISTRY() external view returns (address);
    struct AlchemyBurnRecord {
        address owner;
        address beneficiary;
        address furnace;
        uint256 kaiosBurned;
        uint256 expectedKufo;
        bytes32 lifeId;
        bytes32 destinationCode;
        uint256 blockNumber;
        uint256 timestamp;
    }
    function alchemyBurnRecord(bytes32 proofId) external view returns (AlchemyBurnRecord memory);
}
interface IAlchemyFurnaceProofSource {
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
    function proof(bytes32 proofId) external view returns (Proof memory);
    function canonicalKufo() external view returns (address);
    function kaios() external view returns (address);
    function organRegistry() external view returns (address);
}

/**
 * @title KUFO
 * @notice Burn-backed KUFO with immutable financial-year and birth-window groups.
 * @dev Calendar values require explicit deployment review; none are selected here.
 * The 32-year, 512-window and 32-group bounds are engineering candidate limits,
 * not an approved issuance horizon. Final tranches remain convertible forever.
 */
contract KUFO is ERC20, ERC20Capped {
    bytes32 public constant ORGAN_OUTPUT_168888 = keccak256("KAIOS.ORGAN.KUFO.OUTPUT.168888");
    bytes32 public constant ORGAN_KSHIP_CONVERTER = keccak256("KAIOS.ORGAN.KSHIP.CONVERTER");
    bytes32 public constant DESTINATION_168888 = keccak256("KAIOS.POINT.168888.JINDOUYUN.KUFO.OUTLET");
    uint256 public constant TOKEN_POINT_511111 = 511_111;
    uint256 public constant OUTPUT_POINT_168888 = 168_888;
    uint256 public constant KUFO_PER_KAIOS = 1_000;
    uint256 public constant KSHIP_PER_KUFO = 1_000;
    uint256 public constant MAX_SUPPLY = 72_000_000_000_000 ether;
    uint256 public constant MAX_ISSUANCE_COHORTS = 32;
    uint256 public constant MAX_BIRTH_WINDOWS = 512;
    uint256 public constant MAX_BATCH_GROUPS = 32;

    struct CalendarConfig {
        bytes32 version;
        uint32 firstFinancialYear;
        uint64[] yearStarts;
        // start low64 | end <<64 | zodiac <<128 | constellation <<136.
        uint256[] packedBirthWindows;
    }
    // One storage slot; financial boundaries split a crossing birth window.
    struct GroupMetadata {
        uint64 start;
        uint64 end;
        uint32 financialYear;
        uint8 zodiac;
        uint8 constellation;
    }
    struct Cohort { uint256 first; uint256 second; uint256 terminal; }
    struct MintOrigin {
        address beneficiary;
        uint256 amount;
        uint64 bornAt;
        uint32 birthYear;
        uint8 birthZodiac;
        uint8 birthConstellation;
        uint16 groupId;
        bytes32 calendarHash;
    }
    // Field order remains compatible with the existing KSHIP proof interface.
    struct CarrierBurnRecord {
        address owner;
        address beneficiary;
        address converter;
        uint256 kufoBurned;
        uint256 expectedKship;
    }

    IKAIOSOrganRegistry public immutable organRegistry;
    IKAIOSBurnRecordSource public immutable kaios;
    bytes32 public immutable calendarVersion;
    bytes32 public immutable calendarHash;
    uint32 public immutable firstBirthYear;
    uint8 public immutable issuanceCohorts;
    uint64[] private _yearStarts;
    GroupMetadata[] private _groups;
    mapping(address => mapping(uint256 => Cohort)) private _birthGroups;
    mapping(bytes32 => MintOrigin) private _mintOrigins;
    mapping(bytes32 => CarrierBurnRecord) private _carrierBurnRecords;
    mapping(bytes32 => bool) public proofMinted;
    uint256 public totalMintedFromAlchemy;
    uint256 public totalDecayedForKship;
    bool private _selectedTransfer;
    bool private _decayBurn;

    error ZeroAddress();
    error CanonicalBindingMismatch();
    error NotAContract(address account);
    error ZeroAmount();
    error InvalidCalendar();
    error IssuanceCalendarClosed(uint256 timestamp);
    error UnknownBirthYear(uint32 birthYear);
    error UnknownBirthGroup(uint256 groupId);
    error InvalidGroupSelection();
    error GroupBatchRequired(uint256 maximumGroups);
    error LifetimeIssuanceExceeded(uint256 requested, uint256 available);
    error OnlyCurrentOutput(address caller);
    error OnlyCurrentKshipConverter(address caller);
    error ProofAlreadyUsed(bytes32 proofId);
    error InvalidLineageProof(bytes32 proofId);
    error LineageBalanceMismatch(address owner, uint256 missing);
    error InsufficientMaturedDecay(address owner, uint256 requested, uint256 available);
    error InsufficientHolderAllowance(uint256 currentAllowance, uint256 requiredAllowance);

    event ImmediateAlchemyMinted(bytes32 indexed proofId, uint256 indexed groupId, address indexed beneficiary, uint256 kufoAmount, uint64 bornAt);
    event BirthOriginRecorded(bytes32 indexed proofId, uint32 indexed birthYear, uint8 zodiac, uint8 constellation, uint256 groupId, bytes32 calendarHash);
    event CohortTransferred(address indexed from, address indexed to, uint256 indexed groupId, uint256 first, uint256 second, uint256 terminal);
    event AnnualConversion(uint256 indexed groupId, uint32 indexed birthYear, address indexed owner, address beneficiary, uint256 kufoBurned, uint256 expectedKship, uint8 stage);
    event CarrierBurnRecorded(bytes32 indexed proofId, address indexed owner, address indexed beneficiary, address converter, uint256 kufoBurned, uint256 expectedKship);

    constructor(address registry, address kaiosToken, CalendarConfig memory cfg)
        ERC20("KUFO", "KUFO") ERC20Capped(MAX_SUPPLY)
    {
        if (registry == address(0) || kaiosToken == address(0)) revert ZeroAddress();
        if (registry.code.length == 0) revert NotAContract(registry);
        if (kaiosToken.code.length == 0) revert NotAContract(kaiosToken);
        if (IKAIOSBurnRecordSource(kaiosToken).ORGAN_REGISTRY() != registry) revert CanonicalBindingMismatch();
        uint256 boundaries = cfg.yearStarts.length;
        if (cfg.version == bytes32(0) || cfg.firstFinancialYear == 0 || boundaries < 4 ||
            boundaries > MAX_ISSUANCE_COHORTS + 3 ||
            uint256(cfg.firstFinancialYear) + boundaries - 1 > type(uint32).max ||
            cfg.packedBirthWindows.length == 0 || cfg.packedBirthWindows.length > MAX_BIRTH_WINDOWS) revert InvalidCalendar();
        uint64 previous;
        for (uint256 i; i < boundaries; ++i) {
            uint64 boundary = cfg.yearStarts[i];
            if (boundary <= previous) revert InvalidCalendar();
            _yearStarts.push(boundary);
            previous = boundary;
        }
        uint256 issuanceCount = boundaries - 3;
        uint64 nextStart = cfg.yearStarts[0];
        uint256 yearIndex;
        for (uint256 i; i < cfg.packedBirthWindows.length; ++i) {
            uint256 packed = cfg.packedBirthWindows[i];
            uint64 start = uint64(packed);
            uint64 end = uint64(packed >> 64);
            uint8 zodiac = uint8(packed >> 128);
            uint8 constellation = uint8(packed >> 136);
            if (packed >> 144 != 0 || start != nextStart || end <= start ||
                end > cfg.yearStarts[issuanceCount] || zodiac == 0 || zodiac > 12 ||
                constellation == 0 || constellation > 12) revert InvalidCalendar();
            uint64 cursor = start;
            while (cursor < end) {
                while (cursor >= cfg.yearStarts[yearIndex + 1]) ++yearIndex;
                uint64 groupEnd = end < cfg.yearStarts[yearIndex + 1] ? end : cfg.yearStarts[yearIndex + 1];
                _groups.push(GroupMetadata(cursor, groupEnd, uint32(uint256(cfg.firstFinancialYear) + yearIndex), zodiac, constellation));
                cursor = groupEnd;
            }
            nextStart = end;
        }
        if (nextStart != cfg.yearStarts[issuanceCount]) revert InvalidCalendar();
        organRegistry = IKAIOSOrganRegistry(registry);
        kaios = IKAIOSBurnRecordSource(kaiosToken);
        calendarVersion = cfg.version;
        calendarHash = keccak256(abi.encode(cfg.version, cfg.firstFinancialYear, cfg.yearStarts, cfg.packedBirthWindows));
        firstBirthYear = cfg.firstFinancialYear;
        issuanceCohorts = uint8(issuanceCount);
    }

    function mintFromImmediateProof(bytes32 proofId, address beneficiary, uint256 amount)
        external returns (uint256 groupId)
    {
        address output = organRegistry.organ(ORGAN_OUTPUT_168888);
        if (msg.sender != output || output == address(0)) revert OnlyCurrentOutput(msg.sender);
        if (beneficiary == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (proofMinted[proofId]) revert ProofAlreadyUsed(proofId);
        groupId = _groupAt(block.timestamp);
        if (amount > MAX_SUPPLY - totalMintedFromAlchemy) {
            revert LifetimeIssuanceExceeded(amount, MAX_SUPPLY - totalMintedFromAlchemy);
        }
        _verifyBurnProof(proofId, beneficiary, amount);
        GroupMetadata memory group = _groups[groupId - 1];
        Cohort storage item = _birthGroups[beneficiary][groupId];
        uint256 first = amount / 2;
        uint256 firstAndSecond = Math.mulDiv(amount, 3, 4);
        item.first += first;
        item.second += firstAndSecond - first;
        item.terminal += amount - firstAndSecond;
        proofMinted[proofId] = true;
        totalMintedFromAlchemy += amount;
        _mintOrigins[proofId] = MintOrigin(beneficiary, amount, uint64(block.timestamp), group.financialYear,
            group.zodiac, group.constellation, uint16(groupId), calendarHash);
        _mint(beneficiary, amount);
        emit ImmediateAlchemyMinted(proofId, groupId, beneficiary, amount, uint64(block.timestamp));
        emit BirthOriginRecorded(proofId, group.financialYear, group.zodiac, group.constellation, groupId, calendarHash);
    }

    function _verifyBurnProof(bytes32 proofId, address beneficiary, uint256 amount) private view {
        IKAIOSBurnRecordSource.AlchemyBurnRecord memory record = kaios.alchemyBurnRecord(proofId);
        if (record.owner == address(0) || record.beneficiary != beneficiary || record.furnace == address(0) ||
            record.kaiosBurned == 0 || record.expectedKufo != amount ||
            record.expectedKufo != record.kaiosBurned * KUFO_PER_KAIOS ||
            record.destinationCode != DESTINATION_168888 || record.blockNumber == 0 ||
            record.blockNumber > block.number || record.timestamp == 0 || record.timestamp > block.timestamp) revert InvalidLineageProof(proofId);
        IAlchemyFurnaceProofSource furnace = IAlchemyFurnaceProofSource(record.furnace);
        if (furnace.canonicalKufo() != address(this) || furnace.kaios() != address(kaios) ||
            furnace.organRegistry() != address(organRegistry)) revert InvalidLineageProof(proofId);
        IAlchemyFurnaceProofSource.Proof memory source = furnace.proof(proofId);
        if (!source.consumed || source.owner != record.owner || source.beneficiary != beneficiary ||
            source.kaiosBurned != record.kaiosBurned || source.kufoAmount != amount ||
            source.lifeId != record.lifeId || source.destinationCode != record.destinationCode ||
            uint256(source.createdAt) != record.timestamp) revert InvalidLineageProof(proofId);
    }

    function mintOrigin(bytes32 proofId) external view returns (MintOrigin memory) { return _mintOrigins[proofId]; }
    function carrierBurnRecord(bytes32 proofId) external view returns (CarrierBurnRecord memory) { return _carrierBurnRecords[proofId]; }
    function calendarBoundary(uint256 index) external view returns (uint64) { return _yearStarts[index]; }
    function groupCount() external view returns (uint256) { return _groups.length; }
    function groupMetadata(uint256 id) external view returns (GroupMetadata memory) { return _groups[_groupIndex(id)]; }
    function birthGroup(address owner, uint256 id) external view returns (Cohort memory) { _groupIndex(id); return _birthGroups[owner][id]; }
    function birthGroupAt(uint256 timestamp) external view returns (uint256 id, GroupMetadata memory metadata) {
        id = _groupAt(timestamp);
        metadata = _groups[id - 1];
    }
    // Compatibility view: a year aggregates, and never rewrites, its birth groups.
    function cohort(address owner, uint32 year) external view returns (Cohort memory result) {
        _issuanceIndex(year);
        for (uint256 i; i < _groups.length; ++i) if (_groups[i].financialYear == year) {
            Cohort storage item = _birthGroups[owner][i + 1];
            result.first += item.first; result.second += item.second; result.terminal += item.terminal;
        }
    }
    function currentYear() public view returns (uint32) {
        uint256 index;
        uint256 last = _yearStarts.length - 1;
        while (index < last && block.timestamp >= _yearStarts[index + 1]) ++index;
        return uint32(uint256(firstBirthYear) + index);
    }
    function currentAnnualStage(uint32 year) public view returns (uint8) { return _annualStage(_issuanceIndex(year)); }
    function claimableDecay(address owner, uint32 year) public view returns (uint256 amount) {
        uint8 stage = currentAnnualStage(year);
        for (uint256 i; i < _groups.length; ++i) if (_groups[i].financialYear == year) amount += _claimable(_birthGroups[owner][i + 1], stage);
    }
    function claimableTotal(address owner) external view returns (uint256 amount) {
        for (uint256 i; i < _groups.length; ++i) amount += _claimable(_birthGroups[owner][i + 1], _annualStage(uint256(_groups[i].financialYear) - firstBirthYear));
    }
    function activeCohortCount(address owner) external view returns (uint256 count) {
        uint32 counted;
        for (uint256 i; i < _groups.length; ++i) {
            Cohort storage item = _birthGroups[owner][i + 1];
            uint32 year = _groups[i].financialYear;
            if (year != counted && item.first + item.second + item.terminal != 0) { ++count; counted = year; }
        }
    }
    function activeGroupCount(address owner) external view returns (uint256 count) {
        for (uint256 i; i < _groups.length; ++i) {
            Cohort storage item = _birthGroups[owner][i + 1];
            if (item.first + item.second + item.terminal != 0) ++count;
        }
    }

    function transferGroups(address to, uint256 amount, uint256[] calldata ids) external returns (bool) {
        _validateSelection(ids);
        _moveSelected(_msgSender(), to, amount, ids);
        _selectedTransfer = true;
        _transfer(_msgSender(), to, amount);
        _selectedTransfer = false;
        return true;
    }
    function transferFromGroups(address from, address to, uint256 amount, uint256[] calldata ids) external returns (bool) {
        _validateSelection(ids);
        _spendAllowance(from, _msgSender(), amount);
        _moveSelected(from, to, amount, ids);
        _selectedTransfer = true;
        _transfer(from, to, amount);
        _selectedTransfer = false;
        return true;
    }
    function burnForCarrier(address owner, address beneficiary, uint256 amount, bytes32 proofId)
        external returns (uint256)
    {
        _authorizeBurn(owner, beneficiary, amount, proofId);
        uint256 remaining = amount;
        uint256 available;
        uint256 touched;
        for (uint256 i; i < _groups.length && remaining != 0; ++i) {
            uint8 stage = _annualStage(uint256(_groups[i].financialYear) - firstBirthYear);
            uint256 claimable = _claimable(_birthGroups[owner][i + 1], stage);
            if (claimable == 0) continue;
            if (++touched > MAX_BATCH_GROUPS) revert GroupBatchRequired(MAX_BATCH_GROUPS);
            available += claimable;
            uint256 take = Math.min(claimable, remaining);
            _takeConversion(owner, beneficiary, i + 1, take, stage);
            remaining -= take;
        }
        if (remaining != 0) revert InsufficientMaturedDecay(owner, amount, available);
        return _finishBurn(owner, beneficiary, amount, proofId);
    }
    function burnForCarrierGroups(address owner, address beneficiary, uint256 amount, bytes32 proofId, uint256[] calldata ids)
        external returns (uint256)
    {
        _validateSelection(ids);
        _authorizeBurn(owner, beneficiary, amount, proofId);
        uint256 remaining = amount;
        uint256 available;
        for (uint256 i; i < ids.length && remaining != 0; ++i) {
            uint256 id = ids[i];
            uint8 stage = _annualStage(uint256(_groups[id - 1].financialYear) - firstBirthYear);
            uint256 claimable = _claimable(_birthGroups[owner][id], stage);
            available += claimable;
            uint256 take = Math.min(claimable, remaining);
            if (take != 0) _takeConversion(owner, beneficiary, id, take, stage);
            remaining -= take;
        }
        if (remaining != 0) revert InsufficientMaturedDecay(owner, amount, available);
        return _finishBurn(owner, beneficiary, amount, proofId);
    }
    function _authorizeBurn(address owner, address beneficiary, uint256 amount, bytes32 proofId) private view {
        address converter = organRegistry.organ(ORGAN_KSHIP_CONVERTER);
        if (msg.sender != converter || converter == address(0)) revert OnlyCurrentKshipConverter(msg.sender);
        if (owner == address(0) || beneficiary == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (_carrierBurnRecords[proofId].owner != address(0)) revert ProofAlreadyUsed(proofId);
        uint256 approved = allowance(owner, msg.sender);
        if (approved < amount) revert InsufficientHolderAllowance(approved, amount);
    }
    function _finishBurn(address owner, address beneficiary, uint256 amount, bytes32 proofId) private returns (uint256 expectedKship) {
        expectedKship = amount * KSHIP_PER_KUFO;
        _spendAllowance(owner, msg.sender, amount);
        _carrierBurnRecords[proofId] = CarrierBurnRecord(owner, beneficiary, msg.sender, amount, expectedKship);
        totalDecayedForKship += amount;
        _decayBurn = true;
        _burn(owner, amount);
        _decayBurn = false;
        emit CarrierBurnRecorded(proofId, owner, beneficiary, msg.sender, amount, expectedKship);
    }
    function _takeConversion(address owner, address beneficiary, uint256 id, uint256 take, uint8 stage) private {
        Cohort storage item = _birthGroups[owner][id];
        uint256 unpaid = take;
        if (stage >= 1) { uint256 first = Math.min(item.first, unpaid); item.first -= first; unpaid -= first; }
        if (stage >= 2) { uint256 second = Math.min(item.second, unpaid); item.second -= second; unpaid -= second; }
        if (stage == 3) item.terminal -= unpaid;
        emit AnnualConversion(id, _groups[id - 1].financialYear, owner, beneficiary, take, take * KSHIP_PER_KUFO, stage);
    }
    function conservationInvariantHolds() external view returns (bool) { return totalSupply() + totalDecayedForKship == totalMintedFromAlchemy; }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Capped) {
        if (from != address(0) && to != address(0) && from != to && !_selectedTransfer) _moveAll(from, to, value);
        if (to == address(0) && !_decayBurn) revert LineageBalanceMismatch(from, value);
        super._update(from, to, value);
    }
    function _moveAll(address from, address to, uint256 amount) private {
        uint256 remaining = amount;
        uint256 touched;
        for (uint256 i; i < _groups.length && remaining != 0; ++i) {
            Cohort storage source = _birthGroups[from][i + 1];
            uint256 live = source.first + source.second + source.terminal;
            if (live == 0) continue;
            if (++touched > MAX_BATCH_GROUPS) revert GroupBatchRequired(MAX_BATCH_GROUPS);
            uint256 take = Math.min(live, remaining);
            _moveOne(from, to, i + 1, take, live);
            remaining -= take;
        }
        if (remaining != 0) revert LineageBalanceMismatch(from, remaining);
    }
    function _moveSelected(address from, address to, uint256 amount, uint256[] calldata ids) private {
        if (from == to) return;
        uint256 remaining = amount;
        for (uint256 i; i < ids.length && remaining != 0; ++i) {
            uint256 id = ids[i];
            Cohort storage source = _birthGroups[from][id];
            uint256 live = source.first + source.second + source.terminal;
            uint256 take = Math.min(live, remaining);
            if (take != 0) _moveOne(from, to, id, take, live);
            remaining -= take;
        }
        if (remaining != 0) revert LineageBalanceMismatch(from, remaining);
    }
    function _moveOne(address from, address to, uint256 id, uint256 take, uint256 live) private {
        Cohort storage source = _birthGroups[from][id];
        uint256 first = Math.mulDiv(source.first, take, live);
        uint256 firstAndSecond = Math.mulDiv(source.first + source.second, take, live);
        uint256 second = firstAndSecond - first;
        uint256 terminal = take - firstAndSecond;
        source.first -= first; source.second -= second; source.terminal -= terminal;
        Cohort storage target = _birthGroups[to][id];
        target.first += first; target.second += second; target.terminal += terminal;
        emit CohortTransferred(from, to, id, first, second, terminal);
    }
    function _validateSelection(uint256[] calldata ids) private view {
        if (ids.length == 0 || ids.length > MAX_BATCH_GROUPS) revert InvalidGroupSelection();
        uint256 previous;
        for (uint256 i; i < ids.length; ++i) {
            if (ids[i] <= previous || ids[i] > _groups.length) revert InvalidGroupSelection();
            previous = ids[i];
        }
    }
    function _groupIndex(uint256 id) private view returns (uint256) {
        if (id == 0 || id > _groups.length) revert UnknownBirthGroup(id);
        return id - 1;
    }
    function _groupAt(uint256 timestamp) private view returns (uint256) {
        if (timestamp < _yearStarts[0] || timestamp >= _yearStarts[issuanceCohorts]) revert IssuanceCalendarClosed(timestamp);
        uint256 low;
        uint256 high = _groups.length;
        while (low < high) {
            uint256 middle = (low + high) / 2;
            if (timestamp >= _groups[middle].end) low = middle + 1; else high = middle;
        }
        return low + 1;
    }
    function _issuanceIndex(uint32 year) private view returns (uint256 index) {
        if (year < firstBirthYear) revert UnknownBirthYear(year);
        index = uint256(year) - firstBirthYear;
        if (index >= issuanceCohorts) revert UnknownBirthYear(year);
    }
    function _annualStage(uint256 index) private view returns (uint8) {
        if (block.timestamp < _yearStarts[index + 1]) return 0;
        if (block.timestamp < _yearStarts[index + 2]) return 1;
        if (block.timestamp < _yearStarts[index + 3]) return 2;
        return 3;
    }
    function _claimable(Cohort storage item, uint8 stage) private view returns (uint256) {
        return (stage >= 1 ? item.first : 0) + (stage >= 2 ? item.second : 0) + (stage == 3 ? item.terminal : 0);
    }
}
