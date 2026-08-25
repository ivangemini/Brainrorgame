import { describe, expect, it } from 'vitest';
import {
  INTERSTITIAL_MIN_GAP_MS,
  INTERSTITIAL_MIN_SESSION_MS,
  shouldRequestChapterInterstitial
} from './adPolicy';

describe('chapter interstitial policy', () => {
  it('protects early-session momentum', () => {
    expect(shouldRequestChapterInterstitial({
      completedChapter: 3,
      sessionElapsedMs: INTERSTITIAL_MIN_SESSION_MS - 1,
      sinceLastRequestMs: null
    })).toBe(false);
  });

  it('only requests at spaced chapter breaks', () => {
    expect(shouldRequestChapterInterstitial({ completedChapter: 3, sessionElapsedMs: 240_000, sinceLastRequestMs: null })).toBe(true);
    expect(shouldRequestChapterInterstitial({ completedChapter: 4, sessionElapsedMs: 240_000, sinceLastRequestMs: null })).toBe(false);
    expect(shouldRequestChapterInterstitial({ completedChapter: 6, sessionElapsedMs: 420_000, sinceLastRequestMs: null })).toBe(true);
  });

  it('enforces an additional wall-clock gap between requests', () => {
    expect(shouldRequestChapterInterstitial({
      completedChapter: 6,
      sessionElapsedMs: 420_000,
      sinceLastRequestMs: INTERSTITIAL_MIN_GAP_MS - 1
    })).toBe(false);
    expect(shouldRequestChapterInterstitial({
      completedChapter: 6,
      sessionElapsedMs: 420_000,
      sinceLastRequestMs: INTERSTITIAL_MIN_GAP_MS
    })).toBe(true);
  });
});
