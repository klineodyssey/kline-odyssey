// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title KAIOSGenesisInscription
 * @notice Immutable inscription registry draft. Not audited or deployment-authorized.
 */
contract KAIOSGenesisInscription {
    string public constant VERSION = "KAIOS-GENESIS-INSCRIPTION-V1.0";

    string public constant SHORT_INSCRIPTION =
        "NO KGEN BURN, NO KAIOS MINT. ONE BURNED KGEN CREATES TEN THOUSAND KAIOS. NO DISCRETIONARY MINTING. CIVILIZATION MASS SHALL BE CONSERVED.";

    bytes32 public immutable fullInscriptionHash;
    bytes32 public immutable whitepaperHash;
    address public immutable kaiosToken;
    address public immutable kgenToken;
    address public immutable kgenWhiteHoleController;
    uint256 public immutable inscriptionBlock;

    constructor(
        bytes32 fullInscriptionHash_,
        bytes32 whitepaperHash_,
        address kaiosToken_,
        address kgenToken_,
        address kgenWhiteHoleController_
    ) {
        require(fullInscriptionHash_ != bytes32(0), "EMPTY_INSCRIPTION_HASH");
        require(whitepaperHash_ != bytes32(0), "EMPTY_WHITEPAPER_HASH");
        require(kaiosToken_ != address(0), "ZERO_KAIOS");
        require(kgenToken_ != address(0), "ZERO_KGEN");
        require(kgenWhiteHoleController_ != address(0), "ZERO_WHITE_HOLE");

        fullInscriptionHash = fullInscriptionHash_;
        whitepaperHash = whitepaperHash_;
        kaiosToken = kaiosToken_;
        kgenToken = kgenToken_;
        kgenWhiteHoleController = kgenWhiteHoleController_;
        inscriptionBlock = block.number;
    }

    function inscriptionHashMatches(bytes calldata inscriptionBytes) external view returns (bool) {
        return keccak256(inscriptionBytes) == fullInscriptionHash;
    }

    function whitepaperHashMatches(bytes calldata whitepaperBytes) external view returns (bool) {
        return keccak256(whitepaperBytes) == whitepaperHash;
    }
}
