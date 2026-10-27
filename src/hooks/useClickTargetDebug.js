import {useEffect} from 'react';

// Opt-in, local-only hit testing. No network, storage, or layout mutations to site content.
export function inspectClickTargets(doc) {
  const view=doc.defaultView;
  const describe=el=>{
    if(!el)return null;
    const s=view.getComputedStyle(el),r=el.getBoundingClientRect();
    return {tag:el.tagName,id:el.id||'',className:typeof el.className==='string'?el.className:'',position:s.position,zIndex:s.zIndex,pointerEvents:s.pointerEvents,cursor:s.cursor,opacity:s.opacity,rect:{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}};
  };
  return Array.from(doc.querySelectorAll('.home-activity-panel a,.onepick-community-nav a')).flatMap(link=>{
    const r=link.getBoundingClientRect();
    if(r.width<=0||r.height<=0||r.bottom<=0||r.top>=view.innerHeight||r.right<=0||r.left>=view.innerWidth)return [];
    const blocked=[];
    for(const x of [.1,.5,.9])for(const y of [.25,.75]){
      const px=r.x+r.width*x,py=r.y+r.height*y;
      if(px<0||py<0||px>=view.innerWidth||py>=view.innerHeight)continue;
      const top=doc.elementFromPoint(px,py);
      if(top&&!link.contains(top)&&blocked.length===0)blocked.push({x:Math.round(px),y:Math.round(py),covering:Array.from(doc.elementsFromPoint(px,py)).slice(0,2).map(describe)});
    }
    return [{link:describe(link),blocked}];
  });
}

export default function useClickTargetDebug(){
  useEffect(()=>{
    if(new URLSearchParams(window.location.search).get('clickdebug')!=='1')return undefined;
    const records=[];
    const capture=reason=>{
      const record={time:new Date().toISOString(),reason,path:window.location.pathname,viewport:{width:window.innerWidth,height:window.innerHeight},targets:inspectClickTargets(document)};
      records.push(record);if(records.length>5)records.shift();window.__onepickClickDebug={version:'v85',records:[...records]};
      return record;
    };
    const panel=document.createElement('div');
    panel.style.cssText='position:fixed;right:12px;bottom:12px;z-index:2147483647;padding:10px;background:#fff;border:2px solid #5542b8;border-radius:10px;color:#202534;font:14px Arial;max-width:260px;box-shadow:0 2px 12px #0002';
    const label=document.createElement('div');label.textContent='클릭 점검 중 · 안 눌릴 때 아래 버튼';
    const button=document.createElement('button');button.type='button';button.textContent='클릭 문제 정보 복사';button.style.cssText='margin-top:6px;padding:10px;background:#5542b8;color:white;border:0;border-radius:6px;cursor:pointer;font:inherit';
    button.onclick=()=>{
      capture('copy');const value=JSON.stringify(window.__onepickClickDebug,null,2);
      if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(()=>{button.textContent='복사 완료 · 채팅에 붙여넣기';}).catch(()=>{button.textContent='콘솔에서 __onepickClickDebug 확인';});
      else button.textContent='콘솔에서 __onepickClickDebug 확인';
    };
    panel.append(label,button);document.body.append(panel);
    let last=0;
    const move=e=>{if(panel.contains(e.target)||Date.now()-last<500)return;last=Date.now();const r=capture('pointer');if(r.targets.some(t=>t.blocked.length))label.textContent='클릭을 가리는 요소 기록됨';};
    const resize=()=>capture('resize');
    document.addEventListener('pointermove',move,{passive:true,capture:true});window.addEventListener('resize',resize,{passive:true});capture('start');
    return()=>{panel.remove();document.removeEventListener('pointermove',move,true);window.removeEventListener('resize',resize);};
  },[]);
}
