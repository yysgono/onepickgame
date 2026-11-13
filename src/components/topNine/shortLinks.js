import {makeShareHash,readShared} from './core';
const links=new Map();
export async function createShortLink(client,slots,title,names){
 const hash=makeShareHash(slots,title,names,false);
 let link=links.get(hash);
 if(!link){link={id:crypto.randomUUID(),pending:null};links.set(hash,link);}
 if(link.saved)return link.id;
 if(!link.pending)link.pending=Promise.resolve().then(async()=>{
  const board=readShared(hash);
  const {data,error}=await client.rpc('save_top_nine_link',{p_id:link.id,p_board:board});
  if(error)throw error;
  if(data!==link.id)throw Error('SHARE_FAILED');
  link.saved=true;return link.id;
 }).finally(()=>{link.pending=null;});
 return link.pending;
}
export async function loadShortLink(client,id){
 const {data,error}=await client.rpc('get_top_nine_link',{p_id:id});
 if(error)throw error;
 if(!data)return null;
 const board=readShared(makeShareHash(data.slots,data.title,data.names,false));
 return board?{id,title:board.title,slots:board.slots,show_names:board.names,show_ranks:board.showRanks,unlisted:true}:null;
}
