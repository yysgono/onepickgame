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
// Older blog posts may contain literal Markdown bold from plain-text paste.
// Convert text nodes only so existing HTML, links and code samples remain intact.
export function blogDisplayHtml(value){
 const doc=richDocument(value);
 const walker=doc.createTreeWalker(doc.body,4),nodes=[];
 let node;while((node=walker.nextNode()))if(!node.parentElement?.closest('pre,code')&&node.nodeValue.includes('**'))nodes.push(node);
 for(const text of nodes){
  const input=text.nodeValue,pattern=/\*\*([^*\n]+)\*\*/g;let match,start=0;
  const fragment=doc.createDocumentFragment();
  while((match=pattern.exec(input))){fragment.append(doc.createTextNode(input.slice(start,match.index)));const strong=doc.createElement('strong');strong.textContent=match[1];fragment.append(strong);start=pattern.lastIndex;}
  if(start){fragment.append(doc.createTextNode(input.slice(start)));text.replaceWith(fragment);}
 }
 return doc.body.innerHTML;
}
// Convert Markdown copied as plain text into actual editor HTML on blog paste.
export function blogPasteHtml(value){
 const doc=document.implementation.createHTMLDocument('');
 const inline=(parent,text)=>{
  const pattern=/\*\*([^*\n]+)\*\*|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let match,start=0;
  while((match=pattern.exec(text))){
   parent.append(doc.createTextNode(text.slice(start,match.index)));
   const node=doc.createElement(match[1]?'strong':'a');node.textContent=match[1]||match[2];
   if(match[3])node.setAttribute('href',match[3]);parent.append(node);start=pattern.lastIndex;
  }
  parent.append(doc.createTextNode(text.slice(start)));
 };
 for(const line of String(value||'').replace(/\r\n?/g,'\n').split('\n')){
  const text=line.trim().replace(/\\$/,'');
  if(!text){const p=doc.createElement('p');p.append(doc.createElement('br'));doc.body.append(p);continue;}
  const heading=text.match(/^\*\*([^*]+)\*\*$/);
  // Short standalone bold lines are section headings; long statements stay paragraphs.
  const node=doc.createElement(heading&&heading[1].length<=40?'h2':'p');
  if(node.tagName==='H2')node.textContent=heading[1];else inline(node,text);
  doc.body.append(node);
 }
 return sanitizeRichHtml(doc.body.innerHTML);
}
