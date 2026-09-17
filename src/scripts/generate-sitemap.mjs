// Compatibility entry: never generate an outdated sitemap containing admin/login URLs.
import { generateSitemaps } from "../../scripts/generate-sitemap.mjs";
await generateSitemaps();
