// src/utils/supabaseClient.js

import { createClient } from "@supabase/supabase-js";
import { clearLegacyStatsCache } from "./statsCache";
import publicConfig from "./publicSupabaseConfig";

// Free disposable legacy caches before the SDK chooses its session storage.
clearLegacyStatsCache();

export const supabase = createClient(publicConfig.url, publicConfig.key);
