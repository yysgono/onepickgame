import { SUPPORTED_LANGS } from "./utils/localization";

test("keeps the expected 16 supported languages", () => {
  expect(SUPPORTED_LANGS).toEqual([
    "en",
    "ko",
    "ja",
    "zh",
    "ru",
    "pt",
    "es",
    "fr",
    "id",
    "hi",
    "de",
    "vi",
    "ar",
    "bn",
    "th",
    "tr",
  ]);
});
