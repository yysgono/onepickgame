let sanitize;
const {TAGS,ATTRS,STYLES,safeStyle,safeUrl}=require('./src/utils/richTextPolicy');
module.exports=value=>{
 // Load only when HTML needs sanitizing; errors remain closed and are not bypassed.
 if(!sanitize) sanitize=require('./vendor/rich-text-sanitizer.cjs');
 return sanitize(String(value||''),{
 allowedTags:TAGS,allowedAttributes:{'*':ATTRS},allowedSchemes:['http','https','mailto'],allowedSchemesByTag:{img:['http','https']},allowProtocolRelative:false,allowedStyles:{'*':Object.fromEntries(Object.entries(STYLES).map(([k,v])=>[k,[v]]))},
 transformTags:{'*':(tagName,attribs)=>{const a={...attribs};if(a.style)a.style=safeStyle(a.style);for(const key of ['src','href'])if(a[key]&&!safeUrl(a[key],key==='src'))delete a[key];if(a.align&&!/^(left|center|right|justify)$/.test(a.align))delete a.align;if(a.size&&!/^[1-7]$/.test(a.size))delete a.size;if(a.face&&!STYLES['font-family'].test(a.face))delete a.face;if(a.color&&!STYLES.color.test(a.color))delete a.color;for(const k of ['colspan','rowspan'])if(a[k]&&!/^(?:[1-9]|10)$/.test(a[k]))delete a[k];if(tagName==='a'){a.rel='noopener noreferrer';a.target='_blank';}if(tagName==='img')a.alt=a.alt||'Image';return {tagName,attribs:a};}}
});
};

