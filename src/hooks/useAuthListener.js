// src/hooks/useAuthListener.js
import { useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { generateRandomNickname } from "../utils/randomNickname";

export default function useAuthListener() {
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const user = session.user;

        // profiles 테이블에 유저 정보 있는지 확인
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!existingProfile) {
          await supabase.from("profiles").insert([
            {
              id: user.id,
              email: user.email,
              nickname: generateRandomNickname(),
              uid: user.id,
            },
          ]);
        }
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);
}
