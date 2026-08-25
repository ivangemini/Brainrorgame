import { afterEach, describe, expect, it } from 'vitest';
import {
  MAX_COMBAT_ENERGY,
  beginActiveAbilityEncounter,
  canCastActiveAbility,
  castActiveAbility,
  createActiveAbilityRuntimeState,
  currentActiveDamageMultiplier,
  currentActiveGuardMultiplier,
  currentActiveHasteMultiplier,
  currentActiveRewardMultiplier,
  gainCombatEnergy,
  getCurrentActiveAbilityRuntime,
  recordCrewAttackEnergy,
  recordFortressHitEnergy,
  resetActiveAbilityRuntime,
  tickActiveAbilityRuntime,
  tickCurrentActiveAbilityRuntime,
  tryCastCurrentActiveAbility
} from './activeAbilities';
import { resetCurrentChaosPerks, syncCurrentChaosPerks } from './chaosDraft';

afterEach(() => {
  resetActiveAbilityRuntime();
  resetCurrentChaosPerks();
});

describe('active combat abilities', () => {
  it('caps shared combat energy and gains charge from combat events', () => {
    let state = createActiveAbilityRuntimeState(98);
    state = gainCombatEnergy(state, 9);
    expect(state.energy).toBe(MAX_COMBAT_ENERGY);

    beginActiveAbilityEncounter('wave-1');
    recordCrewAttackEnergy();
    recordCrewAttackEnergy();
    recordFortressHitEnergy();
    expect(getCurrentActiveAbilityRuntime().energy).toBe(6);
  });

  it('preserves fractional capacitor gains so four crew hits produce five energy', () => {
    syncCurrentChaosPerks(['chaos-capacitor']);
    beginActiveAbilityEncounter('capacitor-wave');
    for (let index = 0; index < 4; index += 1) recordCrewAttackEnergy();
    expect(getCurrentActiveAbilityRuntime().energy).toBe(5);
    recordFortressHitEnergy();
    expect(getCurrentActiveAbilityRuntime().energy).toBe(10);
  });

  it('requires matching family synergy, an active target and enough energy', () => {
    const state = createActiveAbilityRuntimeState(100);
    expect(canCastActiveAbility('slipstream-burst', state, 0, true)).toBe('locked');
    expect(canCastActiveAbility('slipstream-burst', createActiveAbilityRuntimeState(10), 1, true)).toBe('energy');
    expect(canCastActiveAbility('neon-overdrive', state, 1, false)).toBe('no-target');
  });

  it('applies distinct temporary buffs with independent cooldowns', () => {
    const state = createActiveAbilityRuntimeState(100);
    const haste = castActiveAbility('slipstream-burst', state, 2, true);
    expect(haste.cast).toBe(true);
    expect(haste.effect).toEqual({ kind: 'haste', durationMs: 4_600, multiplier: 0.72 });
    expect(haste.state.energy).toBe(58);
    expect(haste.state.cooldowns['slipstream-burst']).toBe(14_000);
    expect(haste.state.cooldowns['neon-overdrive']).toBe(0);

    const guard = castActiveAbility('crust-guard', state, 3, true);
    expect(guard.effect).toEqual({ kind: 'guard', durationMs: 6_000, multiplier: 0.58 });
    const overdrive = castActiveAbility('neon-overdrive', state, 3, true);
    expect(overdrive.effect).toEqual({ kind: 'overdrive', durationMs: 5_200, multiplier: 1.55 });
    const jackpot = castActiveAbility('quasar-jackpot', state, 3, true);
    expect(jackpot.effect).toEqual({ kind: 'jackpot', durationMs: 6_600, multiplier: 1.8 });
  });

  it('expires buffs while cooldowns continue independently', () => {
    const state = createActiveAbilityRuntimeState(100);
    const cast = castActiveAbility('slipstream-burst', state, 1, true);
    const ticked = tickActiveAbilityRuntime(cast.state, 4_100);
    expect(ticked.hasteRemainingMs).toBe(0);
    expect(ticked.hasteMultiplier).toBe(1);
    expect(ticked.cooldowns['slipstream-burst']).toBe(9_900);
  });

  it('drives the singleton runtime used by combat math and resets on a new encounter', () => {
    beginActiveAbilityEncounter('chapter-2-wave-4');
    for (let index = 0; index < 50; index += 1) recordCrewAttackEnergy();
    const cast = tryCastCurrentActiveAbility('neon-overdrive', 2);
    expect(cast.cast).toBe(true);
    expect(currentActiveDamageMultiplier()).toBeCloseTo(1.38);
    expect(currentActiveHasteMultiplier()).toBe(1);
    expect(currentActiveGuardMultiplier()).toBe(1);
    expect(currentActiveRewardMultiplier()).toBe(1);

    tickCurrentActiveAbilityRuntime(4_700);
    expect(currentActiveDamageMultiplier()).toBe(1);

    beginActiveAbilityEncounter('chapter-2-wave-5');
    expect(getCurrentActiveAbilityRuntime().energy).toBe(0);
    expect(getCurrentActiveAbilityRuntime().cooldowns['neon-overdrive']).toBe(0);
  });
});
