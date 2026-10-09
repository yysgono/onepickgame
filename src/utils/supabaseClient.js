// src/utils/supabaseClient.js

import { createClient } from "@supabase/supabase-js";
import { clearLegacyStatsCache } from "./statsCache";

const supabaseUrl = "https://irfyuvuazhujtlgpkfci.supabase.co";
const supabaseKey = "sb_publishable__U91j22eqCETuyJ4-O1wUQ_WMu_Hk5r";

// Free disposable legacy caches before the SDK chooses its session storage.
clearLegacyStatsCache();

export const supabase = createClient(supabaseUrl, supabaseKey);
