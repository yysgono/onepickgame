// Older home-card views do not expose updated_at. Fetch only dates from the table.
export async function withTierCardDates(client,rows){
 if(!rows.length)return rows;
 try{
  const {data,error}=await client.from('tier_lists').select('id,updated_at').in('id',rows.map(row=>row.id));
  if(error)return rows;
  const dates=new Map((data||[]).map(row=>[String(row.id),row.updated_at]));
  return rows.map(row=>({...row,updated_at:dates.get(String(row.id))||row.updated_at||row.created_at}));
 }catch{return rows;}
}
