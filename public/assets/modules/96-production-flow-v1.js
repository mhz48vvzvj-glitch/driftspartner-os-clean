/* Driftspartner OS module: 96-production-flow-v1.js
   Production flow V1: one live-only case journey. No local fallback, no pretend saves. */
function dpProductionFlowProperty(){
  return typeof dpV1Ensure==='function'?dpV1Ensure(property()):ensurePropertyData(property());
}
function dpProductionFlowOnline(){
  const p=property();
  return !!(state.isLoggedIn&&state.currentUserRecord&&typeof isUuid==='function'&&isUuid(p?.id));
}
function dpProductionFlowCollections(){
  const p=dpProductionFlowProperty();
  const list=name=>Array.isArray(p[name])?p[name]:[];
  const docs=list('documents');
  const reports=list('financialReports');
  return {
    p,
    online:dpProductionFlowOnline(),
    deviations:list('deviations'),
    workOrders:list('workOrders'),
    quoteRequests:list('quoteRequests'),
    offers:list('offers'),
    boardCases:list('boardCases'),
    contracts:list('contracts'),
    documents:docs,
    reports,
    fdvDocs:docs.filter(d=>String(d.category||d.type||d.folder||'').toLowerCase().includes('fdv')),
    contractDocs:docs.filter(d=>String(d.category||d.type||d.folder||'').toLowerCase().includes('kontrakt'))
  };
}
function dpLatestLiveItem(list){
  return (list||[]).slice().sort((a,b)=>String(b.created_at||b.createdAt||b.date||b.id||'').localeCompare(String(a.created_at||a.createdAt||a.date||a.id||'')))[0]||null;
}
function dpProductionFlowLatest(d){
  return {
    deviation:dpLatestLiveItem(d.deviations),
    workOrder:dpLatestLiveItem(d.workOrders),
    rfq:dpLatestLiveItem(d.quoteRequests),
    offer:dpLatestLiveItem(d.offers),
    boardCase:dpLatestLiveItem(d.boardCases),
    contract:dpLatestLiveItem(d.contracts)||dpLatestLiveItem(d.contractDocs),
    fdv:dpLatestLiveItem(d.fdvDocs)||dpLatestLiveItem(d.reports)
  };
}
function dpProductionStatusBadge(ready,blocked){
  if(ready)return '<span class="badge ok">Klar</span>';
  if(blocked)return '<span class="badge bad">Mangler</span>';
  return '<span class="badge warn">Neste steg</span>';
}
function dpProductionLabel(item,prefix,list,fallback){
  if(!item)return fallback||'Ikke opprettet';
  if(typeof dpFriendlyId==='function')return dpFriendlyId(item,prefix,list);
  return item.display_id||item.reference_no||item.title||item.name||item.id||fallback||'-';
}
function dpProductionFlowRows(){
  const d=dpProductionFlowCollections(),x=dpProductionFlowLatest(d);
  const devId=x.deviation?(typeof dpDbId==='function'?dpDbId(x.deviation):x.deviation.id):'';
  const woId=x.workOrder?(typeof dpDbId==='function'?dpDbId(x.workOrder):x.workOrder.id):(devId||'');
  const offerId=x.offer?(typeof dpDbId==='function'?dpDbId(x.offer):x.offer.id):'';
  return [
    {key:'deviation',title:'1. Avvik',ready:!!x.deviation,blocked:false,value:dpProductionLabel(x.deviation,'AV',d.deviations,'Ingen avvik'),detail:x.deviation?.title||'Start med et avvik pa valgt eiendom.',action:'Opprett avvik',open:'showCreateDeviation()'},
    {key:'workorder',title:'2. Arbeidsordre',ready:!!x.workOrder,blocked:!x.deviation,value:dpProductionLabel(x.workOrder,'WO',d.workOrders,'Ingen arbeidsordre'),detail:x.workOrder?.title||'Lag arbeidsordre fra avviket.',action:'Lag arbeidsordre',open:`showCreateWorkOrder('${esc(devId)}')`},
    {key:'rfq',title:'3. Tilbudsforesporsel',ready:!!x.rfq,blocked:!x.workOrder,value:dpProductionLabel(x.rfq,'RFQ',d.quoteRequests,'Ingen foresporsel'),detail:x.rfq?.title||'Velg leverandorer, frist og vedlegg.',action:'Lag RFQ',open:`showQuoteRequest('${esc(woId)}')`},
    {key:'offer',title:'4. Tilbud/PDF',ready:!!x.offer,blocked:!x.rfq,value:x.offer?.supplier||x.offer?.supplier_name||'Ingen tilbud',detail:x.offer?money(+x.offer.price||0):'Last opp pris, PDF, forbehold og frist.',action:'Last opp tilbud',open:'showUploadOffer()'},
    {key:'evaluation',title:'5. Vurdering',ready:!!(x.offer&&(x.offer.score||x.offer.recommendation||x.offer.ai_summary)),blocked:!x.offer,value:x.offer?.score?`${x.offer.score}/100`:'Ikke vurdert',detail:x.offer?.recommendation||'Sammenlign pris, risiko og forbehold.',action:'Vurder tilbud',open:offerId?`analyzeOffer('${esc(offerId)}')`:'showQuoteEvaluation()'},
    {key:'board',title:'6. Styresak',ready:!!x.boardCase,blocked:!x.offer,value:dpProductionLabel(x.boardCase,'ST',d.boardCases,'Ingen styresak'),detail:x.boardCase?.title||'Lag beslutningssak for styret.',action:'Lag styresak',open:"showCreateBoardCaseLive('Styresak')"},
    {key:'contract',title:'7. Kontrakt',ready:!!x.contract,blocked:!x.boardCase,value:dpProductionLabel(x.contract,'KON',d.contracts,'Ingen kontrakt'),detail:x.contract?.title||x.contract?.name||'Last opp signert kontrakt i dokumentarkivet.',action:'Kontrakt',open:'showContract()'},
    {key:'fdv',title:'8. FDV/rapport',ready:!!x.fdv,blocked:!x.contract,value:x.fdv?.title||x.fdv?.name||'Ingen FDV/rapport',detail:'Sluttfor saken med FDV, dokumentasjon og rapport.',action:'Last opp',open:"showUploadFDV('FDV')"}
  ];
}
function dpProductionFlowNextKey(rows){
  return (rows||[]).find(r=>!r.ready&&!r.blocked)||(rows||[]).find(r=>!r.ready)||null;
}
function dpProductionFlowRequire(action){
  if(dpProductionFlowOnline())return true;
  showDrawer('Krever live innlogging',`<div class="output">For ${esc(action)} ma du vaere innlogget pa publisert side og ha valgt en eiendom fra Supabase. Produksjonsflyten viser ikke lokale testdata og lagrer ikke lokalt.</div><button class="action primary" onclick="showLogin()">Logg inn</button><button class="action" onclick="hydrateDashboardNow()">Hent live data</button>`);
  return false;
}
function openProductionFlowStep(key){
  const rows=dpProductionFlowRows();
  const row=rows.find(r=>r.key===key);
  if(!row)return;
  if(!dpProductionFlowRequire(row.action))return;
  if(row.blocked){
    showDrawer('Forrige steg mangler',`<div class="output">${esc(row.title)} kan ikke fullfores for forrige steg er pa plass. Produksjonsflyten stopper her i stedet for a late som saken er lagret.</div><button class="action primary" onclick="openProductionFlowNext()">Apne neste mulige steg</button>`);
    return;
  }
  try{new Function(row.open)()}catch(e){dpShowSupabaseError?dpShowSupabaseError('Handlingen kunne ikke apnes',e,''):showDrawer('Feil',`<div class="output">${esc(e.message)}</div>`)}
}
function openProductionFlowNext(){
  const rows=dpProductionFlowRows(),next=dpProductionFlowNextKey(rows);
  if(!next){showDrawer('Produksjonsflyt komplett',`<div class="output">Alle hovedsteg har live data for valgt eiendom. Kjor fullsjekk og rapport for endelig kontroll.</div><button class="action primary" onclick="openMain('admin',null);openTab('Fullsjekk')">Fullsjekk</button>`);return}
  openProductionFlowStep(next.key);
}
function runProductionFlowCheck(){
  const d=dpProductionFlowCollections(),rows=dpProductionFlowRows();
  const out=document.getElementById('productionFlowOut');
  const lines=[];
  lines.push((d.online?'OK':'STOPP')+' Live innlogging og valgt eiendom');
  rows.forEach(r=>lines.push(`${r.ready?'OK':r.blocked?'STOPP':'NESTE'} ${r.title}: ${r.value}`));
  lines.push('Regel: denne siden skriver ikke lokal data og godkjenner ikke lagring hvis Supabase feiler.');
  if(out)out.textContent=lines.join('\n');
}
function productionFlowV1Page(){
  const d=dpProductionFlowCollections(),rows=dpProductionFlowRows(),next=dpProductionFlowNextKey(rows);
  if(!d.online){
    return `<div class="grid"><div class="card s12"><div class="dash-title"><div><h3>Produksjonsflyt V1</h3><p class="muted">Logg inn og velg live eiendom for a starte sakslopet.</p></div><div><button class="action primary" onclick="showLogin()">Logg inn</button><button class="action" onclick="hydrateDashboardNow()">Hent live data</button></div></div><div class="output">Ingen lokale tall eller testdata vises her. Siden starter forst nar live eiendom er valgt.</div></div></div>`;
  }
  return `<div class="grid"><div class="card s12"><div class="dash-title"><div><h3>Produksjonsflyt V1</h3><p class="muted">${esc(d.p.name)} · live sakslop fra avvik til FDV og rapport</p></div><div><button class="action" onclick="hydrateDashboardNow()">Hent live data</button><button class="action" onclick="runProductionFlowCheck()">Kontroller flyt</button><button class="action primary" onclick="openProductionFlowNext()">${next?'Neste steg: '+esc(next.action):'Flyt komplett'}</button></div></div><div class="ops-budget-summary"><div><small>Avvik</small><b>${d.deviations.length}</b></div><div><small>Arbeidsordre</small><b>${d.workOrders.length}</b></div><div><small>RFQ</small><b>${d.quoteRequests.length}</b></div><div><small>Tilbud</small><b>${d.offers.length}</b></div><div><small>Dokumenter</small><b>${d.documents.length}</b></div></div><table><tr><th>Steg</th><th>Status</th><th>Sak</th><th>Detalj</th><th>Handling</th></tr>${rows.map(r=>`<tr><td><strong>${esc(r.title)}</strong></td><td>${dpProductionStatusBadge(r.ready,r.blocked)}</td><td>${esc(r.value)}</td><td>${esc(r.detail)}</td><td><button class="action ${r.blocked?'gray':'primary'}" onclick="openProductionFlowStep('${esc(r.key)}')">${esc(r.action)}</button></td></tr>`).join('')}</table><div id="productionFlowOut" class="output">Trykk Kontroller flyt for a se hva som er klart og hva som stopper.</div></div><div class="card s6"><h3>Stoppregel</h3><div class="output">Hvis innlogging, tilgang, filopplasting eller database feiler, skal brukeren fa feilmelding. Det opprettes ikke lokale kopier og systemet later ikke som handlingen er lagret.</div></div><div class="card s6"><h3>Bruk i pilot</h3><ol><li>Start med ett ekte avvik.</li><li>Fortsett ett steg av gangen.</li><li>Kontroller e-post, dokumenter og aktivitetslogg etter hvert steg.</li><li>Ikke ga til kundesalg for denne flyten er bevist online.</li></ol></div></div>`;
}
app.operations.tabs['Produksjonsflyt V1']=()=>productionFlowV1Page();
app.operations.tabs['Sakslop']=()=>productionFlowV1Page();
app.operations.tabs['Saksløp']=()=>productionFlowV1Page();
app.admin.tabs['Produksjonsflyt V1']=()=>productionFlowV1Page();
