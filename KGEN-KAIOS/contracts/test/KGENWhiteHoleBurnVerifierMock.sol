// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract KGENWhiteHoleBurnVerifierMock {
    struct VerifiedBurn {
        bytes32 burnId;
        bytes32 tradeId;
        bytes32 pairId;
        address trader;
        uint256 burnedKgen;
        uint256 positiveMatterEquivalent;
        bool valid;
        bool ammTrade;
        bool selfMatch;
        bool washTrade;
    }

    mapping(bytes32 => VerifiedBurn) private _burns;

    function setBurn(VerifiedBurn calldata burn) external {
        _burns[burn.burnId] = burn;
    }

    function verifiedBurn(bytes32 burnId) external view returns (VerifiedBurn memory) {
        return _burns[burnId];
    }
}
