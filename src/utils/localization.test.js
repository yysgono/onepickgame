import {
  getLocalizedField,
  getWorldcupDescription,
  getWorldcupTitle,
  readTranslationMap,
} from "./localization";

describe("localization helpers", () => {
  test("uses the original field on the original language", () => {
    const cup = {
      title: "한국어 원본",
      title_translations: { en: "English title" },
      original_language: "ko",
    };

    expect(getWorldcupTitle(cup, "ko")).toBe("한국어 원본");
  });

  test("uses a matching translation for non-original languages", () => {
    const cup = {
      title: "한국어 원본",
      title_translations: { ja: "日本語タイトル", en: "English title" },
      original_language: "ko",
    };

    expect(getWorldcupTitle(cup, "ja")).toBe("日本語タイトル");
  });

  test("falls back to the original field instead of English", () => {
    const cup = {
      title: "한국어 원본",
      title_translations: { en: "English title" },
      original_language: "ko",
    };

    expect(getWorldcupTitle(cup, "fr")).toBe("한국어 원본");
  });

  test("reads JSON encoded translation maps", () => {
    expect(readTranslationMap('{"en":"Hello"}')).toEqual({ en: "Hello" });
  });

  test("supports legacy description fallback", () => {
    const cup = {
      description: "",
      desc: "legacy description",
      description_translations: {},
      original_language: "en",
    };

    expect(getWorldcupDescription(cup, "ko")).toBe("legacy description");
  });

  test("returns an empty string for missing fields", () => {
    expect(getLocalizedField({}, "en", "title")).toBe("");
  });
});

// Home activity RPC intentionally supplies a compact record without original_language.
test("uses stored English translation when the activity record has no original language", () => {
 expect(getWorldcupTitle({title:"한국어 제목",title_translations:{en:"English title"}},"en")).toBe("English title");
 expect(getWorldcupTitle({title:"한국어 제목",title_translations:'{"en":"English title"}'},"en")).toBe("English title");
});
test("preserves explicit English originals and translates all compact-record languages", () => {
 expect(getWorldcupTitle({title:"Original English",original_language:"en",title_translations:{en:"Outdated translation"}},"en")).toBe("Original English");
 for(const lang of Object.keys(require('../seo/siteHomeCopy.json'))){
  expect(getWorldcupTitle({title:"원본",title_translations:{[lang]:"Translated "+lang}},lang)).toBe("Translated "+lang);
  expect(typeof require('../locales/'+lang+'/translation.json').translated_description_placeholder).toBe('string');
 }
});
