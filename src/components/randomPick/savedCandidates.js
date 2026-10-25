import {normalizeCandidates} from '../../utils/randomPickCore';
const DB_NAME = 'onepick-random-saved-candidates';
const STORE = 'candidateSets';
const KEY = 'current';
function openDatabase() {
  return new Promise((resolve,reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('Candidate storage unavailable'));
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);};
    request.onerror=()=>reject(request.error || new Error('Candidate storage unavailable'));
    request.onblocked=()=>reject(new Error('Candidate storage is blocked'));
    request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();resolve(db);};
  });
}
function snapshot(rows,sourceCupId) {
  const candidates=normalizeCandidates(rows,'saved');
  if(!candidates.length)throw new Error('Empty candidate set');
  if(candidates.some(row=>row.image.length>4096))throw new Error('Image URL too long');
  const value={version:1,sourceCupId:typeof sourceCupId==='string'?sourceCupId:null,rows:candidates,savedAt:Date.now()};
  if(JSON.stringify(value).length>1000000)throw new Error('Candidate set too large');
  return value;
}
export async function saveCandidateSet(rows,sourceCupId=null) {
  const value=snapshot(rows,sourceCupId),db=await openDatabase();
  try {await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error || new Error('Save cancelled'));tx.objectStore(STORE).put(value,KEY);});return value;}
  finally {db.close();}
}
export async function loadCandidateSet() {
  const db=await openDatabase();
  try {const value=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),request=tx.objectStore(STORE).get(KEY);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);tx.onabort=()=>reject(tx.error);});return value?.version===1&&Array.isArray(value.rows)&&value.rows.length?snapshot(value.rows,value.sourceCupId):null;}
  finally {db.close();}
}
// Preserve imported image URLs for unchanged names; new manual names have no image.
export function rowsFromNames(text,original=[]) {
  const byName=new Map();
  original.forEach(row=>{const group=byName.get(row.name)||[];group.push(row);byName.set(row.name,group);});
  return text.split(/\r?\n/).map(name=>name.trim()).filter(Boolean).slice(0,200).map((name,i)=>{
    const row=byName.get(name)?.shift();
    return {id:`home:${i}`,name:name.slice(0,120),image:row?.image||'',enabled:row?.enabled!==false};
  });
}
