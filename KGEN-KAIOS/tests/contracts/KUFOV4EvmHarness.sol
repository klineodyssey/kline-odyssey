// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {KUFO} from "../../contracts/KUFO.sol";

interface IKUFOV4Mintable {
    function mintFromImmediateProof(bytes32 proofId, address beneficiary, uint256 amount) external returns (uint256 lotId);
}

interface IKUFOV4Transferable is IKUFOV4Mintable {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function burnForCarrier(address owner, address beneficiary, uint256 amount, bytes32 proofId)
        external returns (uint256 expectedKship);
}

interface IKSHIPV4TestMinter {
    function mintFromCarrierProof(bytes32 proofId) external returns (address beneficiary, uint256 amount);
}

interface IKAIOSV4TestBurnSource {
    function burnForAlchemy(address owner, address beneficiary, uint256 amount, bytes32 lifeId, bytes32 destination)
        external returns (bytes32 proofId, uint256 expectedKufo);
}

interface IKUFOV4TestFurnace {
    function consumeImmediateProof(bytes32 proofId) external returns (address beneficiary, uint256 amount);
}

interface IKUFOV4CarrierRecord {
    struct CarrierBurnRecord {
        address owner;
        address beneficiary;
        address converter;
        uint256 kufoBurned;
        uint256 expectedKship;
    }

    function carrierBurnRecord(bytes32 proofId) external view returns (CarrierBurnRecord memory);
}

contract KUFOV4MockOrganRegistry {
    mapping(bytes32 => address) private _organs;
    address public owner;
    uint64 public minimumDelay;

    constructor() {
        owner = msg.sender;
        minimumDelay = 1 hours;
    }

    // Local governance fixtures only. Production Registry owns its own policy.
    function setOwner(address nextOwner) external {
        require(msg.sender == owner, "ONLY_TEST_OWNER");
        owner = nextOwner;
    }

    function setMinimumDelay(uint64 delay) external {
        require(msg.sender == owner, "ONLY_TEST_OWNER");
        minimumDelay = delay;
    }

    function setOrgan(bytes32 organId, address organAddress) external {
        _organs[organId] = organAddress;
    }

    function organ(bytes32 organId) external view returns (address) {
        return _organs[organId];
    }
}

contract KUFOV4MockOutput {
    struct Proof {
        address owner;
        address beneficiary;
        uint256 kaiosBurned;
        uint256 requiredKgenBalance;
        uint256 observedKgenBalance;
        uint256 kufoAmount;
        bytes32 lifeId;
        bytes32 destinationCode;
        uint64 createdAt;
        bool consumed;
    }

    bytes32 private constant DESTINATION = keccak256("KAIOS.POINT.168888.JINDOUYUN.KUFO.OUTLET");
    IKAIOSV4TestBurnSource public immutable kaios;
    address public immutable kufo;
    address public immutable organRegistry;
    mapping(bytes32 => Proof) private _proofs;

    event FixtureMint(bytes32 indexed proofId, address indexed beneficiary, uint256 amount);

    constructor(address kaiosToken, address kufoToken, address registry) {
        kaios = IKAIOSV4TestBurnSource(kaiosToken);
        kufo = kufoToken;
        organRegistry = registry;
    }

    function canonicalKufo() external view returns (address) {
        return kufo;
    }

    // A test-only combined furnace/output. Every fixture mint burns real canonical
    // KAIOS with holder allowance and the exact 1:1000 ratio. Only the production
    // furnace's KGEN/minimum-input gate is omitted to exercise small token units.
    function mint(address kufoToken, bytes32 lifeId, address beneficiary, uint256 amount) external returns (bytes32 proofId) {
        proofId = _burnAndMint(kufoToken, msg.sender, lifeId, beneficiary, amount, true);
    }

    function mintWithUnconsumedProof(address kufoToken, bytes32 lifeId, address beneficiary, uint256 amount) external {
        _burnAndMint(kufoToken, msg.sender, lifeId, beneficiary, amount, false);
    }

    function _burnAndMint(address kufoToken, address owner, bytes32 lifeId, address beneficiary, uint256 amount, bool consumed)
        private returns (bytes32 proofId)
    {
        require(amount > 0 && amount % 1000 == 0, "EXACT_KAIOS_RATIO_REQUIRED");
        uint256 burned = amount / 1000;
        uint256 expected;
        (proofId, expected) = kaios.burnForAlchemy(owner, beneficiary, burned, lifeId, DESTINATION);
        require(expected == amount, "BURN_OUTPUT_MISMATCH");
        _proofs[proofId] = Proof(owner, beneficiary, burned, 0, 0, amount, lifeId, DESTINATION, uint64(block.timestamp), consumed);
        IKUFOV4Mintable(kufoToken).mintFromImmediateProof(proofId, beneficiary, amount);
        emit FixtureMint(proofId, beneficiary, amount);
    }

    function proof(bytes32 proofId) external view returns (Proof memory) {
        return _proofs[proofId];
    }

    function mintWithoutBurn(address kufoToken, bytes32 proofId, address beneficiary, uint256 amount) external {
        IKUFOV4Mintable(kufoToken).mintFromImmediateProof(proofId, beneficiary, amount);
    }

    // Local attack driver: unique proofs and unsolicited ordinary transfers.
    // This unrestricted harness must never be used as a production organ.
    function batchDust(address kufoToken, bytes32 salt, address victim, uint256 count, uint256 amount) external {
        for (uint256 i; i < count; ++i) {
            _burnAndMint(kufoToken, msg.sender, keccak256(abi.encode(salt, i)), address(this), 1000, true);
            require(IKUFOV4Transferable(kufoToken).transfer(victim, amount), "TRANSFER_FAILED");
        }
    }
}

// This current outlet consumes the real proof and returns the expected tuple,
// but deliberately omits KUFO minting. The production furnace must roll back.
contract KUFOV4NoMintOutput {
    IKUFOV4TestFurnace public immutable furnace;

    constructor(address furnaceAddress) {
        furnace = IKUFOV4TestFurnace(furnaceAddress);
    }

    function releaseImmediate(bytes32 proofId) external returns (address beneficiary, uint256 amount) {
        return furnace.consumeImmediateProof(proofId);
    }
}

// Deliberately unrestricted local harness for carrier validation/replay tests.
contract KUFOV4ReplayConverter {
    function burnAndMint(address kufo, address kship, address owner, address beneficiary, uint256 amount, bytes32 proofId)
        external
    {
        IKUFOV4Transferable(kufo).burnForCarrier(owner, beneficiary, amount, proofId);
        IKSHIPV4TestMinter(kship).mintFromCarrierProof(proofId);
    }

    function mintAgain(address kship, bytes32 proofId) external {
        IKSHIPV4TestMinter(kship).mintFromCarrierProof(proofId);
    }
}

// Test-only adversarial carrier. It consumes a genuine KUFO carrier-burn record
// and lies about one release postcondition at a time. Its immutable dependencies
// deliberately match the real token and registry so binding checks alone pass.
contract KUFOV4AdversarialKship is ERC20 {
    enum Fault { NoMint, WrongRecipient, ShortAmount, WrongCounter, ProofNotMarked, TupleMismatch }

    IKUFOV4CarrierRecord public immutable kufo;
    address public immutable organRegistry;
    address public immutable wrongRecipient;
    Fault public fault;
    uint256 public totalMintedFromKufo;
    mapping(bytes32 => bool) public carrierProofMinted;

    constructor(address registry, address kufoToken, address otherRecipient)
        ERC20("Adversarial KSHIP Test Fixture", "TESTKSHIP")
    {
        organRegistry = registry;
        kufo = IKUFOV4CarrierRecord(kufoToken);
        wrongRecipient = otherRecipient;
    }

    function setFault(Fault selected) external {
        fault = selected;
    }

    function mintFromCarrierProof(bytes32 proofId) external returns (address beneficiary, uint256 amount) {
        IKUFOV4CarrierRecord.CarrierBurnRecord memory record = kufo.carrierBurnRecord(proofId);
        require(record.owner != address(0) && record.beneficiary != address(0), "REAL_BURN_REQUIRED");
        require(record.converter == msg.sender && record.kufoBurned > 0, "REAL_CONVERTER_REQUIRED");
        require(record.expectedKship == record.kufoBurned * 1000, "EXACT_RATIO_REQUIRED");
        require(!carrierProofMinted[proofId], "PROOF_ALREADY_MINTED");
        beneficiary = record.beneficiary;
        amount = record.expectedKship;

        if (fault != Fault.ProofNotMarked) carrierProofMinted[proofId] = true;
        totalMintedFromKufo += fault == Fault.WrongCounter ? amount - 1 : amount;
        if (fault != Fault.NoMint) {
            address receiver = fault == Fault.WrongRecipient ? wrongRecipient : beneficiary;
            uint256 minted = fault == Fault.ShortAmount ? amount - 1 : amount;
            _mint(receiver, minted);
        }
        if (fault == Fault.TupleMismatch) amount -= 1;
    }
}

// Internal-index unit actor only. Setting a bitmap bit here creates no calendar
// group, mint, proof or holder entitlement. Never deploy this actor as KUFO.
contract KUFOV4BitmapHarness is KUFO {
    constructor(address registry, address kaiosToken, CalendarConfig memory cfg)
        KUFO(registry, kaiosToken, cfg)
    {}

    function testSetHeld(address holder, uint256 id) external {
        _setHeld(holder, id);
    }

    function testClearHeld(address holder, uint256 id) external {
        _clearHeld(holder, id);
    }

    function testNextHeld(address holder, uint256 afterId) external view returns (uint256) {
        return _nextHeld(holder, afterId);
    }
}
