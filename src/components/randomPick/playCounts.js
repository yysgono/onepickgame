import {supabase} from '../../utils/supabaseClient';
import {MODES} from './copy';
let cached=null,expires=0,inflight=null;
const pending=new Set();
export function loadPlayCounts(){
 if(cached&&Date.now()<expires&&!pending.size)return Promise.resolve({...cached});
 if(inflight)return inflight;
 inflight=(async()=>{
  await Promise.allSettled([...pending]);
  const {data,error}=await supabase.from('random_pick_play_counts').select('mode,play_count');
  if(error)throw error;
  const values={};for(const row of data||[])if(MODES.includes(row.mode)&&Number.isFinite(Number(row.play_count)))values[row.mode]=Number(row.play_count);
  cached=values;expires=Date.now()+60000;return {...values};
 })().finally(()=>{inflight=null;});
 return inflight;
}
// Never block animation or retry automatically if statistics fail.
export function recordModePlay(mode){
 if(!MODES.includes(mode))return Promise.resolve(false);
 expires=0;
 const request=(async()=>{
  try{const {data,error}=await supabase.rpc('record_random_pick_play',{p_mode:mode});if(error)throw error;
   if(cached&&Number.isFinite(Number(data)))cached={...cached,[mode]:Number(data)};
   return true;
  }catch{return false;}
 })();
 pending.add(request);
 return request.finally(()=>pending.delete(request));
}
