// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

interface IKAIOSBurnRecordSource {
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
        address catalystOwner;
        uint256 requiredKgenCatalyst;
    }

    function alchemyBurnRecord(bytes32 proofId) external view returns (AlchemyBurnRecord memory);
}

interface IAlchemyFurnaceProofSource {
    struct Proof {
        address owner;
        address catalystOwner;
        address beneficiary;
        uint256 kaiosBurned;
        uint256 kgenCatalystAmount;
        uint256 kufoAmount;
        bytes32 lifeId;
        bytes32 destinationCode;
        bytes32 memorialProofId;
        uint64 burnEpoch;
        uint64 maturityEpoch;
        bool consumed;
        bool catalystReturned;
    }

    function proof(bytes32 proofId) external view returns (Proof memory);
    function currentEpoch() external view returns (uint64);
}

/**
 * @title KUFO
 * @notice Gram-scale alchemy token with immutable non-zero half-life and proof-bound decay lots.
 * @dev Binary fixed-point exponentiation realizes 2^(-elapsed/halfLife). Transfers split lots without changing bornAt.
 */
contract KUFO is ERC20, ERC20Capped {
    bytes32 public constant ORGAN_WORMHOLE_511111 = keccak256("KAIOS.ORGAN.WORMHOLE.511111");
    bytes32 public constant ORGAN_KSHIP_CONVERTER = keccak256("KAIOS.ORGAN.KSHIP.CONVERTER");
    uint256 public constant KSHIP_PER_KUFO = 1_000;
    uint256 private constant WAD = 1 ether;
    uint256 public constant KAIOS_WEI_PER_KGEN_CATALYST_WEI = 1_000;
    uint256 public constant MAX_SUPPLY = 72_000_000_000_000 ether;

    struct DecayLot {
        address owner;
        uint256 initialAmount;
        uint256 convertedAmount;
        uint64 bornAt;
        bytes32 sourceProof;
    }

    struct CarrierBurnRecord {
        address owner;
        address beneficiary;
        address converter;
        uint256 kufoBurned;
        uint256 expectedKship;
        uint256 timestamp;
    }

    IKAIOSOrganRegistry public immutable organRegistry;
    IKAIOSBurnRecordSource public immutable kaios;
    uint256 public immutable halfLifeSeconds;
    uint256 public totalMintedFromKaios;
    uint256 public totalBurnedForKship;
    uint256 public nextLotId = 1;

    mapping(bytes32 => bool) public maturedProofMinted;
    mapping(bytes32 => bool) public carrierProofRecorded;
    mapping(uint256 => DecayLot) private _decayLots;
    mapping(address => uint256[]) private _ownerLotIds;
    mapping(bytes32 => CarrierBurnRecord) private _carrierBurnRecords;
    bool private _controlledDecayBurn;

    error ZeroAddress();
    error ZeroAmount();
    error InvalidHalfLife();
    error OnlyCurrentWormhole(address caller);
    error OnlyCurrentKshipConverter(address caller);
    error ProofAlreadyUsed(bytes32 proofId);
    error InvalidLineageProof(bytes32 proofId);
    error InsufficientHolderAllowance(uint256 currentAllowance, uint256 requiredAllowance);
    error NoMaturedDecay(address owner, uint256 requestedMaximum);
    error LineageBalanceMismatch(address owner, uint256 missingAmount);

    event MaturedProofMinted(
        bytes32 indexed proofId,
        uint256 indexed lotId,
        address indexed beneficiary,
        uint256 kufoAmount,
        uint64 bornAt
    );
    event DecayLotSplit(
        uint256 indexed parentLotId,
        uint256 indexed childLotId,
        address indexed newOwner,
        uint256 childInitialAmount,
        uint256 childConvertedAmount
    );
    event KUFOBurnedForCarrier(
        bytes32 indexed carrierProofId,
        address indexed owner,
        address indexed beneficiary,
        uint256 kufoBurned,
        uint256 expectedKship
    );

    constructor(address registry, address kaiosToken, uint256 kufoHalfLifeSeconds)
        ERC20("KUFO Alchemy Mass", "KUFO")
        ERC20Capped(MAX_SUPPLY)
    {
        if (registry == address(0) || kaiosToken == address(0)) revert ZeroAddress();
        if (kufoHalfLifeSeconds == 0) revert InvalidHalfLife();
        organRegistry = IKAIOSOrganRegistry(registry);
        kaios = IKAIOSBurnRecordSource(kaiosToken);
        halfLifeSeconds = kufoHalfLifeSeconds;
    }

    function mintFromMaturedProof(bytes32 proofId) external returns (address beneficiary, uint256 amount) {
        address wormhole = organRegistry.organ(ORGAN_WORMHOLE_511111);
        if (msg.sender != wormhole || wormhole == address(0)) revert OnlyCurrentWormhole(msg.sender);
        if (maturedProofMinted[proofId]) revert ProofAlreadyUsed(proofId);

        IKAIOSBurnRecordSource.AlchemyBurnRecord memory burnRecord = kaios.alchemyBurnRecord(proofId);
        if (
            burnRecord.owner == address(0) ||
            burnRecord.catalystOwner == address(0) ||
            burnRecord.beneficiary == address(0) ||
            burnRecord.furnace == address(0) ||
            burnRecord.kaiosBurned == 0 ||
            burnRecord.kaiosBurned % KAIOS_WEI_PER_KGEN_CATALYST_WEI != 0 ||
            burnRecord.requiredKgenCatalyst != burnRecord.kaiosBurned / KAIOS_WEI_PER_KGEN_CATALYST_WEI ||
            burnRecord.expectedKufo != burnRecord.kaiosBurned * 1_000
        ) revert InvalidLineageProof(proofId);

        IAlchemyFurnaceProofSource furnace = IAlchemyFurnaceProofSource(burnRecord.furnace);
        IAlchemyFurnaceProofSource.Proof memory furnaceProof = furnace.proof(proofId);
        if (
            !furnaceProof.consumed ||
            !furnaceProof.catalystReturned ||
            furnace.currentEpoch() < furnaceProof.maturityEpoch ||
            furnaceProof.owner != burnRecord.owner ||
            furnaceProof.catalystOwner != burnRecord.catalystOwner ||
            furnaceProof.beneficiary != burnRecord.beneficiary ||
            furnaceProof.kaiosBurned != burnRecord.kaiosBurned ||
            furnaceProof.kgenCatalystAmount != burnRecord.requiredKgenCatalyst ||
            furnaceProof.kufoAmount != burnRecord.expectedKufo ||
            furnaceProof.memorialProofId == bytes32(0)
        ) revert InvalidLineageProof(proofId);

        beneficiary = burnRecord.beneficiary;
        amount = burnRecord.expectedKufo;
        maturedProofMinted[proofId] = true;
        totalMintedFromKaios += amount;
        _mint(beneficiary, amount);
        uint256 lotId = _createLot(beneficiary, amount, 0, uint64(block.timestamp), proofId);
        emit MaturedProofMinted(proofId, lotId, beneficiary, amount, uint64(block.timestamp));
    }

    function burnMaturedDecayForCarrier(
        address owner,
        address beneficiary,
        uint256 maximumKufoAmount,
        bytes32 carrierProofId
    ) external returns (uint256 kufoBurned, uint256 expectedKship) {
        address converter = organRegistry.organ(ORGAN_KSHIP_CONVERTER);
        if (msg.sender != converter || converter == address(0)) revert OnlyCurrentKshipConverter(msg.sender);
        if (owner == address(0) || beneficiary == address(0)) revert ZeroAddress();
        if (maximumKufoAmount == 0) revert ZeroAmount();
        if (carrierProofRecorded[carrierProofId]) revert ProofAlreadyUsed(carrierProofId);

        uint256 currentAllowance = allowance(owner, msg.sender);
        if (currentAllowance < maximumKufoAmount) {
            revert InsufficientHolderAllowance(currentAllowance, maximumKufoAmount);
        }

        kufoBurned = _consumeMaturedDecay(owner, maximumKufoAmount);
        if (kufoBurned == 0) revert NoMaturedDecay(owner, maximumKufoAmount);
        carrierProofRecorded[carrierProofId] = true;
        expectedKship = kufoBurned * KSHIP_PER_KUFO;
        _spendAllowance(owner, msg.sender, kufoBurned);
        _controlledDecayBurn = true;
        _burn(owner, kufoBurned);
        _controlledDecayBurn = false;
        totalBurnedForKship += kufoBurned;
        _carrierBurnRecords[carrierProofId] = CarrierBurnRecord({
            owner: owner,
            beneficiary: beneficiary,
            converter: msg.sender,
            kufoBurned: kufoBurned,
            expectedKship: expectedKship,
            timestamp: block.timestamp
        });
        emit KUFOBurnedForCarrier(carrierProofId, owner, beneficiary, kufoBurned, expectedKship);
    }

    function decayLot(uint256 lotId) external view returns (DecayLot memory) {
        return _decayLots[lotId];
    }

    function ownerLotIds(address owner) external view returns (uint256[] memory) {
        return _ownerLotIds[owner];
    }

    function carrierBurnRecord(bytes32 proofId) external view returns (CarrierBurnRecord memory) {
        return _carrierBurnRecords[proofId];
    }

    function completedHalfLives(uint256 lotId) public view returns (uint256) {
        DecayLot memory lot = _decayLots[lotId];
        if (lot.owner == address(0) || block.timestamp <= lot.bornAt) return 0;
        return (block.timestamp - lot.bornAt) / halfLifeSeconds;
    }

    function cumulativeDecayedAmount(uint256 lotId) public view returns (uint256) {
        DecayLot memory lot = _decayLots[lotId];
        return lot.initialAmount - remainingAmount(lotId);
    }

    function remainingAmount(uint256 lotId) public view returns (uint256) {
        DecayLot memory lot = _decayLots[lotId];
        if (lot.owner == address(0) || block.timestamp <= lot.bornAt) return lot.initialAmount;
        uint256 elapsed = block.timestamp - lot.bornAt;
        uint256 wholeHalfLives = elapsed / halfLifeSeconds;
        if (wholeHalfLives >= 256) return 0;
        uint256 wholeRemaining = lot.initialAmount >> wholeHalfLives;
        uint256 remainder = elapsed % halfLifeSeconds;
        if (remainder == 0 || wholeRemaining == 0) return wholeRemaining;
        uint256 fractionBits = Math.mulDiv(remainder, 1 << 32, halfLifeSeconds);
        return Math.mulDiv(wholeRemaining, _fractionalDecayFactor(fractionBits), WAD);
    }

    function claimableDecay(uint256 lotId) public view returns (uint256) {
        DecayLot memory lot = _decayLots[lotId];
        uint256 cumulative = cumulativeDecayedAmount(lotId);
        return cumulative > lot.convertedAmount ? cumulative - lot.convertedAmount : 0;
    }

    function claimableDecayOf(address owner) external view returns (uint256 total) {
        uint256[] storage ids = _ownerLotIds[owner];
        for (uint256 index = 0; index < ids.length; ++index) {
            if (_decayLots[ids[index]].owner == owner) total += claimableDecay(ids[index]);
        }
    }

    function conservationInvariantHolds() external view returns (bool) {
        return totalSupply() + totalBurnedForKship == totalMintedFromKaios;
    }

    function _consumeMaturedDecay(address owner, uint256 maximumAmount) private returns (uint256 consumed) {
        uint256[] storage ids = _ownerLotIds[owner];
        for (uint256 index = 0; index < ids.length && consumed < maximumAmount; ++index) {
            DecayLot storage lot = _decayLots[ids[index]];
            if (lot.owner != owner) continue;
            uint256 available = claimableDecay(ids[index]);
            if (available == 0) continue;
            uint256 take = Math.min(available, maximumAmount - consumed);
            lot.convertedAmount += take;
            consumed += take;
        }
    }

    function _moveLots(address from, address to, uint256 amount) private {
        uint256 remainingToMove = amount;
        uint256[] storage ids = _ownerLotIds[from];
        for (uint256 index = 0; index < ids.length && remainingToMove > 0; ++index) {
            uint256 lotId = ids[index];
            DecayLot storage lot = _decayLots[lotId];
            if (lot.owner != from) continue;
            uint256 lotBalance = lot.initialAmount - lot.convertedAmount;
            if (lotBalance == 0) continue;
            uint256 take = Math.min(lotBalance, remainingToMove);
            if (take == lotBalance) {
                lot.owner = to;
                _ownerLotIds[to].push(lotId);
            } else {
                uint256 childInitial = Math.mulDiv(lot.initialAmount, take, lotBalance);
                uint256 childConverted = childInitial - take;
                lot.initialAmount -= childInitial;
                lot.convertedAmount -= childConverted;
                uint256 childId = _createLot(to, childInitial, childConverted, lot.bornAt, lot.sourceProof);
                emit DecayLotSplit(lotId, childId, to, childInitial, childConverted);
            }
            remainingToMove -= take;
        }
        if (remainingToMove != 0) revert LineageBalanceMismatch(from, remainingToMove);
    }

    function _createLot(
        address owner,
        uint256 initialAmount,
        uint256 convertedAmount,
        uint64 bornAt,
        bytes32 sourceProof
    ) private returns (uint256 lotId) {
        lotId = nextLotId++;
        _decayLots[lotId] = DecayLot(owner, initialAmount, convertedAmount, bornAt, sourceProof);
        _ownerLotIds[owner].push(lotId);
    }

    function _fractionalDecayFactor(uint256 bits) private pure returns (uint256 factor) {
        factor = WAD;
        if ((bits & 0x80000000) != 0) factor = Math.mulDiv(factor, 707106781186547524, WAD);
        if ((bits & 0x40000000) != 0) factor = Math.mulDiv(factor, 840896415253714543, WAD);
        if ((bits & 0x20000000) != 0) factor = Math.mulDiv(factor, 917004043204671231, WAD);
        if ((bits & 0x10000000) != 0) factor = Math.mulDiv(factor, 957603280698573646, WAD);
        if ((bits & 0x08000000) != 0) factor = Math.mulDiv(factor, 978572062087700134, WAD);
        if ((bits & 0x04000000) != 0) factor = Math.mulDiv(factor, 989228013193975484, WAD);
        if ((bits & 0x02000000) != 0) factor = Math.mulDiv(factor, 994599423483633175, WAD);
        if ((bits & 0x01000000) != 0) factor = Math.mulDiv(factor, 997296056085470126, WAD);
        if ((bits & 0x00800000) != 0) factor = Math.mulDiv(factor, 998647112890970173, WAD);
        if ((bits & 0x00400000) != 0) factor = Math.mulDiv(factor, 999323327502650752, WAD);
        if ((bits & 0x00200000) != 0) factor = Math.mulDiv(factor, 999661606496243683, WAD);
        if ((bits & 0x00100000) != 0) factor = Math.mulDiv(factor, 999830788931929063, WAD);
        if ((bits & 0x00080000) != 0) factor = Math.mulDiv(factor, 999915390886613497, WAD);
        if ((bits & 0x00040000) != 0) factor = Math.mulDiv(factor, 999957694548431132, WAD);
        if ((bits & 0x00020000) != 0) factor = Math.mulDiv(factor, 999978847050491929, WAD);
        if ((bits & 0x00010000) != 0) factor = Math.mulDiv(factor, 999989423469314464, WAD);
        if ((bits & 0x00008000) != 0) factor = Math.mulDiv(factor, 999994711720674283, WAD);
        if ((bits & 0x00004000) != 0) factor = Math.mulDiv(factor, 999997355856841394, WAD);
        if ((bits & 0x00002000) != 0) factor = Math.mulDiv(factor, 999998677927546759, WAD);
        if ((bits & 0x00001000) != 0) factor = Math.mulDiv(factor, 999999338963554895, WAD);
        if ((bits & 0x00000800) != 0) factor = Math.mulDiv(factor, 999999669481722826, WAD);
        if ((bits & 0x00000400) != 0) factor = Math.mulDiv(factor, 999999834740847757, WAD);
        if ((bits & 0x00000200) != 0) factor = Math.mulDiv(factor, 999999917370420465, WAD);
        if ((bits & 0x00000100) != 0) factor = Math.mulDiv(factor, 999999958685209379, WAD);
        if ((bits & 0x00000080) != 0) factor = Math.mulDiv(factor, 999999979342604476, WAD);
        if ((bits & 0x00000040) != 0) factor = Math.mulDiv(factor, 999999989671302184, WAD);
        if ((bits & 0x00000020) != 0) factor = Math.mulDiv(factor, 999999994835651079, WAD);
        if ((bits & 0x00000010) != 0) factor = Math.mulDiv(factor, 999999997417825536, WAD);
        if ((bits & 0x00000008) != 0) factor = Math.mulDiv(factor, 999999998708912767, WAD);
        if ((bits & 0x00000004) != 0) factor = Math.mulDiv(factor, 999999999354456383, WAD);
        if ((bits & 0x00000002) != 0) factor = Math.mulDiv(factor, 999999999677228191, WAD);
        if ((bits & 0x00000001) != 0) factor = Math.mulDiv(factor, 999999999838614095, WAD);
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
    {
        if (from != address(0) && to != address(0) && from != to) {
            _moveLots(from, to, value);
        } else if (to == address(0) && !_controlledDecayBurn) {
            revert InvalidLineageProof(bytes32(0));
        }
        super._update(from, to, value);
    }
}
