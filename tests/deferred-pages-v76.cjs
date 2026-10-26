const fs = require('node:fs');
const assert = require('node:assert/strict');
const babel = require('@babel/core');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<div id="root"></div>', { url: 'https://example.test/ko', pretendToBeVisual: true });
Object.assign(global, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement });
global.IS_REACT_ACT_ENVIRONMENT = true;
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const { MemoryRouter, Routes, Route, useNavigate } = require('react-router-dom');
const moduleObject = { exports: {} };
const code = babel.transformSync(fs.readFileSync('src/components/DeferredPageBoundary.js', 'utf8'), {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-react'],
}).code;
new Function('require', 'module', 'exports', code)(name => name === 'react-i18next'
  ? { useTranslation: () => ({ t: (key, options) => options.defaultValue }) }
  : require(name), moduleObject, moduleObject.exports);
const Boundary = moduleObject.exports.default;
let navigate, requests = 0, resolvePage;
const pagePromise = new Promise(resolve => { resolvePage = resolve; });
const Deferred = React.lazy(() => { requests++; return pagePromise; });
const Failed = React.lazy(() => Promise.reject(new Error('Simulated missing chunk')));
function App() {
  navigate = useNavigate();
  return React.createElement(React.Fragment, null,
    React.createElement('header', { id: 'persistent-header' }, 'Header'),
    React.createElement(Boundary, null,
      React.createElement(Routes, null,
        React.createElement(Route, { path: '/ko', element: React.createElement('main', null, 'Home') }),
        React.createElement(Route, { path: '/ko/maker', element: React.createElement(Deferred) }),
        React.createElement(Route, { path: '/ko/broken', element: React.createElement(Failed) }))),
  );
}
(async () => {
  const root = createRoot(document.getElementById('root'));
  await act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: ['/ko'], future: { v7_startTransition: false, v7_relativeSplatPath: true } }, React.createElement(App))));
  assert.equal(requests, 0, 'home must not request a maker chunk');
  assert(document.querySelector('main').textContent.includes('Home'));
  const header = document.getElementById('persistent-header');
  await act(async () => navigate('/ko/maker'));
  assert.equal(requests, 1);
  assert(document.querySelector('[role="status"]'), 'pending page must show accessible loading');
  assert.equal(document.getElementById('persistent-header'), header);
  await act(async () => resolvePage({ default: () => React.createElement('main', null, 'Maker ready') }));
  assert.equal(document.querySelector('[role="status"]'), null);
  assert(document.body.textContent.includes('Maker ready'));
  await act(async () => navigate('/ko'));
  await act(async () => navigate('/ko/maker'));
  assert.equal(requests, 1, 'loaded module should be reused');
  const previousConsole = console.error;
  console.error = () => {};
  try { await act(async () => navigate('/ko/broken')); } finally { console.error = previousConsole; }
  assert(document.querySelector('[role="alert"] button'), 'failed chunk needs a manual recovery action');
  assert.equal(document.getElementById('persistent-header'), header);
  await act(async () => navigate('/ko'));
  assert.equal(document.querySelector('[role="alert"]'), null);
  assert(document.body.textContent.includes('Home'));
  await act(async () => root.unmount());
  console.log('PASS: home stays eager, route demand loading, persistent header, loaded module reuse, chunk failure recovery and navigation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
