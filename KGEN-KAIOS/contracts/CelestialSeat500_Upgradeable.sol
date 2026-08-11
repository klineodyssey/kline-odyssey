// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {LingxiaoBankModuleBaseUpgradeable} from "./LingxiaoBankModuleBaseUpgradeable.sol";

/**
 * @title CelestialSeat500_Upgradeable
 * @notice Calendar-month salary rail for at most 500 formal Celestial seats.
 * @dev Salary matures at day 5 00:00 UTC+8. Claims are permissionless to trigger,
 *      but each calendar segment is paid only to its checkpointed beneficiary.
 *      The legacy duration-epoch storage prefix is retained and never used for
 *      calendar accounting.
 */
contract CelestialSeat500_Upgradeable is LingxiaoBankModuleBaseUpgradeable {
    bytes32 public constant MODULE_ID = keccak256("KAIOS.BANK.MODULE.CELESTIAL_SEAT_500");
    uint256 public constant MAX_SEATS = 500;
    uint256 public constant CIVILIZATION_TIME_OFFSET = 8 hours;
    uint256 public constant SALARY_WEIGHT_SCALE = 1_000_000;

    enum SeatStatus { NONE, ACTIVE, SUSPENDED, RETIRED }

    // Storage layout frozen from the duration-epoch candidate. The two legacy
    // fields remain readable for upgrade evidence but are not calendar sources.
    struct Seat {
        bytes32 lifeId;
        bytes32 templeId;
        address beneficiary;
        uint128 salaryPerEpoch;
        uint64 activatedAt;
        uint64 salaryCheckpoint;
        uint256 claimedAmount;
        SeatStatus status;
    }

    struct CalendarSeatState {
        uint32 firstSalaryMonth;
        uint32 lastClaimedMonth;
    }

    struct SalaryBaseCheckpoint {
        uint32 effectiveMonth;
        uint128 salaryBase;
    }

    struct SeatTermsCheckpoint {
        uint32 effectiveMonth;
        uint64 salaryWeightPpm;
        address beneficiary;
    }

    // BEGIN V1 STORAGE PREFIX -- do not reorder or reinterpret.
    uint64 public salaryEpochSeconds;
    uint256 public seatCount;
    uint256 public totalSalaryClaimed;
    mapping(uint256 seatId => Seat) private _seats;
    // END V1 STORAGE PREFIX.

    // Calendar V2 consumes three slots from the former 46-slot reserve.
    SalaryBaseCheckpoint[] private _salaryBaseCheckpoints;
    mapping(uint256 seatId => CalendarSeatState) private _calendarSeats;
    mapping(uint256 seatId => SeatTermsCheckpoint[]) private _seatTermsCheckpoints;

    error InvalidSeat();
    error SeatLimitReached();
    error NoSalaryDue(uint256 seatId);
    error InvalidCivilizationMonth(uint32 monthId);
    error InvalidSalaryBase();
    error InvalidSalaryWeight();
    error CalendarSeatNotInitialized(uint256 seatId);
    error CheckpointNotFuture(uint32 effectiveMonth, uint32 currentMonth);
    error CheckpointOrderInvalid(uint32 previousMonth, uint32 effectiveMonth);

    event SeatConfigured(
        uint256 indexed seatId,
        bytes32 indexed lifeId,
        bytes32 indexed templeId,
        address beneficiary,
        uint256 salaryWeightPpm,
        SeatStatus status
    );
    event SalaryBaseScheduled(uint32 indexed effectiveMonth, uint256 salaryBase);
    event SeatTermsScheduled(
        uint256 indexed seatId,
        uint32 indexed effectiveMonth,
        address indexed beneficiary,
        uint256 salaryWeightPpm
    );
    event SalaryClaimed(
        uint256 indexed seatId,
        address indexed beneficiary,
        uint256 amount,
        uint32 fromMonth,
        uint32 throughMonth,
        address triggeredBy
    );

    function initialize(address bankAddress, address governance, address upgrader, uint128 initialSalaryBase)
        external
        initializer
    {
        if (initialSalaryBase == 0) revert InvalidSalaryBase();
        __LingxiaoBankModule_init(bankAddress, governance, upgrader, MODULE_ID);

        // Explicitly disable the superseded duration source while preserving its slot.
        salaryEpochSeconds = 0;
        uint32 currentMonth = currentCivilizationMonth();
        _salaryBaseCheckpoints.push(
            SalaryBaseCheckpoint({effectiveMonth: currentMonth, salaryBase: initialSalaryBase})
        );
        emit SalaryBaseScheduled(currentMonth, initialSalaryBase);
    }

    function version() external pure returns (string memory) { return "2.0.0"; }

    function seat(uint256 seatId) external view returns (Seat memory) { return _seats[seatId]; }

    function calendarSeatState(uint256 seatId) external view returns (CalendarSeatState memory) {
        return _calendarSeats[seatId];
    }

    function salaryBaseCheckpointCount() external view returns (uint256) {
        return _salaryBaseCheckpoints.length;
    }

    function salaryBaseCheckpoint(uint256 index) external view returns (SalaryBaseCheckpoint memory) {
        return _salaryBaseCheckpoints[index];
    }

    function seatTermsCheckpointCount(uint256 seatId) external view returns (uint256) {
        return _seatTermsCheckpoints[seatId].length;
    }

    function seatTermsCheckpoint(uint256 seatId, uint256 index)
        external
        view
        returns (SeatTermsCheckpoint memory)
    {
        return _seatTermsCheckpoints[seatId][index];
    }

    /** @notice Compatibility alias. Returns YYYYMM, never a duration epoch. */
    function currentSalaryEpoch() external view returns (uint64) {
        return currentCivilizationMonth();
    }

    function currentCivilizationMonth() public view returns (uint32) {
        (uint256 year, uint256 month,) = _daysToDate((block.timestamp + CIVILIZATION_TIME_OFFSET) / 1 days);
        return _toMonthId(year, month);
    }

    function salaryMonthMatured(uint32 monthId) public view returns (bool) {
        return block.timestamp >= salaryMonthMaturityAt(monthId);
    }

    function salaryMonthMaturityAt(uint32 monthId) public pure returns (uint256) {
        (uint256 year, uint256 month) = _fromMonthId(monthId);
        return _daysFromDate(year, month, 5) * 1 days - CIVILIZATION_TIME_OFFSET;
    }

    function claimableThroughMonth(uint256 seatId) public view returns (uint32) {
        CalendarSeatState memory state = _calendarSeats[seatId];
        if (state.firstSalaryMonth == 0) return 0;
        uint32 maturedMonth = _latestMaturedMonth();
        return _monthIndex(maturedMonth) < _monthIndex(state.firstSalaryMonth) ? 0 : maturedMonth;
    }

    /** @notice Maturity timestamp of the earliest unpaid salary month. */
    function nextSalaryMaturityAt(uint256 seatId) external view returns (uint256) {
        CalendarSeatState memory state = _calendarSeats[seatId];
        if (state.firstSalaryMonth == 0) revert CalendarSeatNotInitialized(seatId);
        uint32 nextUnpaid = _nextMonth(state.lastClaimedMonth);
        if (_monthIndex(nextUnpaid) < _monthIndex(state.firstSalaryMonth)) nextUnpaid = state.firstSalaryMonth;
        return salaryMonthMaturityAt(nextUnpaid);
    }

    function salaryBaseForMonth(uint32 monthId) public view returns (uint128) {
        return _salaryBaseCheckpoints[_salaryBaseIndexAt(monthId)].salaryBase;
    }

    function salaryWeightForMonth(uint256 seatId, uint32 monthId) public view returns (uint64) {
        return _seatTermsCheckpoints[seatId][_seatTermsIndexAt(seatId, monthId)].salaryWeightPpm;
    }

    function salaryBeneficiaryForMonth(uint256 seatId, uint32 monthId) public view returns (address) {
        return _seatTermsCheckpoints[seatId][_seatTermsIndexAt(seatId, monthId)].beneficiary;
    }

    function previewSalaryClaim(uint256 seatId) external view returns (uint256 amount, uint32 throughMonth) {
        CalendarSeatState memory state = _calendarSeats[seatId];
        if (state.firstSalaryMonth == 0) return (0, 0);
        throughMonth = claimableThroughMonth(seatId);
        uint32 fromMonth = _nextMonth(state.lastClaimedMonth);
        if (throughMonth == 0 || _monthIndex(fromMonth) > _monthIndex(throughMonth)) return (0, throughMonth);
        amount = _previewSalary(seatId, fromMonth, throughMonth);
    }

    function configureSeat(
        uint256 seatId,
        bytes32 lifeId,
        bytes32 templeId,
        address beneficiary,
        uint64 salaryWeightPpm,
        SeatStatus status
    ) external onlyRole(GOVERNANCE_ROLE) {
        if (
            seatId == 0 || seatId > MAX_SEATS || lifeId == bytes32(0) || templeId == bytes32(0)
                || beneficiary == address(0) || salaryWeightPpm == 0 || status == SeatStatus.NONE
        ) revert InvalidSeat();

        Seat storage stored = _seats[seatId];
        CalendarSeatState storage calendar = _calendarSeats[seatId];
        uint32 effectiveMonth = _nextMonth(currentCivilizationMonth());
        if (stored.status == SeatStatus.NONE) {
            if (seatCount == MAX_SEATS) revert SeatLimitReached();
            seatCount += 1;
            stored.activatedAt = uint64(block.timestamp);
            calendar.firstSalaryMonth = effectiveMonth;
            calendar.lastClaimedMonth = _previousMonth(effectiveMonth);
        } else if (calendar.firstSalaryMonth == 0) {
            // Upgrade-compatibility bootstrap for an undeployed duration-candidate fixture.
            // It does not reinterpret or erase any legacy storage value.
            calendar.firstSalaryMonth = effectiveMonth;
            calendar.lastClaimedMonth = _previousMonth(effectiveMonth);
        }

        stored.lifeId = lifeId;
        stored.templeId = templeId;
        stored.beneficiary = beneficiary;
        stored.salaryPerEpoch = _monthlySalary(salaryBaseForMonth(effectiveMonth), salaryWeightPpm);
        stored.status = status;
        _scheduleSeatTerms(seatId, effectiveMonth, beneficiary, salaryWeightPpm);
        emit SeatConfigured(seatId, lifeId, templeId, beneficiary, salaryWeightPpm, status);
    }

    function scheduleSalaryBase(uint128 salaryBase, uint32 effectiveMonth)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        if (salaryBase == 0) revert InvalidSalaryBase();
        _requireFutureMonth(effectiveMonth);
        uint256 length = _salaryBaseCheckpoints.length;
        SalaryBaseCheckpoint storage last = _salaryBaseCheckpoints[length - 1];
        if (effectiveMonth < last.effectiveMonth) {
            revert CheckpointOrderInvalid(last.effectiveMonth, effectiveMonth);
        }
        if (effectiveMonth == last.effectiveMonth) {
            last.salaryBase = salaryBase;
        } else {
            _salaryBaseCheckpoints.push(
                SalaryBaseCheckpoint({effectiveMonth: effectiveMonth, salaryBase: salaryBase})
            );
        }
        emit SalaryBaseScheduled(effectiveMonth, salaryBase);
    }

    function scheduleSeatTerms(
        uint256 seatId,
        address beneficiary,
        uint64 salaryWeightPpm,
        uint32 effectiveMonth
    ) external onlyRole(GOVERNANCE_ROLE) {
        if (_seats[seatId].status == SeatStatus.NONE || beneficiary == address(0)) revert InvalidSeat();
        if (salaryWeightPpm == 0) revert InvalidSalaryWeight();
        _requireFutureMonth(effectiveMonth);
        _scheduleSeatTerms(seatId, effectiveMonth, beneficiary, salaryWeightPpm);
        _seats[seatId].beneficiary = beneficiary;
        _seats[seatId].salaryPerEpoch = _monthlySalary(salaryBaseForMonth(effectiveMonth), salaryWeightPpm);
    }

    function claimCelestialSalary(uint256 seatId) external nonReentrant returns (uint256 amount) {
        Seat storage stored = _seats[seatId];
        if (stored.status != SeatStatus.ACTIVE) revert InvalidSeat();
        CalendarSeatState storage calendar = _calendarSeats[seatId];
        if (calendar.firstSalaryMonth == 0) revert CalendarSeatNotInitialized(seatId);

        uint32 throughMonth = claimableThroughMonth(seatId);
        uint32 fromMonth = _nextMonth(calendar.lastClaimedMonth);
        if (throughMonth == 0 || _monthIndex(fromMonth) > _monthIndex(throughMonth)) {
            revert NoSalaryDue(seatId);
        }

        amount = _paySalarySegments(seatId, fromMonth, throughMonth, msg.sender);
        calendar.lastClaimedMonth = throughMonth;
        stored.claimedAmount += amount;
        totalSalaryClaimed += amount;
    }

    function _paySalarySegments(uint256 seatId, uint32 fromMonth, uint32 throughMonth, address triggeredBy)
        internal
        returns (uint256 total)
    {
        uint32 endExclusive = _nextMonth(throughMonth);
        uint32 cursor = fromMonth;
        uint256 rateIndex = _salaryBaseIndexAt(cursor);
        uint256 termsIndex = _seatTermsIndexAt(seatId, cursor);
        while (cursor != endExclusive) {
            uint32 segmentEnd = _segmentEnd(seatId, rateIndex, termsIndex, endExclusive);
            SalaryBaseCheckpoint memory rate = _salaryBaseCheckpoints[rateIndex];
            SeatTermsCheckpoint memory terms = _seatTermsCheckpoints[seatId][termsIndex];
            uint256 months = _monthIndex(segmentEnd) - _monthIndex(cursor);
            uint256 segmentAmount = months * uint256(_monthlySalary(rate.salaryBase, terms.salaryWeightPpm));
            bytes32 paymentId = keccak256(
                abi.encode(MODULE_ID, seatId, cursor, segmentEnd, terms.beneficiary, rate.salaryBase, terms.salaryWeightPpm)
            );
            _pay(paymentId, terms.beneficiary, segmentAmount);
            total += segmentAmount;
            emit SalaryClaimed(
                seatId,
                terms.beneficiary,
                segmentAmount,
                cursor,
                _previousMonth(segmentEnd),
                triggeredBy
            );
            if (
                rateIndex + 1 < _salaryBaseCheckpoints.length
                    && _salaryBaseCheckpoints[rateIndex + 1].effectiveMonth == segmentEnd
            ) rateIndex += 1;
            if (
                termsIndex + 1 < _seatTermsCheckpoints[seatId].length
                    && _seatTermsCheckpoints[seatId][termsIndex + 1].effectiveMonth == segmentEnd
            ) termsIndex += 1;
            cursor = segmentEnd;
        }
    }

    function _previewSalary(uint256 seatId, uint32 fromMonth, uint32 throughMonth)
        internal
        view
        returns (uint256 total)
    {
        uint32 endExclusive = _nextMonth(throughMonth);
        uint32 cursor = fromMonth;
        uint256 rateIndex = _salaryBaseIndexAt(cursor);
        uint256 termsIndex = _seatTermsIndexAt(seatId, cursor);
        while (cursor != endExclusive) {
            uint32 segmentEnd = _segmentEnd(seatId, rateIndex, termsIndex, endExclusive);
            SalaryBaseCheckpoint memory rate = _salaryBaseCheckpoints[rateIndex];
            SeatTermsCheckpoint memory terms = _seatTermsCheckpoints[seatId][termsIndex];
            uint256 months = _monthIndex(segmentEnd) - _monthIndex(cursor);
            total += months * uint256(_monthlySalary(rate.salaryBase, terms.salaryWeightPpm));
            if (
                rateIndex + 1 < _salaryBaseCheckpoints.length
                    && _salaryBaseCheckpoints[rateIndex + 1].effectiveMonth == segmentEnd
            ) rateIndex += 1;
            if (
                termsIndex + 1 < _seatTermsCheckpoints[seatId].length
                    && _seatTermsCheckpoints[seatId][termsIndex + 1].effectiveMonth == segmentEnd
            ) termsIndex += 1;
            cursor = segmentEnd;
        }
    }

    function _segmentEnd(uint256 seatId, uint256 rateIndex, uint256 termsIndex, uint32 endExclusive)
        internal
        view
        returns (uint32 result)
    {
        result = endExclusive;
        if (rateIndex + 1 < _salaryBaseCheckpoints.length) {
            uint32 nextRate = _salaryBaseCheckpoints[rateIndex + 1].effectiveMonth;
            if (_monthIndex(nextRate) < _monthIndex(result)) result = nextRate;
        }
        if (termsIndex + 1 < _seatTermsCheckpoints[seatId].length) {
            uint32 nextTerms = _seatTermsCheckpoints[seatId][termsIndex + 1].effectiveMonth;
            if (_monthIndex(nextTerms) < _monthIndex(result)) result = nextTerms;
        }
    }

    function _scheduleSeatTerms(
        uint256 seatId,
        uint32 effectiveMonth,
        address beneficiary,
        uint64 salaryWeightPpm
    ) internal {
        if (salaryWeightPpm == 0) revert InvalidSalaryWeight();
        SeatTermsCheckpoint[] storage checkpoints = _seatTermsCheckpoints[seatId];
        uint256 length = checkpoints.length;
        if (length != 0) {
            SeatTermsCheckpoint storage last = checkpoints[length - 1];
            if (effectiveMonth < last.effectiveMonth) {
                revert CheckpointOrderInvalid(last.effectiveMonth, effectiveMonth);
            }
            if (effectiveMonth == last.effectiveMonth) {
                last.beneficiary = beneficiary;
                last.salaryWeightPpm = salaryWeightPpm;
                emit SeatTermsScheduled(seatId, effectiveMonth, beneficiary, salaryWeightPpm);
                return;
            }
        }
        checkpoints.push(
            SeatTermsCheckpoint({
                effectiveMonth: effectiveMonth,
                salaryWeightPpm: salaryWeightPpm,
                beneficiary: beneficiary
            })
        );
        emit SeatTermsScheduled(seatId, effectiveMonth, beneficiary, salaryWeightPpm);
    }

    function _salaryBaseIndexAt(uint32 monthId) internal view returns (uint256) {
        _fromMonthId(monthId);
        uint256 high = _salaryBaseCheckpoints.length;
        if (high == 0 || _salaryBaseCheckpoints[0].effectiveMonth > monthId) {
            revert InvalidCivilizationMonth(monthId);
        }
        uint256 low;
        while (low + 1 < high) {
            uint256 middle = (low + high) / 2;
            if (_salaryBaseCheckpoints[middle].effectiveMonth <= monthId) low = middle;
            else high = middle;
        }
        return low;
    }

    function _seatTermsIndexAt(uint256 seatId, uint32 monthId) internal view returns (uint256) {
        _fromMonthId(monthId);
        SeatTermsCheckpoint[] storage checkpoints = _seatTermsCheckpoints[seatId];
        uint256 high = checkpoints.length;
        if (high == 0 || checkpoints[0].effectiveMonth > monthId) {
            revert CalendarSeatNotInitialized(seatId);
        }
        uint256 low;
        while (low + 1 < high) {
            uint256 middle = (low + high) / 2;
            if (checkpoints[middle].effectiveMonth <= monthId) low = middle;
            else high = middle;
        }
        return low;
    }

    function _requireFutureMonth(uint32 effectiveMonth) internal view {
        _fromMonthId(effectiveMonth);
        uint32 currentMonth = currentCivilizationMonth();
        if (_monthIndex(effectiveMonth) <= _monthIndex(currentMonth)) {
            revert CheckpointNotFuture(effectiveMonth, currentMonth);
        }
    }

    function _latestMaturedMonth() internal view returns (uint32 monthId) {
        monthId = currentCivilizationMonth();
        if (!salaryMonthMatured(monthId)) monthId = _previousMonth(monthId);
    }

    function _monthlySalary(uint128 salaryBase, uint64 salaryWeightPpm) internal pure returns (uint128) {
        uint256 amount = uint256(salaryBase) * uint256(salaryWeightPpm) / SALARY_WEIGHT_SCALE;
        if (amount > type(uint128).max) revert InvalidSalaryWeight();
        return uint128(amount);
    }

    function _toMonthId(uint256 year, uint256 month) internal pure returns (uint32) {
        if (year < 1970 || year > 9999 || month == 0 || month > 12) {
            revert InvalidCivilizationMonth(0);
        }
        return uint32(year * 100 + month);
    }

    function _fromMonthId(uint32 monthId) internal pure returns (uint256 year, uint256 month) {
        year = uint256(monthId) / 100;
        month = uint256(monthId) % 100;
        if (year < 1970 || year > 9999 || month == 0 || month > 12) {
            revert InvalidCivilizationMonth(monthId);
        }
    }

    function _monthIndex(uint32 monthId) internal pure returns (uint256) {
        (uint256 year, uint256 month) = _fromMonthId(monthId);
        return year * 12 + month - 1;
    }

    function _nextMonth(uint32 monthId) internal pure returns (uint32) {
        (uint256 year, uint256 month) = _fromMonthId(monthId);
        if (month == 12) return _toMonthId(year + 1, 1);
        return _toMonthId(year, month + 1);
    }

    function _previousMonth(uint32 monthId) internal pure returns (uint32) {
        (uint256 year, uint256 month) = _fromMonthId(monthId);
        if (month == 1) return _toMonthId(year - 1, 12);
        return _toMonthId(year, month - 1);
    }

    // Gregorian conversion shared algorithmically with the audited 8888 bank.
    function _daysFromDate(uint256 year, uint256 month, uint256 day) internal pure returns (uint256) {
        int256 y = int256(year);
        int256 m = int256(month);
        int256 d = int256(day);
        int256 daysSinceEpoch = d - 32_075 + 1_461 * (y + 4_800 + (m - 14) / 12) / 4
            + 367 * (m - 2 - (m - 14) / 12 * 12) / 12
            - 3 * ((y + 4_900 + (m - 14) / 12) / 100) / 4 - 2_440_588;
        return uint256(daysSinceEpoch);
    }

    function _daysToDate(uint256 daysSinceEpoch) internal pure returns (uint256 year, uint256 month, uint256 day) {
        int256 l = int256(daysSinceEpoch) + 68_569 + 2_440_588;
        int256 n = 4 * l / 146_097;
        l = l - (146_097 * n + 3) / 4;
        int256 y = 4_000 * (l + 1) / 1_461_001;
        l = l - 1_461 * y / 4 + 31;
        int256 m = 80 * l / 2_447;
        int256 d = l - 2_447 * m / 80;
        l = m / 11;
        m = m + 2 - 12 * l;
        y = 100 * (n - 49) + y + l;
        return (uint256(y), uint256(m), uint256(d));
    }

    uint256[43] private __gap;
}
