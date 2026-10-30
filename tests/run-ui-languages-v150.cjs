// From the repository root: node tests/run-ui-languages-v150.cjs
const {spawnSync}=require('node:child_process');
for(const test of [
 'tests/ui-languages-v150.cjs',
 'tests/ui-content-boundary-v150.cjs',
 'tests/ui-language-navigation-v150.cjs',
 'tests/lazy-translations-v79.cjs',
 'tests/header-language-history.cjs',
 'tests/header-language-lazy-v79.cjs',
 'tests/naver-auth-v111-client.cjs',
 'tests/naver-link-v112-callback-ui.cjs',
 'tests/naver-auth-v111-policy.cjs',
 'tests/naver-auth-v111-policy-ui.cjs',
 'tests/legal-routes-v97.cjs',
 'scripts/test-quiz-seo.cjs',
 'tests/stats-image-source-v103.cjs',
 'tests/stats-images-ui-v103.cjs',
]) {
 const result=spawnSync(process.execPath,[test],{stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status||1);
}
console.log('PASS: UI language release validation complete.');
