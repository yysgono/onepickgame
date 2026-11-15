import React from 'react';
import {worldcupProgress} from '../../utils/worldcupProgress';
import copy from './worldcupFlowCopy.json';
import './worldcupFlow.css';
export default function MatchProgress({lang,bracket,index,pendingWinners,history,stageLabel,tournamentLabel}){
 const t=copy[lang]||copy.en;
 const {completed,total,percent}=worldcupProgress(bracket,index,pendingWinners,history);
 const match=Math.min((Number(index)||0)+1,bracket.length);
 const detail=t.progress.replace('{done}',String(completed)).replace('{total}',String(total));
 return <section className="worldcup-match-progress" dir={lang==='ar'?'rtl':'ltr'}>
  <div className="worldcup-progress-head"><strong>{stageLabel} · {t.matchNumber.replace('{number}',String(match))}</strong><span>{tournamentLabel} · {detail}</span></div>
  <div className="worldcup-progress-track" role="progressbar" aria-label={t.progressLabel} aria-valuemin={0} aria-valuemax={Math.max(1,total)} aria-valuenow={completed} aria-valuetext={detail}><span style={{width:percent+'%'}}/></div>
 </section>;
}
