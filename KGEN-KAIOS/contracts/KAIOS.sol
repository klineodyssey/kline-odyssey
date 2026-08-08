// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

interface IKGENSupply {
    function totalSupply() external view returns (uint256);
}

/**
 * @title KAIOS
 * @notice Canonical KAIOS monetary core for the KGEN -> KAIOS -> KUFO lineage.
 * @dev Review candidate. Compile, test, fuzz, invariant-test and audit before mainnet.
 *
 * CORE LAWS
 * - 1 KGEN  = 1 metric ton = 1,000 kg
 * - 1 KAIOS = 1 kg
 * - 1 actually destroyed KGEN -> 1,000 KAIOS
 * - KGEN genesis supply = 72,000,000 KGEN
 * - first-generation KAIOS ceiling = 72,000,000,000 KAIOS
 * - KAIOS native transfer / buy / sell tax = 0%
 * - no owner mint, admin mint, arbitrary recipient mint, blacklist or seizure path
 *
 * FIRST-GENERATION WHITE HOLE — POINT 36000
 * KAIOS observes the canonical KGEN totalSupply() directly. Only the newly
 * observed permanent reduction from the 72,000,000 KGEN genesis supply is
 * mirrored into KAIOS. Every settlement mints only to the immutable 18888
 * Lingxiao Treasury address.
 *
 * ALCHEMY — POINT 18911
 * KAIOS may be voluntarily burned for future KUFO conversion only through the
 * immutable official 18911 Alchemy Furnace address. The holder must first give
 * ERC-20 allowance to that furnace. The furnace cannot burn more than the
 * holder explicitly approved.
 *
 * 1 KAIOS -> expected 1,000 KUFO accounting units (1 kg -> 1,000 g).
 * This contract NEVER mints KUFO. 49-Alchemy-Epoch maturation belongs to the
 * 18911 furnace/runtime. Matured proof claiming belongs to the 511111 wormhole
 * / Qitian Dasheng Palace protocol.
 */
contract KAIOS is ERC20, ERC20Capped {
    uint256 public constant KGEN_GENESIS_SUPPLY = 72_000_000 ether;
    uint256 public constant KAIOS_PER_KGEN = 1_000;
    uint256 public constant KUFO_PER_KAIOS = 1_000;

    uint256 public constant KGEN_KILOGRAMS_PER_TOKEN = 1_000;
    uint256 public constant KAIOS_KILOGRAMS_PER_TOKEN = 1;
    uint256 public constant KUFO_GRAMS_PER_TOKEN = 1;

    uint256 public constant MAX_SUPPLY = 72_000_000_000 ether;

    uint256 public constant WHITE_HOLE_POINT_ID = 36_000;
    uint256 public constant KAIOS_DEPLOY_POINT_ID = 33_333;
    uint256 public constant LINGXIAO_TREASURY_POINT_ID = 18_888;
    uint256 public constant ALCHEMY_FURNACE_POINT_ID = 18_911;
    uint256 public constant WORMHOLE_POINT_ID = 511_111;

    string public constant GENESIS_INSCRIPTION_SHORT =
        "NO KGEN BURN, NO KAIOS MINT. ONE BURNED KGEN CREATES ONE THOUSAND KAIOS. KAIOS NATIVE TAX IS ZERO. ONLY HOLDER-AUTHORIZED ALCHEMY MAY BURN KAIOS. NO DISCRETIONARY MINTING OR SEIZURE. CIVILIZATION MASS SHALL BE CONSERVED.";

    bytes32 public constant GENESIS_INSCRIPTION_SHORT_HASH =
        keccak256(bytes(GENESIS_INSCRIPTION_SHORT));

    address public immutable KGEN;
    address public immutable LINGXIAO_TREASURY_18888;
    address public immutable ALCHEMY_FURNACE_18911;

    uint256 public settledKgenBurned;
    uint256 public totalKaiosMintedFromKgen;
    uint256 public totalKaiosBurnedForAlchemy;

    uint256 public settlementCount;
    uint256 public alchemyBurnCount;

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

    mapping(bytes32 => AlchemyBurnRecord) private _alchemyBurnRecords;

    error ZeroAddress();
    error ZeroAmount();
    error NotAContract(address account);
    error KgenSupplyAboveGenesis(uint256 currentSupply, uint256 genesisSupply);
    error KgenSupplyIncreasedAfterSettlement(uint256 actualBurned, uint256 alreadySettled);
    error NothingToSettle(uint256 actualBurned, uint256 alreadySettled);
    error OnlyOfficialAlchemyFurnace(address caller);
    error InsufficientHolderAllowance(uint256 currentAllowance, uint256 requiredAllowance);

    event WhiteHoleMassSettled(
        uint256 indexed settlementNumber,
        uint256 kgenSupplyObserved,
        uint256 cumulativeKgenBurned,
        uint256 newlySettledKgenBurned,
        uint256 kaiosMinted,
        address indexed treasury,
        address indexed caller
    );

    event KAIOSBurnedForAlchemy(
        uint256 indexed burnNumber,
        bytes32 indexed alchemyProofId,
        address indexed owner,
        address beneficiary,
        address furnace,
        uint256 kaiosBurned,
        uint256 expectedKufo,
        bytes32 lifeId,
        bytes32 destinationCode
    );

    constructor(
        address canonicalKgen,
        address treasury18888,
        address alchemyFurnace18911
    )
        ERC20("KAIOS Civilization Credit", "KAIOS")
        ERC20Capped(MAX_SUPPLY)
    {
        if (
            canonicalKgen == address(0) ||
            treasury18888 == address(0) ||
            alchemyFurnace18911 == address(0)
        ) revert ZeroAddress();

        if (canonicalKgen.code.length == 0) revert NotAContract(canonicalKgen);
        if (alchemyFurnace18911.code.length == 0) revert NotAContract(alchemyFurnace18911);

        KGEN = canonicalKgen;
        LINGXIAO_TREASURY_18888 = treasury18888;
        ALCHEMY_FURNACE_18911 = alchemyFurnace18911;

        uint256 supply = IKGENSupply(canonicalKgen).totalSupply();
        if (supply > KGEN_GENESIS_SUPPLY) {
            revert KgenSupplyAboveGenesis(supply, KGEN_GENESIS_SUPPLY);
        }
    }

    function settleWhiteHoleMass()
        external
        returns (uint256 newlySettledKgenBurned, uint256 kaiosMinted)
    {
        uint256 currentSupply = IKGENSupply(KGEN).totalSupply();
        if (currentSupply > KGEN_GENESIS_SUPPLY) {
            revert KgenSupplyAboveGenesis(currentSupply, KGEN_GENESIS_SUPPLY);
        }

        uint256 actualBurned = KGEN_GENESIS_SUPPLY - currentSupply;
        uint256 alreadySettled = settledKgenBurned;

        if (actualBurned < alreadySettled) {
            revert KgenSupplyIncreasedAfterSettlement(actualBurned, alreadySettled);
        }
        if (actualBurned == alreadySettled) {
            revert NothingToSettle(actualBurned, alreadySettled);
        }

        newlySettledKgenBurned = actualBurned - alreadySettled;
        kaiosMinted = newlySettledKgenBurned * KAIOS_PER_KGEN;

        settledKgenBurned = actualBurned;
        totalKaiosMintedFromKgen += kaiosMinted;

        unchecked {
            ++settlementCount;
        }

        _mint(LINGXIAO_TREASURY_18888, kaiosMinted);

        emit WhiteHoleMassSettled(
            settlementCount,
            currentSupply,
            actualBurned,
            newlySettledKgenBurned,
            kaiosMinted,
            LINGXIAO_TREASURY_18888,
            msg.sender
        );
    }

    function burnForAlchemy(
        address owner,
        address beneficiary,
        uint256 kaiosAmount,
        bytes32 lifeId,
        bytes32 destinationCode
    )
        external
        returns (bytes32 alchemyProofId, uint256 expectedKufo)
    {
        if (msg.sender != ALCHEMY_FURNACE_18911) {
            revert OnlyOfficialAlchemyFurnace(msg.sender);
        }
        if (owner == address(0) || beneficiary == address(0)) revert ZeroAddress();
        if (kaiosAmount == 0) revert ZeroAmount();

        uint256 currentAllowance = allowance(owner, msg.sender);
        if (currentAllowance < kaiosAmount) {
            revert InsufficientHolderAllowance(currentAllowance, kaiosAmount);
        }

        uint256 burnNumber;
        unchecked {
            burnNumber = ++alchemyBurnCount;
        }

        expectedKufo = kaiosAmount * KUFO_PER_KAIOS;
        alchemyProofId = keccak256(
            abi.encode(
                block.chainid,
                address(this),
                burnNumber,
                owner,
                beneficiary,
                kaiosAmount,
                lifeId,
                destinationCode
            )
        );

        _spendAllowance(owner, msg.sender, kaiosAmount);
        _burn(owner, kaiosAmount);

        totalKaiosBurnedForAlchemy += kaiosAmount;

        _alchemyBurnRecords[alchemyProofId] = AlchemyBurnRecord({
            owner: owner,
            beneficiary: beneficiary,
            furnace: msg.sender,
            kaiosBurned: kaiosAmount,
            expectedKufo: expectedKufo,
            lifeId: lifeId,
            destinationCode: destinationCode,
            blockNumber: block.number,
            timestamp: block.timestamp
        });

        emit KAIOSBurnedForAlchemy(
            burnNumber,
            alchemyProofId,
            owner,
            beneficiary,
            msg.sender,
            kaiosAmount,
            expectedKufo,
            lifeId,
            destinationCode
        );
    }

    function alchemyBurnRecord(bytes32 alchemyProofId)
        external
        view
        returns (AlchemyBurnRecord memory)
    {
        return _alchemyBurnRecords[alchemyProofId];
    }

    function actualKgenBurned() public view returns (uint256) {
        uint256 currentSupply = IKGENSupply(KGEN).totalSupply();
        if (currentSupply > KGEN_GENESIS_SUPPLY) {
            revert KgenSupplyAboveGenesis(currentSupply, KGEN_GENESIS_SUPPLY);
        }
        return KGEN_GENESIS_SUPPLY - currentSupply;
    }

    function pendingKgenBurned() public view returns (uint256) {
        uint256 burned = actualKgenBurned();
        if (burned < settledKgenBurned) {
            revert KgenSupplyIncreasedAfterSettlement(burned, settledKgenBurned);
        }
        return burned - settledKgenBurned;
    }

    function pendingKaios() external view returns (uint256) {
        return pendingKgenBurned() * KAIOS_PER_KGEN;
    }

    function expectedKufoForKAIOS(uint256 kaiosAmount)
        external
        pure
        returns (uint256)
    {
        return kaiosAmount * KUFO_PER_KAIOS;
    }

    function conservationInvariantHolds() external view returns (bool) {
        return
            totalSupply() + totalKaiosBurnedForAlchemy
            == settledKgenBurned * KAIOS_PER_KGEN;
    }

    function modeledCirculatingMassKg() external view returns (uint256) {
        return totalSupply();
    }

    function modeledSettledGenesisMassKg() external view returns (uint256) {
        return settledKgenBurned * KGEN_KILOGRAMS_PER_TOKEN;
    }

    function remainingMintableSupply() external view returns (uint256) {
        return cap() - totalSupply();
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
    {
        super._update(from, to, value);
    }
}
