/* Driftspartner OS module: 90-production-strict.js
   Final production overrides: no test data, live writes only and strict Supabase behavior.
   Source: 90-production-strict.js:1-276
*/
/* Driftspartner OS module: 90-production-strict.js
   Generated from driftspartner-property-os.js. Keep classic script order in HTML. */
const DP_PRODUCTION_STRICT=true;
const dpEmptyProperty={
  id:'',
  customer:'',
  name:'Ingen Supabase-eiendom valgt',
  address:'',
  type:'',
  contact:'',
  email:'',
  buildings:0,
  area:0,
  score:0,
  openCases:0,
  dev:0,
  wo:0,
  invoice:0,
  margin:0,
  risk:'',
  capital:'',
  fdv:[],
  hms:[],
  documents:[],
  deviations:[],
  workOrders:[],
  quoteRequests:[],
  offers:[],
  projects:[],
  activity:[]
};
user=function(){
  return state.users.find(u=>u.id===state.currentUser)||state.users[0]||{id:'public-user',name:'Ikke innlogget',email:'',phone:'',role:'public',org:'Driftspartner OS',properties:[]};
};
allowedProperties=function(){
  let u=user();
  if(!state.isLoggedIn||u.role==='public')return [];
  return u.role==='superadmin'?state.properties:state.properties.filter(p=>(u.properties||[]).includes(p.id));
};
property=function(){
  return allowedProperties().find(p=>p.id===state.selectedProperty)||allowedProperties()[0]||dpEmptyProperty;
};
function dpIsProductionLive(){
  return !!state.currentUserRecord&&isUuid(user()?.id)&&isSupabaseProperty();
}
isRealSession=function(){
  return dpIsProductionLive();
};
function dpRequireLiveWrite(action='lagre'){
  if(!state.isLoggedIn)throw new Error(`Du må logge inn med Supabase før du kan ${action}.`);
  if(!state.currentUserRecord)throw new Error(`Ekte Supabase-innlogging mangler. ${action} er stoppet.`);
  if(!isUuid(property()?.id))throw new Error(`Valgt eiendom er ikke en Supabase-eiendom. Velg en eiendom fra Supabase før du kan ${action}.`);
}
ensurePropertyData=function(p=property()){
  p=p||dpEmptyProperty;
  p.orgnr=p.orgnr||'';
  p.invoiceAddress=p.invoiceAddress||p.address||'';
  p.manager=p.manager||'';
  p.sla=p.sla||'';
  p.paymentStatus=p.paymentStatus||'';
  p.boardMembers=Array.isArray(p.boardMembers)?p.boardMembers:[];
  p.agreements=Array.isArray(p.agreements)?p.agreements:[];
  p.fdv=Array.isArray(p.fdv)?p.fdv:[];
  p.hms=Array.isArray(p.hms)?p.hms:[];
  p.documents=Array.isArray(p.documents)?p.documents:[];
  p.activity=Array.isArray(p.activity)?p.activity:[];
  p.offers=Array.isArray(p.offers)?p.offers:[];
  p.quoteRequests=Array.isArray(p.quoteRequests)?p.quoteRequests:[];
  p.workOrders=Array.isArray(p.workOrders)?p.workOrders:[];
  p.invoiceBasis=Array.isArray(p.invoiceBasis)?p.invoiceBasis:[];
  p.drawings=Array.isArray(p.drawings)?p.drawings:[];
  p.hmsLists=Array.isArray(p.hmsLists)?p.hmsLists:[];
  p.caseFlow=Array.isArray(p.caseFlow)?p.caseFlow:[];
  p.deviations=Array.isArray(p.deviations)?p.deviations:[];
  p.projects=Array.isArray(p.projects)?p.projects:[];
  p.budgetLines=Array.isArray(p.budgetLines)?p.budgetLines:[];
  p.buildingsList=Array.isArray(p.buildingsList)?p.buildingsList:[];
  p.buildings=Array.isArray(p.buildings)?p.buildings:p.buildingsList;
  p.invoice=+p.invoice||0;
  p.openCases=+p.openCases||0;
  p.dev=+p.dev||0;
  p.wo=+p.wo||0;
  return p;
};
dpV1Ensure=function(p=property()){
  p=ensurePropertyData(p);
  p.fdvFolders=Array.isArray(p.fdvFolders)?p.fdvFolders:['Bygg','VVS','Elektro','Brann','Ventilasjon','Tak','Fasade','Heis','HMS','Forsikring','Garantier','Tegninger','Kontrakter','Serviceavtaler'];
  p.controls=Array.isArray(p.controls)?p.controls:[];
  p.unitsList=Array.isArray(p.unitsList)?p.unitsList:[];
  p.boardMeetings=Array.isArray(p.boardMeetings)?p.boardMeetings:[];
  p.boardTasks=Array.isArray(p.boardTasks)?p.boardTasks:[];
  p.leaseAgreements=Array.isArray(p.leaseAgreements)?p.leaseAgreements:[];
  return p;
};
function dpShowSupabaseError(title,error,table=''){
  showDrawer(title,`<div class="output">${esc(error?.message||String(error))}</div>${table?`<p class="muted">Sjekk tabellen/policyen: ${esc(table)} i Supabase.</p>`:''}<button class="action" onclick="openMain('admin',null);openTab('Produksjonssjekk')">Åpne produksjonssjekk</button>`);
}
dpProductionFail=function(message){
  throw new Error(message);
};
logoutSupabase=async function(){
  try{await supabaseClient().auth.signOut()}catch(e){}
  state.isLoggedIn=false;
  state.currentUser='public-user';
  state.currentUserRecord=null;
  state.users=[{id:'public-user',name:'Ikke innlogget',email:'',phone:'',role:'public',org:'Driftspartner OS',properties:[]}];
  state.properties=[];
  state.suppliers=[];
  state.selectedProperty='';
  current='home';
  renderPublic();
};
logoutApp=function(){logoutSupabase()};
loadSupabaseProperties=async function(){
  let out=document.getElementById('sbOut');
  try{
    saveSupabaseConfig();
    let db=supabaseClient();
    let {data,error}=await db.from('properties').select('*, customers(name)').limit(50);
    if(error)throw error;
    state.properties=(data||[]).map(mapSupabaseProperty);
    if(state.users[0])state.users[0].properties=state.properties.map(p=>p.id);
    state.selectedProperty=state.properties[0]?.id||'';
    if(state.selectedProperty)await hydrateCurrentPropertyData(db);
    renderPropertyContext();
    out.textContent=`Hentet ${state.properties.length} eiendommer fra Supabase. Ingen test-eiendommer brukes.`;
  }catch(e){out.textContent='Henting feilet: '+e.message}
};
DashboardPage=function(){
  let d=dpLiveRawDashboardData(),p=d.p;
  if(!d.online){
    return `<div class="ops-dashboard"><section class="ops-head"><div><h2>Dashboard</h2><p class="muted">Logg inn med Supabase og velg en Supabase-eiendom.</p></div><button class="action primary" onclick="showLogin()">Logg inn</button></section><section class="ops-panel"><h3>Ingen tall vises før live-data er hentet</h3><p class="muted">Produksjonsmodus er aktiv. Dashboardet bruker ikke lokal data, ikke-verifiserte data eller gamle eldre felt.</p></section></div>`;
  }
  let closed=['lukket','ferdig','utført','utfort','fullført','fullfort'];
  let openDevs=d.devs.filter(x=>!closed.includes(String(x.status||'').toLowerCase())).length;
  let critical=d.devs.filter(x=>String(x.priority||'').toLowerCase().includes('kritisk')&&!closed.includes(String(x.status||'').toLowerCase())).length;
  let openWos=d.wos.filter(x=>!closed.includes(String(x.status||'').toLowerCase())).length;
  let categories={};d.devs.forEach(x=>{let c=x.category||'Ikke kategorisert';categories[c]=(categories[c]||0)+1});
  let catRows=Object.entries(categories).map(([k,v])=>`<div class="ops-row"><span class="task-dot" style="background:#895dff"></span><div><strong>${esc(k)}</strong><br><small class="muted">Fra deviations.category</small></div><b>${v}</b></div>`).join('')||'<p class="muted">Ingen kategoriserte live-avvik.</p>';
  let aiItems=[];
  if(critical)aiItems.push(`Kritiske avvik: ${critical}`);
  if(openWos)aiItems.push(`Åpne arbeidsordre: ${openWos}`);
  if(!d.docs.length)aiItems.push('Ingen live-dokumenter registrert');
  if(!aiItems.length)aiItems.push('Ingen live-funn akkurat nå');
  return `<div class="ops-dashboard"><section class="ops-head"><div><h2>Dashboard</h2><p class="muted">${esc(p.name)} · KUN live Supabase-rader · sist hentet ${esc(p.liveCheckedAt||'ikke hentet')}</p>${dpLiveErrorPanel()}</div><div><button class="action" onclick="hydrateDashboardNow()">${Icon('refresh')} Hent live data</button><button class="action" onclick="openMain('admin',null);openTab('Fullsjekk')">Fullsjekk</button><button class="action primary" onclick="showCreateDeviation()">${Icon('plus')} Nytt avvik</button></div></section><section class="ops-kpis">${dpRawLiveKpi('alert','Åpne avvik',openDevs,'deviations','blue','showDashboardOpenDeviations()')}${dpRawLiveKpi('alert','Kritiske avvik',critical,'deviations.priority','redgrad','showDashboardOpenDeviations()')}${dpRawLiveKpi('tool','Arbeidsordre',openWos,'work_orders','yellow','showDashboardWorkOrders()')}${dpRawLiveKpi('file','Dokumenter',d.docs.length,'documents','violet','showDashboardDocuments()')}${dpRawLiveKpi('mail','Tilbud/RFQ',`${d.offers.length}/${d.rfqs.length}`,'offers / quote_requests','blue','showDashboardQuotes()')}${dpRawLiveKpi('briefcase','Konto',money(d.finance.bank),'property_finance','greengrad','showDashboardFinance()')}</section><section class="ops-mid">${dpRawFinancePanel(d)}<div class="ops-panel"><h3>Avvik fordelt på kategori</h3>${catRows}</div><div class="ops-panel"><h3>AI Director - kun live regler</h3>${aiItems.map(x=>`<div class="os-rec"><span class="mini-ico ${x.includes('Ingen')?'greengrad':'yellow'}">${Icon(x.includes('Ingen')?'check':'alert')}</span><div><strong>${esc(x)}</strong><br><small class="muted">Basert på live-tabeller, ikke lokal data.</small></div></div>`).join('')}</div></section><section class="ops-quick"><h3>Hurtighandlinger</h3><div>${[['alert','Registrer avvik','showCreateDeviation()'],['tool','Ny arbeidsordre','showCreateWorkOrder()'],['file','Last opp dokument','showUploadFDV()'],['mail','Lag tilbudsforespørsel','showQuoteRequest()'],['chart','Økonomi','openMain("finance",null);openTab("DB/kundeøkonomi")'],['users','Styre','openMain("board",null)']].map(x=>`<button class="action" onclick="${x[2]}"><span class="mini-ico blue">${Icon(x[0])}</span>${esc(x[1])}</button>`).join('')}</div></section><section class="ops-bottom"><section class="ops-panel"><div class="dash-title"><h3>Live avvik</h3><button class="action" onclick="showDashboardOpenDeviations()">Åpne</button></div>${dpRawRows(d.devs,'dev')}</section><section class="ops-panel"><div class="dash-title"><h3>Live arbeidsordre</h3><button class="action" onclick="showDashboardWorkOrders()">Åpne</button></div>${dpRawRows(d.wos,'wo')}</section><section class="ops-panel"><div class="dash-title"><h3>Live dokumenter</h3><button class="action" onclick="showDashboardDocuments()">Åpne</button></div>${dpRawRows(d.docs,'doc')}</section><section class="ops-panel"><h3>Datastatus</h3><p class="muted">Produksjonsmodus: kun live Supabase-tall.</p><button class="action primary" onclick="hydrateDashboardNow()">Oppdater nå</button></section></section></div>`;
};
uploadPropertyDocument=async function({category,title,file,status='Arkivert'}){
  dpRequireLiveWrite('laste opp dokument');
  if(!file)throw new Error('Velg en faktisk fil. Metadata alene lagres ikke i produksjonsmodus.');
  let p=property(),cleanCategory=dpNormalizeDocumentCategory(category),path=`${p.id}/${cleanCategory}/${Date.now()}-${file.name}`.replace(/\s+/g,'-'),db=supabaseClient();
  let upload=await db.storage.from('documents').upload(path,file,{upsert:false,contentType:file.type||undefined});
  if(upload.error)throw upload.error;
  let doc=await db.from('documents').insert({property_id:p.id,category:cleanCategory,title:title||file.name,storage_path:path,mime_type:file.type||null,status}).select('id').single();
  if(doc.error)throw doc.error;
  let local={id:doc.data.id,type:cleanCategory,category:cleanCategory,name:title||file.name,title:title||file.name,status,path,storage_path:path,date:new Date().toLocaleDateString('nb-NO')};
  let current=ensurePropertyData(p);current.documents=current.documents||[];current.documents.unshift(local);
  logActivity('Dokument lastet opp',doc.data.id);
  return {documentId:doc.data.id,path,title:title||file.name,storage:'Supabase Storage',fileName:file.name,category:cleanCategory};
};
uploadDocumentToSupabase=async function(){
  let type=document.getElementById('fdvType')?.value||'FDV',title=document.getElementById('fdvName')?.value||'',file=document.getElementById('fdvFile')?.files?.[0],out=document.getElementById('fdvOut'),building=document.getElementById('fdvBuilding')?.value||'',version=document.getElementById('fdvVersion')?.value||'',expires=document.getElementById('fdvExpires')?.value||'';
  try{
    let result=await uploadPropertyDocument({category:dpNormalizeDocumentCategory(type),title:title||file?.name||'Dokument',file,status:'Arkivert'});
    let doc=property().documents?.[0];
    if(doc){doc.folder=type;doc.building=building;doc.version=version;doc.expires=expires;doc.uploadedBy=user().name}
    if(out)out.textContent=`Dokument registrert i Supabase Storage.\nMappe: ${type}\nBygg: ${building||'Hele eiendommen'}\nLagring: ${result.storage}`;
    openPropertyTabV1('FDV/HMS');
  }catch(e){if(out)out.textContent='FEIL: '+e.message;dpShowSupabaseError('Dokument ble ikke lagret',e,'documents / Storage documents')}
};
saveEconomySettings=async function(){
  try{
    dpRequireLiveWrite('lagre økonomi');
    let row={property_id:property().id,bank_balance:+document.getElementById('bankBalance').value||0,reserved_funds:+document.getElementById('reservedFunds').value||0,monthly_income:+document.getElementById('monthlyIncome').value||0,monthly_fixed_costs:+document.getElementById('monthlyFixedCosts').value||0,updated_at:new Date().toISOString()};
    let saved=await supabaseClient().from('property_finance').upsert(row,{onConflict:'property_id'}).select().single();
    if(saved.error)throw saved.error;
    Object.assign(property(),{bankBalance:row.bank_balance,reservedFunds:row.reserved_funds,monthlyIncome:row.monthly_income,monthlyFixedCosts:row.monthly_fixed_costs});
    logActivity('Økonomi oppdatert','ECONOMY');
    showDrawer('Økonomi lagret',`<table><tr><td>Saldo på konto</td><td>${money(row.bank_balance)}</td></tr><tr><td>Reservert</td><td>${money(row.reserved_funds)}</td></tr><tr><td>Månedlige inntekter</td><td>${money(row.monthly_income)}</td></tr><tr><td>Faste kostnader</td><td>${money(row.monthly_fixed_costs)}</td></tr><tr><td>Lagring</td><td>Supabase</td></tr></table>`);
  }catch(e){dpShowSupabaseError('Økonomi ble ikke lagret',e,'property_finance')}
};
saveSupplier=async function(){
  let name=document.getElementById('supplierName').value.trim(),email=document.getElementById('supplierEmail').value.trim(),trade=document.getElementById('supplierTrade').value.trim(),score=+document.getElementById('supplierScore').value||0;
  if(!name){showDrawer('Mangler navn','<div class="output">Skriv inn navn på leverandøren.</div>');return}
  if(!email||!email.includes('@')){showDrawer('Mangler e-post','<div class="output">Leverandøren må ha gyldig e-postadresse.</div>');return}
  try{
    dpRequireLiveWrite('lagre leverandør');
    let saved=await supabaseClient().from('suppliers').insert({name,email,trade,score,status:'active'}).select('id').single();
    if(saved.error)throw saved.error;
    let id=saved.data.id;
    state.suppliers.push({id,name,email,trade,score});
    logActivity('Leverandør registrert',id);
    showDrawer('Leverandør registrert',`<table><tr><td>Navn</td><td>${esc(name)}</td></tr><tr><td>E-post</td><td>${esc(email)}</td></tr><tr><td>Fag</td><td>${esc(trade)}</td></tr><tr><td>Lagring</td><td>Supabase</td></tr></table>`);
  }catch(e){dpShowSupabaseError('Leverandør ble ikke lagret',e,'suppliers')}
};
createWorkOrderDrawer=async function(){
  let p=ensureCaseCollections(),deviationId=document.getElementById('woDeviationId')?.value||'',title=document.getElementById('woTitle').value,owner=document.getElementById('woOwner').value,board=document.getElementById('woBoard').value,due=document.getElementById('woDue').value,info=document.getElementById('woInfo').value,status=document.getElementById('woStatus')?.value||'Ny',vendorEmails=document.getElementById('woVendorEmails')?.value||'';
  try{
    dpRequireLiveWrite('opprette arbeidsordre');
    let insert={property_id:p.id,title,description:`Ansvarlig: ${owner}\nKopi: ${board}\nLeverandør e-post: ${vendorEmails}\n\n${info}`,status,due_date:due||null};
    if(isUuid(deviationId))insert.deviation_id=deviationId;
    let saved=await supabaseClient().from('work_orders').insert(insert).select().single();
    if(saved.error)throw saved.error;
    let wo={id:saved.data.id,technical_id:saved.data.id,title,owner,status,due,source:'Supabase',board,info,vendorEmails,deviation_id:deviationId};
    p.workOrders.unshift(wo);wo.display_id=dpFriendlyId(wo,'WO',p.workOrders);logActivity('Arbeidsordre opprettet',wo.display_id);
    showDrawer('Arbeidsordre opprettet',`<table><tr><td>WO</td><td>${esc(wo.display_id)}</td></tr>${dpTechnicalRow(wo.id)}<tr><td>Sak</td><td>${esc(title)}</td></tr><tr><td>Ansvarlig</td><td>${esc(owner)}</td></tr><tr><td>Status</td><td>${esc(status)}</td></tr><tr><td>Lagring</td><td>Supabase</td></tr></table><button class="action primary" onclick="showQuoteRequest('${esc(wo.id)}')">Lag tilbudsforespørsel</button><button class="action" onclick="showEmailFlow('workorder','${esc(wo.id)}')">Send e-post</button>`);
  }catch(e){dpShowSupabaseError('Arbeidsordre ble ikke lagret',e,'work_orders')}
};
sendQuoteRequest=async function(){
  let p=ensureCaseCollections(),suppliers=selectedRfqSuppliers(),title=document.getElementById('rfqTitle').value,description=document.getElementById('rfqText').value,deadline=document.getElementById('rfqDeadline').value,caseId=document.getElementById('rfqCase').value,file=document.getElementById('rfqFile')?.files?.[0],docTitle=document.getElementById('rfqPdf').value,doc=null;
  if(!suppliers.length){document.getElementById('rfqPreview').textContent='Velg minst én leverandør.';return}
  try{
    dpRequireLiveWrite('lagre tilbudsforespørsel');
    if(file)doc=await uploadPropertyDocument({category:'Tilbud',title:docTitle||file.name,file,status:'Sendt'});
    let insert={property_id:p.id,title,description,deadline,status:'Sendt'};
    if(isUuid(caseId))insert.work_order_id=caseId;
    if(doc?.documentId)insert.pdf_document_id=doc.documentId;
    let saved=await supabaseClient().from('quote_requests').insert(insert).select().single();
    if(saved.error)throw saved.error;
    let links=[];
    for(let s of suppliers){let supplier_id=await getOrCreateSupplierId(supabaseClient(),s);if(supplier_id)links.push({quote_request_id:saved.data.id,supplier_id,status:'Sendt'})}
    if(links.length){let link=await supabaseClient().from('quote_request_suppliers').insert(links);if(link.error)throw link.error}
    let rfq={id:saved.data.id,title,caseId,deadline,status:'Sendt',suppliers:suppliers.map(s=>s.name)};p.quoteRequests.unshift(rfq);rfq.display_id=dpFriendlyId(rfq,'RFQ',p.quoteRequests);logActivity('Tilbudsforespørsel sendt',rfq.display_id);
    showDrawer('Tilbudsforespørsel sendt',`<table><tr><td>RFQ</td><td>${esc(rfq.display_id)}</td></tr>${dpTechnicalRow(saved.data.id)}<tr><td>Oppdrag</td><td>${esc(title)}</td></tr><tr><td>Leverandører</td><td>${suppliers.map(s=>esc(s.name)+' ('+esc(s.email)+')').join('<br>')}</td></tr><tr><td>Lagring</td><td>Supabase</td></tr></table><button class="action" onclick="showEmailFlow('quote','${esc(saved.data.id)}')">Send e-post</button>`);
  }catch(e){dpShowSupabaseError('Tilbudsforespørsel ble ikke lagret',e,'quote_requests / quote_request_suppliers')}
};
saveOffer=async function(){
  let p=ensurePropertyData(property()),supplier=state.suppliers.find(x=>String(x.id)===String(document.getElementById('offerSupplier')?.value)),price=+document.getElementById('offerPrice')?.value||0,terms=document.getElementById('offerTerms')?.value||'',deadline=document.getElementById('offerDeadline')?.value||'',file=document.getElementById('offerUploadFile')?.files?.[0],title=document.getElementById('offerFileTitle')?.value||file?.name||'Tilbud.pdf';
  if(!supplier){showDrawer('Mangler leverandør','<div class="output">Registrer eller velg leverandør med e-post først.</div>');return}
  try{
    dpRequireLiveWrite('lagre tilbud');
    if(!file)throw new Error('Velg PDF/vedlegg for tilbudet.');
    let doc=await uploadPropertyDocument({category:'Tilbud',title,file,status:'Mottatt'});
    let supplierId=await getOrCreateSupplierId(supabaseClient(),supplier);
    let saved=await supabaseClient().from('offers').insert({property_id:p.id,supplier_id:supplierId,price,deadline,reservations:terms,status:'Mottatt'}).select('id').single();
    if(saved.error)throw saved.error;
    if(doc.documentId){
      let linked=await supabaseClient().from('offer_files').insert({offer_id:saved.data.id,document_id:doc.documentId,title,storage_path:doc.path});
      if(linked.error)throw linked.error;
    }
    let offer={id:saved.data.id,supplier:supplier.name,email:supplier.email,price,deadline,file:title,terms,score:0};
    p.offers.push(offer);logActivity(`Tilbud lastet opp fra ${supplier.name}`,saved.data.id);
    showDrawer('Tilbud lastet opp',`<table><tr><td>Leverandør</td><td>${esc(supplier.name)}</td></tr><tr><td>Pris</td><td>${money(price)}</td></tr><tr><td>PDF/vedlegg</td><td>${esc(title)}</td></tr><tr><td>Lagring</td><td>Supabase</td></tr></table><button class="action primary" onclick="analyzeOffer('${esc(saved.data.id)}')">Analyser tilbud</button>`);
  }catch(e){dpShowSupabaseError('Tilbud ble ikke lagret',e,'offers / offer_files / documents')}
};
showContract=function(supplierId=''){
  let supplier=state.suppliers.find(x=>String(x.id)===String(supplierId))||state.suppliers[0];
  if(!supplier){showDrawer('Mangler leverandør','<div class="output">Registrer en leverandør i Supabase før kontrakt kan opprettes.</div><button class="action" onclick="showSupplierRegistration()">Registrer leverandør</button>');return}
  showDrawer('Kontrakt',`<table><tr><td>Eiendom</td><td>${esc(property().name)}</td></tr><tr><td>Leverandør</td><td>${esc(supplier.name)}</td></tr><tr><td>E-post</td><td>${esc(supplier.email||'-')}</td></tr><tr><td>Status</td><td>Klar for produksjonsflyt</td></tr></table><p class="muted">Kontrakt skal genereres fra valgt tilbud/leverandør og lagres i dokumentarkivet. Ingen lokal kontrakt opprettes.</p><button class="action" onclick="showEmailFlow('contract','${esc(supplier.id)}')">Send e-post</button><button class="action primary" onclick="showUploadFDV('Kontrakt')">Last opp signert kontrakt</button>`);
};
createDeviationFromForm=async function(){
  let p=dpV1Ensure(),title=document.getElementById('devTitle').value.trim(),description=document.getElementById('devDesc').value,priority=document.getElementById('devPrio').value,file=document.getElementById('devFile')?.files?.[0],category=document.getElementById('devCategory')?.value||'Annet';
  let extra={reporter:document.getElementById('devReporter')?.value,building:document.getElementById('devBuilding')?.value,unit:document.getElementById('devUnit')?.value,category,assignedEmails:parseEmails(document.getElementById('devAssign')?.value)};
  if(!title){showDrawer('Mangler tittel','<div class="output">Skriv inn tittel på avviket.</div>');return}
  try{
    dpRequireLiveWrite('opprette avvik');
    let row=await saveDeviationToSupabaseWithCategory({title,description:`${description}\n\nBygg: ${extra.building||'-'}\nLeilighet/område: ${extra.unit||'-'}\nKategori: ${category}\nInnsender: ${extra.reporter||'-'}\nTildelt: ${extra.assignedEmails.join(', ')}`,priority,category});
    if(file)await uploadPropertyDocument({category:'Annet',title:`Avvik ${title} - ${file.name}`,file,status:'Dokumentasjon'});
    Object.assign(row,extra);p.deviations=p.deviations||[];p.deviations.unshift(row);row.display_id=dpFriendlyId(row,'AV',p.deviations);logActivity('Avvik opprettet',row.display_id);
    showDrawer('Avvik opprettet',`<table><tr><td>Saksnummer</td><td>${esc(row.display_id)}</td></tr>${dpTechnicalRow(row.id)}<tr><td>Kategori</td><td>${esc(category)}</td></tr><tr><td>Bygg</td><td>${esc(extra.building||'-')}</td></tr><tr><td>Tildelt</td><td>${esc(extra.assignedEmails.join(', ')||'-')}</td></tr><tr><td>Lagring</td><td>Supabase</td></tr></table><button class="action primary" onclick="showCreateWorkOrder('${esc(row.id)}')">Lag arbeidsordre</button><button class="action" onclick="showEmailFlow('deviation','${esc(row.id)}')">Send e-post</button>`);
  }catch(e){dpShowSupabaseError('Avvik ble ikke lagret',e,'deviations / activity_log')}
};
saveLeaseAgreement=async function(){
  let p=ensureLeaseData(),l=dpLeaseFromForm();
  if(!l.tenant){showDrawer('Mangler leietaker','<div class="output">Skriv inn leietaker.</div>');return}
  try{
    dpRequireLiveWrite('lagre leieforhold');
    l.template=dpLeaseTemplate(l);
    let r=await supabaseClient().from('lease_agreements').insert({property_id:p.id,unit_label:l.unit,tenant_name:l.tenant,tenant_email:l.email,tenant_phone:l.phone,start_date:l.start||null,end_date:l.end||null,monthly_rent:l.rent,deposit:l.deposit,status:l.status,notes:l.notes,template_text:l.template,created_by:user().id}).select().single();
    if(r.error)throw r.error;
    l.id=r.data.id;p.leaseAgreements.unshift(l);logActivity('Leieforhold lagret',l.id);
    showDrawer('Leieforhold lagret',`<table><tr><td>Leietaker</td><td>${esc(l.tenant)}</td></tr><tr><td>Enhet</td><td>${esc(l.unit||'-')}</td></tr><tr><td>Lagring</td><td>Supabase</td></tr></table><button class="action primary" onclick="openPropertyTabV1('Leieforhold')">Åpne leieforhold</button>`);
  }catch(e){dpShowSupabaseError('Leieforhold ble ikke lagret',e,'lease_agreements')}
};
renderPublic();
resumeSupabaseSession();

