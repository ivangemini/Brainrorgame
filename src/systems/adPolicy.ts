export type RewardedPlacement = 'offline_double' | 'fortress_revive';
export type InterstitialPlacement = 'chapter_break';

export const INTERSTITIAL_MIN_SESSION_MS = 180_000;
export const INTERSTITIAL_MIN_GAP_MS = 180_000;
export const INTERSTITIAL_CHAPTER_INTERVAL = 3;

export interface InterstitialPolicyInput {
  readonly completedChapter: number;
  readonly sessionElapsedMs: number;
  readonly sinceLastRequestMs: number | null;
}

export function shouldRequestChapterInterstitial(input: InterstitialPolicyInput): boolean {
  const chapter = Math.max(0, Math.floor(input.completedChapter));
  const sessionElapsedMs = Math.max(0, input.sessionElapsedMs);
  if (chapter < INTERSTITIAL_CHAPTER_INTERVAL) return false;
  if (chapter % INTERSTITIAL_CHAPTER_INTERVAL !== 0) return false;
  if (sessionElapsedMs < INTERSTITIAL_MIN_SESSION_MS) return false;
  if (input.sinceLastRequestMs !== null && input.sinceLastRequestMs < INTERSTITIAL_MIN_GAP_MS) return false;
  return true;
}
