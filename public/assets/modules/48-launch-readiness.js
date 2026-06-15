/* Driftspartner OS module: 48-launch-readiness.js
   Launch readiness checklist for customer go-live. */
function dpLaunchBadge(status){
  if(status==='ok')return '<span class="badge ok">Klar</span>';
  if(status==='warn')return '<span class="badge warn">Ma testes</span>';
  return '<span class="badge bad">Mangler</span>';
}
function dpLaunchRows(){
  const p=property(),s=dpLiveDashboardStats(),online=location.protocol!=='file:',liveProperty=isUuid(p?.id);
  const hasFinance=!!(+p.bankBalance||+p.reservedFunds||(p.budgetLines||[]).length);
  return [
    {area:'Publisert side',status:online?'ok':'warn',detail:online?'Kjores fra publisert URL.':'Test fra Netlify-url, ikke file:// lokal visning.',action:'Apne https://fdv.driftspartnernord.no/driftspartner-property-os.html'},
    {area:'Ekte innlogging',status:state.currentUserRecord?'ok':'bad',detail:state.currentUserRecord?'Supabase Auth-bruker er aktiv.':'Logg inn med Supabase Auth.',action:'Logg inn online med riktig bruker.'},
    {area:'Eiendomstilgang',status:liveProperty?'ok':'bad',detail:liveProperty?'Valgt eiendom har Supabase UUID.':'Valgt eiendom er ikke live Supabase-eiendom.',action:'Velg/hent eiendom fra Supabase og property_access.'},
    {area:'Dashboard live-data',status:liveProperty&&p.liveCheckedAt?'ok':'warn',detail:p.liveCheckedAt?`Sist hentet: ${p.liveCheckedAt}`:'Dashboarddata er ikke hentet i denne sesjonen.',action:'Trykk Hent live data pa dashboard.'},
    {area:'Avvik',status:Array.isArray(p.deviations)?'ok':'bad',detail:`${(p.deviations||[]).length} avvik i valgt eiendom.`,action:'Opprett, apne, endre status og slett ett testavvik.'},
    {area:'Arbeidsordre',status:Array.isArray(p.workOrders)?'ok':'bad',detail:`${(p.workOrders||[]).length} arbeidsordre i valgt eiendom.`,action:'Lag arbeidsordre fra avvik med frist og mottakere.'},
    {area:'Dokumentarkiv / FDV',status:Array.isArray(p.documents)?'ok':'bad',detail:`${(p.documents||[]).length} dokumenter lastet/hentet.`,action:'Last opp PDF, apne fil og slett testfil.'},
    {area:'Leverandorer',status:(state.suppliers||[]).some(x=>x.email)?'ok':'warn',detail:`${(state.suppliers||[]).filter(x=>x.email).length} leverandorer med e-post.`,action:'Registrer minst to leverandorer med e-post.'},
    {area:'Tilbud/RFQ',status:Array.isArray(p.quoteRequests)&&Array.isArray(p.offers)?'ok':'warn',detail:`RFQ: ${(p.quoteRequests||[]).length}, tilbud: ${(p.offers||[]).length}.`,action:'Send RFQ, last opp tilbud/PDF og vurder tilbud.'},
    {area:'E-post',status:online?'warn':'bad',detail:online?'Kan testes via Netlify/Resend fra publisert side.':'E-post fungerer ikke realistisk fra file://.',action:'Send test til egen e-post og sjekk innboks/spam.'},
    {area:'Okonomi',status:hasFinance?'ok':'warn',detail:`Konto: ${money(+p.bankBalance||0)}. Budsjettlinjer: ${(p.budgetLines||[]).length}.`,action:'Legg inn konto, reservefond og minst tre budsjettlinjer.'},
    {area:'Roller og tilgang',status:state.currentUserRecord&&liveProperty?'warn':'bad',detail:'Ma testes med superadmin, styreleder, vaktmester og leverandor.',action:'Opprett testbrukere og bekreft at de bare ser riktig eiendom.'},
    {area:'Pilotflyt',status:s.openDevs||s.openWos||s.docs.length||s.rfqs.length?'warn':'bad',detail:'Ma bevises med en komplett sak fra avvik til dokumentarkiv.',action:'Kjor avvik -> WO -> RFQ -> tilbud -> styresak -> kontrakt -> FDV.'}
  ];
}
function launchReadinessPage(){
  const rows=dpLaunchRows(),ok=rows.filter(r=>r.status==='ok').length,warn=rows.filter(r=>r.status==='warn').length,bad=rows.filter(r=>r.status==='bad').length;
  const score=Math.round((ok/rows.length)*100);
  const next=rows.filter(r=>r.status!=='ok').slice(0,5);
  return `<div class="grid"><div class="card s12"><div class="dash-title"><div><h3>Lanseringskontroll</h3><p class="muted">Gront betyr klart. Gult ma testes online. Rodt ma fikses for kundelansering.</p></div><div><button class="action" onclick="hydrateDashboardNow()">Hent live data</button><button class="action primary" onclick="runLaunchReadinessCheck()">Kjor kontroll</button></div></div><div class="ops-budget-summary"><div><small>Klar</small><b>${ok}</b></div><div><small>Ma testes</small><b>${warn}</b></div><div><small>Mangler</small><b>${bad}</b></div><div><small>Lanseringsscore</small><b>${score}%</b></div></div><table><tr><th>Omrade</th><th>Status</th><th>Detalj</th><th>Neste handling</th></tr>${rows.map(r=>`<tr><td>${esc(r.area)}</td><td>${dpLaunchBadge(r.status)}</td><td>${esc(r.detail)}</td><td>${esc(r.action)}</td></tr>`).join('')}</table><div id="launchCheckOut" class="output">Kjor kontroll etter innlogging pa publisert Netlify-side.</div></div><div class="card s6"><h3>Neste fem ting</h3><ol>${next.map(r=>`<li><strong>${esc(r.area)}:</strong> ${esc(r.action)}</li>`).join('')||'<li>Alt i kontrollisten er gront.</li>'}</ol></div><div class="card s6"><h3>Lanseringsregel</h3><div class="output">For pilot kan gule punkter aksepteres hvis de er testet manuelt. For betalende kunder bor ingen rode punkter sta igjen, og tilgang per eiendom ma vaere bekreftet med minst to ulike roller.</div><button class="action" onclick="openMain('admin',null);openTab('Fullsjekk')">Apne fullsjekk</button><button class="action" onclick="openMain('admin',null);openTab('Lagringstest')">Apne lagringstest</button></div></div>`;
}
async function runLaunchReadinessCheck(){
  const out=document.getElementById('launchCheckOut'),lines=[];
  function line(ok,msg){lines.push(`${ok?'OK':'FEIL'} ${msg}`);out.textContent=lines.join('\n')}
  try{
    line(location.protocol!=='file:','Publisert Netlify-side');
    line(!!state.currentUserRecord,'Supabase Auth innlogging');
    line(isUuid(property().id),'Valgt eiendom er Supabase UUID');
    if(state.currentUserRecord&&isUuid(property().id)){
      const db=supabaseClient(),p=property();
      const tables=['properties','property_access','deviations','work_orders','documents','suppliers','quote_requests','offers','activity_log','property_finance','budget_lines'];
      for(const table of tables){
        const r=await db.from(table).select('id').limit(1);
        line(!r.error,`${table}${r.error?': '+r.error.message:''}`);
      }
      const storage=await db.storage.from('documents').list(p.id,{limit:1});
      line(!storage.error,`Storage bucket documents${storage.error?': '+storage.error.message:''}`);
      await hydrateCurrentPropertyData(db);
      line(true,'Live data hentet pa nytt');
    }
    line(location.protocol!=='file:','E-post ma slutt-testes online fra Send e-post');
    line(true,'Lanseringskontroll ferdig. Oppdater fanen for ny score.');
  }catch(e){line(false,'Uventet feil: '+e.message)}
}
app.admin.tabs['Lanseringskontroll']=()=>launchReadinessPage();
