/* Driftspartner OS module: 53-production-crud-users.js
   Production delete actions, board/user management and property access.
   Source: 50-drift-cases.js:251-431
*/
function dpRequireLiveForWrite(action){
  if(!state.currentUserRecord||!isUuid(property().id)){
    showDrawer('Krever live Supabase',`<div class="output">${esc(action)} er en produksjonshandling. Logg inn med ekte Supabase-bruker og velg en Supabase-eiendom først.</div>`);
    return false;
  }
  return true;
}
async function dpDeleteRow(table,id,label){
  if(!id)throw new Error('Mangler ID for sletting.');
  if(isRealSession()&&isUuid(String(id))){
    let result=await supabaseClient().from(table).delete().eq('id',id);
    if(result.error)throw result.error;
    return 'Slettet i Supabase';
  }
  if(state.currentUserRecord)throw new Error(`${label} mangler teknisk Supabase-ID.`);
  return 'Fjernet lokalt';
}
async function deleteBoardMember(index){
  let p=ensurePropertyData(property()),m=p.boardMembers[index];
  if(!m)return;
  if(!confirm(`Slette styremedlem ${m.name||m.email||''}?`))return;
  try{
    if(isUuid(String(m.id)))await dpDeleteRow('board_members',m.id,'Styremedlem');
    else if(state.currentUserRecord)throw new Error('Styremedlemmet mangler Supabase-ID.');
    p.boardMembers.splice(index,1);
    logActivity('Styremedlem slettet',m.id||m.email||m.name);
    openTab('Styreoversikt');
  }catch(e){showDrawer('Styremedlem ble ikke slettet',`<div class="output">${esc(e.message)}</div>`)}
}
async function deleteDeviation(id){
  let p=ensureCaseCollections(),d=(p.deviations||[]).find(x=>String(x.id)===String(id)||String(x.technical_id)===String(id)||String(x.display_id)===String(id));
  if(!d)return;
  if(!confirm(`Slette avvik ${dpFriendlyId(d,'AV',p.deviations)}?`))return;
  try{
    await dpDeleteRow('deviations',dpDbId(d),'Avvik');
    p.deviations=p.deviations.filter(x=>x!==d);p.dev=p.deviations.length;p.openCases=p.deviations.filter(x=>x.status!=='Lukket').length;
    logActivity('Avvik slettet',dpFriendlyId(d,'AV',p.deviations));
    hideDrawer();openMain('operations',null);openTab('Avvik');
  }catch(e){showDrawer('Avvik ble ikke slettet',`<div class="output">${esc(e.message)}</div>`)}
}
async function deleteWorkOrder(id){
  let p=ensureCaseCollections(),w=(p.workOrders||[]).find(x=>String(x.id)===String(id)||String(x.technical_id)===String(id)||String(x.display_id)===String(id));
  if(!w)return;
  if(!confirm(`Slette arbeidsordre ${dpFriendlyId(w,'WO',p.workOrders)}?`))return;
  try{
    await dpDeleteRow('work_orders',dpDbId(w),'Arbeidsordre');
    p.workOrders=p.workOrders.filter(x=>x!==w);p.wo=p.workOrders.length;
    logActivity('Arbeidsordre slettet',dpFriendlyId(w,'WO',p.workOrders));
    hideDrawer();openMain('operations',null);openTab('Arbeidsordre');
  }catch(e){showDrawer('Arbeidsordre ble ikke slettet',`<div class="output">${esc(e.message)}</div>`)}
}
boardOverview=function(){
  let p=ensurePropertyData(property());
  return `<div class="grid"><div class="card s8"><h3>Styre for ${esc(p.customer)}</h3><table><tr><th>Navn</th><th>Rolle</th><th>E-post</th><th>Telefon</th><th>Notat/div</th><th>Handling</th></tr>${p.boardMembers.map((m,i)=>`<tr><td>${esc(m.name)}</td><td>${esc(m.role)}</td><td>${esc(m.email||'-')}</td><td>${esc(m.phone||'-')}</td><td>${esc(m.notes||'')}</td><td><button class="action" onclick="showEmailFlow('board','Styre-${i+1}')">E-post</button><button class="action red" onclick="deleteBoardMember(${i})">Slett</button></td></tr>`).join('')||'<tr><td colspan="6">Ingen styremedlemmer registrert.</td></tr>'}</table></div><div class="card s4"><h3>Legg til styremedlem</h3><label>Navn</label><input id="boardName" value=""><label>Rolle</label><input id="boardRole" value="Styremedlem"><label>E-post</label><input id="boardEmail" value="" placeholder="navn@domene.no"><label>Telefon</label><input id="boardPhone" value=""><label>Notat/div</label><textarea id="boardNotes"></textarea><button class="action green" onclick="saveBoardMember()">Lagre styremedlem</button></div></div>`;
};
deviationsTableV1=function(){
  let p=dpV1Ensure(),devs=p.deviations||[];
  return `<table><tr><th>Sak</th><th>Tittel</th><th>Bygg</th><th>Kategori</th><th>Prioritet</th><th>Status</th><th>Handling</th></tr>${devs.map(d=>`<tr><td>${esc(dpFriendlyId(d,'AV',devs))}</td><td>${esc(d.title)}</td><td>${esc(d.building||'-')}</td><td>${esc(d.category||'-')}</td><td><span class="badge ${(d.priority||'').includes('Kritisk')?'bad':'warn'}">${esc(d.priority||'Medium')}</span></td><td>${esc(d.status||'Ny')}</td><td><button class="action" onclick="showDeviation('${esc(dpDbId(d))}')">Åpne</button><button class="action red" onclick="deleteDeviation('${esc(dpDbId(d))}')">Slett</button></td></tr>`).join('')||'<tr><td colspan=7>Ingen avvik registrert.</td></tr>'}</table>`;
};
workOrdersTable=function(){
  let p=ensureCaseCollections();
  return `<table id="woTable"><tr><th>WO</th><th>Eiendom</th><th>Sak/avvik</th><th>Ansvarlig</th><th>Frist</th><th>Status</th><th>Handling</th></tr>${(p.workOrders||[]).map(w=>`<tr><td>${esc(dpFriendlyId(w,'WO',p.workOrders))}</td><td>${esc(p.name)}</td><td>${esc(w.title)}</td><td>${esc(w.owner)}</td><td>${esc(w.due||'-')}</td><td>${esc(w.status)}</td><td><button class="action" onclick="showWorkOrder('${esc(dpDbId(w))}')">Åpne</button><button class="action" onclick="closeWO(this,'${esc(dpDbId(w))}')">Lukk</button><button class="action red" onclick="deleteWorkOrder('${esc(dpDbId(w))}')">Slett</button></td></tr>`).join('')||'<tr><td colspan="7">Ingen arbeidsordre registrert.</td></tr>'}</table>`;
};
showDeviation=function(id,title=''){
  let p=ensureCaseCollections(),d=(p.deviations||[]).find(x=>String(x.id)===String(id)||String(x.technical_id)===String(id)||String(x.display_id)===String(id))||{id,title:title||p.risk,priority:'Kritisk',status:'Ny',description:'Se saken i Driftspartner OS.'};
  showDrawer('Avvik '+dpFriendlyId(d,'AV',p.deviations),`<table><tr><td>Sak</td><td>${esc(dpFriendlyId(d,'AV',p.deviations))}</td></tr>${dpTechnicalRow(dpDbId(d))}<tr><td>Eiendom</td><td>${esc(p.name)}</td></tr><tr><td>Tittel</td><td>${esc(d.title)}</td></tr><tr><td>Prioritet</td><td>${esc(d.priority||'-')}</td></tr><tr><td>Status</td><td>${esc(d.status||'Ny')}</td></tr><tr><td>Beskrivelse</td><td>${esc(d.description||'-')}</td></tr></table><label>Endre status</label><select id="devStatus"><option>Ny</option><option>Pågår</option><option>Venter tilbud</option><option>Utført</option><option>Lukket</option></select><label>Koble bilde/dokument</label><input id="devAttachFile" type="file" accept="image/*,.pdf,.doc,.docx"><button class="action" onclick="updateDeviationStatus('${esc(dpDbId(d))}')">Lagre status</button><button class="action" onclick="attachDeviationDocument('${esc(dpDbId(d))}')">Last opp vedlegg</button><button class="action primary" onclick="showCreateWorkOrder('${esc(dpDbId(d))}')">Lag arbeidsordre</button><button class="action" onclick="showQuoteRequest('${esc(dpDbId(d))}')">Lag tilbudsforespørsel</button><button class="action" onclick="showEmailFlow('deviation','${esc(dpDbId(d))}')">Send e-post</button><button class="action red" onclick="deleteDeviation('${esc(dpDbId(d))}')">Slett avvik</button>`);
};
showWorkOrder=function(id){
  let p=ensureCaseCollections(),w=(p.workOrders||[]).find(x=>String(x.id)===String(id)||String(x.technical_id)===String(id)||String(x.display_id)===String(id))||p.workOrders[0];
  if(!w){showDrawer('Arbeidsordre','<div class="output">Ingen arbeidsordre funnet.</div>');return}
  showDrawer('Arbeidsordre '+dpFriendlyId(w,'WO',p.workOrders),`<table><tr><td>WO</td><td>${esc(dpFriendlyId(w,'WO',p.workOrders))}</td></tr>${dpTechnicalRow(dpDbId(w))}<tr><td>Eiendom</td><td>${esc(p.name)}</td></tr><tr><td>Sak/avvik</td><td>${esc(w.title)}</td></tr><tr><td>Ansvarlig</td><td>${esc(w.owner)}</td></tr><tr><td>Frist</td><td>${esc(w.due||'-')}</td></tr><tr><td>Status</td><td>${esc(w.status)}</td></tr><tr><td>Kilde</td><td>${esc(w.source||'-')}</td></tr></table><button class="action" onclick="showEmailFlow('workorder','${esc(dpDbId(w))}')">Send e-post</button><button class="action" onclick="showQuoteRequest('${esc(dpDbId(w))}')">Lag tilbudsforespørsel</button><button class="action red" onclick="deleteWorkOrder('${esc(dpDbId(w))}')">Slett arbeidsordre</button>`);
};
function dpFinanceTotals(){
  let p=dpEnsureMoneyData(property()),lines=p.budgetLines||[],projects=p.projects||[];
  let budget=lines.reduce((s,x)=>s+(+x.budget||0),0)||projects.reduce((s,x)=>s+(+x.budget||0),0)||(+p.monthlyIncome||0);
  let actual=lines.reduce((s,x)=>s+(+x.actual||0),0)||projects.reduce((s,x)=>s+(+x.actual||0),0)||(+p.monthlyFixedCosts||0);
  return {p,budget,actual,variance:actual-budget,bank:+p.bankBalance||0,reserve:+p.reservedFunds||0,projectFunds:+p.projectFunds||0,available:(+p.bankBalance||0)-(+p.reservedFunds||0)-(+p.projectFunds||0)};
}
function LiveFinanceDashboardCard(){
  let f=dpFinanceTotals(),max=Math.max(f.budget,f.actual,1),bw=Math.max(4,Math.round(f.budget/max*100)),aw=Math.max(4,Math.round(f.actual/max*100));
  return `<div class="ops-panel"><div class="dash-title"><h3>Økonomi live</h3><button class="action" onclick="openMain('finance',null)">Åpne</button></div><div class="ops-budget-summary"><div><small>Konto</small><b>${money(f.bank)}</b></div><div><small>Disponibelt</small><b>${money(f.available)}</b></div><div><small>Avvik</small><b class="${f.variance>0?'warn':'ok'}">${money(f.variance)}</b></div></div><div style="display:grid;gap:12px;margin-top:12px"><div><small class="muted">Budsjett ${money(f.budget)}</small><div style="height:14px;background:#101827;border-radius:999px;overflow:hidden"><span style="display:block;height:100%;width:${bw}%;background:#895dff"></span></div></div><div><small class="muted">Faktisk ${money(f.actual)}</small><div style="height:14px;background:#101827;border-radius:999px;overflow:hidden"><span style="display:block;height:100%;width:${aw}%;background:${f.variance>0?'#f5a400':'#22c55e'}"></span></div></div></div><table><tr><td>Reservefond</td><td>${money(f.reserve)}</td></tr><tr><td>Prosjektmidler</td><td>${money(f.projectFunds)}</td></tr><tr><td>Datakilde</td><td>${isRealSession()?'Supabase property_finance/budget_lines':'Krever live innlogging'}</td></tr></table></div>`;
}
DashboardPage=function(){
  let s=dpLiveDashboardStats(),p=s.p,online=(isRealSession&&isRealSession()&&isUuid(p.id));
  return `<div class="ops-dashboard"><section class="ops-head"><div><h2>Dashboard</h2><p class="muted">${esc(p.name)} · ${online?'live fra Supabase':'ikke live - logg inn ekte'}</p></div><div><button class="action" onclick="hydrateDashboardNow()">${Icon('refresh')} Hent live data</button><button class="action primary" onclick="showCreateDeviation()">${Icon('plus')} Nytt avvik</button></div></section><section class="ops-kpis">${dpLiveKpi('alert','Åpne avvik',s.openDevs,'Fra live avviksliste','blue','showDashboardOpenDeviations()')}${dpLiveKpi('alert','Kritiske avvik',s.critical,'Krever oppfølging','redgrad','showDashboardOpenDeviations()')}${dpLiveKpi('tool','Arbeidsordre',s.openWos,'Åpne/pågående','yellow','showDashboardWorkOrders()')}${dpLiveKpi('briefcase','Konto',money(dpFinanceTotals().bank),'Fra økonomi','greengrad','showDashboardFinance()')}${dpLiveKpi('file','FDV mangler',s.missing.length,'Mapper uten dokument','violet','showDashboardDocuments()')}</section><section class="ops-mid">${OpsPanel('Aktivitet fra valgt eiendom',dpLiveActivityChart(),'wide')}${LiveFinanceDashboardCard()}${OpsPanel('AI Director - basert på live data',dpAiDirectorLive())}</section><section class="ops-quick"><h3>Hurtighandlinger</h3><div>${[['alert','Registrer avvik','showCreateDeviation()'],['tool','Ny arbeidsordre','showCreateWorkOrder()'],['file','Last opp dokument','showUploadFDV()'],['mail','Lag tilbudsforespørsel','showQuoteRequest()'],['chart','Økonomi','openMain("finance",null)'],['users','Styre','openMain("board",null)']].map(x=>`<button class="action" onclick="${x[2]}"><span class="mini-ico blue">${Icon(x[0])}</span>${esc(x[1])}</button>`).join('')}</div></section><section class="ops-bottom">${OpsRows('Avvik',s.devs.slice(0,5).map(d=>['#ff3b45',d.title||'Avvik',d.status||'Ny',dpFriendlyId(d,'AV',s.devs)]),'showDashboardOpenDeviations()')}${OpsRows('Arbeidsordre',s.wos.slice(0,5).map(w=>['#2d72ff',w.title||'Arbeidsordre',w.owner||'-',dpFriendlyId(w,'WO',s.wos)]),'showDashboardWorkOrders()')}${OpsRows('Dokumenter',s.docs.slice(0,5).map(d=>['#22c55e',d.name||d.title||'Dokument',d.folder||d.category||'-',d.status||'Arkivert']),'showDashboardDocuments()')}<section class="ops-panel"><h3>Produksjonsstatus</h3><p class="muted">${online?'Valgt eiendom er live. Endringer skal lagres i Supabase.':'Du ser ikke full live-modus. Logg inn med Supabase og velg Supabase-eiendom.'}</p><button class="action primary" onclick="openMain('admin',null);openTab('Fullsjekk')">Fullsjekk</button></section></section></div>`;
};
saveBoardMember=async function(){
  let p=ensurePropertyData(property());
  let m={name:document.getElementById('boardName').value.trim(),role:document.getElementById('boardRole').value.trim()||'Styremedlem',email:document.getElementById('boardEmail').value.trim(),phone:document.getElementById('boardPhone').value.trim(),notes:document.getElementById('boardNotes').value.trim()};
  if(!m.name){showDrawer('Mangler navn','<div class="output">Skriv inn navn på styremedlemmet.</div>');return}
  if(!m.email.includes('@')){showDrawer('Mangler e-post','<div class="output">Styremedlem må ha gyldig e-post.</div>');return}
  try{
    if(isRealSession()){
      let r=await supabaseClient().from('board_members').insert({property_id:p.id,name:m.name,role:m.role,email:m.email,phone:m.phone,notes:m.notes,created_by:user().id}).select().single();
      if(r.error)throw r.error;
      m.id=r.data.id;
    }else if(state.currentUserRecord){
      throw new Error('Valgt eiendom er ikke Supabase-eiendom.');
    }
  }catch(e){showDrawer('Styremedlem ble ikke lagret',`<div class="output">${esc(e.message)}</div><p class="muted">Kjør driftspartner-live-board-members.sql hvis tabellen mangler.</p>`);return}
  p.boardMembers.push(m);logActivity(`Styremedlem lagt til: ${m.name}`,'Styre');openTab('Styreoversikt');act('Styremedlem lagt til');
};
const dpHydrateBoardMembersBase=hydrateCurrentPropertyData;
hydrateCurrentPropertyData=async function(db=supabaseClient()){
  let p=await dpHydrateBoardMembersBase(db),errors=p?.liveErrors||[];
  if(!p||!isUuid(p.id))return p;
  let members=await dpQueryLive(db,'board_members',()=>db.from('board_members').select('*').eq('property_id',p.id).order('created_at',{ascending:true}).limit(100),errors);
  if(members)p.boardMembers=members.map(m=>({id:m.id,name:m.name,role:m.role,email:m.email,phone:m.phone,notes:m.notes,periodStart:m.period_start,periodEnd:m.period_end}));
  p.liveErrors=[...new Set(errors)];
  return p;
};
roleMenus.beboer=['home','property','operations','portal'];
roleMenus.styremedlem=['home','property','board','cloud'];
roleMenus.forvalter=['home','property','operations','finance','board','market','cloud','admin'];
function dpRoleOptions(){
  return [
    ['beboer','Beboer'],
    ['styreleder','Styreleder'],
    ['styremedlem','Styremedlem'],
    ['vaktmester','Vaktmester'],
    ['leverandør','Leverandør'],
    ['forvalter','Forvalter'],
    ['superadmin','Superadmin']
  ];
}
function dpAccessRoleForAppRole(role){
  let r=normalizeRole(role);
  if(r==='superadmin'||r==='forvalter'||r==='styreleder')return 'owner';
  if(r==='leverandør'||r==='leverandor')return 'vendor';
  if(r==='vaktmester')return 'caretaker';
  if(r==='beboer')return 'resident';
  return 'member';
}
function dpUserTypeLabel(role){
  return (dpRoleOptions().find(x=>x[0]===role||normalizeRole(x[0])===normalizeRole(role))||[role,role])[1];
}
function dpPropertyOptions(selected=property()?.id){
  return state.properties.map(p=>`<option value="${esc(p.id)}" ${p.id===selected?'selected':''}>${esc(p.name)}</option>`).join('');
}
usersAdmin=function(){
  let rows=state.users.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(dpUserTypeLabel(u.role))}</td><td>${esc(u.email||'-')}</td><td>${esc(u.phone||'-')}</td><td>${u.role==='superadmin'?'Alle':state.properties.filter(p=>(u.properties||[]).includes(p.id)).map(p=>esc(p.name)).join(', ')||'-'}</td><td><button class="action" onclick="showEditUserAccess('${esc(u.id)}')">Tilgang</button></td></tr>`).join('');
  return `<div class="grid"><div class="card s12"><div class="dash-title"><div><h3>Brukere og roller</h3><p class="muted">Opprett beboere, styre, vaktmestere, leverandører og forvaltere. Brukeren kobles til valgt eiendom.</p></div><button class="action" onclick="refreshAccessOverview()">Hent fra Supabase</button></div></div><div class="card s8"><h3>Brukere</h3><table><tr><th>Navn</th><th>Rolle</th><th>E-post</th><th>Telefon</th><th>Eiendommer</th><th>Handling</th></tr>${rows||'<tr><td colspan="6">Ingen brukere hentet.</td></tr>'}</table></div><div class="card s4"><h3>Opprett bruker</h3><label>Navn</label><input id="newUserName" value=""><label>E-post</label><input id="newUserEmail" value="" placeholder="navn@domene.no"><label>Telefon</label><input id="newUserPhone" value=""><label>Rolle</label><select id="newUserRole" onchange="syncAccessRoleFromUserRole()">${dpRoleOptions().map(r=>`<option value="${r[0]}">${r[1]}</option>`).join('')}</select><label>Eiendom</label><select id="newUserProperty">${dpPropertyOptions()}</select><label>Tilgangsnivå</label><select id="newUserAccessRole"><option value="resident">Beboer</option><option value="member">Medlem/styre</option><option value="caretaker">Vaktmester</option><option value="vendor">Leverandør</option><option value="owner">Eier/admin</option><option value="readonly">Kun lesing</option></select><label>Midlertidig passord</label><input id="newUserPassword" type="password" placeholder="La stå tom for automatisk"><button class="action primary" onclick="saveUser()">Opprett bruker</button><div id="newUserOut" class="output">Publisert Netlify-side bruker Supabase Auth. Lokalt kan ikke Auth-bruker opprettes.</div></div></div>`;
};
function syncAccessRoleFromUserRole(){
  let role=document.getElementById('newUserRole')?.value,access=document.getElementById('newUserAccessRole');
  if(access)access.value=dpAccessRoleForAppRole(role);
}
function showEditUserAccess(id){
  let u=state.users.find(x=>String(x.id)===String(id));
  if(!u)return;
  showDrawer('Brukertilgang',`<table><tr><td>Navn</td><td>${esc(u.name)}</td></tr><tr><td>Rolle</td><td>${esc(dpUserTypeLabel(u.role))}</td></tr><tr><td>E-post</td><td>${esc(u.email||'-')}</td></tr><tr><td>Eiendommer</td><td>${state.properties.filter(p=>(u.properties||[]).includes(p.id)).map(p=>esc(p.name)).join('<br>')||'-'}</td></tr></table><p class="muted">Endring av eksisterende tilgang gjøres foreløpig i Admin > Tilganger eller ved å opprette ny tilgang for samme e-post.</p>`);
}
async function saveUser(){
  let name=document.getElementById('newUserName').value.trim(),email=document.getElementById('newUserEmail').value.trim(),phone=document.getElementById('newUserPhone').value.trim(),role=document.getElementById('newUserRole').value,property_id=document.getElementById('newUserProperty').value,access_role=document.getElementById('newUserAccessRole').value,password=document.getElementById('newUserPassword').value,out=document.getElementById('newUserOut');
  if(!name||!email.includes('@')||!property_id){showDrawer('Mangler info','<div class="output">Fyll inn navn, gyldig e-post og eiendom.</div>');return}
  if(!state.currentUserRecord){showDrawer('Krever ekte innlogging','<div class="output">Du må være innlogget med Supabase som superadmin for å opprette brukere.</div>');return}
  if(location.protocol==='file:'){showDrawer('Må kjøres online','<div class="output">Brukeropprettelse krever Netlify backendfunksjon. Publiser siden og bruk https://fdv.driftspartnernord.no.</div>');return}
  try{
    if(out)out.textContent='Oppretter bruker i Supabase Auth...';
    let session=await supabaseClient().auth.getSession();
    let token=session?.data?.session?.access_token;
    if(!token)throw new Error('Fant ikke innloggings-token. Logg inn på nytt.');
    let res=await fetch('/.netlify/functions/create-user',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({name,email,phone,role,property_id,access_role,password})});
    let data=await res.json().catch(()=>({ok:false,message:'Kunne ikke lese svar fra backend'}));
    if(!data.ok)throw new Error(data.message||'Bruker ble ikke opprettet.');
    let local={id:data.user.id,name,email,phone,role:normalizeRole(role),org:'Supabase',properties:[property_id]};
    let existing=state.users.find(u=>u.email?.toLowerCase()===email.toLowerCase());
    if(existing)Object.assign(existing,local);else state.users.push(local);
    logActivity('Bruker opprettet',email);
    showDrawer('Bruker opprettet',`<table><tr><td>Navn</td><td>${esc(name)}</td></tr><tr><td>Rolle</td><td>${esc(dpUserTypeLabel(role))}</td></tr><tr><td>E-post</td><td>${esc(email)}</td></tr><tr><td>Eiendom</td><td>${esc(state.properties.find(p=>p.id===property_id)?.name||property_id)}</td></tr><tr><td>Tilgang</td><td>${esc(access_role)}</td></tr>${data.temporaryPassword?`<tr><td>Midlertidig passord</td><td><strong>${esc(data.temporaryPassword)}</strong></td></tr>`:''}</table><div class="output">Send innloggingsinformasjon til brukeren på trygg måte. Brukeren kan bytte passord via Supabase magic link eller reset password.</div>`);
    current='admin';renderTabs();openTab('Brukere');
  }catch(e){
    if(out)out.textContent='FEIL: '+e.message;
    showDrawer('Bruker ble ikke opprettet',`<div class="output">${esc(e.message)}</div><p class="muted">Sjekk at Netlify har SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY under Functions environment.</p>`);
  }
}
authAccessPage=function(){
  return `<div class="grid"><div class="card s12"><div class="dash-title"><h3>Auth og tilgang per eiendom</h3><div><button class="action" onclick="refreshAccessOverview()">Oppdater</button><button class="action primary" onclick="showLogin()">Test ekte innlogging</button></div></div><p class="muted">Brukere opprettes nå under Admin > Brukere. Denne siden viser og feilsøker app_users/property_access.</p><div id="accessStatus" class="output">${authStatusText()}</div></div><div class="card s12"><h3>Tilganger</h3><div id="accessList">${accessTable()}</div></div></div>`;
};
app.admin.tabs['Brukere']=()=>usersAdmin();
app.admin.tabs['Tilganger']=()=>authAccessPage();
