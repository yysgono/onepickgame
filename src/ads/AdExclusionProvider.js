import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

const AdAccessContext = createContext(true);
let adsScriptWasLoaded = false;

function loadAdSenseScript() {
  if (adsScriptWasLoaded || document.querySelector('script[data-onepick-adsense="true"]')) return;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.dataset.onepickAdsense = "true";
  script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2906270915716379";
  script.onload = () => { adsScriptWasLoaded = true; };
  document.head.appendChild(script);
}

function installAdFreeStyles() {
  if (document.getElementById("onepick-ad-free-style")) return;
  const style = document.createElement("style");
  style.id = "onepick-ad-free-style";
  style.textContent = `
    html[data-onepick-ad-free="true"] ins.adsbygoogle,
    html[data-onepick-ad-free="true"] .adsbygoogle,
    html[data-onepick-ad-free="true"] .google-auto-placed,
    html[data-onepick-ad-free="true"] [id^="google_ads_iframe_"],
    html[data-onepick-ad-free="true"] [id*="google_ads_iframe"],
    html[data-onepick-ad-free="true"] iframe[src*="googleads"],
    html[data-onepick-ad-free="true"] #google_image_div,
    html[data-onepick-ad-free="true"] [data-ad-client],
    html[data-onepick-ad-free="true"] [data-ad-slot] {
      display: none !important;
      visibility: hidden !important;
      width: 0 !important;
      height: 0 !important;
      min-width: 0 !important;
      min-height: 0 !important;
      overflow: hidden !important;
    }
  `;
  document.head.appendChild(style);
}

export function AdExclusionProvider({ children }) {
  const [adsAllowed, setAdsAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    let requestId = 0;
    let hasChecked = false;
    let checkedUserId = null;

    installAdFreeStyles();

    const checkUser = async (session) => {
      const userId = session?.user?.id || null;
      if (hasChecked && userId === checkedUserId) return;
      const currentRequest = ++requestId;
      hasChecked = true;
      checkedUserId = userId;
      document.documentElement.dataset.onepickAdFree = "true";
      setAdsAllowed(false);

      let isAdFree = false;
      if (userId) {
        try {
          const { data, error } = await supabase
            .from("ad_free_members")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();
          isAdFree = !error && Boolean(data);
        } catch {
          isAdFree = false;
        }
      }

      if (!active || currentRequest !== requestId) return;
      document.documentElement.dataset.onepickAdFree = isAdFree ? "true" : "false";
      setAdsAllowed(!isAdFree);
      if (isAdFree) {
        if (!adsScriptWasLoaded) {
          document.querySelector('script[data-onepick-adsense="true"]')?.remove();
        }
      } else {
        loadAdSenseScript();
      }
    };

    supabase.auth.getSession().then(({ data }) => checkUser(data?.session || null)).catch(() => {
      if (active) {
        document.documentElement.dataset.onepickAdFree = "false";
        setAdsAllowed(true);
        loadAdSenseScript();
      }
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Avoid making Supabase requests inside the auth state callback.
      queueMicrotask(() => checkUser(session || null));
    });

    return () => {
      active = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return <AdAccessContext.Provider value={adsAllowed}>{children}</AdAccessContext.Provider>;
}

export function useAdsAllowed() {
  return useContext(AdAccessContext);
}
