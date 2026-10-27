// Shared allowlist for browser and server rendering. No positioned elements or arbitrary CSS.
const TAGS=['p','div','span','br','strong','b','em','i','u','s','strike','h2','h3','h4','blockquote','pre','code','ul','ol','li','a','img','hr','table','thead','tbody','tr','th','td','font','sub','sup'];
const ATTRS=['href','src','alt','title','target','rel','style','color','size','face','colspan','rowspan','align'];
const color=/^(?:#[0-9a-f]{3,8}|rgba?\([0-9.,%\s]+\)|black|white|red|blue|green|orange|purple|gray|grey|yellow|transparent)$/i;
const STYLES={'color':color,'background-color':color,'text-align':/^(left|center|right|justify)$/,'font-weight':/^(normal|bold|[1-9]00)$/,'font-style':/^(normal|italic)$/,'text-decoration':/^(none|underline|line-through)$/,'font-size':/^(?:[89]|[1-3][0-9]|4[0-8])px$/,'font-family':/^(?:Arial|Georgia|Verdana|Tahoma|serif|sans-serif|monospace)(?:,\s*(?:serif|sans-serif|monospace))?$/i};
function safeStyle(value){return String(value||'').split(';').map(pair=>{const i=pair.indexOf(':');if(i<0)return '';const key=pair.slice(0,i).trim().toLowerCase(),val=pair.slice(i+1).trim();return STYLES[key]?.test(val)?`${key}:${val}`:'';}).filter(Boolean).join(';');}
function safeUrl(value,image=false){return /^(?:https?:\/\/|\/(?!\/)|#)/i.test(String(value||''))||(!image&&/^mailto:[^\s]+$/i.test(String(value||'')));}
module.exports={TAGS,ATTRS,STYLES,safeStyle,safeUrl};
