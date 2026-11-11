// Keep result data in this tab only. The server receives an opaque event ID.
export function createPrivateCompletionTracker(client, makeId = () => crypto.randomUUID()) {
 const results = new Map();
 return async function record(slots, title, names) {
  if (!slots.some(Boolean)) return false;
  const signature = JSON.stringify({ slots, title, names });
  let result = results.get(signature);
  if (!result) { result = { id: makeId(), done: false, pending: null }; results.set(signature, result); }
  if (result.done) return true;
  if (result.pending) return result.pending;
  result.pending = Promise.resolve().then(async () => {
   try {
    const { error } = await client.rpc('record_top_nine_private_completion', { p_event_id: result.id });
    if (error) return false;
    result.done = true;
    return true;
   } catch { return false; }
   finally { result.pending = null; }
  });
  return result.pending;
 };
}
