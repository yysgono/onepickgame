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
