import { describe, expect, it } from 'vitest';
import { ASCENSION_NODES } from '../systems/ascension';
import { getAscensionCopy } from './ascensionCopy';

describe('Ascension copy', () => {
  it('covers every authored node in EN and RU', () => {
    for (const locale of ['en', 'ru'] as const) {
      const copy = getAscensionCopy(locale);
      for (const node of ASCENSION_NODES) {
        expect(copy.nodes[node.id].name.length).toBeGreaterThan(0);
        expect(copy.nodes[node.id].description.length).toBeGreaterThan(0);
      }
      expect(Object.keys(copy.branches).sort()).toEqual(['chaos', 'collection', 'combat', 'merge']);
    }
  });
});
