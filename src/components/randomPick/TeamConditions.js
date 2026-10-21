import React,{useState} from 'react';
export default function TeamConditions({rows,rules,onChange,copy}){
 const [a,setA]=useState(''),[b,setB]=useState(''),[type,setType]=useState('together');
 const names=new Map(rows.map(row=>[row.id,row.name]));
 const valid=rules.filter(rule=>names.has(rule.a)&&names.has(rule.b));
 function add(){if(!names.has(a)||!names.has(b)||a===b||rules.length>=100)return;if(valid.some(r=>r.type===type&&((r.a===a&&r.b===b)||(r.a===b&&r.b===a))))return;onChange([...valid,{a,b,type}]);}
 return <details className="rp-team-conditions"><summary>{copy.teamRules}</summary><p>{copy.teamRulesHelp}</p><div className="rp-rule-inputs">{[[a,setA],[b,setB]].map(([value,set],i)=><select key={i} aria-label={`${copy.name} ${i+1}`} value={value} onChange={e=>set(e.target.value)}><option value="">{copy.name} {i+1}</option>{rows.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>)}<select aria-label={copy.teamRules} value={type} onChange={e=>setType(e.target.value)}><option value="together">{copy.together}</option><option value="apart">{copy.apart}</option></select><button type="button" disabled={!names.has(a)||!names.has(b)||a===b||rules.length>=100} onClick={add}>{copy.add}</button></div><ul>{valid.map((r,i)=><li key={i}>{names.get(r.a)} · {names.get(r.b)} — {r.type==='together'?copy.together:copy.apart}<button onClick={()=>onChange(valid.filter((_,j)=>i!==j))}>{copy.delete}</button></li>)}</ul></details>;
}
