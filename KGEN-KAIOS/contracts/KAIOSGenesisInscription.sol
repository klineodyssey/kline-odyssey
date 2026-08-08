// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title KAIOSGenesisInscription
 * @notice Immutable registry anchoring the canonical KAIOS inscription and
 *         associated document hash to the deployed monetary core.
 * @dev Review candidate. Not audited or deployment-authorized.
 */
contract KAIOSGenesisInscription {
    string public constant SHORT_INSCRIPTION =
        "NO KGEN BURN, NO KAIOS MINT. ONE BURNED KGEN CREATES ONE THOUSAND KAIOS. KAIOS NATIVE TAX IS ZERO. ONLY HOLDER-AUTHORIZED ALCHEMY MAY BURN KAIOS. NO DISCRETIONARY MINTING OR SEIZURE. CIVILIZATION MASS SHALL BE CONSERVED.";

    bytes32 public constant SHORT_INSCRIPTION_HASH =
        keccak256(bytes(SHORT_INSCRIPTION));

    uint256 public constant WHITE_HOLE_POINT_ID = 36_000;
    uint256 public constant KAIOS_DEPLOY_POINT_ID = 33_333;
    uint256 public constant LINGXIAO_TREASURY_POINT_ID = 18_888;
    uint256 public constant ALCHEMY_FURNACE_POINT_ID = 18_911;
    uint256 public constant WORMHOLE_POINT_ID = 511_111;

    bytes32 public immutable fullInscriptionHash;
    bytes32 public immutable kaiosReadmeHash;

    address public immutable kaiosToken;
    address public immutable kgenToken;
    address public immutable lingxiaoTreasury18888;
    address public immutable alchemyFurnace18911;

    uint256 public immutable inscriptionBlock;
    uint256 public immutable inscriptionTimestamp;

    error EmptyHash();
    error ZeroAddress();

    constructor(
        bytes32 fullInscriptionHash_,
        bytes32 kaiosReadmeHash_,
        address kaiosToken_,
        address kgenToken_,
        address lingxiaoTreasury18888_,
        address alchemyFurnace18911_
    ) {
        if (fullInscriptionHash_ == bytes32(0) || kaiosReadmeHash_ == bytes32(0)) {
            revert EmptyHash();
        }
        if (
            kaiosToken_ == address(0) ||
            kgenToken_ == address(0) ||
            lingxiaoTreasury18888_ == address(0) ||
            alchemyFurnace18911_ == address(0)
        ) revert ZeroAddress();

        fullInscriptionHash = fullInscriptionHash_;
        kaiosReadmeHash = kaiosReadmeHash_;
        kaiosToken = kaiosToken_;
        kgenToken = kgenToken_;
        lingxiaoTreasury18888 = lingxiaoTreasury18888_;
        alchemyFurnace18911 = alchemyFurnace18911_;
        inscriptionBlock = block.number;
        inscriptionTimestamp = block.timestamp;
    }

    function inscriptionHashMatches(bytes calldata inscriptionBytes)
        external
        view
        returns (bool)
    {
        return keccak256(inscriptionBytes) == fullInscriptionHash;
    }

    function kaiosReadmeHashMatches(bytes calldata readmeBytes)
        external
        view
        returns (bool)
    {
        return keccak256(readmeBytes) == kaiosReadmeHash;
    }
}
