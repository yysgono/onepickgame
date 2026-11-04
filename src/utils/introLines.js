export function splitIntroLines(text,lang='en') {
 const value=String(text||'').trim();if(!value)return [];
 if(lang==='th'&&value.includes(' ลอง'))return value.split(/ (?=ลอง)/);
 return (value.match(/[^.!?。।\n]+[.!?。।]?/g)||[value]).map(s=>s.trim()).filter(Boolean);
}
