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
  function toggle() {
    if (open) { sequence.current++; locked.current = false; rows.current = []; setItems([]); setMore(false); setBusy(false); setError(''); setOpen(false); }
    else { setOpen(true); load(true); }
  }
  if (!allowed) return null;
  return <section style={{ padding: 20, marginBottom: 24, border: '2px solid #d7c9e3', borderRadius: 14, background: '#faf7ff' }}>
    <button type="button" style={button} onClick={toggle} aria-expanded={open}>회원관리 · 탈퇴 신청 목록 {open ? '접기' : '보기'}</button>
    {open && <>
      <p>현재 탈퇴 신청이 남아 있는 회원입니다. 오래된 신청부터 표시합니다. 이 목록은 실제 삭제 완료를 뜻하지 않습니다.</p>
      <button type="button" style={button} disabled={busy} onClick={() => load(true)}>새로고침</button>
      <div style={{ overflowX: 'auto', marginTop: 16 }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead><tr>{['닉네임', '이메일(일부 숨김)', '회원 ID', '탈퇴 신청일'].map(label => <th key={label} style={{ padding: 12, borderBottom: '2px solid #cbbad8' }}>{label}</th>)}</tr></thead>
        <tbody>{items.map(row => <tr key={row.id}>
          <td style={{ padding: 12 }}>{row.nickname || '닉네임 없음'}</td>
          <td style={{ padding: 12 }}>{row.masked_email || '정보 없음'}</td>
          <td style={{ padding: 12, overflowWrap: 'anywhere', fontSize: 13 }}>{row.id}</td>
          <td style={{ padding: 12 }}>{new Date(row.withdrawal_requested_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (한국시간)</td>
        </tr>)}</tbody>
      </table></div>
      {!busy && !error && !items.length && <p>현재 탈퇴 신청 회원이 없습니다.</p>}
      {busy && <p role="status">불러오는 중…</p>}
      {error && <p role="alert" style={{ color: '#a42034' }}>{error} <button type="button" style={button} disabled={busy} onClick={() => load(rows.current.length === 0)}>다시 시도</button></p>}
      {more && <button type="button" style={button} disabled={busy} onClick={() => load(false)}>더보기 · 20명</button>}
    </>}
  </section>;
}
