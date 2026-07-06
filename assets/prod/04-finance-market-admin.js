function financeTotals(){
  const lines=DP.cache.budget_lines||[],projects=DP.cache.projects||[];
  const budget=lines.reduce((s,l)=>s+Number(l.budget_amount||l.budget||0),0);
  const actual=lines.reduce((s,l)=>s+Number(l.actual_amount||l.actual||0),0);
  const projectBudget=projects.reduce((s,p)=>s+Number(p.budget||p.budget_amount||0),0);
  const projectActual=projects.reduce((s,p)=>s+Number(p.actual_cost||p.actual_amount||0),0);
  return {budget,actual,variance:actual-budget,projectBudget,projectActual,projectVariance:projectActual-projectBudget};
}
function financeVarianceMoney(value){
  const n=Number(value)||0;
  if(!n)return money(0);
  return `${n>0?'-':'+'}${money(Math.abs(n))}`;
}
function FinancePage(){
  const f=(DP.cache.finance||[])[0]||{},lines=DP.cache.budget_lines||[],projects=DP.cache.projects||[],t=financeTotals();
  const varianceType=t.variance>0?'bad':'ok';
  const projectType=t.projectVariance>0?'warn':'info';
  return `<div class="grid finance-page"><div class="card s12"><div class="dash-title"><h3>Ã˜konomi</h3><div><button class="action primary" onclick="showFinanceForm()">Konto/reserve</button><button class="action" onclick="showBudgetForm()">Budsjettlinje</button><button class="action" onclick="showActualCostForm()">Faktisk kostnad</button><button class="action" onclick="showProjectForm()">Prosjekt</button><button class="action" onclick="saveBoardFinanceReport()">Lag styrerapport</button></div></div></div>${financeMetric('Bank/konto',money(f.bank_balance),'Tilgjengelig saldo','ok')}${financeMetric('Reservefond',money(f.reserved_funds),'Avsatt reserve','info')}${financeMetric('Budsjett',money(t.budget),'Totalt budsjettert','purple')}${financeMetric('Faktisk kostnad',money(t.actual),t.variance>0?'Over budsjett':'Innenfor budsjett',varianceType)}${financeMetric('Budsjettavvik',financeVarianceMoney(t.variance),t.variance>0?'Merforbruk':'Ingen merforbruk',varianceType)}${financeMetric('ProsjektÃ¸konomi',`${money(t.projectActual)} / ${money(t.projectBudget)}`,t.projectVariance>0?'Prosjekt over budsjett':'Prosjektstatus',projectType)}<div class="card s7"><h3>Budsjett og faktiske kostnader</h3>${financeBudgetSummary(t)}${table(['Kategori','Budsjett','Faktisk','Avvik','Notat','Handling'],lines.map(l=>`<tr><td>${esc(l.category||l.label)}</td><td>${money(l.budget_amount||l.budget)}</td><td>${money(l.actual_amount||l.actual)}</td><td>${money(Number(l.actual_amount||l.actual||0)-Number(l.budget_amount||l.budget||0))}</td><td>${esc(l.notes||'-')}</td><td><div class="row-actions"><button class="action" onclick="showBudgetForm('${esc(l.id)}')">Endre</button><button class="action red" onclick="deleteRow('budget_lines','${esc(l.id)}')">Slett</button></div></td></tr>`))}</div><div class="card s5"><div class="dash-title"><h3>ProsjektÃ¸konomi</h3><button class="action" onclick="showProjectForm()">Nytt prosjekt</button></div>${projectFinanceList(projects)}</div><div class="card s12"><h3>Enkel rapport til styret</h3>${financeReportPreview()}</div></div>`;
}
function financeMetric(label,value,caption,type='info'){
  return `<div class="card s4 finance-metric ${type}"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(caption)}</span></div>`;
}
function projectFinanceList(projects){
  const rows=projects||[];
  if(!rows.length)return '<div class="empty-state"><strong>Ingen prosjekter registrert.</strong><span>Legg inn prosjekt for Ã¥ fÃ¸lge budsjett, faktisk kostnad og status.</span><button class="action primary" onclick="showProjectForm()">Nytt prosjekt</button></div>';
  return `<div class="project-list">${rows.map(p=>{
    const name=p.name||p.title||'Uten prosjektnavn';
    const budget=Number(p.budget||p.budget_amount||0),actual=Number(p.actual_cost||p.actual_amount||0),variance=actual-budget;
    const status=p.status||'Ikke satt';
    return `<section class="project-item"><div class="project-head"><div><strong>${esc(name)}</strong><small>${esc(status)}</small></div><span class="soft-pill ${variance>0?'bad':'ok'}">${variance>0?'Over budsjett':'Innenfor'}</span></div><div class="project-numbers"><div><small>Budsjett</small><b>${money(budget)}</b></div><div><small>Faktisk</small><b>${money(actual)}</b></div><div><small>Avvik</small><b>${financeVarianceMoney(variance)}</b></div></div><div class="row-actions"><button class="action" onclick="showProjectForm('${esc(p.id)}')">Endre</button><button class="action red" onclick="deleteRow('projects','${esc(p.id)}')">Slett</button></div></section>`;
  }).join('')}</div>`;
}
function financeBudgetSummary(t){return `<div class="ops-budget-summary"><div><small>Budsjett</small><b>${money(t.budget)}</b></div><div><small>Faktisk</small><b>${money(t.actual)}</b></div><div><small>Avvik</small><b>${financeVarianceMoney(t.variance)}</b></div><div><small>Prosjekter</small><b>${money(t.projectActual)}</b></div></div>`}
function financeReportPreview(){
  const f=(DP.cache.finance||[])[0]||{},t=financeTotals(),risk=t.variance>0?'Over budsjett':'Innenfor budsjett';
  return `<table><tr><td>Eiendom</td><td>${esc(currentProperty()?.name||'-')}</td></tr><tr><td>Bank/konto</td><td>${money(f.bank_balance)}</td></tr><tr><td>Reservefond</td><td>${money(f.reserved_funds)}</td></tr><tr><td>Budsjett</td><td>${money(t.budget)}</td></tr><tr><td>Faktisk kostnad</td><td>${money(t.actual)}</td></tr><tr><td>Avvik</td><td>${money(t.variance)} Â· ${esc(risk)}</td></tr><tr><td>ProsjektÃ¸konomi</td><td>${money(t.projectActual)} brukt av ${money(t.projectBudget)}</td></tr></table>`;
}
function showFinanceForm(){const f=(DP.cache.finance||[])[0]||{};showDrawer('Konto og fond',`<label>Bank/konto</label><input id="bankBalance" type="number" value="${esc(f.bank_balance||0)}"><label>Reservefond</label><input id="reserveFund" type="number" value="${esc(f.reserved_funds||0)}"><label>Prosjektmidler</label><input id="projectFunds" type="number" value="${esc(f.project_funds||0)}"><label>Kommentar</label><textarea id="financeNotes">${esc(f.notes||'')}</textarea><button class="action primary" onclick="saveFinance()">Lagre</button>`)}
async function saveFinance(){try{requireLive('lagre Ã¸konomi');const row={property_id:currentProperty().id,bank_balance:+bankBalance.value||0,reserved_funds:+reserveFund.value||0,project_funds:+projectFunds.value||0,notes:financeNotes.value||null,updated_at:new Date().toISOString()};let r=await db().from('property_finance').upsert(row,{onConflict:'property_id'}).select().single();if(r.error&&/column|schema|cache/i.test(String(r.error.message||'')))r=await db().from('property_finance').upsert({property_id:row.property_id,bank_balance:row.bank_balance,reserved_funds:row.reserved_funds,project_funds:row.project_funds,updated_at:row.updated_at},{onConflict:'property_id'}).select().single();if(r.error)throw r.error;await insertActivity('Ã˜konomi oppdatert','finance',currentProperty().id);await finishAction('Konto og fond er lagret.','finance')}catch(e){showDrawer('Ã˜konomi ble ikke lagret',`<div class="output">${esc(customerError(e))}</div>`)}}
function showBudgetForm(id=''){const l=(DP.cache.budget_lines||[]).find(x=>x.id===id)||{};showDrawer(id?'Endre budsjettlinje':'Ny budsjettlinje',`<input id="budgetId" type="hidden" value="${esc(id)}"><label>Kategori</label><input id="budCat" value="${esc(l.category||l.label||'')}"><label>Budsjett</label><input id="budBudget" type="number" value="${esc(l.budget_amount||l.budget||0)}"><label>Faktisk</label><input id="budActual" type="number" value="${esc(l.actual_amount||l.actual||0)}"><label>Notat</label><textarea id="budNotes">${esc(l.notes||'')}</textarea><button class="action primary" onclick="saveBudget()">Lagre</button><div id="budgetOut" class="output">Klar til lagring.</div>`)}
function isFinanceSchemaError(error){return /column|schema|cache|relation|does not exist|could not find|not-null|null value|violates/i.test(String(error?.message||error||''))}
function budgetCategoryValue(row={}){
  const value=String(row.label||row.budget_category||row.category||'').trim();
  return value||'Annet';
}
function selectedBudgetCategory(){
  const value=String(document.getElementById('budCat')?.value||'').trim();
  return value||'Annet';
}
function budgetCategoryOptions(selected=''){
  const options=['Drift','Vedlikehold','Prosjekt','Energi','Forsikring','HMS','InnkjÃ¸p','Annet'];
  const current=String(selected||'').trim();
  const list=current&&!options.includes(current)?[current,...options]:options;
  return list.map(x=>`<option value="${esc(x)}" ${current===x?'selected':''}>${esc(x)}</option>`).join('');
}
async function saveBudgetRowVariant(row){
  const client=db();
  return budgetId.value?await client.from('budget_lines').update(row).eq('id',budgetId.value).select().single():await client.from('budget_lines').insert(row).select().single();
}
async function saveBudget(){
  const out=document.getElementById('budgetOut');
  try{
    requireLive('lagre budsjett');
    if(out)out.textContent='Lagrer budsjettlinje...';
    const propertyId=currentProperty().id,category=selectedBudgetCategory(),budget=+budBudget.value||0,actual=+budActual.value||0,notes=budNotes.value||null;
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
    const msg=isFinanceSchemaError(e)?'Ã˜konomioppsettet er ikke helt klart. Kontakt Driftspartner Nord for oppsett av Ã¸konomimodulen.':customerError(e);
    showDrawer('Budsjett ble ikke lagret',`<div class="output">${esc(msg)}</div>`);
  }
}
function showActualCostForm(){showDrawer('Registrer faktisk kostnad',`<label>Kategori</label><input id="costCat" placeholder="Vedlikehold, forsikring, prosjekt..."><label>BelÃ¸p</label><input id="costAmount" type="number"><label>Dato</label><input id="costDate" type="date"><label>Notat</label><textarea id="costNotes"></textarea><button class="action primary" onclick="saveActualCost()">Lagre kostnad</button>`)}
async function saveActualCost(){try{requireLive('lagre kostnad');const category=costCat.value||'Kostnad',actual=+costAmount.value||0,notes=[costDate.value,costNotes.value].filter(Boolean).join(' Â· '),propertyId=currentProperty().id;const variants=[{property_id:propertyId,category,label:category,budget_amount:0,actual_amount:actual,budget:0,actual,notes},{property_id:propertyId,category,label:category,budget_amount:0,actual_amount:actual,budget:0,actual},{property_id:propertyId,label:category,budget_amount:0,actual_amount:actual,notes},{property_id:propertyId,label:category,budget_amount:0,actual_amount:actual},{property_id:propertyId,category,budget_amount:0,actual_amount:actual,notes},{property_id:propertyId,category,budget_amount:0,actual_amount:actual},{property_id:propertyId,category,budget:0,actual,notes},{property_id:propertyId,category,budget:0,actual},{property_id:propertyId,label:category,budget:0,actual,notes},{property_id:propertyId,label:category,budget:0,actual}];let r,lastError=null;for(const variant of variants){r=await db().from('budget_lines').insert(variant).select().single();if(!r.error)break;lastError=r.error;if(!isFinanceSchemaError(r.error))break}if(r?.error)throw lastError||r.error;await insertActivity('Faktisk kostnad registrert','budget',r.data?.id||category);await finishAction('Kostnaden er registrert.','finance')}catch(e){const msg=isFinanceSchemaError(e)?'Ã˜konomioppsettet er ikke helt klart. Kontakt Driftspartner Nord for oppsett av Ã¸konomimodulen.':customerError(e);showDrawer('Kostnad ble ikke lagret',`<div class="output">${esc(msg)}</div>`)}}
function showProjectForm(id=''){const p=(DP.cache.projects||[]).find(x=>x.id===id)||{};showDrawer(id?'Endre prosjekt':'Nytt prosjekt',`<input id="projectId" type="hidden" value="${esc(id)}"><label>Navn</label><input id="projectName" value="${esc(p.name||p.title||'')}"><label>Beskrivelse</label><textarea id="projectDesc">${esc(p.description||'')}</textarea><label>Budsjett</label><input id="projectBudget" type="number" value="${esc(p.budget||p.budget_amount||0)}"><label>Faktisk kostnad</label><input id="projectActual" type="number" value="${esc(p.actual_cost||p.actual_amount||0)}"><label>Frist</label><input id="projectDue" type="date" value="${esc(p.due_date||'')}"><label>Status</label><select id="projectStatus"><option ${p.status==='Planlagt'?'selected':''}>Planlagt</option><option ${p.status==='PÃ¥gÃ¥r'?'selected':''}>PÃ¥gÃ¥r</option><option ${p.status==='Ferdig'?'selected':''}>Ferdig</option></select><button class="action primary" onclick="saveProject()">Lagre</button>`)}
async function saveProject(){try{requireLive('lagre prosjekt');const row={property_id:currentProperty().id,name:projectName.value,description:projectDesc.value,budget:+projectBudget.value||0,actual_cost:+projectActual.value||0,due_date:projectDue.value||null,status:projectStatus.value};let r=projectId.value?await db().from('projects').update(row).eq('id',projectId.value).select().single():await db().from('projects').insert(row).select().single();if(r.error&&/column|schema|cache/i.test(String(r.error.message||''))){delete row.actual_cost;r=projectId.value?await db().from('projects').update(row).eq('id',projectId.value).select().single():await db().from('projects').insert(row).select().single()}if(r.error)throw r.error;await insertActivity('Prosjekt lagret','project',r.data.id);await finishAction('Prosjektet er lagret.','finance')}catch(e){showDrawer('Prosjekt ble ikke lagret',`<div class="output">${esc(customerError(e))}</div>`)}}
function financeReportHtml(){
  const p=currentProperty(),f=(DP.cache.finance||[])[0]||{},lines=DP.cache.budget_lines||[],projects=DP.cache.projects||[],t=financeTotals();
  const row=(a,b)=>`<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`;
  const budgetRows=lines.map(l=>`<tr><td>${esc(budgetCategoryValue(l))}</td><td>${money(l.budget_amount||l.budget)}</td><td>${money(l.actual_amount||l.actual)}</td><td>${money(Number(l.actual_amount||l.actual||0)-Number(l.budget_amount||l.budget||0))}</td></tr>`).join('');
  const projectRows=projects.map(pr=>`<tr><td>${esc(pr.name||pr.title)}</td><td>${money(pr.budget||pr.budget_amount)}</td><td>${money(pr.actual_cost||pr.actual_amount)}</td><td>${esc(pr.status||'-')}</td></tr>`).join('');
  return `<!doctype html><html lang="no"><head><meta charset="utf-8"><title>Ã˜konomirapport</title><style>body{font-family:Arial,sans-serif;background:#f4f7fb;color:#172033;margin:0}.page{max-width:900px;margin:32px auto;background:#fff;border:1px solid #d8e0eb;border-radius:14px;overflow:hidden}header{background:#0d347d;color:#fff;padding:28px 34px}main{padding:28px 34px}table{width:100%;border-collapse:collapse;margin:0 0 24px}td,th{border-bottom:1px solid #e6edf5;padding:10px;text-align:left}h2{margin-top:28px}.note{background:#eef5ff;border-left:4px solid #176bff;padding:14px;border-radius:10px}</style></head><body><section class="page"><header><small>Driftspartner OS</small><h1>Ã˜konomirapport til styret</h1><p>${esc(p?.name||'-')} Â· ${esc(new Date().toLocaleString('nb-NO'))}</p></header><main><h2>NÃ¸kkeltall</h2><table>${row('Bank/konto',money(f.bank_balance))}${row('Reservefond',money(f.reserved_funds))}${row('Prosjektmidler',money(f.project_funds))}${row('Budsjett',money(t.budget))}${row('Faktisk kostnad',money(t.actual))}${row('Avvik',money(t.variance))}</table><h2>Budsjett</h2><table><tr><th>Kategori</th><th>Budsjett</th><th>Faktisk</th><th>Avvik</th></tr>${budgetRows||'<tr><td colspan="4">Ingen budsjettlinjer registrert.</td></tr>'}</table><h2>Prosjekter</h2><table><tr><th>Prosjekt</th><th>Budsjett</th><th>Faktisk</th><th>Status</th></tr>${projectRows||'<tr><td colspan="4">Ingen prosjekter registrert.</td></tr>'}</table><div class="note">Rapporten er generert fra live Ã¸konomidata pÃ¥ valgt eiendom.</div></main></section></body></html>`;
}
async function saveBoardFinanceReport(){try{requireLive('lage styrerapport');if(typeof uploadGeneratedDocument!=='function')throw new Error('Dokumentarkivet er ikke klart.');const doc=await uploadGeneratedDocument('Ã˜konomirapport - '+(currentProperty()?.name||'eiendom'),'Styrepapir',financeReportHtml(),'Klar');await hydrateAll();showDrawer('Styrerapport lagret',`<p>Ã˜konomirapporten er lagret i dokumentarkivet.</p><button class="action primary" onclick="openDocument('${esc(doc.id)}')">Ã…pne rapport</button>`)}catch(e){showDrawer('Rapport ble ikke laget',`<div class="output">${esc(customerError(e))}</div>`)}}
function FinancePage(){
  const f=(DP.cache.finance||[])[0]||{},lines=DP.cache.budget_lines||[],projects=DP.cache.projects||[],t=financeTotals();
  const budgetRisk=t.variance>0?'bad':'ok',projectRisk=t.projectVariance>0?'warn':'ok';
  const reserveShare=Number(f.bank_balance||0)>0?Math.round(Number(f.reserved_funds||0)/Number(f.bank_balance||0)*100):0;
  return `<div class="grid finance-page premium-finance-module">
    <div class="card s12 module-hero finance-hero">
      <div><small>Ã˜konomi</small><h2>Styreklart Ã¸konomibilde</h2><p>Bank, reservefond, budsjett, faktiske kostnader og prosjektÃ¸konomi for valgt eiendom. Tallene hentes live fra valgt eiendom.</p></div>
      <div class="module-actions"><button class="action primary" onclick="showFinanceForm()">Konto og fond</button><button class="action" onclick="showBudgetForm()">Ny budsjettlinje</button><button class="action" onclick="showActualCostForm()">Registrer kostnad</button><button class="action" onclick="showProjectForm()">Nytt prosjekt</button><button class="action" onclick="saveBoardFinanceReport()">Lag styrerapport</button><button class="action" onclick="showEmailFlow('board')">Send e-post</button></div>
    </div>
    ${financeMetric('Bank/konto',money(f.bank_balance),'Registrert banksaldo','ok')}
    ${financeMetric('Reservefond',money(f.reserved_funds),reserveShare?`${reserveShare}% av bank/konto`:'Avsatt reserve','info')}
    ${financeMetric('Prosjektmidler',money(f.project_funds),'Midler avsatt til prosjekter','purple')}
    ${financeMetric('Budsjett',money(t.budget),'Totalt budsjettert','purple')}
    ${financeMetric('Faktisk kostnad',money(t.actual),t.variance>0?'Over budsjett':'Innenfor budsjett',budgetRisk)}
    ${financeMetric('Budsjettavvik',financeVarianceMoney(t.variance),t.variance>0?'MÃ¥ forklares for styret':'Ingen merforbruk',budgetRisk)}
    <div class="card s8 finance-chart-panel"><div class="dash-title"><div><h3>Budsjett mot faktisk</h3><p class="muted">Viser hvilke omrÃ¥der som driver Ã¸konomien.</p></div><button class="action" onclick="showBudgetForm()">Legg til linje</button></div>${financeBudgetChart(lines,projects)}</div>
    <div class="card s4 finance-board-card"><h3>Styrets Ã¸konomipunkter</h3>${financeDecisionList(f,t,projects)}</div>
    <div class="card s7 finance-list-panel"><div class="dash-title"><div><h3>Budsjettlinjer</h3><p class="muted">Budsjett, faktisk kostnad og avvik per kategori.</p></div><button class="action" onclick="showActualCostForm()">Registrer kostnad</button></div>${budgetLineCards(lines)}</div>
    <div class="card s5 finance-list-panel"><div class="dash-title"><div><h3>ProsjektÃ¸konomi</h3><p class="muted">Prosjekter, forbruk, frist og status.</p></div><button class="action" onclick="showProjectForm()">Nytt prosjekt</button></div>${projectFinanceList(projects)}</div>
    <div class="card s12 finance-report-card"><div class="dash-title"><div><h3>Styrerapport</h3><p class="muted">Kort rapportgrunnlag som kan lagres i dokumentarkivet.</p></div><button class="action primary" onclick="saveBoardFinanceReport()">Lagre styrerapport</button></div>${financeReportPreview()}</div>
  </div>`;
}
function financeDecisionList(f,t,projects){
  const rows=[];
  rows.push({type:t.variance>0?'bad':'ok',title:t.variance>0?'Budsjettavvik mÃ¥ forklares':'Budsjett ser kontrollert ut',text:t.variance>0?`${financeVarianceMoney(t.variance)} over budsjett.`:'Ingen registrert merforbruk.'});
  rows.push({type:Number(f.reserved_funds||0)>0?'ok':'warn',title:Number(f.reserved_funds||0)>0?'Reservefond registrert':'Reservefond mangler',text:Number(f.reserved_funds||0)>0?`${money(f.reserved_funds)} er satt av.`:'Legg inn reservefond for bedre rapportering.'});
  rows.push({type:t.projectVariance>0?'warn':'info',title:projects.length?'Prosjekter registrert':'Ingen prosjekter',text:projects.length?`${projects.length} prosjekt fÃ¸lger budsjett/faktisk.`:'Opprett prosjekt for stÃ¸rre tiltak.'});
  return `<div class="finance-decision-list">${rows.map(r=>`<section class="finance-decision ${r.type}"><b>${esc(r.title)}</b><span>${esc(r.text)}</span></section>`).join('')}</div>`;
}
function financeBudgetChart(lines,projects){
  const counts={};
  const rows=(lines||[]).map((l,idx)=>{
    const base=budgetCategoryValue(l);
    counts[base]=(counts[base]||0)+1;
    const total=(lines||[]).filter(x=>budgetCategoryValue(x)===base).length;
    const suffix=total>1?` ${counts[base]}`:'';
    return {id:l.id,label:`${base}${suffix}`,budget:Number(l.budget_amount||l.budget||0),actual:Number(l.actual_amount||l.actual||0),type:'budget'};
  });
  if(projects?.length)rows.push({label:'Prosjekter',budget:projects.reduce((s,p)=>s+Number(p.budget||p.budget_amount||0),0),actual:projects.reduce((s,p)=>s+Number(p.actual_cost||p.actual_amount||0),0),type:'project'});
  if(!rows.length)return '<div class="empty-state"><strong>Ingen Ã¸konomilinjer registrert.</strong><span>Legg inn fÃ¸rste budsjettlinje for Ã¥ fÃ¥ graf og styrerapport.</span><button class="action primary" onclick="showBudgetForm()">Ny budsjettlinje</button></div>';
  const max=Math.max(1,...rows.flatMap(r=>[r.budget,r.actual]));
  return `<div class="finance-module-legend"><span><i class="budget"></i>Budsjett</span><span><i class="actual"></i>Faktisk</span><span><i class="over"></i>Over budsjett</span></div><div class="finance-module-bars">${rows.map(r=>{
    const actualClass=r.actual>r.budget?'actual over':'actual';
    return `<div class="finance-module-row"><div class="finance-module-label">${esc(r.label)}</div><div class="finance-module-track"><span class="budget" style="width:${Math.max(4,Math.round(r.budget/max*100))}%"></span><span class="${actualClass}" style="width:${Math.max(4,Math.round(r.actual/max*100))}%"></span></div><div class="finance-module-value"><b>${money(r.actual)}</b><small>av ${money(r.budget)}</small></div></div>`;
  }).join('')}</div>`;
}
function budgetLineCards(lines){
  if(!lines.length)return '<div class="empty-state"><strong>Ingen budsjettlinjer.</strong><span>Legg inn drift, vedlikehold, forsikring eller prosjekt for Ã¥ fÃ¥ et komplett Ã¸konomibilde.</span><button class="action primary" onclick="showBudgetForm()">Ny budsjettlinje</button></div>';
  return `<div class="budget-card-list">${lines.map(l=>{
    const budget=Number(l.budget_amount||l.budget||0),actual=Number(l.actual_amount||l.actual||0),variance=actual-budget;
    return `<section class="budget-line-card ${variance>0?'bad':'ok'}"><div class="budget-line-head"><div><strong>${esc(budgetCategoryValue(l))}</strong><small>${esc(l.notes||'Ingen notat')}</small></div><span class="soft-pill ${variance>0?'bad':'ok'}">${variance>0?'Over budsjett':'Innenfor'}</span></div><div class="project-numbers"><div><small>Budsjett</small><b>${money(budget)}</b></div><div><small>Faktisk</small><b>${money(actual)}</b></div><div><small>Avvik</small><b>${financeVarianceMoney(variance)}</b></div></div><div class="row-actions"><button class="action" onclick="showBudgetForm('${esc(l.id)}')">Endre</button><button class="action red" onclick="deleteRow('budget_lines','${esc(l.id)}')">Slett</button></div></section>`;
  }).join('')}</div>`;
}
function financeReportPreview(){
  const f=(DP.cache.finance||[])[0]||{},t=financeTotals(),risk=t.variance>0?'Merforbruk registrert':'Innenfor registrert budsjett';
  return `<div class="finance-report-grid"><div><small>Eiendom</small><b>${esc(currentProperty()?.name||'-')}</b></div><div><small>Bank/konto</small><b>${money(f.bank_balance)}</b></div><div><small>Reservefond</small><b>${money(f.reserved_funds)}</b></div><div><small>Budsjett</small><b>${money(t.budget)}</b></div><div><small>Faktisk</small><b>${money(t.actual)}</b></div><div><small>Avvik</small><b>${financeVarianceMoney(t.variance)}</b></div><div><small>ProsjektÃ¸konomi</small><b>${money(t.projectActual)} av ${money(t.projectBudget)}</b></div><div><small>Vurdering</small><b>${esc(risk)}</b></div></div><div class="flow-note">Rapporten lagres som styrepapir i dokumentarkivet og kan brukes som grunnlag fÃ¸r styremÃ¸te.</div>`;
}
function showFinanceForm(){const f=(DP.cache.finance||[])[0]||{};showDrawer('Konto og fond',`<div class="form-grid two"><label>Bank/konto<input id="bankBalance" type="number" value="${esc(f.bank_balance||0)}"></label><label>Reservefond<input id="reserveFund" type="number" value="${esc(f.reserved_funds||0)}"></label><label>Prosjektmidler<input id="projectFunds" type="number" value="${esc(f.project_funds||0)}"></label><label>Kommentar<textarea id="financeNotes">${esc(f.notes||'')}</textarea></label></div><button class="action primary" onclick="saveFinance()">Lagre konto og fond</button>`)}
function showBudgetForm(id=''){const l=(DP.cache.budget_lines||[]).find(x=>x.id===id)||{};showDrawer(id?'Endre budsjettlinje':'Ny budsjettlinje',`<input id="budgetId" type="hidden" value="${esc(id)}"><div class="form-grid two"><label>Kategori<select id="budCat">${budgetCategoryOptions(budgetCategoryValue(l))}</select></label><label>Budsjett<input id="budBudget" type="number" value="${esc(l.budget_amount||l.budget||0)}"></label><label>Faktisk<input id="budActual" type="number" value="${esc(l.actual_amount||l.actual||0)}"></label><label>Notat<textarea id="budNotes">${esc(l.notes||'')}</textarea></label></div><button class="action primary" onclick="saveBudget()">Lagre budsjettlinje</button><div id="budgetOut" class="output">Klar til lagring.</div>`)}
function showActualCostForm(){showDrawer('Registrer faktisk kostnad',`<div class="form-grid two"><label>Kategori<select id="costCat">${budgetCategoryOptions('Annet')}</select></label><label>BelÃ¸p<input id="costAmount" type="number"></label><label>Dato<input id="costDate" type="date"></label><label>Notat<textarea id="costNotes"></textarea></label></div><button class="action primary" onclick="saveActualCost()">Lagre kostnad</button>`)}
function showProjectForm(id=''){const p=(DP.cache.projects||[]).find(x=>x.id===id)||{};showDrawer(id?'Endre prosjekt':'Nytt prosjekt',`<input id="projectId" type="hidden" value="${esc(id)}"><div class="form-grid two"><label>Prosjektnavn<input id="projectName" value="${esc(p.name||p.title||'')}"></label><label>Status<select id="projectStatus"><option ${p.status==='Planlagt'?'selected':''}>Planlagt</option><option ${p.status==='PÃ¥gÃ¥r'?'selected':''}>PÃ¥gÃ¥r</option><option ${p.status==='Ferdig'?'selected':''}>Ferdig</option></select></label><label>Budsjett<input id="projectBudget" type="number" value="${esc(p.budget||p.budget_amount||0)}"></label><label>Faktisk kostnad<input id="projectActual" type="number" value="${esc(p.actual_cost||p.actual_amount||0)}"></label><label>Frist<input id="projectDue" type="date" value="${esc(p.due_date||'')}"></label><label>Beskrivelse<textarea id="projectDesc">${esc(p.description||'')}</textarea></label></div><button class="action primary" onclick="saveProject()">Lagre prosjekt</button>`)}
function MarketPage(){const rfqs=DP.cache.quote_requests||[],offers=DP.cache.offers||[],suppliers=DP.suppliers||[];return `<div class="grid market-page"><div class="card s12 module-hero"><div><small>InnkjÃ¸p og leverandÃ¸rer</small><h2>Fra forespÃ¸rsel til valgt tilbud</h2><p>Opprett forespÃ¸rsel, inviter leverandÃ¸rer, last opp tilbud og dokumenter beslutningen.</p></div><div class="module-actions"><button class="action primary" onclick="showRfqForm()">Ny tilbudsforespÃ¸rsel</button><button class="action" onclick="showSupplierForm()">Ny leverandÃ¸r</button><button class="action" onclick="showOfferForm()">Last opp tilbud</button></div></div><div class="card s12 market-pipeline"><div><small>LeverandÃ¸rer</small><b>${suppliers.length}</b><span>Registrerte firma</span></div><div><small>ForespÃ¸rsler</small><b>${rfqs.length}</b><span>Aktive eller historiske RFQ</span></div><div><small>Tilbud</small><b>${offers.length}</b><span>Mottatte tilbud</span></div><div><small>Verdi</small><b>${money(offers.reduce((s,o)=>s+Number(o.price||0),0))}</b><span>Samlet tilbudsverdi</span></div></div><div class="card s4"><h3>LeverandÃ¸rer</h3>${supplierCards()}</div><div class="card s4"><h3>ForespÃ¸rsler</h3>${rfqCards(rfqs)}</div><div class="card s4"><h3>Tilbud</h3>${offerCards(offers)}</div></div>`}
function supplierCards(){const rows=DP.suppliers||[];if(!rows.length)return '<div class="empty-state"><strong>Ingen leverandÃ¸rer registrert.</strong><span>Legg inn leverandÃ¸rer med e-post fÃ¸r tilbudsforespÃ¸rsel sendes.</span><button class="action primary" onclick="showSupplierForm()">Ny leverandÃ¸r</button></div>';return `<div class="stack-list">${rows.map(s=>`<section class="mini-record"><div><strong>${esc(s.name)}</strong><small>${esc([s.email,s.trade].filter(Boolean).join(' Â· '))}</small></div><button class="action red" onclick="deleteRow('suppliers','${esc(s.id)}')">Slett</button></section>`).join('')}</div>`}
function rfqCards(rows){if(!rows.length)return '<div class="empty-state"><strong>Ingen forespÃ¸rsler.</strong><span>Lag en tilbudsforespÃ¸rsel nÃ¥r en arbeidsordre skal prises.</span><button class="action primary" onclick="showRfqForm()">Ny forespÃ¸rsel</button></div>';return `<div class="stack-list">${rows.map(q=>`<section class="mini-record"><div><strong>${esc(q.title||'Uten tittel')}</strong><small>${esc(q.deadline||'Ingen frist')} Â· ${esc(q.status||'Utkast')}</small></div><button class="action red" onclick="deleteRow('quote_requests','${esc(q.id)}')">Slett</button></section>`).join('')}</div>`}
function offerCards(rows){if(!rows.length)return '<div class="empty-state"><strong>Ingen tilbud mottatt.</strong><span>Last opp PDF og pris fra leverandÃ¸r nÃ¥r tilbud kommer inn.</span><button class="action primary" onclick="showOfferForm()">Last opp tilbud</button></div>';return `<div class="stack-list">${rows.map(o=>`<section class="mini-record"><div><strong>${esc(o.suppliers?.name||'LeverandÃ¸r')}</strong><small>${money(o.price)} Â· ${esc(o.status||'Mottatt')}</small></div><button class="action red" onclick="deleteRow('offers','${esc(o.id)}')">Slett</button></section>`).join('')}</div>`}
function supplierTable(){return supplierCards()}
function showSupplierForm(){showDrawer('Ny leverandÃ¸r',`<label>Org.nr</label><div class="lookup-row"><input id="supOrgNo" placeholder="9 siffer"><button class="action" onclick="lookupBrregSupplier()">Hent fra BrÃ¸nnÃ¸ysund</button></div><label>Firma</label><input id="supName"><label>E-post</label><input id="supEmail"><label>FagomrÃ¥de</label><input id="supTrade"><label>Adresse</label><input id="supAddress"><div id="supLookupOut" class="output">Skriv org.nr og hent firmainfo automatisk.</div><button class="action primary" onclick="saveSupplier()">Lagre leverandÃ¸r</button>`)}
function orgDigits(value){return String(value||'').replace(/\D/g,'').slice(0,9)}
function brregAddress(entity){const a=entity?.forretningsadresse||entity?.postadresse||{};return [...(a.adresse||[]),[a.postnummer,a.poststed].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
function brregForm(entity){return entity?.organisasjonsform?.beskrivelse||entity?.organisasjonsform?.kode||''}
function setFieldValue(id,value){const el=document.getElementById(id);if(el&&value!==undefined&&value!==null)el.value=value}
function setFieldText(id,value){const el=document.getElementById(id);if(el)el.textContent=value}
async function lookupBrregOrg(orgNo){
  const digits=orgDigits(orgNo);
  if(digits.length!==9)throw new Error('Org.nr mÃ¥ ha 9 siffer.');
  const res=await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${digits}`,{headers:{accept:'application/json'}});
  if(res.status===404)throw new Error('Fant ikke org.nr i BrÃ¸nnÃ¸ysund.');
  if(!res.ok)throw new Error('Kunne ikke hente firmainfo fra BrÃ¸nnÃ¸ysund akkurat nÃ¥.');
  return await res.json();
}
async function lookupBrregSupplier(){
  try{
    setFieldText('supLookupOut','Henter firmainfo fra BrÃ¸nnÃ¸ysund...');
    const entity=await lookupBrregOrg(document.getElementById('supOrgNo')?.value);
    const address=brregAddress(entity);
    setFieldValue('supOrgNo',entity.organisasjonsnummer||orgDigits(document.getElementById('supOrgNo')?.value));
    setFieldValue('supName',entity.navn||'');
    setFieldValue('supAddress',address);
    if(entity.naeringskode1?.beskrivelse)setFieldValue('supTrade',supplierTradeFromText(entity.naeringskode1.beskrivelse));
    setFieldText('supLookupOut',`Fant ${entity.navn||'leverandÃ¸r'} Â· ${entity.organisasjonsnummer||''}${address?' Â· '+address:''}`);
  }catch(e){setFieldText('supLookupOut',customerError(e,'Kunne ikke hente firmainfo. Sjekk org.nr og prÃ¸v igjen.'))}
}
async function saveSupplier(){try{requireLive('lagre leverandÃ¸r');if(typeof assertPackageLimit==='function')assertPackageLimit('suppliers','leverandÃ¸rer');if(!supEmail.value.includes('@'))throw new Error('LeverandÃ¸r mÃ¥ ha e-post.');const r=await db().from('suppliers').insert({name:supName.value,email:supEmail.value,trade:supTrade.value,status:'active'}).select().single();if(r.error)throw r.error;await insertActivity('LeverandÃ¸r lagret','supplier',r.data.id);await finishAction('LeverandÃ¸ren er lagret.','market')}catch(e){showDrawer('LeverandÃ¸r ble ikke lagret',`<div class=\"output\">${esc(customerError(e))}</div>`)}}
function showRfqForm(workOrderId=''){showDrawer('TilbudsforespÃ¸rsel',`<input id="rfqWo" type="hidden" value="${esc(workOrderId)}"><label>Tittel</label><input id="rfqTitle"><label>Beskrivelse</label><textarea id="rfqDesc"></textarea><label>Frist</label><input id="rfqDeadline" type="date"><button class="action primary" onclick="saveRfq()">Lagre tilbudsforespÃ¸rsel</button>`)}
async function saveRfq(){try{if(typeof subscriptionHas==='function'&&!subscriptionHas('rfq'))throw new Error('TilbudsforespÃ¸rsel krever Premium.');requireLive('Lagre tilbudsforespÃ¸rsel');let row={property_id:currentProperty().id,title:rfqTitle.value,description:rfqDesc.value,deadline:rfqDeadline.value||null,status:'Utkast'};if(isUuid(rfqWo.value))row.work_order_id=rfqWo.value;const r=await db().from('quote_requests').insert(row).select().single();if(r.error)throw r.error;await insertActivity('TilbudsforespÃ¸rsel opprettet','quote_request',r.data.id);await finishAction('TilbudsforespÃ¸rselen er opprettet.','market')}catch(e){showDrawer('TilbudsforespÃ¸rsel ble ikke lagret',`<div class=\"output\">${esc(customerError(e))}</div>`)}}
function showOfferForm(){showDrawer('Last opp tilbud',`<label>LeverandÃ¸r</label><select id="offerSupplier">${DP.suppliers.map(s=>`<option value="${s.id}">${esc(s.name)} - ${esc(s.email)}</option>`).join('')}</select><label>Pris</label><input id="offerPrice" type="number"><label>Forbehold</label><textarea id="offerTerms"></textarea><label>PDF</label><input id="offerFile" type="file"><button class="action primary" onclick="saveOffer()">Lagre tilbud</button><div id="offerOut" class="output"></div>`)}
async function saveOffer(){const out=document.getElementById('offerOut');try{if(typeof subscriptionHas==='function'&&!subscriptionHas('rfq'))throw new Error('Tilbudsopplasting krever Premium.');requireLive('lagre tilbud');const file=offerFile.files[0];if(!file)throw new Error('Velg PDF/vedlegg.');const path=`${currentProperty().id}/Tilbud/${Date.now()}-${file.name}`.replace(/\s+/g,'-');let up=await db().storage.from('documents').upload(path,file,{upsert:false,contentType:file.type||undefined});if(up.error)throw up.error;let doc=await db().from('documents').insert({property_id:currentProperty().id,title:file.name,category:'Tilbud',storage_path:path,mime_type:file.type,status:'Mottatt'}).select().single();if(doc.error)throw doc.error;let r=await db().from('offers').insert({property_id:currentProperty().id,supplier_id:offerSupplier.value,price:+offerPrice.value||0,reservations:offerTerms.value,status:'Mottatt'}).select().single();if(r.error)throw r.error;await insertActivity('Tilbud lastet opp','offer',r.data.id);await finishAction('Tilbudet er lastet opp.','market')}catch(e){setOutputError(out,e)}}

function MarketPage(){
  const rfqs=DP.cache.quote_requests||[],offers=DP.cache.offers||[],suppliers=DP.suppliers||[];
  const hasRfq=typeof subscriptionHas==='function'?subscriptionHas('rfq'):true;
  if(!hasRfq)return SupplierRegisterPage(suppliers);
  const sent=rfqs.filter(r=>/sendt|aktiv|publisert/i.test(r.status||'')).length,totalOfferValue=offers.reduce((s,o)=>s+Number(o.price||0),0);
  const best=offers.filter(o=>Number(o.price||0)>0).sort((a,b)=>Number(a.price||0)-Number(b.price||0))[0];
  return `<div class="grid market-page premium-market-page">
    <div class="card s12 module-hero market-hero"><div><small>Marked og tilbud</small><h2>InnkjÃ¸p fra behov til valgt leverandÃ¸r</h2><p>Registrer leverandÃ¸rer, lag tilbudsforespÃ¸rsel, last opp PDF og vurder pris, forbehold og risiko pÃ¥ valgt eiendom.</p></div><div class="module-actions"><button class="action primary" onclick="showRfqForm()">Lag tilbudsforespÃ¸rsel</button><button class="action" onclick="showSupplierForm()">Registrer leverandÃ¸r</button><button class="action" onclick="showOfferForm()">Last opp tilbud</button><button class="action" onclick="showEmailFlow('quote')">Send RFQ e-post</button></div></div>
    <div class="card s12 market-pipeline premium-market-metrics">
      <div><small>LeverandÃ¸rer</small><b>${suppliers.length}</b><span>Firma med e-post</span></div>
      <div><small>ForespÃ¸rsler</small><b>${rfqs.length}</b><span>RFQ pÃ¥ eiendommen</span></div>
      <div><small>Sendt/aktiv</small><b>${sent}</b><span>Krever oppfÃ¸lging</span></div>
      <div><small>Tilbud</small><b>${offers.length}</b><span>Mottatte tilbud</span></div>
      <div><small>Tilbudsverdi</small><b>${money(totalOfferValue)}</b><span>Samlet registrert verdi</span></div>
    </div>
    <div class="card s8 market-flow-card"><div class="dash-title"><div><h3>InnkjÃ¸psflyt</h3><p class="muted">Viser om prosessen er klar for vurdering og styrebeslutning.</p></div><button class="action" onclick="showRfqForm()">Ny RFQ</button></div>${procurementFlow(rfqs,offers,suppliers)}</div>
    <div class="card s4 market-recommendation"><h3>Beste registrerte tilbud</h3>${best?offerRecommendation(best,offers):'<div class="empty-state"><strong>Ingen tilbud Ã¥ vurdere.</strong><span>Last opp minst ett tilbud med pris og PDF.</span><button class="action primary" onclick="showOfferForm()">Last opp tilbud</button></div>'}</div>
    <div class="card s4"><div class="dash-title"><h3>LeverandÃ¸rer</h3><button class="action" onclick="showSupplierForm()">Ny</button></div>${supplierCards()}</div>
    <div class="card s4"><div class="dash-title"><h3>ForespÃ¸rsler</h3><button class="action" onclick="showRfqForm()">Ny</button></div>${rfqCards(rfqs)}</div>
    <div class="card s4"><div class="dash-title"><h3>Tilbud</h3><button class="action" onclick="showOfferForm()">Last opp</button></div>${offerCards(offers)}</div>
  </div>`;
}
function SupplierRegisterPage(suppliers=DP.suppliers||[]){
  return `<div class="grid market-page supplier-only-page">
    <div class="card s12 module-hero market-hero"><div><small>LeverandÃ¸rregister</small><h2>LeverandÃ¸rer for ${esc(currentProperty()?.name||'valgt eiendom')}</h2><p>Pro-pakken gir leverandÃ¸rregister med firma, e-post, fagomrÃ¥de og historikk. TilbudsforespÃ¸rsel, tilbudsopplasting og RFQ er Premium.</p></div><div class="module-actions"><button class="action primary" onclick="showSupplierForm()">Registrer leverandÃ¸r</button><button class="action" onclick="showEmailFlow('general')">Send e-post</button></div></div>
    <div class="card s4 market-pipeline"><div><small>LeverandÃ¸rer</small><b>${suppliers.length}</b><span>Registrerte firma</span></div></div>
    <div class="card s8"><div class="dash-title"><div><h3>LeverandÃ¸rregister</h3><p class="muted">Legg inn leverandÃ¸rer med e-post og fagomrÃ¥de fÃ¸r Premium RFQ eventuelt tas i bruk.</p></div><button class="action primary" onclick="showSupplierForm()">Ny leverandÃ¸r</button></div>${supplierCards()}</div>
    <div class="card s4"><h3>Premium-funksjoner</h3><div class="empty-state"><strong>RFQ og tilbud er Premium.</strong><span>Oppgrader til Premium for tilbudsinnhenting, PDF-opplasting, tilbudsvurdering og tildeling.</span></div></div>
  </div>`;
}
function supplierName(id){const s=(DP.suppliers||[]).find(x=>x.id===id);return s?.name||'LeverandÃ¸r'}
function procurementFlow(rfqs,offers,suppliers){
  const steps=[
    ['LeverandÃ¸rer',suppliers.length,'Registrer aktuelle firma med e-post',suppliers.length?'ok':'warn'],
    ['ForespÃ¸rsel',rfqs.length,'Lag RFQ med frist og beskrivelse',rfqs.length?'ok':'warn'],
    ['Tilbud/PDF',offers.length,'Last opp tilbud og forbehold',offers.length?'ok':'warn'],
    ['Vurdering',offers.length>1?offers.length:0,'Sammenlign pris og risiko',offers.length>1?'ok':'warn'],
    ['Beslutning',offers.some(o=>/valgt|godkjent/i.test(o.status||''))?1:0,'Velg leverandÃ¸r og dokumenter valg',offers.some(o=>/valgt|godkjent/i.test(o.status||''))?'ok':'warn']
  ];
  return `<div class="procurement-steps">${steps.map((s,i)=>`<section class="procurement-step ${s[3]}"><span>${i+1}</span><div><b>${esc(s[0])}</b><strong>${esc(String(s[1]))}</strong><small>${esc(s[2])}</small></div></section>`).join('')}</div>`;
}
function offerRecommendation(best,offers){
  const avg=offers.length?offers.reduce((s,o)=>s+Number(o.price||0),0)/offers.length:0;
  const diff=avg?Math.round((1-Number(best.price||0)/avg)*100):0;
  return `<div class="offer-recommend"><strong>${esc(supplierName(best.supplier_id)||best.suppliers?.name||'LeverandÃ¸r')}</strong><b>${money(best.price)}</b><span>${diff>0?`${diff}% lavere enn snittet`:'Laveste registrerte pris'}</span><p>${esc(best.reservations||'Ingen forbehold registrert.')}</p><div class="row-actions"><button class="action primary" onclick="markOfferSelected('${esc(best.id)}')">Marker valgt</button><button class="action" onclick="showOfferForm()">Last opp mer</button></div></div>`;
}
function supplierTradeList(){return ['Tak og fasade','VVS / rÃ¸rlegger','Elektro','Brann og sikkerhet','HMS / SHA','Heis','Ventilasjon','UteomrÃ¥de / grÃ¸nt','SnÃ¸rydding / vinterdrift','Renhold','Bygg / tÃ¸mrer','Maler / overflate','LÃ¥s / adgang','Skadedyr','Forsikring','Regnskap / Ã¸konomi','Juridisk','Forvaltning','IT / system','Annet']}
function supplierTradeOptions(selected='Tak og fasade'){const current=String(selected||'Tak og fasade');const all=supplierTradeList().includes(current)?supplierTradeList():[current,...supplierTradeList()];return all.map(x=>`<option value="${esc(x)}" ${x===current?'selected':''}>${esc(x)}</option>`).join('')}
function supplierTradeFromText(text=''){const v=String(text||'').toLowerCase();if(/rÃ¸r|ror|vvs|sanitÃ¦r|sanitaer/.test(v))return 'VVS / rÃ¸rlegger';if(/elektro|elektr/.test(v))return 'Elektro';if(/brann|sikkerhet|alarm/.test(v))return 'Brann og sikkerhet';if(/hms|sha/.test(v))return 'HMS / SHA';if(/heis/.test(v))return 'Heis';if(/ventilasjon|inneklima/.test(v))return 'Ventilasjon';if(/snÃ¸|sno|vinter/.test(v))return 'SnÃ¸rydding / vinterdrift';if(/renhold|vask/.test(v))return 'Renhold';if(/bygg|tÃ¸mrer|tomrer|entreprenÃ¸r|entreprenor/.test(v))return 'Bygg / tÃ¸mrer';if(/maler|overflate/.test(v))return 'Maler / overflate';if(/lÃ¥s|las|adgang/.test(v))return 'LÃ¥s / adgang';if(/skadedyr/.test(v))return 'Skadedyr';if(/forsikring/.test(v))return 'Forsikring';if(/regnskap|Ã¸konomi|okonomi/.test(v))return 'Regnskap / Ã¸konomi';if(/juridisk|advokat/.test(v))return 'Juridisk';if(/forvalt/.test(v))return 'Forvaltning';if(/it|system|data/.test(v))return 'IT / system';if(/tak|fasade/.test(v))return 'Tak og fasade';return 'Annet'}
function supplierCards(){const rows=DP.suppliers||[],hasRfq=typeof subscriptionHas==='function'?subscriptionHas('rfq'):true;if(!rows.length)return '<div class="empty-state"><strong>Ingen leverandÃ¸rer registrert.</strong><span>Legg inn leverandÃ¸rer med e-post fÃ¸r tilbudsforespÃ¸rsel sendes.</span><button class="action primary" onclick="showSupplierForm()">Ny leverandÃ¸r</button></div>';return `<div class="market-card-list">${rows.map(s=>`<section class="market-record supplier-record"><div><strong>${esc(s.name||'LeverandÃ¸r')}</strong><small>${esc(s.trade||'FagomrÃ¥de ikke satt')}</small></div><div class="market-record-meta"><span>${esc(s.email||'Mangler e-post')}</span>${s.status?`<span>${esc(s.status)}</span>`:''}</div><div class="row-actions">${hasRfq?`<button class="action" onclick="showRfqForm()">Lag RFQ</button>`:''}<button class="action red" onclick="deleteRow('suppliers','${esc(s.id)}')">Slett</button></div></section>`).join('')}</div>`}
function rfqCards(rows){if(!rows.length)return '<div class="empty-state"><strong>Ingen forespÃ¸rsler.</strong><span>Lag en tilbudsforespÃ¸rsel nÃ¥r en arbeidsordre skal prises.</span><button class="action primary" onclick="showRfqForm()">Ny forespÃ¸rsel</button></div>';return `<div class="market-card-list">${rows.map(q=>{const status=q.status||'Utkast';return `<section class="market-record rfq-record"><div class="market-record-head"><div><strong>${esc(q.title||'Uten tittel')}</strong><small>${esc(q.description||'Ingen beskrivelse')}</small></div><span class="soft-pill ${/sendt|aktiv|publisert/i.test(status)?'ok':'warn'}">${esc(status)}</span></div><div class="market-record-meta"><span>Frist: ${esc(q.deadline||'Ikke satt')}</span>${q.work_order_id?'<span>Knyttet til arbeidsordre</span>':''}</div><div class="row-actions"><button class="action" onclick="markRfqSent('${esc(q.id)}')">Marker sendt</button><button class="action" onclick="showOfferForm()">Registrer tilbud</button><button class="action red" onclick="deleteRow('quote_requests','${esc(q.id)}')">Slett</button></div></section>`}).join('')}</div>`}
function offerCards(rows){if(!rows.length)return '<div class="empty-state"><strong>Ingen tilbud mottatt.</strong><span>Last opp PDF og pris fra leverandÃ¸r nÃ¥r tilbud kommer inn.</span><button class="action primary" onclick="showOfferForm()">Last opp tilbud</button></div>';const sorted=[...rows].sort((a,b)=>Number(a.price||0)-Number(b.price||0));return `<div class="market-card-list">${sorted.map((o,i)=>{const supplier=supplierName(o.supplier_id)||o.suppliers?.name||'LeverandÃ¸r';return `<section class="market-record offer-record ${i===0?'best':''}"><div class="market-record-head"><div><strong>${esc(supplier)}</strong><small>${esc(o.reservations||'Ingen forbehold registrert')}</small></div><span class="soft-pill ${i===0?'ok':'info'}">${i===0?'Laveste pris':esc(o.status||'Mottatt')}</span></div><div class="offer-price">${money(o.price)}</div><div class="row-actions"><button class="action primary" onclick="markOfferSelected('${esc(o.id)}')">Velg</button><button class="action" onclick="showSignatureRequestForm('Tilbudsgodkjenning','offer','${esc(o.id)}','Tilbud - ${esc(supplier)}')">Send til signering</button><button class="action red" onclick="deleteRow('offers','${esc(o.id)}')">Slett</button></div></section>`}).join('')}</div>`}
function showSupplierForm(){showDrawer('Ny leverandÃ¸r',`<div class="form-grid two"><label>Org.nr<div class="lookup-row"><input id="supOrgNo" placeholder="9 siffer"><button class="action" onclick="lookupBrregSupplier()">Hent</button></div></label><label>Firma<input id="supName"></label><label>E-post<input id="supEmail" type="email"></label><label>FagomrÃ¥de<select id="supTrade">${supplierTradeOptions()}</select></label><label>Adresse<input id="supAddress"></label></div><div id="supLookupOut" class="output">Skriv org.nr og hent firmainfo automatisk.</div><button class="action primary" onclick="saveSupplier()">Lagre leverandÃ¸r</button>`)}
function showRfqForm(workOrderId=''){if(typeof subscriptionHas==='function'&&!subscriptionHas('rfq')){showDrawer('TilbudsforespÃ¸rsel er Premium-funksjon','<div class="empty-state"><strong>Oppgrader til Premium for RFQ.</strong><span>Pro-pakken har leverandÃ¸rregister. Premium Ã¥pner tilbudsinnhenting, PDF-opplasting og vurdering.</span></div>');return}const suppliers=DP.suppliers||[];showDrawer('TilbudsforespÃ¸rsel',`<input id="rfqWo" type="hidden" value="${esc(workOrderId)}"><div class="form-grid two"><label>Tittel<input id="rfqTitle" placeholder="F.eks. Tak/VVS - tilbudsforespÃ¸rsel"></label><label>Frist<input id="rfqDeadline" type="date"></label><label>Beskrivelse<textarea id="rfqDesc" placeholder="Beskriv arbeid, befaring, krav og Ã¸nsket dokumentasjon."></textarea></label><label>LeverandÃ¸rer<div class="choice-list">${suppliers.length?suppliers.map(s=>`<label class="check-row"><input type="checkbox" class="rfqSupplier" value="${esc(s.id)}"> ${esc(s.name)} Â· ${esc(s.email||'mangler e-post')}</label>`).join(''):'<span class="muted">Ingen leverandÃ¸rer registrert ennÃ¥.</span>'}</div></label></div><div class="flow-note">Valgte leverandÃ¸rer vises som grunnlag for utsending. Selve e-posten sendes fra e-postflyten.</div><button class="action primary" onclick="saveRfq()">Lagre tilbudsforespÃ¸rsel</button>`)}
function showOfferForm(){if(typeof subscriptionHas==='function'&&!subscriptionHas('rfq')){showDrawer('Tilbudsopplasting er Premium-funksjon','<div class="empty-state"><strong>Oppgrader til Premium for tilbud.</strong><span>Premium Ã¥pner tilbudsopplasting, PDF, forbehold, vurdering og tildeling.</span></div>');return}const suppliers=DP.suppliers||[],rfqs=DP.cache.quote_requests||[];showDrawer('Last opp tilbud',`<div class="form-grid two"><label>LeverandÃ¸r<select id="offerSupplier">${suppliers.map(s=>`<option value="${s.id}">${esc(s.name)} - ${esc(s.email||'mangler e-post')}</option>`).join('')}</select></label><label>Gjelder forespÃ¸rsel<select id="offerRfq"><option value="">Ikke knyttet</option>${rfqs.map(r=>`<option value="${esc(r.id)}">${esc(r.title||'RFQ')}</option>`).join('')}</select></label><label>Pris<input id="offerPrice" type="number"></label><label>Forbehold<textarea id="offerTerms" placeholder="Forbehold, leveringstid, garantier eller avklaringer"></textarea></label><label>PDF/vedlegg<input id="offerFile" type="file"></label></div><button class="action primary" onclick="saveOffer()">Lagre tilbud</button><div id="offerOut" class="output"></div>`)}
async function markRfqSent(id){try{if(typeof subscriptionHas==='function'&&!subscriptionHas('rfq'))throw new Error('RFQ krever Premium.');requireLive('oppdatere tilbudsforespÃ¸rsel');const r=await db().from('quote_requests').update({status:'Sendt'}).eq('id',id).select().single();if(r.error)throw r.error;await insertActivity('TilbudsforespÃ¸rsel markert sendt','quote_request',id);await finishAction('TilbudsforespÃ¸rselen er markert som sendt.','market')}catch(e){showDrawer('Kunne ikke oppdatere forespÃ¸rsel',`<div class="output">${esc(customerError(e))}</div>`)}}
async function markOfferSelected(id){try{if(typeof subscriptionHas==='function'&&!subscriptionHas('rfq'))throw new Error('Tilbudsvurdering krever Premium.');requireLive('velge tilbud');const r=await db().from('offers').update({status:'Valgt'}).eq('id',id).select().single();if(r.error)throw r.error;await insertActivity('Tilbud valgt','offer',id);await finishAction('Tilbudet er markert som valgt.','market')}catch(e){showDrawer('Kunne ikke velge tilbud',`<div class="output">${esc(customerError(e))}</div>`)}}

function AdminPage(){return `<div class="grid admin-page"><div class="card s12">${LaunchControlPage()}</div><div class="card s12 module-hero"><div><small>Kundeoppsett</small><h2>Ny kunde</h2><p>Opprett kunde, eiendom, styre, beboere, leverandÃ¸rer, FDV-mapper, Ã¸konomi og brukere i Ã©n kontrollert flyt.</p></div><div class="module-actions"><button class="action primary" onclick="showNewCustomerWizard()">Start onboarding</button></div></div><div class="card s6"><h3>Driftskontroll</h3><p class="muted">Sjekker at appen kjÃ¸rer pÃ¥ ren produksjonspakke og at valgt eiendom er klar.</p><button class="action primary" onclick="runCleanCheck()">KjÃ¸r kontroll</button><div id="adminOut" class="output"></div></div><div class="card s6"><h3>Rolle- og tilgangstest</h3>${roleAccessPanel()}</div><div class="card s12"><h3>Aktivitet</h3>${activityCards()}</div></div>`}
function activityCards(){const rows=(DP.cache.activity||[]).slice(0,12);if(!rows.length)return '<div class="empty-state"><strong>Ingen aktivitet registrert.</strong><span>NÃ¥r brukere oppretter, endrer eller sender noe, vises historikken her.</span></div>';return `<div class="stack-list">${rows.map(a=>`<section class="mini-record"><div><strong>${esc(a.action||'Hendelse')}</strong><small>${esc([a.entity_type,a.created_at].filter(Boolean).join(' Â· '))}</small></div></section>`).join('')}</div>`}
function launchStatus(label,ok,warnText='',okText='Klar'){
  const type=ok===true?'ok':ok==='warn'?'warn':'bad';
  const text=ok===true?okText:ok==='warn'?warnText:'MÃ¥ fikses';
  return `<tr><td>${esc(label)}</td><td><span class="badge ${type}">${esc(text)}</span></td><td>${esc(launchAdvice(label,ok))}</td></tr>`;
}
function launchAdvice(label,ok){
  if(ok===true)return 'Klar.';
  const map={
    'Innlogging':'Test live innlogging med en ekte bruker.',
    'Live eiendom':'Velg en ekte eiendom fÃ¸r pilot.',
    'Rolle/tilgang':'Test egne brukere for styreleder, styremedlem, beboer, vaktmester og leverandÃ¸r.',
    'Avvik':'Opprett minst ett live avvik.',
    'Arbeidsordre':'Lag arbeidsordre fra avvik.',
    'Tilbud/RFQ':'Opprett tilbudsforespÃ¸rsel og registrer minst ett tilbud.',
    'Dokumentarkiv':'Last opp eller generer minst ett dokument pÃ¥ eiendommen.',
    'Ã˜konomi':'Legg inn konto/reservefond og minst Ã©n budsjettlinje.',
    'Styre/beboere':'Legg inn styremedlem og beboer/kontaktperson.',
    'LeverandÃ¸rer':'Legg inn leverandÃ¸r med e-post.',
    'Aktivitetslogg':'UtfÃ¸r en lagring slik at hendelse logges.',
    'Kommersiell pakke':'Sjekk at kommersiell side er publisert og tilgjengelig.',
    'E-post':'Send demo/bestilling eller system-e-post fra live-siden.'
  };
  return map[label]||'Kontroller punktet fÃ¸r salg.';
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
    launchStatus('Tilbud/RFQ',rfqs.length>0&&offers.length>0,rfqs.length>0?'ForespÃ¸rsel klar, mangler tilbud':'Mangler forespÃ¸rsel/tilbud'),
    launchStatus('Dokumentarkiv',docs.length>0),
    launchStatus('Ã˜konomi',finance.length>0&&budget.length>0,finance.length>0?'Konto klar, mangler budsjett':'Mangler Ã¸konomi'),
    launchStatus('Styre/beboere',board&&resident,board||resident?'Mangler styre eller beboer':'Mangler kontakter'),
    launchStatus('LeverandÃ¸rer',(DP.suppliers||[]).some(s=>String(s.email||'').includes('@'))),
    launchStatus('Aktivitetslogg',activity.length>0),
    launchStatus('Kommersiell pakke',true),
    launchStatus('E-post','warn','MÃ¥ testes live')
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
  const verdict=s.ready?'Klar for pilot':s.bad?'Ikke salgsklar ennÃ¥':'Nesten klar';
  const type=s.ready?'ok':s.bad?'bad':'warn';
  return `<div class="dash-title"><div><h3>Lanseringskontroll</h3><p class="muted">Viser om valgt eiendom og produksjonsoppsett er klart for kundepilot og salg.</p></div><div><span class="badge ${type}">${esc(verdict)}</span></div></div><div class="ops-budget-summary"><div><small>BestÃ¥tt</small><b>${s.total-s.bad-s.warn}/${s.total}</b></div><div><small>MÃ¥ fikses</small><b>${s.bad}</b></div><div><small>MÃ¥ testes</small><b>${s.warn}</b></div></div><div><button class="action primary" onclick="runLaunchControl()">KjÃ¸r lanseringskontroll</button><button class="action" onclick="hydrateAll().then(render)">Hent live data</button><button class="action" onclick="location.href='kommersielt.html'">Ã…pne kommersiell pakke</button></div><div id="launchOut" class="output">${esc(DP.cache.launch_control_result||'Velg live eiendom og kjÃ¸r kontroll fÃ¸r pilot.')}</div><h4>Statuspunkter</h4>${table(['OmrÃ¥de','Status','Neste handling'],launchRows())}`;
}
async function runLaunchControl(){
  const out=document.getElementById('launchOut');
  try{
    if(out)out.textContent='Henter live data og kontrollerer lanseringsstatus...';
    if(!DP.session||!DP.user)throw new Error('Logg inn fÃ¸r lanseringskontroll.');
    if(!isUuid(currentProperty()?.id))throw new Error('Velg en ekte eiendom fÃ¸r du kjÃ¸rer kontrollen.');
    await hydrateAll();
    const s=launchSummary();
    const lines=[
      `Eiendom: ${currentProperty()?.name||'-'}`,
      `Rolle: ${appRole()||'-'}`,
      `BestÃ¥tt: ${s.total-s.bad-s.warn}/${s.total}`,
      `MÃ¥ fikses: ${s.bad}`,
      `MÃ¥ testes manuelt: ${s.warn}`,
      s.bad?'Status: Ikke salgsklar ennÃ¥. Fiks rÃ¸de punkter fÃ¸rst.':s.warn?'Status: Nesten klar. Test gule punkter live.':'Status: Klar for pilot.'
    ];
    DP.cache.launch_control_result=lines.join('\n');
    if(out)out.textContent=DP.cache.launch_control_result;
    await insertActivity('Lanseringskontroll kjÃ¸rt','launch_control',currentProperty().id);
    render();
  }catch(e){setOutputError(out,e,'Lanseringskontroll kunne ikke kjÃ¸res.')}
}
function roleAccessPanel(){
  const role=appRole(),menus=visibleMenus().map(m=>m[1]).join(', ')||'Ingen';
  const props=(DP.properties||[]).map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.customer||'-')}</td><td>${esc(p.access_role||role||'-')}</td></tr>`);
  const expected=[
    ['superadmin','Alle menyer','Alle eiendommer'],
    ['admin','Alle menyer unntatt superadmin-endring','Alle eiendommer'],
    ['forvalter','Driftsmenyer','Kun tildelte eiendommer'],
    ['styreleder','Dashboard, eiendom, styre/beboere, avvik/arbeid, FDV, Ã¸konomi, marked','Kun egne eiendommer'],
    ['styremedlem','Dashboard, styre/beboere, avvik/arbeid, FDV, Ã¸konomi','Kun egne eiendommer'],
    ['vaktmester','Dashboard, avvik/arbeid, FDV','Kun tildelte eiendommer'],
    ['beboer','Avvik/arbeid','Kun egen eiendom'],
    ['leverandÃ¸r','Marked/tilbud','Kun egne oppdrag/tilbud']
  ].map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`);
  return `<div class="split"><div><h4>Aktiv bruker</h4><table><tr><td>Rolle</td><td>${esc(role||'-')}</td></tr><tr><td>Synlige menyer</td><td>${esc(menus)}</td></tr><tr><td>Eiendommer</td><td>${DP.properties.length}</td></tr></table></div><div><h4>Eiendomstilgang</h4>${table(['Eiendom','Kunde','Tilgang'],props,'Ingen eiendomstilgang funnet.')}</div></div><h4>Forventet meny per rolle</h4>${table(['Rolle','Menyer','Eiendomstilgang'],expected)}`;
}
function runCleanCheck(){const lines=[];lines.push(DP.session?'Klar: Innlogging':'Mangler: Innlogging');lines.push(isUuid(currentProperty()?.id)?'Klar: Ekte eiendom':'Mangler: Ekte eiendom');lines.push(`Rolle: ${appRole()||'-'}`);lines.push(`Synlige menyer: ${visibleMenus().map(m=>m[1]).join(', ')||'Ingen'}`);lines.push(`Eiendomstilgang: ${DP.properties.length}`);lines.push(`Aktive appdeler: ${document.querySelectorAll('script[src*="assets/prod/"]').length}`);lines.push(document.querySelectorAll('script[src*="assets/modules/"]').length?'MÃ¥ ryddes: gammel modul lastes':'Klar: kun produksjonsapp lastes');document.getElementById('adminOut').textContent=lines.join('\n')}

function launchChecks(){
  const contacts=DP.cache.contacts||[],devs=DP.cache.deviations||[],wos=DP.cache.work_orders||[],docs=DP.cache.documents||[],rfqs=DP.cache.quote_requests||[],offers=DP.cache.offers||[],finance=DP.cache.finance||[],budget=DP.cache.budget_lines||[],activity=DP.cache.activity||[];
  const board=contacts.some(c=>/styre|leder|vara/i.test(c.role||'')),resident=contacts.some(c=>/bebo|enhet|leilighet/i.test(c.role||'')),liveProperty=isUuid(currentProperty()?.id);
  const hasWorkOrders=typeof subscriptionHas==='function'?subscriptionHas('work_orders'):true;
  const hasFinance=typeof subscriptionHas==='function'?subscriptionHas('finance'):true;
  const hasRfq=typeof subscriptionHas==='function'?subscriptionHas('rfq'):true;
  const emailTested=activity.some(a=>/e-?post|mail/i.test(`${a.action||''} ${a.entity_type||''}`))||DP.cache.email_tested_ok;
  const checks=[
    {label:'Innlogging',ok:!!DP.session&&!!DP.user,group:'Sikkerhet',action:'Test live innlogging med ekte bruker.'},
    {label:'Live eiendom',ok:liveProperty,group:'Kunde',action:'Velg eller opprett en live-eiendom.'},
    {label:'Rolle/tilgang',ok:!!DP.user?.role&&DP.properties.length>0,group:'Sikkerhet',action:'Test superadmin, styreleder, beboer, vaktmester og leverandÃ¸r.'},
    {label:'Avvik',ok:devs.length>0,group:'Drift',action:'Opprett minst ett live avvik.'},
    {label:'Dokumentarkiv',ok:docs.length>0,group:'Dokument',action:'Last opp eller generer et dokument pÃ¥ eiendommen.'},
    {label:'Styre/beboere',ok:board&&resident,warn:board||resident,group:'Kunde',action:'Legg inn bÃ¥de styremedlem og beboer.'},
    {label:'LeverandÃ¸rer',ok:(DP.suppliers||[]).some(s=>String(s.email||'').includes('@')),group:'InnkjÃ¸p',action:'Legg inn leverandÃ¸r med e-post.'},
    {label:'Aktivitetslogg',ok:activity.length>0,group:'Audit',action:'UtfÃ¸r en lagring slik at hendelse logges.'},
    {label:'Kommersiell pakke',ok:true,group:'Salg',action:'Klar.'},
    {label:'E-post',ok:!!emailTested,warn:!emailTested,group:'Kommunikasjon',action:'Send en test fra live-siden fÃ¸r kundepilot.'}
  ];
  if(hasWorkOrders)checks.splice(4,0,{label:'Arbeidsordre',ok:wos.length>0,group:'Drift',action:'Lag arbeidsordre fra et avvik.'});
  if(hasFinance)checks.splice(checks.findIndex(c=>c.label==='Styre/beboere'),0,{label:'Ã˜konomi',ok:finance.length>0&&budget.length>0,warn:finance.length>0,group:'Ã˜konomi',action:finance.length>0?'Legg inn minst Ã©n budsjettlinje.':'Legg inn konto/reservefond og budsjett.'});
  if(hasRfq)checks.splice(checks.findIndex(c=>c.label==='Ã˜konomi'||c.label==='Styre/beboere'),0,{label:'Tilbud/RFQ',ok:rfqs.length>0&&offers.length>0,warn:rfqs.length>0,group:'InnkjÃ¸p',action:rfqs.length>0?'Registrer minst ett tilbud/PDF.':'Lag tilbudsforespÃ¸rsel og registrer tilbud.'});
    const completeFlow=devs.length>0&&wos.length>0&&docs.length>0;
  checks.push({label:'Salgsdemo-flyt',ok:completeFlow,warn:devs.length>0&&wos.length>0,group:'Salg',action:'Vis Ã©n komplett flyt: avvik â†’ arbeidsordre â†’ dokumentasjon â†’ rapport.'});
  if(hasFinance||hasWorkOrders)checks.push({label:'Pro-demo',ok:wos.length>0&&finance.length>0&&budget.length>0,group:'Salg',action:'Pro-demo bÃ¸r vise arbeidsordre, Ã¸konomi, vedlikeholdsplan og rapport.'});
  if(hasRfq)checks.push({label:'Premium-demo',ok:rfqs.length>0&&offers.length>0,group:'Salg',action:'Premium-demo bÃ¸r vise Property Brain, RFQ/tilbud og AI-vurdering.'});

  return checks;
}
function checkType(c){return c.ok?'ok':c.warn?'warn':'bad'}
function launchRows(){return launchChecks().map(c=>launchStatus(c.label,c.ok?true:c.warn?'warn':false,c.warn?'MÃ¥ testes':'MÃ¥ fikses'))}
function launchSummary(){const rows=launchChecks(),bad=rows.filter(c=>!c.ok&&!c.warn).length,warn=rows.filter(c=>!c.ok&&c.warn).length,total=rows.length;return {bad,warn,total,ready:bad===0&&warn===0}}
function LaunchControlPage(){
  const s=launchSummary(),rows=launchChecks(),ready=s.total-s.bad-s.warn;
  const verdict=s.ready?'Klar for pilot':s.bad?'MÃ¥ ryddes fÃ¸r pilot':'Nesten klar';
  const type=s.ready?'ok':s.bad?'bad':'warn';
  const customerButton=(typeof canManageCustomers==='function'&&canManageCustomers())?`<button class="action" onclick="showNewCustomerWizard()">Ny kunde</button>`:'';
  return `<div class="launch-control premium-control"><div class="control-head"><div><small>Lanseringskontroll</small><h3>${esc(verdict)}</h3><p>Kontrollerer om valgt eiendom har nok live-data, roller og driftsgrunnlag til pilot og salg.</p></div><span class="launch-ring ${type}"><b>${ready}/${s.total}</b><small>klart</small></span></div><div class="launch-summary-grid"><div><small>Klar</small><b>${ready}</b></div><div><small>MÃ¥ fikses</small><b>${s.bad}</b></div><div><small>MÃ¥ testes</small><b>${s.warn}</b></div></div><div class="module-actions"><button class="action primary" onclick="runLaunchControl()">KjÃ¸r kontroll</button><button class="action" onclick="hydrateAll().then(render)">Hent live data</button>${customerButton}<button class="action" onclick="location.href='kommersielt.html'">Kommersiell pakke</button></div><div id="launchOut" class="output">${esc(DP.cache.launch_control_result||'KjÃ¸r kontroll fÃ¸r pilot eller kundedemo.')}</div><div class="launch-check-grid">${rows.map(launchCheckCard).join('')}</div></div>`;
}
function launchCheckCard(c){
  const type=checkType(c),text=c.ok?'Klar':c.warn?'MÃ¥ testes':'MÃ¥ fikses';
  const emailButton=c.label==='E-post'&&!c.ok?`<button class="action" onclick="markEmailTestedOk()">Merk testet</button>`:'';
  return `<section class="launch-check ${type}"><div><small>${esc(c.group)}</small><strong>${esc(c.label)}</strong></div><span>${esc(text)}</span><p>${esc(c.ok?'Klar.':c.action)}</p>${emailButton}</section>`;
}
async function markEmailTestedOk(){
  try{
    DP.cache.email_tested_ok=true;
    if(DP.session&&currentProperty())await insertActivity('E-post testet OK','email',currentProperty().id);
    showNotice('E-post er markert som testet og klar.','ok');
    await hydrateAll();
    render();
  }catch(e){
    DP.cache.email_tested_ok=true;
    showNotice('E-post er markert som testet.','ok');
    render();
  }
}
async function runLaunchControl(){
  const out=document.getElementById('launchOut');
  try{
    if(out)out.textContent='Henter live data og kjÃ¸rer kontroll...';
    if(!DP.session||!DP.user)throw new Error('Logg inn fÃ¸r lanseringskontroll.');
    if(!isUuid(currentProperty()?.id))throw new Error('Velg en ekte eiendom fÃ¸r du kjÃ¸rer kontrollen.');
    await hydrateAll();
    const s=launchSummary(),status=s.ready?'Klar for pilot':s.bad?'MÃ¥ ryddes fÃ¸r pilot':'Nesten klar';
    DP.cache.launch_control_result=`${currentProperty()?.name||'Eiendom'}: ${status}. Klar ${s.total-s.bad-s.warn}/${s.total}. MÃ¥ fikses ${s.bad}. MÃ¥ testes ${s.warn}.`;
    if(out)out.textContent=DP.cache.launch_control_result;
    await insertActivity('Lanseringskontroll kjÃ¸rt','launch_control',currentProperty().id);
    render();
  }catch(e){setOutputError(out,e,'Lanseringskontroll kunne ikke kjÃ¸res.')}
}
function AdminPage(){
  if(typeof canManageCustomers==='function'&&!canManageCustomers())return `<div class="grid admin-page"><div class="card s12"><div class="empty-state"><strong>Ingen tilgang til kundeoppsett.</strong><span>Ny kunde og onboarding kan bare utfÃ¸res av superadmin.</span></div></div></div>`;
  const s=launchSummary();
  const internalLoginButton=(typeof canManageSuperadmin==='function'&&canManageSuperadmin())?`<button class="action" onclick="showInternalLoginForm()">Intern innlogging</button>`:'';
  const demoButton=(typeof canManageSuperadmin==='function'&&canManageSuperadmin())?`<button class="action" onclick="showDemoUserWizard()">Demo-bruker</button>`:`<button class="action" onclick="showDemoUserWizard()">Enkel demo-bruker</button>`;
  return `<div class="grid admin-page premium-admin-page"><div class="card s12 module-hero control-hero"><div><small>Kontrollsenter</small><h2>Produksjonskontroll og onboarding</h2><p>Her ser du om valgt eiendom er klar for pilot, om roller/tilgang stemmer, og hva som bÃ¸r fullfÃ¸res fÃ¸r kunde tas i bruk.</p></div><div class="module-actions"><button class="action primary" onclick="runLaunchControl()">KjÃ¸r kontroll</button><button class="action" onclick="showNewCustomerWizard()">Ny kunde</button>${internalLoginButton}${demoButton}<button class="action" onclick="openModule('intranet')">Internhåndbok</button><button class="action" onclick="hydrateAll().then(render)">Oppdater</button></div></div><div class="card s12">${SuperadminOpsPage()}</div><div class="card s12">${DemoUserPanel()}</div><div class="card s12">${LaunchControlPage()}</div><div class="card s6 control-panel"><div class="dash-title"><div><h3>Onboarding</h3><p class="muted">Kunde, eiendom, styre/beboere, leverandÃ¸rer, FDV, Ã¸konomi og brukere.</p></div><button class="action primary" onclick="showNewCustomerWizard()">Start</button></div><div class="control-mini-grid"><div><small>Eiendommer</small><b>${DP.properties.length}</b></div><div><small>Klar status</small><b>${s.total-s.bad-s.warn}/${s.total}</b></div><div><small>Rolle</small><b>${esc(appRole()||'-')}</b></div></div></div><div class="card s6 control-panel"><div class="dash-title"><div><h3>Rolle og tilgang</h3><p class="muted">Bekreft at brukeren bare ser riktige menyer og eiendommer.</p></div></div>${roleAccessPanel()}</div><div class="card s12 control-panel"><div class="dash-title"><div><h3>Siste aktivitet</h3><p class="muted">Sporing av endringer og hendelser pÃ¥ valgt eiendom.</p></div><button class="action" onclick="hydrateAll().then(render)">Oppdater</button></div>${activityCards()}</div></div>`;
}
function DemoUserPanel(){
  if(typeof canManageCustomers==='function'&&!canManageCustomers())return '';
  return `<div class="demo-user-panel"><div class="dash-title"><div><h3>Demo-brukere</h3><p class="muted">Lag testbrukere for Start, Pro og Premium uten Ã¥ gi tilgang til ekte kundedata.</p></div><button class="action primary" onclick="showDemoUserWizard()">Ny demo-bruker</button></div><div class="demo-package-strip"><section><b>Start-demo</b><span>FDV, avvik og styre.</span></section><section><b>Pro-demo</b><span>Ã…rshjul, arbeidsordre, Ã¸konomi og rapport.</span></section><section><b>Premium-demo</b><span>Property Brain, RFQ/tilbud og AI-vurdering.</span></section></div><div id="demoUserOut" class="output">Demo-brukeren fÃ¥r bare tilgang til demo-eiendommen som opprettes her.</div></div>`;
}
function showDemoUserWizard(){
  if(typeof canManageCustomers==='function'&&!canManageCustomers()){showDrawer('Ingen tilgang','<div class="output">Bare intern admin kan lage demo-brukere.</div>');return}
  const stamp=Date.now().toString().slice(-6);
  const roleOptions=(typeof canManageSuperadmin==='function'&&canManageSuperadmin())?'<option value="styreleder" selected>Styreleder</option><option value="styremedlem">Styremedlem</option><option value="forvalter">Forvalter</option><option value="beboer">Beboer</option><option value="vaktmester">Vaktmester</option><option value="leverandor">Leverandør</option>':'<option value="styreleder" selected>Styreleder</option><option value="styremedlem">Styremedlem</option><option value="beboer">Beboer</option><option value="vaktmester">Vaktmester</option><option value="leverandor">Leverandør</option>';
  showDrawer('Ny demo-bruker',`<div class="form-grid two"><label>Pakke<select id="demoPlan"><option value="start">Start - grunnpakke</option><option value="pro" selected>Pro - operativ drift</option><option value="premium">Premium - AI og tilbud</option></select></label><label>Rolle<select id="demoRole">${roleOptions}</select></label><label>Navn<input id="demoName" value="Demo Styreleder ${stamp}"></label><label>E-post<input id="demoEmail" placeholder="demo@kundedomene.no"></label><label>Telefon<input id="demoPhone" value=""></label><label>Midlertidig passord<input id="demoPassword" value="Demo${stamp}!"></label><label class="span-2">Demo-eiendom<input id="demoPropertyName" value="Demo Borettslag ${stamp}"></label><label class="span-2 check-row"><input id="demoSeedData" type="checkbox" checked> Legg inn enkle eksempeldata for valgt pakke</label></div><div class="validation-box"><strong>Viktig</strong><span>Bruk en e-postadresse du kan motta innloggingsmail på. Testbrukeren får bare tilgang til demo-eiendommen.</span></div><button class="action primary" onclick="createDemoUser()">Opprett demo-bruker</button><div id="createDemoOut" class="output">Klar.</div>`);
}
function showInternalLoginForm(){
  if(!(typeof canManageSuperadmin==='function'&&canManageSuperadmin())){showDrawer('Ingen tilgang','<div class="output">Bare superadmin kan opprette intern innlogging uten eiendom.</div>');return}
  showDrawer('Intern innlogging',`<div class="validation-box"><strong>Kun intern bruker</strong><span>Bruk denne for salgsjef, admin eller forvalter uten Ã¥ knytte brukeren til en kunde/eiendom. Finnes brukeren fra fÃ¸r, oppdateres rollen og passordet.</span></div><div class="form-grid two"><label>Navn<input id="internalName" placeholder="Salgsjef"></label><label>E-post<input id="internalEmail" type="email" placeholder="salgsjef@driftspartnernord.no"></label><label>Telefon<input id="internalPhone" placeholder="Valgfritt"></label><label>Rolle<select id="internalRole"><option value="selger" selected>Selger</option><option value="admin">Admin / salgsjef</option><option value="forvalter">Forvalter</option><option value="superadmin">Superadmin</option></select></label><label>Midlertidig passord<input id="internalPassword" type="password" placeholder="La stÃ¥ tomt for automatisk passord"></label></div><div class="module-actions"><button class="action primary" onclick="createInternalLogin()">Opprett/oppdater og send e-post</button><button class="action" onclick="testCreateUserFunction()">Test bruker-tjeneste</button></div><div id="internalLoginOut" class="output">Klar.</div>`);
}
async function testCreateUserFunction(){
  const out=document.getElementById('internalLoginOut');
  try{
    if(out)out.textContent='Tester bruker-tjeneste...';
    const res=await fetch('/.netlify/functions/create-user',{method:'GET'});
    const text=await res.text();
    if(res.status===405&&/json|application\/json/i.test(res.headers.get('content-type')||'')){if(out)out.textContent='Bruker-tjenesten er publisert og svarer. PrÃ¸v Ã¥ opprette intern innlogging igjen.';return}
    if(out)out.textContent=`Bruker-tjenesten svarte ikke som forventet. Status ${res.status}. ${text.replace(/\s+/g,' ').slice(0,180)}`;
  }catch(e){if(out)out.textContent=`Bruker-tjenesten kunne ikke nÃ¥s: ${String(e.message||e)}`}
}
async function createInternalLogin(){
  const out=document.getElementById('internalLoginOut');
  try{
    if(!(typeof canManageSuperadmin==='function'&&canManageSuperadmin()))throw new Error('Bare superadmin kan opprette intern innlogging.');
    const token=DP.session?.access_token;if(!token)throw new Error('Mangler innloggingstoken.');
    const name=internalName.value.trim(),email=internalEmail.value.trim(),role=internalRole.value,phone=internalPhone.value.trim(),password=internalPassword.value;
    if(!name||!email.includes('@'))throw new Error('Fyll inn navn og gyldig e-post.');
    if(out)out.textContent='Oppretter eller oppdaterer intern innlogging og sender e-post...';
    const res=await fetch('/.netlify/functions/create-user',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({name,email,phone,role,password})});
    const data=await readJsonResponse(res,'Bruker-tjenesten svarte ikke riktig. PrÃ¸v igjen, eller kontakt Driftspartner Nord hvis feilen fortsetter.');
    if(!data.ok)throw new Error(data.message||'Intern innlogging kunne ikke opprettes.');
    await insertActivity(data.email_sent?'Intern innlogging opprettet/oppdatert og e-post sendt':'Intern innlogging opprettet/oppdatert','user',data.user?.id||email);
    await finishAction(data.email_sent?'Intern innlogging er opprettet/oppdatert og e-post er sendt.':'Intern innlogging er opprettet/oppdatert. E-post ble ikke sendt.','admin');
  }catch(e){
    const msg=String(e?.message||e||'');
    if(out){
      if(/app_role|rollelisten|invalid input value for enum|admin/i.test(msg)&&/rolle|role|enum|app_role|admin/i.test(msg)){
        out.textContent='Admin-rollen mangler i Supabase. KjÃ¸r supabase-internal-admin-role-v1.sql i Supabase SQL Editor, publiser siste pakke og prÃ¸v igjen.';
      }else if(/failed to fetch|404|not found|page not found|unexpected token|not valid json|html/i.test(msg)){
        out.textContent='Bruker-tjenesten er ikke riktig publisert pÃ¥ live-siden. Publiser siste pakke pÃ¥ nytt, og sjekk at netlify/functions/create-user.js er med.';
      }else{
        out.textContent=msg||'Intern innlogging kunne ikke opprettes. Sjekk at du er logget inn som superadmin og at Netlify Functions er publisert.';
      }
    }
  }
}
function demoPlanConfig(planId){
  const plans={start:{name:'Start',firstYear:9990,yearTwo:11880},pro:{name:'Pro',firstYear:19990,yearTwo:23880},premium:{name:'Premium',firstYear:39990,yearTwo:47880}};
  return plans[String(planId||'pro').toLowerCase()]||plans.pro;
}
async function createDemoProperty(planId,propertyName){
  const plan=demoPlanConfig(planId);
  const customerRow={name:`Demo ${plan.name} - ${propertyName}`,subscription_plan:planId,subscription_first_year_amount:plan.firstYear,subscription_year_two_amount:plan.yearTwo,subscription_billing_period:'yearly',subscription_status:'active',status:'demo'};
  const customer=await insertWithFallback('customers',customerRow,['name']);
  if(customer.error)throw customer.error;
  const propertyRow={customer_id:customer.data.id,name:propertyName,address:'Demo-veien 1',property_type:'Borettslag',units_count:planId==='start'?12:planId==='pro'?64:180,technical_summary:`Demo-eiendom for ${plan.name}-pakken.`};
  const property=await insertWithFallback('properties',propertyRow,['customer_id','name','address']);
  if(property.error)throw property.error;
  return {customer:customer.data,property:property.data,plan};
}
async function seedDemoData(propertyId,planId){
  try{await safeInsertContacts([{property_id:propertyId,name:'Kari Demo',role:'Styreleder',email:'styreleder@example.no',phone:'90000000',notes:'Demo'},{property_id:propertyId,name:'Ola Demo',role:'Beboer',email:'beboer@example.no',phone:'',notes:'Demo'}])}catch(e){console.warn('Demo kontakter hoppet over',e)}
  try{await safeInsertMany('deviations',[{property_id:propertyId,title:'Tak/VVS - oppfÃ¸lging',description:'Demoavvik for visning av sakslÃ¸p.',category:'Tak',priority:'HÃ¸y',status:'Ny'}])}catch(e){console.warn('Demo avvik hoppet over',e)}
  if(['pro','premium'].includes(planId)){
    try{await safeInsertMany('work_orders',[{property_id:propertyId,title:'Kontroll av fellesareal',description:'Demo arbeidsordre med frist og ansvarlig.',due_date:new Date(Date.now()+7*86400000).toISOString().slice(0,10),status:'Ny'}])}catch(e){console.warn('Demo arbeidsordre hoppet over',e)}
    try{await safeUpsertFinance({property_id:propertyId,bank_balance:450000,reserved_funds:240000,project_funds:150000,updated_at:new Date().toISOString()})}catch(e){console.warn('Demo Ã¸konomi hoppet over',e)}
    try{await safeInsertMany('budget_lines',[{property_id:propertyId,category:'Vedlikehold',budget_amount:120000,actual_amount:95000,notes:'Demo budsjettlinje'}])}catch(e){console.warn('Demo budsjett hoppet over',e)}
    try{await safeInsertMany('annual_wheel_items',[{property_id:propertyId,month:4,title:'VÃ¥rbefaring',category:'Vedlikehold',responsible_role:'Styreleder',status:'Planlagt'}])}catch(e){console.warn('Demo Ã¥rshjul hoppet over',e)}
  }
  if(planId==='premium'){
    try{await safeInsertMany('suppliers',[{name:'Demo Tak AS',email:'tilbud@example.no',trade:'Tak',status:'active'}])}catch(e){console.warn('Demo leverandÃ¸r hoppet over',e)}
    try{await safeInsertMany('quote_requests',[{property_id:propertyId,title:'Tilbud pÃ¥ tak/VVS',description:'Demo RFQ for Premium-visning.',deadline:new Date(Date.now()+14*86400000).toISOString().slice(0,10),status:'Utkast'}])}catch(e){console.warn('Demo RFQ hoppet over',e)}
    try{await safeInsertMany('offers',[{property_id:propertyId,price:146000,reservations:'Demo tilbud uten forbehold.',status:'Mottatt'}])}catch(e){console.warn('Demo tilbud hoppet over',e)}
  }
}
async function createDemoUser(){
  const out=document.getElementById('createDemoOut');
  try{
    if(typeof canManageCustomers==='function'&&!canManageCustomers())throw new Error('Bare intern admin kan lage demo-brukere.');
    requireLive('lage demo-bruker');
    const token=DP.session?.access_token;if(!token)throw new Error('Mangler innlogging.');
    const planId=document.getElementById('demoPlan')?.value||'pro';
    const role=document.getElementById('demoRole')?.value||'styreleder';
    const name=document.getElementById('demoName')?.value?.trim()||'';
    const email=document.getElementById('demoEmail')?.value?.trim()||'';
    const phone=document.getElementById('demoPhone')?.value?.trim()||'';
    const password=document.getElementById('demoPassword')?.value||'';
    const propertyName=document.getElementById('demoPropertyName')?.value?.trim()||`Demo ${demoPlanConfig(planId).name}`;
    if(!name||!email.includes('@'))throw new Error('Fyll inn navn og gyldig e-post for testbrukeren.');
    if(out)out.textContent='Oppretter demo-eiendom...';
    const created=await createDemoProperty(planId,propertyName);
    if(document.getElementById('demoSeedData')?.checked){if(out)out.textContent='Legger inn eksempeldata...';await seedDemoData(created.property.id,planId)}
    const access={beboer:'resident',styreleder:'owner',styremedlem:'member',forvalter:'owner',vaktmester:'caretaker',leverandor:'vendor'}[role]||'member';
    if(out)out.textContent='Oppretter testbruker og sender e-post...';
    const res=await fetch('/.netlify/functions/create-user',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({name,email,phone,role,property_id:created.property.id,access_role:access,password})});
    const data=await readJsonResponse(res,'Bruker-tjenesten svarte ikke riktig. PrÃ¸v igjen fra publisert side.');
    if(!data.ok)throw new Error(data.message||'Demo-bruker kunne ikke opprettes.');
    await loadProperties();DP.propertyId=created.property.id;
    await insertActivity(`Demo-bruker opprettet: ${created.plan.name}`,'demo_user',created.property.id);
    await hydrateAll();
    showDrawer('Demo-bruker opprettet',`<div class="empty-state"><strong>${esc(name)} er klar for ${esc(created.plan.name)}-demo.</strong><span>Testbrukeren har bare tilgang til ${esc(propertyName)}. Innloggingsmail er sendt hvis e-post er konfigurert.</span></div><table><tr><td>Pakke</td><td>${esc(created.plan.name)}</td></tr><tr><td>E-post</td><td>${esc(email)}</td></tr><tr><td>Midlertidig passord</td><td>${esc(password||data.temporaryPassword||'Sendt pÃ¥ e-post')}</td></tr><tr><td>Demo-eiendom</td><td>${esc(propertyName)}</td></tr></table><button class="action primary" onclick="hideDrawer();render()">Ã…pne demo-eiendom</button>`);
  }catch(e){setOutputError(out,e,'Demo-brukeren kunne ikke opprettes. Sjekk e-post, tilgang og databaseoppsett.')}
}

function opsWithinDays(row,days=30){
  const t=Date.parse(row?.created_at||row?.updated_at||'');
  return Number.isFinite(t)&&t>=Date.now()-days*86400000;
}
function opsCustomerList(){
  const map=new Map();
  (DP.properties||[]).forEach(p=>{
    const key=p.customer_id||p.customer||p.customer_org_number||p.id;
    if(!map.has(key))map.set(key,{id:key,name:p.customer||p.name||'Kunde',plan:p.subscription_plan||'',properties:0});
    const row=map.get(key);
    row.properties+=1;
    if(p.subscription_plan)row.plan=p.subscription_plan;
  });
  return [...map.values()];
}
function opsMetric(label,value,detail,type='info'){
  return `<section class="ops-metric ${type}"><small>${esc(label)}</small><b>${esc(String(value))}</b><span>${esc(detail||'')}</span></section>`;
}
function setOpsButtonFeedback(id,text){
  const el=document.getElementById(id);
  if(el)el.textContent=text;
  return false;
}
function opsChecklist(title,items){
  return `<section class="ops-checklist"><h4>${esc(title)}</h4>${items.map(i=>`<div class="${i.ok?'ok':i.warn?'warn':'bad'}"><span>${i.ok?'Klar':i.warn?'FÃ¸lg opp':'Mangler'}</span><b>${esc(i.text)}</b></div>`).join('')}</section>`;
}
function SuperadminOpsPage(){
  const customers=opsCustomerList(),activity=DP.cache.activity||[],docs=DP.cache.documents||[],contacts=DP.cache.contacts||[];
  const last30=activity.filter(a=>opsWithinDays(a,30));
  const emails=last30.filter(a=>/e-?post|mail/i.test(`${a.action||''} ${a.entity_type||''}`)).length;
  const quota=typeof aiQuotaStatus==='function'?aiQuotaStatus():{used:0,limit:0,remaining:0};
  const aiCalls=quota.used||last30.filter(a=>/ai|brain|director/i.test(`${a.action||''} ${a.entity_type||''}`)).length;
  const failures=last30.filter(a=>/feil|failed|error|kunne ikke/i.test(`${a.action||''} ${a.entity_type||''}`)).length;
  const noSub=customers.filter(c=>!c.plan).length;
  const highUse=(docs.length>75||emails>100||aiCalls>100||activity.length>250);
  const storageHint=docs.length?`${docs.length} filer pÃ¥ valgt eiendom`:'Ingen filer pÃ¥ valgt eiendom';
  return `<div class="ops-dashboard"><div class="ops-head"><div><small>Intern driftsstatus</small><h3>Helse, bruk og kostnadskontroll</h3><p>Intern oversikt for Driftspartner Nord fÃ¸r dere passerer 50+ kunder. Kundene ser ikke denne siden.</p><p class="ops-runtime">Driftsknapper: direkte klikk aktiv.</p></div><div class="module-actions"><button type="button" class="action primary" onclick="hydrateAll().then(render)">Oppdater live</button><button type="button" class="action" onclick="window.dpOpsAction('showSupportCaseForm'); return false">Ny supportsak</button></div></div><div class="ops-metric-grid">
    ${opsMetric('Kunder',customers.length,'Basert pÃ¥ eiendommer du har tilgang til','ok')}
    ${opsMetric('Eiendommer',DP.properties.length,'Alle lastede eiendommer','info')}
    ${opsMetric('Brukere/kontakter',contacts.length,'Valgt eiendom nÃ¥','info')}
    ${opsMetric('Dokumentlagring',storageHint,'StÃ¸rrelse krever Storage-statistikk','purple')}
    ${opsMetric('E-post 30 dager',emails,'Logget pÃ¥ valgt eiendom','ok')}
    ${opsMetric('AI-kall 30 dager',`${aiCalls}/${quota.limit||0}`,`${quota.remaining||0} igjen i pakken`,'warn')}
    ${opsMetric('Feilede handlinger',failures,failures?'MÃ¥ fÃ¸lges opp':'Ingen loggede feil','bad')}
    ${opsMetric('Uten abonnement',noSub,'Kunder som mangler pakke','warn')}
  </div><div class="ops-two-col"><div>${opsChecklist('Backup og eksport',[
    {ok:true,text:'Daglig backup skal vÃ¦re aktiv i Supabase'},
    {ok:docs.length>0,warn:true,text:'Kontroller dokumentarkiv per kunde'},
    {ok:false,warn:true,text:'MÃ¥nedlig test av gjenoppretting mÃ¥ inn i rutinen'},
    {ok:false,warn:true,text:'Eksport per kunde ved avslutning mÃ¥ standardiseres'}
  ])}<div class="module-actions ops-actions"><button type="button" class="action primary" onclick="document.getElementById('backupOpsOut').textContent='Apner skjema for gjenopprettingstest...'; window.dpOpsAction('showRestoreTestForm'); return false">Logg gjenopprettingstest</button><button type="button" class="action" onclick="document.getElementById('backupOpsOut').textContent='Apner skjema for kundeeksport...'; window.dpOpsAction('showCustomerExportForm'); return false">Start kundeeksport</button></div><div id="backupOpsOut" class="output">Klar for backup- og eksportrutine.</div>${backupExportActivityList()}</div><div>${opsChecklist('Kostnadskontroll',[
    {ok:true,text:'Maks AI-bruk skal styres per pakke'},
    {ok:!quota.limit||aiCalls<quota.limit,warn:true,text:`AI-kall siste 30 dager mÃ¥ overvÃ¥kes (${aiCalls}/${quota.limit||0})`},
    {ok:emails<200,warn:true,text:'E-postteller per kunde mÃ¥ fÃ¸lges'},
    {ok:!highUse,warn:true,text:'Varsel ved hÃ¸y bruk eller manglende abonnement'}
  ])}<div class="module-actions ops-actions"><button type="button" class="action primary" onclick="document.getElementById('costOpsOut').textContent='Kjorer kostnadssjekk...'; window.dpOpsAction('runCostControlCheck'); return false">KjÃ¸r kostnadssjekk</button><button type="button" class="action" onclick="document.getElementById('costOpsOut').textContent='Logger kostnadskontroll...'; window.dpOpsAction('logCostControlCheck'); return false">Logg kostnadskontroll</button></div><div id="costOpsOut" class="output">Klar for kostnadssjekk.</div></div></div><div class="ops-two-col"><div>${opsChecklist('Teknisk robusthet',[
    {ok:document.querySelectorAll('script[src*="assets/prod/"]').length>0,text:'Produksjonsscript er lastet'},
    {ok:!document.querySelectorAll('script[src*="assets/modules/"]').length,warn:true,text:'Gamle modul-filer skal ikke lastes i appen'},
    {ok:true,text:'Kundefeil vises som enkle meldinger'},
    {ok:activity.some(a=>String(a.entity_type||'')==='technical_check'),warn:true,text:'Flere automatiske tester bÃ¸r legges i GitHub/Netlify'}
  ])}<div class="module-actions ops-actions"><button type="button" class="action primary" onclick="document.getElementById('technicalOpsOut').textContent='Kjorer teknisk sjekk...'; window.dpOpsAction('runTechnicalRobustnessCheck'); return false">KjÃ¸r teknisk sjekk</button><button type="button" class="action" onclick="document.getElementById('technicalOpsOut').textContent='Apner oversikt over modulfiler...'; window.dpOpsAction('showLegacyModuleInfo'); return false">Vis modulfiler</button><button type="button" class="action" onclick="document.getElementById('technicalOpsOut').textContent='Logger teknisk test...'; window.dpOpsAction('logTechnicalTest'); return false">Logg test utfÃ¸rt</button></div><div id="technicalOpsOut" class="output">Klar for teknisk sjekk.</div></div><div class="ops-support"><div class="dash-title"><div><h4>Supportflyt</h4><p class="muted">Logg kunde, sakstype, alvorlighet, status, ansvarlig og intern kommentar.</p></div><button type="button" class="action" onclick="window.dpOpsAction('showSupportCaseForm'); return false">Opprett</button></div>${supportActivityList()}</div></div></div>`;
}
function supportActivityList(){
  const rows=(DP.cache.activity||[]).filter(a=>String(a.entity_type||'')==='support').slice(0,5);
  if(!rows.length)return '<div class="empty-state"><strong>Ingen supportsaker logget.</strong><span>Opprett fÃ¸rste supportsak nÃ¥r en kunde trenger hjelp.</span></div>';
  return `<div class="stack-list">${rows.map(r=>`<section class="mini-record"><div><strong>${esc(r.action||'Support')}</strong><small>${esc(r.created_at?new Date(r.created_at).toLocaleString('nb-NO'):'')}</small></div></section>`).join('')}</div>`;
}
function showSupportCaseForm(){
  showDrawer('Ny supportsak',`<div class="form-grid"><label>Kunde/eiendom<input id="supportCustomer" value="${esc(currentProperty()?.name||'')}"></label><label>Sakstype<select id="supportType"><option>Innlogging</option><option>Dokumenter</option><option>E-post</option><option>AI</option><option>Ã˜konomi</option><option>Annet</option></select></label><label>Alvorlighet<select id="supportSeverity"><option>Normal</option><option>Kritisk</option><option>Lav</option></select></label><label>Status<select id="supportStatus"><option>Ny</option><option>PÃ¥gÃ¥r</option><option>Venter kunde</option><option>LÃ¸st</option></select></label><label>Ansvarlig<input id="supportOwner" value="${esc(DP.user?.name||DP.user?.email||'')}"></label><label class="span-2">Intern kommentar<textarea id="supportNote" rows="4" placeholder="Hva mÃ¥ fÃ¸lges opp?"></textarea></label></div><button type="button" class="action primary" onclick="window.dpOpsAction('saveSupportCase'); return false">Lagre supportsak</button><div id="supportOut" class="output"></div>`);
}
async function saveSupportCase(){
  const out=document.getElementById('supportOut');
  try{
    requireLive('lagre supportsak');
    const note=document.getElementById('supportNote')?.value||'';
    const type=document.getElementById('supportType')?.value||'Support';
    const severity=document.getElementById('supportSeverity')?.value||'Normal';
    const status=document.getElementById('supportStatus')?.value||'Ny';
    const owner=document.getElementById('supportOwner')?.value||'';
    const r=await db().from('activity_log').insert({property_id:currentProperty().id,action:`Support: ${type} (${severity})`,entity_type:'support',metadata:{status,owner,note,customer:document.getElementById('supportCustomer')?.value||''}});
    if(r.error)throw r.error;
    await finishAction('Supportsaken er lagret.','admin');
  }catch(e){setOutputError(out,e,'Supportsaken kunne ikke lagres.')}
}
function backupExportActivityList(){
  const rows=(DP.cache.activity||[]).filter(a=>/backup_test|customer_export/.test(String(a.entity_type||''))).slice(0,6);
  if(!rows.length)return '<div class="empty-state"><strong>Ingen backup- eller eksportrutiner logget.</strong><span>Logg fÃ¸rste gjenopprettingstest eller kundeeksport nÃ¥r rutinen er utfÃ¸rt.</span></div>';
  return `<div class="stack-list ops-log-list">${rows.map(r=>`<section class="mini-record"><div><strong>${esc(r.action||'Rutine')}</strong><small>${esc(r.created_at?new Date(r.created_at).toLocaleString('nb-NO'):'')}</small></div></section>`).join('')}</div>`;
}
function showRestoreTestForm(){
  showDrawer('Logg gjenopprettingstest',`<div class="form-grid"><label>Kunde/eiendom<input id="restoreCustomer" value="${esc(currentProperty()?.name||'')}"></label><label>Dato<input id="restoreDate" type="date" value="${new Date().toISOString().slice(0,10)}"></label><label>Ansvarlig<input id="restoreOwner" value="${esc(DP.user?.name||DP.user?.email||'')}"></label><label>Resultat<select id="restoreResult"><option>BestÃ¥tt</option><option>Feilet</option><option>MÃ¥ fÃ¸lges opp</option></select></label><label>Neste testdato<input id="restoreNextDate" type="date"></label><label class="span-2">Kommentar<textarea id="restoreNote" rows="4" placeholder="Hva ble testet? Database, dokumenter, innlogging, avvik, Ã¸konomi osv."></textarea></label></div><button type="button" class="action primary" onclick="window.dpOpsAction('saveRestoreTest'); return false">Lagre test</button><div id="restoreOut" class="output"></div>`);
}
async function saveRestoreTest(){
  const out=document.getElementById('restoreOut');
  try{
    requireLive('lagre gjenopprettingstest');
    const result=document.getElementById('restoreResult')?.value||'BestÃ¥tt';
    const date=document.getElementById('restoreDate')?.value||new Date().toISOString().slice(0,10);
    const r=await db().from('activity_log').insert({property_id:currentProperty().id,action:`Gjenopprettingstest: ${result}`,entity_type:'backup_test',metadata:{customer:document.getElementById('restoreCustomer')?.value||'',date,owner:document.getElementById('restoreOwner')?.value||'',next_date:document.getElementById('restoreNextDate')?.value||'',note:document.getElementById('restoreNote')?.value||''}});
    if(r.error)throw r.error;
    await finishAction('Gjenopprettingstesten er logget.','admin');
  }catch(e){setOutputError(out,e,'Gjenopprettingstesten kunne ikke lagres.')}
}
function showCustomerExportForm(){
  showDrawer('Start kundeeksport',`<div class="form-grid"><label>Kunde/eiendom<input id="exportCustomer" value="${esc(currentProperty()?.name||'')}"></label><label>Status<select id="exportStatus"><option>KlargjÃ¸res</option><option>Sendt</option><option>Bekreftet mottatt</option><option>Slettet/anonymisert</option></select></label><label>Ansvarlig<input id="exportOwner" value="${esc(DP.user?.name||DP.user?.email||'')}"></label><label>Slettedato etter avtale<input id="exportDeleteDate" type="date"></label><label class="span-2">Hva eksporteres<div class="choice-list"><label class="check-row"><input class="exportPart" type="checkbox" value="Dokumenter" checked> Dokumenter</label><label class="check-row"><input class="exportPart" type="checkbox" value="Avvik" checked> Avvik</label><label class="check-row"><input class="exportPart" type="checkbox" value="Arbeidsordre" checked> Arbeidsordre</label><label class="check-row"><input class="exportPart" type="checkbox" value="Ã˜konomi" checked> Ã˜konomi</label><label class="check-row"><input class="exportPart" type="checkbox" value="Aktivitetslogg" checked> Aktivitetslogg</label></div></label><label class="span-2">Kommentar<textarea id="exportNote" rows="4" placeholder="Hvordan leveres eksporten, hvem mottar den, og hva er avtalt?"></textarea></label></div><button type="button" class="action primary" onclick="window.dpOpsAction('saveCustomerExport'); return false">Lagre eksportstatus</button><div id="exportOut" class="output"></div>`);
}
async function saveCustomerExport(){
  const out=document.getElementById('exportOut');
  try{
    requireLive('lagre kundeeksport');
    const status=document.getElementById('exportStatus')?.value||'KlargjÃ¸res';
    const parts=[...document.querySelectorAll('.exportPart:checked')].map(x=>x.value);
    const r=await db().from('activity_log').insert({property_id:currentProperty().id,action:`Kundeeksport: ${status}`,entity_type:'customer_export',metadata:{customer:document.getElementById('exportCustomer')?.value||'',owner:document.getElementById('exportOwner')?.value||'',delete_date:document.getElementById('exportDeleteDate')?.value||'',parts,note:document.getElementById('exportNote')?.value||''}});
    if(r.error)throw r.error;
    await finishAction('Kundeeksporten er logget.','admin');
  }catch(e){setOutputError(out,e,'Kundeeksporten kunne ikke lagres.')}
}
function runCostControlCheck(){
  const out=document.getElementById('costOpsOut');
  const activity=DP.cache.activity||[],docs=DP.cache.documents||[];
  const last30=activity.filter(a=>opsWithinDays(a,30));
  const emails=last30.filter(a=>/e-?post|mail/i.test(`${a.action||''} ${a.entity_type||''}`)).length;
  const quota=typeof aiQuotaStatus==='function'?aiQuotaStatus():{used:0,limit:0,remaining:0,blocked:false};
  const aiCalls=quota.used||last30.filter(a=>/ai|brain|director/i.test(`${a.action||''} ${a.entity_type||''}`)).length;
  const warnings=[];
  if(quota.limit&&aiCalls>=quota.limit)warnings.push('AI-kvote brukt opp');
  else if(quota.limit&&aiCalls>=Math.round(quota.limit*0.8))warnings.push('AI-bruk nÃ¦rmer seg grensen');
  if(emails>200)warnings.push('HÃ¸y e-postbruk');
  if(docs.length>75)warnings.push('Mye dokumentlagring');
  if(!currentProperty()?.subscription_plan)warnings.push('Kunde mangler abonnement');
  const lines=[
    `AI-kall denne mÃ¥neden: ${aiCalls}/${quota.limit||0}`,
    `AI-klikk igjen: ${quota.remaining||0}`,
    `E-post siste 30 dager: ${emails}`,
    `Dokumenter pÃ¥ valgt eiendom: ${docs.length}`,
    `Abonnement: ${currentProperty()?.subscription_plan||'Ikke valgt'}`,
    warnings.length?`FÃ¸lg opp: ${warnings.join(', ')}`:'OK: ingen tydelige kostnadsvarsler'
  ];
  if(out)out.textContent=lines.join('\n');
  showDrawer('Kostnadssjekk',`<div class="info-grid"><section><small>AI-kall denne mÃ¥neden</small><strong>${aiCalls}/${quota.limit||0}</strong><span>${quota.remaining||0} igjen i pakken</span></section><section><small>E-post siste 30 dager</small><strong>${emails}</strong><span>Logget pÃ¥ valgt eiendom</span></section><section><small>Dokumenter</small><strong>${docs.length}</strong><span>Filer pÃ¥ valgt eiendom</span></section><section><small>Abonnement</small><strong>${esc(currentProperty()?.subscription_plan||'Ikke valgt')}</strong><span>Start 50 Â· Pro 150 Â· Premium 500</span></section></div><div class="output">${esc(lines.join('\n'))}</div>`);
  showNotice('Kostnadssjekk kjÃ¸rt.','ok');
  return {aiCalls,aiLimit:quota.limit,aiRemaining:quota.remaining,emails,documents:docs.length,warnings};
}
async function logCostControlCheck(){
  const out=document.getElementById('costOpsOut');
  try{
    requireLive('logge kostnadskontroll');
    const result=runCostControlCheck();
    const r=await db().from('activity_log').insert({property_id:currentProperty().id,action:result.warnings.length?`Kostnadskontroll: ${result.warnings.length} varsel`:'Kostnadskontroll: OK',entity_type:'cost_control',metadata:{...result,checked_at:new Date().toISOString()}});
    if(r.error)throw r.error;
    await finishAction('Kostnadskontrollen er logget.','admin');
  }catch(e){setOutputError(out,e,'Kostnadskontroll kunne ikke logges.')}
}
function runTechnicalRobustnessCheck(){
  const out=document.getElementById('technicalOpsOut');
  const scriptSrc=node=>node?.getAttribute?.('src')||node?.src||'';
  const prodScripts=[...document.querySelectorAll('script[src*="assets/prod/"]')].map(scriptSrc).filter(Boolean);
  const moduleScripts=[...document.querySelectorAll('script[src*="assets/modules/"]')].map(scriptSrc).filter(Boolean);
  const checks=[
    ['Produksjonsscript',prodScripts.length>=5,`${prodScripts.length} prod-filer lastet`],
    ['Gamle moduler',moduleScripts.length===0,moduleScripts.length?`${moduleScripts.length} gamle moduler lastes`:'Ingen gamle moduler lastes'],
    ['Supabase-klient',!!DP.sb,'Supabase er initialisert'],
    ['Innlogging',!!DP.session,'Bruker er innlogget'],
    ['Live eiendom',isUuid(currentProperty()?.id),'Valgt eiendom har live-ID'],
    ['Netlify-funksjoner',location.protocol!=='file:','MÃ¥ testes fra live Netlify-side']
  ];
  const text=checks.map(c=>`${c[1]?'OK':'FÃ˜LG OPP'}: ${c[0]} - ${c[2]}`).join('\n');
  if(out)out.textContent=text;
  showDrawer('Teknisk sjekk',`<div class="info-grid">${checks.map(c=>`<section><small>${esc(c[0])}</small><strong>${c[1]?'OK':'FÃ¸lg opp'}</strong><span>${esc(c[2])}</span></section>`).join('')}</div><div class="output">${esc(text)}</div>`);
  showNotice('Teknisk sjekk kjÃ¸rt.','ok');
  return checks;
}
function showLegacyModuleInfo(){
  const scriptSrc=node=>node?.getAttribute?.('src')||node?.src||'';
  const prodScripts=[...document.querySelectorAll('script[src*="assets/prod/"]')].map(scriptSrc).filter(Boolean);
  const moduleScripts=[...document.querySelectorAll('script[src*="assets/modules/"]')].map(scriptSrc).filter(Boolean);
  showNotice('Viser tekniske appfiler.','ok');
  showDrawer('Tekniske appfiler',`<div class="info-grid"><section><small>Produksjonsfiler</small><strong>${prodScripts.length}</strong><span>Disse styrer appen nÃ¥.</span></section><section><small>Gamle moduler lastet</small><strong>${moduleScripts.length}</strong><span>${moduleScripts.length?'MÃ¥ ryddes':'Ingen gamle moduler lastes i siden.'}</span></section></div><h3>Produksjonsfiler</h3><div class="output">${esc(prodScripts.join('\n')||'Ingen funnet')}</div><h3>Gamle moduler som lastes</h3><div class="output">${esc(moduleScripts.join('\n')||'Ingen gamle moduler lastes.')}</div>`);
}
async function logTechnicalTest(){
  const out=document.getElementById('technicalOpsOut');
  try{
    requireLive('logge teknisk test');
    const checks=runTechnicalRobustnessCheck();
    const failed=checks.filter(c=>!c[1]).map(c=>c[0]);
    const r=await db().from('activity_log').insert({property_id:currentProperty().id,action:failed.length?`Teknisk sjekk: ${failed.length} punkt mÃ¥ fÃ¸lges opp`:'Teknisk sjekk: OK',entity_type:'technical_check',metadata:{failed,checked_at:new Date().toISOString()}});
    if(r.error)throw r.error;
    await finishAction('Teknisk sjekk er logget.','admin');
  }catch(e){setOutputError(out,e,'Teknisk sjekk kunne ikke logges.')}
}
Object.assign(window,{
  setOpsButtonFeedback,
  showSupportCaseForm,
  saveSupportCase,
  showRestoreTestForm,
  saveRestoreTest,
  showCustomerExportForm,
  saveCustomerExport,
  runCostControlCheck,
  logCostControlCheck,
  runTechnicalRobustnessCheck,
  showLegacyModuleInfo,
  logTechnicalTest,
  markEmailTestedOk
});
window.dpOpsAction=function(name){
  const fn=window[name];
  const errorTarget=/Technical|Legacy|logTechnical/.test(name)?'technicalOpsOut':/Cost/.test(name)?'costOpsOut':/Restore|CustomerExport/.test(name)?'backupOpsOut':'status';
  const writeError=(message)=>{const el=document.getElementById(errorTarget);if(el)el.textContent=message;showNotice(message,'bad')};
  if(typeof fn!=='function'){
    writeError('Handlingen finnes ikke i denne versjonen. Last opp siste pakke og prÃ¸v igjen.');
    return false;
  }
  try{
    const result=fn();
    if(result&&typeof result.then==='function')result.catch(error=>writeError(customerError(error,'Handlingen kunne ikke utfÃ¸res akkurat nÃ¥.')));
  }catch(error){
    writeError(customerError(error,'Handlingen kunne ikke utfÃ¸res akkurat nÃ¥.'));
  }
  return false;
};
if(!window.__dpOpsActionsBound){
  window.__dpOpsActionsBound=true;
  document.addEventListener('click',async(event)=>{
    const button=event.target?.closest?.('[data-ops-action]');
    if(!button)return;
    const action=button.getAttribute('data-ops-action');
    const fn=window[action];
    if(typeof fn!=='function')return;
    event.preventDefault();
    event.stopPropagation();
    try{await fn()}catch(error){showNotice(customerError(error,'Handlingen kunne ikke utfÃ¸res akkurat nÃ¥.'),'bad')}
  });
}
function activityCards(){const rows=(DP.cache.activity||[]).slice(0,12);if(!rows.length)return '<div class="empty-state"><strong>Ingen aktivitet registrert.</strong><span>NÃ¥r brukere oppretter, endrer, sender eller laster opp noe, vises historikken her.</span></div>';return `<div class="activity-feed control-activity">${rows.map(a=>`<section><span>${esc(String(a.entity_type||'Logg').slice(0,12))}</span><div><strong>${esc(a.action||'Hendelse')}</strong><small>${esc([currentProperty()?.name,a.created_at?new Date(a.created_at).toLocaleString('nb-NO'):''].filter(Boolean).join(' Â· '))}</small></div></section>`).join('')}</div>`}
function roleAccessPanel(){
  const role=appRole(),menus=visibleMenus(),props=DP.properties||[];
  return `<div class="role-access-cards"><section><small>Aktiv rolle</small><strong>${esc(role||'-')}</strong><span>${esc(DP.user?.email||'Ingen e-post')}</span></section><section><small>Synlige menyer</small><strong>${menus.length}</strong><span>${esc(menus.map(m=>m[1]).join(', ')||'Ingen')}</span></section><section><small>Eiendomstilgang</small><strong>${props.length}</strong><span>${esc(props.map(p=>p.name).slice(0,3).join(', ')||'Ingen eiendom')}</span></section></div><div class="role-matrix"><h4>Forventet rolleoppsett</h4>${[
    ['Superadmin','Alle menyer og alle eiendommer'],['Admin','Alle kundemenyer, men kan ikke endre superadmin'],
    ['Styreleder','Menyer etter rolle og valgt abonnement'],
    ['Styremedlem','Styre, FDV, avvik og eventuelle Pro/Premium-moduler'],
    ['Beboer','Kun avvik/henvendelser'],
    ['Vaktmester','Avvik, arbeidsordre og FDV'],
    ['LeverandÃ¸r','Kun tilbud/oppdrag']
  ].map(r=>`<div><b>${esc(r[0])}</b><span>${esc(r[1])}</span></div>`).join('')}</div>`;
}
function runCleanCheck(){const out=document.getElementById('adminOut');const s=launchSummary();if(out)out.textContent=`Kontroll fullfÃ¸rt. Klar ${s.total-s.bad-s.warn}/${s.total}. MÃ¥ fikses ${s.bad}. MÃ¥ testes ${s.warn}.`;runLaunchControl()}

function signatureActor(){
  const p=currentProperty();
  const name=DP.profile?.name||DP.user?.user_metadata?.name||DP.user?.email||'Innlogget bruker';
  const email=DP.user?.email||'';
  return {name,email,role:DP.profile?.role||appRole()||'',property:p?.name||''};
}
function signatureLogText(row){
  const parts=[];
  if(row.sent_by_name||row.sent_at)parts.push(`Sendt av ${row.sent_by_name||'ukjent'}${row.sent_at?' Â· '+new Date(row.sent_at).toLocaleString('no-NO'):''}`);
  if(row.signed_by_name||row.signed_at)parts.push(`Signert av ${row.signed_by_name||'ukjent'}${row.signed_at?' Â· '+new Date(row.signed_at).toLocaleString('no-NO'):''}`);
  return parts.join(' | ')||'Ingen signaturhendelser logget ennÃ¥.';
}

function signatureLogArray(row){
  try{return Array.isArray(row?.signature_log)?row.signature_log:JSON.parse(row?.signature_log||'[]')}catch{return []}
}
function signatureLogEntry(event,row={},extra={}){
  const actor=signatureActor(),p=currentProperty();
  return {
    event,
    name:actor.name,
    email:actor.email,
    role:actor.role,
    property_id:p?.id||row.property_id||'',
    property:p?.name||actor.property||'',
    title:row.title||document.getElementById('signTitle')?.value||'Signering',
    signature_type:row.signature_type||document.getElementById('signType')?.value||'Signering',
    approved_text:extra.approved_text||row.notes||document.getElementById('signNotes')?.value||'',
    related_type:row.related_type||'',
    related_id:row.related_id||'',
    at:new Date().toISOString(),
    metadata:{path:location.pathname,host:location.host,user_agent:navigator.userAgent},
    ...extra
  };
}
function signatureLogWith(row,event,extra={}){
  return [...signatureLogArray(row),signatureLogEntry(event,row,extra)];
}
function signatureRows(){return DP.cache.signature_requests||[]}
function signatureRecipients(){
  const rows=[];
  const add=(email,name,role)=>{email=String(email||'').trim();if(email.includes('@')&&!rows.some(r=>r.email.toLowerCase()===email.toLowerCase()))rows.push({email,name:name||email,role:role||'Kontakt'})};
  (DP.cache.contacts||[]).forEach(c=>add(c.email,c.name,c.role||c.contact_role||'Kontakt'));
  (DP.suppliers||[]).forEach(s=>add(s.email,s.name||s.company,'Leverandor'));
  add(DP.user?.email,DP.profile?.name||DP.user?.email,'Innlogget bruker');
  return rows;
}
function signatureRecipientCount(row){
  try{const r=Array.isArray(row.recipients)?row.recipients:JSON.parse(row.recipients||'[]');return r.length}catch{return 0}
}
function signatureStatusClass(status){
  return /signert|ferdig|godkjent/i.test(status||'')?'ok':/sendt|venter/i.test(status||'')?'info':/avvist|utlopt|utlÃ¸pt/i.test(status||'')?'bad':'warn';
}
function showSignatureRequestForm(type='Kontrakt',relatedType='',relatedId='',title=''){
  const recipients=signatureRecipients();
  const options=recipients.length?recipients.map((r,i)=>`<label class="check-row"><input type="checkbox" name="signRecipient" value="${esc(r.email)}" data-name="${esc(r.name)}" data-role="${esc(r.role)}" ${i===0?'checked':''}> <span><b>${esc(r.name)}</b><small>${esc(r.role)} Â· ${esc(r.email)}</small></span></label>`).join(''):'<div class="empty-state"><strong>Ingen mottakere funnet.</strong><span>Legg inn styremedlemmer, beboere eller leverandÃ¸rer med e-post fÃ¸rst.</span></div>';
  const heading=title||`${type} - ${currentProperty()?.name||'eiendom'}`;
  showDrawer('Ny signering',`<div class="form-grid two"><label>Tittel<input id="signTitle" value="${esc(heading)}"></label><label>Type<select id="signType"><option ${type==='Kontrakt'?'selected':''}>Kontrakt</option><option ${type==='Styrevedtak'?'selected':''}>Styrevedtak</option><option ${type==='Tilbudsgodkjenning'?'selected':''}>Tilbudsgodkjenning</option><option ${type==='Annet'?'selected':''}>Annet</option></select></label><label>Frist<input id="signDue" type="date"></label><label>Status<select id="signStatus"><option>Sendt</option><option>Utkast</option><option>Venter signering</option><option>Signert</option></select></label></div><h4>Mottakere</h4><div class="recipient-picker">${options}</div><label>Ekstra e-postadresser</label><textarea id="signExtra" rows="2" placeholder="navn@kunde.no, styret@kunde.no"></textarea><label>Notat / instruks</label><textarea id="signNotes" rows="4" placeholder="Hva skal signeres, hvorfor, og hva mÃ¥ mottaker vite?"></textarea><div class="flow-note">Intern signaturstyring: systemet sender e-post, logger hvem som sendte, hvem som signerte og tidspunkt for begge handlinger.</div><button class="action primary" onclick="saveSignatureRequest('${esc(relatedType)}','${esc(relatedId)}')">Opprett signering</button><div id="signOut" class="output"></div>`);
}
function readSignatureRecipients(){
  const picked=[...document.querySelectorAll('[name=signRecipient]:checked')].map(x=>({email:x.value,name:x.dataset.name||x.value,role:x.dataset.role||'Mottaker'}));
  const extra=String(document.getElementById('signExtra')?.value||'').split(/[,;\n]/).map(x=>x.trim()).filter(x=>x.includes('@')).map(email=>({email,name:email,role:'Ekstra mottaker'}));
  return [...picked,...extra].filter((r,i,a)=>a.findIndex(x=>x.email.toLowerCase()===r.email.toLowerCase())===i);
}
function signatureErrorMessage(error){
  const msg=String(error?.message||error?.details||error?.hint||error||'');
  if(/signature_requests|could not find the table|schema cache|relation .* does not exist|does not exist/i.test(msg))return 'Signeringstabellen mangler. KjÃ¸r supabase-signatures-v1.sql i Supabase SQL Editor, publiser siste pakke og prÃ¸v igjen.';
  if(/row level|rls|policy|permission|not authorized|violates row-level/i.test(msg))return 'Brukeren mangler tilgang til Ã¥ lagre signering pÃ¥ valgt eiendom. Sjekk property_access/RLS for brukeren.';
  if(/column|related_id|recipients|signature_type|due_date/i.test(msg))return 'Signeringstabellen har feil oppsett. KjÃ¸r oppdatert supabase-signatures-v1.sql i Supabase og prÃ¸v igjen.';
  if(/uuid|invalid input syntax/i.test(msg))return 'Signeringen peker til en ugyldig sak/dokument. Ã…pne signering fra Integrasjoner og prÃ¸v uten koblet sak.';
  return customerError(error);
}
function signatureRecipientEmails(row){
  try{
    const list=Array.isArray(row.recipients)?row.recipients:JSON.parse(row.recipients||'[]');
    return list.map(r=>String(r.email||r||'').trim()).filter(x=>x.includes('@'));
  }catch{return []}
}
function signatureBoardSigner(){
  const p=currentProperty();
  const contacts=DP.cache.contacts||[];
  const lead=contacts.find(c=>/styreleder/i.test(String(c.role||c.contact_role||''))&&String(c.email||'').includes('@'))
    ||contacts.find(c=>/leder|styre/i.test(String(c.role||c.contact_role||''))&&String(c.email||'').includes('@'));
  return {name:lead?.name||`Styret i ${p?.name||'eiendommen'}`,email:lead?.email||p?.customer_billing_email||DP.user?.email||'',role:lead?.role||lead?.contact_role||'Styreleder'};
}
function signatureReplyTo(){return signatureBoardSigner().email}
function signatureEmailPayload(row){
  const p=currentProperty(),to=signatureRecipientEmails(row),signer=signatureBoardSigner(),replyTo=signer.email;
  const due=row.due_date?`\nFrist: ${row.due_date}`:'';
  const notes=row.notes?`\n\nInstruks:\n${row.notes}`:'';
  const type=row.signature_type||'Signering';
  const title=row.title||'Dokument til signering';
  const intro=type==='Kontrakt'?'Kontrakten er klar for gjennomgang og signering.':type==='Styrevedtak'?'Styrevedtaket er klart for gjennomgang og signering.':type==='Tilbudsgodkjenning'?'Tilbudet er klart for godkjenning.':'Dokumentet er klart for gjennomgang og signering.';
  const message=`Hei,\n\n${intro}\n\nEiendom: ${p?.name||'valgt eiendom'}\nTittel: ${title}\nType: ${type}${due}${notes}\n\nGÃ¥ gjennom grunnlaget og svar pÃ¥ denne e-posten dersom noe mÃ¥ avklares.\n\nVennlig hilsen\n${signer.name}\n${signer.role}\n${p?.name||''}`;
  return {to,subject:`Signering: ${title}`,message,kind:'signature',caseId:'',property:p?.name||'',property_id:p?.id||'',reply_to:replyTo,from_name:`${signer.name} via Driftspartner OS`};
}async function sendSignatureEmailRow(row,out){
  if(!row)throw new Error('Fant ikke signeringsforespÃ¸rselen.');
  const payload=signatureEmailPayload(row);
  if(!payload.to.length)throw new Error('Signeringen mangler mottakere med e-post.');
  if(location.protocol==='file:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')throw new Error('Signering kan bare sendes fra publisert Netlify-side.');
  if(out)out.textContent='Sender signering pÃ¥ e-post...';
  const res=await fetch('/.netlify/functions/send-email',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  const data=await readJsonResponse(res,'E-postfunksjonen svarte ikke riktig. Publiser siste pakke og prÃ¸v igjen.');
  if(!res.ok||!data.ok)throw new Error(data.message||'Signering ble ikke sendt pÃ¥ e-post.');
  const actor=signatureActor();
  await db().from('signature_requests').update({status:'Sendt',sent_by_name:actor.name,sent_by_email:actor.email,sent_at:new Date().toISOString(),signature_log:signatureLogWith(row,'sent',{approved_text:row.notes||row.title,recipients:row.recipients||[]}),updated_at:new Date().toISOString()}).eq('id',row.id);
  await insertActivity(`Signering sendt pÃ¥ e-post: ${row.title||'Signering'}`,'signature_request',row.id);
  return data;
}
async function sendSignatureEmail(id){
  const out=document.getElementById('signatureOut');
  try{
    requireLive('sende signering');
    await sendSignatureEmailRow(signatureRows().find(r=>String(r.id)===String(id)),out);
    await finishAction('Signering er sendt pÃ¥ e-post.','integrations');
  }catch(e){
    const msg=signatureErrorMessage(e);
    if(out)out.textContent=msg;else showDrawer('Signering ble ikke sendt',`<div class="output">${esc(msg)}</div>`);
  }
}
async function saveSignatureRequest(relatedType='',relatedId=''){
  const out=document.getElementById('signOut');
  try{
    requireLive('opprette signering');
    const recipients=readSignatureRecipients();
    if(!recipients.length)throw new Error('Velg minst en mottaker med e-post.');
    const row={property_id:currentProperty().id,title:document.getElementById('signTitle')?.value||'Signering',signature_type:document.getElementById('signType')?.value||'Kontrakt',related_type:relatedType||null,related_id:relatedId||null,recipients,due_date:document.getElementById('signDue')?.value||null,status:document.getElementById('signStatus')?.value||'Sendt',notes:document.getElementById('signNotes')?.value||null,sent_by_name:signatureActor().name,sent_by_email:signatureActor().email,sent_at:document.getElementById('signStatus')?.value==='Sendt'?new Date().toISOString():null};
    row.signature_log=[signatureLogEntry('created',row,{recipients,approved_text:row.notes||row.title})];
    const r=await db().from('signature_requests').insert(row).select().single();
    if(r.error)throw r.error;
    await insertActivity('Signering opprettet','signature_request',r.data.id);
    await finishAction('SigneringsforespÃ¸rselen er opprettet.','integrations');
  }catch(e){
    const msg=signatureErrorMessage(e);
    if(out)out.textContent=msg;else showDrawer('Signering ble ikke opprettet',`<div class="output">${esc(msg)}</div>`);
  }
}
async function updateSignatureStatus(id,status){
  try{
    requireLive('oppdatere signering');
    const actor=signatureActor();
    const existing=signatureRows().find(x=>String(x.id)===String(id))||{};
    const isSigned=/signert|ferdig|godkjent/i.test(status);
    const row={status,signature_log:signatureLogWith(existing,isSigned?'signed':'status',{status,approved_text:existing.notes||existing.title}),updated_at:new Date().toISOString()};
    if(isSigned){row.signed_at=new Date().toISOString();row.signed_by_name=actor.name;row.signed_by_email=actor.email;}
    const r=await db().from('signature_requests').update(row).eq('id',id);if(r.error)throw r.error;
    await insertActivity('Signering oppdatert','signature_request',id);
    await finishAction('Signering er oppdatert.','integrations');
  }catch(e){showDrawer('Signering ble ikke oppdatert',`<div class="output">${esc(customerError(e))}</div>`)}
}
async function deleteSignatureRequest(id){
  try{requireLive('slette signering');const r=await db().from('signature_requests').delete().eq('id',id);if(r.error)throw r.error;await insertActivity('Signering slettet','signature_request',id);await finishAction('Signering er slettet.','integrations')}catch(e){showDrawer('Signering ble ikke slettet',`<div class="output">${esc(customerError(e))}</div>`)}
}
function SignaturePanel(){
  const rows=signatureRows();
  return `<div class="dash-title"><div><h3>Intern signatur</h3><p class="muted">Kontrakter, styrevedtak og tilbudsgodkjenning med mottakere, frist og status.</p></div><button class="action primary" onclick="showSignatureRequestForm('Kontrakt')">Ny signering</button></div><div id="signatureOut" class="output">Klar for signering.</div>${rows.length?`<div class="market-card-list">${rows.map(signatureCard).join('')}</div>`:'<div class="empty-state"><strong>Ingen signeringer opprettet.</strong><span>Opprett signering fra kontrakt, styrevedtak eller tilbudsgodkjenning.</span><button class="action primary" onclick="showSignatureRequestForm(\'Kontrakt\')">Opprett fÃ¸rste signering</button></div>'}`;
}
function signatureCard(row){
  const log=signatureLogText(row);
  return `<section class="market-record"><div class="market-record-head"><div><strong>${esc(row.title||'Signering')}</strong><small>${esc(row.signature_type||'Kontrakt')} Â· ${signatureRecipientCount(row)} mottakere Â· Frist ${esc(row.due_date||'ikke satt')}</small></div><span class="soft-pill ${signatureStatusClass(row.status)}">${esc(row.status||'Utkast')}</span></div><div class="mini-meta"><span>Intern signatur</span><span>${esc(log)}</span></div><div class="mini-meta"><span>Godkjenningsgrunnlag</span><span>${esc(row.notes||row.title||'Ikke beskrevet')}</span></div>${row.notes?`<p>${esc(row.notes)}</p>`:''}<div class="row-actions"><button class="action" onclick="sendSignatureEmail('${esc(row.id)}')">Send e-post</button><button class="action" onclick="updateSignatureStatus('${esc(row.id)}','Venter signering')">Venter</button><button class="action primary" onclick="updateSignatureStatus('${esc(row.id)}','Signert')">Marker signert</button><button class="action red" onclick="deleteSignatureRequest('${esc(row.id)}')">Slett</button></div></section>`;
}

function integrationItems(){
  const canCustomerSetup=typeof canManageCustomers==='function'&&canManageCustomers();
  return [
    {name:'Supabase',status:'Aktiv',type:'ok',area:'Database, innlogging og dokumentarkiv',detail:'Live kundedata, tilgang per eiendom og dokumentarkiv.',button:'Test live data',action:'hydrateAll().then(render)'},
    {name:'Resend',status:'Aktiv',type:'ok',area:'E-post',detail:'Brukes til demoforespÃ¸rsler, bestilling, varsler og systemmeldinger.',button:'Ã…pne e-posttest',action:"location.href='mail-test.html'"},
    {name:'OpenAI',status:'Aktiv nÃ¥r kvote er tilgjengelig',type:'warn',area:'AI Director og Property Brain',detail:'Gir anbefalinger fra live data. Krever aktiv API-kvote for Ã¥ svare.',button:'Test AI',action:'testAiIntegration()'},
    {name:'BrÃ¸nnÃ¸ysundregistrene',status:'Klar for onboarding',type:'ok',area:'Kunde og leverandÃ¸rer',detail:'Org.nr-oppslag kan fylle inn firmanavn og adresse ved opprettelse.',button:canCustomerSetup?'Ny kunde':'Klar',action:canCustomerSetup?'showNewCustomerWizard()':"showIntegrationInfo('BrÃ¸nnÃ¸ysundregistrene')"},
    {name:'Kundeavsender / svar til',status:'Aktiv enkel lÃ¸sning',type:'ok',area:'E-post',detail:'E-post sendes via Driftspartner, men vises med kundens/styrets navn og svar gÃ¥r til kunden.',button:'Send e-post',action:"showEmailFlow('all')"},
    {name:'Microsoft 365 / Outlook light',status:'V1 klar',type:'ok',area:'E-post, kalender og styremoter',detail:'Moteinnkalling med kalenderfil, kalenderlenker og svar-til kunde/styre uten Microsoft-admin.',button:'Ny moteinnkalling',action:"showOutlookLightForm('board')"},
    {name:'Intern signatur',status:'Aktiv',type:'ok',area:'Kontrakter og vedtak',detail:'Sender signeringsforespÃ¸rsler pÃ¥ e-post og logger navn, e-post og tidspunkt nÃ¥r noe sendes eller markeres signert.',button:'Ny signering',action:"showSignatureRequestForm('Kontrakt')"},
    {name:'Tripletex',status:'Planlagt',type:'info',area:'Regnskap',detail:'Aktuell for faktura, prosjektkostnader, budsjett og rapportering.',button:'Se anbefaling',action:"showIntegrationInfo('Tripletex')"},
    {name:'PowerOffice Go',status:'Planlagt',type:'info',area:'Regnskap',detail:'Alternativ regnskapsintegrasjon for borettslag, sameier og forvaltere.',button:'Se anbefaling',action:"showIntegrationInfo('PowerOffice Go')"},
    {name:'Fiken',status:'Planlagt',type:'info',area:'Regnskap',detail:'Enklere regnskapskobling for mindre kunder og startpakker.',button:'Se anbefaling',action:"showIntegrationInfo('Fiken')"},
    {name:'Bank / kontoutskrift',status:'Planlagt',type:'info',area:'Ã˜konomi',detail:'Import av saldo og transaksjoner vil gjÃ¸re Ã¸konomien mer automatisk og troverdig.',button:'Se anbefaling',action:"showIntegrationInfo('Bank / kontoutskrift')"}
  ];
}
function IntegrationsPage(){
  if(typeof canManageCustomers==='function'&&!canManageCustomers())return `<div class="grid"><div class="card s12"><div class="empty-state"><strong>Ikke tilgjengelig.</strong><span>Integrasjoner administreres av Driftspartner Nord.</span></div></div></div>`;
  const items=integrationItems(),active=items.filter(i=>i.type==='ok').length,next=items.filter(i=>i.type==='warn').length,planned=items.filter(i=>i.type==='info').length;
  const customerButton=(typeof canManageCustomers==='function'&&canManageCustomers())?`<button class="action" onclick="showNewCustomerWizard()">Ny kunde</button>`:'';
  return `<div class="grid integrations-page"><div class="card s12 module-hero integration-hero"><div><small>Integrasjoner</small><h2>Koble Driftspartner OS til verktÃ¸yene kundene bruker</h2><p>Her samles e-post, AI, regnskap, signering, offentlige data og kalender. MÃ¥let er mindre manuelt arbeid og mer live informasjon pÃ¥ valgt eiendom.</p></div><div class="module-actions"><button class="action primary" onclick="showEmailFlow('all')">Send som kunde/styre</button><button class="action" onclick="showOutlookLightForm('board')">Ny moteinnkalling</button><button class="action" onclick="testAiIntegration()">Test AI</button><button class="action" onclick="location.href='mail-test.html'">Test e-post</button>${customerButton}</div></div><div class="card s12 integration-summary"><section><small>Aktive</small><b>${active}</b><span>Koblinger i bruk nÃ¥</span></section><section><small>Anbefalt neste</small><b>${next}</b><span>Gir raskest kundeverdi</span></section><section><small>Planlagt</small><b>${planned}</b><span>Regnskap og bank</span></section><section><small>Prioritet</small><b>Signaturstyring</b><span>Navn, rolle og tidspunkt logges</span></section></div><div class="card s12">${SignaturePanel()}</div><div class="card s8"><div class="dash-title"><div><h3>Integrasjonsstatus</h3><p class="muted">Bare koblinger som faktisk er klare bÃ¸r merkes som aktive.</p></div></div><div class="integration-card-grid">${items.map(integrationCard).join('')}</div></div><div class="card s4 integration-stack"><h3>Anbefalt rekkefÃ¸lge</h3>${integrationRoadmap()}<div class="integration-note"><strong>V1 for salg</strong><span>Start med BrÃ¸nnÃ¸ysund, kundeavsender/svar-til, intern signaturstyring og Ã©n regnskapskobling. Outlook kan komme senere som premium-integrasjon.</span></div></div></div>`;
}
function integrationCard(item){
  const label=item.type==='ok'?'Aktiv':item.type==='warn'?'Neste steg':'Planlagt';
  return `<section class="integration-card ${item.type}"><div><small>${esc(item.area)}</small><strong>${esc(item.name)}</strong></div><span>${esc(item.status||label)}</span><p>${esc(item.detail)}</p><button class="action" onclick="${item.action}">${esc(item.button||'Ã…pne')}</button></section>`;
}
function integrationRoadmap(){
  return `<ol class="integration-roadmap">${[
    ['BrÃ¸nnÃ¸ysund','Org.nr-oppslag i kunde, eiendom og leverandÃ¸r.'],
    ['Microsoft 365 / Outlook','MÃ¸teinnkalling, kalender, e-post og styredokumenter.'],
    ['Intern signatur','Navn, e-post og tidspunkt for kontrakter, styrevedtak og tilbudsgodkjenning.'],
    ['Tripletex / PowerOffice / Fiken','Budsjett, faktura, prosjektkost og rapport.'],
    ['Bankimport','Saldo og transaksjoner direkte inn i Ã¸konomimodulen.']
  ].map((r,i)=>`<li><b>${i+1}</b><div><strong>${esc(r[0])}</strong><span>${esc(r[1])}</span></div></li>`).join('')}</ol>`;
}
async function testAiIntegration(){
  try{
    const res=await fetch('/.netlify/functions/ai-ping',{method:'GET'});
    const data=await readJsonResponse(res,'AI-testen svarte ikke riktig. PrÃ¸v igjen, eller kontakt Driftspartner Nord hvis feilen fortsetter.');
    const ok=data?.has_openai_key&&data?.has_supabase_url&&data?.has_service_role;
    showDrawer('AI-integrasjon',`<div class="info-grid"><section><small>OpenAI</small><strong>${ok?'Klar':'Mangler oppsett'}</strong><span>${data?.has_openai_key?'API-nÃ¸kkel er lagt inn':'OPENAI_API_KEY mangler'}</span></section><section><small>Supabase</small><strong>${data?.has_supabase_url&&data?.has_service_role?'Klar':'Mangler oppsett'}</strong><span>${data?.has_supabase_url?'URL er lagt inn':'SUPABASE_URL mangler'} Â· ${data?.has_service_role?'Service key er lagt inn':'SUPABASE_SERVICE_ROLE_KEY mangler'}</span></section></div><div class="output">${esc(ok?'AI-funksjonen har riktig miljÃ¸oppsett. Hvis AI likevel feiler, skyldes det ofte kvote eller betalingsoppsett hos OpenAI.':'Legg inn manglende miljÃ¸variabler i Netlify og publiser pÃ¥ nytt.')}</div>`);
  }catch(e){showDrawer('AI-integrasjon',`<div class="output error">${esc(customerError(e,'AI-testen kunne ikke kjÃ¸res akkurat nÃ¥.'))}</div>`)}
}
function showIntegrationInfo(name){
  const text={
    'Microsoft 365 / Outlook':'Koble mÃ¸teinnkallinger, styrekalender, e-posttrÃ¥der og dokumentdeling. Dette gjÃ¸r styremodulen mye mer nyttig for kunder.',
    'Intern signatur':'Intern signaturstyring sender forespÃ¸rsel pÃ¥ e-post og logger hvem som sendte, hvem som signerte og tidspunkt. Dette er enklere, billigere og godt nok for V1 der ekstern signering ikke er et krav.',
    'Tripletex':'Passer godt for kunder som vil hente faktura, prosjektkostnader og rapporttall direkte inn i Ã¸konomimodulen.',
    'PowerOffice Go':'Aktuelt som regnskapsalternativ for forvaltere og kunder som allerede bruker PowerOffice.',
    'Fiken':'Godt alternativ for mindre kunder som trenger enkel regnskapskobling.',
    'Bank / kontoutskrift':'Bankimport bÃ¸r brukes nÃ¥r Ã¸konomidelen skal vise faktiske transaksjoner, saldo og avvik uten manuell punching.'
  }[name]||'Denne integrasjonen bÃ¸r beskrives med formÃ¥l, dataflyt, tilgang og hva kunden fÃ¥r ut av den.';
  showDrawer(name,`<div class="output">${esc(text)}</div><div class="integration-note"><strong>Anbefalt krav fÃ¸r bygging</strong><span>Avklar API-tilgang, kostnad, sikkerhet, kundesamtykke og hvilke felter som skal synkroniseres.</span></div>`);
}

async function connectMicrosoft365(){
  try{
    if(!DP.session?.access_token)throw new Error('Logg inn fÃ¸r du kobler Microsoft 365.');
    const p=currentProperty();
    const res=await fetch('/.netlify/functions/microsoft-auth-start',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${DP.session.access_token}`},body:JSON.stringify({property_id:p?.id||''})});
    const data=await readJsonResponse(res,'Microsoft-koblingen svarte ikke riktig. PrÃ¸v igjen, eller kontakt Driftspartner Nord hvis feilen fortsetter.');
    if(!data.ok)throw new Error(data.message||'Kunne ikke starte Microsoft-kobling.');
    window.location.href=data.url;
  }catch(e){showDrawer('Microsoft 365',`<div class="output">${esc(customerError(e,'Microsoft 365 kunne ikke kobles akkurat nÃ¥.'))}</div><div class="integration-note"><strong>Mangler oppsett?</strong><span>Legg inn MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET og kjÃ¸r supabase-microsoft-outlook-v1.sql.</span></div>`)}
}

function calendarPad(n){return String(n).padStart(2,'0')}
function localDateTimeValue(d){return `${d.getFullYear()}-${calendarPad(d.getMonth()+1)}-${calendarPad(d.getDate())}T${calendarPad(d.getHours())}:${calendarPad(d.getMinutes())}`}
function calendarUtcStamp(date){
  const d=new Date(date);
  return `${d.getUTCFullYear()}${calendarPad(d.getUTCMonth()+1)}${calendarPad(d.getUTCDate())}T${calendarPad(d.getUTCHours())}${calendarPad(d.getUTCMinutes())}${calendarPad(d.getUTCSeconds())}Z`;
}
function calendarEscape(value){return String(value||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function calendarBase64(text){return btoa(unescape(encodeURIComponent(text)))}
function outlookLightRecipients(kind='board'){return collectMailRecipients(kind).filter(r=>r.email&&r.email.includes('@'))}
function buildIcs({title,start,end,location,description,organizer,attendees=[]}){
  const now=calendarUtcStamp(new Date()),uid=`${Date.now()}-${Math.random().toString(16).slice(2)}@driftspartner-os`;
  const attendeeLines=attendees.map(a=>`ATTENDEE;CN=${calendarEscape(a.label||a.email)};RSVP=TRUE:mailto:${a.email}`).join('\r\n');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Driftspartner OS//Outlook Light//NO','CALSCALE:GREGORIAN','METHOD:REQUEST','BEGIN:VEVENT',`UID:${uid}`,`DTSTAMP:${now}`,`DTSTART:${calendarUtcStamp(start)}`,`DTEND:${calendarUtcStamp(end)}`,`SUMMARY:${calendarEscape(title)}`,`LOCATION:${calendarEscape(location)}`,`DESCRIPTION:${calendarEscape(description)}`,organizer?`ORGANIZER;CN=${calendarEscape(organizer.name||organizer.email)}:mailto:${organizer.email}`:'',attendeeLines,'STATUS:CONFIRMED','SEQUENCE:0','END:VEVENT','END:VCALENDAR'].filter(Boolean).join('\r\n');
}
function calendarComposeLinks({title,start,end,location,description}){
  const enc=encodeURIComponent,s=new Date(start).toISOString(),e=new Date(end).toISOString();
  return {outlook:`https://outlook.office.com/calendar/0/deeplink/compose?subject=${enc(title)}&body=${enc(description)}&location=${enc(location)}&startdt=${enc(s)}&enddt=${enc(e)}`,google:`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${enc(title)}&details=${enc(description)}&location=${enc(location)}&dates=${calendarUtcStamp(start)}/${calendarUtcStamp(end)}`};
}
function showOutlookLightForm(kind='board'){
  const p=currentProperty(),recipients=outlookLightRecipients(kind);
  const checks=recipients.map((r,i)=>`<label class="check-row recipient-email"><input class="meetingRecipient" type="checkbox" value="${esc(r.email)}" data-label="${esc(r.label)}" ${i===0?'checked':''}> <span>${esc(r.label)}</span><small>${esc(r.email)}</small></label>`).join('');
  const board=(DP.cache.contacts||[]).find(c=>/styreleder|leder|styre/i.test(String(c.role||c.contact_role||''))&&String(c.email||'').includes('@'));
  const reply=board?.email||p?.customer_billing_email||DP.user?.email||'';
  const start=new Date(Date.now()+86400000);start.setHours(18,0,0,0);const end=new Date(start.getTime()+90*60000);
  showDrawer('MÃ¸teinnkalling',`<div class="mail-compose meeting-compose"><div class="mail-template-head"><div><small>Outlook/Microsoft 365 light</small><h3>MÃ¸teinnkalling med kalenderfil</h3><p>Send innkalling fra kundens/styrets navn. Svar gÃ¥r til styret, og mottaker fÃ¥r kalenderfil som kan Ã¥pnes i Outlook, Apple Kalender og Google Kalender.</p></div><span>${esc(p?.name||'Eiendom')}</span></div><div class="form-grid two"><label>Tittel<input id="meetingTitle" value="StyremÃ¸te - ${esc(p?.name||'eiendom')}"></label><label>Sted / Teams-lenke<input id="meetingLocation" placeholder="Teams, mÃ¸terom eller adresse"></label><label>Start<input id="meetingStart" type="datetime-local" value="${localDateTimeValue(start)}"></label><label>Slutt<input id="meetingEnd" type="datetime-local" value="${localDateTimeValue(end)}"></label><label>Vis som avsender<input id="meetingFromName" value="Styret i ${esc(p?.name||'borettslaget')}"></label><label>Svar gÃ¥r til<input id="meetingReplyTo" value="${esc(reply)}" placeholder="styreleder@kunde.no"></label></div><label>Mottakere</label><div class="choice-list">${checks||'<div class="empty-state"><strong>Ingen mottakere funnet.</strong><span>Legg inn styremedlemmer eller beboere med e-post fÃ¸rst.</span></div>'}</div><label>Ekstra e-postadresser</label><input id="meetingExtra" placeholder="post@kunde.no, styret@kunde.no"><label>Agenda / melding</label><textarea id="meetingBody" rows="7">Hei,\n\nDu inviteres til mÃ¸te for ${esc(p?.name||'eiendommen')}.\n\nAgenda:\n1. Status drift og avvik\n2. Ã˜konomi og budsjett\n3. Dokumentasjon og FDV\n4. Eventuelle beslutninger\n\nVennlig hilsen\nStyret</textarea><div class="module-actions"><button class="action primary" onclick="sendOutlookLightInvite()">Send mÃ¸teinnkalling</button><button class="action" onclick="downloadMeetingIcs()">Last ned kalenderfil</button><button class="action" onclick="previewCalendarLinks()">Kalenderlenker</button></div><div id="meetingOut" class="output">Klar til sending.</div></div>`);
}
function meetingPayload(){
  const title=document.getElementById('meetingTitle')?.value.trim()||'MÃ¸te',location=document.getElementById('meetingLocation')?.value.trim()||'',start=document.getElementById('meetingStart')?.value,end=document.getElementById('meetingEnd')?.value,description=document.getElementById('meetingBody')?.value.trim()||'';
  if(!start||!end)throw new Error('Velg start og slutt for mÃ¸tet.');
  if(new Date(end)<=new Date(start))throw new Error('Sluttid mÃ¥ vÃ¦re etter starttid.');
  const checked=[...document.querySelectorAll('.meetingRecipient:checked')].map(x=>({email:x.value,label:x.dataset.label||x.value}));
  const extra=parseMailAddresses(document.getElementById('meetingExtra')?.value).map(email=>({email,label:email}));
  const attendees=[...checked,...extra].filter((r,i,a)=>a.findIndex(x=>x.email.toLowerCase()===r.email.toLowerCase())===i);
  if(!attendees.length)throw new Error('Velg minst en mottaker.');
  const replyTo=document.getElementById('meetingReplyTo')?.value.trim()||DP.user?.email||'',fromName=document.getElementById('meetingFromName')?.value.trim()||`Styret i ${currentProperty()?.name||'eiendommen'}`,links=calendarComposeLinks({title,start,end,location,description});
  const message=`${description}\n\nTid: ${new Date(start).toLocaleString('nb-NO')} - ${new Date(end).toLocaleString('nb-NO')}\nSted: ${location||'-'}\n\nKalenderlenker:\nOutlook: ${links.outlook}\nGoogle Kalender: ${links.google}`;
  const icsText=buildIcs({title,start,end,location,description,organizer:{email:replyTo,name:fromName},attendees});
  return {to:attendees.map(a=>a.email),subject:title,message,kind:'board',caseId:'meeting',property:currentProperty()?.name||'',property_id:currentProperty()?.id||'',reply_to:replyTo,from_name:fromName,ics:{filename:`${title.replace(/[^\wÃ¦Ã¸Ã¥Ã†Ã˜Ã…-]+/g,'-')}.ics`,content:calendarBase64(icsText)},links,icsText};
}
function downloadMeetingIcs(){
  try{const payload=meetingPayload(),blob=new Blob([payload.icsText],{type:'text/calendar;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=payload.ics.filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);const out=document.getElementById('meetingOut');if(out)out.textContent='Kalenderfil lastet ned.'}catch(e){setOutputError(document.getElementById('meetingOut'),e)}
}
function previewCalendarLinks(){
  try{const payload=meetingPayload();showDrawer('Kalenderlenker',`<div class="stack-list"><section class="mini-record"><div><strong>Outlook</strong><small>Ã…pne mÃ¸tet i Outlook-kalender</small></div><button class="action primary" onclick="window.open('${esc(payload.links.outlook)}','_blank')">Ã…pne</button></section><section class="mini-record"><div><strong>Google Kalender</strong><small>Ã…pne mÃ¸tet i Google Kalender</small></div><button class="action" onclick="window.open('${esc(payload.links.google)}','_blank')">Ã…pne</button></section></div>`)}catch(e){setOutputError(document.getElementById('meetingOut'),e)}
}
async function sendOutlookLightInvite(){
  const out=document.getElementById('meetingOut');
  try{const payload=meetingPayload();if(out)out.textContent='Sender mÃ¸teinnkalling...';if(location.protocol==='file:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')throw new Error('MÃ¸teinnkalling mÃ¥ sendes fra publisert Netlify-side.');const res=await fetch('/.netlify/functions/send-email',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const data=await readJsonResponse(res,'E-postfunksjonen svarte ikke riktig. PrÃ¸v igjen, eller kontakt Driftspartner Nord hvis feilen fortsetter.');if(!res.ok||!data.ok)throw new Error(data.message||'MÃ¸teinnkalling ble ikke sendt.');await insertActivity(`MÃ¸teinnkalling sendt: ${payload.subject}`,'meeting',currentProperty()?.id||'-');await finishAction(`MÃ¸teinnkalling sendt til ${payload.to.length} mottaker${payload.to.length===1?'':'e'}.`,'integrations')}catch(e){setOutputError(out,e,'MÃ¸teinnkalling kunne ikke sendes akkurat nÃ¥. Sjekk mottaker og prÃ¸v igjen fra live-siden.')}
}

function mailKindLabel(kind){
  return ({general:'Melding',all:'Alle kontakter',deviation:'Avvik',workorder:'Arbeidsordre',quote:'TilbudsforespÃ¸rsel',board:'Styresak',resident:'Beboere',manager:'Forvaltere',caretaker:'Vaktmestere',contract:'Kontrakt',purchase:'Bestilling',demo:'Demo'})[kind]||'Melding';
}
function collectMailRecipients(kind='general'){
  const contacts=DP.cache.contacts||[],suppliers=DP.suppliers||[],p=currentProperty();
  const rows=[];
  const add=(email,label,group)=>{email=String(email||'').trim();if(email.includes('@')&&!rows.some(r=>r.email.toLowerCase()===email.toLowerCase()))rows.push({email,label:label||email,group:group||'Kontakt'})};
  add(DP.user?.email,'Meg','Bruker');
  add(p?.customer_billing_email,'Kunde/faktura','Kunde');
  contacts.forEach(c=>{
    const role=String(c.role||c.contact_role||'Kontakt');
    if(kind==='all'){add(c.email,`${c.name||c.email} Â· ${role}`,'Eiendom');return}
    if(kind==='board'&&!/styre|leder|vara/i.test(role))return;
    if(kind==='resident'&&!/bebo|enhet|leilighet/i.test(role))return;
    if(kind==='manager'&&!/forvalt|manager/i.test(role))return;
    if(kind==='caretaker'&&!/vaktmester|drift|caretaker/i.test(role))return;
    add(c.email,`${c.name||c.email} Â· ${role}`,'Eiendom');
  });
  if(kind==='all'||kind==='quote'||kind==='workorder'||kind==='contract'||kind==='general')suppliers.forEach(s=>add(s.email,`${s.name||s.email} Â· ${s.trade||'LeverandÃ¸r'}`,'LeverandÃ¸r'));
  add('post@driftspartnernord.no','Driftspartner Nord','Admin');
  return rows;
}
function mailSubject(kind='general',caseId=''){
  const p=currentProperty(),name=p?.name||'valgt eiendom';
  if(kind==='all')return `Viktig melding - ${name}`;
  if(kind==='deviation')return `Avvik pÃ¥ ${name}`;
  if(kind==='workorder')return `Arbeidsordre pÃ¥ ${name}`;
  if(kind==='quote')return `TilbudsforespÃ¸rsel - ${name}`;
  if(kind==='board')return `Styresak - ${name}`;
  if(kind==='manager')return `OppfÃ¸lging for forvalter - ${name}`;
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
  if(kind==='deviation')return `${hello}Det er registrert et avvik pÃ¥ ${name}${address?', '+address:''}.\n\nSak: ${caseId||'-'}\n\nVennligst se pÃ¥ saken og gi tilbakemelding.`;
  if(kind==='workorder')return `${hello}Det er opprettet en arbeidsordre pÃ¥ ${name}${address?', '+address:''}.\n\nSak: ${caseId||'-'}\n\nOppgaven bes fulgt opp innen avtalt frist.${sign}`;
  if(kind==='quote')return `${hello}Vi Ã¸nsker tilbud pÃ¥ arbeid knyttet til ${name}${address?', '+address:''}.\n\nSak: ${caseId||'-'}\n\nSend pris, forbehold, leveringstid og relevant dokumentasjon.${sign}`;
  if(kind==='board')return `${hello}Dette gjelder styresak for ${name}.\n\nSak: ${caseId||'-'}\n\nSe saksgrunnlag og gi tilbakemelding/godkjenning.${sign}`;
  if(kind==='resident')return `${hello}Dette er en melding til beboere i ${name}.\n\nSkriv inn informasjonen som skal sendes til beboerne her.${sign}`;
  if(kind==='manager')return `${hello}Dette er en melding til forvalter for ${name}.\n\nSkriv inn hva som skal fÃ¸lges opp.${sign}`;
  if(kind==='caretaker')return `${hello}Dette er en driftsmelding til vaktmester for ${name}.\n\nSkriv inn oppgaven eller informasjonen som skal fÃ¸lges opp.${sign}`;
  if(kind==='contract')return `${hello}Vedlagt/lenket fÃ¸lger kontrakt eller avtalegrunnlag for ${name}.\n\nSak: ${caseId||'-'}\n\nVennligst gjennomgÃ¥ og bekreft videre prosess.${sign}`;
  return `${hello}Dette gjelder ${name}${address?', '+address:''}.\n\nSak: ${caseId||'-'}${sign}`;
}
function showEmailFlow(kind='general',caseId=''){
  const recipients=collectMailRecipients(kind);
  const checks=recipients.map((r,i)=>`<label class="check-row recipient-email"><input class="mailRecipient" type="checkbox" value="${esc(r.email)}" ${i===0?'checked':''}> <span>${esc(r.label)}</span><small>${esc(r.email)}</small></label>`).join('');
  const p=currentProperty();
  const board=(DP.cache.contacts||[]).find(c=>/styreleder|leder|styre/i.test(String(c.role||c.contact_role||''))&&String(c.email||'').includes('@'));
  const reply=board?.email||p?.customer_billing_email||DP.user?.email||'';
  const fromName=kind==='resident'||kind==='all'?`Styret i ${p?.name||'borettslaget'}`:`${p?.name||'Kunde'} via Driftspartner OS`;
  showDrawer('Send e-post',`<div class="mail-compose"><div class="mail-template-head"><div><small>${esc(mailKindLabel(kind))}</small><h3>Send direkte fra Driftspartner OS</h3><p>E-posten sendes trygt via Driftspartner, men vises med kundens/styrets navn. Svar gÃ¥r til adressen du velger under.</p></div><span>${esc(currentProperty()?.name||'Eiendom')}</span></div><div class="mail-audience-grid"><button class="${kind==='all'?'active':''}" onclick="showEmailFlow('all','${esc(caseId)}')">Alle</button><button class="${kind==='resident'?'active':''}" onclick="showEmailFlow('resident','${esc(caseId)}')">Beboere</button><button class="${kind==='board'?'active':''}" onclick="showEmailFlow('board','${esc(caseId)}')">Styre</button><button class="${kind==='manager'?'active':''}" onclick="showEmailFlow('manager','${esc(caseId)}')">Forvalter</button><button class="${kind==='caretaker'?'active':''}" onclick="showEmailFlow('caretaker','${esc(caseId)}')">Vaktmester</button></div><div class="form-grid two"><label>Vis som avsender<input id="emailFromName" value="${esc(fromName)}"></label><label>Svar gÃ¥r til<input id="emailReplyTo" value="${esc(reply)}" placeholder="styreleder@kunde.no"></label></div><p class="mail-field-note">Mottaker ser navnet over som avsender. Teknisk sendes e-posten fra godkjent Driftspartner-domene for best leveringssikkerhet.</p><label>Mottakere</label><div class="choice-list">${checks||'<div class="empty-state"><strong>Ingen mottakere funnet.</strong><span>Legg inn styre, beboere, forvalter eller vaktmester med e-post fÃ¸rst.</span></div>'}</div><label>Ekstra e-postadresser</label><input id="emailExtra" placeholder="post@kunde.no, styret@kunde.no"><p class="mail-field-note">Du kan sende til flere ved Ã¥ skille e-postadresser med komma eller linjeskift.</p><label>Emne</label><input id="emailSubject" value="${esc(mailSubject(kind,caseId))}"><label>Melding</label><textarea id="emailBody">${esc(mailBody(kind,caseId))}</textarea><div class="module-actions"><button class="action primary" onclick="sendEmailLog('${esc(kind)}','${esc(caseId)}')">Send som kunde/styre</button><button class="action" onclick="location.href='mail-test.html'">Ã…pne e-posttest</button></div><div id="emailOut" class="output">Klar til sending.</div></div>`);
}
function parseMailAddresses(value){return String(value||'').split(/[,\n;\s]+/).map(x=>x.trim()).filter(x=>x.includes('@'))}
function emailPayloadFromForm(kind='general',caseId=''){
  const checked=[...document.querySelectorAll('.mailRecipient:checked')].map(x=>x.value);
  const extra=parseMailAddresses(document.getElementById('emailExtra')?.value);
  const to=[...new Set([...checked,...extra].map(x=>String(x).trim()).filter(x=>x.includes('@')))];
  const subject=document.getElementById('emailSubject')?.value.trim()||'Melding fra Driftspartner OS';
  const message=document.getElementById('emailBody')?.value.trim()||'';
  if(!to.length)throw new Error('Velg minst Ã©n mottaker eller skriv inn en e-postadresse.');
  if(!message)throw new Error('Skriv en melding fÃ¸r du sender.');
  const fromName=document.getElementById('emailFromName')?.value.trim()||`Styret i ${currentProperty()?.name||'eiendommen'}`;
  const replyTo=document.getElementById('emailReplyTo')?.value.trim()||DP.user?.email||'';
  return {to,subject,message,kind,caseId,property:currentProperty()?.name||'',property_id:currentProperty()?.id||'',reply_to:replyTo,from_name:fromName};
}
async function sendEmailLog(kind='general',caseId=''){
  const out=document.getElementById('emailOut');
  try{
    const payload=emailPayloadFromForm(kind,caseId);
    if(typeof packageLimitStatus==='function'){
      const quota=packageLimitStatus('emails');
      const label=typeof planName==='function'?planName():'Pakken';
      if(quota.limit>0&&quota.used+payload.to.length>quota.limit)throw new Error(`${label} inkluderer ${quota.limit} e-postmottakere per 30 dager. Du har ${Math.max(0,quota.limit-quota.used)} igjen.`);
    }
    if(out)out.textContent='Sender e-post...';
    if(location.protocol==='file:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')throw new Error('Direkte e-post mÃ¥ testes fra publisert Netlify-side.');
    const res=await fetch('/.netlify/functions/send-email',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const data=await readJsonResponse(res,'E-postfunksjonen svarte ikke riktig. PrÃ¸v igjen, eller kontakt Driftspartner Nord hvis feilen fortsetter.');
    if(!res.ok||!data.ok)throw new Error(data.message||'E-post ble ikke sendt.');
    await insertActivity(`E-post sendt: ${mailKindLabel(kind)}`,'email',caseId||currentProperty()?.id||'-');
    await finishAction(`E-post sendt til ${payload.to.length} mottaker${payload.to.length===1?'':'e'}.`,DP.module||'dashboard');
  }catch(e){setOutputError(out,e,'E-post kunne ikke sendes akkurat nÃ¥. Sjekk mottaker og prÃ¸v igjen fra live-siden.')}
}
async function sendEmailMicrosoft(kind='general',caseId=''){
  const out=document.getElementById('emailOut');
  try{
    const payload=emailPayloadFromForm(kind,caseId);
    if(!DP.session?.access_token)throw new Error('Logg inn fÃ¸r du sender fra Outlook.');
    if(out)out.textContent='Sender via tilkoblet Outlook-konto...';
    if(location.protocol==='file:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')throw new Error('Outlook-sending mÃ¥ testes fra publisert Netlify-side.');
    const res=await fetch('/.netlify/functions/microsoft-send-mail',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${DP.session.access_token}`},body:JSON.stringify(payload)});
    const data=await readJsonResponse(res,'Outlook-funksjonen svarte ikke riktig. PrÃ¸v igjen, eller kontakt Driftspartner Nord hvis feilen fortsetter.');
    if(!res.ok||!data.ok)throw new Error(data.message||'E-post ble ikke sendt via Outlook.');
    await insertActivity(`E-post sendt fra Outlook: ${mailKindLabel(kind)}`,'email',caseId||currentProperty()?.id||'-');
    await finishAction(`E-post sendt fra ${data.from||'tilkoblet Outlook-konto'} til ${payload.to.length} mottaker${payload.to.length===1?'':'e'}.`,DP.module||'dashboard');
  }catch(e){setOutputError(out,e,'Outlook-sending kunne ikke fullfÃ¸res. Koble Microsoft 365 og prÃ¸v igjen.')}
}
window.showEmailFlow=showEmailFlow;
window.sendEmailLog=sendEmailLog;
window.connectMicrosoft365=connectMicrosoft365;
window.sendEmailMicrosoft=sendEmailMicrosoft;
window.showOutlookLightForm=showOutlookLightForm;
window.sendOutlookLightInvite=sendOutlookLightInvite;
window.downloadMeetingIcs=downloadMeetingIcs;
window.previewCalendarLinks=previewCalendarLinks;

function subscriptionPlans(){
  return [
    {id:'start',name:'Start',firstYear:9990,yearTwo:11880,unit:'For mindre sameier og borettslag',fit:'Opptil 20 enheter',items:['1 bygg','Opptil 20 enheter','5 styremedlemmer','20 beboere','5 leverandÃ¸rer','200 dokumenter / 2 GB','300 e-postmottakere per 30 dager','FDV-arkiv','DokumenthÃ¥ndtering','AvvikshÃ¥ndtering','Basisanbefalinger','50 AI-klikk per mÃ¥ned','Styreportal','Mobiltilgang']},
    {id:'pro',name:'Pro',firstYear:19990,yearTwo:23880,unit:'For de fleste sameier og borettslag',fit:'20-100 enheter',items:['Alt i Start','Inntil 10 bygg','Opptil 100 enheter','100 beboere','Ubegrenset antall styremedlemmer','5 vaktmester/forvalter-brukere','50 leverandÃ¸rer','2000 dokumenter / 20 GB','3000 e-postmottakere per 30 dager','AI Director','150 AI-klikk per mÃ¥ned','Vedlikeholdsplan','Arbeidsordre','LeverandÃ¸rregister','Budsjettoversikt','Avansert rapportering']},
    {id:'premium',name:'Premium',firstYear:39990,yearTwo:47880,unit:'For stÃ¸rre borettslag og eiendomsaktÃ¸rer',fit:'100+ enheter',items:['Alt i Pro','Inntil 50 bygg','Opptil 1000 enheter','1000 beboere','Ubegrenset antall styremedlemmer','25 vaktmester/forvalter-brukere','500 leverandÃ¸rer','10 000 dokumenter / 100 GB','10 000 e-postmottakere per 30 dager','500 AI-klikk per mÃ¥ned','10 eiendommer per kunde','500 RFQ per mÃ¥ned','100 aktive prosjekter','100 signeringer per mÃ¥ned','Property Brain AI','Risikoanalyse','Tilbudsinnhenting (RFQ)','Prioritert support','Avanserte analyser','Enterprise-tillegg ved hÃ¸yere bruk']}
  ];
}
function selectedSubscriptionPlan(){return subscriptionPlans().find(p=>p.id===(DP.onboardingSubscription||'pro'))||subscriptionPlans()[1]}
function renderSubscriptionCards(){
  const selected=selectedSubscriptionPlan().id;
  return `<div class="subscription-grid">${subscriptionPlans().map(p=>`<button type="button" class="subscription-card ${p.id===selected?'selected':''}" onclick="selectOnboardingSubscription('${p.id}')"><span>${esc(p.name)}</span><strong>${money(p.firstYear)}</strong><small>FÃ¸rste Ã¥r Â· faktureres Ã¥rlig</small><em>Ã…r 2: ${money(p.yearTwo)} for 12 mnd</em><p>${esc(p.unit)}</p><p class="fit">Passer for ${esc(p.fit)}</p><ul>${p.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></button>`).join('')}</div><input id="obSubscriptionPlan" type="hidden" value="${esc(selected)}"><div id="obSubscriptionSummary" class="output">${subscriptionSummaryText()}</div>`;
}
function subscriptionSummaryText(){const p=selectedSubscriptionPlan();return `${p.name} valgt. FÃ¸rste Ã¥r: ${money(p.firstYear)}. Ã…r 2 faktureres for 12 mÃ¥neder: ${money(p.yearTwo)}. Endelig avtale bekreftes skriftlig fÃ¸r oppstart.`}
function selectOnboardingSubscription(id){DP.onboardingSubscription=id;const wrap=document.getElementById('obSubscriptionWrap');if(wrap)wrap.innerHTML=renderSubscriptionCards()}

function showNewCustomerWizard(){
  if(typeof canManageCustomers==='function'&&!canManageCustomers()){showDrawer('Ingen tilgang','<div class="empty-state"><strong>Ny kunde kan bare opprettes av intern admin.</strong><span>Kontakt Driftspartner Nord hvis kunden trenger ny eiendom eller ny konto.</span></div>');return}
  ensureOnboardingDraft();
  showDrawer('Ny kunde - onboarding',`<div class="onboarding-flow premium-onboarding"><div class="ops-budget-summary"><div><small>1</small><b>Kunde</b></div><div><small>2</small><b>Eiendom</b></div><div><small>3</small><b>Styre/beboere</b></div><div><small>4</small><b>LeverandÃ¸rer</b></div><div><small>5</small><b>FDV/Ã¸konomi</b></div><div><small>6</small><b>Abonnement</b></div><div><small>7</small><b>Brukere</b></div></div><section class="onboarding-required-box"><div><strong>Minimum for Ã¥ opprette kunde</strong><span>Disse feltene mÃ¥ vÃ¦re fylt ut fÃ¸r systemet lagrer kunden.</span></div><ul><li>Kundenavn</li><li>Eiendomsnavn</li><li>Adresse</li><li>Type eiendom</li><li>Antall enheter</li><li>Minst Ã©n styreleder med e-post</li><li>Abonnement</li></ul></section><h3>Kunde</h3><div class="onboarding-entry-grid two"><label>Kundenavn <span class="required-pill">MÃ¥ fylles ut</span><input id="obCustomerName" data-required="Kundenavn" placeholder="Nytt Borettslag"></label><label>Org.nr <span class="optional-pill">Kan vente</span><div class="lookup-row"><input id="obOrgNo" placeholder="9 siffer"><button class="action" onclick="lookupBrregCustomer()">Hent</button></div></label></div><div id="obBrregOut" class="output">Bruk org.nr-oppslag for Ã¥ fylle kunde og adresse fra BrÃ¸nnÃ¸ysund.</div><h3>Eiendom</h3><label>Eiendomsnavn <span class="required-pill">MÃ¥ fylles ut</span></label><input id="obPropertyName" data-required="Eiendomsnavn"><label>Adresse <span class="required-pill">MÃ¥ fylles ut</span></label><input id="obAddress" data-required="Adresse"><div class="split"><div><label>Type <span class="required-pill">MÃ¥ fylles ut</span></label><input id="obType" data-required="Type eiendom" placeholder="Borettslag / sameie"></div><div><label>Antall enheter <span class="required-pill">MÃ¥ fylles ut</span></label><input id="obUnits" data-required="Antall enheter" type="number" min="1"></div></div><div class="split"><div><label>Gnr <span class="optional-pill">Kan vente</span></label><input id="obGnr"></div><div><label>Bnr <span class="optional-pill">Kan vente</span></label><input id="obBnr"></div></div><label>Teknisk sammendrag <span class="optional-pill">Kan vente</span></label><textarea id="obTech"></textarea><section class="onboarding-section"><div><h3>Styre <span class="required-pill">Minst Ã©n styreleder</span></h3><p class="muted">Legg inn ett styremedlem om gangen. For oppstart mÃ¥ minst Ã©n styreleder ha e-post.</p></div><div class="onboarding-entry-grid"><label>Navn<input id="obBoardName" placeholder="Kari Nordmann"></label><label>Rolle<select id="obBoardRole"><option>Styreleder</option><option>Nestleder</option><option>Styremedlem</option><option>Vara</option></select></label><label>E-post<input id="obBoardEmail" type="email" placeholder="kari@kunde.no"></label><label>Telefon<input id="obBoardPhone" placeholder="90000000"></label></div><section class="inline-option"><label><input id="obBoardCreateLogin" type="checkbox" checked> Opprett innlogging og send e-post</label><small>Styreleder fÃ¥r styreledertilgang. Styremedlem, nestleder og vara fÃ¥r styremedlemtilgang.</small><label>Midlertidig passord</label><input id="obBoardPassword" placeholder="La stÃ¥ tomt for automatisk passord"></section><button class="action" onclick="addOnboardingBoard()">Legg til styremedlem</button><div id="obBoardList" class="stack-list"></div></section><section class="onboarding-section"><div><h3>Beboere <span class="optional-pill">Kan fylles senere</span></h3><p class="muted">Legg inn Ã©n beboer eller enhet om gangen.</p></div><div class="onboarding-entry-grid"><label>Navn<input id="obResidentName" placeholder="Ola Nordmann"></label><label>Enhet/rolle<input id="obResidentUnit" placeholder="A-101 / Beboer"></label><label>E-post<input id="obResidentEmail" type="email"></label><label>Telefon<input id="obResidentPhone"></label></div><section class="inline-option"><label><input id="obResidentCreateLogin" type="checkbox" checked> Opprett innlogging og send e-post</label><small>Beboeren fÃ¥r bare beboertilgang til valgt eiendom.</small><label>Midlertidig passord</label><input id="obResidentPassword" placeholder="La stÃ¥ tomt for automatisk passord"></section><button class="action" onclick="addOnboardingResident()">Legg til beboer</button><div id="obResidentList" class="stack-list"></div></section><section class="onboarding-section"><div><h3>LeverandÃ¸rer <span class="optional-pill">Kan fylles senere</span></h3><p class="muted">Legg inn Ã©n leverandÃ¸r om gangen.</p></div><div class="onboarding-entry-grid"><label>Org.nr<input id="obSupplierOrgNo" placeholder="9 siffer"></label><label>Firma<input id="obSupplierName" placeholder="Nord Tak AS"></label><label>E-post<input id="obSupplierEmail" type="email" placeholder="post@nordtak.no"></label><label>FagomrÃ¥de<select id="obSupplierTrade">${supplierTradeOptions()}</select></label></div><button class="action" onclick="lookupBrregOnboardingSupplier()">Hent leverandÃ¸r</button><button class="action" onclick="addOnboardingSupplier()">Legg til leverandÃ¸r</button><div id="obSupplierLookupOut" class="output">Org.nr-oppslag kan fylle firmanavn automatisk.</div><div id="obSupplierList" class="stack-list"></div></section><h3>FDV-mapper <span class="recommended-pill">Anbefalt</span></h3><textarea id="obFolders" rows="3">Bygg\nVVS\nElektro\nBrann\nVentilasjon\nTak\nFasade\nHeis\nHMS\nForsikring\nGarantier\nTegninger\nKontrakter\nServiceavtaler</textarea><h3>Ã˜konomi <span class="recommended-pill">Anbefalt</span></h3><div class="split"><div><label>Bank/konto</label><input id="obBank" type="number" value="0"></div><div><label>Reservefond</label><input id="obReserve" type="number" value="0"></div></div><label>Prosjektmidler</label><input id="obProjectFunds" type="number" value="0"><section class="onboarding-section subscription-section"><div><h3>Abonnement <span class="required-pill">MÃ¥ velges</span></h3><p class="muted">Velg pakken kunden skal starte pÃ¥. FÃ¸rste Ã¥r har introduksjonspris, Ã¥r 2 faktureres for 12 mÃ¥neder.</p></div><div id="obSubscriptionWrap">${renderSubscriptionCards()}</div></section><section class="onboarding-section"><div><h3>Inviter brukere <span class="recommended-pill">Anbefalt</span></h3><p class="muted">Brukeren fÃ¥r e-post med innlogging og midlertidig passord nÃ¥r kunden opprettes.</p></div><div class="onboarding-entry-grid"><label>Navn<input id="obUserName"></label><label>E-post<input id="obUserEmail" type="email"></label><label>Rolle<select id="obUserRole"><option value="styreleder">Styreleder</option><option value="styremedlem">Styremedlem</option><option value="forvalter">Forvalter</option><option value="beboer">Beboer</option><option value="vaktmester">Vaktmester</option><option value="leverandor">LeverandÃ¸r</option></select></label><label>Telefon<input id="obUserPhone"></label></div><label>Midlertidig passord</label><input id="obUserPassword" placeholder="Start1234!"><button class="action" onclick="addOnboardingUser()">Legg til bruker</button><div id="obUserList" class="stack-list"></div></section><button class="action primary" onclick="runNewCustomerOnboarding()">Opprett kunde</button><div id="obOut" class="output">Klar. Fyll ut feltene merket â€œMÃ¥ fylles utâ€, legg til styreleder og trykk Opprett kunde.</div></div>`);
  setTimeout(renderOnboardingDraftLists,0);
}
function ensureOnboardingDraft(){DP.onboardingDraft=DP.onboardingDraft||{board:[],residents:[],suppliers:[],users:[]};return DP.onboardingDraft}
function obVal(id){return String(document.getElementById(id)?.value||'').trim()}
function clearOb(ids){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value=''})}
function onboardingNotice(message){const out=document.getElementById('obOut');if(out)out.textContent=message;else alert(message)}
function onboardingPlanLimit(kind){return typeof packageLimitsForPlan==='function'?packageLimitsForPlan(selectedSubscriptionPlan().id)[kind]||0:0}
function onboardingDraftCount(kind){
  const draft=ensureOnboardingDraft();
  if(kind==='board')return draft.board.length;
  if(kind==='residents')return draft.residents.length;
  if(kind==='suppliers')return draft.suppliers.length;
  if(kind==='caretakers')return draft.users.filter(u=>/vaktmester|forvalter/i.test(String(u.role||''))).length;
  return 0;
}
function assertOnboardingLimit(kind,label,add=1){
  const limit=onboardingPlanLimit(kind),used=onboardingDraftCount(kind);
  if(limit>0&&used+add>limit){onboardingNotice(`${selectedSubscriptionPlan().name} inkluderer ${limit} ${label}. Velg en stÃ¸rre pakke eller fjern noen fra listen.`);return false}
  return true;
}
async function lookupBrregCustomer(){
  try{
    setFieldText('obBrregOut','Henter kundeinformasjon fra BrÃ¸nnÃ¸ysund...');
    const entity=await lookupBrregOrg(obVal('obOrgNo'));
    const address=brregAddress(entity),form=brregForm(entity);
    setFieldValue('obOrgNo',entity.organisasjonsnummer||orgDigits(obVal('obOrgNo')));
    setFieldValue('obCustomerName',entity.navn||'');
    if(!obVal('obPropertyName'))setFieldValue('obPropertyName',entity.navn||'');
    if(address&&!obVal('obAddress'))setFieldValue('obAddress',address);
    if(form&&!obVal('obType'))setFieldValue('obType',form);
    setFieldText('obBrregOut',`Fant ${entity.navn||'kunde'} Â· ${entity.organisasjonsnummer||''}${form?' Â· '+form:''}${address?' Â· '+address:''}`);
  }catch(e){setFieldText('obBrregOut',customerError(e,'Kunne ikke hente kundeinformasjon. Sjekk org.nr og prÃ¸v igjen.'))}
}
async function lookupBrregOnboardingSupplier(){
  try{
    setFieldText('obSupplierLookupOut','Henter leverandÃ¸r fra BrÃ¸nnÃ¸ysund...');
    const entity=await lookupBrregOrg(obVal('obSupplierOrgNo'));
    const address=brregAddress(entity);
    setFieldValue('obSupplierOrgNo',entity.organisasjonsnummer||orgDigits(obVal('obSupplierOrgNo')));
    setFieldValue('obSupplierName',entity.navn||'');
    if(entity.naeringskode1?.beskrivelse)setFieldValue('obSupplierTrade',supplierTradeFromText(entity.naeringskode1.beskrivelse));
    setFieldText('obSupplierLookupOut',`Fant ${entity.navn||'leverandÃ¸r'} Â· ${entity.organisasjonsnummer||''}${address?' Â· '+address:''}`);
  }catch(e){setFieldText('obSupplierLookupOut',customerError(e,'Kunne ikke hente leverandÃ¸r. Sjekk org.nr og prÃ¸v igjen.'))}
}
function onboardingList(items,type,empty){
  if(!items.length)return `<div class="empty-state"><strong>${esc(empty)}</strong></div>`;
  return items.map((item,i)=>`<section class="mini-record onboarding-item"><div><strong>${esc(item.name)}</strong><small>${esc([item.org_no,item.role||item.unit||item.trade,item.email,item.phone,item.create_login?'innlogging sendes':''].filter(Boolean).join(' Â· '))}</small></div><button class="action red" onclick="removeOnboardingItem('${type}',${i})">Fjern</button></section>`).join('');
}
function renderOnboardingDraftLists(){
  const draft=ensureOnboardingDraft();
  const board=document.getElementById('obBoardList'),residents=document.getElementById('obResidentList'),suppliers=document.getElementById('obSupplierList'),users=document.getElementById('obUserList');
  if(board)board.innerHTML=onboardingList(draft.board,'board','Ingen styremedlemmer lagt inn ennÃ¥.');
  if(residents)residents.innerHTML=onboardingList(draft.residents,'residents','Ingen beboere lagt inn ennÃ¥.');
  if(suppliers)suppliers.innerHTML=onboardingList(draft.suppliers,'suppliers','Ingen leverandÃ¸rer lagt inn ennÃ¥.');
  if(users)users.innerHTML=onboardingList(draft.users,'users','Ingen brukere lagt inn ennÃ¥.');
}
function removeOnboardingItem(type,index){const draft=ensureOnboardingDraft();if(draft[type])draft[type].splice(index,1);renderOnboardingDraftLists()}
function addOnboardingBoard(){
  const name=obVal('obBoardName');if(!name)return onboardingNotice('Fyll inn navn p? styremedlem.');
  if(!assertOnboardingLimit('board','styremedlemmer'))return;
  const createLogin=Boolean(document.getElementById('obBoardCreateLogin')?.checked),email=obVal('obBoardEmail'),role=obVal('obBoardRole')||'Styremedlem';
  if(createLogin&&!email.includes('@'))return onboardingNotice('Fyll inn e-post n?r styret skal f? innlogging.');
  ensureOnboardingDraft().board.push({name,role,email,phone:obVal('obBoardPhone'),create_login:createLogin,password:obVal('obBoardPassword')});
  clearOb(['obBoardName','obBoardEmail','obBoardPhone','obBoardPassword']);const cb=document.getElementById('obBoardCreateLogin');if(cb)cb.checked=true;renderOnboardingDraftLists();
}
function addOnboardingResident(){
  const name=obVal('obResidentName');if(!name)return onboardingNotice('Fyll inn navn p? beboer.');
  if(!assertOnboardingLimit('residents','beboere'))return;
  const createLogin=Boolean(document.getElementById('obResidentCreateLogin')?.checked),email=obVal('obResidentEmail');
  if(createLogin&&!email.includes('@'))return onboardingNotice('Fyll inn e-post n?r beboer skal f? innlogging.');
  ensureOnboardingDraft().residents.push({name,role:'Beboer',unit:obVal('obResidentUnit')||'Beboer',email,phone:obVal('obResidentPhone'),create_login:createLogin,password:obVal('obResidentPassword')});
  clearOb(['obResidentName','obResidentUnit','obResidentEmail','obResidentPhone','obResidentPassword']);const cb=document.getElementById('obResidentCreateLogin');if(cb)cb.checked=true;renderOnboardingDraftLists();
}
function addOnboardingSupplier(){
  const name=obVal('obSupplierName'),email=obVal('obSupplierEmail');if(!name||!email)return onboardingNotice('Fyll inn firma og e-post.');
  if(!assertOnboardingLimit('suppliers','leverand?rer'))return;
  ensureOnboardingDraft().suppliers.push({name,email,trade:obVal('obSupplierTrade'),org_no:obVal('obSupplierOrgNo')});
  clearOb(['obSupplierOrgNo','obSupplierName','obSupplierEmail','obSupplierTrade']);setFieldText('obSupplierLookupOut','Org.nr-oppslag kan fylle firmanavn automatisk.');renderOnboardingDraftLists();
}
function addOnboardingUser(){
  const name=obVal('obUserName'),email=obVal('obUserEmail'),role=obVal('obUserRole');if(!name||!email||!role)return onboardingNotice('Fyll inn navn, e-post og rolle.');
  if(/styreleder|styremedlem/.test(role)&&!assertOnboardingLimit('board','styremedlemmer'))return;
  if(role==='beboer'&&!assertOnboardingLimit('residents','beboere'))return;
  if(/vaktmester|forvalter/.test(role)&&!assertOnboardingLimit('caretakers','vaktmester/forvalter-brukere'))return;
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
  if(obVal('obUnits')&&(!Number.isFinite(units)||units<1)){missing.push('Antall enheter mÃ¥ vÃ¦re minst 1');ids.push('obUnits')}
  const unitLimit=onboardingPlanLimit('units');
  if(unitLimit>0&&units>unitLimit){missing.push(`${selectedSubscriptionPlan().name} inkluderer opptil ${unitLimit} enheter`);ids.push('obUnits')}
  const hasBoardLead=draft.board.some(x=>/styreleder|leder/i.test(String(x.role||''))&&String(x.email||'').includes('@'));
  const inlineBoardLead=/styreleder|leder/i.test(obVal('obBoardRole'))&&obVal('obBoardName')&&obVal('obBoardEmail').includes('@');
  if(!hasBoardLead&&!inlineBoardLead)missing.push('Legg til minst Ã©n styreleder med e-post');
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
function validateOnboardingPackageLimits(){
  const draft=ensureOnboardingDraft(),limits=typeof packageLimitsForPlan==='function'?packageLimitsForPlan(selectedSubscriptionPlan().id):{};
  const issues=[],plan=selectedSubscriptionPlan().name;
  if(limits.board&&draft.board.length>limits.board)issues.push(`${plan} inkluderer maks ${limits.board} styremedlemmer`);
  if(limits.residents&&draft.residents.length>limits.residents)issues.push(`${plan} inkluderer maks ${limits.residents} beboere`);
  if(limits.suppliers&&draft.suppliers.length>limits.suppliers)issues.push(`${plan} inkluderer maks ${limits.suppliers} leverand?rer`);
  const caretakers=draft.users.filter(u=>/vaktmester|forvalter/i.test(String(u.role||''))).length;
  if(limits.caretakers&&caretakers>limits.caretakers)issues.push(`${plan} inkluderer maks ${limits.caretakers} vaktmester/forvalter-brukere`);
  return {ok:!issues.length,missing:issues,ids:[]};
}
function renderOnboardingValidationError(result){
  const out=document.getElementById('obOut');
  setOnboardingMissingState(result.ids);
  const html=`<div class="validation-box"><strong>FÃ¸r kunden kan opprettes mÃ¥ dette fylles ut:</strong><ul>${result.missing.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><span>Fyll inn punktene over og trykk â€œOpprett kundeâ€ pÃ¥ nytt.</span></div>`;
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
  throw lastError||new Error('Ã˜konomi kunne ikke lagres.');
}
function onboardingAdminError(error,step='Onboarding'){
  const msg=String(error?.message||error||'').trim();
  if(!msg)return `${step} kunne ikke fullfÃ¸res.`;
  if(/row level|rls|policy|permission|not authorized|violates row-level/i.test(msg))return `${step}: brukeren har ikke tilgang til Ã¥ lagre dette. Logg inn som intern admin, eller kontakt Driftspartner Nord.`;
  if(/relation .* does not exist|does not exist|column .* does not exist|Could not find .* column|schema cache|column/i.test(msg))return `${step}: systemoppsettet mangler noe for denne handlingen. Kontakt Driftspartner Nord.`;
  if(/duplicate|already registered|already exists|User already/i.test(msg))return `${step}: brukeren eller raden finnes allerede. Sjekk e-post/eksisterende bruker.`;
  if(/foreign key|violates foreign/i.test(msg))return `${step}: koblingen til kunde eller eiendom mangler. PrÃ¸v igjen etter at kunde og eiendom er opprettet.`;
  if(/invalid input value|check constraint|violates check/i.test(msg))return `${step}: en verdi passer ikke med databaseoppsettet. Sjekk type, rolle eller status.`;
  return `${step}: ${customerError(msg)}`;
}
async function createOnboardingUser(row,propertyId){
  const token=DP.session?.access_token;if(!token)throw new Error('Mangler innlogging.');
  const [name,email,roleRaw,phone,password]=row;
  if(!name||!email||!roleRaw)return null;
  const role=normalizeRole(roleRaw),access={beboer:'resident',styreleder:'owner',styremedlem:'member',forvalter:'owner',vaktmester:'caretaker',leverandor:'vendor'}[role]||'member';
  const res=await fetch('/.netlify/functions/create-user',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({name,email,phone,role,property_id:propertyId,access_role:access,password})});
  const data=await readJsonResponse(res,'Bruker-tjenesten svarte ikke riktig. PrÃ¸v igjen, eller kontakt Driftspartner Nord hvis feilen fortsetter.');
  if(!data.ok)throw new Error(data.message||'Bruker kunne ikke opprettes.');
  return data.user;
}
async function runNewCustomerOnboarding(){
  const out=document.getElementById('obOut');
  let step='Starter onboarding';
  try{
    if(typeof canManageCustomers==='function'&&!canManageCustomers())throw new Error('Ny kunde kan bare opprettes av intern admin.');
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
    step='Lagrer leverandÃ¸rer';
    const suppliers=draft.suppliers.map(r=>({name:r.name||'',email:r.email||'',trade:r.trade||'',status:'active'})).filter(r=>r.name&&r.email);
    await safeInsertMany('suppliers',suppliers);log.push(`${suppliers.length} leverandÃ¸rer lagt inn`);
    step='Oppretter FDV-mapper';
    const folders=String(obFolders.value||'').split(/\n+/).map(name=>name.trim()).filter(Boolean).map(name=>({property_id:propertyId,name,parent_id:null}));
    const folderResult=await safeInsertMany('document_folders',folders);log.push(folderResult.skipped?'FDV-mapper hoppet over: tabell mangler':`${folders.length} FDV-mapper opprettet`);
    step='Lagrer Ã¸konomi';
    const finance=await safeUpsertFinance({property_id:propertyId,bank_balance:+obBank.value||0,reserved_funds:+obReserve.value||0,project_funds:+obProjectFunds.value||0,updated_at:new Date().toISOString()});
    log.push(finance.skipped?'Ã˜konomi hoppet over: Ã¸konomitabell mangler':'Ã˜konomi grunnlag lagret');
    step='Oppretter brukere og sender e-post';
    const boardUsers=draft.board.filter(r=>r.create_login&&r.email).map(r=>[r.name,r.email,/styreleder|leder/i.test(String(r.role||''))?'styreleder':'styremedlem',r.phone,r.password]);
    const residentUsers=draft.residents.filter(r=>r.create_login&&r.email).map(r=>[r.name,r.email,'beboer',r.phone,r.password]);
    const users=[...boardUsers,...residentUsers,...draft.users.map(r=>[r.name,r.email,r.role,r.phone,r.password])];let userCount=0;
    for(const userRow of users){await createOnboardingUser(userRow,propertyId);userCount++}
    log.push(`${userCount} brukere opprettet/invitert`);
    await insertActivity('Ny kunde onboardet','onboarding',propertyId);
    await loadProperties();DP.propertyId=propertyId;
    DP.onboardingDraft={board:[],residents:[],suppliers:[],users:[]};
    await finishAction(`Kunden er opprettet. ${log.join(' Â· ')}`,'property');
  }catch(e){
    const message=onboardingAdminError(e,step);
    if(out)out.innerHTML=`<div class="validation-box"><strong>Onboarding stoppet</strong><p>${esc(message)}</p><span>Kunde eller eiendom kan allerede vÃ¦re delvis opprettet. Sjekk Eiendom-listen fÃ¸r du prÃ¸ver pÃ¥ nytt.</span></div>`;
    console.error('Onboarding failed at',step,e);
  }
}







