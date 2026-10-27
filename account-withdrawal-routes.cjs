const { randomBytes, randomUUID } = require('node:crypto');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function registerAccountWithdrawal(app, admin, siteUrl) {
  let retainedSetup;
  const rpc = async (name, args) => { const { data, error } = await admin.rpc(name, args); if (error) throw error; return data; };
  async function ensureRetainedUser() {
    const { data, error } = await admin.from('account_withdrawal_config').select('retained_user_id').eq('singleton', true).maybeSingle();
    if (error) throw error;
    if (data) {
      const { error: banError } = await admin.auth.admin.updateUserById(data.retained_user_id, { ban_duration: '876000h' });
      if (banError) throw banError;
      return;
    }
    if (!retainedSetup) retainedSetup = (async () => {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: `withdrawn-${randomUUID()}@onepick.invalid`, password: randomBytes(48).toString('base64url'),
        email_confirm: false, ban_duration: '876000h', user_metadata: { system_account: 'retained_content' },
      });
      if (createError || !created?.user?.id) throw createError || Error('RETAINED_ACCOUNT_SETUP');
      const id = created.user.id;
      const { error: banError } = await admin.auth.admin.updateUserById(id, { ban_duration: '876000h' });
      if (banError) throw banError;
      await rpc('account_register_retained_user', { p_id: id });
    })().finally(() => { retainedSetup = null; });
    await retainedSetup;
  }
  app.post('/api/admin/account-withdrawal', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    if (!admin) return res.status(503).json({ error: 'SERVER_SETUP_REQUIRED' });
    if (req.headers.origin && req.headers.origin !== new URL(siteUrl).origin) return res.status(403).json({ error: 'FORBIDDEN' });
    const match = /^Bearer (\S+)$/i.exec(req.headers.authorization || '');
    if (!match) return res.status(401).json({ error: 'LOGIN_REQUIRED' });
    let job;
    try {
      const { data: verified, error: verifyError } = await admin.auth.getUser(match[1]);
      if (verifyError || !verified?.user) return res.status(401).json({ error: 'LOGIN_REQUIRED' });
      const actor = verified.user.id;
      const [{ data: role, error: roleError }, { data: fresh, error: freshError }] = await Promise.all([
        admin.from('account_review_admins').select('user_id').eq('user_id', actor).maybeSingle(),
        admin.auth.admin.getUserById(actor),
      ]);
      if (roleError || freshError || !role || !fresh?.user || (fresh.user.banned_until && Date.parse(fresh.user.banned_until) > Date.now()))
        return res.status(403).json({ error: 'ADMIN_REQUIRED' });
      const { data: actorJob, error: actorJobError } = await admin.from('account_withdrawal_jobs').select('id').eq('target_id', actor).maybeSingle();
      if (actorJobError || actorJob) return res.status(403).json({ error: 'ADMIN_REQUIRED' });
      const target = req.body?.target_id;
      if (!UUID.test(target || '') || req.body?.confirmation !== target || target === actor)
        return res.status(400).json({ error: 'CONFIRMATION_REQUIRED' });
      const { data: targetAuth, error: targetError } = await admin.auth.admin.getUserById(target);
      if (targetError && targetError.status !== 404 && targetError.code !== 'user_not_found') throw targetError;
      // Google uses sign-in scopes only, with no offline access. Delete its local Auth identity
      // with the account. This does not claim to revoke the Google-side app grant.
      // Other providers still require a provider-specific withdrawal review.
      const providers = [...(targetAuth?.user?.identities || []).map(i => i.provider),
        ...(targetAuth?.user?.app_metadata?.providers || []), targetAuth?.user?.app_metadata?.provider].filter(Boolean);
      if (targetAuth?.user && (!providers.length || providers.some(p => !['email', 'google'].includes(p))))
        return res.status(409).json({ error: 'SOCIAL_PROVIDER_REVIEW' });
      job = await rpc('account_begin_withdrawal', { p_target: target, p_actor: actor, p_expected: String(req.body?.requested_at || '') });
      if (!targetAuth?.user && job.status !== 'prepared') throw Error('AUTH_ACCOUNT_REVIEW');
      await ensureRetainedUser();
      if (targetAuth?.user) {
        const { error: banError } = await admin.auth.admin.updateUserById(target, { ban_duration: '876000h' });
        if (banError) throw banError;
      }
      await rpc('account_prepare_withdrawal', { p_job: job.job_id, p_lease: job.lease });
      if (targetAuth?.user) {
        const { error: deleteError } = await admin.auth.admin.deleteUser(target);
        if (deleteError && deleteError.status !== 404 && deleteError.code !== 'user_not_found') throw deleteError;
      }
      await rpc('account_finish_withdrawal', { p_job: job.job_id, p_lease: job.lease });
      return res.json({ ok: true });
    } catch (error) {
      if (job) { try { await rpc('account_release_withdrawal', { p_job: job.job_id, p_lease: job.lease }); } catch {} }
      const message = String(error?.message || '');
      const known = ['PRIVATE_FILES_REVIEW', 'BUCKET_OWNER_REVIEW', 'UPLOAD_IN_PROGRESS', 'PROFILE_LINK_REVIEW', 'AUTH_ACCOUNT_REVIEW'];
      const code = known.find(c => message.includes(c)) || (/already in progress/.test(message) ? 'IN_PROGRESS' : /request changed/.test(message) ? 'REQUEST_CHANGED' : /Protected account|Administrator accounts/.test(message) ? 'PROTECTED_ACCOUNT' :  /Unknown Auth reference/.test(message) ? 'SCHEMA_REVIEW' : 'WITHDRAWAL_RETRY_REQUIRED');
      // Never return SQL text, provider tokens, keys or private profile details.
      return res.status(409).json({ error: code });
    }
  });
}
module.exports = registerAccountWithdrawal;

