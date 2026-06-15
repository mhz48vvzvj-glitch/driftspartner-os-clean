/* Driftspartner OS module: 43-build-order-page.js
   Build order roadmap, detail drawer and schema/status check.
   Source: 43-build-order-live-dashboard-checks.js:1-52
*/
/* Driftspartner OS module: 43-build-order-live-dashboard-checks.js
   Build order, live dashboard, extended hydration, email and full system check.
   Source: 40-property-fdv.js:96-323
*/
function dpBuildOrderItems(){
  return [
    {id:'db',title:'Database og tilgangsregler',status:'Klar for hardening',tables:['app_users','property_access','customers','properties'],actions:['Kjor produksjonssjekk','Bekreft RLS per eiendom','Fjern ?pen test-policyer for kundevisning'],open:"openMain('admin',null);openTab('Produksjonssjekk')"},
    {id:'customer',title:'Kunde/eiendom + brukeradministrasjon',status:'Operativ V1',tables:['customers','properties','property_contacts','app_users','property_access'],actions:['Opprett kunde','Opprett eiendom','Gi bruker tilgang til eiendom'],open:"openMain('admin',null);openTab('Tilganger')"},
    {id:'documents',title:'Dokumentopplasting per eiendom',status:'Operativ V1',tables:['documents','document_folders','document_versions'],actions:['Last opp FDV/HMS/tegning','Koble dokument til bygg','Sett versjon og utlop'],open:"openPropertyTabV1('FDV/HMS')"},
    {id:'cases',title:'Avvik og arbeidsordre',status:'Operativ V1',tables:['deviations','work_orders','activity_log'],actions:['Opprett avvik','Lag arbeidsordre fra avvik','Send til flere mottakere'],open:"openMain('operations',null);openTab('Avvik')"},
    {id:'suppliers',title:'Leverandorer og tilbudsforesporsel',status:'Operativ V1',tables:['suppliers','quote_requests','quote_request_suppliers'],actions:['Registrer leverandor med e-post','Lag tilbudsforesporsel','Send e-post med vedlegg'],open:"openMain('market',null);openTab('Procurement')"},
    {id:'offers',title:'Tilbudsopplasting og vurdering',status:'Operativ V1',tables:['offers','offer_files','offer_scores','contracts'],actions:['Last opp tilbud/PDF','Registrer pris og forbehold','AI-vurder og lag kontrakt'],open:"showUploadOffer()"},
    {id:'log',title:'Aktivitetslogg og rapportering',status:'Operativ V1',tables:['activity_log','notifications','financial_reports'],actions:['Logg alle hendelser','Vis varslingssenter','Lag styrerapport'],open:"openMain('home',null);openTab('Aktivitet')"}
  ];
}
function dpBuildOrderProgress(){
  let p=dpV1Ensure(),checks=[
    !!(isRealSession&&isRealSession()),
    !!(p.id&&isUuid(p.id)),
    (p.documents||[]).length>0,
    (p.deviations||[]).length>0||(p.workOrders||[]).length>0,
    (state.suppliers||[]).some(s=>s.email),
    (p.offers||[]).length>0||(p.quoteRequests||[]).length>0,
    (p.activity||[]).length>0
  ];
  return {done:checks.filter(Boolean).length,total:checks.length,checks};
}
function buildOrderPage(){
  let p=dpV1Ensure(),prog=dpBuildOrderProgress(),items=dpBuildOrderItems();
  return `<div class="grid"><div class="card s12"><div class="dash-title"><div><h3>Forste byggerekkefolge</h3><p class="muted">Dette er produksjonslopet vi bygger etter for ${esc(p.name)}. Start overst og kontroller hvert steg mot Supabase online.</p></div><span class="badge ${prog.done===prog.total?'ok':'warn'}">${prog.done}/${prog.total} klare signaler</span></div><div class="ops-budget-summary"><div><small>Valgt eiendom</small><b>${esc(p.name)}</b></div><div><small>Eiendomstype</small><b>${isUuid(p.id)?'Supabase UUID':'Lokal ID'}</b></div><div><small>Innlogging</small><b>${isRealSession&&isRealSession()?'Ekte innlogg':'Lokal'}</b></div></div></div>${items.map((x,i)=>`<div class="card s6"><div class="dash-title"><h3>${i+1}. ${esc(x.title)}</h3><span class="badge ${prog.checks[i]?'ok':'warn'}">${prog.checks[i]?'Kontrollsignal OK':esc(x.status)}</span></div><p class="muted">${esc(x.actions.join(' · '))}</p><table><tr><th>Datagrunnlag</th></tr>${x.tables.map(t=>`<tr><td>${esc(t)}</td></tr>`).join('')}</table><button class="action primary" onclick="${x.open}">Apne modul</button><button class="action" onclick="showBuildOrderDetail('${x.id}')">Sjekkliste</button></div>`).join('')}<div class="card s12"><h3>Online kontroll</h3><p class="muted">Kjor denne etter publisering: logg inn ekte, velg Supabase-eiendom og kontroller hvert steg. Hvis noe feiler skal feilen vises i skjermen, ikke lagres stille som ikke-verifiserte data.</p><button class="action primary" onclick="runBuildOrderCheck()">Kjor byggesjekk</button><div id="buildOrderOut" class="output">Klar for sjekk.</div></div></div>`;
}
function showBuildOrderDetail(id){
  let item=dpBuildOrderItems().find(x=>x.id===id);
  if(!item)return;
  showDrawer(item.title,`<h3>Hva skal fungere</h3><ul>${item.actions.map(a=>`<li>${esc(a)}</li>`).join('')}</ul><h3>Tabeller</h3><table>${item.tables.map(t=>`<tr><td>${esc(t)}</td></tr>`).join('')}</table><div class="output">Neste steg: test modulen online med ekte innlogging og valgt Supabase-eiendom.</div><button class="action primary" onclick="${item.open}">Apne modul</button>`);
}
async function runBuildOrderCheck(){
  let out=document.getElementById('buildOrderOut'),p=property();
  function line(ok,msg){out.textContent+=(out.textContent?'\n':'')+(ok?'OK ':'FEIL ')+msg}
  if(out)out.textContent='';
  if(!isRealSession||!isRealSession()){line(false,'Du er ikke i ekte innlogging. Logg inn online for full test.');return}
  if(!isUuid(p.id)){line(false,'Valgt eiendom har test-ID. Velg eiendom hentet fra Supabase.');return}
  try{
    let db=supabaseClient();
    for(let t of ['customers','properties','app_users','property_access','documents','deviations','work_orders','suppliers','quote_requests','offers','activity_log']){
      let r=await db.from(t).select('id').limit(1);
      line(!r.error,`${t}${r.error?': '+r.error.message:''}`);
    }
  }catch(e){line(false,e.message)}
}
app.home.tabs['Byggerekkefolge']=()=>buildOrderPage();
app.admin.tabs['Byggerekkefolge']=()=>buildOrderPage();
