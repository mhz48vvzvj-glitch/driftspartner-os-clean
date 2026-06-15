/* Driftspartner OS module: 24-storage-suppliers.js
   UUID helpers and supplier lookup/creation for storage and RFQ flows.
   Source: 24-storage-documents-cases.js:1-16
*/
/* Driftspartner OS module: 24-storage-documents-cases.js
   Storage, document archive, deviations, work orders, quote flow and write checks.
   Source: 20-auth-supabase.js:305-607
*/
function isUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v||''))}
async function getOrCreateSupplierId(db,s){
  if(s?.id&&isUuid(s.id))return s.id;
  if(!s?.email)return null;
  let existing=await db.from('suppliers').select('id').eq('email',s.email).maybeSingle();
  if(existing.error)throw existing.error;
  if(existing.data?.id)return existing.data.id;
  let created=await db.from('suppliers').insert({name:s.name,email:s.email,trade:s.trade||'',score:s.score||0,status:'active'}).select('id').single();
  if(created.error)throw created.error;
  s.id=created.data.id;
  return s.id;
}
