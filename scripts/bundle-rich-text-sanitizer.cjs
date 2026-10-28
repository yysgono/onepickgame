// Bundle current patched sanitizer and its ESM parser into one synchronous CJS module.
// This avoids require(ESM) at runtime without downgrading or bypassing sanitization.
const path = require('node:path');
const fs = require('node:fs');
const webpack = require('webpack');
const root = path.resolve(__dirname, '..');
webpack({
  mode: 'production',
  target: 'node18',
  entry: require.resolve('sanitize-html', {paths: [root]}),
  output: {
    path: path.join(root, 'vendor'),
    filename: 'rich-text-sanitizer.cjs',
    library: {type: 'commonjs2'},
  },
  devtool: false,
  optimization: {minimize: false},
  performance: {hints: false},
}, (error, stats) => {
  if (error || stats.hasErrors()) {
    console.error(error || stats.toString({all: false, errors: true}));
    process.exitCode = 1;
    return;
  }
  const packages = new Map();
  function visit(module) {
    if (module.resource) {
      let folder = path.dirname(module.resource.split('?')[0]);
      while (folder.includes('node_modules')) {
        const metadata = path.join(folder, 'package.json');
        if (fs.existsSync(metadata)) {
          const info = JSON.parse(fs.readFileSync(metadata, 'utf8'));
          if (info.name && info.version) {
            const key = info.name + '@' + info.version;
            if (!packages.has(key)) {
              const licenses = fs.readdirSync(folder).filter(name => /^licen[cs]e(?:[.-]|$)/i.test(name));
              packages.set(key, {name:info.name,version:info.version,license:info.license,
                notices:licenses.filter(name=>fs.statSync(path.join(folder,name)).isFile()).map(name=>({file:name,text:fs.readFileSync(path.join(folder,name),'utf8')}))});
            }
          }
          break;
        }
        folder = path.dirname(folder);
      }
    }
    if (module.modules) for (const child of module.modules) visit(child);
  }
  for (const module of stats.compilation.modules) visit(module);
  fs.writeFileSync(path.join(root,'vendor','rich-text-sanitizer.NOTICES.json'),JSON.stringify([...packages.values()].sort((a,b)=>a.name.localeCompare(b.name)),null,2)+'\n');
  console.log('Bundled sanitizer: ' + stats.toString({all: false, assets: true}));
});
