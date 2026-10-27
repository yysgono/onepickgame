import DOMPurify from 'dompurify';
const policy=require('./richTextPolicy');
DOMPurify.addHook('uponSanitizeAttribute',(node,data)=>{
 if(data.attrName==='style'){data.attrValue=policy.safeStyle(data.attrValue);if(!data.attrValue)data.keepAttr=false;}
 if(['src','href'].includes(data.attrName)&&!policy.safeUrl(data.attrValue,data.attrName==='src'))data.keepAttr=false;
 if(data.attrName==='align'&&!/^(left|center|right|justify)$/.test(data.attrValue))data.keepAttr=false;
 if(data.attrName==='size'&&!/^[1-7]$/.test(data.attrValue))data.keepAttr=false;
 if(data.attrName==='face'&&!policy.STYLES['font-family'].test(data.attrValue))data.keepAttr=false;
 if(data.attrName==='color'&&!policy.STYLES.color.test(data.attrValue))data.keepAttr=false;
 if(['colspan','rowspan'].includes(data.attrName)&&!/^(?:[1-9]|10)$/.test(data.attrValue))data.keepAttr=false;
});
DOMPurify.addHook('afterSanitizeAttributes',node=>{
 if(node.tagName==='A'){node.setAttribute('rel','noopener noreferrer');node.setAttribute('target','_blank');}
 if(node.tagName==='IMG'){node.setAttribute('loading','lazy');node.setAttribute('alt',node.getAttribute('alt')||'Image');}
});
export function sanitizeRichHtml(value){return DOMPurify.sanitize(String(value||''),{ALLOWED_TAGS:policy.TAGS,ALLOWED_ATTR:policy.ATTRS,ALLOW_DATA_ATTR:false,ALLOW_ARIA_ATTR:false});}
export function richDocument(html){return new DOMParser().parseFromString(sanitizeRichHtml(html),'text/html');}
export function richPlainText(html){const doc=richDocument(html);doc.querySelectorAll('img').forEach(n=>n.replaceWith(`[${n.getAttribute('alt')||'Image'}]`));doc.querySelectorAll('br').forEach(n=>n.replaceWith('\n'));doc.querySelectorAll('p,div,h2,h3,h4,li,blockquote,tr,pre').forEach(n=>n.append('\n'));return doc.body.textContent.trim();}
export function plainToRich(value){return String(value||'').split('\n').map(line=>'<p>'+line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</p>').join('');}
export function richImageCount(html){return richDocument(html).querySelectorAll('img').length;}
