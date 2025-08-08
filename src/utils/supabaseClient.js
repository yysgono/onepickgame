// src/utils/supabaseClient.js

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://irfyuvuazhujtlgpkfci.supabase.co";
const supabaseKey = "sb_secret_3HGduCuPW6RGiocEhpCRxg_jHGgYGUY";

export const supabase = createClient(supabaseUrl, supabaseKey);
