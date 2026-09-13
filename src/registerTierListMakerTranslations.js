import i18n from "./i18n";
import resources from "./locales/tierListMakerUi.json";

function registerTierListMakerTranslations() {
  Object.entries(resources).forEach(([lang, messages]) => {
    i18n.addResourceBundle(lang, "translation", messages, true, true);
  });
}

if (i18n.isInitialized) {
  registerTierListMakerTranslations();
} else {
  i18n.once("initialized", registerTierListMakerTranslations);
}
