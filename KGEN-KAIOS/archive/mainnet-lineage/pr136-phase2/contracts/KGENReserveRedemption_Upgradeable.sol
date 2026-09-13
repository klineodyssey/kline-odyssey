// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {LingxiaoBankModuleBaseUpgradeable} from "./LingxiaoBankModuleBaseUpgradeable.sol";
import {ICelestialEligibility} from "./interfaces/ICelestialEligibility.sol";

/**
 * @title KGENReserveRedemption_Upgradeable
 * @notice Restricted 18888 reserve-redemption rail backed only by existing KGEN.
 * @dev This module is the future KGEN 0.10% bank-tax receiver. Redemption transfers
 *      KAIOS to the formal 18888 Bank without burning it, then pays existing reserve
 *      KGEN to the beneficiary bound by the formal eligibility source. It cannot mint,
 *      sweep or perform an arbitrary-beneficiary transfer.
 */
contract KGENReserveRedemption_Upgradeable is LingxiaoBankModuleBaseUpgradeable {
    using SafeERC20 for IERC20;

    bytes32 public constant MODULE_ID = keccak256("KAIOS.BANK.MODULE.KGEN_RESERVE_REDEMPTION");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    uint256 public constant KAIOS_PER_KGEN_REFERENCE = 1_000;

    enum RequestStatus {
        NONE,
        COMPLETED
    }

    struct RedemptionRequest {
        bytes32 lifeId;
        address payer;
        address beneficiary;
        uint256 kaiosIn;
        uint256 maxKgenOut;
        uint256 actualKgenOut;
        uint64 createdAt;
        uint64 deadline;
        RequestStatus status;
    }

    struct DailyUsage {
        uint256 kaiosIn;
        uint256 kgenOut;
    }

    IERC20 public kgen;
    IERC20 public kaios;
    ICelestialEligibility public eligibility;
    uint256 public minimumKgenReserve;
    uint256 public maxKgenPerTx;
    uint256 public maxKgenPerDay;
    uint256 public maxKaiosPerTx;
    uint256 public maxKaiosPerDay;
    bool public paused;
    bool public redemptionEnabled;
    uint256 public totalKaiosDeposited;
    uint256 public totalKgenRedeemed;
    uint256 public requestCount;
    mapping(bytes32 requestId => RedemptionRequest) private _requests;
    mapping(uint64 dayIndex => DailyUsage) private _dailyUsage;

    error RedemptionIsPaused();
    error RedemptionDisabled();
    error InvalidRiskParameters();
    error InvalidRequest();
    error RequestAlreadyUsed(bytes32 requestId);
    error RequestExpired(uint64 deadline, uint64 currentTime);
    error LifeNotEligible(bytes32 lifeId);
    error InvalidBeneficiary(bytes32 lifeId);
    error RedemptionBelowMinimum(uint256 kaiosIn);
    error LimitExceeded(uint256 requested, uint256 limit);
    error InsufficientKgenReserve(uint256 balance, uint256 payout, uint256 reserveFloor);
    error UnexpectedTokenReceipt(uint256 expected, uint256 actual);
    error KgenSupplyChanged(uint256 beforeSupply, uint256 afterSupply);

    event RedemptionInitialized(
        address indexed kgen,
        address indexed kaios,
        address indexed eligibility,
        address pauser
    );
    event RedemptionRiskConfigured(
        uint256 minimumKgenReserve,
        uint256 maxKgenPerTx,
        uint256 maxKgenPerDay,
        uint256 maxKaiosPerTx,
        uint256 maxKaiosPerDay
    );
    event RedemptionAvailabilityChanged(bool enabled);
    event RedemptionPaused(address indexed account);
    event RedemptionUnpaused(address indexed account);
    event RedemptionCompleted(
        bytes32 indexed requestId,
        bytes32 indexed lifeId,
        address indexed beneficiary,
        address payer,
        uint256 kaiosIn,
        uint256 kgenOut,
        uint64 dayIndex
    );

    function initialize(
        address bankAddress,
        address governance,
        address upgrader,
        address pauser,
        address canonicalKgen,
        address canonicalKaios,
        address eligibilitySource,
        uint256 initialMinimumKgenReserve,
        uint256 initialMaxKgenPerTx,
        uint256 initialMaxKgenPerDay,
        uint256 initialMaxKaiosPerTx,
        uint256 initialMaxKaiosPerDay,
        bool initiallyEnabled
    ) external initializer {
        if (
            pauser == address(0) || canonicalKgen == address(0) || canonicalKaios == address(0)
                || eligibilitySource == address(0)
        ) revert ZeroAddress();
        if (canonicalKgen.code.length == 0) revert NotAContract(canonicalKgen);
        if (canonicalKaios.code.length == 0) revert NotAContract(canonicalKaios);
        if (eligibilitySource.code.length == 0) revert NotAContract(eligibilitySource);

        __LingxiaoBankModule_init(bankAddress, governance, upgrader, MODULE_ID);
        if (bank.kgen() != canonicalKgen || bank.kaios() != canonicalKaios) revert InvalidRequest();

        kgen = IERC20(canonicalKgen);
        kaios = IERC20(canonicalKaios);
        eligibility = ICelestialEligibility(eligibilitySource);
        _grantRole(PAUSER_ROLE, pauser);
        _configureRisk(
            initialMinimumKgenReserve,
            initialMaxKgenPerTx,
            initialMaxKgenPerDay,
            initialMaxKaiosPerTx,
            initialMaxKaiosPerDay
        );
        redemptionEnabled = initiallyEnabled;
        emit RedemptionInitialized(canonicalKgen, canonicalKaios, eligibilitySource, pauser);
        emit RedemptionAvailabilityChanged(initiallyEnabled);
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }

    function request(bytes32 requestId) external view returns (RedemptionRequest memory) {
        return _requests[requestId];
    }

    function dailyUsage(uint64 dayIndex) external view returns (DailyUsage memory) {
        return _dailyUsage[dayIndex];
    }

    function currentDayIndex() public view returns (uint64) {
        return uint64(block.timestamp / 1 days);
    }

    function kgenReserveBalance() public view returns (uint256) {
        return kgen.balanceOf(address(this));
    }

    function referenceKgenOut(uint256 kaiosIn) public pure returns (uint256) {
        return kaiosIn / KAIOS_PER_KGEN_REFERENCE;
    }

    function configureRisk(
        uint256 newMinimumKgenReserve,
        uint256 newMaxKgenPerTx,
        uint256 newMaxKgenPerDay,
        uint256 newMaxKaiosPerTx,
        uint256 newMaxKaiosPerDay
    ) external onlyRole(GOVERNANCE_ROLE) {
        _configureRisk(
            newMinimumKgenReserve,
            newMaxKgenPerTx,
            newMaxKgenPerDay,
            newMaxKaiosPerTx,
            newMaxKaiosPerDay
        );
    }

    function setRedemptionEnabled(bool enabled) external onlyRole(GOVERNANCE_ROLE) {
        redemptionEnabled = enabled;
        emit RedemptionAvailabilityChanged(enabled);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        paused = true;
        emit RedemptionPaused(msg.sender);
    }

    function unpause() external onlyRole(GOVERNANCE_ROLE) {
        paused = false;
        emit RedemptionUnpaused(msg.sender);
    }

    function requestRedemption(
        bytes32 requestId,
        bytes32 lifeId,
        uint256 kaiosIn,
        uint64 deadline
    ) external nonReentrant returns (uint256 actualKgenOut) {
        if (paused || bank.paused()) revert RedemptionIsPaused();
        if (!redemptionEnabled) revert RedemptionDisabled();
        if (requestId == bytes32(0) || lifeId == bytes32(0) || kaiosIn == 0) {
            revert InvalidRequest();
        }
        if (_requests[requestId].status != RequestStatus.NONE) revert RequestAlreadyUsed(requestId);
        if (deadline < block.timestamp) revert RequestExpired(deadline, uint64(block.timestamp));
        if (!eligibility.redemptionEligible(lifeId)) revert LifeNotEligible(lifeId);
        address beneficiary = eligibility.canonicalBeneficiary(lifeId);
        if (beneficiary == address(0) || beneficiary == address(this) || beneficiary == address(bank)) {
            revert InvalidBeneficiary(lifeId);
        }

        actualKgenOut = referenceKgenOut(kaiosIn);
        if (actualKgenOut == 0) revert RedemptionBelowMinimum(kaiosIn);
        _enforceLimits(kaiosIn, actualKgenOut);

        uint256 reserveBefore = kgen.balanceOf(address(this));
        if (
            reserveBefore < actualKgenOut
                || reserveBefore - actualKgenOut < minimumKgenReserve
        ) revert InsufficientKgenReserve(reserveBefore, actualKgenOut, minimumKgenReserve);

        uint64 dayIndex = currentDayIndex();
        DailyUsage storage usage = _dailyUsage[dayIndex];
        if (usage.kaiosIn + kaiosIn > maxKaiosPerDay) {
            revert LimitExceeded(usage.kaiosIn + kaiosIn, maxKaiosPerDay);
        }
        if (usage.kgenOut + actualKgenOut > maxKgenPerDay) {
            revert LimitExceeded(usage.kgenOut + actualKgenOut, maxKgenPerDay);
        }

        uint256 bankKaiosBefore = kaios.balanceOf(address(bank));
        kaios.safeTransferFrom(msg.sender, address(bank), kaiosIn);
        uint256 bankKaiosAfter = kaios.balanceOf(address(bank));
        if (bankKaiosAfter - bankKaiosBefore != kaiosIn) {
            revert UnexpectedTokenReceipt(kaiosIn, bankKaiosAfter - bankKaiosBefore);
        }
        bank.synchronizeAccounting();

        uint256 beneficiaryBefore = kgen.balanceOf(beneficiary);
        uint256 supplyBefore = kgen.totalSupply();
        kgen.safeTransfer(beneficiary, actualKgenOut);
        uint256 beneficiaryDelta = kgen.balanceOf(beneficiary) - beneficiaryBefore;
        if (beneficiaryDelta != actualKgenOut) {
            revert UnexpectedTokenReceipt(actualKgenOut, beneficiaryDelta);
        }
        uint256 supplyAfter = kgen.totalSupply();
        if (supplyAfter != supplyBefore) revert KgenSupplyChanged(supplyBefore, supplyAfter);

        usage.kaiosIn += kaiosIn;
        usage.kgenOut += actualKgenOut;
        totalKaiosDeposited += kaiosIn;
        totalKgenRedeemed += actualKgenOut;
        unchecked {
            ++requestCount;
        }
        _requests[requestId] = RedemptionRequest({
            lifeId: lifeId,
            payer: msg.sender,
            beneficiary: beneficiary,
            kaiosIn: kaiosIn,
            maxKgenOut: actualKgenOut,
            actualKgenOut: actualKgenOut,
            createdAt: uint64(block.timestamp),
            deadline: deadline,
            status: RequestStatus.COMPLETED
        });

        emit RedemptionCompleted(
            requestId,
            lifeId,
            beneficiary,
            msg.sender,
            kaiosIn,
            actualKgenOut,
            dayIndex
        );
    }

    function _configureRisk(
        uint256 newMinimumKgenReserve,
        uint256 newMaxKgenPerTx,
        uint256 newMaxKgenPerDay,
        uint256 newMaxKaiosPerTx,
        uint256 newMaxKaiosPerDay
    ) private {
        if (
            newMaxKgenPerTx == 0 || newMaxKgenPerDay < newMaxKgenPerTx
                || newMaxKaiosPerTx == 0 || newMaxKaiosPerDay < newMaxKaiosPerTx
        ) revert InvalidRiskParameters();
        minimumKgenReserve = newMinimumKgenReserve;
        maxKgenPerTx = newMaxKgenPerTx;
        maxKgenPerDay = newMaxKgenPerDay;
        maxKaiosPerTx = newMaxKaiosPerTx;
        maxKaiosPerDay = newMaxKaiosPerDay;
        emit RedemptionRiskConfigured(
            newMinimumKgenReserve,
            newMaxKgenPerTx,
            newMaxKgenPerDay,
            newMaxKaiosPerTx,
            newMaxKaiosPerDay
        );
    }

    function _enforceLimits(uint256 kaiosIn, uint256 kgenOut) private view {
        if (kaiosIn > maxKaiosPerTx) revert LimitExceeded(kaiosIn, maxKaiosPerTx);
        if (kgenOut > maxKgenPerTx) revert LimitExceeded(kgenOut, maxKgenPerTx);
    }

    uint256[36] private __gap;
}
