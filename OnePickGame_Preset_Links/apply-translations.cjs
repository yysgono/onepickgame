const fs = require('fs');
const path = require('path');
const root = process.cwd();
function merge(target, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      merge(target[key], value);
    } else target[key] = value;
  }
  return target;
}
const changes = fs.readdirSync(path.join(__dirname, 'translations')).filter(f => f.endsWith('.json')).map(file => {
  const lang = path.basename(file, '.json');
  const target = path.join(root, 'src', 'locales', lang, 'translation.json');
  const original = fs.readFileSync(target, 'utf8');
  const patch = JSON.parse(fs.readFileSync(path.join(__dirname, 'translations', file), 'utf8'));
  return { target, original, output: JSON.stringify(merge(JSON.parse(original), patch), null, 2) + '\n' };
});
for (const change of changes) {
  const backup = change.target + '.before-preset-links.bak';
  if (!fs.existsSync(backup)) fs.writeFileSync(backup, change.original);
  fs.writeFileSync(change.target, change.output);
}
console.log(`Updated ${changes.length} translation files. Existing unrelated keys preserved.`);
