import React from 'react';
import { Link } from 'react-router-dom';
export default function AdminRecentActivity({ kind, items, loading, error }) {
  const quiz = kind === 'quiz';
  const color = quiz ? '#b72c35' : '#2863b4';
  return <section style={{ background: quiz ? '#fff8f8' : '#f5f9ff', border: `1px solid ${quiz ? '#f1c9cc' : '#cad9ee'}`, borderRadius: 16, padding: 'clamp(18px, 3vw, 28px)', marginBottom: 32 }}>
    <h4 style={{ margin: '0 0 20px', fontSize: 22, textAlign: 'center', color }}>{quiz ? '🧩 퀴즈 최근 플레이' : '📊 티어표 최근 열람'} · 최근 30건</h4>
    {loading ? <p role="status" style={{ textAlign: 'center' }}>불러오는 중…</p> : error ? <p role="alert" style={{ textAlign: 'center', color: '#a12626' }}>기록 조회에 실패했습니다. 위의 통계 새로고침으로 다시 시도해 주세요.</p> : !items.length ? <p style={{ textAlign: 'center', color: '#596579' }}>아직 기록이 없습니다.</p> :
      <div style={{ maxHeight: 430, overflowY: 'auto' }}>{items.map(item => {
        const content = <><strong style={{ minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 17 }}>{item.title}</strong><time dateTime={item.created_at} style={{ fontSize: 14, color, flexShrink: 0 }}>{new Date(item.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</time></>;
        const style = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px 14px', padding: '12px 14px', border: '1px solid #e2e6ed', borderRadius: 10, background: '#fff', marginBottom: 8, textDecoration: 'none', color: '#202534' };
        return item.href ? <Link key={item.id} to={item.href} style={style}>{content}</Link> : <div key={item.id} style={style}>{content}</div>;
      })}</div>}
    <p style={{ textAlign: 'center', color: '#596579', fontSize: 14, margin: '16px 0 0' }}>{quiz ? '결과가 저장된 퀴즈 참여 기록입니다. 중간 종료 결과도 포함될 수 있습니다.' : '티어표 결과 페이지 열람 기록입니다. 새로 만든 티어표 수와는 다릅니다.'} · 한국시간(KST)</p>
  </section>;
}
