// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
// Engineering continuation 2026-11-14: deterministic monthly calendar candidate.
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
 * @notice Burn-backed KUFO with immutable civil-month birth groups.
 * @dev Adopted UTC+8 and whole-month stars are strictly validated; activation
 * is an explicit deployment parameter. Dates need no future calendar tables.
 * Representation bounds stop new issuance, never settlement of existing rights.
 */
contract KUFO is ERC20, ERC20Capped {
    bytes32 public constant ORGAN_OUTPUT_168888 = keccak256("KAIOS.ORGAN.KUFO.OUTPUT.168888");
    bytes32 public constant ORGAN_KSHIP_CONVERTER = keccak256("KAIOS.ORGAN.KSHIP.CONVERTER");
    bytes32 public constant DESTINATION_168888 = keccak256("KAIOS.POINT.168888.JINDOUYUN.KUFO.OUTLET");
    // World entry point only; the ERC20 address is distinct from the furnace.
    uint256 public constant TOKEN_POINT_18911 = 18_911;
    uint256 public constant OUTPUT_POINT_168888 = 168_888;
    uint256 public constant KUFO_PER_KAIOS = 1_000;
    uint256 public constant KSHIP_PER_KUFO = 1_000;
    uint256 public constant MAX_SUPPLY = 72_000_000_000_000 ether;
    uint256 public constant MAX_FINANCIAL_YEAR = uint256(type(uint32).max) - 3;
    uint256 public constant MAX_BATCH_GROUPS = 32;

    struct CalendarConfig {
        bytes32 version;
        uint64 activationTime;
        int32 utcOffsetSeconds;
        uint8[12] constellationByMonth;
    }
    // Calculated from the month ID, never prewritten for future years.
    struct GroupMetadata {
        uint64 start;
        uint64 end;
        uint32 financialYear;
        uint8 month;
        uint8 tierId;
        uint8 constellation;
    }
    struct Cohort { uint256 first; uint256 second; uint256 terminal; }
    struct MintOrigin {
        address beneficiary;
        uint256 amount;
        uint64 bornAt;
        uint32 birthYear;
        uint8 birthMonth;
        uint8 birthTierId;
        uint8 birthConstellation;
        uint32 groupId;
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
    uint8 public immutable firstBirthMonth;
    uint64 public immutable activationTime;
    int32 public immutable utcOffsetSeconds;
    uint32 public immutable maximumGroupId;
    uint8[12] private _constellationByMonth;
    mapping(address => mapping(uint256 => Cohort)) private _birthGroups;
    mapping(address => mapping(uint32 => Cohort)) private _yearCohorts;
    mapping(address => uint256) private _heldGroupCount;
    mapping(address => uint256) private _heldYearCount;
    // Four sparse 256-way levels cover every nonzero uint32 group ID. Finding
    // an active successor never scans the global calendar or empty history.
    mapping(address => mapping(uint256 => uint256)) private _heldBits0;
    mapping(address => mapping(uint256 => uint256)) private _heldBits1;
    mapping(address => mapping(uint256 => uint256)) private _heldBits2;
    mapping(address => uint256) private _heldBits3;
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
    error InvalidCalendarTimestamp();
    error CalendarIdentifierOverflow();
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
    error InvalidPageLimit();

    event ImmediateAlchemyMinted(bytes32 indexed proofId, uint256 indexed groupId, address indexed beneficiary, uint256 kufoAmount, uint64 bornAt);
    event BirthOriginRecorded(bytes32 indexed proofId, uint32 indexed birthYear, uint8 month, uint8 tierId, uint8 constellation, uint256 groupId, bytes32 calendarHash);
    event CohortTransferred(address indexed from, address indexed to, uint256 indexed groupId, uint256 first, uint256 second, uint256 terminal);
    event AnnualConversion(uint256 indexed groupId, uint32 indexed birthYear, address indexed owner, address beneficiary, uint256 kufoBurned, uint256 expectedKship, uint8 stage);
    event CarrierBurnRecorded(bytes32 indexed proofId, address indexed owner, address indexed beneficiary, address converter, uint256 kufoBurned, uint256 expectedKship);
    event CalendarConfigured(bytes32 indexed calendarHash, bytes32 version, uint64 activationTime, int32 utcOffsetSeconds);

    constructor(address registry, address kaiosToken, CalendarConfig memory cfg)
        ERC20("KUFO", "KUFO") ERC20Capped(MAX_SUPPLY)
    {
        if (registry == address(0) || kaiosToken == address(0)) revert ZeroAddress();
        if (registry.code.length == 0) revert NotAContract(registry);
        if (kaiosToken.code.length == 0) revert NotAContract(kaiosToken);
        if (IKAIOSBurnRecordSource(kaiosToken).ORGAN_REGISTRY() != registry) revert CanonicalBindingMismatch();
        _validateCalendarConfig(cfg);
        (uint256 firstYear, uint256 firstMonth,) = _civilDate(cfg.activationTime, cfg.utcOffsetSeconds);
        if (firstYear > MAX_FINANCIAL_YEAR) revert CalendarIdentifierOverflow();
        organRegistry = IKAIOSOrganRegistry(registry);
        kaios = IKAIOSBurnRecordSource(kaiosToken);
        calendarVersion = cfg.version;
        calendarHash = keccak256(abi.encode(cfg.version, cfg.activationTime, cfg.utcOffsetSeconds, cfg.constellationByMonth));
        activationTime = cfg.activationTime;
        utcOffsetSeconds = cfg.utcOffsetSeconds;
        _constellationByMonth = cfg.constellationByMonth;
        firstBirthYear = uint32(firstYear);
        firstBirthMonth = uint8(firstMonth);
        maximumGroupId = uint32(Math.min(type(uint32).max, (MAX_FINANCIAL_YEAR - firstYear + 1) * 12));
        emit CalendarConfigured(calendarHash, cfg.version, cfg.activationTime, cfg.utcOffsetSeconds);
    }

    function _validateCalendarConfig(CalendarConfig memory cfg) private pure {
        if (cfg.version == bytes32(0) || cfg.activationTime == 0 ||
            cfg.utcOffsetSeconds < -12 hours || cfg.utcOffsetSeconds > 14 hours ||
            cfg.utcOffsetSeconds % 60 != 0 || cfg.utcOffsetSeconds != 8 hours) revert InvalidCalendar();
        uint256 seen;
        for (uint256 i; i < 12; ++i) {
            uint8 value = cfg.constellationByMonth[i];
            if (value == 0 || value > 12 || (seen & (uint256(1) << value)) != 0) revert InvalidCalendar();
            // Human adopted whole civil months: January Capricorn(10) through
            // December Sagittarius(9), using this candidate's Aries(1)..Pisces(12) IDs.
            if (value != (i + 9) % 12 + 1) revert InvalidCalendar();
            seen |= uint256(1) << value;
        }
        // Validate signed local-time conversion before any narrowing cast.
        _civilDate(cfg.activationTime, cfg.utcOffsetSeconds);
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
        GroupMetadata memory group = _metadata(groupId);
        uint256 first = amount / 2;
        uint256 firstAndSecond = Math.mulDiv(amount, 3, 4);
        _creditGroup(beneficiary, groupId, first, firstAndSecond - first, amount - firstAndSecond);
        proofMinted[proofId] = true;
        totalMintedFromAlchemy += amount;
        bytes32 groupHash = groupCalendarHash(groupId);
        _mintOrigins[proofId] = MintOrigin(beneficiary, amount, uint64(block.timestamp), group.financialYear,
            group.month, group.tierId, group.constellation, uint32(groupId), groupHash);
        _mint(beneficiary, amount);
        emit ImmediateAlchemyMinted(proofId, groupId, beneficiary, amount, uint64(block.timestamp));
        emit BirthOriginRecorded(proofId, group.financialYear, group.month, group.tierId, group.constellation, groupId, groupHash);
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
    function calendarConfig() external view returns (CalendarConfig memory) {
        return CalendarConfig(calendarVersion, activationTime, utcOffsetSeconds, _constellationByMonth);
    }
    function constellationByMonth(uint8 month) external view returns (uint8) {
        if (month == 0 || month > 12) revert InvalidCalendar();
        return _constellationByMonth[month - 1];
    }
    function civilDate(uint256 timestamp) external view returns (uint32 year, uint8 month, uint8 day) {
        (uint256 y, uint256 m, uint256 d) = _civilDate(timestamp, utcOffsetSeconds);
        if (y > type(uint32).max) revert CalendarIdentifierOverflow();
        return (uint32(y), uint8(m), uint8(d));
    }
    // Local January 1, not a table entry. An unrepresentable pre-Unix boundary
    // reverts rather than wrapping into a far-future uint64 timestamp.
    function calendarBoundary(uint256 index) external view returns (uint64) {
        if (index > uint256(type(uint32).max) - firstBirthYear) revert CalendarIdentifierOverflow();
        return _checkedTimestamp(_monthStart(uint256(firstBirthYear) + index, 1));
    }
    // Virtual month-ID upper bound through now, not the number of minted groups.
    // It saturates at the representation limit so existing rights stay movable.
    function groupCount() public view returns (uint256) {
        if (block.timestamp < activationTime) return 0;
        (uint256 year, uint256 month,) = _civilDate(block.timestamp, utcOffsetSeconds);
        return Math.min(maximumGroupId, (year - firstBirthYear) * 12 + month);
    }
    // Metadata may be previewed for future, representable month IDs. Possession
    // and selected mutations separately reject future or pre-activation IDs.
    function groupMetadata(uint256 id) external view returns (GroupMetadata memory) { return _metadata(id); }
    function groupCalendarHash(uint256 id) public view returns (bytes32) {
        _checkGroupRange(id);
        return calendarHash;
    }
    function birthGroup(address owner, uint256 id) external view returns (Cohort memory) { _groupIndex(id); return _birthGroups[owner][id]; }
    function birthGroupAt(uint256 timestamp) external view returns (uint256 id, GroupMetadata memory metadata) {
        id = _groupAt(timestamp);
        metadata = _metadata(id);
    }
    // A derived aggregate is updated in the same atomic mutation as every group.
    function cohort(address owner, uint32 year) external view returns (Cohort memory result) {
        _checkYear(year);
        return _yearCohorts[owner][year];
    }
    function currentYear() public view returns (uint32) {
        uint256 year = _currentCivilYear();
        if (year > type(uint32).max) revert CalendarIdentifierOverflow();
        return uint32(year);
    }
    function currentAnnualStage(uint32 year) public view returns (uint8) {
        _checkYear(year);
        return _annualStage(year, _currentCivilYear());
    }
    function claimableDecay(address owner, uint32 year) public view returns (uint256 amount) {
        return _claimable(_yearCohorts[owner][year], currentAnnualStage(year));
    }
    function claimableTotal(address owner) external view returns (uint256 amount) {
        if (_heldGroupCount[owner] > MAX_BATCH_GROUPS) revert GroupBatchRequired(MAX_BATCH_GROUPS);
        uint256 id = _nextHeld(owner, 0);
        uint256 examined;
        uint256 asOfYear = _currentCivilYear();
        while (id != 0) {
            if (++examined > MAX_BATCH_GROUPS) revert GroupBatchRequired(MAX_BATCH_GROUPS);
            amount += _claimable(_birthGroups[owner][id], _annualStage(_groupYear(id), asOfYear));
            id = _nextHeld(owner, id);
        }
    }
    function activeCohortCount(address owner) external view returns (uint256 count) {
        return _heldYearCount[owner];
    }
    function activeGroupCount(address owner) external view returns (uint256 count) {
        return _heldGroupCount[owner];
    }
    function heldGroups(address owner, uint256 afterId, uint256 limit) external view returns (uint256[] memory ids) {
        if (limit == 0 || limit > MAX_BATCH_GROUPS) revert InvalidPageLimit();
        ids = new uint256[](limit);
        uint256 count;
        uint256 id = _nextHeld(owner, afterId);
        while (id != 0 && count < limit) {
            ids[count++] = id;
            id = _nextHeld(owner, id);
        }
        assembly ("memory-safe") { mstore(ids, count) }
    }
    function claimableForGroups(address owner, uint256[] calldata ids) external view returns (uint256 amount) {
        _validateSelection(ids);
        uint256 asOfYear = _currentCivilYear();
        for (uint256 i; i < ids.length; ++i) {
            uint256 id = ids[i];
            amount += _claimable(_birthGroups[owner][id], _annualStage(_groupYear(id), asOfYear));
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
        uint256 examined;
        uint256 id = _nextHeld(owner, 0);
        uint256 asOfYear = _currentCivilYear();
        while (id != 0 && remaining != 0) {
            if (++examined > MAX_BATCH_GROUPS) revert GroupBatchRequired(MAX_BATCH_GROUPS);
            uint8 stage = _annualStage(_groupYear(id), asOfYear);
            uint256 claimable = _claimable(_birthGroups[owner][id], stage);
            available += claimable;
            uint256 take = Math.min(claimable, remaining);
            if (take != 0) _takeConversion(owner, beneficiary, id, take, stage);
            remaining -= take;
            if (remaining != 0) id = _nextHeld(owner, id);
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
        uint256 asOfYear = _currentCivilYear();
        for (uint256 i; i < ids.length && remaining != 0; ++i) {
            uint256 id = ids[i];
            uint8 stage = _annualStage(_groupYear(id), asOfYear);
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
        uint256 first;
        uint256 second;
        if (stage >= 1) { first = Math.min(item.first, unpaid); unpaid -= first; }
        if (stage >= 2) { second = Math.min(item.second, unpaid); unpaid -= second; }
        _debitGroup(owner, id, first, second, stage == 3 ? unpaid : 0);
        emit AnnualConversion(id, _groupYear(id), owner, beneficiary, take, take * KSHIP_PER_KUFO, stage);
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
        uint256 id = _nextHeld(from, 0);
        while (id != 0 && remaining != 0) {
            Cohort storage source = _birthGroups[from][id];
            uint256 live = source.first + source.second + source.terminal;
            if (++touched > MAX_BATCH_GROUPS) revert GroupBatchRequired(MAX_BATCH_GROUPS);
            uint256 take = Math.min(live, remaining);
            _moveOne(from, to, id, take, live);
            remaining -= take;
            if (remaining != 0) id = _nextHeld(from, id);
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
        _debitGroup(from, id, first, second, terminal);
        _creditGroup(to, id, first, second, terminal);
        emit CohortTransferred(from, to, id, first, second, terminal);
    }
    function _creditGroup(address owner, uint256 id, uint256 first, uint256 second, uint256 terminal) private {
        Cohort storage item = _birthGroups[owner][id];
        bool emptyGroup = item.first + item.second + item.terminal == 0;
        item.first += first; item.second += second; item.terminal += terminal;
        if (emptyGroup) {
            _setHeld(owner, id);
            ++_heldGroupCount[owner];
        }
        uint32 year = _groupYear(id);
        Cohort storage annual = _yearCohorts[owner][year];
        bool emptyYear = annual.first + annual.second + annual.terminal == 0;
        annual.first += first; annual.second += second; annual.terminal += terminal;
        if (emptyYear) ++_heldYearCount[owner];
    }
    function _debitGroup(address owner, uint256 id, uint256 first, uint256 second, uint256 terminal) private {
        Cohort storage item = _birthGroups[owner][id];
        item.first -= first; item.second -= second; item.terminal -= terminal;
        if (item.first + item.second + item.terminal == 0) {
            _clearHeld(owner, id);
            --_heldGroupCount[owner];
        }
        uint32 year = _groupYear(id);
        Cohort storage annual = _yearCohorts[owner][year];
        annual.first -= first; annual.second -= second; annual.terminal -= terminal;
        if (annual.first + annual.second + annual.terminal == 0) --_heldYearCount[owner];
    }

    // Internal visibility permits a test-only derived actor to exercise all
    // uint32 bit boundaries without creating millions of calendar records.
    function _setHeld(address owner, uint256 id) internal {
        if (id == 0 || id > type(uint32).max) revert UnknownBirthGroup(id);
        uint256 leaf = id >> 8;
        uint256 mask = uint256(1) << (id & 255);
        uint256 word = _heldBits0[owner][leaf];
        assert((word & mask) == 0);
        _heldBits0[owner][leaf] = word | mask;
        // Successor search reads global zero branches directly before ascending;
        // it never descends to them via a parent's bit0. Do not store redundant
        // ancestors for those branches (global index0, not every low-byte0).
        if (word != 0 || leaf == 0) return;
        uint256 page1 = leaf >> 8;
        mask = uint256(1) << (leaf & 255);
        word = _heldBits1[owner][page1];
        _heldBits1[owner][page1] = word | mask;
        if (word != 0 || page1 == 0) return;
        uint256 page2 = page1 >> 8;
        mask = uint256(1) << (page1 & 255);
        word = _heldBits2[owner][page2];
        _heldBits2[owner][page2] = word | mask;
        if (word != 0 || page2 == 0) return;
        _heldBits3[owner] |= uint256(1) << page2;
    }
    function _clearHeld(address owner, uint256 id) internal {
        if (id == 0 || id > type(uint32).max) revert UnknownBirthGroup(id);
        uint256 leaf = id >> 8;
        uint256 mask = uint256(1) << (id & 255);
        uint256 previous = _heldBits0[owner][leaf];
        assert((previous & mask) != 0);
        uint256 word = previous & ~mask;
        _heldBits0[owner][leaf] = word;
        if (word != 0 || leaf == 0) return;
        uint256 page1 = leaf >> 8;
        mask = uint256(1) << (leaf & 255);
        word = _heldBits1[owner][page1] & ~mask;
        _heldBits1[owner][page1] = word;
        if (word != 0 || page1 == 0) return;
        uint256 page2 = page1 >> 8;
        mask = uint256(1) << (page1 & 255);
        word = _heldBits2[owner][page2] & ~mask;
        _heldBits2[owner][page2] = word;
        if (word != 0 || page2 == 0) return;
        _heldBits3[owner] &= ~(uint256(1) << page2);
    }
    function _lowestBit(uint256 word) private pure returns (uint256) {
        assert(word != 0);
        return Math.log2(word & (~word + 1));
    }
    function _firstFromPage1(address owner, uint256 page1, uint256 word) private view returns (uint256) {
        uint256 leaf = (page1 << 8) | _lowestBit(word);
        return (leaf << 8) | _lowestBit(_heldBits0[owner][leaf]);
    }
    function _firstFromPage2(address owner, uint256 page2, uint256 word) private view returns (uint256) {
        uint256 page1 = (page2 << 8) | _lowestBit(word);
        return _firstFromPage1(owner, page1, _heldBits1[owner][page1]);
    }
    function _nextHeld(address owner, uint256 afterId) internal view returns (uint256) {
        if (afterId >= type(uint32).max) return 0;
        uint256 target = afterId + 1;
        uint256 leaf = target >> 8;
        uint256 word = _heldBits0[owner][leaf] & (type(uint256).max << (target & 255));
        if (word != 0) return (leaf << 8) | _lowestBit(word);
        uint256 nextLeaf = leaf + 1;
        if (nextLeaf > 0xffffff) return 0;
        uint256 page1 = nextLeaf >> 8;
        word = _heldBits1[owner][page1] & (type(uint256).max << (nextLeaf & 255));
        if (word != 0) return _firstFromPage1(owner, page1, word);
        uint256 nextPage1 = page1 + 1;
        if (nextPage1 > 0xffff) return 0;
        uint256 page2 = nextPage1 >> 8;
        word = _heldBits2[owner][page2] & (type(uint256).max << (nextPage1 & 255));
        if (word != 0) return _firstFromPage2(owner, page2, word);
        uint256 nextPage2 = page2 + 1;
        if (nextPage2 > 0xff) return 0;
        word = _heldBits3[owner] & (type(uint256).max << nextPage2);
        if (word == 0) return 0;
        page2 = _lowestBit(word);
        return _firstFromPage2(owner, page2, _heldBits2[owner][page2]);
    }
    function _validateSelection(uint256[] calldata ids) private view {
        if (ids.length == 0 || ids.length > MAX_BATCH_GROUPS) revert InvalidGroupSelection();
        uint256 count = groupCount();
        uint256 previous;
        for (uint256 i; i < ids.length; ++i) {
            if (ids[i] <= previous || ids[i] < firstBirthMonth || ids[i] > count) revert InvalidGroupSelection();
            previous = ids[i];
        }
    }
    function _groupIndex(uint256 id) private view returns (uint256) {
        _checkGroupRange(id);
        if (id > groupCount()) revert UnknownBirthGroup(id);
        return id - 1;
    }
    function _checkGroupRange(uint256 id) private view {
        if (id < firstBirthMonth || id > maximumGroupId) revert UnknownBirthGroup(id);
    }
    function _groupYear(uint256 id) private view returns (uint32) {
        _checkGroupRange(id);
        // maximumGroupId was bounded by MAX_FINANCIAL_YEAR in the constructor.
        return uint32(uint256(firstBirthYear) + (id - 1) / 12);
    }
    function _metadata(uint256 id) private view returns (GroupMetadata memory) {
        uint32 year = _groupYear(id);
        uint8 month = uint8((id - 1) % 12 + 1);
        int256 start = _monthStart(year, month);
        int256 active = int256(uint256(activationTime));
        if (start < active) start = active;
        int256 end = month == 12 ? _monthStart(uint256(year) + 1, 1) : _monthStart(year, uint256(month) + 1);
        return GroupMetadata(_checkedTimestamp(start), _checkedTimestamp(end), year, month, month,
            _constellationByMonth[month - 1]);
    }
    function _groupAt(uint256 timestamp) private view returns (uint256) {
        if (timestamp < activationTime) revert IssuanceCalendarClosed(timestamp);
        (uint256 year, uint256 month,) = _civilDate(timestamp, utcOffsetSeconds);
        if (year < firstBirthYear) revert IssuanceCalendarClosed(timestamp);
        if (year > MAX_FINANCIAL_YEAR) revert CalendarIdentifierOverflow();
        uint256 id = (year - firstBirthYear) * 12 + month;
        if (id > maximumGroupId) revert CalendarIdentifierOverflow();
        return id;
    }
    function _checkYear(uint32 year) private view {
        if (year < firstBirthYear || year > _groupYear(maximumGroupId)) revert UnknownBirthYear(year);
    }
    function _annualStage(uint256 birthYear, uint256 asOfYear) private pure returns (uint8) {
        if (asOfYear <= birthYear) return 0;
        return uint8(Math.min(3, asOfYear - birthYear));
    }
    function _currentCivilYear() private view returns (uint256 year) {
        (year,,) = _civilDate(block.timestamp, utcOffsetSeconds);
    }
    // Gregorian civil_from_days, March-based 400-year eras. Source algorithm:
    // https://howardhinnant.github.io/date_algorithms.html#civil_from_days
    // Work is constant with respect to elapsed years; all math is wide before
    // explicit public-ID guards. No Date API, oracle, year table or float.
    function _civilDate(uint256 timestamp, int32 offset) private pure returns (uint256 year, uint256 month, uint256 day) {
        if (timestamp > type(uint64).max) revert InvalidCalendarTimestamp();
        int256 local = int256(timestamp) + int256(offset);
        if (local < 0) revert InvalidCalendarTimestamp();
        uint256 z = uint256(local) / 1 days + 719468;
        uint256 era = z / 146097;
        uint256 doe = z - era * 146097;
        uint256 yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
        year = yoe + era * 400;
        uint256 doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
        uint256 mp = (5 * doy + 2) / 153;
        day = doy - (153 * mp + 2) / 5 + 1;
        month = mp < 10 ? mp + 3 : mp - 9;
        if (month <= 2) ++year;
    }
    // Inverse days_from_civil for the first of a month. Signed conversion is
    // intentional: local January1970 with a positive offset begins before Unix.
    // Only the activation month's start may be clipped to activationTime.
    function _monthStart(uint256 year, uint256 month) private view returns (int256) {
        uint256 y = month <= 2 ? year - 1 : year;
        uint256 era = y / 400;
        uint256 yoe = y - era * 400;
        uint256 mp = month > 2 ? month - 3 : month + 9;
        uint256 doy = (153 * mp + 2) / 5;
        uint256 doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
        int256 daysSinceUnix = int256(era * 146097 + doe) - 719468;
        return daysSinceUnix * 1 days - int256(utcOffsetSeconds);
    }
    function _checkedTimestamp(int256 timestamp) private pure returns (uint64) {
        if (timestamp < 0 || uint256(timestamp) > type(uint64).max) revert InvalidCalendarTimestamp();
        return uint64(uint256(timestamp));
    }
    function _claimable(Cohort storage item, uint8 stage) private view returns (uint256) {
        return (stage >= 1 ? item.first : 0) + (stage >= 2 ? item.second : 0) + (stage == 3 ? item.terminal : 0);
    }
}
