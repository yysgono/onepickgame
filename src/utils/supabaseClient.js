// src/utils/supabaseClient.js

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://irfyuvuazhujtlgpkfci.supabase.co";
const supabaseKey = "sb_publishable__U91j22eqCETuyJ4-01wUQ_WMu_Hk5r";  // 최신 anon 키 사용

export const supabase = createClient(supabaseUrl, supabaseKey);
