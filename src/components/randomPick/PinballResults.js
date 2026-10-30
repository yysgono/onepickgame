import React,{useState} from 'react';
const controls={ko:['전체 결과 보기','간단히 보기'],en:['View all results','Show less'],ja:['すべての結果を見る','閉じる'],zh:['查看全部结果','收起'],es:['Ver todos los resultados','Ver menos'],fr:['Voir tous les résultats','Réduire'],vi:['Xem tất cả kết quả','Thu gọn'],de:['Alle Ergebnisse anzeigen','Weniger anzeigen'],ru:['Все результаты','Свернуть'],id:['Lihat semua hasil','Ringkas'],pt:['Ver todos os resultados','Ver menos'],hi:['सभी परिणाम देखें','कम दिखाएँ'],tr:['Tüm sonuçları göster','Daha az göster'],th:['ดูผลทั้งหมด','แสดงน้อยลง'],ar:['عرض كل النتائج','عرض أقل'],bn:['সব ফলাফল দেখুন','কম দেখান'],
"it":["Mostra tutti i risultati","Mostra meno"],
"pl":["Wyświetl wszystkie wyniki","Pokaż mniej"],
"nl":["Bekijk alle resultaten","Minder tonen"],
"cs":["Zobrazit všechny výsledky","Zobrazit méně"]
};
export default function PinballResults({arrivals,total,copy}){
 const [expanded,setExpanded]=useState(false),labels=controls[copy.lang]||controls.en;
 return <section className="rp-ranked-results" aria-label={copy.result}><header><h2>{copy.result}</h2><span>{arrivals.length} / {total}</span></header>
 <div className="rp-result-podium">{arrivals.slice(0,3).map((row,i)=><article className={`rp-podium-card rp-podium-${i+1}`} key={row.id}><span className="rp-podium-rank">{['🥇','🥈','🥉'][i]} {i+1}</span>{row.image&&<img src={row.image} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none';}}/>}<strong>{row.name}</strong></article>)}</div>
 {arrivals.length>3&&<div className="rp-result-rank-grid">{arrivals.slice(3,expanded?arrivals.length:10).map((row,i)=><article className="rp-result-rank-card" key={row.id}><span>{i+4}</span><strong>{row.name}</strong></article>)}</div>}
 {arrivals.length>10&&<button className="rp-results-expand" type="button" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{labels[expanded?1:0]}{!expanded&&` (${arrivals.length})`}</button>}
 </section>;
}
