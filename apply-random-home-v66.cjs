const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/components/randomPick/randomPick.css');
const start = '/* BEGIN onepick-random-home-v66 */';
const end = '/* END onepick-random-home-v66 */';
const css = `${start}
/* Keep the start buttons aligned while placing play counts directly underneath. */
.rp.rp-current-home .rp-modes > .rp-mode > .rp-mode-start {
  margin-bottom: 6px !important;
}
.rp.rp-current-home .rp-modes > .rp-mode > .rp-mode-plays {
  display: block;
  flex-shrink: 0;
  margin: 0 12px 12px !important;
  padding: 0 !important;
  line-height: 1.35;
}
/* Center the candidate-saving copy and saved-name summary. */
.rp.rp-current-home .rp-home-candidates,
.rp.rp-current-home .rp-home-candidates h2,
.rp.rp-current-home .rp-home-candidates p,
.rp.rp-current-home .rp-home-candidates label,
.rp.rp-current-home .rp-saved-summary,
.rp.rp-current-home .rp-saved-summary h3,
.rp.rp-current-home .rp-home-candidates > .rp-import,
.rp.rp-current-home .rp-home-candidates > .rp-saved-load {
  text-align: center;
}
.rp.rp-current-home .rp-saved-summary ul,
.rp.rp-current-home .rp-saved-tools {
  justify-content: center;
}
/* Only the save button on the home page changes color. */
.rp.rp-current-home .rp-home-candidates > .rp-saved-load {
  background: #078657;
  border-color: #056b45;
  color: #fff;
  box-shadow: 0 3px 10px #07865725;
}
.rp.rp-current-home .rp-home-candidates > .rp-saved-load:hover:not(:disabled) {
  background: #056b45;
  border-color: #056b45;
  color: #fff;
}
${end}`;
try {
  let source = fs.readFileSync(file, 'utf8');
  const a = source.indexOf(start), b = source.indexOf(end);
  if ((a >= 0) !== (b >= 0) || (a >= 0 && b < a)) throw new Error('Incomplete v66 style block. No changes made.');
  if (a >= 0) source = source.slice(0, a) + source.slice(b + end.length);
  if (!process.argv.includes('--undo')) {
    if (!source.includes('.rp-mode-plays') || !source.includes('.rp-home-candidates')) throw new Error('Expected v64/v65 styles not found. No changes made.');
    source = source.trimEnd() + '\n\n' + css + '\n';
  }
  fs.writeFileSync(file, source, 'utf8');
  console.log(process.argv.includes('--undo') ? 'v66 styles removed.' : 'v66 applied: tighter play-count spacing, centered copy, green home save button.');
} catch (error) {
  console.error(error.message);
  console.error('Run this file from the onepickgame project folder (where package.json is located).');
  process.exitCode = 1;
}
