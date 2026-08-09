// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

interface IKAIOSSettlementLineage {
    function KGEN() external view returns (address);
    function LINGXIAO_TREASURY_18888() external view returns (address);
}

/**
 * @title LingxiaoCelestialBank18888_Upgradeable
 * @notice Current 18888 Lingxiao Celestial Bank life for KAIOS white-hole settlement.
 * @dev V2 runtime is deliberately receive-only. ERC-20 transfers and minting increase
 *      this proxy's token balance without a receiver callback. This implementation has
 *      no token withdrawal, release, sweep, rescue, approval or player transferFrom path.
 *
 * Lineage:
 * - Genesis: KGEN_GalacticBank_V7_5_2, historical BigBang Galactic Bank organ.
 * - Generation 1: KGEN_LingxiaoDeityBank_V1_0_1, KGEN Bank 0.10% design.
 * - Current evolution: this UUPS Bank, KAIOS white-hole settlement runtime.
 *
 * A future governance-approved implementation may evolve the Bank through UUPS.
 * The receive-only guarantee applies to this V2 implementation, not every possible
 * future implementation authorized by governance.
 */
contract LingxiaoCelestialBank18888_Upgradeable is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    address public kgen;
    address public kaios;
    bool public kaiosBound;

    uint256[48] private __gap;

    error ZeroAddress();
    error NotAContract(address account);
    error KAIOSAlreadyBound(address currentKaios);
    error KAIOSKgenMismatch(address expectedKgen, address actualKgen);
    error KAIOSSettlementTargetMismatch(address expectedTreasury, address actualTreasury);

    event TreasuryInitialized(
        address indexed admin,
        address indexed upgrader,
        address indexed kgen
    );
    event KAIOSBound(address indexed kaios, address indexed kgen, address indexed treasury);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin, address upgrader, address canonicalKgen)
        external
        initializer
    {
        if (admin == address(0) || upgrader == address(0) || canonicalKgen == address(0)) {
            revert ZeroAddress();
        }
        if (canonicalKgen.code.length == 0) revert NotAContract(canonicalKgen);

        __AccessControl_init();
        __UUPSUpgradeable_init();

        kgen = canonicalKgen;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, upgrader);

        emit TreasuryInitialized(admin, upgrader, canonicalKgen);
    }

    function bindKAIOS(address canonicalKaios) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (kaiosBound) revert KAIOSAlreadyBound(kaios);
        if (canonicalKaios == address(0)) revert ZeroAddress();
        if (canonicalKaios.code.length == 0) revert NotAContract(canonicalKaios);

        address reportedKgen = IKAIOSSettlementLineage(canonicalKaios).KGEN();
        if (reportedKgen != kgen) revert KAIOSKgenMismatch(kgen, reportedKgen);

        address reportedTreasury =
            IKAIOSSettlementLineage(canonicalKaios).LINGXIAO_TREASURY_18888();
        if (reportedTreasury != address(this)) {
            revert KAIOSSettlementTargetMismatch(address(this), reportedTreasury);
        }

        kaios = canonicalKaios;
        kaiosBound = true;

        emit KAIOSBound(canonicalKaios, kgen, address(this));
    }

    function version() external pure returns (string memory) {
        return "2.0.0";
    }

    function runtimeMode() external pure returns (string memory) {
        return "RECEIVE_ONLY_LOCKED";
    }

    function kaiosBalance() external view returns (uint256) {
        return kaiosBound ? IERC20(kaios).balanceOf(address(this)) : 0;
    }

    function _authorizeUpgrade(address) internal override onlyRole(UPGRADER_ROLE) {}
}
