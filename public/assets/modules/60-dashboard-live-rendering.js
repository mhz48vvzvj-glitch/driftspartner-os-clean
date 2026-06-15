/* Driftspartner OS module: 60-dashboard-live-rendering.js
   Strict live dashboard cards, stats, finance and error rendering.
   Source: 60-dashboard-market-economy.js:1-87
*/
/* Driftspartner OS module: 60-dashboard-market-economy.js
   Generated from driftspartner-property-os.js. Keep classic script order in HTML. */
function dpLiveOnlyStatus(){
  let p=property();
  return !!(isRealSession&&isRealSession()&&isUuid(p.id));
}
function dpNoDataText(text){
  return `<p class="muted">${esc(text)}</p>`;
}
function dpLiveBudgetSeries(){
  let p=dpEnsureMoneyData(property()),lines=p.budgetLines||[],projects=p.projects||[];
  if(lines.length)return lines.slice(0,6).map(x=>({label:x.label||x.category||'Linje',budget:+x.budget||0,actual:+x.actual||0}));
  if(projects.length)return projects.slice(0,6).map(x=>({label:x.name||'Prosjekt',budget:+x.budget||0,actual:+x.actual||0}));
  if((+p.monthlyIncome||0)||(+p.monthlyFixedCosts||0))return [{label:'Måned',budget:+p.monthlyIncome||0,actual:+p.monthlyFixedCosts||0}];
  return [];
}
function dpLiveCostVsBudgetCard(){
  let rows=dpLiveBudgetSeries(),budget=rows.reduce((s,x)=>s+x.budget,0),actual=rows.reduce((s,x)=>s+x.actual,0),variance=actual-budget,max=Math.max(...rows.flatMap(x=>[x.budget,x.actual]),budget,actual,1);
  let bars=rows.map(x=>{
    let bw=Math.round((x.budget/max)*100),aw=Math.round((x.actual/max)*100);
    return `<div class="ops-row"><div style="min-width:110px"><strong>${esc(x.label)}</strong></div><div style="flex:1;display:grid;gap:5px"><div title="Faktisk ${money(x.actual)}" style="height:10px;background:#101827;border-radius:999px;overflow:hidden"><span style="display:block;width:${aw}%;height:100%;background:#895dff"></span></div><div title="Budsjett ${money(x.budget)}" style="height:10px;background:#101827;border-radius:999px;overflow:hidden"><span style="display:block;width:${bw}%;height:100%;background:#7dd3fc"></span></div></div><b>${money(x.actual-x.budget)}</b></div>`;
  }).join('');
  return `<div class="ops-panel"><div class="dash-title"><h3>Kostnader vs budsjett</h3><button class="action" onclick="openMain('finance',null);openTab('DB/kundeøkonomi')">Oppdater</button></div><div class="ops-budget-summary"><div><small>Faktisk</small><b>${money(actual)}</b></div><div><small>Budsjett</small><b>${money(budget)}</b></div><div><small>Avvik</small><b class="${variance>0?'warn':'ok'}">${money(variance)}</b></div></div><div class="legend"><span><i class="dot" style="background:#895dff"></i>Faktisk</span><span><i class="dot" style="background:#7dd3fc"></i>Budsjett</span></div>${rows.length?`<div style="display:grid;gap:8px;margin-top:10px">${bars}</div>`:dpNoDataText('Ingen budsjettlinjer eller prosjektøkonomi registrert ennå.')}</div>`;
}
function dpLiveDeviationCategoriesCard(){
  let s=dpLiveDashboardStats(),counts={};
  s.devs.forEach(d=>{let key=d.category||d.type||'Ikke kategorisert';counts[key]=(counts[key]||0)+1});
  let entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  return `<div class="ops-panel"><div class="dash-title"><h3>Avvik fordelt på kategori</h3><button class="action" onclick="openMain('operations',null);openTab('Avvik')">Åpne</button></div>${entries.length?entries.map(([name,count])=>`<div class="ops-row"><span class="task-dot" style="background:#895dff"></span><div><strong>${esc(name)}</strong><br><small class="muted">${Math.round(count/Math.max(1,s.devs.length)*100)} % av registrerte avvik</small></div><b>${count}</b></div>`).join(''):dpNoDataText('Ingen avvik registrert på valgt eiendom.')}</div>`;
}
function dpLiveRecentRows(items,type){
  if(!items.length)return dpNoDataText(type==='wo'?'Ingen arbeidsordre registrert.':'Ingen dokumenter registrert.');
  return items.slice(0,5).map((x,i)=>{
    let title=type==='wo'?(x.title||x.case||'Arbeidsordre'):(x.name||x.title||'Dokument');
    let sub=type==='wo'?(x.owner||x.status||'-'):(x.folder||x.category||x.type||'-');
    let badge=type==='wo'?(x.status||dpFriendlyId(x,'WO',items)):(x.status||'Arkivert');
    return `<div class="ops-row"><span class="task-dot" style="background:${type==='wo'?'#2d72ff':'#22c55e'}"></span><div><strong>${esc(title)}</strong><br><small class="muted">${esc(sub)}</small></div><b>${esc(badge)}</b></div>`;
  }).join('');
}
function dpAiDirectorLiveStrict(){
  let s=dpLiveDashboardStats(),f=dpFinanceTotals(),items=[];
  if(s.critical>0)items.push(['Kritiske avvik må prioriteres',`${s.critical} åpne kritiske avvik`, 'showDashboardOpenDeviations()']);
  if(s.openWos>0)items.push(['Arbeidsordre må følges opp',`${s.openWos} åpne/pågående`, 'showDashboardWorkOrders()']);
  if(s.missing.length>0)items.push(['FDV mangler dokumentasjon',`${s.missing.length} mapper uten dokument`, 'showDashboardDocuments()']);
  if(f.variance>0)items.push(['Budsjettavvik',`${money(f.variance)} over budsjett`, 'showDashboardFinance()']);
  if(!items.length)items.push(['Ingen kritiske funn', 'Basert på registrerte data nå', 'openMain("admin",null);openTab("Fullsjekk")']);
  return items.map(x=>`<div class="os-rec" onclick="${x[2]}"><span class="mini-ico ${x[0].includes('Ingen')?'greengrad':'yellow'}">${Icon(x[0].includes('Ingen')?'check':'alert')}</span><div><strong>${esc(x[0])}</strong><br><small class="muted">${esc(x[1])}</small></div></div>`).join('');
}
const dpLiveDashboardStatsBase=dpLiveDashboardStats;
dpLiveDashboardStats=function(){
  if(!dpLiveOnlyStatus())return dpLiveDashboardStatsBase();
  let p=property();
  let devs=Array.isArray(p.deviations)?p.deviations.filter(d=>d.id&&String(d.id).length>20):[];
  let wos=Array.isArray(p.workOrders)?p.workOrders.filter(w=>w.source!=='Test'&&w.id&&String(w.id).length>20):[];
  let docs=Array.isArray(p.documents)?p.documents.filter(d=>d.id||d.path||d.storage_path):[];
  let offers=Array.isArray(p.offers)?p.offers.filter(o=>o.id&&String(o.id).length>20):[];
  let rfqs=Array.isArray(p.quoteRequests)?p.quoteRequests.filter(q=>q.id&&String(q.id).length>20):[];
  let activity=Array.isArray(p.activity)?p.activity.filter(a=>a.source!=='Test'&&a.action!=='Eiendom åpnet'):[];
  let suppliers=Array.isArray(state.suppliers)?state.suppliers.filter(s=>s.id&&String(s.id).length>20):[];
  let folders=Array.isArray(p.fdvFolders)?p.fdvFolders:[];
  let missing=folders.filter(f=>!docs.some(d=>String(d.folder||d.type||d.category||'').toLowerCase().includes(String(f).toLowerCase())));
  let closed=['lukket','ferdig','utført','utfort','fullført','fullfort'];
  let openDevs=devs.filter(d=>!closed.includes(String(d.status||'').toLowerCase())).length;
  let openWos=wos.filter(w=>!closed.includes(String(w.status||'').toLowerCase())).length;
  let critical=devs.filter(d=>String(d.priority||'').toLowerCase().includes('kritisk')&&!closed.includes(String(d.status||'').toLowerCase())).length;
  let finance={bankBalance:+p.bankBalance||0,reservedFunds:+p.reservedFunds||0,projectFunds:+p.projectFunds||0,monthlyIncome:+p.monthlyIncome||0,monthlyFixedCosts:+p.monthlyFixedCosts||0};
  return {p,devs,wos,docs,offers,rfqs,activity,suppliers,finance,critical,openDevs,openWos,missing};
};
const dpFinanceTotalsBase=dpFinanceTotals;
dpFinanceTotals=function(){
  if(!dpLiveOnlyStatus())return dpFinanceTotalsBase();
  let p=property(),lines=Array.isArray(p.budgetLines)?p.budgetLines:[],projects=Array.isArray(p.projects)?p.projects:[];
  let budget=lines.reduce((s,x)=>s+(+x.budget||0),0)||projects.reduce((s,x)=>s+(+x.budget||0),0)||(+p.monthlyIncome||0);
  let actual=lines.reduce((s,x)=>s+(+x.actual||0),0)||projects.reduce((s,x)=>s+(+x.actual||0),0)||(+p.monthlyFixedCosts||0);
  return {p,budget,actual,variance:actual-budget,bank:+p.bankBalance||0,reserve:+p.reservedFunds||0,projectFunds:+p.projectFunds||0,available:(+p.bankBalance||0)-(+p.reservedFunds||0)-(+p.projectFunds||0)};
};
function dpLiveErrorPanel(){
  let p=property(),errors=p.liveErrors||[];
  if(!dpLiveOnlyStatus())return '';
  if(!errors.length)return '<span class="badge ok">Live OK</span>';
  return `<span class="badge bad">Live-feil</span><p class="muted">${esc(errors.join(' | '))}</p>`;
}
DashboardPage=function(){
  let s=dpLiveDashboardStats(),p=s.p,online=dpLiveOnlyStatus(),f=dpFinanceTotals();
  let openCases=s.openDevs+s.openWos;
  return `<div class="ops-dashboard"><section class="ops-head"><div><h2>Dashboard</h2><p class="muted">${esc(p.name)} · ${online?'kun live Supabase-tall':'ikke live - logg inn og velg Supabase-eiendom'}</p>${dpLiveErrorPanel()}</div><div><button class="action" onclick="hydrateDashboardNow()">${Icon('refresh')} Hent live data</button><button class="action" onclick="openMain('admin',null);openTab('Fullsjekk')">Fullsjekk</button><button class="action primary" onclick="showCreateDeviation()">${Icon('plus')} Nytt avvik</button></div></section><section class="ops-kpis">${dpLiveKpi('alert','Åpne avvik',s.openDevs,'Kun fra deviations','blue','showDashboardOpenDeviations()')}${dpLiveKpi('alert','Kritiske avvik',s.critical,'Kun fra deviations','redgrad','showDashboardOpenDeviations()')}${dpLiveKpi('tool','Arbeidsordre',s.openWos,'Kun fra work_orders','yellow','showDashboardWorkOrders()')}${dpLiveKpi('briefcase','Budsjettavvik',money(f.variance),'Kun fra økonomi','greengrad','showDashboardFinance()')}${dpLiveKpi('file','Dokumenter',s.docs.length,`${s.missing.length} FDV-mangler`,'violet','showDashboardDocuments()')}${dpLiveKpi('mail','Tilbud/RFQ',`${s.offers.length}/${s.rfqs.length}`,'Kun fra tilbudstabeller','blue','showDashboardQuotes()')}</section><section class="ops-mid">${dpLiveCostVsBudgetCard()}${dpLiveDeviationCategoriesCard()}<div class="ops-panel"><h3>AI Director - live anbefalinger</h3>${dpAiDirectorLiveStrict()}</div></section><section class="ops-quick"><h3>Hurtighandlinger</h3><div>${[['alert','Registrer avvik','showCreateDeviation()'],['tool','Ny arbeidsordre','showCreateWorkOrder()'],['file','Last opp dokument','showUploadFDV()'],['mail','Lag tilbudsforespørsel','showQuoteRequest()'],['chart','Økonomi','openMain("finance",null);openTab("DB/kundeøkonomi")'],['users','Styre','openMain("board",null)'],['bell','Varsler','openTabSafe("Varsler")'],['building','Bygg','openPropertyTabV1("Bygg")']].map(x=>`<button class="action" onclick="${x[2]}"><span class="mini-ico blue">${Icon(x[0])}</span>${esc(x[1])}</button>`).join('')}</div></section><section class="ops-bottom"><section class="ops-panel"><div class="dash-title"><h3>Nylige arbeidsordre</h3><button class="action" onclick="showDashboardWorkOrders()">Åpne</button></div>${dpLiveRecentRows(s.wos,'wo')}</section><section class="ops-panel"><div class="dash-title"><h3>Dokumenter - nylig oppdatert</h3><button class="action" onclick="showDashboardDocuments()">Åpne</button></div>${dpLiveRecentRows(s.docs,'docs')}</section><section class="ops-panel"><h3>Eiendom - status</h3><div class="ops-row"><span class="task-dot" style="background:${s.critical?'#ff3b45':'#22c55e'}"></span><div><strong>${esc(p.name)}</strong><br><small class="muted">${esc(p.address||'Ingen adresse registrert')}</small></div><b>${s.critical?'Krever tiltak':'Normal'}</b></div><div class="ops-budget-summary"><div><small>Åpne saker</small><b>${openCases}</b></div><div><small>Konto</small><b>${money(f.bank)}</b></div><div><small>Fakturaklart</small><b>${money(p.invoice||0)}</b></div></div></section><section class="ops-panel"><h3>Datastatus</h3><p class="muted">${online?'Ingen test-fallback brukes på dashboardet. Mangler data, vises 0 eller tom liste.':'Dette er ikke live før du er innlogget online og eiendommen har UUID fra Supabase.'}</p><button class="action primary" onclick="hydrateDashboardNow()">Oppdater nå</button></section></section><section class="ops-command"><div class="kpi-icon violet">${Icon('brain')}</div><strong>AI Director</strong><input placeholder="Spør om ${esc(p.name)}..." onkeydown="if(event.key==='Enter')showBrainAnswer()"><button class="action" onclick="showPriorities()">Prioriter</button><button class="action" onclick="showHealthReport()">Rapport</button><button class="action" onclick="showDashboardActivity()">Aktivitet</button></section></div>`;
};
