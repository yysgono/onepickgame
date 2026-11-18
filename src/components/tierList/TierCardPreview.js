import React from 'react';
import MediaRenderer from '../MediaRenderer';
import './TierCardPreview.css';

export default function TierCardPreview({ item, isMobile = false }) {
  return <div className={'tier-card-preview'+(item.hasTierPreview?' tier-card-preview--ranked':'')+(isMobile?' tier-card-preview--mobile':'')}>
    <div className="tier-card-preview-cover">{item.previewImage?<MediaRenderer url={item.previewImage} alt={item.displayTitle||''} playable={false} loading="lazy" deferUntilVisible viewportMargin="0px" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 20%'}}/>:<span>TIER LIST</span>}</div>
    {item.hasTierPreview&&<div className="tier-card-preview-rows">{item.tierPreview.map(row=><div className="tier-card-preview-row" key={row.tier}>
      <span className="tier-card-preview-label" data-tier={row.tier}>{row.tier}</span>
      <div className="tier-card-preview-candidates">{row.candidates.map((candidate,index)=><span className="tier-card-preview-candidate" title={candidate.name||''} key={candidate.id??index}>{candidate.image&&<MediaRenderer url={candidate.image} alt={candidate.name||''} playable={false} loading="lazy" deferUntilVisible viewportMargin="0px" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>}</span>)}</div>
    </div>)}</div>}
  </div>;
}
