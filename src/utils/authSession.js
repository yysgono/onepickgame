// Keep the UI synchronized with the SDK session. DB authorization remains in RLS.
const AUTH_DEBUG_VERSION = "2026-10-10-v2";

export function subscribeToAuthProfile(client, state) {
  let active = true;
  let revision = 0;
  let currentId = null;
  let profileId = null;
  let profileTimer;

  function trace(event, details = {}) {
    if (typeof window === "undefined") return;
    let stored = null;
    try {
      stored = Boolean(window.localStorage.getItem("sb-irfyuvuazhujtlgpkfci-auth-token"));
    } catch {}
    const records = Array.isArray(window.__onepickAuthDebug) ? window.__onepickAuthDebug : [];
    records.push({ version: AUTH_DEBUG_VERSION, time: new Date().toISOString(), event, origin: window.location?.origin,
      visible: typeof document === "undefined" ? null : document.visibilityState,
      storedSession: stored, ...details });
    window.__onepickAuthDebug = records.slice(-40);
  }
  trace("listener-start");

  function applySession(session) {
    if (!active) return;
    const user = session?.user || null;
    const id = user?.id || null;
    trace("apply-session", { hasUser: Boolean(user) });
    state.setUser((previous) => {
      trace("ui-user-update", { hadUser: Boolean(previous), hasUser: Boolean(user) });
      if (previous === user) return previous;
      // getSession returns new objects even when the user has not changed.
      // Preserve React identity to avoid rebuilding the route tree on focus/ticks.
      if (previous && user && previous.id === user.id &&
          JSON.stringify(previous) === JSON.stringify(user)) return previous;
      return user;
    });
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
    trace("auth-event", { action: event, hasSession: Boolean(session), hasUser: Boolean(session?.user) });
    revision += 1;
    if (event === "SIGNED_OUT" || session?.user || event === "INITIAL_SESSION") {
      applySession(session);
    }
  });
  let recoveryInFlight = null;
  function reconcileSession() {
    if (!active || recoveryInFlight) return recoveryInFlight;
    const requestRevision = revision;
    trace("session-check-start");
    recoveryInFlight = client.auth.getSession().then(({ data, error }) => {
      trace("session-check-result", { hasSession: Boolean(data?.session), hasUser: Boolean(data?.session?.user), errorCode: error?.code || null, status: error?.status || null, superseded: revision !== requestRevision });
      if (!active || revision !== requestRevision) return;
      if (error) {
        console.warn("Session restore failed", error);
        state.setNicknameLoading(false);
        return;
      }
      applySession(data?.session);
    }).catch((error) => {
      trace("session-check-error", { errorCode: error?.code || null, status: error?.status || null });
      if (!active || revision !== requestRevision) return;
      console.warn("Session restore failed", error);
      state.setNicknameLoading(false);
    }).finally(() => { recoveryInFlight = null; });
    return recoveryInFlight;
  }
  function onVisible() {
    if (typeof document === "undefined" || document.visibilityState !== "hidden") {
      reconcileSession();
    }
  }
  function onStorage(event) {
    // Storage events are emitted for changes made by other tabs.
    if (event.key === null || /^sb-.+-auth-token$/.test(event.key || "")) {
      onVisible();
    }
  }
  reconcileSession();
  if (typeof window !== "undefined") {
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);
    window.addEventListener("storage", onStorage);
  }
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisible);
  }
  // Read the SDK's stored session; this does not query the profile on every tick.
  const recoveryTimer = setInterval(onVisible, 60000);

  return () => {
    trace("listener-stop");
    active = false;
    clearTimeout(profileTimer);
    clearInterval(recoveryTimer);
    if (typeof window !== "undefined") {
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
      window.removeEventListener("storage", onStorage);
    }
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisible);
    }
    data.subscription.unsubscribe();
  };
}
