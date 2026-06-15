/* Driftspartner OS module: 49-testdata-cleanup.js
   Removes write-check test data from Supabase and prevents test suppliers from lingering. */
function dpIsTestSupplier(s){
  const name=String(s?.name||'').toLowerCase();
  const email=String(s?.email||'').toLowerCase();
  return name.startsWith('lagringstest leverand')||email.startsWith('test-')&&email.endsWith('@example.no')||email==='tak@tak.no';
}
async function cleanupSupabaseTestData(){
  const out=document.getElementById('writeCheckOut')||document.getElementById('launchCheckOut')||document.getElementById('fullCheckOut');
  const lines=[];
  function line(ok,msg){lines.push(`${ok?'OK':'FEIL'} ${msg}`);if(out)out.textContent=lines.join('\n')}
  try{
    if(!state.currentUserRecord){line(false,'Logg inn med Supabase forst.');return}
    const db=supabaseClient();
    line(true,'Starter rydding av testdata...');
    const suppliers=await db.from('suppliers').select('id,name,email').limit(1000);
    if(suppliers.error)throw suppliers.error;
    const testSupplierIds=(suppliers.data||[]).filter(dpIsTestSupplier).map(s=>s.id);
    if(testSupplierIds.length){
      const offers=await db.from('offers').select('id').in('supplier_id',testSupplierIds);
      if(!offers.error&&offers.data?.length){
        const offerIds=offers.data.map(o=>o.id);
        await db.from('offer_files').delete().in('offer_id',offerIds);
        await db.from('offers').delete().in('id',offerIds);
      }
      await db.from('quote_request_suppliers').delete().in('supplier_id',testSupplierIds);
      const delSup=await db.from('suppliers').delete().in('id',testSupplierIds);
      if(delSup.error)throw delSup.error;
      line(true,`Slettet ${testSupplierIds.length} testleverandorer.`);
    }else line(true,'Ingen testleverandorer funnet.');
    const p=property(),propertyFilter=isUuid(p?.id);
    const tables=[
      ['documents','title','Lagringstest dokument%'],
      ['quote_requests','title','Lagringstest RFQ%'],
      ['work_orders','title','Lagringstest arbeidsordre%'],
      ['deviations','title','Lagringstest avvik%']
    ];
    for(const [table,col,pattern] of tables){
      let q=db.from(table).delete().ilike(col,pattern);
      if(propertyFilter)q=q.eq('property_id',p.id);
      const r=await q;
      line(!r.error,`${table}${r.error?': '+r.error.message:''}`);
    }
    let act=db.from('activity_log').delete().ilike('action','Lagringstest%');
    if(propertyFilter)act=act.eq('property_id',p.id);
    const actRes=await act;
    line(!actRes.error,`activity_log${actRes.error?': '+actRes.error.message:''}`);
    state.suppliers=(state.suppliers||[]).filter(s=>!dpIsTestSupplier(s));
    try{await hydrateCurrentPropertyData(db)}catch(e){}
    line(true,'Rydding ferdig. Oppdater leverandorlisten.');
  }catch(e){line(false,'Rydding feilet: '+e.message)}
}
function supabaseWriteCheckPage(){
  const p=property(),isReal=isSupabaseProperty();
  return `<div class="grid"><div class="card s12"><h3>Supabase lagringskontroll</h3><p class="muted">Testen skriver midlertidige test-rader og rydder dem bort etter kontroll. Bruk Rydd testdata for gamle testleverandorer.</p><table><tr><td>Valgt eiendom</td><td>${esc(p.name)}</td></tr><tr><td>Property ID</td><td>${esc(p.id)}</td></tr><tr><td>ID-type</td><td>${isReal?'<span class="badge ok">Supabase UUID</span>':'<span class="badge bad">Lokal ID, lagres ikke i Supabase</span>'}</td></tr><tr><td>Bruker</td><td>${esc(user().email||user().name)} · ${esc(user().role)}</td></tr></table><button class="action" onclick="useSupabasePropertyForTest()">Hent/velg Supabase-eiendom</button><button class="action primary" onclick="runSupabaseWriteCheck()">Kjor lagringstest</button><button class="action red" onclick="cleanupSupabaseTestData()">Rydd testdata</button><div id="writeCheckOut" class="output">${isReal?'Klar til a teste mot Supabase.':'Trykk Hent/velg Supabase-eiendom forst.'}</div></div></div>`;
}
async function runSupabaseWriteCheck(){
  const out=document.getElementById('writeCheckOut'),lines=[],created={};
  function line(name,ok,msg){lines.push(`${ok?'OK':'FEIL'} ${name}: ${msg}`);out.textContent=lines.join('\n')}
  try{
    let p=property();
    if(!isSupabaseProperty()){
      p=await forceSupabaseProperty();
      if(!p||!isUuid(p.id)){out.textContent='Fant fortsatt bare test-ID. Kontroller property_access for brukeren.';return}
      renderPropertyContext();
    }
    const db=supabaseClient(),stamp=Date.now();
    out.textContent='Tester lagring...';
    const dev=await db.from('deviations').insert({property_id:p.id,title:'Lagringstest avvik '+stamp,description:'Automatisk test',priority:'Medium',status:'Ny'}).select('id').single();
    if(dev.error){line('deviations',false,dev.error.message);return}else{created.dev=dev.data.id;line('deviations',true,dev.data.id)}
    const wo=await db.from('work_orders').insert({property_id:p.id,deviation_id:dev.data.id,title:'Lagringstest arbeidsordre '+stamp,description:'Automatisk test',status:'Ny'}).select('id').single();
    if(wo.error){line('work_orders',false,wo.error.message);return}else{created.wo=wo.data.id;line('work_orders',true,wo.data.id)}
    const qr=await db.from('quote_requests').insert({property_id:p.id,work_order_id:wo.data.id,title:'Lagringstest RFQ '+stamp,description:'Automatisk test',status:'Sendt'}).select('id').single();
    if(qr.error){line('quote_requests',false,qr.error.message);return}else{created.qr=qr.data.id;line('quote_requests',true,qr.data.id)}
    const doc=await db.from('documents').insert({property_id:p.id,category:'FDV',title:'Lagringstest dokument '+stamp,storage_path:`${p.id}/metadata/lagringstest-${stamp}.txt`,status:'Arkivert'}).select('id').single();
    if(doc.error){line('documents',false,doc.error.message);return}else{created.doc=doc.data.id;line('documents',true,doc.data.id)}
    const supplier=await db.from('suppliers').insert({name:'Lagringstest Leverandor '+stamp,email:`test-${stamp}@example.no`,trade:'Test',score:80,status:'active'}).select('id').single();
    if(supplier.error){line('suppliers',false,supplier.error.message);return}else{created.supplier=supplier.data.id;line('suppliers',true,supplier.data.id)}
    const qrs=await db.from('quote_request_suppliers').insert({quote_request_id:qr.data.id,supplier_id:supplier.data.id,status:'Sendt'}).select('id').single();
    if(qrs.error){line('quote_request_suppliers',false,qrs.error.message);return}else{created.qrs=qrs.data.id;line('quote_request_suppliers',true,qrs.data.id)}
    const offer=await db.from('offers').insert({property_id:p.id,quote_request_id:qr.data.id,supplier_id:supplier.data.id,price:12345,status:'Mottatt'}).select('id').single();
    if(offer.error){line('offers',false,offer.error.message);return}else{created.offer=offer.data.id;line('offers',true,offer.data.id)}
    const of=await db.from('offer_files').insert({offer_id:offer.data.id,document_id:doc.data.id,title:'Testfil'}).select('id').single();
    if(of.error){line('offer_files',false,of.error.message);return}else{created.offerFile=of.data.id;line('offer_files',true,of.data.id)}
    const actRow=await db.from('activity_log').insert({property_id:p.id,action:'Lagringstest fullfort',entity_type:'test',entity_id:dev.data.id,metadata:{stamp}}).select('id').single();
    if(actRow.error){line('activity_log',false,actRow.error.message);return}else{created.activity=actRow.data.id;line('activity_log',true,actRow.data.id)}
    await db.from('offer_files').delete().eq('id',created.offerFile);
    await db.from('offers').delete().eq('id',created.offer);
    await db.from('quote_request_suppliers').delete().eq('id',created.qrs);
    await db.from('suppliers').delete().eq('id',created.supplier);
    await db.from('documents').delete().eq('id',created.doc);
    await db.from('quote_requests').delete().eq('id',created.qr);
    await db.from('work_orders').delete().eq('id',created.wo);
    await db.from('deviations').delete().eq('id',created.dev);
    await db.from('activity_log').delete().eq('id',created.activity);
    await hydrateCurrentPropertyData(db);
    line('RESULTAT',true,'Alle tabeller ble testet, og test-radene ble ryddet bort.');
  }catch(e){line('Uventet feil',false,e.message)}
}
app.admin.tabs['Lagringstest']=()=>supabaseWriteCheckPage();
