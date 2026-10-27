import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const button = { padding: '11px 18px', border: '2px solid #7b698e', borderRadius: 9, background: '#fff', color: '#30263c', cursor: 'pointer', fontSize: 16 };
export default function WithdrawalRequestsAdmin() {
  const [allowed, setAllowed] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState('');
  const actionLock = useRef(false);
  const sequence = useRef(0), rows = useRef([]), locked = useRef(false);
  useEffect(() => {
    let active = true, revision = 0;
    async function check() {
      const current = ++revision;
      setAllowed(false); setOpen(false); setItems([]); setBusy(false); setMore(false); setError(''); rows.current = []; locked.current = false; sequence.current++;
      try { const { data, error: e } = await supabase.rpc('can_review_account_requests');
        if (active && current === revision) setAllowed(!e && data === true);
      } catch { if (active && current === revision) setAllowed(false); }
    }
    check();
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === 'TOKEN_REFRESHED') return; setAllowed(false); setTimeout(() => { if (active) check(); }, 0); });
    return () => { active = false; revision++; sequence.current++; data.subscription.unsubscribe(); };
  }, []);
  async function load(reset = false) {
    if (!allowed || (locked.current && !reset)) return;
    const current = ++sequence.current; locked.current = true; setBusy(true); setError('');
    if (reset) { rows.current = []; setItems([]); setMore(false); }
    try {
      const { data, error: e } = await supabase.rpc('admin_list_withdrawal_requests', { p_offset: reset ? 0 : rows.current.length });
      if (current !== sequence.current) return;
      if (e) throw e;
      if (!data || !Array.isArray(data.items)) throw new Error('Invalid response');
      rows.current = [...rows.current, ...data.items]; setItems(rows.current); setMore(data.has_more === true);
    } catch (e) {
      if (current !== sequence.current) return;
      if (e?.code === '42501') { rows.current = []; setItems([]); setMore(false); }
      setError('목록을 불러오지 못했습니다. SQL 적용과 운영자 조회 권한을 확인해 주세요.');
    } finally { if (current === sequence.current) { locked.current = false; setBusy(false); } }
  }
  async function withdraw(row) {
    if (actionLock.current) return;
    const typed = window.prompt('계정 정보와 로그인 권한은 삭제하고 작성물은 ‘탈퇴한 회원’으로 남깁니다. 되돌릴 수 없습니다.\n개인정보가 포함된 자료의 별도 삭제 요청도 확인해 주세요.\n확인하려면 회원 ID를 그대로 입력하세요.\n' + row.id);
    if (typed !== row.id) return;
    actionLock.current = true; setWorking(true); setError(''); setNotice('');
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data?.session?.access_token) throw new Error('LOGIN_REQUIRED');
      const response = await fetch('/api/admin/account-withdrawal', { method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + data.session.access_token },
        body: JSON.stringify({ target_id: row.id, confirmation: typed, requested_at: row.withdrawal_requested_at }) });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'WITHDRAWAL_RETRY_REQUIRED');
      setNotice('탈퇴 처리가 완료되었습니다. 작성물과 공개 이미지는 유지됩니다.');
      await load(true);
    } catch (e) {
      const messages = {
        SERVER_SETUP_REQUIRED: '서버 환경변수 SUPABASE_SERVICE_ROLE_KEY 설정이 필요합니다. 키를 브라우저나 채팅에 넣지 마세요.',
        ADMIN_REQUIRED: '운영자 권한을 확인해 주세요.', LOGIN_REQUIRED: '다시 로그인해 주세요.',
        PROTECTED_ACCOUNT: '운영자 본인 또는 관리자 계정은 여기서 탈퇴 처리할 수 없습니다.',
        IN_PROGRESS: '처리 중입니다. 새로고침 후 확인하고, 필요하면 5분 뒤 재시도해 주세요.',
        REQUEST_CHANGED: '탈퇴 신청이 취소되었거나 변경됐습니다. 목록을 새로고침해 주세요.',
        SCHEMA_REVIEW: 'DB에 새로운 회원 연결이 추가되어 처리를 멈췄습니다. 구조 점검이 필요합니다.',
        PRIVATE_FILES_REVIEW: '비공개 저장 파일이 있어 처리를 멈췄습니다. 별도 검토가 필요합니다.',
        BUCKET_OWNER_REVIEW: '저장소 버킷 소유 계정이므로 별도 검토가 필요합니다.',
        UPLOAD_IN_PROGRESS: '진행 중인 업로드가 있어 처리를 멈췄습니다.',
        SOCIAL_PROVIDER_REVIEW: '이 소셜 로그인 제공자의 연결 해제 처리를 먼저 확인해야 합니다.'
      };
      setError(messages[e.message] || '탈퇴 완료를 확인하지 못했습니다. 계정은 처리 중 제한됐을 수 있습니다. 목록을 새로고침하고 재시도해 주세요. 계속 실패하면 별도 점검이 필요합니다.');
    } finally { actionLock.current = false; setWorking(false); }
  }
  function toggle() {
    if (open) { sequence.current++; locked.current = false; rows.current = []; setItems([]); setMore(false); setBusy(false); setError(''); setOpen(false); }
    else { setOpen(true); load(true); }
  }
  if (!allowed) return null;
  return <section style={{ padding: 20, marginBottom: 24, border: '2px solid #d7c9e3', borderRadius: 14, background: '#faf7ff' }}>
    <button type="button" style={button} disabled={working} onClick={toggle} aria-expanded={open}>회원관리 · 탈퇴 신청 목록 {open ? '접기' : '보기'}</button>
    {open && <>
      <p>현재 탈퇴 신청이 남아 있는 회원입니다. 오래된 신청부터 표시합니다. 이 목록은 실제 삭제 완료를 뜻하지 않습니다.</p>
      <button type="button" style={button} disabled={busy || working} onClick={() => load(true)}>새로고침</button>
      <div style={{ overflowX: 'auto', marginTop: 16 }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead><tr>{['닉네임', '이메일(일부 숨김)', '회원 ID', '탈퇴 신청일', '처리'].map(label => <th key={label} style={{ padding: 12, borderBottom: '2px solid #cbbad8' }}>{label}</th>)}</tr></thead>
        <tbody>{items.map(row => <tr key={row.id}>
          <td style={{ padding: 12 }}>{row.nickname || '닉네임 없음'}</td>
          <td style={{ padding: 12 }}>{row.masked_email || '정보 없음'}</td>
          <td style={{ padding: 12, overflowWrap: 'anywhere', fontSize: 13 }}>{row.id}</td>
          <td style={{ padding: 12 }}>{new Date(row.withdrawal_requested_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (한국시간)</td>
          <td style={{ padding: 12 }}><button type="button" style={{ ...button, borderColor: "#b42346", color: "#a51d36", whiteSpace: "nowrap" }} disabled={busy || working} onClick={() => withdraw(row)}>{row.state && row.state !== "requested" ? "처리 재시도" : "탈퇴 처리"}</button></td>
        </tr>)}</tbody>
      </table></div>
      {!busy && !error && !items.length && <p>현재 탈퇴 신청 회원이 없습니다.</p>}
      {notice && <p role="status" style={{ color: "#17653b" }}>{notice}</p>}
      {working && <p role="status">탈퇴 처리 중입니다. 이 화면에서 완료 여부를 확인해 주세요.</p>}
      {busy && <p role="status">불러오는 중…</p>}
      {error && <p role="alert" style={{ color: '#a42034' }}>{error} <button type="button" style={button} disabled={busy || working} onClick={() => load(rows.current.length === 0)}>다시 시도</button></p>}
      {more && <button type="button" style={button} disabled={busy || working} onClick={() => load(false)}>더보기 · 20명</button>}
    </>}
  </section>;
}
