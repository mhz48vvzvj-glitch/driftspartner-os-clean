function financeTotals(){
  const lines=DP.cache.budget_lines||[],projects=DP.cache.projects||[];
  const budget=lines.reduce((s,l)=>s+Number(l.budget_amount||l.budget||0),0);
  const actual=lines.reduce((s,l)=>s+Number(l.actual_amount||l.actual||0),0);
  const projectBudget=projects.reduce((s,p)=>s+Number(p.budget||p.budget_amount||0),0);
  const projectActual=projects.reduce((s,p)=>s+Number(p.actual_cost||p.actual_amount||0),0);
  return {budget,actual,variance:actual-budget,projectBudget,projectActual,projectVariance:projectActual-projectBudget};
}
function FinancePage(){
  const f=(DP.cache.finance||[])[0]||{},lines=DP.cache.budget_lines||[],projects=DP.cache.projects||[],t=financeTotals();
  const varianceType=t.variance>0?'bad':'ok';
  const projectType=t.projectVariance>0?'warn':'info';
  return `<div class="grid finance-page"><div class="card s12"><div class="dash-title"><h3>Økonomi</h3><div><button class="action primary" onclick="showFinanceForm()">Konto/reserve</button><button class="action" onclick="showBudgetForm()">Budsjettlinje</button><button class="action" onclick="showActualCostForm()">Faktisk kostnad</button><button class="action" onclick="showProjectForm()">Prosjekt</button><button class="action" onclick="saveBoardFinanceReport()">Lag styrerapport</button></div></div></div>${financeMetric('Bank/konto',money(f.bank_balance),'Tilgjengelig saldo','ok')}${financeMetric('Reservefond',money(f.reserved_funds),'Avsatt reserve','info')}${financeMetric('Budsjett',money(t.budget),'Totalt budsjettert','purple')}${financeMetric('Faktisk kostnad',money(t.actual),t.variance>0?'Over budsjett':'Innenfor budsjett',varianceType)}${financeMetric('Budsjettavvik',money(t.variance),t.variance>0?'Merforbruk':'Ingen merforbruk',varianceType)}${financeMetric('Prosjektøkonomi',`${money(t.projectActual)} / ${money(t.projectBudget)}`,t.projectVariance>0?'Prosjekt over budsjett':'Prosjektstatus',projectType)}<div class="card s7"><h3>Budsjett og faktiske kostnader</h3>${financeBudgetSummary(t)}${table(['Kategori','Budsjett','Faktisk','Avvik','Notat','Handling'],lines.map(l=>`<tr><td>${esc(l.category||l.label)}</td><td>${money(l.budget_amount||l.budget)}</td><td>${money(l.actual_amount||l.actual)}</td><td>${money(Number(l.actual_amount||l.actual||0)-Number(l.budget_amount||l.budget||0))}</td><td>${esc(l.notes||'-')}</td><td><div class="row-actions"><button class="action" onclick="showBudgetForm('${esc(l.id)}')">Endre</button><button class="action red" onclick="deleteRow('budget_lines','${esc(l.id)}')">Slett</button></div></td></tr>`))}</div><div class="card s5"><div class="dash-title"><h3>Prosjektøkonomi</h3><button class="action" onclick="showProjectForm()">Nytt prosjekt</button></div>${projectFinanceList(projects)}</div><div class="card s12"><h3>Enkel rapport til styret</h3>${financeReportPreview()}</div></div>`;
}
function financeMetric(label,value,caption,type='info'){
  return `<div class="card s4 finance-metric ${type}"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(caption)}</span></div>`;
}
function projectFinanceList(projects){
  const rows=projects||[];
  if(!rows.length)return '<div class="empty-state"><strong>Ingen prosjekter registrert.</strong><span>Legg inn prosjekt for å følge budsjett, faktisk kostnad og status.</span><button class="action primary" onclick="showProjectForm()">Nytt prosjekt</button></div>';
  return `<div class="project-list">${rows.map(p=>{
    const name=p.name||p.title||'Uten prosjektnavn';
    const budget=Number(p.budget||p.budget_amount||0),actual=Number(p.actual_cost||p.actual_amount||0),variance=actual-budget;
    const status=p.status||'Ikke satt';
    return `<section class="project-item"><div class="project-head"><div><strong>${esc(name)}</strong><small>${esc(status)}</small></div><span class="soft-pill ${variance>0?'bad':'ok'}">${variance>0?'Over budsjett':'Innenfor'}</span></div><div class="project-numbers"><div><small>Budsjett</small><b>${money(budget)}</b></div><div><small>Faktisk</small><b>${money(actual)}</b></div><div><small>Avvik</small><b>${money(variance)}</b></div></div><div class="row-actions"><button class="action" onclick="showProjectForm('${esc(p.id)}')">Endre</button><button class="action red" onclick="deleteRow('projects','${esc(p.id)}')">Slett</button></div></section>`;
  }).join('')}</div>`;
}
function financeBudgetSummary(t){return `<div class="ops-budget-summary"><div><small>Budsjett</small><b>${money(t.budget)}</b></div><div><small>Faktisk</small><b>${money(t.actual)}</b></div><div><small>Avvik</small><b>${money(t.variance)}</b></div><div><small>Prosjekter</small><b>${money(t.projectActual)}</b></div></div>`}
function financeReportPreview(){
  const f=(DP.cache.finance||[])[0]||{},t=financeTotals(),risk=t.variance>0?'Over budsjett':'Innenfor budsjett';
  return `<table><tr><td>Eiendom</td><td>${esc(currentProperty()?.name||'-')}</td></tr><tr><td>Bank/konto</td><td>${money(f.bank_balance)}</td></tr><tr><td>Reservefond</td><td>${money(f.reserved_funds)}</td></tr><tr><td>Budsjett</td><td>${money(t.budget)}</td></tr><tr><td>Faktisk kostnad</td><td>${money(t.actual)}</td></tr><tr><td>Avvik</td><td>${money(t.variance)} · ${esc(risk)}</td></tr><tr><td>Prosjektøkonomi</td><td>${money(t.projectActual)} brukt av ${money(t.projectBudget)}</td></tr></table>`;
}
function showFinanceForm(){const f=(DP.cache.finance||[])[0]||{};showDrawer('Konto og fond',`<label>Bank/konto</label><input id="bankBalance" type="number" value="${esc(f.bank_balance||0)}"><label>Reservefond</label><input id="reserveFund" type="number" value="${esc(f.reserved_funds||0)}"><label>Prosjektmidler</label><input id="projectFunds" type="number" value="${esc(f.project_funds||0)}"><label>Kommentar</label><textarea id="financeNotes">${esc(f.notes||'')}</textarea><button class="action primary" onclick="saveFinance()">Lagre</button>`)}
async function saveFinance(){try{requireLive('lagre økonomi');const row={property_id:currentProperty().id,bank_balance:+bankBalance.value||0,reserved_funds:+reserveFund.value||0,project_funds:+projectFunds.value||0,notes:financeNotes.value||null,updated_at:new Date().toISOString()};let r=await db().from('property_finance').upsert(row,{onConflict:'property_id'}).select().single();if(r.error&&/column|schema|cache/i.test(String(r.error.message||'')))r=await db().from('property_finance').upsert({property_id:row.property_id,bank_balance:row.bank_balance,reserved_funds:row.reserved_funds,project_funds:row.project_funds,updated_at:row.updated_at},{onConflict:'property_id'}).select().single();if(r.error)throw r.error;await insertActivity('Økonomi oppdatert','finance',currentProperty().id);await finishAction('Konto og fond er lagret.','finance')}catch(e){showDrawer('Økonomi ble ikke lagret',`<div class="output">${esc(customerError(e))}</div>`)}}
function showBudgetForm(id=''){const l=(DP.cache.budget_lines||[]).find(x=>x.id===id)||{};showDrawer(id?'Endre budsjettlinje':'Ny budsjettlinje',`<input id="budgetId" type="hidden" value="${esc(id)}"><label>Kategori</label><input id="budCat" value="${esc(l.category||l.label||'')}"><label>Budsjett</label><input id="budBudget" type="number" value="${esc(l.budget_amount||l.budget||0)}"><label>Faktisk</label><input id="budActual" type="number" value="${esc(l.actual_amount||l.actual||0)}"><label>Notat</label><textarea id="budNotes">${esc(l.notes||'')}</textarea><button class="action primary" onclick="saveBudget()">Lagre</button><div id="budgetOut" class="output">Klar til lagring.</div>`)}
function isFinanceSchemaError(error){return /column|schema|cache|relation|does not exist|could not find|not-null|null value|violates/i.test(String(error?.message||error||''))}
async function saveBudgetRowVariant(row){
  const client=db();
  return budgetId.value?await client.from('budget_lines').update(row).eq('id',budgetId.value).select().single():await client.from('budget_lines').insert(row).select().single();
}
async function saveBudget(){
  const out=document.getElementById('budgetOut');
  try{
    requireLive('lagre budsjett');
    if(out)out.textContent='Lagrer budsjettlinje...';
    const propertyId=currentProperty().id,category=budCat.value||'Budsjett',budget=+budBudget.value||0,actual=+budActual.value||0,notes=budNotes.value||null;
    const variants=[
      {property_id:propertyId,category,label:category,budget_amount:budget,actual_amount:actual,budget,actual,notes},
      {property_id:propertyId,category,label:category,budget_amount:budget,actual_amount:actual,budget,actual},
      {property_id:propertyId,label:category,budget_amount:budget,actual_amount:actual,notes},
      {property_id:propertyId,label:category,budget_amount:budget,actual_amount:actual},
      {property_id:propertyId,category,budget_amount:budget,actual_amount:actual,notes},
      {property_id:propertyId,category,budget_amount:budget,actual_amount:actual},
      {property_id:propertyId,category,budget,actual,notes},
      {property_id:propertyId,category,budget,actual},
      {property_id:propertyId,label:category,budget,actual,notes},
      {property_id:propertyId,label:category,budget,actual}
    ];
    let r,lastError=null;
    for(const variant of variants){
      r=await saveBudgetRowVariant(variant);
      if(!r.error)break;
      lastError=r.error;
      if(!isFinanceSchemaError(r.error))break;
    }
    if(r?.error)throw lastError||r.error;
    await insertActivity('Budsjettlinje lagret','budget',r.data?.id||category);
    await finishAction('Budsjettlinjen er lagret.','finance');
  }catch(e){
    const msg=isFinanceSchemaError(e)?'Økonomioppsettet er ikke helt klart. Kontakt Driftspartner Nord for oppsett av økonomimodulen.':customerError(e);
    showDrawer('Budsjett ble ikke lagret',`<div class="output">${esc(msg)}</div>`);
  }
}
function showActualCostForm(){showDrawer('Registrer faktisk kostnad',`<label>Kategori</label><input id="costCat" placeholder="Vedlikehold, forsikring, prosjekt..."><label>Beløp</label><input id="costAmount" type="number"><label>Dato</label><input id="costDate" type="date"><label>Notat</label><textarea id="costNotes"></textarea><button class="action primary" onclick="saveActualCost()">Lagre kostnad</button>`)}
async function saveActualCost(){try{requireLive('lagre kostnad');const category=costCat.value||'Kostnad',actual=+costAmount.value||0,notes=[costDate.value,costNotes.value].filter(Boolean).join(' · '),propertyId=currentProperty().id;const variants=[{property_id:propertyId,category,label:category,budget_amount:0,actual_amount:actual,budget:0,actual,notes},{property_id:propertyId,category,label:category,budget_amount:0,actual_amount:actual,budget:0,actual},{property_id:propertyId,label:category,budget_amount:0,actual_amount:actual,notes},{property_id:propertyId,label:category,budget_amount:0,actual_amount:actual},{property_id:propertyId,category,budget_amount:0,actual_amount:actual,notes},{property_id:propertyId,category,budget_amount:0,actual_amount:actual},{property_id:propertyId,category,budget:0,actual,notes},{property_id:propertyId,category,budget:0,actual},{property_id:propertyId,label:category,budget:0,actual,notes},{property_id:propertyId,label:category,budget:0,actual}];let r,lastError=null;for(const variant of variants){r=await db().from('budget_lines').insert(variant).select().single();if(!r.error)break;lastError=r.error;if(!isFinanceSchemaError(r.error))break}if(r?.error)throw lastError||r.error;await insertActivity('Faktisk kostnad registrert','budget',r.data?.id||category);await finishAction('Kostnaden er registrert.','finance')}catch(e){const msg=isFinanceSchemaError(e)?'Økonomioppsettet er ikke helt klart. Kontakt Driftspartner Nord for oppsett av økonomimodulen.':customerError(e);showDrawer('Kostnad ble ikke lagret',`<div class="output">${esc(msg)}</div>`)}}
function showProjectForm(id=''){const p=(DP.cache.projects||[]).find(x=>x.id===id)||{};showDrawer(id?'Endre prosjekt':'Nytt prosjekt',`<input id="projectId" type="hidden" value="${esc(id)}"><label>Navn</label><input id="projectName" value="${esc(p.name||p.title||'')}"><label>Beskrivelse</label><textarea id="projectDesc">${esc(p.description||'')}</textarea><label>Budsjett</label><input id="projectBudget" type="number" value="${esc(p.budget||p.budget_amount||0)}"><label>Faktisk kostnad</label><input id="projectActual" type="number" value="${esc(p.actual_cost||p.actual_amount||0)}"><label>Frist</label><input id="projectDue" type="date" value="${esc(p.due_date||'')}"><label>Status</label><select id="projectStatus"><option ${p.status==='Planlagt'?'selected':''}>Planlagt</option><option ${p.status==='Pågår'?'selected':''}>Pågår</option><option ${p.status==='Ferdig'?'selected':''}>Ferdig</option></select><button class="action primary" onclick="saveProject()">Lagre</button>`)}
async function saveProject(){try{requireLive('lagre prosjekt');const row={property_id:currentProperty().id,name:projectName.value,description:projectDesc.value,budget:+projectBudget.value||0,actual_cost:+projectActual.value||0,due_date:projectDue.value||null,status:projectStatus.value};let r=projectId.value?await db().from('projects').update(row).eq('id',projectId.value).select().single():await db().from('projects').insert(row).select().single();if(r.error&&/column|schema|cache/i.test(String(r.error.message||''))){delete row.actual_cost;r=projectId.value?await db().from('projects').update(row).eq('id',projectId.value).select().single():await db().from('projects').insert(row).select().single()}if(r.error)throw r.error;await insertActivity('Prosjekt lagret','project',r.data.id);await finishAction('Prosjektet er lagret.','finance')}catch(e){showDrawer('Prosjekt ble ikke lagret',`<div class="output">${esc(customerError(e))}</div>`)}}
function financeReportHtml(){
  const p=currentProperty(),f=(DP.cache.finance||[])[0]||{},lines=DP.cache.budget_lines||[],projects=DP.cache.projects||[],t=financeTotals();
  const row=(a,b)=>`<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`;
  const budgetRows=lines.map(l=>`<tr><td>${esc(l.category||l.label)}</td><td>${money(l.budget_amount||l.budget)}</td><td>${money(l.actual_amount||l.actual)}</td><td>${money(Number(l.actual_amount||l.actual||0)-Number(l.budget_amount||l.budget||0))}</td></tr>`).join('');
  const projectRows=projects.map(pr=>`<tr><td>${esc(pr.name||pr.title)}</td><td>${money(pr.budget||pr.budget_amount)}</td><td>${money(pr.actual_cost||pr.actual_amount)}</td><td>${esc(pr.status||'-')}</td></tr>`).join('');
  return `<!doctype html><html lang="no"><head><meta charset="utf-8"><title>Økonomirapport</title><style>body{font-family:Arial,sans-serif;background:#f4f7fb;color:#172033;margin:0}.page{max-width:900px;margin:32px auto;background:#fff;border:1px solid #d8e0eb;border-radius:14px;overflow:hidden}header{background:#0d347d;color:#fff;padding:28px 34px}main{padding:28px 34px}table{width:100%;border-collapse:collapse;margin:0 0 24px}td,th{border-bottom:1px solid #e6edf5;padding:10px;text-align:left}h2{margin-top:28px}.note{background:#eef5ff;border-left:4px solid #176bff;padding:14px;border-radius:10px}</style></head><body><section class="page"><header><small>Driftspartner OS</small><h1>Økonomirapport til styret</h1><p>${esc(p?.name||'-')} · ${esc(new Date().toLocaleString('nb-NO'))}</p></header><main><h2>Nøkkeltall</h2><table>${row('Bank/konto',money(f.bank_balance))}${row('Reservefond',money(f.reserved_funds))}${row('Prosjektmidler',money(f.project_funds))}${row('Budsjett',money(t.budget))}${row('Faktisk kostnad',money(t.actual))}${row('Avvik',money(t.variance))}</table><h2>Budsjett</h2><table><tr><th>Kategori</th><th>Budsjett</th><th>Faktisk</th><th>Avvik</th></tr>${budgetRows||'<tr><td colspan="4">Ingen budsjettlinjer registrert.</td></tr>'}</table><h2>Prosjekter</h2><table><tr><th>Prosjekt</th><th>Budsjett</th><th>Faktisk</th><th>Status</th></tr>${projectRows||'<tr><td colspan="4">Ingen prosjekter registrert.</td></tr>'}</table><div class="note">Rapporten er generert fra live økonomidata på valgt eiendom.</div></main></section></body></html>`;
}
async function saveBoardFinanceReport(){try{requireLive('lage styrerapport');if(typeof uploadGeneratedDocument!=='function')throw new Error('Dokumentarkivet er ikke klart.');const doc=await uploadGeneratedDocument('Økonomirapport - '+(currentProperty()?.name||'eiendom'),'Styrepapir',financeReportHtml(),'Klar');await hydrateAll();showDrawer('Styrerapport lagret',`<p>Økonomirapporten er lagret i dokumentarkivet.</p><button class="action primary" onclick="openDocument('${esc(doc.id)}')">Åpne rapport</button>`)}catch(e){showDrawer('Rapport ble ikke laget',`<div class="output">${esc(customerError(e))}</div>`)}}
function FinancePage(){
  const f=(DP.cache.finance||[])[0]||{},lines=DP.cache.budget_lines||[],projects=DP.cache.projects||[],t=financeTotals();
  const budgetRisk=t.variance>0?'bad':'ok',projectRisk=t.projectVariance>0?'warn':'ok';
  const reserveShare=Number(f.bank_balance||0)>0?Math.round(Number(f.reserved_funds||0)/Number(f.bank_balance||0)*100):0;
  return `<div class="grid finance-page premium-finance-module">
    <div class="card s12 module-hero finance-hero">
      <div><small>Økonomi</small><h2>Styreklart økonomibilde</h2><p>Bank, reservefond, budsjett, faktiske kostnader og prosjektøkonomi for valgt eiendom. Tallene hentes live fra Supabase.</p></div>
      <div class="module-actions"><button class="action primary" onclick="showFinanceForm()">Konto og fond</button><button class="action" onclick="showBudgetForm()">Ny budsjettlinje</button><button class="action" onclick="showActualCostForm()">Registrer kostnad</button><button class="action" onclick="showProjectForm()">Nytt prosjekt</button><button class="action" onclick="saveBoardFinanceReport()">Lag styrerapport</button><button class="action" onclick="showEmailFlow('board')">Send e-post</button></div>
    </div>
    ${financeMetric('Bank/konto',money(f.bank_balance),'Registrert banksaldo','ok')}
    ${financeMetric('Reservefond',money(f.reserved_funds),reserveShare?`${reserveShare}% av bank/konto`:'Avsatt reserve','info')}
    ${financeMetric('Prosjektmidler',money(f.project_funds),'Midler avsatt til prosjekter','purple')}
    ${financeMetric('Budsjett',money(t.budget),'Totalt budsjettert','purple')}
    ${financeMetric('Faktisk kostnad',money(t.actual),t.variance>0?'Over budsjett':'Innenfor budsjett',budgetRisk)}
    ${financeMetric('Budsjettavvik',money(t.variance),t.variance>0?'Må forklares for styret':'Ingen merforbruk',budgetRisk)}
    <div class="card s8 finance-chart-panel"><div class="dash-title"><div><h3>Budsjett mot faktisk</h3><p class="muted">Viser hvilke områder som driver økonomien.</p></div><button class="action" onclick="showBudgetForm()">Legg til linje</button></div>${financeBudgetChart(lines,projects)}</div>
    <div class="card s4 finance-board-card"><h3>Styrets økonomipunkter</h3>${financeDecisionList(f,t,projects)}</div>
    <div class="card s7 finance-list-panel"><div class="dash-title"><div><h3>Budsjettlinjer</h3><p class="muted">Budsjett, faktisk kostnad og avvik per kategori.</p></div><button class="action" onclick="showActualCostForm()">Registrer kostnad</button></div>${budgetLineCards(lines)}</div>
    <div class="card s5 finance-list-panel"><div class="dash-title"><div><h3>Prosjektøkonomi</h3><p class="muted">Prosjekter, forbruk, frist og status.</p></div><button class="action" onclick="showProjectForm()">Nytt prosjekt</button></div>${projectFinanceList(projects)}</div>
    <div class="card s12 finance-report-card"><div class="dash-title"><div><h3>Styrerapport</h3><p class="muted">Kort rapportgrunnlag som kan lagres i dokumentarkivet.</p></div><button class="action primary" onclick="saveBoardFinanceReport()">Lagre styrerapport</button></div>${financeReportPreview()}</div>
  </div>`;
}
function financeDecisionList(f,t,projects){
  const rows=[];
  rows.push({type:t.variance>0?'bad':'ok',title:t.variance>0?'Budsjettavvik må forklares':'Budsjett ser kontrollert ut',text:t.variance>0?`${money(t.variance)} over budsjett.`:'Ingen registrert merforbruk.'});
  rows.push({type:Number(f.reserved_funds||0)>0?'ok':'warn',title:Number(f.reserved_funds||0)>0?'Reservefond registrert':'Reservefond mangler',text:Number(f.reserved_funds||0)>0?`${money(f.reserved_funds)} er satt av.`:'Legg inn reservefond for bedre rapportering.'});
  rows.push({type:t.projectVariance>0?'warn':'info',title:projects.length?'Prosjekter registrert':'Ingen prosjekter',text:projects.length?`${projects.length} prosjekt følger budsjett/faktisk.`:'Opprett prosjekt for større tiltak.'});
  return `<div class="finance-decision-list">${rows.map(r=>`<section class="finance-decision ${r.type}"><b>${esc(r.title)}</b><span>${esc(r.text)}</span></section>`).join('')}</div>`;
}
function financeBudgetChart(lines,projects){
  const rows=(lines||[]).map(l=>({id:l.id,label:l.category||l.label||'Budsjett',budget:Number(l.budget_amount||l.budget||0),actual:Number(l.actual_amount||l.actual||0),type:'budget'}));
  if(projects?.length)rows.push({label:'Prosjekter',budget:projects.reduce((s,p)=>s+Number(p.budget||p.budget_amount||0),0),actual:projects.reduce((s,p)=>s+Number(p.actual_cost||p.actual_amount||0),0),type:'project'});
  if(!rows.length)return '<div class="empty-state"><strong>Ingen økonomilinjer registrert.</strong><span>Legg inn første budsjettlinje for å få graf og styrerapport.</span><button class="action primary" onclick="showBudgetForm()">Ny budsjettlinje</button></div>';
  const max=Math.max(1,...rows.flatMap(r=>[r.budget,r.actual]));
  return `<div class="finance-module-legend"><span><i class="budget"></i>Budsjett</span><span><i class="actual"></i>Faktisk</span><span><i class="over"></i>Over budsjett</span></div><div class="finance-module-bars">${rows.map(r=>{
    const actualClass=r.actual>r.budget?'actual over':'actual';
    return `<div class="finance-module-row"><div class="finance-module-label">${esc(r.label)}</div><div class="finance-module-track"><span class="budget" style="width:${Math.max(4,Math.round(r.budget/max*100))}%"></span><span class="${actualClass}" style="width:${Math.max(4,Math.round(r.actual/max*100))}%"></span></div><div class="finance-module-value"><b>${money(r.actual)}</b><small>av ${money(r.budget)}</small></div></div>`;
  }).join('')}</div>`;
}
function budgetLineCards(lines){
  if(!lines.length)return '<div class="empty-state"><strong>Ingen budsjettlinjer.</strong><span>Legg inn drift, vedlikehold, forsikring eller prosjekt for å få et komplett økonomibilde.</span><button class="action primary" onclick="showBudgetForm()">Ny budsjettlinje</button></div>';
  return `<div class="budget-card-list">${lines.map(l=>{
    const budget=Number(l.budget_amount||l.budget||0),actual=Number(l.actual_amount||l.actual||0),variance=actual-budget;
    return `<section class="budget-line-card ${variance>0?'bad':'ok'}"><div class="budget-line-head"><div><strong>${esc(l.category||l.label||'Budsjett')}</strong><small>${esc(l.notes||'Ingen notat')}</small></div><span class="soft-pill ${variance>0?'bad':'ok'}">${variance>0?'Over budsjett':'Innenfor'}</span></div><div class="project-numbers"><div><small>Budsjett</small><b>${money(budget)}</b></div><div><small>Faktisk</small><b>${money(actual)}</b></div><div><small>Avvik</small><b>${money(variance)}</b></div></div><div class="row-actions"><button class="action" onclick="showBudgetForm('${esc(l.id)}')">Endre</button><button class="action red" onclick="deleteRow('budget_lines','${esc(l.id)}')">Slett</button></div></section>`;
  }).join('')}</div>`;
}
function financeReportPreview(){
  const f=(DP.cache.finance||[])[0]||{},t=financeTotals(),risk=t.variance>0?'Merforbruk registrert':'Innenfor registrert budsjett';
  return `<div class="finance-report-grid"><div><small>Eiendom</small><b>${esc(currentProperty()?.name||'-')}</b></div><div><small>Bank/konto</small><b>${money(f.bank_balance)}</b></div><div><small>Reservefond</small><b>${money(f.reserved_funds)}</b></div><div><small>Budsjett</small><b>${money(t.budget)}</b></div><div><small>Faktisk</small><b>${money(t.actual)}</b></div><div><small>Avvik</small><b>${money(t.variance)}</b></div><div><small>Prosjektøkonomi</small><b>${money(t.projectActual)} av ${money(t.projectBudget)}</b></div><div><small>Vurdering</small><b>${esc(risk)}</b></div></div><div class="flow-note">Rapporten lagres som styrepapir i dokumentarkivet og kan brukes som grunnlag før styremøte.</div>`;
}
function showFinanceForm(){const f=(DP.cache.finance||[])[0]||{};showDrawer('Konto og fond',`<div class="form-grid two"><label>Bank/konto<input id="bankBalance" type="number" value="${esc(f.bank_balance||0)}"></label><label>Reservefond<input id="reserveFund" type="number" value="${esc(f.reserved_funds||0)}"></label><label>Prosjektmidler<input id="projectFunds" type="number" value="${esc(f.project_funds||0)}"></label><label>Kommentar<textarea id="financeNotes">${esc(f.notes||'')}</textarea></label></div><button class="action primary" onclick="saveFinance()">Lagre konto og fond</button>`)}
function showBudgetForm(id=''){const l=(DP.cache.budget_lines||[]).find(x=>x.id===id)||{};showDrawer(id?'Endre budsjettlinje':'Ny budsjettlinje',`<input id="budgetId" type="hidden" value="${esc(id)}"><div class="form-grid two"><label>Kategori<select id="budCat"><option ${!l.category&&!l.label?'selected':''}></option>${['Drift','Vedlikehold','Prosjekt','Energi','Forsikring','HMS','Innkjøp','Annet'].map(x=>`<option ${(l.category||l.label)===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Budsjett<input id="budBudget" type="number" value="${esc(l.budget_amount||l.budget||0)}"></label><label>Faktisk<input id="budActual" type="number" value="${esc(l.actual_amount||l.actual||0)}"></label><label>Notat<textarea id="budNotes">${esc(l.notes||'')}</textarea></label></div><button class="action primary" onclick="saveBudget()">Lagre budsjettlinje</button><div id="budgetOut" class="output">Klar til lagring.</div>`)}
function showActualCostForm(){showDrawer('Registrer faktisk kostnad',`<div class="form-grid two"><label>Kategori<select id="costCat">${['Vedlikehold','Drift','Prosjekt','Energi','Forsikring','HMS','Innkjøp','Annet'].map(x=>`<option>${x}</option>`).join('')}</select></label><label>Beløp<input id="costAmount" type="number"></label><label>Dato<input id="costDate" type="date"></label><label>Notat<textarea id="costNotes"></textarea></label></div><button class="action primary" onclick="saveActualCost()">Lagre kostnad</button>`)}
function showProjectForm(id=''){const p=(DP.cache.projects||[]).find(x=>x.id===id)||{};showDrawer(id?'Endre prosjekt':'Nytt prosjekt',`<input id="projectId" type="hidden" value="${esc(id)}"><div class="form-grid two"><label>Prosjektnavn<input id="projectName" value="${esc(p.name||p.title||'')}"></label><label>Status<select id="projectStatus"><option ${p.status==='Planlagt'?'selected':''}>Planlagt</option><option ${p.status==='Pågår'?'selected':''}>Pågår</option><option ${p.status==='Ferdig'?'selected':''}>Ferdig</option></select></label><label>Budsjett<input id="projectBudget" type="number" value="${esc(p.budget||p.budget_amount||0)}"></label><label>Faktisk kostnad<input id="projectActual" type="number" value="${esc(p.actual_cost||p.actual_amount||0)}"></label><label>Frist<input id="projectDue" type="date" value="${esc(p.due_date||'')}"></label><label>Beskrivelse<textarea id="projectDesc">${esc(p.description||'')}</textarea></label></div><button class="action primary" onclick="saveProject()">Lagre prosjekt</button>`)}
function MarketPage(){const rfqs=DP.cache.quote_requests||[],offers=DP.cache.offers||[],suppliers=DP.suppliers||[];return `<div class="grid market-page"><div class="card s12 module-hero"><div><small>Innkjøp og leverandører</small><h2>Fra forespørsel til valgt tilbud</h2><p>Opprett forespørsel, inviter leverandører, last opp tilbud og dokumenter beslutningen.</p></div><div class="module-actions"><button class="action primary" onclick="showRfqForm()">Ny tilbudsforespørsel</button><button class="action" onclick="showSupplierForm()">Ny leverandør</button><button class="action" onclick="showOfferForm()">Last opp tilbud</button></div></div><div class="card s12 market-pipeline"><div><small>Leverandører</small><b>${suppliers.length}</b><span>Registrerte firma</span></div><div><small>Forespørsler</small><b>${rfqs.length}</b><span>Aktive eller historiske RFQ</span></div><div><small>Tilbud</small><b>${offers.length}</b><span>Mottatte tilbud</span></div><div><small>Verdi</small><b>${money(offers.reduce((s,o)=>s+Number(o.price||0),0))}</b><span>Samlet tilbudsverdi</span></div></div><div class="card s4"><h3>Leverandører</h3>${supplierCards()}</div><div class="card s4"><h3>Forespørsler</h3>${rfqCards(rfqs)}</div><div class="card s4"><h3>Tilbud</h3>${offerCards(offers)}</div></div>`}
function supplierCards(){const rows=DP.suppliers||[];if(!rows.length)return '<div class="empty-state"><strong>Ingen leverandører registrert.</strong><span>Legg inn leverandører med e-post før tilbudsforespørsel sendes.</span><button class="action primary" onclick="showSupplierForm()">Ny leverandør</button></div>';return `<div class="stack-list">${rows.map(s=>`<section class="mini-record"><div><strong>${esc(s.name)}</strong><small>${esc([s.email,s.trade].filter(Boolean).join(' · '))}</small></div><button class="action red" onclick="deleteRow('suppliers','${esc(s.id)}')">Slett</button></section>`).join('')}</div>`}
function rfqCards(rows){if(!rows.length)return '<div class="empty-state"><strong>Ingen forespørsler.</strong><span>Lag en tilbudsforespørsel når en arbeidsordre skal prises.</span><button class="action primary" onclick="showRfqForm()">Ny forespørsel</button></div>';return `<div class="stack-list">${rows.map(q=>`<section class="mini-record"><div><strong>${esc(q.title||'Uten tittel')}</strong><small>${esc(q.deadline||'Ingen frist')} · ${esc(q.status||'Utkast')}</small></div><button class="action red" onclick="deleteRow('quote_requests','${esc(q.id)}')">Slett</button></section>`).join('')}</div>`}
function offerCards(rows){if(!rows.length)return '<div class="empty-state"><strong>Ingen tilbud mottatt.</strong><span>Last opp PDF og pris fra leverandør når tilbud kommer inn.</span><button class="action primary" onclick="showOfferForm()">Last opp tilbud</button></div>';return `<div class="stack-list">${rows.map(o=>`<section class="mini-record"><div><strong>${esc(o.suppliers?.name||'Leverandør')}</strong><small>${money(o.price)} · ${esc(o.status||'Mottatt')}</small></div><button class="action red" onclick="deleteRow('offers','${esc(o.id)}')">Slett</button></section>`).join('')}</div>`}
function supplierTable(){return supplierCards()}
function showSupplierForm(){showDrawer('Ny leverandør',`<label>Org.nr</label><div class="lookup-row"><input id="supOrgNo" placeholder="9 siffer"><button class="action" onclick="lookupBrregSupplier()">Hent fra Brønnøysund</button></div><label>Firma</label><input id="supName"><label>E-post</label><input id="supEmail"><label>Fagområde</label><input id="supTrade"><label>Adresse</label><input id="supAddress"><div id="supLookupOut" class="output">Skriv org.nr og hent firmainfo automatisk.</div><button class="action primary" onclick="saveSupplier()">Lagre leverandør</button>`)}
function orgDigits(value){return String(value||'').replace(/\D/g,'').slice(0,9)}
function brregAddress(entity){const a=entity?.forretningsadresse||entity?.postadresse||{};return [...(a.adresse||[]),[a.postnummer,a.poststed].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
function brregForm(entity){return entity?.organisasjonsform?.beskrivelse||entity?.organisasjonsform?.kode||''}
function setFieldValue(id,value){const el=document.getElementById(id);if(el&&value!==undefined&&value!==null)el.value=value}
function setFieldText(id,value){const el=document.getElementById(id);if(el)el.textContent=value}
async function lookupBrregOrg(orgNo){
  const digits=orgDigits(orgNo);
  if(digits.length!==9)throw new Error('Org.nr må ha 9 siffer.');
  const res=await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${digits}`,{headers:{accept:'application/json'}});
  if(res.status===404)throw new Error('Fant ikke org.nr i Brønnøysund.');
  if(!res.ok)throw new Error('Kunne ikke hente firmainfo fra Brønnøysund akkurat nå.');
  return await res.json();
}
async function lookupBrregSupplier(){
  try{
    setFieldText('supLookupOut','Henter firmainfo fra Brønnøysund...');
    const entity=await lookupBrregOrg(document.getElementById('supOrgNo')?.value);
    const address=brregAddress(entity);
    setFieldValue('supOrgNo',entity.organisasjonsnummer||orgDigits(document.getElementById('supOrgNo')?.value));
    setFieldValue('supName',entity.navn||'');
    setFieldValue('supAddress',address);
    if(!document.getElementById('supTrade')?.value&&entity.naeringskode1?.beskrivelse)setFieldValue('supTrade',entity.naeringskode1.beskrivelse);
    setFieldText('supLookupOut',`Fant ${entity.navn||'leverandør'} · ${entity.organisasjonsnummer||''}${address?' · '+address:''}`);
  }catch(e){setFieldText('supLookupOut',customerError(e,'Kunne ikke hente firmainfo. Sjekk org.nr og prøv igjen.'))}
}
async function saveSupplier(){try{requireLive('lagre leverandør');if(!supEmail.value.includes('@'))throw new Error('Leverandør må ha e-post.');const r=await db().from('suppliers').insert({name:supName.value,email:supEmail.value,trade:supTrade.value,status:'active'}).select().single();if(r.error)throw r.error;await insertActivity('Leverandør lagret','supplier',r.data.id);await finishAction('Leverandøren er lagret.','market')}catch(e){showDrawer('Leverandør ble ikke lagret',`<div class=\"output\">${esc(customerError(e))}</div>`)}}
function showRfqForm(workOrderId=''){showDrawer('Tilbudsforespørsel',`<input id="rfqWo" type="hidden" value="${esc(workOrderId)}"><label>Tittel</label><input id="rfqTitle"><label>Beskrivelse</label><textarea id="rfqDesc"></textarea><label>Frist</label><input id="rfqDeadline" type="date"><button class="action primary" onclick="saveRfq()">Lagre tilbudsforespørsel</button>`)}
async function saveRfq(){try{if(typeof subscriptionHas==='function'&&!subscriptionHas('rfq'))throw new Error('Tilbudsforespørsel krever Premium.');requireLive('Lagre tilbudsforespørsel');let row={property_id:currentProperty().id,title:rfqTitle.value,description:rfqDesc.value,deadline:rfqDeadline.value||null,status:'Utkast'};if(isUuid(rfqWo.value))row.work_order_id=rfqWo.value;const r=await db().from('quote_requests').insert(row).select().single();if(r.error)throw r.error;await insertActivity('Tilbudsforespørsel opprettet','quote_request',r.data.id);await finishAction('Tilbudsforespørselen er opprettet.','market')}catch(e){showDrawer('Tilbudsforespørsel ble ikke lagret',`<div class=\"output\">${esc(customerError(e))}</div>`)}}
function showOfferForm(){showDrawer('Last opp tilbud',`<label>Leverandør</label><select id="offerSupplier">${DP.suppliers.map(s=>`<option value="${s.id}">${esc(s.name)} - ${esc(s.email)}</option>`).join('')}</select><label>Pris</label><input id="offerPrice" type="number"><label>Forbehold</label><textarea id="offerTerms"></textarea><label>PDF</label><input id="offerFile" type="file"><button class="action primary" onclick="saveOffer()">Lagre tilbud</button><div id="offerOut" class="output"></div>`)}
async function saveOffer(){const out=document.getElementById('offerOut');try{if(typeof subscriptionHas==='function'&&!subscriptionHas('rfq'))throw new Error('Tilbudsopplasting krever Premium.');requireLive('lagre tilbud');const file=offerFile.files[0];if(!file)throw new Error('Velg PDF/vedlegg.');const path=`${currentProperty().id}/Tilbud/${Date.now()}-${file.name}`.replace(/\s+/g,'-');let up=await db().storage.from('documents').upload(path,file,{upsert:false,contentType:file.type||undefined});if(up.error)throw up.error;let doc=await db().from('documents').insert({property_id:currentProperty().id,title:file.name,category:'Tilbud',storage_path:path,mime_type:file.type,status:'Mottatt'}).select().single();if(doc.error)throw doc.error;let r=await db().from('offers').insert({property_id:currentProperty().id,supplier_id:offerSupplier.value,price:+offerPrice.value||0,reservations:offerTerms.value,status:'Mottatt'}).select().single();if(r.error)throw r.error;await insertActivity('Tilbud lastet opp','offer',r.data.id);await finishAction('Tilbudet er lastet opp.','market')}catch(e){setOutputError(out,e)}}

function MarketPage(){
  const rfqs=DP.cache.quote_requests||[],offers=DP.cache.offers||[],suppliers=DP.suppliers||[];
  const hasRfq=typeof subscriptionHas==='function'?subscriptionHas('rfq'):true;
  if(!hasRfq)return SupplierRegisterPage(suppliers);
  const sent=rfqs.filter(r=>/sendt|aktiv|publisert/i.test(r.status||'')).length,totalOfferValue=offers.reduce((s,o)=>s+Number(o.price||0),0);
  const best=offers.filter(o=>Number(o.price||0)>0).sort((a,b)=>Number(a.price||0)-Number(b.price||0))[0];
  return `<div class="grid market-page premium-market-page">
    <div class="card s12 module-hero market-hero"><div><small>Marked og tilbud</small><h2>Innkjøp fra behov til valgt leverandør</h2><p>Registrer leverandører, lag tilbudsforespørsel, last opp PDF og vurder pris, forbehold og risiko på valgt eiendom.</p></div><div class="module-actions"><button class="action primary" onclick="showRfqForm()">Lag tilbudsforespørsel</button><button class="action" onclick="showSupplierForm()">Registrer leverandør</button><button class="action" onclick="showOfferForm()">Last opp tilbud</button><button class="action" onclick="showEmailFlow('quote')">Send RFQ e-post</button></div></div>
    <div class="card s12 market-pipeline premium-market-metrics">
      <div><small>Leverandører</small><b>${suppliers.length}</b><span>Firma med e-post</span></div>
      <div><small>Forespørsler</small><b>${rfqs.length}</b><span>RFQ på eiendommen</span></div>
      <div><small>Sendt/aktiv</small><b>${sent}</b><span>Krever oppfølging</span></div>
      <div><small>Tilbud</small><b>${offers.length}</b><span>Mottatte tilbud</span></div>
      <div><small>Tilbudsverdi</small><b>${money(totalOfferValue)}</b><span>Samlet registrert verdi</span></div>
    </div>
    <div class="card s8 market-flow-card"><div class="dash-title"><div><h3>Innkjøpsflyt</h3><p class="muted">Viser om prosessen er klar for vurdering og styrebeslutning.</p></div><button class="action" onclick="showRfqForm()">Ny RFQ</button></div>${procurementFlow(rfqs,offers,suppliers)}</div>
    <div class="card s4 market-recommendation"><h3>Beste registrerte tilbud</h3>${best?offerRecommendation(best,offers):'<div class="empty-state"><strong>Ingen tilbud å vurdere.</strong><span>Last opp minst ett tilbud med pris og PDF.</span><button class="action primary" onclick="showOfferForm()">Last opp tilbud</button></div>'}</div>
    <div class="card s4"><div class="dash-title"><h3>Leverandører</h3><button class="action" onclick="showSupplierForm()">Ny</button></div>${supplierCards()}</div>
    <div class="card s4"><div class="dash-title"><h3>Forespørsler</h3><button class="action" onclick="showRfqForm()">Ny</button></div>${rfqCards(rfqs)}</div>
    <div class="card s4"><div class="dash-title"><h3>Tilbud</h3><button class="action" onclick="showOfferForm()">Last opp</button></div>${offerCards(offers)}</div>
  </div>`;
}
function SupplierRegisterPage(suppliers=DP.suppliers||[]){
  return `<div class="grid market-page supplier-only-page">
    <div class="card s12 module-hero market-hero"><div><small>Leverandørregister</small><h2>Leverandører for ${esc(currentProperty()?.name||'valgt eiendom')}</h2><p>Pro-pakken gir leverandørregister med firma, e-post, fagområde og historikk. Tilbudsforespørsel, tilbudsopplasting og RFQ er Premium.</p></div><div class="module-actions"><button class="action primary" onclick="showSupplierForm()">Registrer leverandør</button><button class="action" onclick="showEmailFlow('general')">Send e-post</button></div></div>
    <div class="card s4 market-pipeline"><div><small>Leverandører</small><b>${suppliers.length}</b><span>Registrerte firma</span></div></div>
    <div class="card s8"><div class="dash-title"><div><h3>Leverandørregister</h3><p class="muted">Legg inn leverandører med e-post og fagområde før Premium RFQ eventuelt tas i bruk.</p></div><button class="action primary" onclick="showSupplierForm()">Ny leverandør</button></div>${supplierCards()}</div>
    <div class="card s4"><h3>Premium-funksjoner</h3><div class="empty-state"><strong>RFQ og tilbud er Premium.</strong><span>Oppgrader til Premium for tilbudsinnhenting, PDF-opplasting, tilbudsvurdering og tildeling.</span></div></div>
  </div>`;
}
function supplierName(id){const s=(DP.suppliers||[]).find(x=>x.id===id);return s?.name||'Leverandør'}
function procurementFlow(rfqs,offers,suppliers){
  const steps=[
    ['Leverandører',suppliers.length,'Registrer aktuelle firma med e-post',suppliers.length?'ok':'warn'],
    ['Forespørsel',rfqs.length,'Lag RFQ med frist og beskrivelse',rfqs.length?'ok':'warn'],
    ['Tilbud/PDF',offers.length,'Last opp tilbud og forbehold',offers.length?'ok':'warn'],
    ['Vurdering',offers.length>1?offers.length:0,'Sammenlign pris og risiko',offers.length>1?'ok':'warn'],
    ['Beslutning',offers.some(o=>/valgt|godkjent/i.test(o.status||''))?1:0,'Velg leverandør og dokumenter valg',offers.some(o=>/valgt|godkjent/i.test(o.status||''))?'ok':'warn']
  ];
  return `<div class="procurement-steps">${steps.map((s,i)=>`<section class="procurement-step ${s[3]}"><span>${i+1}</span><div><b>${esc(s[0])}</b><strong>${esc(String(s[1]))}</strong><small>${esc(s[2])}</small></div></section>`).join('')}</div>`;
}
function offerRecommendation(best,offers){
  const avg=offers.length?offers.reduce((s,o)=>s+Number(o.price||0),0)/offers.length:0;
  const diff=avg?Math.round((1-Number(best.price||0)/avg)*100):0;
  return `<div class="offer-recommend"><strong>${esc(supplierName(best.supplier_id)||best.suppliers?.name||'Leverandør')}</strong><b>${money(best.price)}</b><span>${diff>0?`${diff}% lavere enn snittet`:'Laveste registrerte pris'}</span><p>${esc(best.reservations||'Ingen forbehold registrert.')}</p><div class="row-actions"><button class="action primary" onclick="markOfferSelected('${esc(best.id)}')">Marker valgt</button><button class="action" onclick="showOfferForm()">Last opp mer</button></div></div>`;
}
function supplierCards(){const rows=DP.suppliers||[],hasRfq=typeof subscriptionHas==='function'?subscriptionHas('rfq'):true;if(!rows.length)return '<div class="empty-state"><strong>Ingen leverandører registrert.</strong><span>Legg inn leverandører med e-post før tilbudsforespørsel sendes.</span><button class="action primary" onclick="showSupplierForm()">Ny leverandør</button></div>';return `<div class="market-card-list">${rows.map(s=>`<section class="market-record supplier-record"><div><strong>${esc(s.name||'Leverandør')}</strong><small>${esc(s.trade||'Fagområde ikke satt')}</small></div><div class="market-record-meta"><span>${esc(s.email||'Mangler e-post')}</span>${s.status?`<span>${esc(s.status)}</span>`:''}</div><div class="row-actions">${hasRfq?`<button class="action" onclick="showRfqForm()">Lag RFQ</button>`:''}<button class="action red" onclick="deleteRow('suppliers','${esc(s.id)}')">Slett</button></div></section>`).join('')}</div>`}
function rfqCards(rows){if(!rows.length)return '<div class="empty-state"><strong>Ingen forespørsler.</strong><span>Lag en tilbudsforespørsel når en arbeidsordre skal prises.</span><button class="action primary" onclick="showRfqForm()">Ny forespørsel</button></div>';return `<div class="market-card-list">${rows.map(q=>{const status=q.status||'Utkast';return `<section class="market-record rfq-record"><div class="market-record-head"><div><strong>${esc(q.title||'Uten tittel')}</strong><small>${esc(q.description||'Ingen beskrivelse')}</small></div><span class="soft-pill ${/sendt|aktiv|publisert/i.test(status)?'ok':'warn'}">${esc(status)}</span></div><div class="market-record-meta"><span>Frist: ${esc(q.deadline||'Ikke satt')}</span>${q.work_order_id?'<span>Knyttet til arbeidsordre</span>':''}</div><div class="row-actions"><button class="action" onclick="markRfqSent('${esc(q.id)}')">Marker sendt</button><button class="action" onclick="showOfferForm()">Registrer tilbud</button><button class="action red" onclick="deleteRow('quote_requests','${esc(q.id)}')">Slett</button></div></section>`}).join('')}</div>`}
function offerCards(rows){if(!rows.length)return '<div class="empty-state"><strong>Ingen tilbud mottatt.</strong><span>Last opp PDF og pris fra leverandør når tilbud kommer inn.</span><button class="action primary" onclick="showOfferForm()">Last opp tilbud</button></div>';const sorted=[...rows].sort((a,b)=>Number(a.price||0)-Number(b.price||0));return `<div class="market-card-list">${sorted.map((o,i)=>`<section class="market-record offer-record ${i===0?'best':''}"><div class="market-record-head"><div><strong>${esc(supplierName(o.supplier_id)||o.suppliers?.name||'Leverandør')}</strong><small>${esc(o.reservations||'Ingen forbehold registrert')}</small></div><span class="soft-pill ${i===0?'ok':'info'}">${i===0?'Laveste pris':esc(o.status||'Mottatt')}</span></div><div class="offer-price">${money(o.price)}</div><div class="row-actions"><button class="action primary" onclick="markOfferSelected('${esc(o.id)}')">Velg</button><button class="action red" onclick="deleteRow('offers','${esc(o.id)}')">Slett</button></div></section>`).join('')}</div>`}
function showSupplierForm(){showDrawer('Ny leverandør',`<div class="form-grid two"><label>Org.nr<div class="lookup-row"><input id="supOrgNo" placeholder="9 siffer"><button class="action" onclick="lookupBrregSupplier()">Hent</button></div></label><label>Firma<input id="supName"></label><label>E-post<input id="supEmail" type="email"></label><label>Fagområde<select id="supTrade">${['Tak','VVS','Elektro','Brann','HMS','Heis','Uteområde','Bygg','Annet'].map(x=>`<option>${x}</option>`).join('')}</select></label><label>Adresse<input id="supAddress"></label></div><div id="supLookupOut" class="output">Skriv org.nr og hent firmainfo automatisk.</div><button class="action primary" onclick="saveSupplier()">Lagre leverandør</button>`)}
function showRfqForm(workOrderId=''){if(typeof subscriptionHas==='function'&&!subscriptionHas('rfq')){showDrawer('Tilbudsforespørsel er Premium-funksjon','<div class="empty-state"><strong>Oppgrader til Premium for RFQ.</strong><span>Pro-pakken har leverandørregister. Premium åpner tilbudsinnhenting, PDF-opplasting og vurdering.</span></div>');return}const suppliers=DP.suppliers||[];showDrawer('Tilbudsforespørsel',`<input id="rfqWo" type="hidden" value="${esc(workOrderId)}"><div class="form-grid two"><label>Tittel<input id="rfqTitle" placeholder="F.eks. Tak/VVS - tilbudsforespørsel"></label><label>Frist<input id="rfqDeadline" type="date"></label><label>Beskrivelse<textarea id="rfqDesc" placeholder="Beskriv arbeid, befaring, krav og ønsket dokumentasjon."></textarea></label><label>Leverandører<div class="choice-list">${suppliers.length?suppliers.map(s=>`<label class="check-row"><input type="checkbox" class="rfqSupplier" value="${esc(s.id)}"> ${esc(s.name)} · ${esc(s.email||'mangler e-post')}</label>`).join(''):'<span class="muted">Ingen leverandører registrert ennå.</span>'}</div></label></div><div class="flow-note">Valgte leverandører vises som grunnlag for utsending. Selve e-posten sendes fra e-postflyten.</div><button class="action primary" onclick="saveRfq()">Lagre tilbudsforespørsel</button>`)}
function showOfferForm(){if(typeof subscriptionHas==='function'&&!subscriptionHas('rfq')){showDrawer('Tilbudsopplasting er Premium-funksjon','<div class="empty-state"><strong>Oppgrader til Premium for tilbud.</strong><span>Premium åpner tilbudsopplasting, PDF, forbehold, vurdering og tildeling.</span></div>');return}const suppliers=DP.suppliers||[],rfqs=DP.cache.quote_requests||[];showDrawer('Last opp tilbud',`<div class="form-grid two"><label>Leverandør<select id="offerSupplier">${suppliers.map(s=>`<option value="${s.id}">${esc(s.name)} - ${esc(s.email||'mangler e-post')}</option>`).join('')}</select></label><label>Gjelder forespørsel<select id="offerRfq"><option value="">Ikke knyttet</option>${rfqs.map(r=>`<option value="${esc(r.id)}">${esc(r.title||'RFQ')}</option>`).join('')}</select></label><label>Pris<input id="offerPrice" type="number"></label><label>Forbehold<textarea id="offerTerms" placeholder="Forbehold, leveringstid, garantier eller avklaringer"></textarea></label><label>PDF/vedlegg<input id="offerFile" type="file"></label></div><button class="action primary" onclick="saveOffer()">Lagre tilbud</button><div id="offerOut" class="output"></div>`)}
async function markRfqSent(id){try{if(typeof subscriptionHas==='function'&&!subscriptionHas('rfq'))throw new Error('RFQ krever Premium.');requireLive('oppdatere tilbudsforespørsel');const r=await db().from('quote_requests').update({status:'Sendt'}).eq('id',id).select().single();if(r.error)throw r.error;await insertActivity('Tilbudsforespørsel markert sendt','quote_request',id);await finishAction('Tilbudsforespørselen er markert som sendt.','market')}catch(e){showDrawer('Kunne ikke oppdatere forespørsel',`<div class="output">${esc(customerError(e))}</div>`)}}
async function markOfferSelected(id){try{if(typeof subscriptionHas==='function'&&!subscriptionHas('rfq'))throw new Error('Tilbudsvurdering krever Premium.');requireLive('velge tilbud');const r=await db().from('offers').update({status:'Valgt'}).eq('id',id).select().single();if(r.error)throw r.error;await insertActivity('Tilbud valgt','offer',id);await finishAction('Tilbudet er markert som valgt.','market')}catch(e){showDrawer('Kunne ikke velge tilbud',`<div class="output">${esc(customerError(e))}</div>`)}}

function AdminPage(){return `<div class="grid admin-page"><div class="card s12">${LaunchControlPage()}</div><div class="card s12 module-hero"><div><small>Kundeoppsett</small><h2>Ny kunde</h2><p>Opprett kunde, eiendom, styre, beboere, leverandører, FDV-mapper, økonomi og brukere i én kontrollert flyt.</p></div><div class="module-actions"><button class="action primary" onclick="showNewCustomerWizard()">Start onboarding</button></div></div><div class="card s6"><h3>Driftskontroll</h3><p class="muted">Sjekker at appen kjører på ren produksjonspakke og at valgt eiendom er klar.</p><button class="action primary" onclick="runCleanCheck()">Kjør kontroll</button><div id="adminOut" class="output"></div></div><div class="card s6"><h3>Rolle- og tilgangstest</h3>${roleAccessPanel()}</div><div class="card s12"><h3>Aktivitet</h3>${activityCards()}</div></div>`}
function activityCards(){const rows=(DP.cache.activity||[]).slice(0,12);if(!rows.length)return '<div class="empty-state"><strong>Ingen aktivitet registrert.</strong><span>Når brukere oppretter, endrer eller sender noe, vises historikken her.</span></div>';return `<div class="stack-list">${rows.map(a=>`<section class="mini-record"><div><strong>${esc(a.action||'Hendelse')}</strong><small>${esc([a.entity_type,a.created_at].filter(Boolean).join(' · '))}</small></div></section>`).join('')}</div>`}
function launchStatus(label,ok,warnText='',okText='Klar'){
  const type=ok===true?'ok':ok==='warn'?'warn':'bad';
  const text=ok===true?okText:ok==='warn'?warnText:'Må fikses';
  return `<tr><td>${esc(label)}</td><td><span class="badge ${type}">${esc(text)}</span></td><td>${esc(launchAdvice(label,ok))}</td></tr>`;
}
function launchAdvice(label,ok){
  if(ok===true)return 'Klar.';
  const map={
    'Innlogging':'Test live innlogging med en ekte bruker.',
    'Live eiendom':'Velg en ekte eiendom før pilot.',
    'Rolle/tilgang':'Test egne brukere for styreleder, styremedlem, beboer, vaktmester og leverandør.',
    'Avvik':'Opprett minst ett live avvik.',
    'Arbeidsordre':'Lag arbeidsordre fra avvik.',
    'Tilbud/RFQ':'Opprett tilbudsforespørsel og registrer minst ett tilbud.',
    'Dokumentarkiv':'Last opp eller generer minst ett dokument på eiendommen.',
    'Økonomi':'Legg inn konto/reservefond og minst én budsjettlinje.',
    'Styre/beboere':'Legg inn styremedlem og beboer/kontaktperson.',
    'Leverandører':'Legg inn leverandør med e-post.',
    'Aktivitetslogg':'Utfør en lagring slik at hendelse logges.',
    'Kommersiell pakke':'Sjekk at kommersiell side er publisert og tilgjengelig.',
    'E-post':'Send demo/bestilling eller system-e-post fra live-siden.'
  };
  return map[label]||'Kontroller punktet før salg.';
}
function launchRows(){
  const contacts=DP.cache.contacts||[],devs=DP.cache.deviations||[],wos=DP.cache.work_orders||[],docs=DP.cache.documents||[],rfqs=DP.cache.quote_requests||[],offers=DP.cache.offers||[],finance=DP.cache.finance||[],budget=DP.cache.budget_lines||[],activity=DP.cache.activity||[];
  const board=contacts.some(c=>/styre|leder|vara/i.test(c.role||''));
  const resident=contacts.some(c=>/bebo|enhet|leilighet/i.test(c.role||''));
  const liveProperty=isUuid(currentProperty()?.id);
  return [
    launchStatus('Innlogging',!!DP.session&&!!DP.user),
    launchStatus('Live eiendom',liveProperty),
    launchStatus('Rolle/tilgang',!!DP.user?.role&&DP.properties.length>0),
    launchStatus('Avvik',devs.length>0),
    launchStatus('Arbeidsordre',wos.length>0),
    launchStatus('Tilbud/RFQ',rfqs.length>0&&offers.length>0,rfqs.length>0?'Forespørsel klar, mangler tilbud':'Mangler forespørsel/tilbud'),
    launchStatus('Dokumentarkiv',docs.length>0),
    launchStatus('Økonomi',finance.length>0&&budget.length>0,finance.length>0?'Konto klar, mangler budsjett':'Mangler økonomi'),
    launchStatus('Styre/beboere',board&&resident,board||resident?'Mangler styre eller beboer':'Mangler kontakter'),
    launchStatus('Leverandører',(DP.suppliers||[]).some(s=>String(s.email||'').includes('@'))),
    launchStatus('Aktivitetslogg',activity.length>0),
    launchStatus('Kommersiell pakke',true),
    launchStatus('E-post','warn','Må testes live')
  ];
}
function launchSummary(){
  const html=launchRows().join('');
  const bad=(html.match(/badge bad/g)||[]).length,warn=(html.match(/badge warn/g)||[]).length,total=(html.match(/<tr>/g)||[]).length;
  const ready=bad===0&&warn===0;
  return {bad,warn,total,ready};
}
function LaunchControlPage(){
  const s=launchSummary();
  const verdict=s.ready?'Klar for pilot':s.bad?'Ikke salgsklar ennå':'Nesten klar';
  const type=s.ready?'ok':s.bad?'bad':'warn';
  return `<div class="dash-title"><div><h3>Lanseringskontroll</h3><p class="muted">Viser om valgt eiendom og produksjonsoppsett er klart for kundepilot og salg.</p></div><div><span class="badge ${type}">${esc(verdict)}</span></div></div><div class="ops-budget-summary"><div><small>Bestått</small><b>${s.total-s.bad-s.warn}/${s.total}</b></div><div><small>Må fikses</small><b>${s.bad}</b></div><div><small>Må testes</small><b>${s.warn}</b></div></div><div><button class="action primary" onclick="runLaunchControl()">Kjør lanseringskontroll</button><button class="action" onclick="hydrateAll().then(render)">Hent live data</button><button class="action" onclick="location.href='kommersielt.html'">Åpne kommersiell pakke</button></div><div id="launchOut" class="output">${esc(DP.cache.launch_control_result||'Velg live eiendom og kjør kontroll før pilot.')}</div><h4>Statuspunkter</h4>${table(['Område','Status','Neste handling'],launchRows())}`;
}
async function runLaunchControl(){
  const out=document.getElementById('launchOut');
  try{
    if(out)out.textContent='Henter live data og kontrollerer lanseringsstatus...';
    if(!DP.session||!DP.user)throw new Error('Logg inn før lanseringskontroll.');
    if(!isUuid(currentProperty()?.id))throw new Error('Velg en ekte eiendom før du kjører kontrollen.');
    await hydrateAll();
    const s=launchSummary();
    const lines=[
      `Eiendom: ${currentProperty()?.name||'-'}`,
      `Rolle: ${appRole()||'-'}`,
      `Bestått: ${s.total-s.bad-s.warn}/${s.total}`,
      `Må fikses: ${s.bad}`,
      `Må testes manuelt: ${s.warn}`,
      s.bad?'Status: Ikke salgsklar ennå. Fiks røde punkter først.':s.warn?'Status: Nesten klar. Test gule punkter live.':'Status: Klar for pilot.'
    ];
    DP.cache.launch_control_result=lines.join('\n');
    if(out)out.textContent=DP.cache.launch_control_result;
    await insertActivity('Lanseringskontroll kjørt','launch_control',currentProperty().id);
    render();
  }catch(e){setOutputError(out,e,'Lanseringskontroll kunne ikke kjøres.')}
}
function roleAccessPanel(){
  const role=appRole(),menus=visibleMenus().map(m=>m[1]).join(', ')||'Ingen';
  const props=(DP.properties||[]).map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.customer||'-')}</td><td>${esc(p.access_role||role||'-')}</td></tr>`);
  const expected=[
    ['superadmin','Alle menyer','Alle eiendommer'],
    ['forvalter','Driftsmenyer','Kun tildelte eiendommer'],
    ['styreleder','Dashboard, eiendom, styre/beboere, avvik/arbeid, FDV, økonomi, marked','Kun egne eiendommer'],
    ['styremedlem','Dashboard, styre/beboere, avvik/arbeid, FDV, økonomi','Kun egne eiendommer'],
    ['vaktmester','Dashboard, avvik/arbeid, FDV','Kun tildelte eiendommer'],
    ['beboer','Avvik/arbeid','Kun egen eiendom'],
    ['leverandør','Marked/tilbud','Kun egne oppdrag/tilbud']
  ].map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`);
  return `<div class="split"><div><h4>Aktiv bruker</h4><table><tr><td>Rolle</td><td>${esc(role||'-')}</td></tr><tr><td>Synlige menyer</td><td>${esc(menus)}</td></tr><tr><td>Eiendommer</td><td>${DP.properties.length}</td></tr></table></div><div><h4>Eiendomstilgang</h4>${table(['Eiendom','Kunde','Tilgang'],props,'Ingen eiendomstilgang funnet.')}</div></div><h4>Forventet meny per rolle</h4>${table(['Rolle','Menyer','Eiendomstilgang'],expected)}`;
}
function runCleanCheck(){const lines=[];lines.push(DP.session?'Klar: Innlogging':'Mangler: Innlogging');lines.push(isUuid(currentProperty()?.id)?'Klar: Ekte eiendom':'Mangler: Ekte eiendom');lines.push(`Rolle: ${appRole()||'-'}`);lines.push(`Synlige menyer: ${visibleMenus().map(m=>m[1]).join(', ')||'Ingen'}`);lines.push(`Eiendomstilgang: ${DP.properties.length}`);lines.push(`Aktive appdeler: ${document.querySelectorAll('script[src*="assets/prod/"]').length}`);lines.push(document.querySelectorAll('script[src*="assets/modules/"]').length?'Må ryddes: gammel modul lastes':'Klar: kun produksjonsapp lastes');document.getElementById('adminOut').textContent=lines.join('\n')}

function launchChecks(){
  const contacts=DP.cache.contacts||[],devs=DP.cache.deviations||[],wos=DP.cache.work_orders||[],docs=DP.cache.documents||[],rfqs=DP.cache.quote_requests||[],offers=DP.cache.offers||[],finance=DP.cache.finance||[],budget=DP.cache.budget_lines||[],activity=DP.cache.activity||[];
  const board=contacts.some(c=>/styre|leder|vara/i.test(c.role||'')),resident=contacts.some(c=>/bebo|enhet|leilighet/i.test(c.role||'')),liveProperty=isUuid(currentProperty()?.id);
  const hasWorkOrders=typeof subscriptionHas==='function'?subscriptionHas('work_orders'):true;
  const hasFinance=typeof subscriptionHas==='function'?subscriptionHas('finance'):true;
  const hasRfq=typeof subscriptionHas==='function'?subscriptionHas('rfq'):true;
  const checks=[
    {label:'Innlogging',ok:!!DP.session&&!!DP.user,group:'Sikkerhet',action:'Test live innlogging med ekte bruker.'},
    {label:'Live eiendom',ok:liveProperty,group:'Kunde',action:'Velg eller opprett en Supabase-eiendom.'},
    {label:'Rolle/tilgang',ok:!!DP.user?.role&&DP.properties.length>0,group:'Sikkerhet',action:'Test superadmin, styreleder, beboer, vaktmester og leverandør.'},
    {label:'Avvik',ok:devs.length>0,group:'Drift',action:'Opprett minst ett live avvik.'},
    {label:'Dokumentarkiv',ok:docs.length>0,group:'Dokument',action:'Last opp eller generer et dokument på eiendommen.'},
    {label:'Styre/beboere',ok:board&&resident,warn:board||resident,group:'Kunde',action:'Legg inn både styremedlem og beboer.'},
    {label:'Leverandører',ok:(DP.suppliers||[]).some(s=>String(s.email||'').includes('@')),group:'Innkjøp',action:'Legg inn leverandør med e-post.'},
    {label:'Aktivitetslogg',ok:activity.length>0,group:'Audit',action:'Utfør en lagring slik at hendelse logges.'},
    {label:'Kommersiell pakke',ok:true,group:'Salg',action:'Klar.'},
    {label:'E-post',ok:false,warn:true,group:'Kommunikasjon',action:'Send en test fra live-siden før kundepilot.'}
  ];
  if(hasWorkOrders)checks.splice(4,0,{label:'Arbeidsordre',ok:wos.length>0,group:'Drift',action:'Lag arbeidsordre fra et avvik.'});
  if(hasFinance)checks.splice(checks.findIndex(c=>c.label==='Styre/beboere'),0,{label:'Økonomi',ok:finance.length>0&&budget.length>0,warn:finance.length>0,group:'Økonomi',action:finance.length>0?'Legg inn minst én budsjettlinje.':'Legg inn konto/reservefond og budsjett.'});
  if(hasRfq)checks.splice(checks.findIndex(c=>c.label==='Økonomi'||c.label==='Styre/beboere'),0,{label:'Tilbud/RFQ',ok:rfqs.length>0&&offers.length>0,warn:rfqs.length>0,group:'Innkjøp',action:rfqs.length>0?'Registrer minst ett tilbud/PDF.':'Lag tilbudsforespørsel og registrer tilbud.'});
  return checks;
}
function checkType(c){return c.ok?'ok':c.warn?'warn':'bad'}
function launchRows(){return launchChecks().map(c=>launchStatus(c.label,c.ok?true:c.warn?'warn':false,c.warn?'Må testes':'Må fikses'))}
function launchSummary(){const rows=launchChecks(),bad=rows.filter(c=>!c.ok&&!c.warn).length,warn=rows.filter(c=>!c.ok&&c.warn).length,total=rows.length;return {bad,warn,total,ready:bad===0&&warn===0}}
function LaunchControlPage(){
  const s=launchSummary(),rows=launchChecks(),ready=s.total-s.bad-s.warn;
  const verdict=s.ready?'Klar for pilot':s.bad?'Må ryddes før pilot':'Nesten klar';
  const type=s.ready?'ok':s.bad?'bad':'warn';
  const customerButton=(typeof canManageCustomers==='function'&&canManageCustomers())?`<button class="action" onclick="showNewCustomerWizard()">Ny kunde</button>`:'';
  return `<div class="launch-control premium-control"><div class="control-head"><div><small>Lanseringskontroll</small><h3>${esc(verdict)}</h3><p>Kontrollerer om valgt eiendom har nok live-data, roller og driftsgrunnlag til pilot og salg.</p></div><span class="launch-ring ${type}"><b>${ready}/${s.total}</b><small>klart</small></span></div><div class="launch-summary-grid"><div><small>Klar</small><b>${ready}</b></div><div><small>Må fikses</small><b>${s.bad}</b></div><div><small>Må testes</small><b>${s.warn}</b></div></div><div class="module-actions"><button class="action primary" onclick="runLaunchControl()">Kjør kontroll</button><button class="action" onclick="hydrateAll().then(render)">Hent live data</button>${customerButton}<button class="action" onclick="location.href='kommersielt.html'">Kommersiell pakke</button></div><div id="launchOut" class="output">${esc(DP.cache.launch_control_result||'Kjør kontroll før pilot eller kundedemo.')}</div><div class="launch-check-grid">${rows.map(launchCheckCard).join('')}</div></div>`;
}
function launchCheckCard(c){
  const type=checkType(c),text=c.ok?'Klar':c.warn?'Må testes':'Må fikses';
  return `<section class="launch-check ${type}"><div><small>${esc(c.group)}</small><strong>${esc(c.label)}</strong></div><span>${esc(text)}</span><p>${esc(c.ok?'Klar.':c.action)}</p></section>`;
}
async function runLaunchControl(){
  const out=document.getElementById('launchOut');
  try{
    if(out)out.textContent='Henter live data og kjører kontroll...';
    if(!DP.session||!DP.user)throw new Error('Logg inn før lanseringskontroll.');
    if(!isUuid(currentProperty()?.id))throw new Error('Velg en ekte eiendom før du kjører kontrollen.');
    await hydrateAll();
    const s=launchSummary(),status=s.ready?'Klar for pilot':s.bad?'Må ryddes før pilot':'Nesten klar';
    DP.cache.launch_control_result=`${currentProperty()?.name||'Eiendom'}: ${status}. Klar ${s.total-s.bad-s.warn}/${s.total}. Må fikses ${s.bad}. Må testes ${s.warn}.`;
    if(out)out.textContent=DP.cache.launch_control_result;
    await insertActivity('Lanseringskontroll kjørt','launch_control',currentProperty().id);
    render();
  }catch(e){setOutputError(out,e,'Lanseringskontroll kunne ikke kjøres.')}
}
function AdminPage(){
  if(typeof canManageCustomers==='function'&&!canManageCustomers())return `<div class="grid admin-page"><div class="card s12"><div class="empty-state"><strong>Ingen tilgang til kundeoppsett.</strong><span>Ny kunde og onboarding kan bare utføres av superadmin.</span></div></div></div>`;
  const s=launchSummary();
  return `<div class="grid admin-page premium-admin-page"><div class="card s12 module-hero control-hero"><div><small>Kontrollsenter</small><h2>Produksjonskontroll og onboarding</h2><p>Her ser du om valgt eiendom er klar for pilot, om roller/tilgang stemmer, og hva som bør fullføres før kunde tas i bruk.</p></div><div class="module-actions"><button class="action primary" onclick="runLaunchControl()">Kjør kontroll</button><button class="action" onclick="showNewCustomerWizard()">Ny kunde</button><button class="action" onclick="hydrateAll().then(render)">Oppdater</button></div></div><div class="card s12">${LaunchControlPage()}</div><div class="card s6 control-panel"><div class="dash-title"><div><h3>Onboarding</h3><p class="muted">Kunde ? eiendom ? styre/beboere ? leverandører ? FDV ? økonomi ? brukere.</p></div><button class="action primary" onclick="showNewCustomerWizard()">Start</button></div><div class="control-mini-grid"><div><small>Eiendommer</small><b>${DP.properties.length}</b></div><div><small>Klar status</small><b>${s.total-s.bad-s.warn}/${s.total}</b></div><div><small>Rolle</small><b>${esc(appRole()||'-')}</b></div></div></div><div class="card s6 control-panel"><div class="dash-title"><div><h3>Rolle og tilgang</h3><p class="muted">Bekreft at brukeren bare ser riktige menyer og eiendommer.</p></div></div>${roleAccessPanel()}</div><div class="card s12 control-panel"><div class="dash-title"><div><h3>Siste aktivitet</h3><p class="muted">Sporing av endringer og hendelser på valgt eiendom.</p></div><button class="action" onclick="hydrateAll().then(render)">Oppdater</button></div>${activityCards()}</div></div>`;
}
function activityCards(){const rows=(DP.cache.activity||[]).slice(0,12);if(!rows.length)return '<div class="empty-state"><strong>Ingen aktivitet registrert.</strong><span>Når brukere oppretter, endrer, sender eller laster opp noe, vises historikken her.</span></div>';return `<div class="activity-feed control-activity">${rows.map(a=>`<section><span>${esc(String(a.entity_type||'Logg').slice(0,12))}</span><div><strong>${esc(a.action||'Hendelse')}</strong><small>${esc([currentProperty()?.name,a.created_at?new Date(a.created_at).toLocaleString('nb-NO'):''].filter(Boolean).join(' · '))}</small></div></section>`).join('')}</div>`}
function roleAccessPanel(){
  const role=appRole(),menus=visibleMenus(),props=DP.properties||[];
  return `<div class="role-access-cards"><section><small>Aktiv rolle</small><strong>${esc(role||'-')}</strong><span>${esc(DP.user?.email||'Ingen e-post')}</span></section><section><small>Synlige menyer</small><strong>${menus.length}</strong><span>${esc(menus.map(m=>m[1]).join(', ')||'Ingen')}</span></section><section><small>Eiendomstilgang</small><strong>${props.length}</strong><span>${esc(props.map(p=>p.name).slice(0,3).join(', ')||'Ingen eiendom')}</span></section></div><div class="role-matrix"><h4>Forventet rolleoppsett</h4>${[
    ['Superadmin','Alle menyer og alle eiendommer'],
    ['Styreleder','Menyer etter rolle og valgt abonnement'],
    ['Styremedlem','Styre, FDV, avvik og eventuelle Pro/Premium-moduler'],
    ['Beboer','Kun avvik/henvendelser'],
    ['Vaktmester','Avvik, arbeidsordre og FDV'],
    ['Leverandør','Kun tilbud/oppdrag']
  ].map(r=>`<div><b>${esc(r[0])}</b><span>${esc(r[1])}</span></div>`).join('')}</div>`;
}
function runCleanCheck(){const out=document.getElementById('adminOut');const s=launchSummary();if(out)out.textContent=`Kontroll fullført. Klar ${s.total-s.bad-s.warn}/${s.total}. Må fikses ${s.bad}. Må testes ${s.warn}.`;runLaunchControl()}

function integrationItems(){
  const canCustomerSetup=typeof canManageCustomers==='function'&&canManageCustomers();
  return [
    {name:'Supabase',status:'Aktiv',type:'ok',area:'Database, innlogging og dokumentarkiv',detail:'Live kundedata, tilgang per eiendom og Storage for dokumenter.',button:'Test live data',action:'hydrateAll().then(render)'},
    {name:'Resend',status:'Aktiv',type:'ok',area:'E-post',detail:'Brukes til demoforespørsler, bestilling, varsler og systemmeldinger.',button:'Åpne e-posttest',action:"location.href='mail-test.html'"},
    {name:'OpenAI',status:'Aktiv når kvote er tilgjengelig',type:'warn',area:'AI Director og Property Brain',detail:'Gir anbefalinger fra live data. Krever aktiv API-kvote for å svare.',button:'Test AI',action:'testAiIntegration()'},
    {name:'Brønnøysundregistrene',status:'Klar for onboarding',type:'ok',area:'Kunde og leverandører',detail:'Org.nr-oppslag kan fylle inn firmanavn og adresse ved opprettelse.',button:canCustomerSetup?'Ny kunde':'Klar',action:canCustomerSetup?'showNewCustomerWizard()':"showIntegrationInfo('Brønnøysundregistrene')"},
    {name:'Kundeavsender / svar til',status:'Aktiv enkel løsning',type:'ok',area:'E-post',detail:'E-post sendes via Driftspartner, men vises med kundens/styrets navn og svar går til kunden.',button:'Send e-post',action:"showEmailFlow('all')"},
    {name:'Microsoft 365 / Outlook',status:'Premium senere',type:'info',area:'E-post, kalender og styremøter',detail:'Kan senere kobles for ekte Outlook-avsender, møteinnkalling og kalender.',button:'Se anbefaling',action:"showIntegrationInfo('Microsoft 365 / Outlook')"},
    {name:'Signering',status:'Anbefalt V1',type:'warn',area:'Kontrakter og vedtak',detail:'Digital signering bør brukes for kontrakter, styrevedtak og godkjenninger.',button:'Se anbefaling',action:"showIntegrationInfo('Signering')"},
    {name:'Tripletex',status:'Planlagt',type:'info',area:'Regnskap',detail:'Aktuell for faktura, prosjektkostnader, budsjett og rapportering.',button:'Se anbefaling',action:"showIntegrationInfo('Tripletex')"},
    {name:'PowerOffice Go',status:'Planlagt',type:'info',area:'Regnskap',detail:'Alternativ regnskapsintegrasjon for borettslag, sameier og forvaltere.',button:'Se anbefaling',action:"showIntegrationInfo('PowerOffice Go')"},
    {name:'Fiken',status:'Planlagt',type:'info',area:'Regnskap',detail:'Enklere regnskapskobling for mindre kunder og startpakker.',button:'Se anbefaling',action:"showIntegrationInfo('Fiken')"},
    {name:'Bank / kontoutskrift',status:'Planlagt',type:'info',area:'Økonomi',detail:'Import av saldo og transaksjoner vil gjøre økonomien mer automatisk og troverdig.',button:'Se anbefaling',action:"showIntegrationInfo('Bank / kontoutskrift')"}
  ];
}
function IntegrationsPage(){
  const items=integrationItems(),active=items.filter(i=>i.type==='ok').length,next=items.filter(i=>i.type==='warn').length,planned=items.filter(i=>i.type==='info').length;
  const customerButton=(typeof canManageCustomers==='function'&&canManageCustomers())?`<button class="action" onclick="showNewCustomerWizard()">Ny kunde</button>`:'';
  return `<div class="grid integrations-page"><div class="card s12 module-hero integration-hero"><div><small>Integrasjoner</small><h2>Koble Driftspartner OS til verktøyene kundene bruker</h2><p>Her samles e-post, AI, regnskap, signering, offentlige data og kalender. Målet er mindre manuelt arbeid og mer live informasjon på valgt eiendom.</p></div><div class="module-actions"><button class="action primary" onclick="showEmailFlow('all')">Send som kunde/styre</button><button class="action" onclick="testAiIntegration()">Test AI</button><button class="action" onclick="location.href='mail-test.html'">Test e-post</button>${customerButton}</div></div><div class="card s12 integration-summary"><section><small>Aktive</small><b>${active}</b><span>Koblinger i bruk nå</span></section><section><small>Anbefalt neste</small><b>${next}</b><span>Gir raskest kundeverdi</span></section><section><small>Planlagt</small><b>${planned}</b><span>Regnskap og bank</span></section><section><small>Prioritet</small><b>Kundeavsender</b><span>Enkel løsning uten Microsoft-admin</span></section></div><div class="card s8"><div class="dash-title"><div><h3>Integrasjonsstatus</h3><p class="muted">Bare koblinger som faktisk er klare bør merkes som aktive.</p></div></div><div class="integration-card-grid">${items.map(integrationCard).join('')}</div></div><div class="card s4 integration-stack"><h3>Anbefalt rekkefølge</h3>${integrationRoadmap()}<div class="integration-note"><strong>V1 for salg</strong><span>Start med Brønnøysund, kundeavsender/svar-til, signering og én regnskapskobling. Outlook kan komme senere som premium-integrasjon.</span></div></div></div>`;
}
function integrationCard(item){
  const label=item.type==='ok'?'Aktiv':item.type==='warn'?'Neste steg':'Planlagt';
  return `<section class="integration-card ${item.type}"><div><small>${esc(item.area)}</small><strong>${esc(item.name)}</strong></div><span>${esc(item.status||label)}</span><p>${esc(item.detail)}</p><button class="action" onclick="${item.action}">${esc(item.button||'Åpne')}</button></section>`;
}
function integrationRoadmap(){
  return `<ol class="integration-roadmap">${[
    ['Brønnøysund','Org.nr-oppslag i kunde, eiendom og leverandør.'],
    ['Microsoft 365 / Outlook','Møteinnkalling, kalender, e-post og styredokumenter.'],
    ['Signering','Kontrakter, styrevedtak og godkjenninger.'],
    ['Tripletex / PowerOffice / Fiken','Budsjett, faktura, prosjektkost og rapport.'],
    ['Bankimport','Saldo og transaksjoner direkte inn i økonomimodulen.']
  ].map((r,i)=>`<li><b>${i+1}</b><div><strong>${esc(r[0])}</strong><span>${esc(r[1])}</span></div></li>`).join('')}</ol>`;
}
async function testAiIntegration(){
  try{
    const res=await fetch('/.netlify/functions/ai-ping',{method:'GET'});
    const data=await readJsonResponse(res,'AI-testen svarte ikke riktig. Publiser siste pakke og sjekk miljøvariablene.');
    const ok=data?.has_openai_key&&data?.has_supabase_url&&data?.has_service_role;
    showDrawer('AI-integrasjon',`<div class="info-grid"><section><small>OpenAI</small><strong>${ok?'Klar':'Mangler oppsett'}</strong><span>${data?.has_openai_key?'API-nøkkel er lagt inn':'OPENAI_API_KEY mangler'}</span></section><section><small>Supabase</small><strong>${data?.has_supabase_url&&data?.has_service_role?'Klar':'Mangler oppsett'}</strong><span>${data?.has_supabase_url?'URL er lagt inn':'SUPABASE_URL mangler'} · ${data?.has_service_role?'Service key er lagt inn':'SUPABASE_SERVICE_ROLE_KEY mangler'}</span></section></div><div class="output">${esc(ok?'AI-funksjonen har riktig miljøoppsett. Hvis AI likevel feiler, skyldes det ofte kvote eller betalingsoppsett hos OpenAI.':'Legg inn manglende miljøvariabler i Netlify og publiser på nytt.')}</div>`);
  }catch(e){showDrawer('AI-integrasjon',`<div class="output error">${esc(customerError(e,'AI-testen kunne ikke kjøres akkurat nå.'))}</div>`)}
}
function showIntegrationInfo(name){
  const text={
    'Microsoft 365 / Outlook':'Koble møteinnkallinger, styrekalender, e-posttråder og dokumentdeling. Dette gjør styremodulen mye mer nyttig for kunder.',
    'Signering':'Bruk digital signering for kontrakter, styrevedtak og godkjenninger. Dette gir bedre sporbarhet og gjør kontraktflyten mer profesjonell.',
    'Tripletex':'Passer godt for kunder som vil hente faktura, prosjektkostnader og rapporttall direkte inn i økonomimodulen.',
    'PowerOffice Go':'Aktuelt som regnskapsalternativ for forvaltere og kunder som allerede bruker PowerOffice.',
    'Fiken':'Godt alternativ for mindre kunder som trenger enkel regnskapskobling.',
    'Bank / kontoutskrift':'Bankimport bør brukes når økonomidelen skal vise faktiske transaksjoner, saldo og avvik uten manuell punching.'
  }[name]||'Denne integrasjonen bør beskrives med formål, dataflyt, tilgang og hva kunden får ut av den.';
  showDrawer(name,`<div class="output">${esc(text)}</div><div class="integration-note"><strong>Anbefalt krav før bygging</strong><span>Avklar API-tilgang, kostnad, sikkerhet, kundesamtykke og hvilke felter som skal synkroniseres.</span></div>`);
}

async function connectMicrosoft365(){
  try{
    if(!DP.session?.access_token)throw new Error('Logg inn før du kobler Microsoft 365.');
    const p=currentProperty();
    const res=await fetch('/.netlify/functions/microsoft-auth-start',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${DP.session.access_token}`},body:JSON.stringify({property_id:p?.id||''})});
    const data=await readJsonResponse(res,'Microsoft-koblingen svarte ikke riktig. Publiser siste pakke og sjekk miljøvariablene.');
    if(!data.ok)throw new Error(data.message||'Kunne ikke starte Microsoft-kobling.');
    window.location.href=data.url;
  }catch(e){showDrawer('Microsoft 365',`<div class="output">${esc(customerError(e,'Microsoft 365 kunne ikke kobles akkurat nå.'))}</div><div class="integration-note"><strong>Mangler oppsett?</strong><span>Legg inn MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET og kjør supabase-microsoft-outlook-v1.sql.</span></div>`)}
}

function mailKindLabel(kind){
  return ({general:'Melding',all:'Alle kontakter',deviation:'Avvik',workorder:'Arbeidsordre',quote:'Tilbudsforespørsel',board:'Styresak',resident:'Beboere',manager:'Forvaltere',caretaker:'Vaktmestere',contract:'Kontrakt',purchase:'Bestilling',demo:'Demo'})[kind]||'Melding';
}
function collectMailRecipients(kind='general'){
  const contacts=DP.cache.contacts||[],suppliers=DP.suppliers||[],p=currentProperty();
  const rows=[];
  const add=(email,label,group)=>{email=String(email||'').trim();if(email.includes('@')&&!rows.some(r=>r.email.toLowerCase()===email.toLowerCase()))rows.push({email,label:label||email,group:group||'Kontakt'})};
  add(DP.user?.email,'Meg','Bruker');
  add(p?.customer_billing_email,'Kunde/faktura','Kunde');
  contacts.forEach(c=>{
    const role=String(c.role||c.contact_role||'Kontakt');
    if(kind==='all'){add(c.email,`${c.name||c.email} · ${role}`,'Eiendom');return}
    if(kind==='board'&&!/styre|leder|vara/i.test(role))return;
    if(kind==='resident'&&!/bebo|enhet|leilighet/i.test(role))return;
    if(kind==='manager'&&!/forvalt|manager/i.test(role))return;
    if(kind==='caretaker'&&!/vaktmester|drift|caretaker/i.test(role))return;
    add(c.email,`${c.name||c.email} · ${role}`,'Eiendom');
  });
  if(kind==='all'||kind==='quote'||kind==='workorder'||kind==='contract'||kind==='general')suppliers.forEach(s=>add(s.email,`${s.name||s.email} · ${s.trade||'Leverandør'}`,'Leverandør'));
  add('post@driftspartnernord.no','Driftspartner Nord','Admin');
  return rows;
}
function mailSubject(kind='general',caseId=''){
  const p=currentProperty(),name=p?.name||'valgt eiendom';
  if(kind==='all')return `Viktig melding - ${name}`;
  if(kind==='deviation')return `Avvik på ${name}`;
  if(kind==='workorder')return `Arbeidsordre på ${name}`;
  if(kind==='quote')return `Tilbudsforespørsel - ${name}`;
  if(kind==='board')return `Styresak - ${name}`;
  if(kind==='manager')return `Oppfølging for forvalter - ${name}`;
  if(kind==='caretaker')return `Driftsmelding til vaktmester - ${name}`;
  if(kind==='contract')return `Kontrakt - ${name}`;
  if(kind==='resident')return `Melding fra ${name}`;
  return `Oppdatering - ${name}`;
}
function mailBody(kind='general',caseId=''){
  const p=currentProperty(),name=p?.name||'valgt eiendom',address=p?.address||'';
  const hello='Hei,\n\n';
  const sign='\n\nVennlig hilsen\nDriftspartner Nord';
  if(kind==='all')return `${hello}Dette er en felles melding til kontakter knyttet til ${name}${address?', '+address:''}.\n\nSkriv inn informasjonen som skal sendes her.${sign}`;
  if(kind==='deviation')return `${hello}Det er registrert et avvik på ${name}${address?', '+address:''}.\n\nSak: ${caseId||'-'}\n\nVennligst se på saken og gi tilbakemelding.`;
  if(kind==='workorder')return `${hello}Det er opprettet en arbeidsordre på ${name}${address?', '+address:''}.\n\nSak: ${caseId||'-'}\n\nOppgaven bes fulgt opp innen avtalt frist.${sign}`;
  if(kind==='quote')return `${hello}Vi ønsker tilbud på arbeid knyttet til ${name}${address?', '+address:''}.\n\nSak: ${caseId||'-'}\n\nSend pris, forbehold, leveringstid og relevant dokumentasjon.${sign}`;
  if(kind==='board')return `${hello}Dette gjelder styresak for ${name}.\n\nSak: ${caseId||'-'}\n\nSe saksgrunnlag og gi tilbakemelding/godkjenning.${sign}`;
  if(kind==='resident')return `${hello}Dette er en melding til beboere i ${name}.\n\nSkriv inn informasjonen som skal sendes til beboerne her.${sign}`;
  if(kind==='manager')return `${hello}Dette er en melding til forvalter for ${name}.\n\nSkriv inn hva som skal følges opp.${sign}`;
  if(kind==='caretaker')return `${hello}Dette er en driftsmelding til vaktmester for ${name}.\n\nSkriv inn oppgaven eller informasjonen som skal følges opp.${sign}`;
  if(kind==='contract')return `${hello}Vedlagt/lenket følger kontrakt eller avtalegrunnlag for ${name}.\n\nSak: ${caseId||'-'}\n\nVennligst gjennomgå og bekreft videre prosess.${sign}`;
  return `${hello}Dette gjelder ${name}${address?', '+address:''}.\n\nSak: ${caseId||'-'}${sign}`;
}
function showEmailFlow(kind='general',caseId=''){
  const recipients=collectMailRecipients(kind);
  const checks=recipients.map((r,i)=>`<label class="check-row recipient-email"><input class="mailRecipient" type="checkbox" value="${esc(r.email)}" ${i===0?'checked':''}> <span>${esc(r.label)}</span><small>${esc(r.email)}</small></label>`).join('');
  const p=currentProperty();
  const board=(DP.cache.contacts||[]).find(c=>/styreleder|leder|styre/i.test(String(c.role||c.contact_role||''))&&String(c.email||'').includes('@'));
  const reply=board?.email||p?.customer_billing_email||DP.user?.email||'';
  const fromName=kind==='resident'||kind==='all'?`Styret i ${p?.name||'borettslaget'}`:`${p?.name||'Kunde'} via Driftspartner OS`;
  showDrawer('Send e-post',`<div class="mail-compose"><div class="mail-template-head"><div><small>${esc(mailKindLabel(kind))}</small><h3>Send direkte fra Driftspartner OS</h3><p>E-posten sendes trygt via Driftspartner, men vises med kundens/styrets navn. Svar går til adressen du velger under.</p></div><span>${esc(currentProperty()?.name||'Eiendom')}</span></div><div class="mail-audience-grid"><button class="${kind==='all'?'active':''}" onclick="showEmailFlow('all','${esc(caseId)}')">Alle</button><button class="${kind==='resident'?'active':''}" onclick="showEmailFlow('resident','${esc(caseId)}')">Beboere</button><button class="${kind==='board'?'active':''}" onclick="showEmailFlow('board','${esc(caseId)}')">Styre</button><button class="${kind==='manager'?'active':''}" onclick="showEmailFlow('manager','${esc(caseId)}')">Forvalter</button><button class="${kind==='caretaker'?'active':''}" onclick="showEmailFlow('caretaker','${esc(caseId)}')">Vaktmester</button></div><div class="form-grid two"><label>Vis som avsender<input id="emailFromName" value="${esc(fromName)}"></label><label>Svar går til<input id="emailReplyTo" value="${esc(reply)}" placeholder="styreleder@kunde.no"></label></div><p class="mail-field-note">Mottaker ser navnet over som avsender. Teknisk sendes e-posten fra godkjent Driftspartner-domene for best leveringssikkerhet.</p><label>Mottakere</label><div class="choice-list">${checks||'<div class="empty-state"><strong>Ingen mottakere funnet.</strong><span>Legg inn styre, beboere, forvalter eller vaktmester med e-post først.</span></div>'}</div><label>Ekstra e-postadresser</label><input id="emailExtra" placeholder="post@kunde.no, styret@kunde.no"><p class="mail-field-note">Du kan sende til flere ved å skille e-postadresser med komma eller linjeskift.</p><label>Emne</label><input id="emailSubject" value="${esc(mailSubject(kind,caseId))}"><label>Melding</label><textarea id="emailBody">${esc(mailBody(kind,caseId))}</textarea><div class="module-actions"><button class="action primary" onclick="sendEmailLog('${esc(kind)}','${esc(caseId)}')">Send som kunde/styre</button><button class="action" onclick="location.href='mail-test.html'">Åpne e-posttest</button></div><div id="emailOut" class="output">Klar til sending.</div></div>`);
}
function parseMailAddresses(value){return String(value||'').split(/[,\n;\s]+/).map(x=>x.trim()).filter(x=>x.includes('@'))}
function emailPayloadFromForm(kind='general',caseId=''){
  const checked=[...document.querySelectorAll('.mailRecipient:checked')].map(x=>x.value);
  const extra=parseMailAddresses(document.getElementById('emailExtra')?.value);
  const to=[...new Set([...checked,...extra].map(x=>String(x).trim()).filter(x=>x.includes('@')))];
  const subject=document.getElementById('emailSubject')?.value.trim()||'Melding fra Driftspartner OS';
  const message=document.getElementById('emailBody')?.value.trim()||'';
  if(!to.length)throw new Error('Velg minst én mottaker eller skriv inn en e-postadresse.');
  if(!message)throw new Error('Skriv en melding før du sender.');
  const fromName=document.getElementById('emailFromName')?.value.trim()||`Styret i ${currentProperty()?.name||'eiendommen'}`;
  const replyTo=document.getElementById('emailReplyTo')?.value.trim()||DP.user?.email||'';
  return {to,subject,message,kind,caseId,property:currentProperty()?.name||'',property_id:currentProperty()?.id||'',reply_to:replyTo,from_name:fromName};
}
async function sendEmailLog(kind='general',caseId=''){
  const out=document.getElementById('emailOut');
  try{
    const payload=emailPayloadFromForm(kind,caseId);
    if(out)out.textContent='Sender e-post...';
    if(location.protocol==='file:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')throw new Error('Direkte e-post må testes fra publisert Netlify-side.');
    const res=await fetch('/.netlify/functions/send-email',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const data=await readJsonResponse(res,'E-postfunksjonen svarte ikke riktig. Publiser siste pakke og prøv igjen.');
    if(!res.ok||!data.ok)throw new Error(data.message||'E-post ble ikke sendt.');
    await insertActivity(`E-post sendt: ${mailKindLabel(kind)}`,'email',caseId||currentProperty()?.id||'-');
    await finishAction(`E-post sendt til ${payload.to.length} mottaker${payload.to.length===1?'':'e'}.`,DP.module||'dashboard');
  }catch(e){setOutputError(out,e,'E-post kunne ikke sendes akkurat nå. Sjekk mottaker og prøv igjen fra live-siden.')}
}
async function sendEmailMicrosoft(kind='general',caseId=''){
  const out=document.getElementById('emailOut');
  try{
    const payload=emailPayloadFromForm(kind,caseId);
    if(!DP.session?.access_token)throw new Error('Logg inn før du sender fra Outlook.');
    if(out)out.textContent='Sender via tilkoblet Outlook-konto...';
    if(location.protocol==='file:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')throw new Error('Outlook-sending må testes fra publisert Netlify-side.');
    const res=await fetch('/.netlify/functions/microsoft-send-mail',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${DP.session.access_token}`},body:JSON.stringify(payload)});
    const data=await readJsonResponse(res,'Outlook-funksjonen svarte ikke riktig. Publiser siste pakke og sjekk Microsoft-oppsettet.');
    if(!res.ok||!data.ok)throw new Error(data.message||'E-post ble ikke sendt via Outlook.');
    await insertActivity(`E-post sendt fra Outlook: ${mailKindLabel(kind)}`,'email',caseId||currentProperty()?.id||'-');
    await finishAction(`E-post sendt fra ${data.from||'tilkoblet Outlook-konto'} til ${payload.to.length} mottaker${payload.to.length===1?'':'e'}.`,DP.module||'dashboard');
  }catch(e){setOutputError(out,e,'Outlook-sending kunne ikke fullføres. Koble Microsoft 365 og prøv igjen.')}
}
window.showEmailFlow=showEmailFlow;
window.sendEmailLog=sendEmailLog;
window.connectMicrosoft365=connectMicrosoft365;
window.sendEmailMicrosoft=sendEmailMicrosoft;

function subscriptionPlans(){
  return [
    {id:'start',name:'Start',firstYear:9990,yearTwo:11880,unit:'For mindre sameier og borettslag',fit:'Opptil 20 enheter',items:['FDV-arkiv','Dokumenthåndtering','Avvikshåndtering','Basisanbefalinger','Styreportal','Mobiltilgang']},
    {id:'pro',name:'Pro',firstYear:19990,yearTwo:23880,unit:'For de fleste sameier og borettslag',fit:'20-100 enheter',items:['Alt i Start','AI Director','Vedlikeholdsplan','Arbeidsordre','Leverandørregister','Budsjettoversikt','Avansert rapportering','Ubegrenset antall styremedlemmer']},
    {id:'premium',name:'Premium',firstYear:39990,yearTwo:47880,unit:'For større borettslag og eiendomsaktører',fit:'100+ enheter',items:['Alt i Pro','Property Brain AI','Risikoanalyse','Tilbudsinnhenting (RFQ)','Flere eiendommer','Prioritert support','Avanserte analyser']}
  ];
}
function selectedSubscriptionPlan(){return subscriptionPlans().find(p=>p.id===(DP.onboardingSubscription||'pro'))||subscriptionPlans()[1]}
function renderSubscriptionCards(){
  const selected=selectedSubscriptionPlan().id;
  return `<div class="subscription-grid">${subscriptionPlans().map(p=>`<button type="button" class="subscription-card ${p.id===selected?'selected':''}" onclick="selectOnboardingSubscription('${p.id}')"><span>${esc(p.name)}</span><strong>${money(p.firstYear)}</strong><small>Første år · faktureres årlig</small><em>År 2: ${money(p.yearTwo)} for 12 mnd</em><p>${esc(p.unit)}</p><p class="fit">Passer for ${esc(p.fit)}</p><ul>${p.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></button>`).join('')}</div><input id="obSubscriptionPlan" type="hidden" value="${esc(selected)}"><div id="obSubscriptionSummary" class="output">${subscriptionSummaryText()}</div>`;
}
function subscriptionSummaryText(){const p=selectedSubscriptionPlan();return `${p.name} valgt. Første år: ${money(p.firstYear)}. År 2 faktureres for 12 måneder: ${money(p.yearTwo)}. Endelig avtale bekreftes skriftlig før oppstart.`}
function selectOnboardingSubscription(id){DP.onboardingSubscription=id;const wrap=document.getElementById('obSubscriptionWrap');if(wrap)wrap.innerHTML=renderSubscriptionCards()}

function showNewCustomerWizard(){
  if(typeof canManageCustomers==='function'&&!canManageCustomers()){showDrawer('Ingen tilgang','<div class="empty-state"><strong>Ny kunde kan bare opprettes av superadmin.</strong><span>Kontakt Driftspartner Nord hvis kunden trenger ny eiendom eller ny konto.</span></div>');return}
  ensureOnboardingDraft();
  showDrawer('Ny kunde - onboarding',`<div class="onboarding-flow premium-onboarding"><div class="ops-budget-summary"><div><small>1</small><b>Kunde</b></div><div><small>2</small><b>Eiendom</b></div><div><small>3</small><b>Styre/beboere</b></div><div><small>4</small><b>Leverandører</b></div><div><small>5</small><b>FDV/økonomi</b></div><div><small>6</small><b>Abonnement</b></div><div><small>7</small><b>Brukere</b></div></div><section class="onboarding-required-box"><div><strong>Minimum for å opprette kunde</strong><span>Disse feltene må være fylt ut før systemet lagrer kunden.</span></div><ul><li>Kundenavn</li><li>Eiendomsnavn</li><li>Adresse</li><li>Type eiendom</li><li>Antall enheter</li><li>Minst én styreleder med e-post</li><li>Abonnement</li></ul></section><h3>Kunde</h3><div class="onboarding-entry-grid two"><label>Kundenavn <span class="required-pill">Må fylles ut</span><input id="obCustomerName" data-required="Kundenavn" placeholder="Nytt Borettslag"></label><label>Org.nr <span class="optional-pill">Kan vente</span><div class="lookup-row"><input id="obOrgNo" placeholder="9 siffer"><button class="action" onclick="lookupBrregCustomer()">Hent</button></div></label></div><div id="obBrregOut" class="output">Bruk org.nr-oppslag for å fylle kunde og adresse fra Brønnøysund.</div><h3>Eiendom</h3><label>Eiendomsnavn <span class="required-pill">Må fylles ut</span></label><input id="obPropertyName" data-required="Eiendomsnavn"><label>Adresse <span class="required-pill">Må fylles ut</span></label><input id="obAddress" data-required="Adresse"><div class="split"><div><label>Type <span class="required-pill">Må fylles ut</span></label><input id="obType" data-required="Type eiendom" placeholder="Borettslag / sameie"></div><div><label>Antall enheter <span class="required-pill">Må fylles ut</span></label><input id="obUnits" data-required="Antall enheter" type="number" min="1"></div></div><div class="split"><div><label>Gnr <span class="optional-pill">Kan vente</span></label><input id="obGnr"></div><div><label>Bnr <span class="optional-pill">Kan vente</span></label><input id="obBnr"></div></div><label>Teknisk sammendrag <span class="optional-pill">Kan vente</span></label><textarea id="obTech"></textarea><section class="onboarding-section"><div><h3>Styre <span class="required-pill">Minst én styreleder</span></h3><p class="muted">Legg inn ett styremedlem om gangen. For oppstart må minst én styreleder ha e-post.</p></div><div class="onboarding-entry-grid"><label>Navn<input id="obBoardName" placeholder="Kari Nordmann"></label><label>Rolle<select id="obBoardRole"><option>Styreleder</option><option>Nestleder</option><option>Styremedlem</option><option>Vara</option></select></label><label>E-post<input id="obBoardEmail" type="email" placeholder="kari@kunde.no"></label><label>Telefon<input id="obBoardPhone" placeholder="90000000"></label></div><section class="inline-option"><label><input id="obBoardCreateLogin" type="checkbox" checked> Opprett innlogging og send e-post</label><small>Styreleder får styreledertilgang. Styremedlem, nestleder og vara får styremedlemtilgang.</small><label>Midlertidig passord</label><input id="obBoardPassword" placeholder="La stå tomt for automatisk passord"></section><button class="action" onclick="addOnboardingBoard()">Legg til styremedlem</button><div id="obBoardList" class="stack-list"></div></section><section class="onboarding-section"><div><h3>Beboere <span class="optional-pill">Kan fylles senere</span></h3><p class="muted">Legg inn én beboer eller enhet om gangen.</p></div><div class="onboarding-entry-grid"><label>Navn<input id="obResidentName" placeholder="Ola Nordmann"></label><label>Enhet/rolle<input id="obResidentUnit" placeholder="A-101 / Beboer"></label><label>E-post<input id="obResidentEmail" type="email"></label><label>Telefon<input id="obResidentPhone"></label></div><section class="inline-option"><label><input id="obResidentCreateLogin" type="checkbox" checked> Opprett innlogging og send e-post</label><small>Beboeren får bare beboertilgang til valgt eiendom.</small><label>Midlertidig passord</label><input id="obResidentPassword" placeholder="La stå tomt for automatisk passord"></section><button class="action" onclick="addOnboardingResident()">Legg til beboer</button><div id="obResidentList" class="stack-list"></div></section><section class="onboarding-section"><div><h3>Leverandører <span class="optional-pill">Kan fylles senere</span></h3><p class="muted">Legg inn én leverandør om gangen.</p></div><div class="onboarding-entry-grid"><label>Org.nr<input id="obSupplierOrgNo" placeholder="9 siffer"></label><label>Firma<input id="obSupplierName" placeholder="Nord Tak AS"></label><label>E-post<input id="obSupplierEmail" type="email" placeholder="post@nordtak.no"></label><label>Fagområde<input id="obSupplierTrade" placeholder="Tak"></label></div><button class="action" onclick="lookupBrregOnboardingSupplier()">Hent leverandør</button><button class="action" onclick="addOnboardingSupplier()">Legg til leverandør</button><div id="obSupplierLookupOut" class="output">Org.nr-oppslag kan fylle firmanavn automatisk.</div><div id="obSupplierList" class="stack-list"></div></section><h3>FDV-mapper <span class="recommended-pill">Anbefalt</span></h3><textarea id="obFolders" rows="3">Bygg\nVVS\nElektro\nBrann\nVentilasjon\nTak\nFasade\nHeis\nHMS\nForsikring\nGarantier\nTegninger\nKontrakter\nServiceavtaler</textarea><h3>Økonomi <span class="recommended-pill">Anbefalt</span></h3><div class="split"><div><label>Bank/konto</label><input id="obBank" type="number" value="0"></div><div><label>Reservefond</label><input id="obReserve" type="number" value="0"></div></div><label>Prosjektmidler</label><input id="obProjectFunds" type="number" value="0"><section class="onboarding-section subscription-section"><div><h3>Abonnement <span class="required-pill">Må velges</span></h3><p class="muted">Velg pakken kunden skal starte på. Første år har introduksjonspris, år 2 faktureres for 12 måneder.</p></div><div id="obSubscriptionWrap">${renderSubscriptionCards()}</div></section><section class="onboarding-section"><div><h3>Inviter brukere <span class="recommended-pill">Anbefalt</span></h3><p class="muted">Brukeren får e-post med innlogging og midlertidig passord når kunden opprettes.</p></div><div class="onboarding-entry-grid"><label>Navn<input id="obUserName"></label><label>E-post<input id="obUserEmail" type="email"></label><label>Rolle<select id="obUserRole"><option value="styreleder">Styreleder</option><option value="styremedlem">Styremedlem</option><option value="beboer">Beboer</option><option value="vaktmester">Vaktmester</option><option value="leverandor">Leverandør</option></select></label><label>Telefon<input id="obUserPhone"></label></div><label>Midlertidig passord</label><input id="obUserPassword" placeholder="Start1234!"><button class="action" onclick="addOnboardingUser()">Legg til bruker</button><div id="obUserList" class="stack-list"></div></section><button class="action primary" onclick="runNewCustomerOnboarding()">Opprett kunde</button><div id="obOut" class="output">Klar. Fyll ut feltene merket “Må fylles ut”, legg til styreleder og trykk Opprett kunde.</div></div>`);
  setTimeout(renderOnboardingDraftLists,0);
}
function ensureOnboardingDraft(){DP.onboardingDraft=DP.onboardingDraft||{board:[],residents:[],suppliers:[],users:[]};return DP.onboardingDraft}
function obVal(id){return String(document.getElementById(id)?.value||'').trim()}
function clearOb(ids){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value=''})}
function onboardingNotice(message){const out=document.getElementById('obOut');if(out)out.textContent=message;else alert(message)}
async function lookupBrregCustomer(){
  try{
    setFieldText('obBrregOut','Henter kundeinformasjon fra Brønnøysund...');
    const entity=await lookupBrregOrg(obVal('obOrgNo'));
    const address=brregAddress(entity),form=brregForm(entity);
    setFieldValue('obOrgNo',entity.organisasjonsnummer||orgDigits(obVal('obOrgNo')));
    setFieldValue('obCustomerName',entity.navn||'');
    if(!obVal('obPropertyName'))setFieldValue('obPropertyName',entity.navn||'');
    if(address&&!obVal('obAddress'))setFieldValue('obAddress',address);
    if(form&&!obVal('obType'))setFieldValue('obType',form);
    setFieldText('obBrregOut',`Fant ${entity.navn||'kunde'} · ${entity.organisasjonsnummer||''}${form?' · '+form:''}${address?' · '+address:''}`);
  }catch(e){setFieldText('obBrregOut',customerError(e,'Kunne ikke hente kundeinformasjon. Sjekk org.nr og prøv igjen.'))}
}
async function lookupBrregOnboardingSupplier(){
  try{
    setFieldText('obSupplierLookupOut','Henter leverandør fra Brønnøysund...');
    const entity=await lookupBrregOrg(obVal('obSupplierOrgNo'));
    const address=brregAddress(entity);
    setFieldValue('obSupplierOrgNo',entity.organisasjonsnummer||orgDigits(obVal('obSupplierOrgNo')));
    setFieldValue('obSupplierName',entity.navn||'');
    if(!obVal('obSupplierTrade')&&entity.naeringskode1?.beskrivelse)setFieldValue('obSupplierTrade',entity.naeringskode1.beskrivelse);
    setFieldText('obSupplierLookupOut',`Fant ${entity.navn||'leverandør'} · ${entity.organisasjonsnummer||''}${address?' · '+address:''}`);
  }catch(e){setFieldText('obSupplierLookupOut',customerError(e,'Kunne ikke hente leverandør. Sjekk org.nr og prøv igjen.'))}
}
function onboardingList(items,type,empty){
  if(!items.length)return `<div class="empty-state"><strong>${esc(empty)}</strong></div>`;
  return items.map((item,i)=>`<section class="mini-record onboarding-item"><div><strong>${esc(item.name)}</strong><small>${esc([item.org_no,item.role||item.unit||item.trade,item.email,item.phone,item.create_login?'innlogging sendes':''].filter(Boolean).join(' · '))}</small></div><button class="action red" onclick="removeOnboardingItem('${type}',${i})">Fjern</button></section>`).join('');
}
function renderOnboardingDraftLists(){
  const draft=ensureOnboardingDraft();
  const board=document.getElementById('obBoardList'),residents=document.getElementById('obResidentList'),suppliers=document.getElementById('obSupplierList'),users=document.getElementById('obUserList');
  if(board)board.innerHTML=onboardingList(draft.board,'board','Ingen styremedlemmer lagt inn ennå.');
  if(residents)residents.innerHTML=onboardingList(draft.residents,'residents','Ingen beboere lagt inn ennå.');
  if(suppliers)suppliers.innerHTML=onboardingList(draft.suppliers,'suppliers','Ingen leverandører lagt inn ennå.');
  if(users)users.innerHTML=onboardingList(draft.users,'users','Ingen brukere lagt inn ennå.');
}
function removeOnboardingItem(type,index){const draft=ensureOnboardingDraft();if(draft[type])draft[type].splice(index,1);renderOnboardingDraftLists()}
function addOnboardingBoard(){
  const name=obVal('obBoardName');if(!name)return onboardingNotice('Fyll inn navn på styremedlem.');
  const createLogin=Boolean(document.getElementById('obBoardCreateLogin')?.checked),email=obVal('obBoardEmail'),role=obVal('obBoardRole')||'Styremedlem';
  if(createLogin&&!email.includes('@'))return onboardingNotice('Fyll inn e-post når styret skal få innlogging.');
  ensureOnboardingDraft().board.push({name,role,email,phone:obVal('obBoardPhone'),create_login:createLogin,password:obVal('obBoardPassword')});
  clearOb(['obBoardName','obBoardEmail','obBoardPhone','obBoardPassword']);const cb=document.getElementById('obBoardCreateLogin');if(cb)cb.checked=true;renderOnboardingDraftLists();
}
function addOnboardingResident(){
  const name=obVal('obResidentName');if(!name)return onboardingNotice('Fyll inn navn på beboer.');
  const createLogin=Boolean(document.getElementById('obResidentCreateLogin')?.checked),email=obVal('obResidentEmail');
  if(createLogin&&!email.includes('@'))return onboardingNotice('Fyll inn e-post når beboer skal få innlogging.');
  ensureOnboardingDraft().residents.push({name,role:'Beboer',unit:obVal('obResidentUnit')||'Beboer',email,phone:obVal('obResidentPhone'),create_login:createLogin,password:obVal('obResidentPassword')});
  clearOb(['obResidentName','obResidentUnit','obResidentEmail','obResidentPhone','obResidentPassword']);const cb=document.getElementById('obResidentCreateLogin');if(cb)cb.checked=true;renderOnboardingDraftLists();
}
function addOnboardingSupplier(){
  const name=obVal('obSupplierName'),email=obVal('obSupplierEmail');if(!name||!email)return onboardingNotice('Fyll inn firma og e-post.');
  ensureOnboardingDraft().suppliers.push({name,email,trade:obVal('obSupplierTrade'),org_no:obVal('obSupplierOrgNo')});
  clearOb(['obSupplierOrgNo','obSupplierName','obSupplierEmail','obSupplierTrade']);setFieldText('obSupplierLookupOut','Org.nr-oppslag kan fylle firmanavn automatisk.');renderOnboardingDraftLists();
}
function addOnboardingUser(){
  const name=obVal('obUserName'),email=obVal('obUserEmail'),role=obVal('obUserRole');if(!name||!email||!role)return onboardingNotice('Fyll inn navn, e-post og rolle.');
  ensureOnboardingDraft().users.push({name,email,role,phone:obVal('obUserPhone'),password:obVal('obUserPassword')});
  clearOb(['obUserName','obUserEmail','obUserPhone','obUserPassword']);renderOnboardingDraftLists();
}
function setOnboardingMissingState(ids){
  document.querySelectorAll('.onboarding-flow .field-missing').forEach(el=>el.classList.remove('field-missing'));
  (ids||[]).forEach(id=>{const el=document.getElementById(id);if(el)el.classList.add('field-missing')});
}
function validateNewCustomerOnboarding(){
  const draft=ensureOnboardingDraft(),missing=[],ids=[];
  const required=[
    ['obCustomerName','Kundenavn'],
    ['obPropertyName','Eiendomsnavn'],
    ['obAddress','Adresse'],
    ['obType','Type eiendom'],
    ['obUnits','Antall enheter']
  ];
  required.forEach(([id,label])=>{if(!obVal(id)){missing.push(label);ids.push(id)}});
  const units=Number(obVal('obUnits')||0);
  if(obVal('obUnits')&&(!Number.isFinite(units)||units<1)){missing.push('Antall enheter må være minst 1');ids.push('obUnits')}
  const hasBoardLead=draft.board.some(x=>/styreleder|leder/i.test(String(x.role||''))&&String(x.email||'').includes('@'));
  const inlineBoardLead=/styreleder|leder/i.test(obVal('obBoardRole'))&&obVal('obBoardName')&&obVal('obBoardEmail').includes('@');
  if(!hasBoardLead&&!inlineBoardLead)missing.push('Legg til minst én styreleder med e-post');
  if(!selectedSubscriptionPlan()?.id)missing.push('Velg abonnement');
  return {ok:!missing.length,missing,ids};
}
function capturePendingOnboardingRows(){
  const draft=ensureOnboardingDraft();
  const boardName=obVal('obBoardName'),boardEmail=obVal('obBoardEmail');
  if(boardName&&boardEmail&&!draft.board.some(x=>x.name===boardName&&x.email===boardEmail)){
    draft.board.push({name:boardName,role:obVal('obBoardRole')||'Styremedlem',email:boardEmail,phone:obVal('obBoardPhone'),create_login:Boolean(document.getElementById('obBoardCreateLogin')?.checked),password:obVal('obBoardPassword')});
  }
  const residentName=obVal('obResidentName'),residentEmail=obVal('obResidentEmail');
  if(residentName&&!draft.residents.some(x=>x.name===residentName&&x.email===residentEmail)){
    draft.residents.push({name:residentName,role:'Beboer',unit:obVal('obResidentUnit')||'Beboer',email:residentEmail,phone:obVal('obResidentPhone'),create_login:Boolean(document.getElementById('obResidentCreateLogin')?.checked),password:obVal('obResidentPassword')});
  }
  const supplierName=obVal('obSupplierName'),supplierEmail=obVal('obSupplierEmail');
  if(supplierName&&supplierEmail&&!draft.suppliers.some(x=>x.name===supplierName&&x.email===supplierEmail)){
    draft.suppliers.push({name:supplierName,email:supplierEmail,trade:obVal('obSupplierTrade'),org_no:obVal('obSupplierOrgNo')});
  }
  const userName=obVal('obUserName'),userEmail=obVal('obUserEmail');
  if(userName&&userEmail&&!draft.users.some(x=>x.name===userName&&x.email===userEmail)){
    draft.users.push({name:userName,email:userEmail,role:obVal('obUserRole'),phone:obVal('obUserPhone'),password:obVal('obUserPassword')});
  }
}
function renderOnboardingValidationError(result){
  const out=document.getElementById('obOut');
  setOnboardingMissingState(result.ids);
  const html=`<div class="validation-box"><strong>Før kunden kan opprettes må dette fylles ut:</strong><ul>${result.missing.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><span>Fyll inn punktene over og trykk “Opprett kunde” på nytt.</span></div>`;
  if(out)out.innerHTML=html;
  out?.scrollIntoView({behavior:'smooth',block:'center'});
}
function parseLines(value){return String(value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).map(line=>line.split(',').map(p=>p.trim()))}
async function insertWithFallback(tableName,row,minimalKeys){
  let r=await db().from(tableName).insert(row).select().single();
  if(!r.error)return r;
  if(!/column|schema|cache|relationship/i.test(String(r.error.message||'')))return r;
  const minimal={};minimalKeys.forEach(k=>minimal[k]=row[k]);
  return await db().from(tableName).insert(minimal).select().single();
}
async function safeInsertMany(tableName,rows){
  if(!rows.length)return {ok:true,count:0};
  const r=await db().from(tableName).insert(rows);
  if(r.error&&/relation|schema|cache|does not exist|column/i.test(String(r.error.message||'')))return {ok:false,count:0,skipped:true,error:r.error};
  if(r.error)throw r.error;
  return {ok:true,count:rows.length};
}
async function safeInsertContacts(rows){
  if(!rows.length)return {ok:true,count:0};
  const variants=[
    rows,
    rows.map(r=>({property_id:r.property_id,name:r.name,role:r.role,email:r.email,phone:r.phone})),
    rows.map(r=>({property_id:r.property_id,name:r.name,contact_role:r.role,contact_type:r.role,email:r.email,phone:r.phone})),
    rows.map(r=>({property_id:r.property_id,name:r.name,email:r.email,phone:r.phone})),
    rows.map(r=>({property_id:r.property_id,name:r.name}))
  ];
  let lastError=null;
  for(const variant of variants){
    const r=await db().from('property_contacts').insert(variant);
    if(!r.error)return {ok:true,count:rows.length};
    lastError=r.error;
    if(!/column|schema|cache|contact_role|contact_type|role|email|phone|notes/i.test(String(r.error.message||'')))break;
  }
  if(lastError&&/relation|does not exist/i.test(String(lastError.message||'')))return {ok:false,count:0,skipped:true,error:lastError};
  throw lastError||new Error('Kontakter kunne ikke lagres.');
}
async function safeUpsertFinance(row){
  const variants=[
    row,
    {property_id:row.property_id,bank_balance:row.bank_balance,reserved_funds:row.reserved_funds,project_funds:row.project_funds,updated_at:row.updated_at},
    {property_id:row.property_id,bank_balance:row.bank_balance,reserved_funds:row.reserved_funds,project_funds:row.project_funds},
    {property_id:row.property_id,bank_balance:row.bank_balance,reserve_fund:row.reserved_funds,project_funds:row.project_funds},
    {property_id:row.property_id,bank_balance:row.bank_balance}
  ];
  let lastError=null;
  for(const variant of variants){
    const r=await db().from('property_finance').upsert(variant,{onConflict:'property_id'});
    if(!r.error)return {ok:true};
    lastError=r.error;
    if(!/column|schema|cache|reserve|reserved|project|updated_at/i.test(String(r.error.message||'')))break;
  }
  if(lastError&&/relation|does not exist/i.test(String(lastError.message||'')))return {ok:false,skipped:true,error:lastError};
  throw lastError||new Error('Økonomi kunne ikke lagres.');
}
function onboardingAdminError(error,step='Onboarding'){
  const msg=String(error?.message||error||'').trim();
  if(!msg)return `${step} kunne ikke fullføres.`;
  if(/row level|rls|policy|permission|not authorized|violates row-level/i.test(msg))return `${step}: brukeren mangler tilgang til å lagre dette. Sjekk property_access/RLS for innlogget bruker.`;
  if(/relation .* does not exist|does not exist/i.test(msg))return `${step}: en nødvendig tabell mangler i Supabase. Kjør nyeste SQL-oppsett for modulen.`;
  if(/column .* does not exist|Could not find .* column|schema cache|column/i.test(msg))return `${step}: Supabase-tabellen mangler et felt appen prøver å lagre. Kjør nyeste SQL-oppsett for onboarding/økonomi/personer.`;
  if(/duplicate|already registered|already exists|User already/i.test(msg))return `${step}: brukeren eller raden finnes allerede. Sjekk e-post/eksisterende bruker.`;
  if(/foreign key|violates foreign/i.test(msg))return `${step}: koblingen til kunde/eiendom mangler. Prøv igjen etter at kunde og eiendom er opprettet.`;
  if(/invalid input value|check constraint|violates check/i.test(msg))return `${step}: en verdi passer ikke med databaseoppsettet. Sjekk type, rolle eller status.`;
  return `${step}: ${msg}`;
}
async function createOnboardingUser(row,propertyId){
  const token=DP.session?.access_token;if(!token)throw new Error('Mangler innlogging.');
  const [name,email,roleRaw,phone,password]=row;
  if(!name||!email||!roleRaw)return null;
  const role=normalizeRole(roleRaw),access={beboer:'resident',styreleder:'owner',styremedlem:'member',vaktmester:'caretaker',leverandor:'vendor'}[role]||'member';
  const res=await fetch('/.netlify/functions/create-user',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({name,email,phone,role,property_id:propertyId,access_role:access,password})});
  const data=await readJsonResponse(res,'Bruker-tjenesten svarte ikke riktig. Publiser siste pakke og prøv igjen.');
  if(!data.ok)throw new Error(data.message||'Bruker kunne ikke opprettes.');
  return data.user;
}
async function runNewCustomerOnboarding(){
  const out=document.getElementById('obOut');
  let step='Starter onboarding';
  try{
    if(typeof canManageCustomers==='function'&&!canManageCustomers())throw new Error('Ny kunde kan bare opprettes av superadmin.');
    requireLive('opprette kunde');
    const client=db(),log=[];
    const customerName=obCustomerName.value.trim(),propertyName=obPropertyName.value.trim()||customerName;
    const validation=validateNewCustomerOnboarding();
    if(!validation.ok){renderOnboardingValidationError(validation);return}
    capturePendingOnboardingRows();
    renderOnboardingDraftLists();
    setOnboardingMissingState([]);
    const plan=selectedSubscriptionPlan();
    step='Oppretter kunde';
    out.textContent='Oppretter kunde...';
    let customer=await insertWithFallback('customers',{name:customerName,org_no:obOrgNo.value.trim()||null,subscription_plan:plan.id,subscription_first_year_amount:plan.firstYear,subscription_year_two_amount:plan.yearTwo,subscription_billing_period:'yearly',subscription_status:'pending',subscription_started_at:new Date().toISOString().slice(0,10)},['name']);
    if(customer.error)throw customer.error;
    log.push(`Kunde opprettet med ${plan.name}`);
    step='Oppretter eiendom';
    out.textContent='Oppretter eiendom...';
    const propertyRow={customer_id:customer.data.id,name:propertyName,address:obAddress.value.trim(),property_type:obType.value.trim(),gnr:obGnr.value.trim(),bnr:obBnr.value.trim(),units_count:+obUnits.value||0,technical_summary:obTech.value.trim()};
    let property=await insertWithFallback('properties',propertyRow,['customer_id','name','address']);
    if(property.error)throw property.error;
    const propertyId=property.data.id;
    DP.propertyId=propertyId;
    log.push('Eiendom opprettet');
    step='Gir deg tilgang til eiendommen';
    if(DP.user?.id){
      const access=await client.from('property_access').upsert({property_id:propertyId,user_id:DP.user.id,access_role:'owner'},{onConflict:'property_id,user_id'});
      if(access.error)log.push('Tilgang ble ikke oppdatert automatisk');
    }
    const draft=ensureOnboardingDraft();
    step='Lagrer styre og beboere';
    const board=draft.board.map(r=>({property_id:propertyId,name:r.name||'',role:r.role||'Styremedlem',email:r.email||'',phone:r.phone||'',notes:'Onboarding'})).filter(r=>r.name);
    const residents=draft.residents.map(r=>({property_id:propertyId,name:r.name||'',role:r.unit||r.role||'Beboer',email:r.email||'',phone:r.phone||'',notes:'Onboarding'})).filter(r=>r.name);
    const contactResult=await safeInsertContacts([...board,...residents]);
    log.push(contactResult.skipped?'Styre/beboere ble hoppet over: kontakt-tabell mangler':`${board.length} styre / ${residents.length} beboere lagt inn`);
    step='Lagrer leverandører';
    const suppliers=draft.suppliers.map(r=>({name:r.name||'',email:r.email||'',trade:r.trade||'',status:'active'})).filter(r=>r.name&&r.email);
    await safeInsertMany('suppliers',suppliers);log.push(`${suppliers.length} leverandører lagt inn`);
    step='Oppretter FDV-mapper';
    const folders=String(obFolders.value||'').split(/\n+/).map(name=>name.trim()).filter(Boolean).map(name=>({property_id:propertyId,name,parent_id:null}));
    const folderResult=await safeInsertMany('document_folders',folders);log.push(folderResult.skipped?'FDV-mapper hoppet over: tabell mangler':`${folders.length} FDV-mapper opprettet`);
    step='Lagrer økonomi';
    const finance=await safeUpsertFinance({property_id:propertyId,bank_balance:+obBank.value||0,reserved_funds:+obReserve.value||0,project_funds:+obProjectFunds.value||0,updated_at:new Date().toISOString()});
    log.push(finance.skipped?'Økonomi hoppet over: økonomitabell mangler':'Økonomi grunnlag lagret');
    step='Oppretter brukere og sender e-post';
    const boardUsers=draft.board.filter(r=>r.create_login&&r.email).map(r=>[r.name,r.email,/styreleder|leder/i.test(String(r.role||''))?'styreleder':'styremedlem',r.phone,r.password]);
    const residentUsers=draft.residents.filter(r=>r.create_login&&r.email).map(r=>[r.name,r.email,'beboer',r.phone,r.password]);
    const users=[...boardUsers,...residentUsers,...draft.users.map(r=>[r.name,r.email,r.role,r.phone,r.password])];let userCount=0;
    for(const userRow of users){await createOnboardingUser(userRow,propertyId);userCount++}
    log.push(`${userCount} brukere opprettet/invitert`);
    await insertActivity('Ny kunde onboardet','onboarding',propertyId);
    await loadProperties();DP.propertyId=propertyId;
    DP.onboardingDraft={board:[],residents:[],suppliers:[],users:[]};
    await finishAction(`Kunden er opprettet. ${log.join(' · ')}`,'property');
  }catch(e){
    const message=onboardingAdminError(e,step);
    if(out)out.innerHTML=`<div class="validation-box"><strong>Onboarding stoppet</strong><p>${esc(message)}</p><span>Kunde eller eiendom kan allerede være delvis opprettet. Sjekk Eiendom-listen før du prøver på nytt.</span></div>`;
    console.error('Onboarding failed at',step,e);
  }
}





