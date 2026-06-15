/* Driftspartner OS module: 94-operational-polish.js
   Operational polish for board, economy, residents, property edit and market cleanup.
*/
function dpCurrentRole(){
  return normalizeRole(user()?.role||'');
}
function dpVisibleTabKeys(id=current){
  let keys=Object.keys(app[id]?.tabs||{});
  let role=dpCurrentRole();
  if(role==='beboer'||role==='resident'){
    if(id==='operations')return keys.filter(k=>k==='Avvik');
    if(id==='portal')return keys.filter(k=>k==='Beboer');
  }
  return keys;
}
roleMenus.beboer=['operations'];
roleMenus.resident=['operations'];
roleMenus.styreleder=['home','property','finance','board','cloud'];
roleMenus.styremedlem=['home','property','board','cloud'];
roleMenus.forvalter=['home','property','operations','finance','board','market','cloud','admin'];
roleMenus.superadmin=['home','property','operations','finance','board','market','portal','cloud','admin'];
renderTabs=function(){
  let tabKeys=dpVisibleTabKeys(current);
  document.body.classList.toggle('hide-tabs-home',current==='home');
  document.getElementById('tabs').innerHTML=tabKeys.map((k,i)=>`<button class="${i===0?'active':''}" onclick="openTab('${k}',this)">${esc(k)}</button>`).join('');
};
openMain=function(id,btn){
  if(!state.isLoggedIn){showLogin();return}
  let allowed=roleMenus[user().role]||roleMenus[dpCurrentRole()]||roleMenus.superadmin;
  if(!allowed.includes(id)){act('Ingen tilgang til denne menyen');return}
  document.querySelectorAll('#sideNav button').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  current=id;
  document.getElementById('title').textContent=app[id].title;
  renderPropertyContext();
  renderTabs();
  let first=dpVisibleTabKeys(id)[0]||Object.keys(app[id].tabs)[0];
  openTab(first);
  act('Apnet '+app[id].title+' for '+property().name);
};

function dpPropertyOverviewProduction(){
  let p=dpV1Ensure();
  let buildings=Array.isArray(p.buildings)?p.buildings:[];
  return `<div class="grid">${dpLiveNotice()}<div class="card s5 customer"><div class="dash-title"><h3>Eiendomskort</h3><button class="action primary" onclick="showEditPropertyInfo()">Endre info</button></div><table><tr><td>Eiendom</td><td>${esc(p.name||'-')}</td></tr><tr><td>Kunde</td><td>${esc(p.customer||'-')}</td></tr><tr><td>Adresse</td><td>${esc(p.address||'-')}</td></tr><tr><td>Type</td><td>${esc(p.type||'-')}</td></tr><tr><td>Org.nr</td><td>${esc(p.orgnr||'-')}</td></tr><tr><td>Gnr/Bnr</td><td>${esc(p.gnr||'-')}/${esc(p.bnr||'-')}</td></tr><tr><td>Oppfort ar</td><td>${esc(p.builtYear||'-')}</td></tr><tr><td>Enheter</td><td>${esc(p.units||p.units_count||0)}</td></tr><tr><td>Areal</td><td>${esc(p.area||0)} m2</td></tr><tr><td>Kontakt</td><td>${esc(p.contact||'-')}</td></tr><tr><td>E-post</td><td>${esc(p.email||'-')}</td></tr><tr><td>SLA</td><td>${esc(p.sla||'-')}</td></tr></table></div><div class="card s7"><div class="dash-title"><h3>Bygg og teknisk info</h3><button class="action" onclick="showCreateBuildingV1()">Legg til bygg</button></div><p class="muted">${esc(p.technicalInfo||p.technical_summary||'Ingen teknisk informasjon registrert.')}</p>${buildings.length?buildingsTableV1():'<div class="output">Ingen bygg registrert pa eiendommen.</div>'}</div><div class="card s12"><h3>Snarveier</h3><button class="action" onclick="openTab('Styreoversikt')">Styreoversikt</button><button class="action" onclick="openPropertyTabV1('FDV/HMS')">FDV og dokumenter</button><button class="action" onclick="openMain('finance',null)">Okonomi</button><button class="action" onclick="openMain('admin',null);openTab('Beboere')">Registrer beboere</button></div></div>`;
}
app.property.tabs['Oversikt']=()=>dpPropertyOverviewProduction();

function showEditPropertyInfo(){
  let p=dpV1Ensure();
  showDrawer('Endre eiendomsinfo',`<label>Navn</label><input id="propName" value="${esc(p.name||'')}"><label>Adresse</label><input id="propAddress" value="${esc(p.address||'')}"><label>Type</label><input id="propType" value="${esc(p.type||'')}"><label>Org.nr</label><input id="propOrgnr" value="${esc(p.orgnr||'')}"><label>Gnr</label><input id="propGnr" value="${esc(p.gnr||'')}"><label>Bnr</label><input id="propBnr" value="${esc(p.bnr||'')}"><label>Oppfort ar</label><input id="propBuiltYear" value="${esc(p.builtYear||'')}"><label>Antall enheter</label><input id="propUnits" value="${esc(p.units||p.units_count||0)}"><label>Areal m2</label><input id="propArea" value="${esc(p.area||0)}"><label>Kontaktperson</label><input id="propContact" value="${esc(p.contact||'')}"><label>E-post</label><input id="propEmail" value="${esc(p.email||'')}"><label>Fakturaadresse</label><input id="propInvoice" value="${esc(p.invoiceAddress||p.address||'')}"><label>Ansvarlig forvalter</label><input id="propManager" value="${esc(p.manager||'')}"><label>SLA / avtale</label><input id="propSla" value="${esc(p.sla||'')}"><label>Teknisk informasjon</label><textarea id="propTech">${esc(p.technicalInfo||p.technical_summary||'')}</textarea><button class="action primary" onclick="savePropertyInfo()">Lagre eiendom</button>`);
}
async function savePropertyInfo(){
  let p=dpV1Ensure();
  let data={
    name:document.getElementById('propName').value.trim(),
    address:document.getElementById('propAddress').value.trim(),
    property_type:document.getElementById('propType').value.trim(),
    gnr:document.getElementById('propGnr').value.trim(),
    bnr:document.getElementById('propBnr').value.trim(),
    built_year:document.getElementById('propBuiltYear').value.trim(),
    units_count:+document.getElementById('propUnits').value||0,
    gross_area:+document.getElementById('propArea').value||0,
    technical_summary:document.getElementById('propTech').value.trim()
  };
  if(!data.name){showDrawer('Mangler navn','<div class="output">Skriv inn navn pa eiendommen.</div>');return}
  try{
    dpRequireLiveWrite('endre eiendom');
    let saved=await supabaseClient().from('properties').update(data).eq('id',p.id).select().single();
    if(saved.error)throw saved.error;
    Object.assign(p,{name:data.name,address:data.address,type:data.property_type,gnr:data.gnr,bnr:data.bnr,builtYear:data.built_year,units:data.units_count,area:data.gross_area,technicalInfo:data.technical_summary,orgnr:document.getElementById('propOrgnr').value.trim(),contact:document.getElementById('propContact').value.trim(),email:document.getElementById('propEmail').value.trim(),invoiceAddress:document.getElementById('propInvoice').value.trim(),manager:document.getElementById('propManager').value.trim(),sla:document.getElementById('propSla').value.trim()});
    logActivity('Eiendomsinfo oppdatert',p.id);
    hideDrawer();openMain('property',null);openTab('Oversikt');
  }catch(e){dpShowSupabaseError('Eiendommen ble ikke lagret',e,'properties')}
}

function dpBoardCases(){
  let p=dpV1Ensure();
  p.boardCases=Array.isArray(p.boardCases)?p.boardCases:[];
  return p.boardCases;
}
function boardCasesPage(){
  let cases=dpBoardCases();
  return `<div class="grid">${dpLiveNotice()}<div class="card s12"><div class="dash-title"><div><h3>Styresaker</h3><p class="muted">Styresaker, innkallinger og arsmoter lagres pa valgt eiendom.</p></div><div><button class="action primary" onclick="showCreateBoardCaseLive('Styresak')">Ny styresak</button><button class="action" onclick="showCreateBoardCaseLive('Innkalling')">Innkalling</button><button class="action" onclick="showCreateBoardCaseLive('Arsmote')">Arsmote</button></div></div><table><tr><th>Sak</th><th>Type</th><th>Tittel</th><th>Dato</th><th>Status</th><th>Handling</th></tr>${cases.length?cases.map((c,i)=>`<tr><td>${esc(dpFriendlyId(c,'ST',cases))}</td><td>${esc(c.type||'Styresak')}</td><td>${esc(c.title||'-')}</td><td>${esc(c.meeting_date||c.due_date||'-')}</td><td>${esc(c.status||'Utkast')}</td><td><button class="action" onclick="showBoardCaseDetail('${esc(c.id||i)}')">Apne</button><button class="action" onclick="showEmailFlow('board','${esc(c.id||i)}')">Send</button><button class="action red" onclick="deleteBoardCaseLive('${esc(c.id||i)}')">Slett</button></td></tr>`).join(''):'<tr><td colspan="6">Ingen styresaker registrert.</td></tr>'}</table></div></div>`;
}
function showCreateBoardCaseLive(type='Styresak'){
  let residents=dpResidentEmails(),board=dpBoardEmails(property());
  showDrawer(type,`<label>Type</label><select id="boardCaseType"><option ${type==='Styresak'?'selected':''}>Styresak</option><option ${type==='Innkalling'?'selected':''}>Innkalling</option><option ${type==='Arsmote'?'selected':''}>Arsmote</option><option>Vedtak</option></select><label>Tittel</label><input id="boardCaseTitle" value=""><label>Dato / mote</label><input id="boardCaseDate" type="date"><label>Saksgrunnlag</label><textarea id="boardCaseText">Beskriv bakgrunn, vurdering, konsekvens og anbefalt vedtak.</textarea><label>Forslag til vedtak</label><textarea id="boardCaseDecision">Styret vedtar...</textarea><label>Mottakere</label><select id="boardCaseAudience"><option value="board">Kun styret (${board.length})</option><option value="residents">Alle beboere (${residents.length})</option><option value="all">Styre og beboere (${board.length+residents.length})</option></select><button class="action primary" onclick="saveBoardCaseLive()">Lagre sak</button><button class="action" onclick="sendBoardCaseInviteDraft()">Send e-post</button>`);
}
async function saveBoardCaseLive(){
  let p=dpV1Ensure(),c={id:'ST-'+Date.now(),type:document.getElementById('boardCaseType').value,title:document.getElementById('boardCaseTitle').value.trim(),meeting_date:document.getElementById('boardCaseDate').value,description:document.getElementById('boardCaseText').value,decision:document.getElementById('boardCaseDecision').value,status:'Utkast',audience:document.getElementById('boardCaseAudience').value};
  if(!c.title){showDrawer('Mangler tittel','<div class="output">Skriv inn tittel pa styresaken.</div>');return}
  try{
    dpRequireLiveWrite('lagre styresak');
    let r=await supabaseClient().from('board_cases').insert({property_id:p.id,type:c.type,title:c.title,description:c.description,proposed_decision:c.decision,meeting_date:c.meeting_date||null,status:c.status,audience:c.audience,created_by:user().id}).select().single();
    if(r.error)throw r.error;
    c.id=r.data.id;
    p.boardCases=p.boardCases||[];p.boardCases.unshift(c);
    logActivity('Styresak opprettet',c.id);
    showDrawer('Styresak lagret',`<table><tr><td>Sak</td><td>${esc(dpFriendlyId(c,'ST',p.boardCases))}</td></tr><tr><td>Tittel</td><td>${esc(c.title)}</td></tr><tr><td>Lagring</td><td>Supabase</td></tr></table><button class="action primary" onclick="showEmailFlow('board','${esc(c.id)}')">Send e-post</button><button class="action" onclick="openMain('board',null);openTab('Styresaker')">Tilbake</button>`);
  }catch(e){dpShowSupabaseError('Styresak ble ikke lagret',e,'board_cases')}
}
function showBoardCaseDetail(id){
  let cases=dpBoardCases(),c=cases.find(x=>String(x.id)===String(id))||cases[+id];
  if(!c)return;
  showDrawer('Styresak',`<table><tr><td>Type</td><td>${esc(c.type||'Styresak')}</td></tr><tr><td>Tittel</td><td>${esc(c.title||'-')}</td></tr><tr><td>Dato</td><td>${esc(c.meeting_date||'-')}</td></tr><tr><td>Status</td><td>${esc(c.status||'Utkast')}</td></tr><tr><td>Saksgrunnlag</td><td>${esc(c.description||'-')}</td></tr><tr><td>Forslag</td><td>${esc(c.decision||c.proposed_decision||'-')}</td></tr></table><button class="action primary" onclick="showEmailFlow('board','${esc(c.id)}')">Send til mottakere</button><button class="action red" onclick="deleteBoardCaseLive('${esc(c.id)}')">Slett</button>`);
}
async function deleteBoardCaseLive(id){
  let p=dpV1Ensure(),cases=dpBoardCases(),c=cases.find(x=>String(x.id)===String(id));
  if(!c)return;
  if(!confirm(`Slette styresak "${c.title||''}"?`))return;
  try{
    if(isRealSession()&&isUuid(c.id)){
      let r=await supabaseClient().from('board_cases').delete().eq('id',c.id);
      if(r.error)throw r.error;
    }else if(state.currentUserRecord)throw new Error('Styresaken mangler Supabase-ID.');
    p.boardCases=cases.filter(x=>x!==c);
    logActivity('Styresak slettet',c.id);
    hideDrawer();openMain('board',null);openTab('Styresaker');
  }catch(e){dpShowSupabaseError('Styresak ble ikke slettet',e,'board_cases')}
}
function sendBoardCaseInviteDraft(){
  saveBoardCaseLive();
}
function dpBoardTasksPage(){
  let p=dpV1Ensure(),items=p.boardTasks||[];
  return `<div class="grid">${dpLiveNotice()}<div class="card s12"><h3>Styreoppgaver</h3><table><tr><th>Oppgave</th><th>Ansvarlig</th><th>Frist</th><th>Status</th></tr>${items.length?items.map(x=>`<tr><td>${esc(x.title||'-')}</td><td>${esc(x.owner||'-')}</td><td>${esc(x.due||'-')}</td><td>${esc(x.status||'-')}</td></tr>`).join(''):'<tr><td colspan="4">Ingen styreoppgaver registrert.</td></tr>'}</table></div></div>`;
}
app.board.tabs={'Styresaker':()=>boardCasesPage(),'Styreoversikt':()=>boardOverview(),'Innkalling/arsmote':()=>boardCasesPage(),'Oppgaver':()=>dpBoardTasksPage()};

function dpResidentEmails(){
  let p=ensurePropertyData(property());
  let fromUsers=(state.users||[]).filter(u=>normalizeRole(u.role)==='beboer'&&(u.properties||[]).includes(p.id)).map(u=>u.email);
  let fromContacts=(p.propertyContacts||p.contacts||[]).filter(c=>String(c.role||c.type||'').toLowerCase().includes('bebo')).map(c=>c.email);
  return dpProductionEmailsOnly([...(fromUsers||[]),...(fromContacts||[])]);
}
function ResidentUsersPage(){
  let p=property(),residents=(state.users||[]).filter(u=>normalizeRole(u.role)==='beboer'&&((u.properties||[]).includes(p.id)||user().role==='superadmin'));
  return `<div class="grid">${dpLiveNotice()}<div class="card s8"><h3>Beboere</h3><table><tr><th>Navn</th><th>E-post</th><th>Telefon</th><th>Eiendom</th></tr>${residents.length?residents.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email||'-')}</td><td>${esc(u.phone||'-')}</td><td>${esc(p.name)}</td></tr>`).join(''):'<tr><td colspan="4">Ingen beboere registrert i appen.</td></tr>'}</table></div><div class="card s4"><h3>Opprett beboerbruker</h3><label>Navn</label><input id="newUserName" value=""><label>E-post</label><input id="newUserEmail" value=""><label>Telefon</label><input id="newUserPhone" value=""><input id="newUserRole" type="hidden" value="beboer"><label>Eiendom</label><select id="newUserProperty">${dpPropertyOptions()}</select><input id="newUserAccessRole" type="hidden" value="resident"><label>Midlertidig passord</label><input id="newUserPassword" type="password"><button class="action primary" onclick="saveUser()">Opprett beboer</button><div id="newUserOut" class="output">Beboerrollen far kun tilgang til a melde avvik.</div></div></div>`;
}
app.admin.tabs['Beboere']=()=>ResidentUsersPage();
app.portal.tabs['Beboer']=()=>ResidentDeviationOnlyPage();
app.operations.tabs['Avvik']=()=>ResidentDeviationOnlyPage();
function ResidentDeviationOnlyPage(){
  let p=dpV1Ensure();
  let isResident=['beboer','resident'].includes(dpCurrentRole());
  return `<div class="grid">${dpLiveNotice()}<div class="card s5"><h3>${isResident?'Meld avvik':'Nytt avvik'}</h3><label>Tittel</label><input id="devTitle" value=""><label>Beskrivelse</label><textarea id="devDesc"></textarea><label>Innsender</label><select id="devReporter"><option>${isResident?'Beboer':'Styremedlem'}</option><option>Vaktmester</option><option>Leverandor</option><option>Forvalter</option></select><label>Bygg</label><select id="devBuilding"><option value="">Ikke valgt</option>${(p.buildings||[]).map(b=>`<option>${esc(b.name)}</option>`).join('')}</select><label>Leilighet/omrade</label><input id="devUnit" value=""><label>Kategori</label><select id="devCategory"><option>Tak</option><option>VVS</option><option>Elektro</option><option>Uteomrade</option><option>HMS</option><option>Heis</option><option>Annet</option></select><label>Prioritet</label><select id="devPrio"><option>Medium</option><option>Lav</option><option>Hoy</option><option>Kritisk</option></select><label>Bilde/PDF</label><input id="devFile" type="file" accept="image/*,.pdf"><label>Tildel/send til flere</label><input id="devAssign" value="" placeholder="post@kunde.no, vaktmester@kunde.no" ${isResident?'disabled':''}><button class="action primary" onclick="createDeviationFromForm()">Opprett avvik</button></div><div class="card s7"><h3>Avviksliste</h3>${isResident?'<p class="muted">Beboere ser bare egen avviksmelding etter innsending. Full liste er skjult.</p>':deviationsTableV1()}</div></div>`;
}

function FinanceBudgetPage(){
  let p=dpEnsureMoneyData(property()),lines=p.budgetLines||[];
  return `<div class="grid">${dpLiveNotice()}<div class="card s12"><div class="dash-title"><h3>Budsjett</h3><button class="action primary" onclick="showBudgetLineForm()">Ny budsjettlinje</button></div><table><tr><th>Kategori</th><th>Linje</th><th>Budsjett</th><th>Faktisk</th><th>Avvik</th><th>Handling</th></tr>${lines.length?lines.map(l=>`<tr><td>${esc(l.category||'-')}</td><td>${esc(l.label||'-')}</td><td>${money(+l.budget||0)}</td><td>${money(+l.actual||0)}</td><td>${money((+l.actual||0)-(+l.budget||0))}</td><td><button class="action red" onclick="deleteBudgetLineLive('${esc(l.id)}')">Slett</button></td></tr>`).join(''):'<tr><td colspan="6">Ingen budsjettlinjer registrert.</td></tr>'}</table></div></div>`;
}
async function deleteBudgetLineLive(id){
  let p=dpEnsureMoneyData(property()),line=(p.budgetLines||[]).find(x=>String(x.id)===String(id));
  if(!line)return;
  if(!confirm(`Slette budsjettlinje "${line.label||''}"?`))return;
  try{
    if(isRealSession()&&isUuid(line.id)){
      let r=await supabaseClient().from('budget_lines').delete().eq('id',line.id);
      if(r.error)throw r.error;
    }else if(state.currentUserRecord)throw new Error('Budsjettlinjen mangler Supabase-ID.');
    p.budgetLines=p.budgetLines.filter(x=>x!==line);
    logActivity('Budsjettlinje slettet',line.id);
    openMain('finance',null);openTab('Budsjett');
  }catch(e){dpShowSupabaseError('Budsjettlinje ble ikke slettet',e,'budget_lines')}
}
function FinanceReportsPage(){
  let p=dpEnsureMoneyData(property()),reports=p.financialReports||[];
  return `<div class="grid">${dpLiveNotice()}<div class="card s12"><div class="dash-title"><h3>Okonomirapporter</h3><button class="action primary" onclick="showFinancialReportForm()">Ny rapport</button></div><table><tr><th>Rapport</th><th>Periode</th><th>Dato</th><th>Sammendrag</th></tr>${reports.length?reports.map(r=>`<tr><td>${esc(r.title||'-')}</td><td>${esc(r.period||'-')}</td><td>${esc(r.created_at||'-')}</td><td>${esc(r.summary||'')}</td></tr>`).join(''):'<tr><td colspan="4">Ingen rapporter registrert.</td></tr>'}</table></div></div>`;
}
app.finance.tabs={'Borettslag okonomi':()=>LiveEconomyPage(),'Prosjektokonomi':()=>LiveProjectsPage(),'Budsjett':()=>FinanceBudgetPage(),'Fakturagrunnlag':app.finance.tabs['Time/kost'],'Rapporter':()=>FinanceReportsPage()};

function LiveMarketPage(){
  let p=ensurePropertyData(property()),rfqs=p.quoteRequests||[],offers=p.offers||[],suppliers=state.suppliers||[];
  return `<div class="grid">${dpLiveNotice()}${kpi('Leverandorer',suppliers.length,'info')}${kpi('RFQ',rfqs.length,'info')}${kpi('Tilbud',offers.length,'ok')}${kpi('Datakilde',isRealSession()?'Supabase':'Ikke live','purple')}<div class="card s12"><div class="dash-title"><h3>Marked</h3><div><button class="action primary" onclick="showQuoteRequest()">Lag tilbudsforesporsel</button><button class="action" onclick="showSupplierRegistration()">Registrer leverandor</button><button class="action" onclick="showUploadOffer()">Last opp tilbud</button></div></div><p class="muted">Tallene her er kun leverandorer, RFQ og tilbud som er hentet fra valgt eiendom/Supabase.</p></div></div>`;
}
function QuotesRfqPage(){
  let s=dpLiveDashboardStats();
  let rfqRows=s.rfqs.map(q=>`<tr><td>${esc(dpFriendlyId(q,'RFQ',s.rfqs))}</td><td>${esc(q.title||'-')}</td><td>${esc(q.deadline||'-')}</td><td>${esc(q.status||'-')}</td><td><button class="action" onclick="showDashboardQuotes()">Apne</button><button class="action red" onclick="confirmDeleteQuoteRequest('${esc(q.id)}')">Slett</button></td></tr>`).join('');
  let offerRows=s.offers.map(o=>`<tr><td>${esc(o.supplier||'-')}</td><td>${money(+o.price||0)}</td><td>${esc(o.deadline||'-')}</td><td>${esc(o.score||'Ikke vurdert')}</td></tr>`).join('');
  return `<div class="grid">${dpLiveNotice()}<div class="card s12"><div class="dash-title"><h3>Tilbud og foresporsler</h3><div><button class="action primary" onclick="showQuoteRequest()">Lag tilbudsforesporsel</button><button class="action" onclick="showUploadOffer()">Last opp tilbud</button></div></div><h3>Foresporsler</h3><table><tr><th>RFQ</th><th>Oppdrag</th><th>Frist</th><th>Status</th><th>Handling</th></tr>${rfqRows||'<tr><td colspan="5">Ingen foresporsler.</td></tr>'}</table><h3>Tilbud</h3><table><tr><th>Leverandor</th><th>Pris</th><th>Frist</th><th>Score</th></tr>${offerRows||'<tr><td colspan="4">Ingen tilbud lastet opp.</td></tr>'}</table></div></div>`;
}
function SupplierRegisterPage(){
  let suppliers=state.suppliers||[];
  return `<div class="grid">${dpLiveNotice()}<div class="card s8"><h3>Leverandorer</h3><table><tr><th>Firma</th><th>E-post</th><th>Fag</th><th>Score</th><th>Handling</th></tr>${suppliers.length?suppliers.map(s=>`<tr><td>${esc(s.name||'-')}</td><td>${esc(s.email||'-')}</td><td>${esc(s.trade||'-')}</td><td>${esc(s.score||0)}</td><td><button class="action" onclick="showEmailFlow('quote','${esc(s.id)}')">E-post</button><button class="action red" onclick="deleteSupplierLive('${esc(s.id)}')">Slett</button></td></tr>`).join(''):'<tr><td colspan="5">Ingen leverandorer registrert.</td></tr>'}</table></div><div class="card s4"><h3>Ny leverandor</h3><label>Firma</label><input id="supplierName" value=""><label>E-post</label><input id="supplierEmail" value=""><label>Fagomrade</label><input id="supplierTrade" value=""><label>Score</label><input id="supplierScore" value="0"><button class="action primary" onclick="saveSupplier()">Lagre leverandor</button></div></div>`;
}
async function deleteSupplierLive(id){
  let s=(state.suppliers||[]).find(x=>String(x.id)===String(id));
  if(!s)return;
  if(!confirm(`Slette leverandor "${s.name||s.email}"?`))return;
  try{
    if(isRealSession()&&isUuid(s.id)){
      await supabaseClient().from('quote_request_suppliers').delete().eq('supplier_id',s.id);
      await supabaseClient().from('offers').delete().eq('supplier_id',s.id);
      let r=await supabaseClient().from('suppliers').delete().eq('id',s.id);
      if(r.error)throw r.error;
    }else if(state.currentUserRecord)throw new Error('Leverandoren mangler Supabase-ID.');
    state.suppliers=state.suppliers.filter(x=>x!==s);
    logActivity('Leverandor slettet',s.id);
    openMain('market',null);openTab('Leverandorer');
  }catch(e){dpShowSupabaseError('Leverandor ble ikke slettet',e,'suppliers / offers / quote_request_suppliers')}
}
app.market.tabs={'Marked':()=>LiveMarketPage(),'Leverandorer':()=>SupplierRegisterPage(),'Tilbud/RFQ':()=>QuotesRfqPage(),'Anbud':()=>`<div class="grid">${dpLiveNotice()}<div class="card s12"><h3>Anbud</h3><p class="muted">Publisering av anbud skal bruke PDF/vedlegg via tilbudsforesporsel.</p><button class="action primary" onclick="showQuoteRequest()">Lag tilbudsforesporsel</button></div></div>`};

const dpHydrateOperationalPolishBase=hydrateCurrentPropertyData;
hydrateCurrentPropertyData=async function(db=supabaseClient()){
  let p=await dpHydrateOperationalPolishBase(db),errors=p?.liveErrors||[];
  if(!p||!isUuid(p.id))return p;
  let boardCases=await dpQueryLive(db,'board_cases',()=>db.from('board_cases').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(100),errors);
  if(boardCases)p.boardCases=boardCases.map(x=>({id:x.id,type:x.type,title:x.title,description:x.description,decision:x.proposed_decision,meeting_date:x.meeting_date,status:x.status,audience:x.audience}));
  let contacts=await dpQueryLive(db,'property_contacts',()=>db.from('property_contacts').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(200),errors);
  if(contacts)p.propertyContacts=contacts;
  p.liveErrors=[...new Set(errors)];
  return p;
};

mvpPlanPage=function(){
  let modules=[
    ['Kunder/eiendommer','Kjerne','Kundekort, eiendomskort og kontaktpersoner','Opprette kunde, eiendom, kontaktpersoner, styre og SLA.'],
    ['Brukere/roller/tilgang','Kjerne','Innlogging, roller og eiendomstilgang','Ekte innlogging og tilgang per eiendom og rolle.'],
    ['Avvik','Drift','Avvik og ansvarlige','Registrere avvik, prioritet, status, bilder og ansvarlig.'],
    ['Arbeidsordre','Drift','Arbeidsordre og oppgaver','Tildele oppgaver til vaktmester, leverandor eller styreleder.'],
    ['Dokumentarkiv','Dokument','FDV, HMS, bilder, kontrakter og tilbud','Laste opp FDV, HMS, bilder, kontrakter og tilbud per eiendom.'],
    ['Leverandorer','Marked','Leverandorregister og kontaktpersoner','Registrere leverandorer med e-post, fag, score og portaltilgang.'],
    ['Tilbudsforesporsel','Innkjop','Foresporsler og valgte leverandorer','Sende RFQ med PDF, bilder, frist og krav til valgte leverandorer.'],
    ['Tilbudsopplasting','Innkjop','Tilbud, vedlegg og vurdering','Leverandor laster opp pris, PDF, forbehold og kommentarer.'],
    ['Aktivitetslogg','Audit','Historikk og sporbarhet','Logge hvem gjorde hva, nar, pa hvilken eiendom og hvilken sak.']
  ];
  let live=isRealSession&&isRealSession();
  return `<div class="grid"><div class="card s12"><div class="dash-title"><div><h3>Produksjonsplan</h3><p class="muted">Dette er styringssiden for hva som ma vaere pa plass for at Driftspartner OS kan brukes med ekte kunder, dokumenter og e-post.</p></div><span class="badge ${live?'ok':'warn'}">${live?'Live drift aktiv':'Krever live innlogging'}</span></div><table><tr><th>Modul</th><th>Omrade</th><th>Systemdel</th><th>Hva ma fungere</th></tr>${modules.map(m=>`<tr><td><strong>${esc(m[0])}</strong></td><td>${esc(m[1])}</td><td>${esc(m[2])}</td><td>${esc(m[3])}</td></tr>`).join('')}</table></div><div class="card s6"><h3>Backend som brukes</h3><ul><li>Supabase/Postgres for database, innlogging og fil-lagring.</li><li>Tilgangsstyring skal sikre at brukere bare ser egne eiendommer.</li><li>Filarkiv for FDV, HMS, tilbud, bilder og kontrakter.</li><li>E-post via Netlify Functions og Resend.</li><li>Backendfunksjoner for e-post og brukeropprettelse.</li></ul></div><div class="card s6"><h3>Byggerekkefolge videre</h3><ol><li>Stresstest tilgangsregler per rolle og eiendom.</li><li>Full ende-til-ende kontroll: avvik til FDV/rapport.</li><li>Fjerne siste gamle visninger som ikke lagrer live.</li><li>Kontrollere filopplasting og e-post online med pilotkunde.</li><li>Lage onboarding, GDPR og supportoppsett.</li></ol></div><div class="card s6"><h3>Produksjonsflyter</h3><ul><li>Innlogging og tilgang per eiendom.</li><li>Eiendom, dokumenter, avvik og arbeidsordre.</li><li>Tilbudsforesporsler, tilbud og kontrakter.</li><li>Aktivitetslogg og rapportering.</li></ul></div><div class="card s6"><h3>Produksjonsstatus</h3><div class="output">Appen er satt opp for live data. Hvis en modul ikke kan lagre, skal den vise tydelig feilmelding om manglende tilgang, oppsett eller rettigheter.</div><button class="action primary" onclick="openMain('admin',null);openTab('Lanseringskontroll')">Apne lanseringskontroll</button><button class="action" onclick="openMain('admin',null);openTab('Fullsjekk')">Kjor fullsjekk</button></div></div>`;
};

function dpFriendlyTechText(text=''){
  let s=String(text);
  const pairs=[
    ['deviations.category','avvikskategori'],
    ['deviations','Avvik'],
    ['work_orders','Arbeidsordre'],
    ['documents','Dokumentarkiv'],
    ['document_versions','Dokumentversjoner'],
    ['quote_requests','Tilbudsforesporsler'],
    ['quote_request_suppliers','Valgte leverandorer'],
    ['offers','Tilbud'],
    ['offer_files','Tilbudsvedlegg'],
    ['suppliers','Leverandorer'],
    ['supplier_contacts','Leverandorkontakter'],
    ['activity_log','Aktivitetslogg'],
    ['property_finance','Okonomi'],
    ['budget_lines','Budsjettlinjer'],
    ['properties','Eiendommer'],
    ['property_access','Tilganger'],
    ['property_contacts','Kontaktpersoner'],
    ['app_users','Brukere'],
    ['board_cases','Styresaker'],
    ['Storage documents','Filarkiv']
  ];
  pairs.forEach(([from,to])=>{s=s.split(from).join(to)});
  return s;
}
const dpShowSupabaseErrorRaw=dpShowSupabaseError;
dpShowSupabaseError=function(title,error,area=''){
  return dpShowSupabaseErrorRaw(title,error,dpFriendlyTechText(area));
};
showDashboardSettings=function(){
  let s=dpLiveDashboardStats();
  showDrawer('Dashboard-oppsett',`<div class="output">Dashboardet er bundet til valgt eiendom: ${esc(s.p.name)}.\n\nViser live data fra:\n- Avvik\n- Arbeidsordre\n- Dokumentarkiv\n- Tilbud og foresporsler\n- Leverandorer\n- Aktivitetslogg\n- Okonomi</div><button class="action primary" onclick="hydrateDashboardNow()">Hent live data pa nytt</button><button class="action" onclick="openMain('admin',null);openTab('Produksjonssjekk')">Produksjonssjekk</button>`);
};
dpLiveErrorPanel=function(){
  let p=property(),errors=(p.liveErrors||[]).map(dpFriendlyTechText);
  if(!dpLiveOnlyStatus())return '';
  if(!errors.length)return '<span class="badge ok">Live OK</span>';
  return `<span class="badge bad">Live-feil</span><p class="muted">${esc(errors.join(' | '))}</p>`;
};
dpRawFinancePanel=function(d){
  let budget=d.budgetLines.reduce((s,x)=>s+(+x.budget||+x.budget_amount||0),0)||d.projects.reduce((s,x)=>s+(+x.budget||+x.budget_amount||0),0);
  let actual=d.budgetLines.reduce((s,x)=>s+(+x.actual||+x.actual_amount||0),0)||d.projects.reduce((s,x)=>s+(+x.actual||+x.actual_amount||0),0);
  let variance=actual-budget;
  return `<div class="ops-panel"><div class="dash-title"><h3>Okonomi live</h3><button class="action" onclick="openMain('finance',null);openTab('Borettslag okonomi')">Apne</button></div><div class="ops-budget-summary"><div><small>Konto</small><b>${money(d.finance.bank)}</b></div><div><small>Budsjett</small><b>${money(budget)}</b></div><div><small>Avvik</small><b>${money(variance)}</b></div></div><p class="muted">Tallene hentes fra valgt eiendom.</p></div>`;
};
DashboardPage=function(){
  let d=dpLiveRawDashboardData(),p=d.p;
  if(!d.online){
    return `<div class="ops-dashboard"><section class="ops-head"><div><h2>Dashboard</h2><p class="muted">Logg inn og velg en eiendom for a se live status.</p></div><button class="action primary" onclick="showLogin()">Logg inn</button></section><section class="ops-panel"><h3>Ingen live-data vises</h3><p class="muted">Dashboardet viser bare data fra valgt eiendom nar innlogging og tilgang er aktiv.</p></section></div>`;
  }
  let closed=['lukket','ferdig','utført','utfort','fullført','fullfort'];
  let openDevs=d.devs.filter(x=>!closed.includes(String(x.status||'').toLowerCase())).length;
  let critical=d.devs.filter(x=>String(x.priority||'').toLowerCase().includes('kritisk')&&!closed.includes(String(x.status||'').toLowerCase())).length;
  let openWos=d.wos.filter(x=>!closed.includes(String(x.status||'').toLowerCase())).length;
  let categories={};d.devs.forEach(x=>{let c=x.category||'Ikke kategorisert';categories[c]=(categories[c]||0)+1});
  let catRows=Object.entries(categories).map(([k,v])=>`<div class="ops-row"><span class="task-dot" style="background:#895dff"></span><div><strong>${esc(k)}</strong><br><small class="muted">Registrerte avvik</small></div><b>${v}</b></div>`).join('')||'<p class="muted">Ingen kategoriserte avvik.</p>';
  let aiItems=[];
  if(critical)aiItems.push(`Kritiske avvik: ${critical}`);
  if(openWos)aiItems.push(`Apne arbeidsordre: ${openWos}`);
  if(!d.docs.length)aiItems.push('Ingen dokumenter registrert');
  if(!aiItems.length)aiItems.push('Ingen kritiske funn akkurat na');
  return `<div class="ops-dashboard"><section class="ops-head"><div><h2>Dashboard</h2><p class="muted">${esc(p.name)} · live status · sist hentet ${esc(p.liveCheckedAt||'ikke hentet')}</p>${dpLiveErrorPanel()}</div><div><button class="action" onclick="hydrateDashboardNow()">${Icon('refresh')} Hent live data</button><button class="action" onclick="showDashboardSettings()">Dashboard-oppsett</button><button class="action primary" onclick="showCreateDeviation()">${Icon('plus')} Nytt avvik</button></div></section><section class="ops-kpis">${dpRawLiveKpi('alert','Apne avvik',openDevs,'Avvik','blue','showDashboardOpenDeviations()')}${dpRawLiveKpi('alert','Kritiske avvik',critical,'Prioritet og status','redgrad','showDashboardOpenDeviations()')}${dpRawLiveKpi('tool','Arbeidsordre',openWos,'Oppgaver','yellow','showDashboardWorkOrders()')}${dpRawLiveKpi('file','Dokumenter',d.docs.length,'Dokumentarkiv','violet','showDashboardDocuments()')}${dpRawLiveKpi('mail','Tilbud/RFQ',`${d.offers.length}/${d.rfqs.length}`,'Tilbud og foresporsler','blue','showDashboardQuotes()')}${dpRawLiveKpi('briefcase','Konto',money(d.finance.bank),'Okonomi','greengrad','showDashboardFinance()')}</section><section class="ops-mid">${dpRawFinancePanel(d)}<div class="ops-panel"><h3>Avvik fordelt pa kategori</h3>${catRows}</div><div class="ops-panel"><h3>AI Director - live regler</h3>${aiItems.map(x=>`<div class="os-rec"><span class="mini-ico ${x.includes('Ingen')?'greengrad':'yellow'}">${Icon(x.includes('Ingen')?'check':'alert')}</span><div><strong>${esc(x)}</strong><br><small class="muted">Basert pa registrert live-data.</small></div></div>`).join('')}</div></section><section class="ops-quick"><h3>Hurtighandlinger</h3><div>${[['alert','Registrer avvik','showCreateDeviation()'],['tool','Ny arbeidsordre','showCreateWorkOrder()'],['file','Last opp dokument','showUploadFDV()'],['mail','Lag tilbudsforesporsel','showQuoteRequest()'],['chart','Okonomi','openMain("finance",null);openTab("Borettslag okonomi")'],['users','Styre','openMain("board",null)']].map(x=>`<button class="action" onclick="${x[2]}"><span class="mini-ico blue">${Icon(x[0])}</span>${esc(x[1])}</button>`).join('')}</div></section><section class="ops-bottom"><section class="ops-panel"><div class="dash-title"><h3>Live avvik</h3><button class="action" onclick="showDashboardOpenDeviations()">Apne</button></div>${dpRawRows(d.devs,'dev')}</section><section class="ops-panel"><div class="dash-title"><h3>Live arbeidsordre</h3><button class="action" onclick="showDashboardWorkOrders()">Apne</button></div>${dpRawRows(d.wos,'wo')}</section><section class="ops-panel"><div class="dash-title"><h3>Live dokumenter</h3><button class="action" onclick="showDashboardDocuments()">Apne</button></div>${dpRawRows(d.docs,'doc')}</section><section class="ops-panel"><h3>Datastatus</h3><p class="muted">Produksjonsmodus: kun live data for valgt eiendom.</p><button class="action primary" onclick="hydrateDashboardNow()">Oppdater na</button></section></section></div>`;
};
