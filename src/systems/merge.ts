export interface MergeItem {
  readonly family: string;
  readonly level: number;
}

export function canMerge(a: MergeItem, b: MergeItem): boolean {
  return a.family === b.family && a.level === b.level;
}

export function mergedLevel(a: MergeItem, b: MergeItem): number {
  if (!canMerge(a, b)) {
    throw new Error('Items are not merge-compatible');
  }
  return a.level + 1;
}
