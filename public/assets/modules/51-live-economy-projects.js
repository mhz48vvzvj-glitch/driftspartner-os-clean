/* Driftspartner OS module: 51-live-economy-projects.js
   Live economy, budget lines, reports, projects and finance hydration.
   Source: 50-drift-cases.js:64-160
*/
function LiveEconomyPage(){
  let p=dpEnsureMoneyData(property()),lines=p.budgetLines||[],reports=p.financialReports||[],projects=p.projects||[],projectFunds=+p.projectFunds||0,available=(+p.bankBalance||0)-(+p.reservedFunds||0)-projectFunds,budget=lines.reduce((s,x)=>s+(+x.budget||0),0),actual=lines.reduce((s,x)=>s+(+x.actual||0),0);
  return `<div class="grid">${dpLiveNotice()}${kpi('Konto',money(+p.bankBalance||0),'ok')}${kpi('Reservefond',money(+p.reservedFunds||0),'info')}${kpi('Prosjektmidler',money(projectFunds),'purple')}${kpi('Disponibelt',money(available),'warn')}<div class="card s5"><h3>Oppdater økonomi</h3><label>Saldo på konto</label><input id="bankBalance" value="${+p.bankBalance||0}"><label>Reservefond</label><input id="reservedFunds" value="${+p.reservedFunds||0}"><label>Prosjektmidler</label><input id="projectFunds" value="${projectFunds}"><label>Månedlige inntekter</label><input id="monthlyIncome" value="${+p.monthlyIncome||0}"><label>Faste kostnader per måned</label><input id="monthlyFixedCosts" value="${+p.monthlyFixedCosts||0}"><button class="action primary" onclick="saveEconomySettings()">Lagre live</button></div><div class="card s7"><div class="dash-title"><h3>Budsjettlinjer</h3><button class="action primary" onclick="showBudgetLineForm()">Ny linje</button></div><div class="ops-budget-summary"><div><small>Budsjett</small><b>${money(budget)}</b></div><div><small>Faktisk</small><b>${money(actual)}</b></div><div><small>Avvik</small><b>${money(actual-budget)}</b></div></div><table><tr><th>Kategori</th><th>Linje</th><th>Budsjett</th><th>Faktisk</th><th>Avvik</th></tr>${lines.length?lines.map(l=>`<tr><td>${esc(l.category)}</td><td>${esc(l.label)}</td><td>${money(+l.budget||0)}</td><td>${money(+l.actual||0)}</td><td>${money((+l.actual||0)-(+l.budget||0))}</td></tr>`).join(''):`<tr><td colspan="5">Ingen budsjettlinjer registrert.</td></tr>`}</table></div><div class="card s6"><div class="dash-title"><h3>Prosjektøkonomi</h3><button class="action" onclick="openProjectsLive()">Åpne prosjekter</button></div><table><tr><th>Prosjekt</th><th>Budsjett</th><th>Faktisk</th><th>Status</th></tr>${projects.length?projects.map(x=>`<tr><td>${esc(x.name)}</td><td>${money(+x.budget||0)}</td><td>${money(+x.actual||0)}</td><td>${esc(x.status||'-')}</td></tr>`).join(''):`<tr><td colspan="4">Ingen prosjekter opprettet.</td></tr>`}</table></div><div class="card s6"><div class="dash-title"><h3>Rapporter</h3><button class="action primary" onclick="showFinancialReportForm()">Ny rapport</button></div><table><tr><th>Rapport</th><th>Periode</th><th>Dato</th></tr>${reports.length?reports.map(r=>`<tr><td>${esc(r.title)}</td><td>${esc(r.period||'-')}</td><td>${esc(r.created_at||'-')}</td></tr>`).join(''):`<tr><td colspan="3">Ingen rapporter lagret.</td></tr>`}</table></div></div>`;
}
async function saveEconomySettings(){
  let p=dpEnsureMoneyData(property());p.bankBalance=+document.getElementById('bankBalance').value||0;p.reservedFunds=+document.getElementById('reservedFunds').value||0;p.projectFunds=+document.getElementById('projectFunds')?.value||0;p.monthlyIncome=+document.getElementById('monthlyIncome').value||0;p.monthlyFixedCosts=+document.getElementById('monthlyFixedCosts').value||0;
  if(isRealSession()){
    if(!dpLiveWriteReady('Økonomi'))return;
    try{
      let row={property_id:p.id,bank_balance:p.bankBalance,reserved_funds:p.reservedFunds,project_funds:p.projectFunds,monthly_income:p.monthlyIncome,monthly_fixed_costs:p.monthlyFixedCosts,updated_by:user().id,updated_at:new Date().toISOString()};
      let saved=await supabaseClient().from('property_finance').upsert(row,{onConflict:'property_id'});
      if(saved.error)throw saved.error;
    }catch(e){showDrawer('Økonomi ble ikke lagret',`<div class="output">${esc(e.message)}</div><p class="muted">Kjør SQL-filen driftspartner-live-finance-fdv-projects.sql hvis project_funds mangler.</p>`);return}
  }
  logActivity('Økonomi oppdatert','ECONOMY');
  openMain('finance',null);openTab('DB/kundeøkonomi');
}
function showBudgetLineForm(){
  showDrawer('Ny budsjettlinje',`<label>Kategori</label><select id="budgetCategory"><option>Drift</option><option>Vedlikehold</option><option>Prosjekt</option><option>Innkjøp</option><option>Energi</option><option>Forsikring</option></select><label>Navn</label><input id="budgetLabel" value=""><label>Budsjett</label><input id="budgetAmount" value="0"><label>Faktisk kostnad</label><input id="actualAmount" value="0"><label>Periode</label><input id="budgetPeriod" value="2026"><button class="action primary" onclick="saveBudgetLineLive()">Lagre budsjettlinje</button>`);
}
async function saveBudgetLineLive(){
  let p=dpEnsureMoneyData(property()),line={id:'BL-'+Date.now(),category:document.getElementById('budgetCategory').value,label:document.getElementById('budgetLabel').value,budget:+document.getElementById('budgetAmount').value||0,actual:+document.getElementById('actualAmount').value||0,period:document.getElementById('budgetPeriod').value};
  if(!line.label){showDrawer('Mangler navn','<div class="output">Skriv inn navn på budsjettlinjen.</div>');return}
  if(isRealSession()){
    if(!dpLiveWriteReady('Budsjettlinje'))return;
    try{
      let r=await supabaseClient().from('budget_lines').insert({property_id:p.id,category:line.category,label:line.label,budget_amount:line.budget,actual_amount:line.actual,period:line.period,created_by:user().id}).select().single();
      if(r.error)throw r.error;line.id=r.data.id;
    }catch(e){showDrawer('Budsjettlinje ble ikke lagret',`<div class="output">${esc(e.message)}</div><p class="muted">Kjør SQL-filen driftspartner-live-finance-fdv-projects.sql hvis tabellen mangler.</p>`);return}
  }
  p.budgetLines=p.budgetLines||[];p.budgetLines.unshift(line);logActivity('Budsjettlinje opprettet',line.label);openMain('finance',null);openTab('DB/kundeøkonomi');
}
function showFinancialReportForm(){
  showDrawer('Ny økonomirapport',`<label>Tittel</label><input id="reportTitle" value="Månedsrapport ${new Date().toLocaleDateString('nb-NO')}"><label>Periode</label><input id="reportPeriod" value="2026"><label>Sammendrag</label><textarea id="reportSummary">Status på konto, reservefond, prosjektmidler, budsjettavvik og anbefalte tiltak.</textarea><button class="action primary" onclick="saveFinancialReportLive()">Lagre rapport</button>`);
}
async function saveFinancialReportLive(){
  let p=dpEnsureMoneyData(property()),r={id:'FR-'+Date.now(),title:document.getElementById('reportTitle').value,period:document.getElementById('reportPeriod').value,summary:document.getElementById('reportSummary').value,created_at:new Date().toLocaleDateString('nb-NO')};
  if(isRealSession()){
    if(!dpLiveWriteReady('Økonomirapport'))return;
    try{
      let saved=await supabaseClient().from('financial_reports').insert({property_id:p.id,title:r.title,period:r.period,summary:r.summary,created_by:user().id}).select().single();
      if(saved.error)throw saved.error;r.id=saved.data.id;
    }catch(e){showDrawer('Rapport ble ikke lagret',`<div class="output">${esc(e.message)}</div>`);return}
  }
  p.financialReports=p.financialReports||[];p.financialReports.unshift(r);logActivity('Økonomirapport lagret',r.title);openMain('finance',null);openTab('DB/kundeøkonomi');
}
function LiveProjectsPage(){
  let p=dpV1Ensure(),projects=p.projects||[],budget=projects.reduce((s,x)=>s+(+x.budget||0),0),actual=projects.reduce((s,x)=>s+(+x.actual||0),0);
  return `<div class="grid">${dpLiveNotice()}${kpi('Prosjekter',projects.length,'info')}${kpi('Pågående',projects.filter(x=>!['Ferdig','Lukket'].includes(x.status||'')).length,'warn')}${kpi('Budsjett',money(budget),'purple')}${kpi('Avvik',money(actual-budget),'ok')}<div class="card s12"><div class="dash-title"><h3>Prosjekter</h3><button class="action primary" onclick="showCreateProjectLive()">Nytt prosjekt</button></div><table><tr><th>Prosjekt</th><th>Ansvarlig</th><th>Frist</th><th>Budsjett</th><th>Faktisk</th><th>Status</th><th>Handling</th></tr>${projects.length?projects.map(x=>`<tr><td>${esc(x.name)}<br><small class="muted">${esc(x.description||'')}</small></td><td>${esc(x.owner||x.owner_name||'-')}</td><td>${esc(x.due||x.due_date||'-')}</td><td>${money(+x.budget||0)}</td><td>${money(+x.actual||0)}</td><td>${esc(x.status||'-')}</td><td><button class="action" onclick="showProjectDetailLive('${esc(x.id)}')">Åpne</button></td></tr>`).join(''):`<tr><td colspan="7">Ingen prosjekter opprettet.</td></tr>`}</table></div></div>`;
}
function showCreateProjectLive(){
  let buildings=(dpV1Ensure().buildings||[]);
  showDrawer('Nytt prosjekt',`<label>Navn</label><input id="projectName" value=""><label>Beskrivelse</label><textarea id="projectDesc">Beskriv mål, omfang, bilder/vedlegg, tilbud og ansvar.</textarea><label>Bygg</label><select id="projectBuilding"><option value="">Hele eiendommen</option>${buildings.map(b=>`<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('')}</select><label>Ansvarlig</label><input id="projectOwner" value="${esc(user().name)}"><label>Budsjett</label><input id="projectBudget" value="0"><label>Faktisk kostnad</label><input id="projectActual" value="0"><label>Frist</label><input id="projectDue" type="date"><label>Status</label><select id="projectStatus"><option>Planlagt</option><option>Pågår</option><option>Venter tilbud</option><option>Ferdig</option></select><button class="action primary" onclick="saveProjectLive()">Opprett prosjekt</button>`);
}
async function saveProjectLive(){
  let p=dpV1Ensure(),project={id:'PR-'+Date.now(),name:document.getElementById('projectName').value,description:document.getElementById('projectDesc').value,building_id:document.getElementById('projectBuilding').value,owner:document.getElementById('projectOwner').value,budget:+document.getElementById('projectBudget').value||0,actual:+document.getElementById('projectActual').value||0,due:document.getElementById('projectDue').value,status:document.getElementById('projectStatus').value};
  if(!project.name){showDrawer('Mangler navn','<div class="output">Skriv inn prosjektnavn.</div>');return}
  if(isRealSession()){
    if(!dpLiveWriteReady('Prosjekt'))return;
    try{
      let r=await supabaseClient().from('projects').insert({property_id:p.id,building_id:project.building_id||null,name:project.name,description:project.description,owner_name:project.owner,budget_amount:project.budget,actual_amount:project.actual,due_date:project.due||null,status:project.status,created_by:user().id}).select().single();
      if(r.error)throw r.error;project.id=r.data.id;
    }catch(e){showDrawer('Prosjekt ble ikke lagret',`<div class="output">${esc(e.message)}</div><p class="muted">Kjør SQL-filen driftspartner-live-finance-fdv-projects.sql hvis prosjekttabellen mangler felter/policy.</p>`);return}
  }
  p.projects=p.projects||[];p.projects.unshift(project);logActivity('Prosjekt opprettet',project.name);openProjectsLive();
}
function showProjectDetailLive(id){
  let p=dpV1Ensure(),x=(p.projects||[]).find(pr=>String(pr.id)===String(id));
  if(!x)return;
  showDrawer('Prosjekt: '+x.name,`<table><tr><td>Beskrivelse</td><td>${esc(x.description||'-')}</td></tr><tr><td>Ansvarlig</td><td>${esc(x.owner||x.owner_name||'-')}</td></tr><tr><td>Frist</td><td>${esc(x.due||x.due_date||'-')}</td></tr><tr><td>Budsjett</td><td>${money(+x.budget||0)}</td></tr><tr><td>Faktisk</td><td>${money(+x.actual||0)}</td></tr><tr><td>Status</td><td>${esc(x.status||'-')}</td></tr></table><button class="action primary" onclick="showQuoteRequest('${esc(x.id)}')">Lag tilbudsforespørsel</button><button class="action" onclick="showUploadFDV('Prosjekt')">Last opp dokument</button><button class="action" onclick="showEmailFlow('general','${esc(x.id)}')">Send e-post</button>`);
}
function openProjectsLive(){openMain('operations',null);openTab('Prosjekter')}
showProjectsV1=function(){showDrawer('Prosjekter',LiveProjectsPage())};
showProjectFinanceV1=function(){showDrawer('Prosjektøkonomi',LiveEconomyPage())};
app.property.tabs['FDV/HMS']=()=>LiveFdvPage();
app.property.tabs['Dokumentarkiv']=()=>LiveFdvPage();
app.property.tabs['Prosjekter']=()=>LiveProjectsPage();
app.operations.tabs['Prosjekter']=()=>LiveProjectsPage();
app.finance.tabs['DB/kundeøkonomi']=()=>LiveEconomyPage();
app.finance.tabs['Prosjektøkonomi']=()=>LiveProjectsPage();
const dpHydrateCurrentPropertyDataFinanceFdvProjects=hydrateCurrentPropertyData;
hydrateCurrentPropertyData=async function(db=supabaseClient()){
  let p=await dpHydrateCurrentPropertyDataFinanceFdvProjects(db),errors=p?.liveErrors||[];
  if(!p||!isUuid(p.id))return p;
  let projects=await dpQueryLive(db,'projects',()=>db.from('projects').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(100),errors);
  if(projects)p.projects=projects.map(x=>({id:x.id,name:x.name,description:x.description,owner:x.owner_name||'',budget:+x.budget_amount||0,actual:+x.actual_amount||0,due:x.due_date,status:x.status,building_id:x.building_id}));
  let budgetLines=await dpQueryLive(db,'budget_lines',()=>db.from('budget_lines').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(200),errors);
  if(budgetLines)p.budgetLines=budgetLines.map(x=>({id:x.id,category:x.category,label:x.label,budget:+x.budget_amount||0,actual:+x.actual_amount||0,period:x.period}));
  let reports=await dpQueryLive(db,'financial_reports',()=>db.from('financial_reports').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(50),errors);
  if(reports)p.financialReports=reports.map(x=>({id:x.id,title:x.title,period:x.period,summary:x.summary,created_at:new Date(x.created_at).toLocaleDateString('nb-NO')}));
  let finance=await dpQueryLive(db,'property_finance_project_funds',()=>db.from('property_finance').select('*').eq('property_id',p.id).maybeSingle(),errors);
  if(finance){p.bankBalance=+finance.bank_balance||0;p.reservedFunds=+finance.reserved_funds||0;p.projectFunds=+finance.project_funds||0;p.monthlyIncome=+finance.monthly_income||0;p.monthlyFixedCosts=+finance.monthly_fixed_costs||0}
  let folders=await dpQueryLive(db,'document_folders_full',()=>db.from('document_folders').select('*').eq('property_id',p.id).order('sort_order',{ascending:true}).limit(150),errors);
  if(folders){p.documentFolders=folders;p.fdvFolders=folders.map(f=>f.name)}
  p.liveErrors=[...new Set(errors)];
  return p;
};
