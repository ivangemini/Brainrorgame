import { access, readFile } from 'node:fs/promises';

const file = new URL('../release/yandex-store.json', import.meta.url);
const data = JSON.parse(await readFile(file, 'utf8'));
const errors = [];
const textLocales = ['en', 'ru'];

if (data.schemaVersion !== 1) errors.push('schemaVersion must be 1');
if (!data.slug || !/^[a-z0-9-]+$/.test(data.slug)) errors.push('slug is missing or invalid');
if (!data.category) errors.push('category is required');
if (!data.orientation) errors.push('orientation is required');
if (!data.ageRating) errors.push('ageRating is required');
for (const locale of textLocales) {
  if (!data.languages?.includes(locale)) errors.push(`languages must include ${locale}`);
  for (const field of ['title', 'shortDescription', 'description', 'controls']) {
    const value = data[field]?.[locale];
    if (typeof value !== 'string' || value.trim().length < (field === 'description' ? 80 : 8)) {
      errors.push(`${field}.${locale} is missing or too short`);
    }
  }
}
if (!Array.isArray(data.features) || data.features.length < 4) errors.push('at least four features are required');
if (!Array.isArray(data.creatives) || data.creatives.length < 2) errors.push('at least two creative variants are required');
for (const path of data.creatives ?? []) {
  try { await access(new URL(`../${path}`, import.meta.url)); }
  catch { errors.push(`creative does not exist: ${path}`); }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
