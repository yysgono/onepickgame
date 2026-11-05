import React from 'react';
import gameCopy from './gameCopy.json';
import {candidateCountOptions} from './game';
export default function GameCountSelect({lang,value,onChange,total,disabled=false}) {
 const text=gameCopy[lang]||gameCopy.en,known=Number.isFinite(total),options=known?candidateCountOptions(total):[],selected=value==='all'||options.includes(Number(value))?value:'all';
 return <label className="tn-game-count"><span>{text.countLabel}</span><select aria-label={text.countLabel} value={selected} disabled={disabled||!known} onChange={e=>onChange(e.target.value)}>
  {options.map(count=><option key={count} value={String(count)}>{text.count.replace('{count}',String(count))}</option>)}<option value="all">{text.all}{known?` (${total})`:''}</option>
 </select><small>{text.countHelp}</small></label>;
}
