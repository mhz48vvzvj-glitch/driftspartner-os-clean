/* Driftspartner OS module: 62-dashboard-live-only-hydration.js
   No-test dashboard guards, live-only hydration, login and property loading.
   Source: 60-dashboard-market-economy.js:97-206
*/
function dpStripDashboardTestData(p=property()){
  if(!p||!isUuid(p.id))return p;
  p.deviations=(Array.isArray(p.deviations)?p.deviations:[]).filter(d=>d.id&&String(d.id).length>20);
  p.workOrders=(Array.isArray(p.workOrders)?p.workOrders:[]).filter(w=>w.id&&String(w.id).length>20&&w.source!=='Test');
  p.documents=(Array.isArray(p.documents)?p.documents:[]).filter(d=>d.id||d.path||d.storage_path);
  p.offers=(Array.isArray(p.offers)?p.offers:[]).filter(o=>o.id&&String(o.id).length>20);
  p.quoteRequests=(Array.isArray(p.quoteRequests)?p.quoteRequests:[]).filter(q=>q.id&&String(q.id).length>20);
  p.activity=(Array.isArray(p.activity)?p.activity:[]).filter(a=>a.source!=='Test'&&a.action!=='Eiendom åpnet'&&a.actor!=='System');
  p.invoiceBasis=(Array.isArray(p.invoiceBasis)?p.invoiceBasis:[]).filter(x=>x.id&&String(x.id).length>20);
  p.invoice=p.invoiceBasis.reduce((sum,x)=>sum+(+x.total||0),0);
  p.dev=p.deviations.length;
  p.wo=p.workOrders.length;
  p.openCases=p.deviations.filter(d=>!['Lukket','Ferdig','Utført','Fullført'].includes(d.status||'')).length;
  p._dashboardLiveOnly=true;
  return p;
}
const dpHydrateNoDashboardTestBase=hydrateCurrentPropertyData;
hydrateCurrentPropertyData=async function(db=supabaseClient()){
  let p=await dpHydrateNoDashboardTestBase(db);
  return dpStripDashboardTestData(p);
};
const dpStatsNoDashboardTestBase=dpLiveDashboardStats;
dpLiveDashboardStats=function(){
  if(dpLiveOnlyStatus())dpStripDashboardTestData(property());
  return dpStatsNoDashboardTestBase();
};
const dpRenderPropertyContextNoTestBase=renderPropertyContext;
renderPropertyContext=function(){
  if(dpLiveOnlyStatus())dpStripDashboardTestData(property());
  return dpRenderPropertyContextNoTestBase();
};
function dpUuidRows(rows){
  return (Array.isArray(rows)?rows:[]).filter(x=>x&&isUuid(x.id||x.technical_id));
}
function dpLiveRawDashboardData(){
  let p=property();
  if(!dpLiveOnlyStatus())return {p,online:false,devs:[],wos:[],docs:[],rfqs:[],offers:[],activity:[],finance:{},budgetLines:[],projects:[]};
  dpStripDashboardTestData(p);
  return {
    p,online:true,
    devs:dpUuidRows(p.deviations),
    wos:dpUuidRows(p.workOrders),
    docs:dpUuidRows(p.documents),
    rfqs:dpUuidRows(p.quoteRequests),
    offers:dpUuidRows(p.offers),
    activity:(Array.isArray(p.activity)?p.activity:[]).filter(a=>isUuid(a.id)||isUuid(a.caseId)||isUuid(a.entity_id)),
    finance:{bank:+p.bankBalance||0,reserve:+p.reservedFunds||0,projectFunds:+p.projectFunds||0,income:+p.monthlyIncome||0,costs:+p.monthlyFixedCosts||0},
    budgetLines:dpUuidRows(p.budgetLines),
    projects:dpUuidRows(p.projects)
  };
}
function dpRawLiveKpi(icon,title,value,sub,theme,action){
  return `<button class="ops-kpi" onclick="${action}"><span class="mini-ico ${theme}">${Icon(icon)}</span><small>${esc(title)}</small><b>${esc(value)}</b><em>${esc(sub)}</em></button>`;
}
function dpRawRows(rows,type){
  if(!rows.length)return '<p class="muted">Ingen live-rader i Supabase.</p>';
  return rows.slice(0,5).map(r=>{
    let title=r.title||r.name||r.label||r.action||'Live-rad';
    let sub=type==='dev'?`${r.priority||'-'} · ${r.status||'Ny'}`:type==='wo'?`${r.owner||'-'} · ${r.status||'-'}`:type==='doc'?`${r.category||r.type||'-'} · ${r.status||'Arkivert'}`:r.status||r.created_at||'-';
    return `<div class="ops-row"><span class="task-dot" style="background:#2d72ff"></span><div><strong>${esc(title)}</strong><br><small class="muted">${esc(sub)}</small></div><b>${esc(dpFriendlyId?dpFriendlyId(r,type==='wo'?'WO':type==='dev'?'AV':'ID',rows):String(r.id).slice(0,8))}</b></div>`;
  }).join('');
}
function dpRawFinancePanel(d){
  let budget=d.budgetLines.reduce((s,x)=>s+(+x.budget||+x.budget_amount||0),0)||d.projects.reduce((s,x)=>s+(+x.budget||+x.budget_amount||0),0);
  let actual=d.budgetLines.reduce((s,x)=>s+(+x.actual||+x.actual_amount||0),0)||d.projects.reduce((s,x)=>s+(+x.actual||+x.actual_amount||0),0);
  let variance=actual-budget;
  return `<div class="ops-panel"><div class="dash-title"><h3>Økonomi live</h3><button class="action" onclick="openMain('finance',null);openTab('DB/kundeøkonomi')">Åpne</button></div><div class="ops-budget-summary"><div><small>Konto</small><b>${money(d.finance.bank)}</b></div><div><small>Budsjett</small><b>${money(budget)}</b></div><div><small>Avvik</small><b>${money(variance)}</b></div></div><p class="muted">Kun property_finance, budget_lines og projects telles her.</p></div>`;
}
DashboardPage=function(){
  let d=dpLiveRawDashboardData(),p=d.p;
  if(!d.online){
    return `<div class="ops-dashboard"><section class="ops-head"><div><h2>Dashboard</h2><p class="muted">Ikke live. Logg inn med Supabase og velg en Supabase-eiendom.</p></div><button class="action primary" onclick="showLogin()">Logg inn</button></section><section class="ops-panel"><h3>Ingen live-data vises</h3><p class="muted">Dashboardet viser ikke ikke-verifiserte tall i denne visningen.</p></section></div>`;
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
  return `<div class="ops-dashboard"><section class="ops-head"><div><h2>Dashboard</h2><p class="muted">${esc(p.name)} · KUN live Supabase-rader · sist hentet ${esc(p.liveCheckedAt||'ikke hentet')}</p>${dpLiveErrorPanel()}</div><div><button class="action" onclick="hydrateDashboardNow()">${Icon('refresh')} Hent live data</button><button class="action" onclick="openMain('admin',null);openTab('Fullsjekk')">Fullsjekk</button><button class="action primary" onclick="showCreateDeviation()">${Icon('plus')} Nytt avvik</button></div></section><section class="ops-kpis">${dpRawLiveKpi('alert','Åpne avvik',openDevs,'deviations','blue','showDashboardOpenDeviations()')}${dpRawLiveKpi('alert','Kritiske avvik',critical,'deviations.priority','redgrad','showDashboardOpenDeviations()')}${dpRawLiveKpi('tool','Arbeidsordre',openWos,'work_orders','yellow','showDashboardWorkOrders()')}${dpRawLiveKpi('file','Dokumenter',d.docs.length,'documents','violet','showDashboardDocuments()')}${dpRawLiveKpi('mail','Tilbud/RFQ',`${d.offers.length}/${d.rfqs.length}`,'offers / quote_requests','blue','showDashboardQuotes()')}${dpRawLiveKpi('briefcase','Konto',money(d.finance.bank),'property_finance','greengrad','showDashboardFinance()')}</section><section class="ops-mid">${dpRawFinancePanel(d)}<div class="ops-panel"><h3>Avvik fordelt på kategori</h3>${catRows}</div><div class="ops-panel"><h3>AI Director - kun live regler</h3>${aiItems.map(x=>`<div class="os-rec"><span class="mini-ico ${x.includes('Ingen')?'greengrad':'yellow'}">${Icon(x.includes('Ingen')?'check':'alert')}</span><div><strong>${esc(x)}</strong><br><small class="muted">Basert på live-tabeller, ikke lokal data.</small></div></div>`).join('')}</div></section><section class="ops-quick"><h3>Hurtighandlinger</h3><div>${[['alert','Registrer avvik','showCreateDeviation()'],['tool','Ny arbeidsordre','showCreateWorkOrder()'],['file','Last opp dokument','showUploadFDV()'],['mail','Lag tilbudsforespørsel','showQuoteRequest()'],['chart','Økonomi','openMain("finance",null);openTab("DB/kundeøkonomi")'],['users','Styre','openMain("board",null)']].map(x=>`<button class="action" onclick="${x[2]}"><span class="mini-ico blue">${Icon(x[0])}</span>${esc(x[1])}</button>`).join('')}</div></section><section class="ops-bottom"><section class="ops-panel"><div class="dash-title"><h3>Live avvik</h3><button class="action" onclick="showDashboardOpenDeviations()">Åpne</button></div>${dpRawRows(d.devs,'dev')}</section><section class="ops-panel"><div class="dash-title"><h3>Live arbeidsordre</h3><button class="action" onclick="showDashboardWorkOrders()">Åpne</button></div>${dpRawRows(d.wos,'wo')}</section><section class="ops-panel"><div class="dash-title"><h3>Live dokumenter</h3><button class="action" onclick="showDashboardDocuments()">Åpne</button></div>${dpRawRows(d.docs,'doc')}</section><section class="ops-panel"><h3>Datastatus</h3><p class="muted">Denne dashboardversjonen bruker ikke risk, invoice, openCases, dev, wo eller andre gamle eldre felt.</p><button class="action primary" onclick="hydrateDashboardNow()">Oppdater nå</button></section></section></div>`;
};
showLogin=function(){
  showDrawer('Logg inn',`<div class="grid"><div class="card s12 login-box"><h3>Ekte innlogging</h3><p class="muted">Supabase-innlogging er fjernet. Systemet skal ikke vise ikke-verifiserte dashboardtall.</p><label>E-post</label><input id="authEmail" value=""><label>Passord</label><input id="authPassword" type="password" value=""><button class="action primary" onclick="loginSupabase()">Logg inn med Supabase</button><div id="authOut" class="output">Bruker må finnes i Supabase Auth og app_users, og ha tilgang til minst én Supabase-eiendom.</div></div></div>`);
};
loginDisabled=function(){
  showDrawer('Supabase-innlogging er deaktivert',`<div class="output">Supabase-innlogging er slått av fordi dashboardet bare skal vise ekte Supabase-data. Logg inn med Supabase.</div><button class="action primary" onclick="showLogin()">Åpne innlogging</button>`);
};
loadPropertiesForCurrentUser=async function(db,profile){
  let role=normalizeRole(profile.role),props=[];
  if(role==='superadmin'){
    let {data,error}=await db.from('properties').select('*, customers(name)').limit(200);
    if(error)throw error;
    props=(data||[]).map(mapSupabaseProperty);
  }else{
    let {data,error}=await db.from('property_access').select('access_role, properties(*, customers(name))').eq('user_id',profile.id);
    if(error)throw error;
    props=(data||[]).map(r=>r.properties).filter(Boolean).map(mapSupabaseProperty);
  }
  if(!props.length)throw new Error('Fant ingen Supabase-eiendom for brukeren. Opprett property_access eller eiendom i Supabase.');
  state.properties=props;
  state.users[0].properties=props.map(p=>p.id);
  state.selectedProperty=props[0].id;
  await hydrateCurrentPropertyData(db);
  dpStripDashboardTestData(property());
};
