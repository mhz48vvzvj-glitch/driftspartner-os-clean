/* Driftspartner OS module: 40-v1-data-dashboard.js
   V1 data helpers, dashboard stats, notifications and AI summary.
   Source: 40-property-fdv.js:1-61
*/
/* Driftspartner OS module: 40-property-fdv.js
   Generated from driftspartner-property-os.js. Keep classic script order in HTML. */
function dpV1Ensure(p=property()){
  p=ensurePropertyData(p);
  p.gnr=p.gnr||'12';p.bnr=p.bnr||'345';p.builtYear=p.builtYear||'1987';p.units=p.units||42;p.technicalInfo=p.technicalInfo||'Betong/tre, fjernvarme, balansert ventilasjon i fellesareal og serviceavtaler pa heis/brann.';
  p.buildings=p.buildingsList||p.buildings;
  if(!Array.isArray(p.buildings))p.buildings=[
    {id:'bygg-a',name:'Bygg A',address:p.address,gnr:p.gnr,bnr:p.bnr,builtYear:p.builtYear,units:18,area:12600,technical:'Tak/VVS har hoyest risiko',budget:420000,history:['Takrapport oppdatert','Brannkontroll gjennomfort']},
    {id:'bygg-b',name:'Bygg B',address:p.address,gnr:p.gnr,bnr:p.bnr,builtYear:p.builtYear,units:14,area:9800,technical:'Elektro og ventilasjon folges opp',budget:310000,history:['El-kontroll planlagt']},
    {id:'ute',name:'Uteomrade',address:p.address,gnr:p.gnr,bnr:p.bnr,builtYear:'-',units:0,area:1600,technical:'Drenering, lys og adkomst',budget:120000,history:['Lys uteomrade meldt']}
  ];
  p.buildingsList=p.buildings;
  p.fdvFolders=p.fdvFolders||['Bygg','VVS','Elektro','Brann','Ventilasjon','Tak','Fasade','Heis','HMS','Forsikring','Garantier','Tegninger','Kontrakter','Serviceavtaler'];
  p.controls=p.controls||[
    {title:'Brannkontroll',due:'2026-06-30',status:'Planlagt'},
    {title:'Heiskontroll',due:'2026-07-10',status:'Mangler dokumentasjon'},
    {title:'El-kontroll fellesareal',due:'2026-08-15',status:'Planlagt'}
  ];
  p.projects=p.projects||[
    {id:'PR-001',name:p.risk+' tiltak',description:'Oppfolging av risiko og tilbud',owner:'Forvalter',budget:250000,actual:294000,due:'2026-09-01',status:'Pagar'},
    {id:'PR-002',name:'FDV-opprydding',description:'Strukturere dokumenter og bygg',owner:'Driftspartner Nord',budget:65000,actual:28000,due:'2026-07-01',status:'Planlagt'}
  ];
  p.notifications=p.notifications||[];
  return p;
}
function dpV1Collections(p=property()){
  p=dpV1Ensure(p);
  let devs=Array.isArray(p.deviations)?p.deviations:[];
  let wos=Array.isArray(p.workOrders)?p.workOrders:[];
  let docs=Array.isArray(p.documents)?p.documents:[];
  let projects=Array.isArray(p.projects)?p.projects:[];
  return {p,devs,wos,docs,projects};
}
function dpV1Stats(){
  let {p,devs,wos,docs,projects}=dpV1Collections();
  let openDevs=devs.filter(d=>!['Lukket','Ferdig','Utført','Utfort'].includes(d.status||'')).length;
  let critical=devs.filter(d=>(d.priority||'').toLowerCase().includes('kritisk')).length;
  let missingFolders=(p.fdvFolders||[]).filter(f=>!docs.some(d=>String(d.type||d.category||'').toLowerCase().includes(f.toLowerCase())||String(d.folder||'').toLowerCase()===f.toLowerCase()));
  let activeProjects=projects.filter(x=>!['Ferdig','Lukket'].includes(x.status||'')).length;
  let budget=projects.reduce((s,x)=>s+(+x.budget||0),0),actual=projects.reduce((s,x)=>s+(+x.actual||0),0);
  return {openDevs,critical,activeProjects,missingFolders,budget,actual,budgetVariance:actual-budget,controls:(p.controls||[]).length,alerts:dpBuildNotifications().length};
}
function dpBuildNotifications(){
  let {p,devs,wos,docs,projects}=dpV1Collections(),items=[];
  devs.filter(d=>(d.priority||'').toLowerCase().includes('kritisk')).slice(0,4).forEach(d=>items.push({id:'n-dev-'+d.id,type:'Kritisk avvik',title:d.title||p.risk,detail:d.building||p.name,level:'bad',caseId:d.id,read:false}));
  wos.filter(w=>['Ny','Pagar','Pågår','Venter tilbud'].includes(w.status||'')).slice(0,3).forEach(w=>items.push({id:'n-wo-'+w.id,type:'Arbeidsordre',title:w.title||'Arbeidsordre',detail:w.due?'Frist '+w.due:'Mangler frist',level:'warn',caseId:w.id,read:false}));
  let missing=(p.fdvFolders||[]).filter(f=>!docs.some(d=>String(d.type||d.category||'').toLowerCase().includes(f.toLowerCase())||String(d.folder||'').toLowerCase()===f.toLowerCase())).slice(0,3);
  missing.forEach(f=>items.push({id:'n-fdv-'+f,type:'Manglende FDV',title:f,detail:'Mangler dokument i mappestruktur',level:'info',caseId:'FDV',read:false}));
  projects.filter(x=>(+x.actual||0)>(+x.budget||0)).forEach(x=>items.push({id:'n-pr-'+x.id,type:'Budsjettavvik',title:x.name,detail:money((+x.actual||0)-(+x.budget||0))+' over budsjett',level:'warn',caseId:x.id,read:false}));
  (p.controls||[]).slice(0,2).forEach(c=>items.push({id:'n-ctl-'+c.title,type:'Kommende kontroll',title:c.title,detail:c.due+' · '+c.status,level:c.status.includes('Mangler')?'warn':'info',caseId:'CONTROL',read:false}));
  return items;
}
function DashboardPage(){
  let {p}=dpV1Collections(),s=dpV1Stats();
  return `<div class="ops-dashboard"><section class="ops-head"><div><h2>Dashboard</h2><p class="muted">Live status for ${esc(p.name)} basert på registrert innhold.</p></div><div><button class="action primary" onclick="showCreateDeviation()">${Icon('plus')} Nytt avvik</button><button class="action" onclick="openTabSafe('Varsler')">${Icon('bell')} Varsler</button></div></section><section class="ops-kpis">${OpsKpi('alert','Åpne avvik',s.openDevs,'Fra avvikslisten','blue','openMain("operations",null)')}${OpsKpi('alert','Kritiske avvik',s.critical,'Krever oppfølging','redgrad','showCriticalDeviations()')}${OpsKpi('tool','Pågående prosjekter',s.activeProjects,'Prosjekt/arbeid','greengrad','showProjectsV1()')}${OpsKpi('briefcase','Budsjettstatus',money(s.budgetVariance),'Avvik mot budsjett','yellow','showProjectFinanceV1()')}${OpsKpi('file','FDV mangler',s.missingFolders.length,'Mapper uten dokument','violet','openMain("property",null)')}</section><section class="ops-mid">${OpsPanel('AI Director - live anbefalinger',dpAiDirectorLive(),'wide')}${OpsPanel('Kommende kontroller',dpControlsList())}${OpsPanel('Varsler',dpAlertsMini())}</section><section class="ops-quick"><h3>Hurtighandlinger</h3><div>${[['file','Last opp FDV','showUploadFDV()'],['alert','Registrer avvik','showCreateDeviation()'],['calendar','Arbeidsordre','showCreateWorkOrder()'],['mail','Tilbudsforespørsel','showQuoteRequest()'],['building','Byggoversikt','openTabSafe("Bygg")'],['chart','Økonomi','openMain("finance",null)']].map(x=>`<button class="action" onclick="${x[2]}"><span class="mini-ico blue">${Icon(x[0])}</span>${x[1]}</button>`).join('')}</div></section><section class="ops-bottom">${OpsRows('Prioriteringer',dpPriorityRows(),'showPriorities()')}${OpsRows('FDV mangler',s.missingFolders.slice(0,5).map(f=>['#f5a400',f,'Mangler dokument','']),'openMain("property",null)')}${OpsRows('Prosjekter',p.projects.slice(0,5).map(x=>[(+x.actual||0)>(+x.budget||0)?'#ff3b45':'#22c55e',x.name,x.status,money(x.budget)]),'showProjectsV1()')}<section class="ops-panel"><h3>Property Brain</h3><p class="muted">${esc(dpPropertyBrainSummary())}</p><button class="action primary" onclick="openMain('cloud',null)">Åpne analyse</button></section></section></div>`;
}
function dpPriorityRows(){let s=dpV1Stats(),p=property(),rows=[];if(s.critical)rows.push(['#ff3b45',s.critical+' kritiske avvik','Opprett arbeidsordre/tilbud','Nå']);if(s.missingFolders.length)rows.push(['#f5a400','FDV mangler: '+s.missingFolders[0],'Last opp dokument','Denne uken']);if(s.budgetVariance>0)rows.push(['#f5a400','Budsjettavvik','Se prosjektøkonomi',money(s.budgetVariance)]);rows.push(['#22c55e','Neste kontroll','Planlagt oppfølging',(p.controls?.[0]?.due)||'-']);return rows}
function dpAiDirectorLive(){let s=dpV1Stats();return `<div class="output">${esc(dpPropertyBrainSummary())}</div><table><tr><th>Funn</th><th>Anbefalt handling</th></tr><tr><td>${s.critical} kritiske avvik</td><td>Send til styre/vaktmester og opprett arbeidsordre.</td></tr><tr><td>${s.missingFolders.length} FDV-mapper mangler dokument</td><td>Last opp dokumenter og sett utløpsdato.</td></tr><tr><td>${money(s.budgetVariance)} budsjettavvik</td><td>Åpne økonomi og vurder tiltak.</td></tr></table>`}
function dpControlsList(){let p=dpV1Ensure();return `<table><tr><th>Kontroll</th><th>Frist</th><th>Status</th></tr>${p.controls.map(c=>`<tr><td>${esc(c.title)}</td><td>${esc(c.due)}</td><td>${esc(c.status)}</td></tr>`).join('')}</table>`}
function dpAlertsMini(){return `<table><tr><th>Varsel</th><th>Detalj</th></tr>${dpBuildNotifications().slice(0,5).map(n=>`<tr><td><span class="badge ${n.level}">${esc(n.type)}</span><br>${esc(n.title)}</td><td>${esc(n.detail)}</td></tr>`).join('')||'<tr><td colspan=2>Ingen varsler.</td></tr>'}</table>`}
function dpPropertyBrainSummary(){let s=dpV1Stats(),p=property();if(s.critical)return `${p.name}: ${s.critical} kritiske avvik bør prioriteres før nye prosjekter. Sjekk FDV-mangler og vurder tilbudsinnhenting.`;if(s.missingFolders.length)return `${p.name}: FDV-strukturen mangler ${s.missingFolders.length} mapper med dokumentasjon. Start med ${s.missingFolders[0]}.`;return `${p.name}: Ingen kritiske funn registrert. Følg kommende kontroller og hold FDV oppdatert.`}
