// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IKGENAdapterAggregator {
    function decimals() external view returns (uint8);
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80);
}

// ABI-compatible with Pyth IPyth/PythStructs.Price. No update/fee/signing path.
interface IKGENAdapterPyth {
    struct Price { int64 price; uint64 conf; int32 expo; uint256 publishTime; }
    function getPriceNoOlderThan(bytes32 id, uint256 age) external view returns (Price memory);
}

/**
 * Read-only CANDIDATE, not production source/policy approval.
 * Preserves source quote denomination: USD is NOT converted to USDT.
 * Timestamp identity accommodates constant-round aggregators without inventing
 * rounds from block time. PositionEngine retains its per-source watermark and
 * rejects both time rollback and changed answers at an already accepted time.
 */
contract KGEN_OracleSourceAdapter {
    enum SourceKind { TIMESTAMP_AGGREGATOR, PYTH }
    address public immutable source;
    SourceKind public immutable sourceKind;
    uint8 public immutable sourceDecimals;
    bytes32 public immutable feedId;
    uint32 public immutable maxAge;
    uint16 public immutable maxConfidenceBps;
    uint8 public constant decimals = 18;

    error InvalidConfiguration();
    error InvalidObservation();
    error InvalidConfidence();
    error InvalidExponent();
    error InvalidScale();

    constructor(address source_, SourceKind sourceKind_, uint8 sourceDecimals_, bytes32 feedId_, uint32 maxAge_, uint16 maxConfidenceBps_) {
        if (source_.code.length == 0 || maxAge_ == 0) revert InvalidConfiguration();
        if (sourceKind_ == SourceKind.TIMESTAMP_AGGREGATOR) {
            if (sourceDecimals_ > 36 || feedId_ != bytes32(0) || maxConfidenceBps_ != 0) revert InvalidConfiguration();
            if (IKGENAdapterAggregator(source_).decimals() != sourceDecimals_) revert InvalidConfiguration();
        } else {
            if (sourceDecimals_ != 0 || feedId_ == bytes32(0) || maxConfidenceBps_ == 0 || maxConfidenceBps_ > 10_000) revert InvalidConfiguration();
        }
        source = source_;
        sourceKind = sourceKind_;
        sourceDecimals = sourceDecimals_;
        feedId = feedId_;
        maxAge = maxAge_;
        maxConfidenceBps = maxConfidenceBps_;
        // Fail closed on wrong ABI, missing feed, stale/invalid initial data.
        _read();
    }

    function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
        (answer, updatedAt) = _read();
        roundId = uint80(updatedAt);
        startedAt = updatedAt;
        answeredInRound = roundId;
    }

    function _read() internal view returns (int256 answer, uint256 timestamp) {
        if (sourceKind == SourceKind.TIMESTAMP_AGGREGATOR) {
            if (IKGENAdapterAggregator(source).decimals() != sourceDecimals) revert InvalidScale();
            (uint80 round, int256 raw,, uint256 at, uint80 completed) = IKGENAdapterAggregator(source).latestRoundData();
            if (round == 0 || completed < round || raw <= 0) revert InvalidObservation();
            uint256 normalized = uint256(raw);
            if (sourceDecimals <= 18) {
                uint256 scale = 10 ** (18 - sourceDecimals);
                if (normalized > uint256(type(int256).max) / scale) revert InvalidScale();
                normalized *= scale;
            } else {
                uint256 divisor = 10 ** (sourceDecimals - 18);
                // Never hide a same-timestamp raw mutation behind WAD rounding.
                if (normalized % divisor != 0) revert InvalidScale();
                normalized /= divisor;
            }
            if (normalized == 0) revert InvalidScale();
            answer = int256(normalized);
            timestamp = at;
        } else {
            IKGENAdapterPyth.Price memory p = IKGENAdapterPyth(source).getPriceNoOlderThan(feedId, maxAge);
            if (p.price <= 0) revert InvalidObservation();
            uint256 raw = uint256(uint64(p.price));
            // Compare in raw units BEFORE division can round confidence to zero.
            if (uint256(p.conf) * 10_000 > raw * maxConfidenceBps) revert InvalidConfidence();
            if (p.expo < -36 || p.expo > 18) revert InvalidExponent();
            int256 shift = int256(p.expo) + 18;
            uint256 normalized;
            if (shift >= 0) {
                uint256 scale = 10 ** uint256(shift);
                if (raw > uint256(type(int256).max) / scale) revert InvalidScale();
                normalized = raw * scale;
            } else {
                uint256 divisor = 10 ** uint256(-shift);
                if (raw % divisor != 0) revert InvalidScale();
                normalized = raw / divisor;
            }
            if (normalized == 0) revert InvalidScale();
            answer = int256(normalized);
            timestamp = p.publishTime;
        }
        if (timestamp == 0 || timestamp > block.timestamp || timestamp > type(uint80).max || block.timestamp - timestamp > maxAge) revert InvalidObservation();
    }
}
