// Keep the UI synchronized with the SDK session. DB authorization remains in RLS.
export function subscribeToAuthProfile(client, state) {
  let active = true;
  let revision = 0;
  let currentId = null;
  let profileId = null;
  let profileTimer;

  function applySession(session) {
    if (!active) return;
    const user = session?.user || null;
    const id = user?.id || null;
    state.setUser(user);
    if (id !== currentId || !id) {
      currentId = id;
      profileId = null;
      clearTimeout(profileTimer);
      state.setNickname("");
      state.setIsAdmin(false);
    }
    if (!id) {
      state.setNicknameLoading(false);
      return;
    }
    if (profileId === id) return;
    profileId = id;
    state.setNicknameLoading(true);
    // Supabase requests must run outside the synchronous auth callback.
    profileTimer = setTimeout(async () => {
      try {
        const { data, error } = await client.from("profiles")
          .select("nickname").eq("id", id).single();
        if (!active || currentId !== id) return;
        if (error) {
          profileId = null;
          console.warn("Profile lookup failed", error);
          return;
        }
        const nickname = data?.nickname || "";
        state.setNickname(nickname);
        state.setIsAdmin(nickname === "admin");
      } catch (error) {
        if (active && currentId === id) profileId = null;
        console.warn("Profile lookup failed", error);
      } finally {
        if (active && currentId === id) state.setNicknameLoading(false);
      }
    }, 0);
  }

  state.setNicknameLoading(true);
  const { data } = client.auth.onAuthStateChange((event, session) => {
    revision += 1;
    if (event === "SIGNED_OUT" || session?.user || event === "INITIAL_SESSION") {
      applySession(session);
    }
  });
  const initialRevision = revision;
  client.auth.getSession().then(({ data, error }) => {
    if (!active || revision !== initialRevision) return;
    if (error) {
      console.warn("Session restore failed", error);
      state.setNicknameLoading(false);
      return;
    }
    applySession(data?.session);
  }).catch((error) => {
    if (!active || revision !== initialRevision) return;
    console.warn("Session restore failed", error);
    state.setNicknameLoading(false);
  });

  return () => {
    active = false;
    clearTimeout(profileTimer);
    data.subscription.unsubscribe();
  };
}
