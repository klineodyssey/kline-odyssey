// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {AccessControlDefaultAdminRules} from "@openzeppelin/contracts/access/extensions/AccessControlDefaultAdminRules.sol";

/**
 * @title KAIOSV02_BurnProofGenesis
 * @notice REVIEW DRAFT ONLY. Not audited. Not authorized for testnet/mainnet.
 * @dev Zero genesis supply, zero native tax, no public burn, capped automatic mint from verified KGEN burn proofs only.
 */
contract KAIOSV02_BurnProofGenesis is ERC20, ERC20Capped, AccessControlDefaultAdminRules {
    bytes32 public constant BURN_PROOF_MINTER_ROLE = keccak256("BURN_PROOF_MINTER_ROLE");
    uint256 public constant KAIOS_PER_KGEN = 10_000;
    uint256 public constant MAX_SUPPLY = 720_000_000_000 ether;
    uint48 public constant ADMIN_TRANSFER_DELAY = 2 days;

    string public constant GENESIS_INSCRIPTION =
        "NO KGEN BURN, NO KAIOS MINT. ONE BURNED KGEN CREATES TEN THOUSAND KAIOS. CIVILIZATION MASS SHALL BE CONSERVED.";
    bytes32 public constant GENESIS_INSCRIPTION_HASH = keccak256(bytes(GENESIS_INSCRIPTION));

    enum BurnSource {
        SystemAmmTax,
        VoluntaryPlayerOffering
    }

    struct BurnRecord {
        BurnSource source;
        address burner;
        address recipientVault;
        uint256 kgenBurnAmount;
        uint256 kaiosMintAmount;
        bytes32 civilizationId;
        bytes32 purposeCode;
        bytes32 wishHash;
    }

    mapping(bytes32 => bool) public burnProofConsumed;
    mapping(bytes32 => BurnRecord) private _burnRecords;
    uint256 public totalVerifiedKgenBurned;

    error ZeroAddress();
    error ZeroAmount();
    error InvalidBurnProofId();
    error BurnProofAlreadyConsumed(bytes32 burnProofId);

    event KAIOSMintedFromKGENBurn(
        bytes32 indexed burnProofId,
        BurnSource indexed source,
        address indexed burner,
        address recipientVault,
        uint256 kgenBurnAmount,
        uint256 kaiosMintAmount,
        bytes32 civilizationId,
        bytes32 purposeCode,
        bytes32 wishHash,
        address proofMinter
    );

    constructor(address initialAdmin, address initialBurnProofMinter)
        ERC20("KAIOS Civilization Credit", "KAIOS")
        ERC20Capped(MAX_SUPPLY)
        AccessControlDefaultAdminRules(ADMIN_TRANSFER_DELAY, initialAdmin)
    {
        if (initialAdmin == address(0) || initialBurnProofMinter == address(0)) revert ZeroAddress();
        _grantRole(BURN_PROOF_MINTER_ROLE, initialBurnProofMinter);
    }

    function mintFromVerifiedKgenBurn(
        bytes32 burnProofId,
        BurnSource source,
        address burner,
        address recipientVault,
        uint256 kgenBurnAmount,
        bytes32 civilizationId,
        bytes32 purposeCode,
        bytes32 wishHash
    ) external onlyRole(BURN_PROOF_MINTER_ROLE) returns (uint256 kaiosMintAmount) {
        if (burnProofId == bytes32(0)) revert InvalidBurnProofId();
        if (burner == address(0) || recipientVault == address(0)) revert ZeroAddress();
        if (kgenBurnAmount == 0) revert ZeroAmount();
        if (burnProofConsumed[burnProofId]) revert BurnProofAlreadyConsumed(burnProofId);

        kaiosMintAmount = kgenBurnAmount * KAIOS_PER_KGEN;
        burnProofConsumed[burnProofId] = true;
        totalVerifiedKgenBurned += kgenBurnAmount;
        _burnRecords[burnProofId] = BurnRecord({
            source: source,
            burner: burner,
            recipientVault: recipientVault,
            kgenBurnAmount: kgenBurnAmount,
            kaiosMintAmount: kaiosMintAmount,
            civilizationId: civilizationId,
            purposeCode: purposeCode,
            wishHash: wishHash
        });

        _mint(recipientVault, kaiosMintAmount);

        emit KAIOSMintedFromKGENBurn(
            burnProofId,
            source,
            burner,
            recipientVault,
            kgenBurnAmount,
            kaiosMintAmount,
            civilizationId,
            purposeCode,
            wishHash,
            msg.sender
        );
    }

    function burnRecord(bytes32 burnProofId) external view returns (BurnRecord memory) {
        return _burnRecords[burnProofId];
    }

    function conservationInvariantHolds() external view returns (bool) {
        return totalSupply() == totalVerifiedKgenBurned * KAIOS_PER_KGEN;
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
