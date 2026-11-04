import React from 'react';
import gameCopy from './gameCopy.json';
import {activatedPhoto,currentBatch,selectedCandidates,toggleGameCandidate} from './game';
export default function TopNineGame({game,lang,text,Photo,onChange,onNext,onBack,onMore,onFill,onDirect,canBack}) {
 const previousTap=React.useRef(null);
 const words=gameCopy[lang]||gameCopy.en,selected=selectedCandidates(game),batch=currentBatch(game),format=(key,value)=>words[key].replace('{count}',String(value)).replace('{round}',String(value));
 return <section className={`tn-game tn-game-grid${game.size}`}>
  <h2>{game.status==='short'?format('shortTitle',selected.length):text.choose}</h2>
  <p><strong>{text.finalNine}</strong></p>
  <p role="status">{format('round',game.round)} · {format('selected',selected.length)}</p>
  {game.status==='short'?<>
   <p>{words.shortHelp}</p>
   {selected.length>0&&<div className="tn-candidates">{selected.map(c=><button type="button" key={c.id} className="selected" disabled><Photo candidate={c}/><span>{c.name}</span></button>)}</div>}
   <div className="tn-actions tn-sticky tn-game-navigation tn-game-finish-actions"><div className="tn-game-action-row"><button className="tn-primary" onClick={onMore}>{words.chooseMore}</button><button onClick={onFill}>{words.fillRandom}</button></div><div className="tn-game-action-row"><button disabled={!canBack} onClick={onBack}>{text.back}</button><button onClick={onDirect}>{text.direct}</button></div></div>
  </>:<>
   <p>{game.reduction?words.reduceHelp:words.help}</p><p>{text.doublePhoto}</p><progress max={game.end} value={Math.min(game.offset+batch.length,game.end)}/><p>{game.offset+1}–{game.offset+batch.length} / {game.pool.length}</p>
   {game.byes.length>0&&<details className="tn-game-byes"><summary>{format('byes',game.byes.length)}</summary><p>{game.byes.map(c=>c.name).join(' · ')}</p></details>}
   <div className="tn-candidates">{batch.map(c=><button type="button" className={game.marked.includes(String(c.id))?'selected':''} key={c.id} aria-pressed={game.marked.includes(String(c.id))} onClick={e=>{if(activatedPhoto(e,previousTap))onChange(toggleGameCandidate(game,c.id));}}><Photo candidate={c}/><span>{game.marked.includes(String(c.id))?'✓ ':''}{c.name}</span></button>)}</div>
   <div className="tn-actions tn-sticky tn-game-navigation"><button disabled={!canBack} onClick={onBack}>{text.back}</button><button className="tn-primary" onClick={onNext}>{text.next}</button><button onClick={onDirect}>{text.direct}</button></div>
  </>}
 </section>;
}
