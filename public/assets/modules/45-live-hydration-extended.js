/* Driftspartner OS module: 45-live-hydration-extended.js
   Dashboard and extended live Supabase hydration wrappers.
   Source: 43-build-order-live-dashboard-checks.js:117-164
*/
const dpHydrateCurrentPropertyDataBase=hydrateCurrentPropertyData;
hydrateCurrentPropertyData=async function(db=supabaseClient()){
  let p=await dpHydrateCurrentPropertyDataBase(db);
  if(!p||!isUuid(p.id))return p;
  try{let {data}=await db.from('quote_requests').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(100);if(data)p.quoteRequests=data.map(x=>({id:x.id,title:x.title,deadline:x.deadline,status:x.status,description:x.description}))}catch(e){}
  try{let {data}=await db.from('offers').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(100);if(data)p.offers=data.map(x=>({id:x.id,supplier:x.supplier_name||x.supplier_id||'Leverandør',price:x.price,deadline:x.deadline,terms:x.reservations||x.terms||'',score:x.score,status:x.status,file:x.file_name||'Tilbud'}))}catch(e){}
  try{let {data}=await db.from('activity_log').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(100);if(data)p.activity=data.map(x=>({time:new Date(x.created_at).toLocaleString('nb-NO'),actor:x.metadata?.actor||'-',action:x.action,caseId:x.entity_id||x.metadata?.caseId||'-'}))}catch(e){}
  try{let {data}=await db.from('property_finance').select('*').eq('property_id',p.id).maybeSingle();if(data){p.bankBalance=+data.bank_balance||0;p.reservedFunds=+data.reserved_funds||0;p.monthlyIncome=+data.monthly_income||0;p.monthlyFixedCosts=+data.monthly_fixed_costs||0}}catch(e){}
  try{let {data}=await db.from('buildings').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(100);if(data?.length)p.buildings=data.map(b=>({id:b.id,name:b.name,address:b.address,gnr:b.gnr,bnr:b.bnr,builtYear:b.built_year,units:b.units_count,area:b.gross_area,technical:b.technical_info,budget:b.budget_amount,history:['Hentet fra Supabase']}))}catch(e){}
  try{let {data}=await db.from('document_folders').select('*').eq('property_id',p.id).order('sort_order',{ascending:true}).limit(100);if(data?.length)p.fdvFolders=data.map(f=>f.name)}catch(e){}
  return p;
};

async function dpQueryLive(db,table,query,errors){
  try{
    let result=await query();
    if(result.error)throw result.error;
    return result.data;
  }catch(e){
    errors.push(`${table}: ${e.message}`);
    return null;
  }
}
const dpHydrateCurrentPropertyDataExtended=hydrateCurrentPropertyData;
hydrateCurrentPropertyData=async function(db=supabaseClient()){
  let p=await dpHydrateCurrentPropertyDataExtended(db),errors=[];
  if(!p||!isUuid(p.id)){return p}
  let devs=await dpQueryLive(db,'deviations',()=>db.from('deviations').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(100),errors);
  if(devs){p.deviations=devs.map((d,i)=>({...d,display_id:d.display_id||`AV-${dpYear()}-${String(i+1).padStart(3,'0')}`}));p.dev=p.deviations.length;p.openCases=p.deviations.filter(d=>d.status!=='Lukket').length}
  let wos=await dpQueryLive(db,'work_orders',()=>db.from('work_orders').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(100),errors);
  if(wos){p.workOrders=wos.map((w,i)=>({id:w.id,technical_id:w.id,display_id:w.display_id||`WO-${dpYear()}-${String(i+1).padStart(3,'0')}`,title:w.title,owner:(w.description||'').match(/Ansvarlig: ([^\n]*)/)?.[1]||'Ikke satt',status:w.status,due:w.due_date,source:'Supabase',info:w.description||''}));p.wo=p.workOrders.length}
  let docs=await dpQueryLive(db,'documents',()=>db.from('documents').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(100),errors);
  if(docs){p.documents=docs.map(d=>({id:d.id,type:d.category,category:d.category,folder:d.category,name:d.title,title:d.title,status:d.status||'Arkivert',path:d.storage_path,version:d.version||'1.0',expires:d.expires_at||'',building:d.building_id||''}));p.fdv=docs.filter(d=>d.category==='FDV').map(d=>d.title)}
  let rfqs=await dpQueryLive(db,'quote_requests',()=>db.from('quote_requests').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(100),errors);
  if(rfqs)p.quoteRequests=rfqs.map(x=>({id:x.id,title:x.title,deadline:x.deadline,status:x.status,description:x.description}));
  let offers=await dpQueryLive(db,'offers',()=>db.from('offers').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(100),errors);
  if(offers)p.offers=offers.map(x=>({id:x.id,supplier:x.supplier_name||x.supplier_id||'Leverandør',price:x.price,deadline:x.deadline,terms:x.reservations||x.terms||'',score:x.score,status:x.status,file:x.file_name||'Tilbud'}));
  let acts=await dpQueryLive(db,'activity_log',()=>db.from('activity_log').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(100),errors);
  if(acts)p.activity=acts.map(x=>({time:new Date(x.created_at).toLocaleString('nb-NO'),actor:x.metadata?.actor||'-',action:x.action,caseId:x.entity_id||x.metadata?.caseId||'-'}));
  let finance=await dpQueryLive(db,'property_finance',()=>db.from('property_finance').select('*').eq('property_id',p.id).maybeSingle(),errors);
  if(finance){p.bankBalance=+finance.bank_balance||0;p.reservedFunds=+finance.reserved_funds||0;p.monthlyIncome=+finance.monthly_income||0;p.monthlyFixedCosts=+finance.monthly_fixed_costs||0}
  let buildings=await dpQueryLive(db,'buildings',()=>db.from('buildings').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(100),errors);
  if(buildings?.length)p.buildings=buildings.map(b=>({id:b.id,name:b.name,address:b.address,gnr:b.gnr,bnr:b.bnr,builtYear:b.built_year,units:b.units_count,area:b.gross_area,technical:b.technical_info,budget:b.budget_amount,history:['Hentet fra Supabase']}));
  let folders=await dpQueryLive(db,'document_folders',()=>db.from('document_folders').select('*').eq('property_id',p.id).order('sort_order',{ascending:true}).limit(100),errors);
  if(folders?.length)p.fdvFolders=folders.map(f=>f.name);
  p.liveErrors=errors;p.liveCheckedAt=new Date().toLocaleString('nb-NO');
  return p;
};
