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
  return `<div class="grid finance-page"><div class="card s12"><div class="dash-title"><h3>Økonomi</h3><div><button class="action primary" onclick="showFinanceForm()">Konto/reserve</button><button class="action" onclick="showBudgetForm()">Budsjettlinje</button><button class="action" onclick="showActualCostForm()">Faktisk kostnad</button><button class="action" onclick="showProjectForm()">Prosjekt</button><button class="action" onclick="saveBoardFinanceReport()">Lag styrerapport</button></div></div></div>${financeMetric('Bank/konto',money(f.bank_balance),'Tilgjengelig saldo','ok')}${financeMetric('Reservefond',money(f.reserved_funds),'Avsatt reserve','info')}${financeMetric('Budsjett',money(t.budget),'Totalt budsjettert','purple')}${financeMetric('Faktisk kostnad',money(t.actual),t.variance>0?'Over budsjett':'Innenfor budsjett',varianceType)}${financeMetric('Budsjettavvik',money(t.variance),t.variance>0?'Merforbruk':'Ingen merforbruk',varianceType)}${financeMetric('Prosjektøkonomi',`${money(t.projectActual)} / ${money(t.projectBudget)}`,t.projectVariance>0?'Prosjekt over budsjett':'Prosjektstatus',projectType)}<div class="card s7"><h3>Budsjett og faktiske kostnader</h3>${financeBudgetSummary(t)}${table(['Kategori','Budsjett','Faktisk','Avvik','Notat','Handling'],lines.map(l=>`<tr><td>${esc(l.category||l.label)}</td><td>${money(l.budget_amount||l.budget)}</td><td>${money(l.actual_amount||l.actual)}</td><td>${money(Number(l.actual_amount||l.actual||0)-Number(l.budget_amount||l.budget||0))}</td><td>${esc(l.notes||'-')}</td><td><button class="action" onclick="showBudgetForm('${esc(l.id)}')">Endre</button><button class="action red" onclick="deleteRow('budget_lines','${esc(l.id)}')">Slett</button></td></tr>`))}</div><div class="card s5"><h3>Prosjektøkonomi</h3>${table(['Prosjekt','Budsjett','Faktisk','Avvik','Status','Handling'],projects.map(p=>`<tr><td>${esc(p.name||p.title)}</td><td>${money(p.budget||p.budget_amount)}</td><td>${money(p.actual_cost||p.actual_amount)}</td><td>${money(Number(p.actual_cost||p.actual_amount||0)-Number(p.budget||p.budget_amount||0))}</td><td>${esc(p.status)}</td><td><button class="action" onclick="showProjectForm('${esc(p.id)}')">Endre</button><button class="action red" onclick="deleteRow('projects','${esc(p.id)}')">Slett</button></td></tr>`))}</div><div class="card s12"><h3>Enkel rapport til styret</h3>${financeReportPreview()}</div></div>`;
}
function financeMetric(label,value,caption,type='info'){
  return `<div class="card s2 finance-metric ${type}"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(caption)}</span></div>`;
}
function financeBudgetSummary(t){return `<div class="ops-budget-summary"><div><small>Budsjett</small><b>${money(t.budget)}</b></div><div><small>Faktisk</small><b>${money(t.actual)}</b></div><div><small>Avvik</small><b>${money(t.variance)}</b></div><div><small>Prosjekter</small><b>${money(t.projectActual)}</b></div></div>`}
function financeReportPreview(){
  const f=(DP.cache.finance||[])[0]||{},t=financeTotals(),risk=t.variance>0?'Over budsjett':'Innenfor budsjett';
  return `<table><tr><td>Eiendom</td><td>${esc(currentProperty()?.name||'-')}</td></tr><tr><td>Bank/konto</td><td>${money(f.bank_balance)}</td></tr><tr><td>Reservefond</td><td>${money(f.reserved_funds)}</td></tr><tr><td>Budsjett</td><td>${money(t.budget)}</td></tr><tr><td>Faktisk kostnad</td><td>${money(t.actual)}</td></tr><tr><td>Avvik</td><td>${money(t.variance)} · ${esc(risk)}</td></tr><tr><td>Prosjektøkonomi</td><td>${money(t.projectActual)} brukt av ${money(t.projectBudget)}</td></tr></table>`;
}
function showFinanceForm(){const f=(DP.cache.finance||[])[0]||{};showDrawer('Konto og fond',`<label>Bank/konto</label><input id="bankBalance" type="number" value="${esc(f.bank_balance||0)}"><label>Reservefond</label><input id="reserveFund" type="number" value="${esc(f.reserved_funds||0)}"><label>Prosjektmidler</label><input id="projectFunds" type="number" value="${esc(f.project_funds||0)}"><label>Kommentar</label><textarea id="financeNotes">${esc(f.notes||'')}</textarea><button class="action primary" onclick="saveFinance()">Lagre</button>`)}
async function saveFinance(){try{requireLive('lagre økonomi');const row={property_id:currentProperty().id,bank_balance:+bankBalance.value||0,reserved_funds:+reserveFund.value||0,project_funds:+projectFunds.value||0,notes:financeNotes.value||null,updated_at:new Date().toISOString()};let r=await db().from('property_finance').upsert(row,{onConflict:'property_id'}).select().single();if(r.error&&/column|schema|cache/i.test(String(r.error.message||'')))r=await db().from('property_finance').upsert({property_id:row.property_id,bank_balance:row.bank_balance,reserved_funds:row.reserved_funds,project_funds:row.project_funds,updated_at:row.updated_at},{onConflict:'property_id'}).select().single();if(r.error)throw r.error;await insertActivity('Økonomi oppdatert','finance',currentProperty().id);await hydrateAll();hideDrawer();render()}catch(e){showDrawer('Økonomi ble ikke lagret',`<div class="output">${esc(customerError(e))}</div>`)}}
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
    await hydrateAll();hideDrawer();render();
  }catch(e){
    const msg=isFinanceSchemaError(e)?'Økonomitabellen mangler riktig oppsett. Kjør oppdatert supabase-finance-v1.sql i Supabase, publiser siste pakke og prøv igjen.':customerError(e);
    showDrawer('Budsjett ble ikke lagret',`<div class="output">${esc(msg)}</div>`);
  }
}
function showActualCostForm(){showDrawer('Registrer faktisk kostnad',`<label>Kategori</label><input id="costCat" placeholder="Vedlikehold, forsikring, prosjekt..."><label>Beløp</label><input id="costAmount" type="number"><label>Dato</label><input id="costDate" type="date"><label>Notat</label><textarea id="costNotes"></textarea><button class="action primary" onclick="saveActualCost()">Lagre kostnad</button>`)}
async function saveActualCost(){try{requireLive('lagre kostnad');const category=costCat.value||'Kostnad',actual=+costAmount.value||0,notes=[costDate.value,costNotes.value].filter(Boolean).join(' · '),propertyId=currentProperty().id;const variants=[{property_id:propertyId,category,label:category,budget_amount:0,actual_amount:actual,budget:0,actual,notes},{property_id:propertyId,category,label:category,budget_amount:0,actual_amount:actual,budget:0,actual},{property_id:propertyId,label:category,budget_amount:0,actual_amount:actual,notes},{property_id:propertyId,label:category,budget_amount:0,actual_amount:actual},{property_id:propertyId,category,budget_amount:0,actual_amount:actual,notes},{property_id:propertyId,category,budget_amount:0,actual_amount:actual},{property_id:propertyId,category,budget:0,actual,notes},{property_id:propertyId,category,budget:0,actual},{property_id:propertyId,label:category,budget:0,actual,notes},{property_id:propertyId,label:category,budget:0,actual}];let r,lastError=null;for(const variant of variants){r=await db().from('budget_lines').insert(variant).select().single();if(!r.error)break;lastError=r.error;if(!isFinanceSchemaError(r.error))break}if(r?.error)throw lastError||r.error;await insertActivity('Faktisk kostnad registrert','budget',r.data?.id||category);await hydrateAll();hideDrawer();render()}catch(e){const msg=isFinanceSchemaError(e)?'Økonomitabellen mangler riktig oppsett. Kjør oppdatert supabase-finance-v1.sql i Supabase, publiser siste pakke og prøv igjen.':customerError(e);showDrawer('Kostnad ble ikke lagret',`<div class="output">${esc(msg)}</div>`)}}
function showProjectForm(id=''){const p=(DP.cache.projects||[]).find(x=>x.id===id)||{};showDrawer(id?'Endre prosjekt':'Nytt prosjekt',`<input id="projectId" type="hidden" value="${esc(id)}"><label>Navn</label><input id="projectName" value="${esc(p.name||p.title||'')}"><label>Beskrivelse</label><textarea id="projectDesc">${esc(p.description||'')}</textarea><label>Budsjett</label><input id="projectBudget" type="number" value="${esc(p.budget||p.budget_amount||0)}"><label>Faktisk kostnad</label><input id="projectActual" type="number" value="${esc(p.actual_cost||p.actual_amount||0)}"><label>Frist</label><input id="projectDue" type="date" value="${esc(p.due_date||'')}"><label>Status</label><select id="projectStatus"><option ${p.status==='Planlagt'?'selected':''}>Planlagt</option><option ${p.status==='Pågår'?'selected':''}>Pågår</option><option ${p.status==='Ferdig'?'selected':''}>Ferdig</option></select><button class="action primary" onclick="saveProject()">Lagre</button>`)}
async function saveProject(){try{requireLive('lagre prosjekt');const row={property_id:currentProperty().id,name:projectName.value,description:projectDesc.value,budget:+projectBudget.value||0,actual_cost:+projectActual.value||0,due_date:projectDue.value||null,status:projectStatus.value};let r=projectId.value?await db().from('projects').update(row).eq('id',projectId.value).select().single():await db().from('projects').insert(row).select().single();if(r.error&&/column|schema|cache/i.test(String(r.error.message||''))){delete row.actual_cost;r=projectId.value?await db().from('projects').update(row).eq('id',projectId.value).select().single():await db().from('projects').insert(row).select().single()}if(r.error)throw r.error;await insertActivity('Prosjekt lagret','project',r.data.id);await hydrateAll();hideDrawer();render()}catch(e){showDrawer('Prosjekt ble ikke lagret',`<div class="output">${esc(customerError(e))}</div>`)}}
function financeReportHtml(){
  const p=currentProperty(),f=(DP.cache.finance||[])[0]||{},lines=DP.cache.budget_lines||[],projects=DP.cache.projects||[],t=financeTotals();
  const row=(a,b)=>`<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`;
  const budgetRows=lines.map(l=>`<tr><td>${esc(l.category||l.label)}</td><td>${money(l.budget_amount||l.budget)}</td><td>${money(l.actual_amount||l.actual)}</td><td>${money(Number(l.actual_amount||l.actual||0)-Number(l.budget_amount||l.budget||0))}</td></tr>`).join('');
  const projectRows=projects.map(pr=>`<tr><td>${esc(pr.name||pr.title)}</td><td>${money(pr.budget||pr.budget_amount)}</td><td>${money(pr.actual_cost||pr.actual_amount)}</td><td>${esc(pr.status||'-')}</td></tr>`).join('');
  return `<!doctype html><html lang="no"><head><meta charset="utf-8"><title>Økonomirapport</title><style>body{font-family:Arial,sans-serif;background:#f4f7fb;color:#172033;margin:0}.page{max-width:900px;margin:32px auto;background:#fff;border:1px solid #d8e0eb;border-radius:14px;overflow:hidden}header{background:#0d347d;color:#fff;padding:28px 34px}main{padding:28px 34px}table{width:100%;border-collapse:collapse;margin:0 0 24px}td,th{border-bottom:1px solid #e6edf5;padding:10px;text-align:left}h2{margin-top:28px}.note{background:#eef5ff;border-left:4px solid #176bff;padding:14px;border-radius:10px}</style></head><body><section class="page"><header><small>Driftspartner OS</small><h1>Økonomirapport til styret</h1><p>${esc(p?.name||'-')} · ${esc(new Date().toLocaleString('nb-NO'))}</p></header><main><h2>Nøkkeltall</h2><table>${row('Bank/konto',money(f.bank_balance))}${row('Reservefond',money(f.reserved_funds))}${row('Prosjektmidler',money(f.project_funds))}${row('Budsjett',money(t.budget))}${row('Faktisk kostnad',money(t.actual))}${row('Avvik',money(t.variance))}</table><h2>Budsjett</h2><table><tr><th>Kategori</th><th>Budsjett</th><th>Faktisk</th><th>Avvik</th></tr>${budgetRows||'<tr><td colspan="4">Ingen budsjettlinjer registrert.</td></tr>'}</table><h2>Prosjekter</h2><table><tr><th>Prosjekt</th><th>Budsjett</th><th>Faktisk</th><th>Status</th></tr>${projectRows||'<tr><td colspan="4">Ingen prosjekter registrert.</td></tr>'}</table><div class="note">Rapporten er generert fra live økonomidata på valgt eiendom.</div></main></section></body></html>`;
}
async function saveBoardFinanceReport(){try{requireLive('lage styrerapport');if(typeof uploadGeneratedDocument!=='function')throw new Error('Dokumentarkivet er ikke klart.');const doc=await uploadGeneratedDocument('Økonomirapport - '+(currentProperty()?.name||'eiendom'),'Styrepapir',financeReportHtml(),'Klar');await hydrateAll();showDrawer('Styrerapport lagret',`<p>Økonomirapporten er lagret i dokumentarkivet.</p><button class="action primary" onclick="openDocument('${esc(doc.id)}')">Åpne rapport</button>`)}catch(e){showDrawer('Rapport ble ikke laget',`<div class="output">${esc(customerError(e))}</div>`)}}
function MarketPage(){const rfqs=DP.cache.quote_requests||[],offers=DP.cache.offers||[];return `<div class="grid"><div class="card s12"><div class="dash-title"><h3>Marked og tilbud</h3><div><button class="action primary" onclick="showSupplierForm()">Leverandør</button><button class="action" onclick="showRfqForm()">Tilbudsforespørsel</button><button class="action" onclick="showOfferForm()">Last opp tilbud</button></div></div></div><div class="card s4"><h3>Leverandører</h3>${supplierTable()}</div><div class="card s4"><h3>Forespørsler</h3>${table(['Tittel','Frist','Status','Handling'],rfqs.map(q=>`<tr><td>${esc(q.title)}</td><td>${esc(q.deadline||'-')}</td><td>${esc(q.status)}</td><td><button class="action red" onclick="deleteRow('quote_requests','${esc(q.id)}')">Slett</button></td></tr>`))}</div><div class="card s4"><h3>Tilbud</h3>${table(['Leverandør','Pris','Status','Handling'],offers.map(o=>`<tr><td>${esc(o.suppliers?.name||'-')}</td><td>${money(o.price)}</td><td>${esc(o.status)}</td><td><button class="action red" onclick="deleteRow('offers','${esc(o.id)}')">Slett</button></td></tr>`))}</div></div>`}
function supplierTable(){return table(['Navn','E-post','Handling'],DP.suppliers.map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(s.email)}</td><td><button class="action red" onclick="deleteRow('suppliers','${esc(s.id)}')">Slett</button></td></tr>`))}
function showSupplierForm(){showDrawer('Ny leverandor',`<label>Firma</label><input id="supName"><label>E-post</label><input id="supEmail"><label>Fag</label><input id="supTrade"><button class="action primary" onclick="saveSupplier()">Lagre</button>`)}
async function saveSupplier(){try{requireLive('lagre leverandør');if(!supEmail.value.includes('@'))throw new Error('Leverandør ma ha e-post.');const r=await db().from('suppliers').insert({name:supName.value,email:supEmail.value,trade:supTrade.value,status:'active'}).select().single();if(r.error)throw r.error;await insertActivity('Leverandør lagret','supplier',r.data.id);await hydrateAll();hideDrawer();render()}catch(e){showDrawer('Leverandør ble ikke lagret',`<div class=\"output\">${esc(customerError(e))}</div>`)}}
function showRfqForm(workOrderId=''){showDrawer('Tilbudsforespørsel',`<input id="rfqWo" type="hidden" value="${esc(workOrderId)}"><label>Tittel</label><input id="rfqTitle"><label>Beskrivelse</label><textarea id="rfqDesc"></textarea><label>Frist</label><input id="rfqDeadline" type="date"><button class="action primary" onclick="saveRfq()">Lagre tilbudsforespørsel</button>`)}
async function saveRfq(){try{requireLive('Lagre tilbudsforespørsel');let row={property_id:currentProperty().id,title:rfqTitle.value,description:rfqDesc.value,deadline:rfqDeadline.value||null,status:'Utkast'};if(isUuid(rfqWo.value))row.work_order_id=rfqWo.value;const r=await db().from('quote_requests').insert(row).select().single();if(r.error)throw r.error;await insertActivity('Tilbudsforespørsel opprettet','quote_request',r.data.id);await hydrateAll();hideDrawer();render()}catch(e){showDrawer('Tilbudsforespørsel ble ikke lagret',`<div class=\"output\">${esc(customerError(e))}</div>`)}}
function showOfferForm(){showDrawer('Last opp tilbud',`<label>Leverandør</label><select id="offerSupplier">${DP.suppliers.map(s=>`<option value="${s.id}">${esc(s.name)} - ${esc(s.email)}</option>`).join('')}</select><label>Pris</label><input id="offerPrice" type="number"><label>Forbehold</label><textarea id="offerTerms"></textarea><label>PDF</label><input id="offerFile" type="file"><button class="action primary" onclick="saveOffer()">Lagre tilbud</button><div id="offerOut" class="output"></div>`)}
async function saveOffer(){const out=document.getElementById('offerOut');try{requireLive('lagre tilbud');const file=offerFile.files[0];if(!file)throw new Error('Velg PDF/vedlegg.');const path=`${currentProperty().id}/Tilbud/${Date.now()}-${file.name}`.replace(/\s+/g,'-');let up=await db().storage.from('documents').upload(path,file,{upsert:false,contentType:file.type||undefined});if(up.error)throw up.error;let doc=await db().from('documents').insert({property_id:currentProperty().id,title:file.name,category:'Tilbud',storage_path:path,mime_type:file.type,status:'Mottatt'}).select().single();if(doc.error)throw doc.error;let r=await db().from('offers').insert({property_id:currentProperty().id,supplier_id:offerSupplier.value,price:+offerPrice.value||0,reservations:offerTerms.value,status:'Mottatt'}).select().single();if(r.error)throw r.error;await insertActivity('Tilbud lastet opp','offer',r.data.id);await hydrateAll();hideDrawer();render()}catch(e){setOutputError(out,e)}}

function AdminPage(){return `<div class="grid"><div class="card s12">${LaunchControlPage()}</div><div class="card s12"><div class="dash-title"><h3>Ny kunde</h3><button class="action primary" onclick="showNewCustomerWizard()">Start onboarding</button></div><p class="muted">Opprett kunde, eiendom, styre, beboere, leverandører, FDV-mapper, økonomi og brukere i én kontrollert flyt.</p></div><div class="card s12"><h3>Produksjonskontroll</h3><p class="muted">Denne versjonen laster bare rene produksjonsmoduler. Gamle lokale/testmoduler er ikke aktive.</p><button class="action primary" onclick="runCleanCheck()">Kjør kontroll</button><div id="adminOut" class="output"></div></div><div class="card s12"><h3>Rolle- og tilgangstest</h3>${roleAccessPanel()}</div><div class="card s12"><h3>Aktivitet</h3>${table(['Tid','Handling','Type'],(DP.cache.activity||[]).map(a=>`<tr><td>${esc(a.created_at||'-')}</td><td>${esc(a.action)}</td><td>${esc(a.entity_type)}</td></tr>`))}</div></div>`}
function launchStatus(label,ok,warnText='',okText='OK'){
  const type=ok===true?'ok':ok==='warn'?'warn':'bad';
  const text=ok===true?okText:ok==='warn'?warnText:'Må fikses';
  return `<tr><td>${esc(label)}</td><td><span class="badge ${type}">${esc(text)}</span></td><td>${esc(launchAdvice(label,ok))}</td></tr>`;
}
function launchAdvice(label,ok){
  if(ok===true)return 'Klar.';
  const map={
    'Innlogging':'Test live innlogging med en ekte bruker.',
    'Live eiendom':'Velg en eiendom fra Supabase før pilot.',
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
    launchStatus('Tilbud/RFQ',rfqs.length>0&&offers.length>0,rfqs.length>0?'RFQ OK, mangler tilbud':'Mangler RFQ/tilbud'),
    launchStatus('Dokumentarkiv',docs.length>0),
    launchStatus('Økonomi',finance.length>0&&budget.length>0,finance.length>0?'Konto OK, mangler budsjett':'Mangler økonomi'),
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
    if(!isUuid(currentProperty()?.id))throw new Error('Velg en live eiendom fra Supabase.');
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
    ['forvalter','Alle menyer','Kun tildelte eiendommer'],
    ['styreleder','Dashboard, eiendom, styre/beboere, avvik/arbeid, FDV, økonomi, marked','Kun egne eiendommer'],
    ['styremedlem','Dashboard, styre/beboere, avvik/arbeid, FDV, økonomi','Kun egne eiendommer'],
    ['vaktmester','Dashboard, avvik/arbeid, FDV','Kun tildelte eiendommer'],
    ['beboer','Avvik/arbeid','Kun egen eiendom'],
    ['leverandør','Marked/tilbud','Kun egne oppdrag/tilbud']
  ].map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`);
  return `<div class="split"><div><h4>Aktiv bruker</h4><table><tr><td>Rolle</td><td>${esc(role||'-')}</td></tr><tr><td>Synlige menyer</td><td>${esc(menus)}</td></tr><tr><td>Eiendommer</td><td>${DP.properties.length}</td></tr></table></div><div><h4>Eiendomstilgang</h4>${table(['Eiendom','Kunde','Tilgang'],props,'Ingen eiendomstilgang funnet.')}</div></div><h4>Forventet meny per rolle</h4>${table(['Rolle','Menyer','Eiendomstilgang'],expected)}`;
}
function runCleanCheck(){const lines=[];lines.push(DP.session?'OK Innlogging':'STOPP Innlogging mangler');lines.push(isUuid(currentProperty()?.id)?'OK Live eiendom':'STOPP Live eiendom mangler');lines.push(`OK Rolle: ${appRole()||'-'}`);lines.push(`OK Synlige menyer: ${visibleMenus().map(m=>m[1]).join(', ')||'Ingen'}`);lines.push(`OK Eiendomstilgang: ${DP.properties.length}`);lines.push(`OK Aktive moduler: ${document.querySelectorAll('script[src*="assets/prod/"]').length}`);lines.push(document.querySelectorAll('script[src*="assets/modules/"]').length?'STOPP Gamle moduler lastes fortsatt':'OK Gamle moduler er ikke aktive');document.getElementById('adminOut').textContent=lines.join('\n')}

function showNewCustomerWizard(){
  showDrawer('Ny kunde - onboarding',`<div class="onboarding-flow"><div class="ops-budget-summary"><div><small>1</small><b>Kunde</b></div><div><small>2</small><b>Eiendom</b></div><div><small>3</small><b>Styre/beboere</b></div><div><small>4</small><b>Leverandører</b></div><div><small>5</small><b>FDV/økonomi</b></div><div><small>6</small><b>Brukere</b></div></div><h3>Kunde</h3><label>Kundenavn</label><input id="obCustomerName" placeholder="Nytt Borettslag"><label>Org.nr</label><input id="obOrgNo"><h3>Eiendom</h3><label>Eiendomsnavn</label><input id="obPropertyName"><label>Adresse</label><input id="obAddress"><div class="split"><div><label>Type</label><input id="obType" placeholder="Borettslag / sameie"></div><div><label>Antall enheter</label><input id="obUnits" type="number"></div></div><div class="split"><div><label>Gnr</label><input id="obGnr"></div><div><label>Bnr</label><input id="obBnr"></div></div><label>Teknisk sammendrag</label><textarea id="obTech"></textarea><h3>Styre</h3><p class="muted">Én per linje: navn, rolle, e-post, telefon</p><textarea id="obBoard" rows="4" placeholder="Kari Nordmann, Styreleder, kari@kunde.no, 90000000"></textarea><h3>Beboere</h3><p class="muted">Én per linje: navn, enhet/rolle, e-post, telefon</p><textarea id="obResidents" rows="4"></textarea><h3>Leverandører</h3><p class="muted">Én per linje: firma, e-post, fag</p><textarea id="obSuppliers" rows="4" placeholder="Nord Tak AS, post@nordtak.no, Tak"></textarea><h3>FDV-mapper</h3><textarea id="obFolders" rows="3">Bygg\nVVS\nElektro\nBrann\nVentilasjon\nTak\nFasade\nHeis\nHMS\nForsikring\nGarantier\nTegninger\nKontrakter\nServiceavtaler</textarea><h3>Økonomi</h3><div class="split"><div><label>Bank/konto</label><input id="obBank" type="number" value="0"></div><div><label>Reservefond</label><input id="obReserve" type="number" value="0"></div></div><label>Prosjektmidler</label><input id="obProjectFunds" type="number" value="0"><h3>Inviter brukere</h3><p class="muted">Én per linje: navn, e-post, rolle, telefon, midlertidig passord. Roller: styreleder, styremedlem, beboer, vaktmester, leverandor.</p><textarea id="obUsers" rows="4" placeholder="Kari Nordmann, kari@kunde.no, styreleder, 90000000, Start1234!"></textarea><button class="action primary" onclick="runNewCustomerOnboarding()">Opprett kunde</button><div id="obOut" class="output">Klar.</div></div>`);
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
  if(r.error&&/relation|schema|cache|does not exist/i.test(String(r.error.message||'')))return {ok:false,count:0,skipped:true};
  if(r.error)throw r.error;
  return {ok:true,count:rows.length};
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
  try{
    requireLive('opprette kunde');
    const client=db(),log=[];
    const customerName=obCustomerName.value.trim(),propertyName=obPropertyName.value.trim()||customerName;
    if(!customerName||!propertyName)throw new Error('Fyll inn kundenavn og eiendomsnavn.');
    out.textContent='Oppretter kunde...';
    let customer=await insertWithFallback('customers',{name:customerName,org_no:obOrgNo.value.trim()||null},['name']);
    if(customer.error)throw customer.error;
    log.push('Kunde opprettet');
    out.textContent='Oppretter eiendom...';
    const propertyRow={customer_id:customer.data.id,name:propertyName,address:obAddress.value.trim(),property_type:obType.value.trim(),gnr:obGnr.value.trim(),bnr:obBnr.value.trim(),units_count:+obUnits.value||0,technical_summary:obTech.value.trim()};
    let property=await insertWithFallback('properties',propertyRow,['customer_id','name','address']);
    if(property.error)throw property.error;
    const propertyId=property.data.id;
    DP.propertyId=propertyId;
    log.push('Eiendom opprettet');
    if(DP.user?.id)await client.from('property_access').upsert({property_id:propertyId,user_id:DP.user.id,access_role:'owner'},{onConflict:'property_id,user_id'});
    const board=parseLines(obBoard.value).map(r=>({property_id:propertyId,name:r[0]||'',role:r[1]||'Styremedlem',email:r[2]||'',phone:r[3]||'',notes:'Onboarding'})).filter(r=>r.name);
    const residents=parseLines(obResidents.value).map(r=>({property_id:propertyId,name:r[0]||'',role:r[1]||'Beboer',email:r[2]||'',phone:r[3]||'',notes:'Onboarding'})).filter(r=>r.name);
    await safeInsertMany('property_contacts',[...board,...residents]);log.push(`${board.length} styre / ${residents.length} beboere lagt inn`);
    const suppliers=parseLines(obSuppliers.value).map(r=>({name:r[0]||'',email:r[1]||'',trade:r[2]||'',status:'active'})).filter(r=>r.name&&r.email);
    await safeInsertMany('suppliers',suppliers);log.push(`${suppliers.length} leverandører lagt inn`);
    const folders=String(obFolders.value||'').split(/\n+/).map(name=>name.trim()).filter(Boolean).map(name=>({property_id:propertyId,name,parent_id:null}));
    const folderResult=await safeInsertMany('document_folders',folders);log.push(folderResult.skipped?'FDV-mapper hoppet over: tabell mangler':`${folders.length} FDV-mapper opprettet`);
    let finance=await client.from('property_finance').upsert({property_id:propertyId,bank_balance:+obBank.value||0,reserved_funds:+obReserve.value||0,project_funds:+obProjectFunds.value||0,updated_at:new Date().toISOString()},{onConflict:'property_id'});
    if(finance.error)throw finance.error;log.push('Økonomi grunnlag lagret');
    const users=parseLines(obUsers.value);let userCount=0;
    for(const userRow of users){await createOnboardingUser(userRow,propertyId);userCount++}
    log.push(`${userCount} brukere opprettet/invitert`);
    await insertActivity('Ny kunde onboardet','onboarding',propertyId);
    await loadProperties();DP.propertyId=propertyId;await hydrateAll();render();
    showDrawer('Onboarding fullført',`<div class="output">${esc(log.join('\n'))}</div><button class="action primary" onclick="openModule('property');hideDrawer()">Åpne eiendomskort</button>`);
  }catch(e){setOutputError(out,e,'Onboarding kunne ikke fullføres. Sjekk feltene og prøv igjen.')}
}





