import { createClient } from '@supabase/supabase-js';
import config from './publicSupabaseConfig';
import home from '../seo/platformHome';

let loader;
export default function loadPublicPlatformHome(lang, options) {
  if (!loader) {
    const client = createClient(config.url, config.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'onepickgame-public-home' },
    });
    loader = home.makeLoader(client);
  }
  return loader(lang, options);
}
