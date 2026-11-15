import React from 'react';
import copy from './worldcupFlowCopy.json';
import './worldcupFlow.css';
export default function RoundSelection({lang,rounds,selected,onChange,onStart,roundLabel,candidateCount,recommended}){
 const t=copy[lang]||copy.en;
 function navigateOptions(event){
  if(!['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(event.key))return;
  const buttons=[...event.currentTarget.querySelectorAll('[role=radio]')];
  const index=buttons.indexOf(event.target);if(index<0)return;
  event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?rounds.length-1:(index+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1)+rounds.length)%rounds.length;
  onChange(rounds[next]);buttons[next]?.focus();
 }
 return <section className="worldcup-round-selection" dir={lang==='ar'?'rtl':'ltr'}>
  <p className="worldcup-round-label">{t.chooseRound}</p>
  <div className="worldcup-round-options" role="radiogroup" aria-label={t.chooseRound} onKeyDown={navigateOptions}>{rounds.map(round=><button type="button" key={round} role="radio" tabIndex={selected===round?0:-1} aria-checked={selected===round} className={selected===round?'is-selected':''} onClick={()=>onChange(round)}>
   <span className="worldcup-round-option-title">{roundLabel(round)} {round===recommended&&<small>{t.recommended}</small>}<span className="worldcup-round-dot" aria-hidden="true"/></span>
   <span>{t.choices.replace('{count}',String(Math.max(0,Math.min(round,candidateCount)-1)))}</span>
  </button>)}</div>
  <button type="button" className="worldcup-round-start" disabled={!rounds.length} onClick={()=>onStart(selected)}>{t.startRound.replace('{round}',roundLabel(selected))}<span aria-hidden="true">→</span></button>
  <p className="worldcup-round-note">{t.baseChoices}</p>
 </section>;
}
