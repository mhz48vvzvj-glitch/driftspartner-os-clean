/* Driftspartner OS module: 28-supabase-write-check.js
   Supabase property checks and storage/write readiness tests.
   Source: 24-storage-documents-cases.js:185-308
*/
app.operations.tabs['Saksløp']=()=>caseFlowPage();
app.operations.tabs['Sakslop']=()=>caseFlowPage();
app.operations.tabs['Avvik']=()=>deviationsPage();
app.market.tabs['Procurement']=()=>`<div class="grid"><div class="card s4"><button class="action primary" onclick="showQuoteRequest()">Lag tilbudsforespørsel</button><button class="action" onclick="showUploadOffer()">Last opp tilbud</button><button class="action" onclick="showQuoteEvaluation()">AI-vurder tilbud</button><button class="action" onclick="openMain('operations',null);openTab('Saksløp')">Åpne saksløp</button></div><div class="card s8"><h3>Tilbud på ${esc(property().name)}</h3>${offersTable()}</div></div>`;
function isSupabaseProperty(){
  return isUuid(property()?.id);
}
function storageBadge(value){
  let ok=String(value||'').toLowerCase().includes('supabase');
  return `<span class="badge ${ok?'ok':'bad'}">${esc(value||'Ukjent')}</span>`;
}
function supabaseWriteCheckPage(){
  let p=property();
  return `<div class="grid"><div class="card s12"><h3>Supabase lagringskontroll</h3><p class="muted">Denne testen skriver en liten test-rad til hver modul på valgt eiendom. Hvis noe ikke lagres, får vi eksakt feilmelding.</p><table><tr><td>Valgt eiendom</td><td>${esc(p.name)}</td></tr><tr><td>Property ID</td><td>${esc(p.id)}</td></tr><tr><td>ID-type</td><td>${isSupabaseProperty()?'<span class="badge ok">Supabase UUID</span>':'<span class="badge bad">Lokal ID, lagres ikke i Supabase</span>'}</td></tr><tr><td>Bruker</td><td>${esc(user().email||user().name)} · ${esc(user().role)}</td></tr></table><button class="action primary" onclick="runSupabaseWriteCheck()">Kjør lagringstest</button><div id="writeCheckOut" class="output">Trykk knappen for å teste direkte mot Supabase.</div></div></div>`;
}
async function runSupabaseWriteCheck(){
  let out=document.getElementById('writeCheckOut'),p=property(),lines=[];
  function line(name,ok,msg){lines.push(`${ok?'OK':'FEIL'} ${name}: ${msg}`);out.textContent=lines.join('\n')}
  try{
    if(!isSupabaseProperty()){out.textContent='Valgt eiendom har test-ID, ikke Supabase UUID. Logg inn ekte og velg eiendom fra Supabase før du tester.';return}
    let db=supabaseClient(),stamp=Date.now();
    out.textContent='Tester lagring...';
    let dev=await db.from('deviations').insert({property_id:p.id,title:'Lagringstest avvik '+stamp,description:'Automatisk test',priority:'Medium',status:'Ny'}).select('id').single();
    if(dev.error){line('deviations',false,dev.error.message);return}else line('deviations',true,dev.data.id);
    let wo=await db.from('work_orders').insert({property_id:p.id,deviation_id:dev.data.id,title:'Lagringstest arbeidsordre '+stamp,description:'Automatisk test',status:'Ny'}).select('id').single();
    if(wo.error){line('work_orders',false,wo.error.message);return}else line('work_orders',true,wo.data.id);
    let qr=await db.from('quote_requests').insert({property_id:p.id,work_order_id:wo.data.id,title:'Lagringstest RFQ '+stamp,description:'Automatisk test',status:'Sendt'}).select('id').single();
    if(qr.error){line('quote_requests',false,qr.error.message);return}else line('quote_requests',true,qr.data.id);
    let doc=await db.from('documents').insert({property_id:p.id,category:'FDV',title:'Lagringstest dokument '+stamp,storage_path:`${p.id}/metadata/lagringstest-${stamp}.txt`,status:'Arkivert'}).select('id').single();
    if(doc.error){line('documents',false,doc.error.message);return}else line('documents',true,doc.data.id);
    let supplier=await db.from('suppliers').insert({name:'Lagringstest Leverandør '+stamp,email:`test-${stamp}@example.no`,trade:'Test',score:80,status:'active'}).select('id').single();
    if(supplier.error){line('suppliers',false,supplier.error.message);return}else line('suppliers',true,supplier.data.id);
    let qrs=await db.from('quote_request_suppliers').insert({quote_request_id:qr.data.id,supplier_id:supplier.data.id,status:'Sendt'}).select('id').single();
    if(qrs.error){line('quote_request_suppliers',false,qrs.error.message);return}else line('quote_request_suppliers',true,qrs.data.id);
    let offer=await db.from('offers').insert({property_id:p.id,quote_request_id:qr.data.id,supplier_id:supplier.data.id,price:12345,status:'Mottatt'}).select('id').single();
    if(offer.error){line('offers',false,offer.error.message);return}else line('offers',true,offer.data.id);
    let of=await db.from('offer_files').insert({offer_id:offer.data.id,document_id:doc.data.id,title:'Testfil'}).select('id').single();
    if(of.error){line('offer_files',false,of.error.message);return}else line('offer_files',true,of.data.id);
    let actRow=await db.from('activity_log').insert({property_id:p.id,action:'Lagringstest fullført',entity_type:'test',entity_id:dev.data.id,metadata:{stamp}}).select('id').single();
    if(actRow.error){line('activity_log',false,actRow.error.message);return}else line('activity_log',true,actRow.data.id);
    await hydrateCurrentPropertyData(db);
    line('RESULTAT',true,'Alle test-rader ble lagret i Supabase. Table Editor skal vise dem nå.');
  }catch(e){line('Uventet feil',false,e.message)}
}
app.admin.tabs['Lagringstest']=()=>supabaseWriteCheckPage();
function showCreateDeviation(){
  let p=ensureCaseCollections();
  showDrawer('Opprett avvik',`<label>Eiendom</label><input value="${esc(p.name)}" disabled><label>Tittel</label><input id="devTitle" value="${esc(p.risk)}"><label>Beskrivelse</label><textarea id="devDesc">Registrert på ${esc(p.address)}.</textarea><label>Prioritet</label><select id="devPrio"><option>Kritisk</option><option>Høy</option><option>Medium</option><option>Lav</option></select><label>Bilde/dokumentasjon</label><input id="devFile" type="file" accept="image/*,.pdf,.doc,.docx"><button class="action primary" onclick="createDeviationFromForm()">Lagre avvik</button>`);
}
async function loadPropertiesForCurrentUser(db,profile){
  let props=[];
  if(normalizeRole(profile.role)==='superadmin'){
    let all=await db.from('properties').select('*, customers(name)').limit(200);
    if(!all.error&&all.data?.length)props=all.data.map(mapSupabaseProperty);
  }
  if(!props.length){
    let access=await db.from('property_access').select('access_role, properties(*, customers(name))').eq('user_id',profile.id);
    if(access.error)throw access.error;
    props=(access.data||[]).map(r=>r.properties).filter(Boolean).map(mapSupabaseProperty);
  }
  if(props.length){
    state.properties=props;
    state.users[0].properties=props.map(p=>p.id);
    state.selectedProperty=props[0].id;
    await hydrateCurrentPropertyData(db);
  }
}
async function forceSupabaseProperty(){
  let existing=state.properties.find(p=>isUuid(p.id));
  if(existing){state.selectedProperty=existing.id;return existing}
  let db=supabaseClient(),profile=state.currentUserRecord||user();
  await loadPropertiesForCurrentUser(db,profile);
  return state.properties.find(p=>isUuid(p.id));
}
function supabaseWriteCheckPage(){
  let p=property(),isReal=isSupabaseProperty();
  return `<div class="grid"><div class="card s12"><h3>Supabase lagringskontroll</h3><p class="muted">Denne testen skriver en liten test-rad til hver modul på valgt eiendom.</p><table><tr><td>Valgt eiendom</td><td>${esc(p.name)}</td></tr><tr><td>Property ID</td><td>${esc(p.id)}</td></tr><tr><td>ID-type</td><td>${isReal?'<span class="badge ok">Supabase UUID</span>':'<span class="badge bad">Lokal ID, lagres ikke i Supabase</span>'}</td></tr><tr><td>Bruker</td><td>${esc(user().email||user().name)} · ${esc(user().role)}</td></tr></table><button class="action" onclick="useSupabasePropertyForTest()">Hent/velg Supabase-eiendom</button><button class="action primary" onclick="runSupabaseWriteCheck()">Kjør lagringstest</button><div id="writeCheckOut" class="output">${isReal?'Klar til å teste mot Supabase.':'Trykk Hent/velg Supabase-eiendom først.'}</div></div></div>`;
}
async function useSupabasePropertyForTest(){
  let out=document.getElementById('writeCheckOut');
  try{
    if(out)out.textContent='Henter Supabase-eiendommer...';
    let p=await forceSupabaseProperty();
    if(!p){if(out)out.textContent='Fant ingen Supabase-eiendom. Sjekk at properties har rader, og at property_access har tilgang for brukeren.';return}
    renderPropertyContext();
    openTab('Lagringstest');
  }catch(e){if(out)out.textContent='Kunne ikke hente Supabase-eiendom: '+e.message}
}
async function runSupabaseWriteCheck(){
  let out=document.getElementById('writeCheckOut'),p=property(),lines=[];
  function line(name,ok,msg){lines.push(`${ok?'OK':'FEIL'} ${name}: ${msg}`);out.textContent=lines.join('\n')}
  try{
    if(!isSupabaseProperty()){
      p=await forceSupabaseProperty();
      if(!p||!isUuid(p.id)){out.textContent='Fant fortsatt bare test-ID. Gå til Admin > Tilganger og kontroller property_access, eller kjør pilot-SQL på nytt.';return}
      renderPropertyContext();
    }
    let db=supabaseClient(),stamp=Date.now();
    out.textContent='Tester lagring...';
    let dev=await db.from('deviations').insert({property_id:p.id,title:'Lagringstest avvik '+stamp,description:'Automatisk test',priority:'Medium',status:'Ny'}).select('id').single();
    if(dev.error){line('deviations',false,dev.error.message);return}else line('deviations',true,dev.data.id);
    let wo=await db.from('work_orders').insert({property_id:p.id,deviation_id:dev.data.id,title:'Lagringstest arbeidsordre '+stamp,description:'Automatisk test',status:'Ny'}).select('id').single();
    if(wo.error){line('work_orders',false,wo.error.message);return}else line('work_orders',true,wo.data.id);
    let qr=await db.from('quote_requests').insert({property_id:p.id,work_order_id:wo.data.id,title:'Lagringstest RFQ '+stamp,description:'Automatisk test',status:'Sendt'}).select('id').single();
    if(qr.error){line('quote_requests',false,qr.error.message);return}else line('quote_requests',true,qr.data.id);
    let doc=await db.from('documents').insert({property_id:p.id,category:'FDV',title:'Lagringstest dokument '+stamp,storage_path:`${p.id}/metadata/lagringstest-${stamp}.txt`,status:'Arkivert'}).select('id').single();
    if(doc.error){line('documents',false,doc.error.message);return}else line('documents',true,doc.data.id);
    let supplier=await db.from('suppliers').insert({name:'Lagringstest Leverandør '+stamp,email:`test-${stamp}@example.no`,trade:'Test',score:80,status:'active'}).select('id').single();
    if(supplier.error){line('suppliers',false,supplier.error.message);return}else line('suppliers',true,supplier.data.id);
    let qrs=await db.from('quote_request_suppliers').insert({quote_request_id:qr.data.id,supplier_id:supplier.data.id,status:'Sendt'}).select('id').single();
    if(qrs.error){line('quote_request_suppliers',false,qrs.error.message);return}else line('quote_request_suppliers',true,qrs.data.id);
    let offer=await db.from('offers').insert({property_id:p.id,quote_request_id:qr.data.id,supplier_id:supplier.data.id,price:12345,status:'Mottatt'}).select('id').single();
    if(offer.error){line('offers',false,offer.error.message);return}else line('offers',true,offer.data.id);
    let of=await db.from('offer_files').insert({offer_id:offer.data.id,document_id:doc.data.id,title:'Testfil'}).select('id').single();
    if(of.error){line('offer_files',false,of.error.message);return}else line('offer_files',true,of.data.id);
    let actRow=await db.from('activity_log').insert({property_id:p.id,action:'Lagringstest fullført',entity_type:'test',entity_id:dev.data.id,metadata:{stamp}}).select('id').single();
    if(actRow.error){line('activity_log',false,actRow.error.message);return}else line('activity_log',true,actRow.data.id);
    await hydrateCurrentPropertyData(db);
    line('RESULTAT',true,'Alle test-rader ble lagret i Supabase.');
  }catch(e){line('Uventet feil',false,e.message)}
}
app.admin.tabs['Lagringstest']=()=>supabaseWriteCheckPage();


