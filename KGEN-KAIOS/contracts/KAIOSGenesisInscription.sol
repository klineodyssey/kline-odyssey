// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IKAIOSGenesisEvidence {
    function KGEN() external view returns (address);
    function LINGXIAO_TREASURY_18888() external view returns (address);
    function KGEN_GENESIS_SUPPLY() external view returns (uint256);
    function KAIOS_PER_KGEN() external view returns (uint256);
    function settledKgenBurned() external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title KAIOSGenesisInscription
 * @notice Immutable on-chain anchor for the exact canonical KAIOS inscription,
 *         formal organ lineage, and verified first White-Hole settlement.
 * @dev No owner, admin, setter, upgrade path, custody, or external execution.
 *      Constructor quantities must be produced from the successful Genesis
 *      settlement receipt and are checked again against the deployed KAIOS core.
 */
contract KAIOSGenesisInscription {
    string public constant SHORT_INSCRIPTION =
        "NO KGEN BURN, NO KAIOS MINT. ONE BURNED KGEN CREATES ONE THOUSAND KAIOS. NO DISCRETIONARY MINTING. CIVILIZATION MASS SHALL BE CONSERVED.";

    bytes32 public constant SHORT_INSCRIPTION_HASH =
        keccak256(bytes(SHORT_INSCRIPTION));

    bytes32 public constant fullInscriptionHash =
        0xbc89db0915e1fd0e978ae0cfe194f4b46db22534febab35563de2802935b3704;
    bytes32 public constant fullInscriptionSha256 =
        0xadd44b79083a20a6d9f240a99c5fd47658f191ce8b3fa81da6f60c97e8b4470f;

    uint256 public constant WHITE_HOLE_POINT_ID = 36_000;
    uint256 public constant KAIOS_DEPLOY_POINT_ID = 33_333;
    uint256 public constant LINGXIAO_TREASURY_POINT_ID = 18_888;
    uint256 public constant ALCHEMY_FURNACE_POINT_ID = 18_911;
    uint256 public constant WORMHOLE_POINT_ID = 511_111;

    address public immutable kaiosToken;
    address public immutable kgenToken;
    address public immutable lingxiaoTreasury18888;
    address public immutable alchemyFurnace18911;
    address public immutable organRegistry;

    uint256 public immutable kgenSupplyAtSettlement;
    uint256 public immutable recognizedHistoricalBurnedKgen;
    uint256 public immutable actualGenesisKaiosMinted;
    bytes32 public immutable settlementTxHash;
    uint256 public immutable settlementBlock;

    uint256 public immutable inscriptionBlock;
    uint256 public immutable inscriptionTimestamp;

    error ZeroAddress();
    error NotAContract(address account);
    error EmptySettlementReference();
    error FutureSettlementBlock(uint256 settlementBlock, uint256 inscriptionBlock);
    error KgenLineageMismatch(address reported, address expected);
    error TreasuryLineageMismatch(address reported, address expected);
    error MonetaryScaleMismatch(uint256 genesisSupply, uint256 kaiosPerKgen);
    error GenesisQuantityMismatch();
    error GenesisStateMismatch();

    constructor(
        address kaiosToken_,
        address kgenToken_,
        address lingxiaoTreasury18888_,
        address alchemyFurnace18911_,
        address organRegistry_,
        uint256 kgenSupplyAtSettlement_,
        uint256 recognizedHistoricalBurnedKgen_,
        uint256 actualGenesisKaiosMinted_,
        bytes32 settlementTxHash_,
        uint256 settlementBlock_
    ) {
        _requireContract(kaiosToken_);
        _requireContract(kgenToken_);
        _requireContract(lingxiaoTreasury18888_);
        _requireContract(alchemyFurnace18911_);
        _requireContract(organRegistry_);
        if (settlementTxHash_ == bytes32(0) || settlementBlock_ == 0) {
            revert EmptySettlementReference();
        }
        if (settlementBlock_ > block.number) {
            revert FutureSettlementBlock(settlementBlock_, block.number);
        }

        IKAIOSGenesisEvidence kaios = IKAIOSGenesisEvidence(kaiosToken_);
        address reportedKgen = kaios.KGEN();
        if (reportedKgen != kgenToken_) {
            revert KgenLineageMismatch(reportedKgen, kgenToken_);
        }
        address reportedTreasury = kaios.LINGXIAO_TREASURY_18888();
        if (reportedTreasury != lingxiaoTreasury18888_) {
            revert TreasuryLineageMismatch(reportedTreasury, lingxiaoTreasury18888_);
        }

        uint256 genesisKgenSupply = kaios.KGEN_GENESIS_SUPPLY();
        uint256 kaiosPerKgen = kaios.KAIOS_PER_KGEN();
        if (genesisKgenSupply != 72_000_000 ether || kaiosPerKgen != 1_000) {
            revert MonetaryScaleMismatch(genesisKgenSupply, kaiosPerKgen);
        }
        if (
            kgenSupplyAtSettlement_ > genesisKgenSupply ||
            genesisKgenSupply - kgenSupplyAtSettlement_ != recognizedHistoricalBurnedKgen_ ||
            recognizedHistoricalBurnedKgen_ == 0 ||
            recognizedHistoricalBurnedKgen_ * kaiosPerKgen != actualGenesisKaiosMinted_
        ) revert GenesisQuantityMismatch();
        if (
            kaios.settledKgenBurned() != recognizedHistoricalBurnedKgen_ ||
            kaios.totalSupply() != actualGenesisKaiosMinted_ ||
            kaios.balanceOf(lingxiaoTreasury18888_) != actualGenesisKaiosMinted_
        ) revert GenesisStateMismatch();

        kaiosToken = kaiosToken_;
        kgenToken = kgenToken_;
        lingxiaoTreasury18888 = lingxiaoTreasury18888_;
        alchemyFurnace18911 = alchemyFurnace18911_;
        organRegistry = organRegistry_;
        kgenSupplyAtSettlement = kgenSupplyAtSettlement_;
        recognizedHistoricalBurnedKgen = recognizedHistoricalBurnedKgen_;
        actualGenesisKaiosMinted = actualGenesisKaiosMinted_;
        settlementTxHash = settlementTxHash_;
        settlementBlock = settlementBlock_;
        inscriptionBlock = block.number;
        inscriptionTimestamp = block.timestamp;
    }

    function inscriptionHashMatches(bytes calldata inscriptionBytes)
        external
        pure
        returns (bool)
    {
        return keccak256(inscriptionBytes) == fullInscriptionHash;
    }

    function inscriptionSha256Matches(bytes calldata inscriptionBytes)
        external
        pure
        returns (bool)
    {
        return sha256(inscriptionBytes) == fullInscriptionSha256;
    }

    function _requireContract(address account) private view {
        if (account == address(0)) revert ZeroAddress();
        if (account.code.length == 0) revert NotAContract(account);
    }
}
