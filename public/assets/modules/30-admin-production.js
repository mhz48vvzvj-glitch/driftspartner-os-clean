/* Driftspartner OS module: 30-admin-production.js
   Generated from driftspartner-property-os.js. Keep classic script order in HTML. */
function productionReadinessPage(){
  let p=property(),rows=[
    ['Ekte innlogging',!!state.currentUserRecord,'Bruk Supabase Auth. Supabase-innlogging er kun visning.'],
    ['Eiendomstilgang',isUuid(p?.id),'Valgt eiendom skal komme fra Supabase/property_access.'],
    ['Supabase-lagring',isUuid(p?.id),'Kjør live lagringstest på publisert Netlify-side.'],
    ['Storage/dokumenter',true,'Bucket documents må finnes og ha policy for innloggede brukere.'],
    ['E-post',location.protocol!=='file:','Sender fra publisert Netlify-side via Resend.'],
    ['Regnskap/bank',false,'Manuell økonomi er klar. API-kobling krever nøkler fra Tripletex/Fiken/PowerOffice/bank.'],
    ['AI Director',false,'Regelbasert assistent er klar. Ekte AI-agent krever backend-funksjon og AI API-nøkkel.']
  ].map(r=>`<tr><td>${esc(r[0])}</td><td>${r[1]?'<span class="badge ok">OK</span>':'<span class="badge warn">Må kobles/testes</span>'}</td><td>${esc(r[2])}</td></tr>`).join('');
  return `<div class="grid"><div class="card s12"><h3>Produksjonssjekk</h3><p class="muted">Kontrollpanelet før kundebruk. Kjør dette online etter innlogging.</p><table><tr><th>Område</th><th>Status</th><th>Hva betyr det</th></tr>${rows}</table><button class="action primary" onclick="runProductionReadinessCheck()">Kjør live produksjonssjekk</button><button class="action" onclick="showIntegrationSetup()">Regnskap/API-oppsett</button><div id="prodCheckOut" class="output">Klar til kontroll.</div></div></div>`;
}
async function runProductionReadinessCheck(){
  let out=document.getElementById('prodCheckOut'),lines=[];
  function line(ok,msg){lines.push(`${ok?'OK':'FEIL'} ${msg}`);out.textContent=lines.join('\n')}
  try{
    line(!!state.currentUserRecord,'Ekte innlogging');
    if(!state.currentUserRecord){line(false,'Logg inn med Supabase før kundedrift.');return}
    line(isSupabaseProperty(),'Valgt eiendom er Supabase-eiendom');
    if(!isSupabaseProperty()){line(false,'Velg en eiendom fra Supabase, ikke lokal data-eiendom.');return}
    let db=supabaseClient(),p=property();
    for(let table of ['deviations','work_orders','quote_requests','documents','suppliers','activity_log']){
      let r=await db.from(table).select('id').limit(1);
      line(!r.error,`${table}${r.error?': '+r.error.message:''}`);
    }
    let storage=await db.storage.from('documents').list(p.id,{limit:1});
    line(!storage.error,`Storage documents${storage.error?': '+storage.error.message:''}`);
    line(location.protocol!=='file:','Netlify/e-post kan testes online');
    line(true,'Sjekk ferdig. Kjør også Lagringstest for å skrive test-rader.');
  }catch(e){line(false,'Uventet feil: '+e.message)}
}
function showIntegrationSetup(){
  showDrawer('Regnskap og AI-oppsett',`<table><tr><th>Integrasjon</th><th>Status</th><th>Neste steg</th></tr><tr><td>Tripletex</td><td>Ikke koblet</td><td>Legg inn klient/API-nøkkel i backend senere.</td></tr><tr><td>Fiken</td><td>Ikke koblet</td><td>Krever OAuth/API-token fra Fiken.</td></tr><tr><td>PowerOffice Go</td><td>Ikke koblet</td><td>Krever klientoppsett hos PowerOffice.</td></tr><tr><td>Bank/konto</td><td>Manuell</td><td>Saldo kan registreres i Økonomi nå.</td></tr><tr><td>AI Director</td><td>Regelbasert</td><td>Ekte agent krever serverfunksjon og AI API-nøkkel.</td></tr></table><div class="output">Statusen er bevisst ærlig: vi markerer ikke eksterne integrasjoner som ferdige før nøkler og avtaler er på plass.</div>`);
}
app.admin.tabs['Produksjonssjekk']=()=>productionReadinessPage();

async function uploadPropertyDocument({category,title,file,status='Arkivert'}){
  let p=ensurePropertyData(property()),cleanCategory=dpNormalizeDocumentCategory(category),storage='Supabase-feil',path=title,documentId=null,mime=file?.type||null;
  if(!file){addDocument(cleanCategory,title,status);return {documentId,path,title,storage:'Lokal metadata',fileName:title,category:cleanCategory}}
  try{
    let db=supabaseClient();
    if(!isUuid(p.id))throw new Error('Valgt eiendom er test-ID. Velg Supabase-eiendom før filopplasting.');
    path=`${p.id}/${cleanCategory}/${Date.now()}-${file.name}`.replace(/\s+/g,'-');
    let upload=await db.storage.from('documents').upload(path,file,{upsert:false,contentType:file.type||undefined});
    if(upload.error)throw upload.error;
    let doc=await db.from('documents').insert({property_id:p.id,category:cleanCategory,title,storage_path:path,mime_type:mime,status}).select('id').single();
    if(doc.error)throw doc.error;
    documentId=doc.data.id;storage='Supabase Storage';
  }catch(e){storage=dpProductionFail(e.message)}
  addDocument(cleanCategory,title,status);
  return {documentId,path,title,storage,fileName:file.name,category:cleanCategory};
}
async function saveEconomySettings(){
  let p=dpEnsureMoneyData(property());p.bankBalance=+document.getElementById('bankBalance').value||0;p.reservedFunds=+document.getElementById('reservedFunds').value||0;p.monthlyIncome=+document.getElementById('monthlyIncome').value||0;p.monthlyFixedCosts=+document.getElementById('monthlyFixedCosts').value||0;
  let storage='Lagret lokalt';
  try{
    if(isRealSession()){
      let db=supabaseClient(),row={property_id:p.id,bank_balance:p.bankBalance,reserved_funds:p.reservedFunds,monthly_income:p.monthlyIncome,monthly_fixed_costs:p.monthlyFixedCosts,updated_at:new Date().toISOString()};
      let saved=await db.from('property_finance').upsert(row,{onConflict:'property_id'});
      if(saved.error)throw saved.error;
      storage='Supabase';
    }
  }catch(e){storage='Ikke lagret i Supabase: '+e.message}
  logActivity('Økonomi oppdatert','ECONOMY');
  showDrawer('Økonomi lagret',`<table><tr><td>Saldo på konto</td><td>${money(p.bankBalance)}</td></tr><tr><td>Reservert</td><td>${money(p.reservedFunds)}</td></tr><tr><td>Månedlige inntekter</td><td>${money(p.monthlyIncome)}</td></tr><tr><td>Faste kostnader</td><td>${money(p.monthlyFixedCosts)}</td></tr><tr><td>Lagring</td><td>${esc(storage)}</td></tr></table><button class="action" onclick="openTab('DB/kundeøkonomi')">Tilbake til økonomi</button>`);
}
async function createDeviationFromForm(){
  let p=ensureCaseCollections(),title=document.getElementById('devTitle').value,description=document.getElementById('devDesc').value,priority=document.getElementById('devPrio').value,file=document.getElementById('devFile')?.files?.[0],row=null,storage='Supabase-feil';
  try{
    row=await saveDeviationToSupabase(title,description,priority);
    storage='Supabase';
    if(file)await uploadPropertyDocument({category:'Annet',title:`Avvik ${title} - ${file.name}`,file,status:'Dokumentasjon'});
  }catch(e){
    if(isRealSession()){showDrawer('Avvik ble ikke lagret',`<div class="output">${esc(e.message)}\n\nI produksjonsmodus lagrer vi ikke stille som ikke-verifiserte data. Rett feilen og prøv igjen.</div>`);return}
    row={id:'AV-'+Date.now().toString().slice(-5),title,description,priority,status:'Ny',created_at:new Date().toISOString()};storage='Supabase-feil: '+e.message;
  }
  p.deviations.unshift(row);row.display_id=dpFriendlyId(row,'AV',p.deviations);p.dev=p.deviations.length;p.openCases=p.deviations.filter(d=>d.status!=='Lukket').length;logActivity('Avvik opprettet',row.display_id);
  showDrawer('Avvik opprettet',`<table><tr><td>Saksnummer</td><td>${esc(row.display_id)}</td></tr>${dpTechnicalRow(row.id)}<tr><td>Tittel</td><td>${esc(title)}</td></tr><tr><td>Prioritet</td><td>${esc(priority)}</td></tr><tr><td>Lagring</td><td>${esc(storage)}</td></tr></table><button class="action primary" onclick="showCreateWorkOrder('${esc(row.id)}')">Lag arbeidsordre</button><button class="action" onclick="showEmailFlow('deviation','${esc(row.id)}')">Send e-post</button><button class="action" onclick="openTab('Sakslop')">Se saksløp</button>`);
}
async function createWorkOrderDrawer(){
  let p=ensureCaseCollections(),deviationId=document.getElementById('woDeviationId')?.value||'',title=document.getElementById('woTitle').value,owner=document.getElementById('woOwner').value,board=document.getElementById('woBoard').value,due=document.getElementById('woDue').value,info=document.getElementById('woInfo').value,status=document.getElementById('woStatus')?.value||'Ny',vendorEmails=document.getElementById('woVendorEmails')?.value||'',id='WO-'+Date.now().toString().slice(-5),storage='Supabase-feil';
  try{
    let db=supabaseClient(),insert={property_id:p.id,title,description:`Ansvarlig: ${owner}\nKopi: ${board}\nLeverandør e-post: ${vendorEmails}\n\n${info}`,status,due_date:due||null};
    if(isUuid(deviationId))insert.deviation_id=deviationId;
    let {data,error}=await db.from('work_orders').insert(insert).select().single();
    if(error)throw error;
    id=data.id;storage='Supabase';
  }catch(e){
    if(isRealSession()){showDrawer('Arbeidsordre ble ikke lagret',`<div class="output">${esc(e.message)}\n\nI produksjonsmodus lagrer vi ikke stille som ikke-verifiserte data.</div>`);return}
    storage='Supabase-feil: '+e.message;
  }
  let wo={id,title,owner,status,due,source:storage,board,info,vendorEmails,deviation_id:deviationId};if(isUuid(id))wo.technical_id=id;p.workOrders.unshift(wo);wo.display_id=dpFriendlyId(wo,'WO',p.workOrders);logActivity('Arbeidsordre opprettet',wo.display_id);
  showDrawer('Arbeidsordre opprettet',`<table><tr><td>WO</td><td>${esc(wo.display_id)}</td></tr>${dpTechnicalRow(id)}<tr><td>Avvik</td><td>${esc(deviationId?dpCaseLabel(deviationId):'-')}</td></tr><tr><td>Sak</td><td>${esc(title)}</td></tr><tr><td>Ansvarlig</td><td>${esc(owner)}</td></tr><tr><td>Status</td><td>${esc(status)}</td></tr><tr><td>E-post styre/kopi</td><td>${esc(board||'-')}</td></tr><tr><td>E-post leverandør</td><td>${esc(vendorEmails||'-')}</td></tr><tr><td>Lagring</td><td>${esc(storage)}</td></tr></table><button class="action primary" onclick="showQuoteRequest('${esc(id)}')">Lag tilbudsforespørsel</button><button class="action" onclick="showEmailFlow('workorder','${esc(id)}')">Send e-post</button><button class="action" onclick="openTab('Sakslop')">Se saksløp</button>`);
}
async function sendQuoteRequest(){
  let p=ensureCaseCollections(),suppliers=selectedRfqSuppliers(),id='RFQ-'+Date.now().toString().slice(-5),title=document.getElementById('rfqTitle').value,description=document.getElementById('rfqText').value,deadline=document.getElementById('rfqDeadline').value,caseId=document.getElementById('rfqCase').value,file=document.getElementById('rfqFile')?.files?.[0],docTitle=document.getElementById('rfqPdf').value,storage='Supabase-feil',doc=null;
  if(!suppliers.length){document.getElementById('rfqPreview').textContent='Velg minst én leverandør.';return}
  try{
    if(file)doc=await uploadPropertyDocument({category:'Tilbud',title:docTitle||file.name,file,status:'Sendt'});
    let db=supabaseClient(),insert={property_id:p.id,title,description,deadline,status:'Sendt'};
    if(isUuid(caseId))insert.work_order_id=caseId;
    if(doc?.documentId)insert.pdf_document_id=doc.documentId;
    let saved=await db.from('quote_requests').insert(insert).select().single();
    if(saved.error)throw saved.error;
    id=saved.data.id;
    let links=[];
    for(let s of suppliers){let supplier_id=await getOrCreateSupplierId(db,s);if(supplier_id)links.push({quote_request_id:id,supplier_id,status:'Sendt'})}
    if(links.length){let link=await db.from('quote_request_suppliers').insert(links);if(link.error)throw link.error}
    storage='Supabase';
  }catch(e){
    if(isRealSession()){showDrawer('Tilbudsforespørsel ble ikke lagret',`<div class="output">${esc(e.message)}\n\nI produksjonsmodus lagrer vi ikke stille som ikke-verifiserte data.</div>`);return}
    storage='Supabase-feil: '+e.message;
  }
  let rfq={id,title,caseId,deadline,status:'Sendt',suppliers:suppliers.map(s=>s.name)};p.quoteRequests.unshift(rfq);rfq.display_id=dpFriendlyId(rfq,'RFQ',p.quoteRequests);addDocument('Tilbud',docTitle,'Sendt');logActivity('Tilbudsforespørsel sendt',rfq.display_id);
  showDrawer('Tilbudsforespørsel sendt',`<table><tr><td>RFQ</td><td>${esc(rfq.display_id)}</td></tr>${dpTechnicalRow(id)}<tr><td>Sak</td><td>${esc(dpCaseLabel(caseId))}</td></tr><tr><td>Oppdrag</td><td>${esc(title)}</td></tr><tr><td>Frist</td><td>${esc(deadline)}</td></tr><tr><td>Leverandører</td><td>${suppliers.map(s=>esc(s.name)+' ('+esc(s.email)+')').join('<br>')}</td></tr><tr><td>Lagring</td><td>${esc(storage)}</td></tr></table><button class="action primary" onclick="showUploadOffer()">Last opp mottatt tilbud</button><button class="action" onclick="showEmailFlow('quote','${esc(id)}')">Send e-post</button><button class="action" onclick="openTab('Sakslop')">Se saksløp</button>`);
}
