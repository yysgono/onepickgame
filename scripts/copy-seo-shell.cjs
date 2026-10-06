const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
fs.copyFileSync(path.join(root, 'build/index.html'), path.join(root, 'build/seo-shell.html'));
