// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract MockAggregatorV3 {
    struct RoundData {
        int256 answer;
        uint256 startedAt;
        uint256 updatedAt;
        uint80 answeredInRound;
        bool exists;
    }

    uint8 public immutable decimals;
    string public description;
    uint80 public latestRoundId;
    bool public unavailable;
    mapping(uint80 => RoundData) private _rounds;

    constructor(uint8 decimals_, string memory description_) {
        decimals = decimals_;
        description = description_;
    }

    function setRound(uint80 roundId, int256 answer, uint256 updatedAt, uint80 answeredInRound) external {
        _rounds[roundId] = RoundData(answer, updatedAt, updatedAt, answeredInRound, true);
        if (roundId > latestRoundId) latestRoundId = roundId;
    }

    function setLatestRoundId(uint80 roundId) external {
        latestRoundId = roundId;
    }

    function setUnavailable(bool unavailable_) external {
        unavailable = unavailable_;
    }

    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        if (unavailable) revert("MOCK_ORACLE_UNAVAILABLE");
        return _get(latestRoundId);
    }

    function getRoundData(uint80 roundId)
        external
        view
        returns (uint80, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        if (unavailable) revert("MOCK_ORACLE_UNAVAILABLE");
        return _get(roundId);
    }

    function _get(uint80 roundId)
        internal
        view
        returns (uint80, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        RoundData storage data = _rounds[roundId];
        require(data.exists, "MOCK_ROUND_MISSING");
        return (roundId, data.answer, data.startedAt, data.updatedAt, data.answeredInRound);
    }
}
