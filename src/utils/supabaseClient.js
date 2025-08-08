// src/utils/supabaseClient.js

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://irfyuvuazhujtlgpkfci.supabase.co";
const supabaseKey = "sb_publishable__U91j22eqCETuyJ4-O1wUQ_WMu_Hk5r";

export const supabase = createClient(supabaseUrl, supabaseKey);
