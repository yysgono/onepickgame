export function shareLinks(title, url) {
 const parsed = new URL(url);
 if (!['https:', 'http:'].includes(parsed.protocol)) throw Error('INVALID_SHARE_URL');
 return {
  x: 'https://x.com/intent/tweet?' + new URLSearchParams({text:title || 'One Pick Game',url:parsed.href}),
  threads: 'https://www.threads.com/intent/post?' + new URLSearchParams({text:(title || 'One Pick Game')+'\n'+parsed.href}),
 };
}
export async function copyShareUrl(url) {
 try { if (navigator.clipboard?.writeText) {await navigator.clipboard.writeText(url);return true;} } catch {}
 const input=document.createElement('textarea');input.value=url;input.readOnly=true;
 input.style.cssText='position:fixed;left:-9999px;top:0';
 const focused=document.activeElement;document.body.appendChild(input);input.select();
 let copied=false;try{copied=!!document.execCommand?.('copy');}catch{}finally{input.remove();focused?.focus?.();}
 return copied;
}
