import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('../public/assets/manifest.json', import.meta.url), 'utf8'));
const errors = [];

for (const asset of manifest.assets ?? []) {
  const prefix = asset.id ?? '<missing-id>';
  if (!asset.id) errors.push('Asset is missing id');
  if (asset.status !== 'final') errors.push(`${prefix}: production manifest only accepts status=final`);
  if (!asset.path) errors.push(`${prefix}: path is required`);
  if (!asset.provenance) errors.push(`${prefix}: provenance is required`);
  if (!asset.license) errors.push(`${prefix}: license is required`);
  if (!Number.isFinite(asset.masterWidth) || !Number.isFinite(asset.masterHeight)) {
    errors.push(`${prefix}: master dimensions are required`);
  }
  if (!Number.isFinite(asset.runtimeWidth) || !Number.isFinite(asset.runtimeHeight)) {
    errors.push(`${prefix}: runtime dimensions are required`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
