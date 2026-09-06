// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title KAIOS UFO Propulsion Physics V1
/// @notice Deterministic accounting/simulation only. It does not move tokens, mint KGOD, or execute propulsion.
/// @dev Uses mass-equivalent units and integer fixed point. Relativistic flight requires a later runtime.
contract KAIOSUFOPropulsionPhysicsV1 {
    uint256 public constant BPS = 10_000;
    uint256 public constant C_M_PER_S = 299_792_458;
    uint256 public constant MG_PER_KG = 1_000_000;
    uint256 public constant WAD = 1e18;

    error InvalidInput();
    error MatterMismatch(uint256 positiveMatterMgPerSec, uint256 kshipMgPerSec);
    error InvalidEfficiency();
    error ExhaustVelocityTooHigh();

    struct EngineProfile {
        uint16 reactionEfficiencyBps;
        uint16 propulsionFractionBps;
        uint16 recoverableFractionBps;
        uint16 kgodFractionBps;
        uint16 radiationHeatFractionBps;
        uint64 exhaustVelocityMPerSec;
    }

    struct FlightInput {
        bytes32 shipId;
        uint256 shipMassKgWad;
        uint256 kshipMgPerSecWad;
        uint256 positiveMatterMgPerSecWad;
        uint256 durationSec;
        EngineProfile engine;
    }

    struct FlightOutput {
        uint256 kshipConsumedMgWad;
        uint256 positiveMatterConsumedMgWad;
        uint256 reactedMassKgWad;
        uint256 reactionEnergyJouleWad;
        uint256 averageReactionPowerWattWad;
        uint256 propulsionEnergyJouleWad;
        uint256 recoverableEnergyJouleWad;
        uint256 kgodMassEquivalentKgWad;
        uint256 radiationHeatEnergyJouleWad;
        uint256 thrustNewtonWad;
        uint256 accelerationMps2Wad;
        uint256 deltaVMpsWad;
        uint256 distanceMeterWad;
    }

    function simulate(FlightInput calldata x) external pure returns (FlightOutput memory o) {
        if (x.shipId == bytes32(0) || x.shipMassKgWad == 0 || x.durationSec == 0 || x.kshipMgPerSecWad == 0) revert InvalidInput();
        if (x.positiveMatterMgPerSecWad != x.kshipMgPerSecWad) {
            revert MatterMismatch(x.positiveMatterMgPerSecWad, x.kshipMgPerSecWad);
        }
        EngineProfile calldata e = x.engine;
        if (e.reactionEfficiencyBps > BPS || uint256(e.propulsionFractionBps) + e.recoverableFractionBps + e.kgodFractionBps + e.radiationHeatFractionBps != BPS) revert InvalidEfficiency();
        if (e.exhaustVelocityMPerSec == 0 || e.exhaustVelocityMPerSec >= C_M_PER_S) revert ExhaustVelocityTooHigh();

        o.kshipConsumedMgWad = x.kshipMgPerSecWad * x.durationSec;
        o.positiveMatterConsumedMgWad = x.positiveMatterMgPerSecWad * x.durationSec;

        uint256 totalInputMgWad = o.kshipConsumedMgWad + o.positiveMatterConsumedMgWad;
        uint256 inputMassKgWad = totalInputMgWad / MG_PER_KG;
        o.reactedMassKgWad = inputMassKgWad * e.reactionEfficiencyBps / BPS;

        // E = m c^2. kgWad * (m/s)^2 => jouleWad.
        o.reactionEnergyJouleWad = o.reactedMassKgWad * C_M_PER_S * C_M_PER_S;
        o.averageReactionPowerWattWad = o.reactionEnergyJouleWad / x.durationSec;

        o.propulsionEnergyJouleWad = o.reactionEnergyJouleWad * e.propulsionFractionBps / BPS;
        o.recoverableEnergyJouleWad = o.reactionEnergyJouleWad * e.recoverableFractionBps / BPS;
        uint256 kgodEnergyJouleWad = o.reactionEnergyJouleWad * e.kgodFractionBps / BPS;
        o.radiationHeatEnergyJouleWad = o.reactionEnergyJouleWad * e.radiationHeatFractionBps / BPS;
        o.kgodMassEquivalentKgWad = kgodEnergyJouleWad / (C_M_PER_S * C_M_PER_S);

        // Non-relativistic directed exhaust approximation: P = F*v_e/2 => F = 2P/v_e.
        uint256 propulsionPowerWattWad = o.propulsionEnergyJouleWad / x.durationSec;
        o.thrustNewtonWad = (2 * propulsionPowerWattWad) / e.exhaustVelocityMPerSec;
        o.accelerationMps2Wad = o.thrustNewtonWad * WAD / x.shipMassKgWad;
        o.deltaVMpsWad = o.accelerationMps2Wad * x.durationSec;
        o.distanceMeterWad = o.accelerationMps2Wad * x.durationSec * x.durationSec / 2;
    }
}
