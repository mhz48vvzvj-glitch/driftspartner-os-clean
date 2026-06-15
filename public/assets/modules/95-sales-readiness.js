/* Driftspartner OS module: 95-sales-readiness.js
   Sales readiness cockpit for role/access, customer UX, documents/email, economy, onboarding and legal pack. */
function dpReadinessOk(value){return value?'ok':'warn'}
function dpReadinessBadge(status){
  if(status==='ok')return '<span class="badge ok">Klar</span>';
  if(status==='bad')return '<span class="badge bad">Mangler</span>';
  return '<span class="badge warn">Ma kontrolleres</span>';
}
function dpRoleReadiness(){
  const roles=['superadmin','styreleder','styremedlem','beboer','vaktmester','leverandor'];
  const users=state.users||[],p=property();
  return roles.map(role=>{
    const found=users.some(u=>normalizeRole(u.role)===role||String(u.role||'').toLowerCase()===role);
    const scoped=users.some(u=>(normalizeRole(u.role)===role||String(u.role||'').toLowerCase()===role)&&((u.properties||[]).includes(p.id)||role==='superadmin'));
    return {role,found,scoped,status:found&&scoped?'ok':'warn'};
  });
}
function dpSalesReadinessRows(){
  const p=property(),online=location.protocol!=='file:',live=isUuid(p?.id),auth=!!state.currentUserRecord;
  const roles=dpRoleReadiness(),roleOk=roles.filter(r=>r.status==='ok').length===roles.length;
  const docs=Array.isArray(p.documents)?p.documents:[];
  const hasEmail=online;
  const hasEconomy=!!(+p.bankBalance||+p.reservedFunds||(p.budgetLines||[]).length||(p.projects||[]).some(x=>+x.budget||+x.actual));
  const onboarding=auth&&live&&(p.boardMembers||[]).length&&(state.suppliers||[]).some(s=>s.email);
  return [
    {id:'roles',area:'Rolle- og tilgangstest',status:auth&&live&&roleOk?'ok':'warn',detail:`${roles.filter(r=>r.status==='ok').length}/${roles.length} roller funnet/koblet til valgt eiendom.`,action:'Opprett faktiske brukere og bekreft menyene per rolle.',open:"openMain('admin',null);openTab('Roller og tilgang')"},
    {id:'ux',area:'Kundeopplevelse',status:live?'warn':'bad',detail:'Alle hovedmenyer ma apnes, knapper ma virke og feil ma vaere forstaelige.',action:'Kjor manuell knappesjekk fra denne siden.',open:"openMain('admin',null);openTab('Kundeopplevelse')"},
    {id:'docs_mail',area:'Dokumentarkiv og e-post',status:docs.length&&hasEmail?'warn':'bad',detail:`Dokumenter: ${docs.length}. E-post kontrolleres online via Netlify/Resend.`,action:'Last opp, apne, slett, send e-post og sjekk aktivitetslogg.',open:"openMain('admin',null);openTab('Dokument og e-post')"},
    {id:'economy',area:'Okonomi',status:hasEconomy?'ok':'warn',detail:`Konto ${money(+p.bankBalance||0)}, reservefond ${money(+p.reservedFunds||0)}, budsjettlinjer ${(p.budgetLines||[]).length}.`,action:'Legg inn konto, reservefond, budsjettlinjer, prosjekter og styrerapport.',open:"openMain('admin',null);openTab('Okonomi klar')"},
    {id:'onboarding',area:'Onboarding',status:onboarding?'ok':'warn',detail:'Kunde, eiendom, styre, beboere, leverandorer, FDV, okonomi og forste avvik skal kunne settes opp i fast rekkefolge.',action:'Kjor onboardinglisten for en pilotkunde.',open:"openMain('admin',null);openTab('Onboarding')"},
    {id:'legal',area:'Salgs-/juridisk pakke',status:'warn',detail:'Personvern, databehandleravtale, vilkar, supportmodell, backup/eksport og priser ma ferdigstilles.',action:'Fyll ut dokumentene og publiser dem pa forsiden/kontraktsflyt.',open:"openMain('admin',null);openTab('Juridisk og salg')"}
  ];
}
function salesReadinessPage(){
  const rows=dpSalesReadinessRows(),ok=rows.filter(r=>r.status==='ok').length,warn=rows.filter(r=>r.status==='warn').length,bad=rows.filter(r=>r.status==='bad').length,score=Math.round(ok/rows.length*100);
  return `<div class="grid"><div class="card s12"><div class="dash-title"><div><h3>Salgsberedskap</h3><p class="muted">Dette er arbeidslisten for a komme fra intern pilot til trygg kundedemonstrasjon og salg.</p></div><div><button class="action" onclick="hydrateDashboardNow()">Hent live data</button><button class="action primary" onclick="runSalesReadinessCheck()">Kjor salgscheck</button></div></div><div class="ops-budget-summary"><div><small>Klar</small><b>${ok}</b></div><div><small>Ma kontrolleres</small><b>${warn}</b></div><div><small>Mangler</small><b>${bad}</b></div><div><small>Score</small><b>${score}%</b></div></div><table><tr><th>Omrade</th><th>Status</th><th>Detalj</th><th>Neste handling</th><th>Apne</th></tr>${rows.map(r=>`<tr><td><strong>${esc(r.area)}</strong></td><td>${dpReadinessBadge(r.status)}</td><td>${esc(r.detail)}</td><td>${esc(r.action)}</td><td><button class="action" onclick="${r.open}">Apne</button></td></tr>`).join('')}</table><div id="salesReadinessOut" class="output">Kjor salgscheck etter innlogging pa publisert side.</div></div><div class="card s6"><h3>Forste salgbare milepael</h3><ol><li>En komplett sak flyter fra avvik til FDV og rapport.</li><li>Minst seks roller er testet med ekte brukere.</li><li>Dokumenter og e-post er kontrollert online.</li><li>Okonomi viser ekte konto, reservefond og budsjett.</li><li>Onboarding kan gjennomfores pa under 30 minutter.</li></ol></div><div class="card s6"><h3>Salgsregel</h3><div class="output">For forste kundedemonstrasjon kan gule punkter aksepteres hvis du kjenner begrensningen. For betalende kunde bor ingen rode punkter sta igjen.</div></div></div>`;
}
function RoleAccessReadinessPage(){
  const roles=dpRoleReadiness();
  return `<div class="grid"><div class="card s12"><div class="dash-title"><div><h3>Rolle- og tilgangstest</h3><p class="muted">Bekreft at hver rolle bare ser riktig eiendom og riktige menyer.</p></div><button class="action primary" onclick="openMain('admin',null);openTab('Brukere')">Opprett bruker</button></div><table><tr><th>Rolle</th><th>Status</th><th>Skal se</th><th>Skal ikke se</th></tr>${roles.map(r=>`<tr><td><strong>${esc(dpRoleLabel(r.role))}</strong></td><td>${dpReadinessBadge(r.status)}</td><td>${esc(dpRoleAllowedText(r.role))}</td><td>${esc(dpRoleBlockedText(r.role))}</td></tr>`).join('')}</table></div><div class="card s12"><h3>Kontroll</h3><ol><li>Logg inn som hver rolle pa publisert URL.</li><li>Sjekk at eiendomsvelgeren bare viser riktig eiendom.</li><li>Sjekk at venstremenyen bare viser riktige moduler.</li><li>Forsok a apne direkte meny som rollen ikke skal ha. Systemet skal stoppe tilgang.</li><li>Opprett en handling rollen faktisk skal kunne gjore.</li></ol></div></div>`;
}
function dpRoleLabel(role){
  return ({superadmin:'Superadmin',styreleder:'Styreleder',styremedlem:'Styremedlem',beboer:'Beboer',vaktmester:'Vaktmester',leverandor:'Leverandor'})[role]||role;
}
function dpRoleAllowedText(role){
  return ({
    superadmin:'Alle eiendommer, admin, brukere, okonomi, styre, drift og marked.',
    styreleder:'Dashboard, eiendom, styre, okonomi, dokumenter og saker for egen eiendom.',
    styremedlem:'Dashboard, eiendom, styre og dokumenter for egen eiendom.',
    beboer:'Kun melde avvik.',
    vaktmester:'Avvik, arbeidsordre, FDV og egne oppgaver.',
    leverandor:'Egne tilbud, oppdrag og opplasting av dokumentasjon.'
  })[role]||'Avklares';
}
function dpRoleBlockedText(role){
  return ({
    superadmin:'Ingen blokkering utover sikkerhet.',
    styreleder:'Andre kunders eiendommer.',
    styremedlem:'Andre kunders eiendommer, admin og leverandoradministrasjon.',
    beboer:'Okonomi, styre, leverandorer, dokumentarkiv og andre beboeres saker.',
    vaktmester:'Okonomi, styresaker og andre kunders eiendommer.',
    leverandor:'Interne kundedata, okonomi, styre og andre leverandorers tilbud.'
  })[role]||'Avklares';
}
function CustomerUxReadinessPage(){
  const items=[
    ['Dashboard','KPI-kort, hurtighandlinger og live-data apnes uten teknisk tekst.','openMain("home",null)'],
    ['Eiendom','Endre info, bygg, FDV, styre og aktivitet fungerer.','openMain("property",null)'],
    ['Drift','Avvik og arbeidsordre kan opprettes, apnes, oppdateres og slettes.','openMain("operations",null)'],
    ['Styre','Styremedlemmer, styresaker, innkalling og oppgaver fungerer.','openMain("board",null)'],
    ['Marked','Leverandorer, RFQ, tilbud og sletting fungerer uten ikke-reelle tall.','openMain("market",null)'],
    ['Admin','Brukere, tilganger, lanseringskontroll og lagringstest gir forstaelige meldinger.','openMain("admin",null)']
  ];
  return `<div class="grid"><div class="card s12"><h3>Kundeopplevelse</h3><p class="muted">Denne listen brukes rett for kundedemo. Alt skal oppleves ferdig, ryddig og forstaelig.</p><table><tr><th>Meny</th><th>Hva skal kontrolleres</th><th>Handling</th></tr>${items.map(i=>`<tr><td><strong>${esc(i[0])}</strong></td><td>${esc(i[1])}</td><td><button class="action" onclick="${i[2]}">Apne</button></td></tr>`).join('')}</table></div><div class="card s12"><h3>Godkjent nar</h3><ul><li>Ingen tekniske tabellnavn vises til kunde.</li><li>Alle knapper enten fungerer eller gir tydelig forklaring.</li><li>Ingen modul later som den lagrer hvis live-lagring feiler.</li><li>Alle tomme lister har god tekst og neste handling.</li></ul></div></div>`;
}
function DocumentEmailReadinessPage(){
  return `<div class="grid"><div class="card s12"><div class="dash-title"><div><h3>Dokumentarkiv og e-post</h3><p class="muted">Dette er kjerneverdi for salg: filer, e-post og historikk ma vaere stabile.</p></div><div><button class="action primary" onclick="showUploadFDV()">Last opp dokument</button><button class="action" onclick="showEmailFlow('general','SALGSKONTROLL')">Send e-post</button></div></div><table><tr><th>Kontrollpunkt</th><th>Godkjent nar</th><th>Handling</th></tr><tr><td>Last opp PDF/bilde</td><td>Filen havner pa valgt eiendom med kategori, bygg og versjon.</td><td><button class="action" onclick="showUploadFDV()">Test opplasting</button></td></tr><tr><td>Apne fil</td><td>PDF/bilde apnes fra filarkivet uten feil.</td><td><button class="action" onclick="openPropertyTabV1('FDV/HMS')">Apne FDV</button></td></tr><tr><td>Slett fil</td><td>Fil og dokumentrad slettes, og listen oppdateres.</td><td><button class="action" onclick="openPropertyTabV1('FDV/HMS')">Apne dokumentarkiv</button></td></tr><tr><td>Send e-post</td><td>Mottaker, emne, melding og logg er riktig.</td><td><button class="action" onclick="showEmailFlow('general','SALGSKONTROLL')">Send e-post</button></td></tr><tr><td>Aktivitetslogg</td><td>Opplasting, sletting og e-post ligger pa eiendomskortet.</td><td><button class="action" onclick="openMain('property',null);openTab('Aktivitet')">Apne aktivitet</button></td></tr></table></div></div>`;
}
function EconomyReadinessPage(){
  const p=dpEnsureMoneyData(property());
  return `<div class="grid">${dpLiveNotice()}${kpi('Konto',money(+p.bankBalance||0),'ok')}${kpi('Reservefond',money(+p.reservedFunds||0),'info')}${kpi('Budsjettlinjer',(p.budgetLines||[]).length,'purple')}${kpi('Prosjekter',(p.projects||[]).length,'warn')}<div class="card s12"><div class="dash-title"><h3>Okonomi klar for salgsdemo</h3><button class="action primary" onclick="openMain('finance',null);openTab('Borettslag okonomi')">Apne okonomi</button></div><table><tr><th>Minimum</th><th>Status</th><th>Handling</th></tr><tr><td>Konto og reservefond</td><td>${dpReadinessBadge((+p.bankBalance||+p.reservedFunds)?'ok':'warn')}</td><td>Legg inn saldo og reservefond.</td></tr><tr><td>Budsjettlinjer</td><td>${dpReadinessBadge((p.budgetLines||[]).length?'ok':'warn')}</td><td>Legg inn drift, vedlikehold, energi og forsikring.</td></tr><tr><td>Prosjektokonomi</td><td>${dpReadinessBadge((p.projects||[]).length?'ok':'warn')}</td><td>Opprett minst ett prosjekt med budsjett og faktisk.</td></tr><tr><td>Styrerapport</td><td>${dpReadinessBadge((p.financialReports||[]).length?'ok':'warn')}</td><td>Lag enkel rapport til styret.</td></tr></table></div></div>`;
}
function OnboardingReadinessPage(){
  const steps=[
    ['Kunde','Opprett kunde og fakturainfo.','openMain("property",null);showCreateCustomerCard&&showCreateCustomerCard()'],
    ['Eiendom','Legg inn adresse, org.nr, bygg, enheter og teknisk info.','openMain("property",null);openTab("Oversikt")'],
    ['Styre','Legg inn styreleder, styremedlemmer, e-post og telefon.','openMain("board",null);openTab("Styreoversikt")'],
    ['Beboere','Opprett beboerbrukere med kun avvikstilgang.','openMain("admin",null);openTab("Beboere")'],
    ['Leverandorer','Legg inn leverandorer med e-post og fagomrade.','openMain("market",null);openTab("Leverandorer")'],
    ['FDV-mapper','Opprett standard mapper og last opp de viktigste dokumentene.','openMain("property",null);openTab("FDV/HMS")'],
    ['Okonomi','Legg inn konto, reservefond og budsjettlinjer.','openMain("finance",null);openTab("Borettslag okonomi")'],
    ['Forste avvik','Opprett forste avvik og lag arbeidsordre.','openMain("operations",null);openTab("Avvik")']
  ];
  return `<div class="grid"><div class="card s12"><h3>Onboarding for ny kunde</h3><p class="muted">Fast rekkefolge nar en ny kunde skal settes opp. Malet er at dette kan gjores pa under 30 minutter for en enkel pilot.</p><table><tr><th>Steg</th><th>Hva gjores</th><th>Handling</th></tr>${steps.map((s,i)=>`<tr><td><strong>${i+1}. ${esc(s[0])}</strong></td><td>${esc(s[1])}</td><td><button class="action" onclick="${s[2]}">Apne</button></td></tr>`).join('')}</table></div></div>`;
}
function LegalSalesReadinessPage(){
  const items=[
    ['Personvern/GDPR','Forklar hvilke data som lagres, formal, rettigheter og kontaktpunkt.'],
    ['Databehandleravtale','Mal for borettslag/sameier med Supabase/Netlify/Resend som underleverandorer.'],
    ['Vilkår','Bruk, ansvar, begrensninger, oppetid, fakturering og avslutning.'],
    ['Supportmodell','Kontaktkanal, responstid, prioritet og support inkludert per pakke.'],
    ['Backup/eksport','Hvordan kunde far eksport av dokumenter, saker og aktivitetslogg.'],
    ['Priser og pakker','Start, Pro og Premium med tydelig innhold og begrensninger.']
  ];
  return `<div class="grid"><div class="card s12"><div class="dash-title"><h3>Salgs- og juridisk pakke</h3><button class="action primary" onclick="openMain('admin',null);openTab('Abonnement')">Apne priser</button></div><table><tr><th>Dokument</th><th>Innhold</th><th>Status</th></tr>${items.map(i=>`<tr><td><strong>${esc(i[0])}</strong></td><td>${esc(i[1])}</td><td><span class="badge warn">Ma ferdigstilles</span></td></tr>`).join('')}</table></div><div class="card s12"><h3>Anbefaling</h3><div class="output">For forste salg bor dette ligge som PDF/lenker pa forsiden og kunne sendes sammen med tilbud/kontrakt.</div></div></div>`;
}
async function runSalesReadinessCheck(){
  const out=document.getElementById('salesReadinessOut'),rows=[];
  function line(ok,msg){rows.push(`${ok?'OK':'MA SJEKKES'} ${msg}`);out.textContent=rows.join('\n')}
  try{
    line(location.protocol!=='file:','Publisert URL brukes');
    line(!!state.currentUserRecord,'Supabase-innlogging aktiv');
    line(isUuid(property().id),'Valgt eiendom er live');
    line(dpRoleReadiness().filter(r=>r.status==='ok').length>=6,'Alle seks roller finnes og er koblet');
    line((property().documents||[]).length>0,'Dokumentarkiv har minst ett dokument');
    line((state.suppliers||[]).some(s=>s.email),'Minst en leverandor med e-post');
    line(!!(+property().bankBalance||+property().reservedFunds||(property().budgetLines||[]).length),'Okonomi har grunnlag');
    line(true,'Ga gjennom undermenyene for manuell sluttkontroll.');
  }catch(e){line(false,'Feil under kontroll: '+e.message)}
}
app.admin.tabs['Salgsberedskap']=()=>salesReadinessPage();
app.admin.tabs['Roller og tilgang']=()=>RoleAccessReadinessPage();
app.admin.tabs['Kundeopplevelse']=()=>CustomerUxReadinessPage();
app.admin.tabs['Dokument og e-post']=()=>DocumentEmailReadinessPage();
app.admin.tabs['Okonomi klar']=()=>EconomyReadinessPage();
app.admin.tabs['Onboarding']=()=>OnboardingReadinessPage();
app.admin.tabs['Juridisk og salg']=()=>LegalSalesReadinessPage();
