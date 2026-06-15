/* Driftspartner OS module: 44-live-dashboard-actions.js
   Live dashboard refresh, KPI actions, tables and dashboard page.
   Source: 43-build-order-live-dashboard-checks.js:53-116
*/

async function hydrateDashboardNow(){
  try{if(isRealSession&&isRealSession()&&isUuid(property().id))await hydrateCurrentPropertyData(supabaseClient())}catch(e){showDrawer('Kunne ikke hente live data',`<div class="output">${esc(e.message)}</div>`);return}
  refresh();
}
function dpLiveDashboardStats(){
  let p=dpV1Ensure(),devs=p.deviations||[],wos=p.workOrders||[],docs=p.documents||[],offers=p.offers||[],rfqs=p.quoteRequests||[],activity=p.activity||[],suppliers=state.suppliers||[],finance=dpEnsureMoneyData(p),critical=devs.filter(d=>String(d.priority||'').toLowerCase().includes('kritisk')&&d.status!=='Lukket').length,openDevs=devs.filter(d=>d.status!=='Lukket').length,openWos=wos.filter(w=>!['Lukket','Ferdig','Fullfort','Fullført'].includes(w.status||'')).length,missing=(p.fdvFolders||[]).filter(f=>!docs.some(d=>String(d.folder||d.type||d.category||'').toLowerCase().includes(f.toLowerCase())));
  return {p,devs,wos,docs,offers,rfqs,activity,suppliers,finance,critical,openDevs,openWos,missing};
}
function dpLiveKpi(icon,title,value,sub,theme,action){
  return `<button class="ops-kpi" onclick="${action}"><span class="mini-ico ${theme}">${Icon(icon)}</span><small>${esc(title)}</small><b>${esc(value)}</b><em>${esc(sub)}</em></button>`;
}
function dpLiveTable(headers,rows,empty='Ingen data registrert.'){
  return `<table><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${rows.length?rows.join(''):`<tr><td colspan="${headers.length}">${esc(empty)}</td></tr>`}</table>`;
}
function showDashboardSettings(){
  let s=dpLiveDashboardStats();
  showDrawer('Dashboard-oppsett',`<div class="output">Dashboardet er nå bundet til valgt eiendom: ${esc(s.p.name)}.\n\nDatakilder:\n- deviations\n- work_orders\n- documents\n- quote_requests/offers\n- suppliers\n- activity_log\n- property_finance</div><button class="action primary" onclick="hydrateDashboardNow()">Hent live data på nytt</button><button class="action" onclick="openMain('admin',null);openTab('Produksjonssjekk')">Produksjonssjekk</button>`);
}
function showDashboardOpenDeviations(){
  let s=dpLiveDashboardStats(),rows=s.devs.filter(d=>d.status!=='Lukket').map(d=>`<tr><td>${esc(dpFriendlyId(d,'AV',s.devs))}</td><td>${esc(d.title||'-')}</td><td>${esc(d.priority||'-')}</td><td>${esc(d.status||'Ny')}</td><td><button class="action" onclick="showDeviation('${esc(d.id)}')">Åpne</button></td></tr>`);
  showDrawer('Åpne avvik for '+s.p.name,dpLiveTable(['Sak','Tittel','Prioritet','Status','Handling'],rows,'Ingen åpne avvik.')+`<button class="action primary" onclick="openMain('operations',null);openTab('Avvik')">Åpne avviksmodul</button>`);
}
function showDashboardWorkOrders(){
  let s=dpLiveDashboardStats(),rows=s.wos.map(w=>`<tr><td>${esc(dpFriendlyId(w,'WO',s.wos))}</td><td>${esc(w.title||w.case||'-')}</td><td>${esc(w.owner||'-')}</td><td>${esc(w.due||w.due_date||'-')}</td><td>${esc(w.status||'-')}</td><td><button class="action" onclick="showWorkOrder('${esc(w.id)}')">Åpne</button></td></tr>`);
  showDrawer('Arbeidsordre for '+s.p.name,dpLiveTable(['WO','Sak','Ansvarlig','Frist','Status','Handling'],rows,'Ingen arbeidsordre.')+`<button class="action primary" onclick="openWorkOrders()">Åpne arbeidsordre</button><button class="action" onclick="showCreateWorkOrder()">Ny arbeidsordre</button>`);
}
function showDashboardDocuments(){
  let s=dpLiveDashboardStats(),rows=s.docs.slice(0,30).map(d=>`<tr><td>${esc(d.name||d.title||'-')}</td><td>${esc(d.folder||d.type||d.category||'-')}</td><td>${esc(d.building||'-')}</td><td>${esc(d.version||'1.0')}</td><td>${esc(d.status||'Arkivert')}</td></tr>`);
  showDrawer('Dokumenter for '+s.p.name,dpLiveTable(['Dokument','Kategori','Bygg','Versjon','Status'],rows,'Ingen dokumenter registrert.')+`<button class="action primary" onclick="openPropertyTabV1('FDV/HMS')">Åpne dokumentarkiv</button><button class="action" onclick="showUploadFDV()">Last opp dokument</button>`);
}
function showDashboardQuotes(){
  let s=dpLiveDashboardStats(),rfqRows=s.rfqs.map(q=>`<tr><td>${esc(dpFriendlyId(q,'RFQ',s.rfqs))}</td><td>${esc(q.title||'-')}</td><td>${esc(q.deadline||'-')}</td><td>${esc(q.status||'-')}</td></tr>`),offerRows=s.offers.map(o=>`<tr><td>${esc(o.supplier||'-')}</td><td>${money(+o.price||0)}</td><td>${esc(o.deadline||'-')}</td><td>${esc(o.score||'Ikke vurdert')}</td></tr>`);
  showDrawer('Tilbud og forespørsler',`<h3>Forespørsler</h3>${dpLiveTable(['RFQ','Oppdrag','Frist','Status'],rfqRows,'Ingen forespørsler.')}<h3>Tilbud</h3>${dpLiveTable(['Leverandør','Pris','Frist','Score'],offerRows,'Ingen tilbud lastet opp.')}<button class="action primary" onclick="showQuoteRequest()">Lag tilbudsforespørsel</button><button class="action" onclick="showUploadOffer()">Last opp tilbud</button>`);
}
function showDashboardSuppliers(){
  let s=dpLiveDashboardStats(),rows=s.suppliers.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.trade||'-')}</td><td>${esc(x.email||'-')}</td><td>${esc(x.score||0)}</td><td><button class="action" onclick="showSupplierCard('${esc(x.id)}')">Åpne</button></td></tr>`);
  showDrawer('Leverandører',dpLiveTable(['Firma','Fag','E-post','Score','Handling'],rows,'Ingen leverandører registrert.')+`<button class="action primary" onclick="showSupplierRegistration()">Legg til leverandør</button>`);
}
function showDashboardFinance(){
  let s=dpLiveDashboardStats(),actual=s.finance.monthlyFixedCosts||0,income=s.finance.monthlyIncome||0,balance=s.finance.bankBalance||0,reserve=s.finance.reservedFunds||0;
  showDrawer('Økonomi for '+s.p.name,`<table><tr><td>Saldo konto</td><td>${money(balance)}</td></tr><tr><td>Reservefond</td><td>${money(reserve)}</td></tr><tr><td>Månedlige inntekter</td><td>${money(income)}</td></tr><tr><td>Faste kostnader</td><td>${money(actual)}</td></tr><tr><td>Fakturaklart</td><td>${money(s.p.invoice||0)}</td></tr></table><button class="action primary" onclick="openMain('finance',null);openTab('DB/kundeøkonomi')">Åpne økonomi</button><button class="action" onclick="openMain('finance',null);openTab('DB/kundeøkonomi')">Oppdater tall</button>`);
}
function showDashboardActivity(){
  let s=dpLiveDashboardStats(),rows=s.activity.slice(0,20).map(a=>`<tr><td>${esc(a.time||a.created_at||'-')}</td><td>${esc(a.actor||a.metadata?.actor||'-')}</td><td>${esc(a.action||'-')}</td><td>${esc(a.caseId||a.entity_id||'-')}</td></tr>`);
  showDrawer('Aktivitetslogg',dpLiveTable(['Tid','Bruker','Handling','Sak'],rows,'Ingen aktivitet registrert.')+`<button class="action primary" onclick="openMain('home',null);openTab('Aktivitet')">Åpne aktivitetslogg</button>`);
}
function showDashboardEvents(){
  let s=dpLiveDashboardStats(),controls=s.p.controls||[],meetings=[{title:'Styremøte',due:'14. juni kl. 18:00',status:'Planlagt'},...controls];
  showDrawer('Kommende hendelser',dpLiveTable(['Hendelse','Tid/frist','Status'],meetings.map(e=>`<tr><td>${esc(e.title)}</td><td>${esc(e.due||e.due_date||'-')}</td><td>${esc(e.status||'Planlagt')}</td></tr>`),'Ingen hendelser.')+`<button class="action" onclick="showNextBoardMeeting()">Styremøte</button>`);
}
function dpLiveActivityChart(){
  let s=dpLiveDashboardStats(),dev=Math.max(1,s.devs.length),wo=Math.max(1,s.wos.length),doc=Math.max(1,s.docs.length),max=Math.max(dev,wo,doc,1),bar=(v,c)=>`<div style="height:${Math.max(8,Math.round(v/max*120))}px;background:${c};border-radius:8px 8px 2px 2px"></div>`;
  return `<div class="ops-chart" style="display:grid;grid-template-columns:repeat(3,1fr);align-items:end;gap:18px;height:160px;padding:18px 10px 0"><div>${bar(dev,'#ff3b45')}<small>Avvik ${dev}</small></div><div>${bar(wo,'#2d72ff')}<small>WO ${wo}</small></div><div>${bar(doc,'#22c55e')}<small>Dok ${doc}</small></div></div>`;
}
function dpLiveDeviationStatus(){
  let s=dpLiveDashboardStats(),done=s.devs.filter(d=>d.status==='Lukket'||d.status==='Ferdig').length,open=s.openDevs,critical=s.critical,total=Math.max(1,s.devs.length);
  return `<div class="deviation-body"><div class="donut"></div><div class="deviation-legend"><div class="deviation-row"><span class="deviation-label"><i class="dot" style="background:#22c55e"></i>Lukket</span><span class="deviation-value">${done} (${Math.round(done/total*100)}%)</span></div><div class="deviation-row"><span class="deviation-label"><i class="dot" style="background:#f5a400"></i>Åpne</span><span class="deviation-value">${open} (${Math.round(open/total*100)}%)</span></div><div class="deviation-row"><span class="deviation-label"><i class="dot" style="background:#ff3b45"></i>Kritisk</span><span class="deviation-value">${critical}</span></div></div></div>`;
}
DashboardPage=function(){
  let s=dpLiveDashboardStats(),p=s.p,u=user(),online=(isRealSession&&isRealSession()&&isUuid(p.id));
  let priorityRows=dpPriorityRows(),alerts=dpBuildNotifications().slice(0,5),docs=s.docs.slice(0,4),wos=s.wos.slice(0,4);
  return `<div class="ops-dashboard"><section class="ops-head"><div><h2>Dashboard</h2><p class="muted">${esc(p.name)} · ${online?'live fra Supabase':'lokal/test-visning'} · ${esc(p.address||'')}</p></div><div><button class="action" onclick="hydrateDashboardNow()">${Icon('refresh')} Hent live data</button><button class="action" onclick="showDashboardSettings()">${Icon('settings')} Dashboard</button><button class="action primary" onclick="showCreateDeviation()">${Icon('plus')} Nytt avvik</button></div></section><section class="ops-kpis">${dpLiveKpi('alert','Åpne avvik',s.openDevs,'Klikk for avviksliste','blue','showDashboardOpenDeviations()')}${dpLiveKpi('alert','Kritiske avvik',s.critical,'Krever oppfølging','redgrad','showDashboardOpenDeviations()')}${dpLiveKpi('tool','Arbeidsordre',s.openWos,'Åpne/pågående','yellow','showDashboardWorkOrders()')}${dpLiveKpi('file','Dokumenter',s.docs.length,`${s.missing.length} FDV-mangler`,'greengrad','showDashboardDocuments()')}${dpLiveKpi('mail','Tilbud/RFQ',s.offers.length+'/'+s.rfqs.length,'Tilbud og forespørsler','violet','showDashboardQuotes()')}${dpLiveKpi('briefcase','Saldo konto',money(s.finance.bankBalance||0),'Økonomi','blue','showDashboardFinance()')}</section><section class="ops-mid">${OpsPanel('Aktivitet fra valgt eiendom',dpLiveActivityChart(),'wide')}${OpsPanel('Avviksstatus',dpLiveDeviationStatus())}${OpsPanel('AI Director - basert på registrert data',dpAiDirectorLive())}</section><section class="ops-quick"><h3>Hurtighandlinger</h3><div>${[['alert','Registrer avvik','showCreateDeviation()'],['tool','Ny arbeidsordre','showCreateWorkOrder()'],['file','Last opp dokument','showUploadFDV()'],['mail','Lag tilbudsforespørsel','showQuoteRequest()'],['users','Leverandører','showDashboardSuppliers()'],['chart','Økonomi','showDashboardFinance()'],['bell','Varsler','openTabSafe("Varsler")'],['building','Bygg','openPropertyTabV1("Bygg")']].map(x=>`<button class="action" onclick="${x[2]}"><span class="mini-ico blue">${Icon(x[0])}</span>${esc(x[1])}</button>`).join('')}</div></section><section class="ops-bottom">${OpsRows('Mine prioriteringer',priorityRows,'showPriorities()')}${OpsRows('Arbeidsordre',wos.map(w=>['#2d72ff',w.title||w.case||'Arbeidsordre',w.owner||p.name,w.due||w.due_date||'-']),'showDashboardWorkOrders()')}${OpsRows('Varsler',alerts.map(a=>[a.level==='bad'?'#ff3b45':a.level==='warn'?'#f5a400':'#2d72ff',a.title,a.detail||p.name,a.type]),'openTabSafe("Varsler")')}<section class="ops-panel"><h3>Dokumenter</h3>${docs.map(d=>`<div class="ops-row"><span class="task-dot" style="background:#22c55e"></span><div><strong>${esc(d.name||d.title)}</strong><br><small class="muted">${esc(d.folder||d.type||d.category||'-')}</small></div><b>${esc(d.status||'Arkivert')}</b></div>`).join('')||'<p class="muted">Ingen dokumenter registrert.</p>'}<button class="action gray" onclick="showDashboardDocuments()">Åpne dokumentarkiv</button></section></section><section class="ops-command"><div class="kpi-icon violet">${Icon('brain')}</div><strong>AI Director</strong><input placeholder="Spør om ${esc(p.name)}..." onkeydown="if(event.key==='Enter')showBrainAnswer()"><button class="action" onclick="showPriorities()">Prioriter</button><button class="action" onclick="showHealthReport()">Rapport</button><button class="action" onclick="showDashboardActivity()">Aktivitet</button></section></div>`;
};
