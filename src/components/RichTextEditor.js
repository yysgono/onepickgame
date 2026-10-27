import React,{useEffect,useRef,useState} from 'react';
import {getCommunityUi} from './communityUi';
import editorCopy from './richEditorCopy.json';
import {sanitizeRichHtml,richImageCount} from '../utils/richText';
import {uploadPublishingImage,BOARD_IMAGE_LIMIT} from '../utils/publishingImages';
const {safeUrl}=require('../utils/richTextPolicy');
export default function RichTextEditor({value,onChange,lang='en',blog=false,disabled=false,onBusy=()=>{},onError=()=>{}}){
 const ui=getCommunityUi(lang),c=editorCopy[lang]||editorCopy.en;
 const editor=useRef(null),selection=useRef(null),fileInput=useRef(null),id=React.useId();
 const alive=useRef(true);useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const [source,setSource]=useState(false),[uploading,setUploading]=useState(false);
 useEffect(()=>{if(!source&&editor.current&&editor.current.innerHTML!==(value||''))editor.current.innerHTML=sanitizeRichHtml(value);},[value,source]);
 const locked=disabled||uploading;
 function remember(){const s=window.getSelection();if(s?.rangeCount&&editor.current?.contains(s.anchorNode))selection.current=s.getRangeAt(0).cloneRange();}
 function restore(){editor.current?.focus();if(selection.current){try{const s=window.getSelection();s.removeAllRanges();s.addRange(selection.current);}catch{selection.current=null;}}}
 function sync(){onChange(editor.current?.innerHTML||'');remember();}
 function command(name,arg){if(locked||source)return;restore();document.execCommand(name,false,arg);sync();}
 function insert(html){restore();document.execCommand('insertHTML',false,sanitizeRichHtml(html));sync();}
 function link(){const url=window.prompt(ui.enterUrl);if(!url)return;if(!safeUrl(url)){onError(ui.invalidUrl);return;}command('createLink',url);}
 function imageUrl(){const value=window.prompt(ui.enterUrl);if(!value)return;try{const url=new URL(value);if(!['http:','https:'].includes(url.protocol))throw Error();command('insertImage',url.href);}catch{onError(ui.invalidUrl);}}
 function table(){const answer=window.prompt(c.tableSize,'3 × 3');if(!answer)return;const [rows,cols]=answer.split(/[x×,]/).map(Number);if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<1||cols<1||rows>10||cols>10)return;insert('<table><tbody>'+Array.from({length:rows},()=>'<tr>'+Array.from({length:cols},()=>'<td><br></td>').join('')+'</tr>').join('')+'</tbody></table><p><br></p>');}
 async function images(files){if(locked)return;setUploading(true);onBusy(true);onError('');try{for(const file of files){const count=richImageCount(editor.current?.innerHTML||value);const url=await uploadPublishingImage(file,{blog,count});if(!alive.current)return;insert(`<p><img src="${url.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" alt="Image"></p><p><br></p>`);}}catch(e){if(alive.current)onError(c[e.message]||e.message||c.uploadError);}finally{if(alive.current)setUploading(false);onBusy(false);if(fileInput.current)fileInput.current.value='';}}
 function paste(e){const files=Array.from(e.clipboardData.files||[]);if(files.length){e.preventDefault();remember();void images(files);return;}const html=e.clipboardData.getData('text/html');if(html){e.preventDefault();const clean=sanitizeRichHtml(html);if(!blog&&richImageCount(clean)+richImageCount(editor.current.innerHTML)>BOARD_IMAGE_LIMIT){onError(c.EDITOR_IMAGE_COUNT);return;}insert(clean);}}
 function tool(label,icon,action){return <button type="button" title={label} aria-label={label} disabled={locked||source} onMouseDown={e=>e.preventDefault()} onClick={action}>{icon}</button>;}
 return <div className="rich-editor" aria-busy={uploading}>
  <div className="rich-toolbar" role="toolbar" aria-label={ui.edit}>
   {tool(c.undo,'↶',()=>command('undo'))}{tool(c.redo,'↷',()=>command('redo'))}
   <select aria-label={c.style} disabled={locked||source} defaultValue="p" onChange={e=>command('formatBlock',e.target.value)}><option value="p">{ui.paragraph}</option><option value="h2">{ui.heading} 1</option><option value="h3">{ui.heading} 2</option><option value="h4">{ui.heading} 3</option></select>
   <select aria-label={c.font} disabled={locked||source} defaultValue="Arial" onChange={e=>command('fontName',e.target.value)}>{['Arial','Georgia','Verdana','Tahoma','monospace'].map(f=><option key={f}>{f}</option>)}</select>
   <select aria-label={c.size} disabled={locked||source} defaultValue="3" onChange={e=>command('fontSize',e.target.value)}>{[10,13,16,18,24,32,48].map((n,i)=><option key={n} value={i+1}>{n}px</option>)}</select>
   {tool(ui.bold,<b>B</b>,()=>command('bold'))}{tool(ui.italic,<i>I</i>,()=>command('italic'))}{tool(c.underline,<u>U</u>,()=>command('underline'))}{tool(c.strike,<s>S</s>,()=>command('strikeThrough'))}
   <label title={c.color} className="rich-color"><span>A</span><input aria-label={c.color} type="color" disabled={locked||source} defaultValue="#202534" onChange={e=>command('foreColor',e.target.value)}/></label>
   <label title={c.highlight} className="rich-color"><span>▰</span><input aria-label={c.highlight} type="color" disabled={locked||source} defaultValue="#fff59d" onChange={e=>command('hiliteColor',e.target.value)}/></label>
   {tool(c.left,'≡←',()=>command('justifyLeft'))}{tool(c.center,'≡',()=>command('justifyCenter'))}{tool(c.right,'→≡',()=>command('justifyRight'))}
   {tool(c.bullets,'• ≡',()=>command('insertUnorderedList'))}{tool(c.numbers,'1. ≡',()=>command('insertOrderedList'))}
   {tool(c.quote,'❝',()=>command('formatBlock','blockquote'))}{tool(c.code,'〈〉',()=>command('formatBlock','pre'))}
   {tool(ui.link,'🔗',link)}{tool(c.image,'▧',()=>{remember();fileInput.current?.click();})}{blog&&tool(ui.imageUrl,'▧ URL',imageUrl)}{tool(c.table,'▦',table)}{tool(c.line,'―',()=>command('insertHorizontalRule'))}{tool(c.clear,'Tx',()=>command('removeFormat'))}
   <button type="button" title={c.source} aria-label={c.source} aria-pressed={source} disabled={locked} onClick={()=>{if(source)onChange(sanitizeRichHtml(value));else remember();setSource(v=>!v);}}>&lt;/&gt;</button>
  </div>
  <input ref={fileInput} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={e=>void images(Array.from(e.target.files||[]))}/>
  {source?<textarea className="rich-source" aria-label={c.source} disabled={locked} maxLength={200000} value={value} onChange={e=>onChange(e.target.value)}/>:<div ref={editor} className="rich-editable" role="textbox" aria-label={ui.content} aria-multiline="true" contentEditable={!disabled} suppressContentEditableWarning onInput={sync} onKeyUp={remember} onMouseUp={remember} onBlur={remember} onPaste={paste} onDragOver={e=>{if(e.dataTransfer.types.includes('Files'))e.preventDefault();}} onDrop={e=>{if(e.dataTransfer.files.length){e.preventDefault();remember();void images(Array.from(e.dataTransfer.files));}}}/>}
  <div className="rich-editor-hint" id={id}>{uploading?c.uploading:blog?c.blogHint:c.boardHint}</div>
 </div>;
}
