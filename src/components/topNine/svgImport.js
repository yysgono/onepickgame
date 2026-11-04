import DOMPurify from 'dompurify';
export function sanitizeSvg(text){
 if(typeof text!=='string'||text.length>20*1024*1024||/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('SVG_INVALID');
 const cleaned=DOMPurify.sanitize(text,{USE_PROFILES:{svg:true,svgFilters:true},FORBID_TAGS:['script','foreignObject','style','image','use','animate','animateTransform','set'],FORBID_ATTR:['style']});
 const doc=new DOMParser().parseFromString(cleaned,'image/svg+xml');const root=doc.documentElement;
 if(root.localName!=='svg'||doc.querySelector('parsererror'))throw Error('SVG_INVALID');
 for(const el of [root,...root.querySelectorAll('*')])for(const a of [...el.attributes]){const name=a.name.toLowerCase();if(name.startsWith('on')||name==='xml:base'||name==='href'||name==='xlink:href'||[...a.value.matchAll(/url\(([^)]*)\)/gi)].some(match=>!/^#[^\s]+$/.test(match[1].trim().replace(/^(['"])(.*)\1$/,'$2'))))el.removeAttribute(a.name);}
 root.setAttribute('xmlns','http://www.w3.org/2000/svg');
 const positive=value=>Number.isFinite(value)&&value>0;
 const view=(root.getAttribute('viewBox')||'').trim().split(/[ ,]+/).map(Number);
 const hasView=view.length===4&&view.every(Number.isFinite)&&positive(view[2])&&positive(view[3]);
 const dimension=value=>{const parsed=Number.parseFloat(value||'');return positive(parsed)?parsed:512;};
 const width=hasView?view[2]:dimension(root.getAttribute('width'));
 const height=hasView?view[3]:dimension(root.getAttribute('height'));
 if(!hasView)root.setAttribute('viewBox',`0 0 ${width} ${height}`);
 const scale=Math.min(1,2048/Math.max(width,height));
 root.setAttribute('width',String(Math.max(1,Math.round(width*scale))));
 root.setAttribute('height',String(Math.max(1,Math.round(height*scale))));
 return new XMLSerializer().serializeToString(root);
}
