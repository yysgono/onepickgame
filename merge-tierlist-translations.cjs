/*
Usage:
  node merge-tierlist-translations.cjs src/locales

Expected locale layout:
  <localeRoot>/ko/translation.json
  <localeRoot>/en/translation.json
  ...

This script ONLY replaces/adds the top-level `tierList` namespace.
It does not overwrite unrelated existing translations.
*/

const fs = require("fs");
const path = require("path");

const localeRoot = process.argv[2];
if (!localeRoot) {
  console.error("Usage: node merge-tierlist-translations.cjs <locale-root>");
  process.exit(1);
}

const patchRoot = path.join(__dirname, "tierList_translation_patch");
const languages = fs
  .readdirSync(patchRoot)
  .filter((name) => name.endsWith(".json"))
  .map((name) => name.replace(/\.json$/, ""));

for (const lang of languages) {
  const target = path.join(localeRoot, lang, "translation.json");
  const patch = path.join(patchRoot, `${lang}.json`);

  if (!fs.existsSync(target)) {
    console.warn(`[skip] ${lang}: ${target} not found`);
    continue;
  }

  const current = JSON.parse(fs.readFileSync(target, "utf8"));
  const patchData = JSON.parse(fs.readFileSync(patch, "utf8"));
  current.tierList = patchData.tierList;
  fs.writeFileSync(target, JSON.stringify(current, null, 2) + "\n", "utf8");
  console.log(`[ok] ${lang}`);
}
