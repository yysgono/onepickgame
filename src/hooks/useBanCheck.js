// src/hooks/useBanCheck.js
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function useBanCheck(user) {
  const [isBanned, setIsBanned] = useState(false);
  const [banInfo, setBanInfo] = useState(null);

  useEffect(() => {
    if (!user) {
      setIsBanned(false);
      setBanInfo(null);
      return;
    }
    let mounted = true;
    async function checkBan() {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("banned_users")
        .select("*")
        .eq("user_id", user.id)
        .gt("expires_at", now)
        .order("banned_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!mounted) return;
      if (data) {
        setIsBanned(true);
        setBanInfo(data);
      } else {
        setIsBanned(false);
        setBanInfo(null);
      }
    }
    checkBan();
    return () => { mounted = false };
  }, [user]);
  return { isBanned, banInfo };
}
