import { describe, expect, it } from 'vitest';
import {
  ANOMALY_PITY_MAX,
  ANOMALY_SECRET_PITY_MAX,
  anomalyChargePercent,
  createDefaultAnomalyHuntState,
  rollAnomalyHunt
} from './anomalyHunt';

describe('anomaly hunt', () => {
  it('builds visible charge after misses', () => {
    let state = createDefaultAnomalyHuntState();
    for (let i = 0; i < 8; i += 1) state = rollAnomalyHunt(state, 0.9).state;
    expect(state.charge).toBe(8);
    expect(anomalyChargePercent(state)).toBeGreaterThan(40);
  });

  it('guarantees a mutation at the normal pity ceiling', () => {
    let state = createDefaultAnomalyHuntState();
    for (let i = 1; i < ANOMALY_PITY_MAX; i += 1) state = rollAnomalyHunt(state, 0.9).state;
    const result = rollAnomalyHunt(state, 0.9);
    expect(result.guaranteed).toBe(true);
    expect(result.mutation).not.toBe('none');
    expect(result.state.charge).toBe(0);
  });

  it('guarantees a secret at the secret pity ceiling', () => {
    const state = {
      ...createDefaultAnomalyHuntState(),
      secretPity: ANOMALY_SECRET_PITY_MAX - 1
    };
    const result = rollAnomalyHunt(state, 0.9);
    expect(result.secret).toBe(true);
    expect(result.guaranteed).toBe(true);
    expect(result.mutation).toBe('crowned');
    expect(result.state.secretPity).toBe(0);
    expect(result.state.secretsFound).toBe(1);
  });

  it('can hit the ultra-rare secret before pity', () => {
    const result = rollAnomalyHunt(createDefaultAnomalyHuntState(), 0);
    expect(result.secret).toBe(true);
  });
});
