import { describe, expect, it } from 'vitest';
import { applyEliteModifier, getEliteModifierForWave } from './eliteModifiers';

describe('elite wave modifiers', () => {
  it('protects the first two chapters from elite pressure', () => {
    expect(getEliteModifierForWave(1, 1)).toBeNull();
    expect(getEliteModifierForWave(2, 3)).toBeNull();
  });

  it('spawns exactly one deterministic elite wave per chapter from chapter three', () => {
    expect(getEliteModifierForWave(3, 1)?.id).toBe('berserk');
    expect(getEliteModifierForWave(3, 2)).toBeNull();
    expect(getEliteModifierForWave(4, 2)?.id).toBe('bulwark');
    expect(getEliteModifierForWave(5, 3)?.id).toBe('siege');
    expect(getEliteModifierForWave(6, 1)?.id).toBe('berserk');
  });

  it('keeps elite rewards positive while applying distinct combat pressure', () => {
    const base = { hp: 300, damage: 10, attackMs: 3000, reward: 40 };
    const berserk = getEliteModifierForWave(3, 1);
    const bulwark = getEliteModifierForWave(4, 2);
    const siege = getEliteModifierForWave(5, 3);
    if (!berserk || !bulwark || !siege) throw new Error('Expected configured elite modifiers');

    const fast = applyEliteModifier(base, berserk);
    const tank = applyEliteModifier(base, bulwark);
    const breaker = applyEliteModifier(base, siege);

    expect(fast.attackMs).toBeLessThan(base.attackMs);
    expect(tank.hp).toBeGreaterThan(base.hp);
    expect(breaker.damage).toBeGreaterThan(base.damage);
    expect(fast.reward).toBeGreaterThan(base.reward);
    expect(tank.reward).toBeGreaterThan(base.reward);
    expect(breaker.reward).toBeGreaterThan(base.reward);
  });
});
