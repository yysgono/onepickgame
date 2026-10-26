export function normalizeTranslationLanguage(value) {
  return String(value || '').toLowerCase().split(/[-_]/)[0];
}

export function readInitialTranslations(doc, supported) {
  try {
    const node = doc?.getElementById('onepick-initial-translations');
    if (!node) return null;
    const value = JSON.parse(node.textContent || '');
    if (!supported.includes(value.language) || !value.messages || typeof value.messages !== 'object' || Array.isArray(value.messages)) return null;
    return value;
  } catch { return null; }
}

export function installLazyTranslations(i18n, { loaders, loadedLanguages, prepare = value => value }) {
  const loaded = new Set(loadedLanguages);
  const pending = new Map();
  const originalChange = i18n.changeLanguage.bind(i18n);
  let revision = 0;
  function ensure(language) {
    if (loaded.has(language)) return Promise.resolve();
    if (pending.has(language)) return pending.get(language);
    const request = Promise.resolve().then(loaders[language]).then(module => {
      const messages = prepare(module.default || module, language);
      // Supplemental component bundles can already exist for this language.
      // Merge missing base keys without overwriting their intentional overrides.
      i18n.addResourceBundle(language, 'translation', messages, true, false);
      loaded.add(language);
    }).finally(() => pending.delete(language));
    pending.set(language, request);
    return request;
  }
  i18n.changeLanguage = function (requested, callback) {
    const language = normalizeTranslationLanguage(requested);
    const currentRevision = ++revision;
    if (!Object.prototype.hasOwnProperty.call(loaders, language) && !loaded.has(language)) return originalChange(requested, callback);
    if (loaded.has(language)) return originalChange(language, callback);
    return ensure(language).then(() => {
      if (currentRevision !== revision) {
        const t = i18n.getFixedT(language);
        if (callback) callback(null, t);
        return t;
      }
      return originalChange(language, callback);
    }).catch(error => {
      // Keep the previous working language on a failed chunk. A later user
      // selection can retry; never clear the screen or cause an unhandled rejection.
      console.warn('Language resources could not be loaded', language, error);
      const t = i18n.t.bind(i18n);
      if (callback) callback(error, t);
      return t;
    });
  };
  return { ensure, isLoaded: language => loaded.has(language) };
}
