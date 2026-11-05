// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

/**
 * @title KUFOV4
 * @notice Review candidate: immediate KUFO output and shared annual-cohort Three-Autumn conversion.
 * @dev Reuses PR #201's undeployed candidate path. Deployed V1 and KAIOS are unchanged.
 *      The versioned calendar is supplied explicitly; this source selects no Gregorian, lunar or
 *      K280 canon. At most 32 immutable issuance years are admitted. No calendar slot is reused.
 *      Three closing boundaries allow the last issuance cohort to mature completely, and terminal
 *      conversion remains available forever. Approving this finite issuance horizon is a deployment
 *      prerequisite. No transfer or mint settles decay; only holder-authorized carrier conversion does.
 *      Remaining first/second/terminal tranches are the sole lineage balance. Mint-proof rounding is
 *      preserved when cohorts merge; transfers conserve every tranche by subtraction. Origin records
 *      retain immutable source metadata even though same-year fungible receipts share one balance.
 */
contract KUFOV4 is ERC20, ERC20Capped {
    string public constant VERSION = "4.1.0-candidate";
    bytes32 public constant VERSION_ID = keccak256("KAIOS.KUFO.V4.ANNUAL_COHORT.CANDIDATE");
    bytes32 public constant ORGAN_OUTPUT_168888 = keccak256("KAIOS.ORGAN.KUFO.OUTPUT.168888");
    bytes32 public constant ORGAN_KSHIP_CONVERTER = keccak256("KAIOS.ORGAN.KSHIP.CONVERTER");
    uint256 public constant TOKEN_POINT_511111 = 511_111;
    uint256 public constant OUTPUT_POINT_168888 = 168_888;
    uint256 public constant KSHIP_PER_KUFO = 1_000;
    uint256 public constant MAX_SUPPLY = 72_000_000_000_000 ether;
    uint256 public constant MAX_ISSUANCE_COHORTS = 32;
    uint8 public constant CONSTELLATION_UNCONFIGURED = 0;

    struct Cohort {
        uint256 first;
        uint256 second;
        uint256 terminal;
    }

    struct MintOrigin {
        address beneficiary;
        uint256 amount;
        uint64 bornAt;
        uint32 birthYear;
        uint8 birthZodiac;
        uint8 birthConstellation;
    }

    // The field order deliberately matches existing main KSHIP's proof interface.
    struct CarrierBurnRecord {
        address owner;
        address beneficiary;
        address converter;
        uint256 kufoBurned;
        uint256 expectedKship;
    }

    IKAIOSOrganRegistry public immutable organRegistry;
    bytes32 public immutable calendarVersion;
    bytes32 public immutable calendarHash;
    uint32 public immutable firstBirthYear;
    uint8 public immutable firstBirthZodiac;
    uint8 public immutable issuanceCohorts;
    // Constructor-only writes make these boundaries immutable after creation.
    uint64[] private _yearStarts;
    mapping(address => mapping(uint32 => Cohort)) private _cohorts;
    mapping(bytes32 => MintOrigin) private _mintOrigins;
    mapping(bytes32 => CarrierBurnRecord) private _carrierBurnRecords;
    mapping(bytes32 => bool) public proofMinted;
    uint256 public totalMintedFromAlchemy;
    uint256 public totalDecayedForKship;
    bool private _decayBurn;

    error ZeroAddress();
    error ZeroAmount();
    error InvalidCalendar();
    error IssuanceCalendarClosed(uint256 timestamp);
    error UnknownBirthYear(uint32 birthYear);
    error LifetimeIssuanceExceeded(uint256 requested, uint256 available);
    error OnlyCurrentOutput(address caller);
    error OnlyCurrentKshipConverter(address caller);
    error ProofAlreadyUsed(bytes32 proofId);
    error LineageBalanceMismatch(address owner, uint256 missing);
    error InsufficientMaturedDecay(address owner, uint256 requested, uint256 available);

    event ImmediateAlchemyMinted(bytes32 indexed proofId, uint256 indexed cohortId, address indexed beneficiary, uint256 kufoAmount, uint64 bornAt);
    event BirthOriginRecorded(bytes32 indexed proofId, uint32 indexed birthYear, uint8 birthZodiac, uint8 birthConstellation, bytes32 calendarHash);
    event CohortTransferred(address indexed from, address indexed to, uint32 indexed birthYear, uint256 first, uint256 second, uint256 terminal);
    event ThreeAutumnDecay(uint32 indexed birthYear, address indexed owner, address indexed beneficiary, uint256 kufoBurned, uint256 expectedKship, uint8 autumn);
    event CarrierBurnRecorded(bytes32 indexed proofId, address indexed owner, address indexed beneficiary, address converter, uint256 kufoBurned, uint256 expectedKship);

    constructor(
        address registry,
        bytes32 calendarVersion_,
        uint32 firstBirthYear_,
        uint8 firstBirthZodiac_,
        uint64[] memory yearStarts
    ) ERC20("KUFO Alchemy Mass", "KUFO") ERC20Capped(MAX_SUPPLY) {
        if (registry == address(0)) revert ZeroAddress();
        // N issuance intervals require N+3 boundary timestamps: last birth index N-1,
        // third maturity boundary (N-1)+3 == N+2, the last array element.
        if (
            calendarVersion_ == bytes32(0) || firstBirthYear_ == 0 || firstBirthZodiac_ >= 12 ||
            yearStarts.length < 4 || yearStarts.length > MAX_ISSUANCE_COHORTS + 3 ||
            uint256(firstBirthYear_) + yearStarts.length - 1 > type(uint32).max
        ) revert InvalidCalendar();
        uint64 previous;
        for (uint256 i; i < yearStarts.length; ++i) {
            if (yearStarts[i] <= previous) revert InvalidCalendar();
            previous = yearStarts[i];
            _yearStarts.push(previous);
        }
        organRegistry = IKAIOSOrganRegistry(registry);
        calendarVersion = calendarVersion_;
        calendarHash = keccak256(abi.encode(calendarVersion_, firstBirthYear_, firstBirthZodiac_, yearStarts));
        firstBirthYear = firstBirthYear_;
        firstBirthZodiac = firstBirthZodiac_;
        issuanceCohorts = uint8(yearStarts.length - 3);
    }

    function mintFromImmediateProof(bytes32 proofId, address beneficiary, uint256 amount)
        external returns (uint256 cohortId)
    {
        address output = organRegistry.organ(ORGAN_OUTPUT_168888);
        if (msg.sender != output || output == address(0)) revert OnlyCurrentOutput(msg.sender);
        if (beneficiary == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (proofMinted[proofId]) revert ProofAlreadyUsed(proofId);
        if (block.timestamp < _yearStarts[0] || block.timestamp >= _yearStarts[issuanceCohorts]) {
            revert IssuanceCalendarClosed(block.timestamp);
        }
        // A live-supply cap alone would free new issuance after decay and eventually exceed
        // the fixed KSHIP cap. Reserve lifetime issuance, not merely current circulation.
        if (amount > MAX_SUPPLY - totalMintedFromAlchemy) {
            revert LifetimeIssuanceExceeded(amount, MAX_SUPPLY - totalMintedFromAlchemy);
        }
        uint32 year = currentYear();
        Cohort storage item = _cohorts[beneficiary][year];
        uint256 first = amount / 2;
        uint256 firstAndSecond = Math.mulDiv(amount, 3, 4);
        item.first += first;
        item.second += firstAndSecond - first;
        item.terminal += amount - firstAndSecond;
        proofMinted[proofId] = true;
        totalMintedFromAlchemy += amount;
        _mintOrigins[proofId] = MintOrigin(beneficiary, amount, uint64(block.timestamp), year, birthZodiac(year), CONSTELLATION_UNCONFIGURED);
        _mint(beneficiary, amount);
        // This is a stable calendar cohort identifier, never a new per-receipt lot.
        cohortId = uint256(year) - firstBirthYear + 1;
        emit ImmediateAlchemyMinted(proofId, cohortId, beneficiary, amount, uint64(block.timestamp));
        emit BirthOriginRecorded(proofId, year, birthZodiac(year), CONSTELLATION_UNCONFIGURED, calendarHash);
    }

    function cohort(address owner, uint32 year) external view returns (Cohort memory) {
        _issuanceIndex(year);
        return _cohorts[owner][year];
    }

    function mintOrigin(bytes32 proofId) external view returns (MintOrigin memory) { return _mintOrigins[proofId]; }
    function carrierBurnRecord(bytes32 proofId) external view returns (CarrierBurnRecord memory) { return _carrierBurnRecords[proofId]; }
    function calendarBoundary(uint256 index) external view returns (uint64) { return _yearStarts[index]; }

    /** @notice Before activation reports firstBirthYear; after final boundary clamps forever. */
    function currentYear() public view returns (uint32) {
        uint256 index;
        uint256 last = _yearStarts.length - 1;
        while (index < last && block.timestamp >= _yearStarts[index + 1]) ++index;
        return uint32(uint256(firstBirthYear) + index);
    }

    function birthZodiac(uint32 year) public view returns (uint8) {
        uint256 index = _issuanceIndex(year);
        return uint8((uint256(firstBirthZodiac) + index) % 12);
    }

    function currentAutumn(uint32 year) public view returns (uint8) {
        return _autumn(_issuanceIndex(year));
    }

    function claimableDecay(address owner, uint32 year) public view returns (uint256) {
        uint8 autumn = currentAutumn(year);
        Cohort storage item = _cohorts[owner][year];
        return (autumn >= 1 ? item.first : 0) + (autumn >= 2 ? item.second : 0) + (autumn == 3 ? item.terminal : 0);
    }

    function claimableTotal(address owner) external view returns (uint256 amount) {
        for (uint256 i; i < issuanceCohorts; ++i) {
            amount += claimableDecay(owner, uint32(uint256(firstBirthYear) + i));
        }
    }

    function activeCohortCount(address owner) external view returns (uint256 count) {
        for (uint256 i; i < issuanceCohorts; ++i) {
            Cohort storage item = _cohorts[owner][uint32(uint256(firstBirthYear) + i)];
            if (item.first + item.second + item.terminal != 0) ++count;
        }
    }

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
        for (uint256 i; i < issuanceCohorts && remaining != 0; ++i) {
            uint8 autumn = _autumn(i);
            uint32 year = uint32(uint256(firstBirthYear) + i);
            Cohort storage item = _cohorts[owner][year];
            uint256 claimable = (autumn >= 1 ? item.first : 0) + (autumn >= 2 ? item.second : 0) + (autumn == 3 ? item.terminal : 0);
            available += claimable;
            uint256 take = Math.min(claimable, remaining);
            if (take == 0) continue;
            uint256 unpaid = take;
            if (autumn >= 1) {
                uint256 first = Math.min(item.first, unpaid);
                item.first -= first;
                unpaid -= first;
            }
            if (autumn >= 2) {
                uint256 second = Math.min(item.second, unpaid);
                item.second -= second;
                unpaid -= second;
            }
            if (autumn == 3) item.terminal -= unpaid;
            remaining -= take;
            emit ThreeAutumnDecay(year, owner, beneficiary, take, take * KSHIP_PER_KUFO, autumn);
        }
        if (remaining != 0) revert InsufficientMaturedDecay(owner, kufoAmount, available);

        expectedKship = kufoAmount * KSHIP_PER_KUFO;
        _carrierBurnRecords[carrierProofId] = CarrierBurnRecord(owner, beneficiary, msg.sender, kufoAmount, expectedKship);
        totalDecayedForKship += kufoAmount;
        _decayBurn = true;
        _burn(owner, kufoAmount);
        _decayBurn = false;
        emit CarrierBurnRecorded(carrierProofId, owner, beneficiary, msg.sender, kufoAmount, expectedKship);
    }

    function conservationInvariantHolds() external view returns (bool) {
        return totalSupply() + totalDecayedForKship == totalMintedFromAlchemy;
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Capped) {
        if (from != address(0) && to != address(0) && from != to) _moveCohorts(from, to, value);
        if (to == address(0) && !_decayBurn) revert LineageBalanceMismatch(from, value);
        super._update(from, to, value);
    }

    function _moveCohorts(address from, address to, uint256 amount) private {
        uint256 remaining = amount;
        for (uint256 i; i < issuanceCohorts && remaining != 0; ++i) {
            uint32 year = uint32(uint256(firstBirthYear) + i);
            Cohort storage source = _cohorts[from][year];
            uint256 live = source.first + source.second + source.terminal;
            uint256 take = Math.min(live, remaining);
            if (take == 0) continue;
            // Allocate cumulative targets, then derive each tranche by subtraction. Every
            // child tranche is <= its parent and every parent+child sum is exact, including wei.
            uint256 first = Math.mulDiv(source.first, take, live);
            uint256 firstAndSecond = Math.mulDiv(source.first + source.second, take, live);
            uint256 second = firstAndSecond - first;
            uint256 terminal = take - firstAndSecond;
            source.first -= first;
            source.second -= second;
            source.terminal -= terminal;
            Cohort storage target = _cohorts[to][year];
            target.first += first;
            target.second += second;
            target.terminal += terminal;
            remaining -= take;
            emit CohortTransferred(from, to, year, first, second, terminal);
        }
        if (remaining != 0) revert LineageBalanceMismatch(from, remaining);
    }

    function _issuanceIndex(uint32 year) private view returns (uint256 index) {
        if (year < firstBirthYear) revert UnknownBirthYear(year);
        index = uint256(year) - firstBirthYear;
        if (index >= issuanceCohorts) revert UnknownBirthYear(year);
    }

    function _autumn(uint256 index) private view returns (uint8) {
        if (block.timestamp < _yearStarts[index + 1]) return 0;
        if (block.timestamp < _yearStarts[index + 2]) return 1;
        if (block.timestamp < _yearStarts[index + 3]) return 2;
        return 3;
    }
}
