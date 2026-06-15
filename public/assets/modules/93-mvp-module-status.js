/* Driftspartner OS module: 93-mvp-module-status.js
   Operational MVP module status for core product tables and workflows. */
function dpMvpModules(){
  return [
    {name:'Kunder/eiendommer',area:'Kjerne',tables:['Kunder','Eiendommer','property_contacts'],goal:'Opprette kunde, eiendom, kontaktpersoner, styre og SLA.',open:"openMain('property',null)",ready:()=>isUuid(property()?.id)},
    {name:'Brukere/roller/tilgang',area:'Kjerne',tables:['app_Brukere','Tilganger'],goal:'Ekte innlogging og tilgang per eiendom og rolle.',open:"openMain('admin',null);openTab('Tilganger')",ready:()=>!!state.currentUserRecord&&isUuid(property()?.id)},
    {name:'Avvik',area:'Drift',tables:['Avvik'],goal:'Registrere avvik, prioritet, status, bilder og ansvarlig.',open:"openMain('operations',null);openTab('Avvik')",ready:()=>Array.isArray(property().Avvik)},
    {name:'Arbeidsordre',area:'Drift',tables:['Arbeidsordre'],goal:'Tildele oppgaver til vaktmester, leverandør eller styreleder.',open:"openMain('operations',null);openTab('Arbeidsordre')",ready:()=>Array.isArray(property().workOrders)},
    {name:'Dokumentarkiv',area:'Dokument',tables:['Dokumentarkiv','document_versions'],goal:'Laste opp FDV, HMS, bilder, kontrakter og tilbud per eiendom.',open:"openMain('property',null);openTab('FDV/HMS')",ready:()=>Array.isArray(property().Dokumentarkiv)},
    {name:'Leverandører',area:'Marked',tables:['Leverandorer','supplier_contacts'],goal:'Registrere leverandører med e-post, fag, score og portaltilgang.',open:"openMain('market',null);openTab('Leverandorer')",ready:()=>Array.isArray(state.Leverandorer)},
    {name:'Tilbudsforespørsel',area:'Innkjøp',tables:['Tilbudsforesporsler','quote_request_Leverandorer'],goal:'Sende RFQ med PDF, bilder, frist og krav til valgte leverandører.',open:"openMain('market',null);openTab('Procurement')",ready:()=>Array.isArray(property().quoteRequests)},
    {name:'Tilbudsopplasting',area:'Innkjøp',tables:['Tilbud','offer_files'],goal:'Leverandør laster opp pris, PDF, forbehold og kommentarer.',open:"showUploadOffer()",ready:()=>Array.isArray(property().Tilbud)},
    {name:'Aktivitetslogg',area:'Audit',tables:['Aktivitetslogg'],goal:'Logge hvem gjorde hva, når, på hvilken eiendom og hvilken sak.',open:"openMain('property',null);openTab('Aktivitet')",ready:()=>Array.isArray(property().activity)}
  ];
}
function dpMvpStatusBadge(mod){
  return mod.ready()?'<span class="badge ok">Koblet</span>':'<span class="badge warn">Må testes</span>';
}
function mvpPlanPage(){
  const modules=dpMvpModules(),ready=modules.filter(m=>m.ready()).length,score=Math.round(ready/modules.length*100);
  return `<div class="grid"><div class="card s12"><div class="dash-title"><div><h3>MVP-moduler</h3><p class="muted">Dette er kjernen som må være live før Driftspartner OS kan brukes operativt med kunder.</p></div><div><button class="action" onclick="hydrateDashboardNow()">Hent live data</button><button class="action primary" onclick="runMvpTableCheck()">Sjekk tabeller</button></div></div><div class="ops-budget-summary"><div><small>Koblet/lastet</small><b>${ready}</b></div><div><small>Totalt</small><b>${modules.length}</b></div><div><small>MVP-score</small><b>${score}%</b></div></div><table><tr><th>Modul</th><th>Område</th><th>Systemdel</th><th>Status</th><th>Hva må fungere</th><th>Handling</th></tr>${modules.map(m=>`<tr><td><strong>${esc(m.name)}</strong></td><td>${esc(m.area)}</td><td>${esc(m.tables.join(', '))}</td><td>${dpMvpStatusBadge(m)}</td><td>${esc(m.goal)}</td><td><button class="action" onclick="${m.open}">Åpne</button></td></tr>`).join('')}</table><div id="mvpTableCheckOut" class="output">Trykk Sjekk tabeller online etter innlogging.</div></div><div class="card s6"><h3>Første testrekkefølge</h3><ol><li>Opprett/velg live eiendom.</li><li>Opprett avvik.</li><li>Lag arbeidsordre fra avvik.</li><li>Lag RFQ til leverandør.</li><li>Last opp tilbud/PDF.</li><li>Lag styresak og kontrakt.</li><li>Kontroller aktivitetslogg og dokumentarkiv.</li></ol></div><div class="card s6"><h3>Regel</h3><div class="output">Alle tabellene må enten gi OK i Supabase-sjekk eller ha en tydelig feilmelding. Ingen modul skal late som den lagrer hvis Supabase feiler.</div></div></div>`;
}
async function runMvpTableCheck(){
  const out=document.getElementById('mvpTableCheckOut'),lines=[];
  function line(ok,msg){lines.push(`${ok?'OK':'FEIL'} ${msg}`);out.textContent=lines.join('\n')}
  try{
    if(!state.currentUserRecord){line(false,'Logg inn med Supabase først.');return}
    const db=supabaseClient(),seen=[...new Set(dpMvpModules().flatMap(m=>m.tables))];
    for(const table of seen){
      const r=await db.from(table).select('id').limit(1);
      line(!r.error,`${table}${r.error?': '+r.error.message:''}`);
    }
    line(true,'MVP-tabellsjekk ferdig.');
  }catch(e){line(false,'Uventet feil: '+e.message)}
}
app.admin.tabs['MVP-plan']=()=>mvpPlanPage();
app.admin.tabs['MVP-moduler']=()=>mvpPlanPage();
