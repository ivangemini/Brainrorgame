import { describe, expect, it } from 'vitest';
import {
  MAX_COMBAT_ENERGY,
  canCastActiveAbility,
  castActiveAbility,
  createActiveAbilityRuntimeState,
  currentActiveHasteMultiplier,
  energyGainForFortressHit,
  energyGainForUnitAttack,
  gainCombatEnergy,
  isTargetStunned,
  tickActiveAbilityRuntime
} from './activeAbilities';

describe('active combat abilities', () => {
  it('caps shared combat energy and rewards higher merge tiers modestly', () => {
    let state = createActiveAbilityRuntimeState(98);
    state = gainCombatEnergy(state, 9);
    expect(state.energy).toBe(MAX_COMBAT_ENERGY);
    expect(energyGainForUnitAttack(1)).toBe(1);
    expect(energyGainForUnitAttack(2)).toBe(2);
    expect(energyGainForUnitAttack(3)).toBe(3);
    expect(energyGainForFortressHit(4)).toBe(3);
    expect(energyGainForFortressHit(40)).toBe(8);
  });

  it('requires the matching family synergy and enough energy', () => {
    const state = createActiveAbilityRuntimeState(100);
    expect(canCastActiveAbility('slipstream-burst', state, 0, 80, true)).toBe('locked');
    expect(canCastActiveAbility('slipstream-burst', createActiveAbilityRuntimeState(10), 1, 80, true)).toBe('energy');
    expect(canCastActiveAbility('crust-mend', state, 1, 100, true)).toBe('full-fortress');
    expect(canCastActiveAbility('neon-nova', state, 1, 80, false)).toBe('no-target');
  });

  it('applies temporary haste and independent cooldowns', () => {
    const state = createActiveAbilityRuntimeState(100);
    const cast = castActiveAbility('slipstream-burst', state, 2, 500, 80, true);
    expect(cast.cast).toBe(true);
    expect(cast.effect?.kind).toBe('haste');
    expect(currentActiveHasteMultiplier(cast.state)).toBeCloseTo(0.72);
    expect(cast.state.energy).toBe(58);
    expect(cast.state.cooldowns['slipstream-burst']).toBe(14_000);
    expect(cast.state.cooldowns['neon-nova']).toBe(0);

    const ticked = tickActiveAbilityRuntime(cast.state, 4_700);
    expect(currentActiveHasteMultiplier(ticked)).toBe(1);
    expect(ticked.cooldowns['slipstream-burst']).toBe(9_300);
  });

  it('scales heal, burst and stun with synergy tier without one-shotting bosses', () => {
    const full = createActiveAbilityRuntimeState(100);
    const heal = castActiveAbility('crust-mend', full, 3, 1_000, 50, true);
    expect(heal.effect).toEqual({ kind: 'heal', amount: 36 });

    const nova = castActiveAbility('neon-nova', full, 3, 1_000, 50, true);
    expect(nova.effect).toEqual({ kind: 'burst', damage: 170 });

    const lock = castActiveAbility('quasar-lock', full, 3, 1_000, 50, true);
    expect(lock.effect).toEqual({ kind: 'stun', durationMs: 3_900 });
    expect(isTargetStunned(lock.state)).toBe(true);
    expect(isTargetStunned(tickActiveAbilityRuntime(lock.state, 4_000))).toBe(false);
  });

  it('does not spend energy or start cooldown when casting is blocked', () => {
    const state = createActiveAbilityRuntimeState(100);
    const blocked = castActiveAbility('crust-mend', state, 1, 500, 100, true);
    expect(blocked.cast).toBe(false);
    expect(blocked.reason).toBe('full-fortress');
    expect(blocked.state).toBe(state);
  });
});
