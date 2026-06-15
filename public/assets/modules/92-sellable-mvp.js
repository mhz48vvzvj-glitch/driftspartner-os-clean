/* Driftspartner OS module: 92-sellable-mvp.js
   Sellable MVP checklist and go-to-market readiness plan. */
function dpSellableStatus(item){
  const p=property(),online=location.protocol!=='file:',live=isUuid(p?.id),auth=!!state.currentUserRecord;
  const checks={
    pilot_flow:live&&(p.deviations||[]).length&&(p.workOrders||[]).length&&((p.quoteRequests||[]).length||(p.offers||[]).length),
    access_roles:auth&&live,
    live_modules:live&&p.liveCheckedAt,
    crud_complete:false,
    email_templates:online,
    document_archive:live&&Array.isArray(p.documents),
    economy:(+p.bankBalance||+p.reservedFunds||(p.budgetLines||[]).length),
    ai_honesty:true,
    onboarding:auth&&live,
    legal_commercial:false
  };
  return checks[item]?'ok':'todo';
}
function dpSellableBadge(status){
  return status==='ok'?'<span class="badge ok">Klar/igang</span>':'<span class="badge warn">Ma bygges/testes</span>';
}
function dpSellableItems(){
  return [
    {phase:'Ma være klart før pilot',key:'pilot_flow',title:'Ekte ende-til-ende pilot',detail:'Bevis avvik -> arbeidsordre -> RFQ -> tilbud/PDF -> vurdering -> styresak -> kontrakt -> FDV -> rapport online.',open:"openMain('operations',null);openTab('Sakslop')"},
    {phase:'Ma være klart før pilot',key:'access_roles',title:'Tilgang og roller',detail:'Test superadmin, styreleder, styremedlem, vaktmester, leverandør og eventuelt beboer med egne brukere.',open:"openMain('admin',null);openTab('Tilganger')"},
    {phase:'Ma være klart før pilot',key:'live_modules',title:'Alle moduler live',detail:'Bekreft les/skriv mot Supabase for eiendom, bygg, FDV, dokumenter, avvik, arbeidsordre, leverandører, tilbud, økonomi, styre og aktivitet.',open:"openMain('admin',null);openTab('Lanseringskontroll')"},
    {phase:'Ma være klart før betalende kunde',key:'crud_complete',title:'Slett/rediger komplett',detail:'Slett og rediger må fungere for avvik, arbeidsordre, dokumenter, RFQ, tilbud, leverandører, styremedlemmer, prosjekter og økonomilinjer.',open:"openMain('admin',null);openTab('Fullsjekk')"},
    {phase:'Ma være klart før betalende kunde',key:'email_templates',title:'E-postmaler',detail:'Lag tydelige maler for avvik, arbeidsordre, RFQ, styresak og kontrakt med flere mottakere og logg.',open:"showEmailFlow('general','MALTEST')"},
    {phase:'Ma være klart før betalende kunde',key:'document_archive',title:'Solid dokumentarkiv',detail:'PDF/bilder, åpne fil, slette fil, kategori/mappe, bygg, versjon, utløpsdato og opplastet av.',open:"openMain('property',null);openTab('FDV/HMS')"},
    {phase:'Ma være klart før betalende kunde',key:'economy',title:'Troverdig økonomi',detail:'Bank/konto, reservefond, budsjettlinjer, faktisk kostnad, avvik, prosjektøkonomi og styrerapport.',open:"openMain('finance',null);openTab('DB/kundeøkonomi')"},
    {phase:'Kan komme i V2',key:'ai_honesty',title:'AI merkes ærlig',detail:'AI Director er V1/regler til backend faktisk leser dokumenter, bilder, økonomi og historikk.',open:"openMain('ai',null)"},
    {phase:'Ma være klart før pilot',key:'onboarding',title:'Onboardingrutine',detail:'Opprett kunde, eiendom, styre, leverandører, FDV, økonomi og inviter brukere.',open:"openMain('admin',null);openTab('Brukere')"},
    {phase:'Ma være klart før salg',key:'legal_commercial',title:'Juridisk og kommersielt',detail:'Personvern/GDPR, databehandleravtale, vilkår, supportmodell, backup/eksport og tydelige priser/pakker.',open:"openMain('admin',null);openTab('Abonnement')"}
  ];
}
function sellableMvpPage(){
  const items=dpSellableItems(),done=items.filter(i=>dpSellableStatus(i.key)==='ok').length,score=Math.round(done/items.length*100);
  const phases=[...new Set(items.map(i=>i.phase))];
  return `<div class="grid"><div class="card s12"><div class="dash-title"><div><h3>Salgsbar MVP</h3><p class="muted">Arbeidslisten for å gjøre Driftspartner OS klart for pilot, betalende kunder og senere V2.</p></div><div><button class="action" onclick="hydrateDashboardNow()">Hent live data</button><button class="action primary" onclick="openMain('admin',null);openTab('Lanseringskontroll')">Lanseringskontroll</button></div></div><div class="ops-budget-summary"><div><small>Ferdig/igang</small><b>${done}</b></div><div><small>Totalt</small><b>${items.length}</b></div><div><small>Salgsbar-score</small><b>${score}%</b></div></div></div>${phases.map(phase=>`<div class="card s12"><h3>${esc(phase)}</h3><table><tr><th>Område</th><th>Status</th><th>Hva må være sant</th><th>Handling</th></tr>${items.filter(i=>i.phase===phase).map(i=>`<tr><td><strong>${esc(i.title)}</strong></td><td>${dpSellableBadge(dpSellableStatus(i.key))}</td><td>${esc(i.detail)}</td><td><button class="action" onclick="${i.open}">Åpne</button></td></tr>`).join('')}</table></div>`).join('')}<div class="card s6"><h3>Anbefalt byggerekkefølge</h3><ol><li>Bevis pilotflyten online med én eiendom.</li><li>Stresstest roller og property_access.</li><li>Ferdigstill slett/rediger i alle kjerneobjekter.</li><li>Gjør dokumentarkiv og økonomi kundetrygt.</li><li>Legg inn juridisk/support/onboarding før salg.</li></ol></div><div class="card s6"><h3>Ikke overselg</h3><div class="output">Selg V1 som operativ FDV-/driftsplattform med regelbasert AI Director. Vent med å selge full AI-agent til backend faktisk analyserer dokumenter, bilder, økonomi og historikk.</div></div></div>`;
}
app.admin.tabs['Salgsbar MVP']=()=>sellableMvpPage();
