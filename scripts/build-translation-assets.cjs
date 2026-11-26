// Run before CRA copies public/ into the static deployment.
const fs = require('node:fs');
const path = require('node:path');
const { translationAsset, languages } = require('../translation-assets.cjs');
const root = path.join(__dirname, '..', 'public');
for (const language of languages) {
  const asset = translationAsset(language);
  const target = path.join(root, asset.url);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, asset.source, 'utf8');
}
console.log(`Generated ${languages.length} versioned initial translation assets.`);
