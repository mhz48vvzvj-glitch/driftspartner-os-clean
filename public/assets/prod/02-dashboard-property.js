function DashboardPage(){
  const devs=DP.cache.deviations||[],wos=DP.cache.work_orders||[],docs=DP.cache.documents||[],rfqs=DP.cache.quote_requests||[],offers=DP.cache.offers||[],f=(DP.cache.finance||[])[0]||{};
  const open=x=>!['lukket','ferdig','utført','utfort','fullført','fullfort'].includes(String(x.status||'').toLowerCase());
  const critical=devs.filter(d=>open(d)&&String(d.priority||'').toLowerCase().includes('kritisk')).length;
  const openDevs=devs.filter(open).length,openWos=wos.filter(open).length;
  const moneyRisk=dashboardMoneyRisk(),missingDocs=missingDocumentCount(docs);
  const boardDecisions=rfqs.filter(q=>String(q.status||'').toLowerCase().includes('utkast')).length+offers.length;
  return `<div class="grid dashboard-page">
    <div class="card s12 executive-hero"><div><small>Styrets oversikt</small><h2>${esc(currentProperty()?.name||'Valgt eiendom')}</h2><p>Live status fra avvik, arbeidsordre, dokumenter, økonomi og innkjøp. Bruk dette som beslutningsgrunnlag før neste styremøte.</p></div><div class="executive-actions"><button class="action primary" onclick="runAiDirector('styrapport')">Lag styrerapport</button><button class="action" onclick="hydrateAll().then(render)">Oppdater tall</button></div></div>
    ${focusCard('Hva haster?',critical||openDevs,critical?'Kritiske avvik må behandles først':openDevs?'Åpne avvik bør fordeles og følges opp':'Ingen åpne avvik nå',critical?'bad':openDevs?'warn':'ok','cases')}
    ${focusCard('Hva koster penger?',money(moneyRisk.amount),moneyRisk.caption,moneyRisk.amount>0?'bad':'ok','finance')}
    ${focusCard('Hva mangler dokumentasjon?',missingDocs,missingDocs?'FDV, HMS, kontrakt eller styrepapir mangler':'Dokumentasjonen ser ryddig ut',missingDocs?'warn':'ok','documents')}
    ${focusCard('Hva må styret beslutte?',boardDecisions,boardDecisions?'Tilbud, RFQ eller sak bør avklares':'Ingen åpne beslutningspunkter',boardDecisions?'info':'ok','market')}
    ${dashboardMetric('Åpne avvik',openDevs,openDevs?'Må følges opp':'Ingen åpne avvik','info')}
    ${dashboardMetric('Kritiske avvik',critical,critical?'Krever rask handling':'Ingen kritiske avvik',critical?'bad':'ok')}
    ${dashboardMetric('Arbeidsordre',openWos,openWos?'Pågående oppgaver':'Ingen åpne ordre',openWos?'warn':'ok')}
    ${dashboardMetric('Dokumenter',docs.length,'Lagret på valgt eiendom','ok')}
    ${dashboardMetric('Tilbud/RFQ',`${rfqs.length}/${offers.length}`,'Forespørsler og tilbud','info')}
    ${dashboardMetric('Konto',money(f.bank_balance),'Registrert banksaldo','purple')}
    <div class="card s12 dashboard-flow"><div class="dash-title"><div><h3>Neste produksjonssteg</h3><p class="muted">Viser om valgt eiendom har komplett saksløp fra avvik til FDV.</p></div><button class="action primary" onclick="openModule('cases')">Start saksløp</button></div>${ProductionFlowMini()}</div>
    <div class="card s12 dashboard-ai">${AiDirectorCard()}</div>
    <div class="card s6 dashboard-list"><div class="dash-title"><h3>Siste avvik</h3><button class="action" onclick="openModule('cases')">Åpne avvik</button></div>${caseList(devs)}</div>
    <div class="card s6 dashboard-list"><div class="dash-title"><h3>Siste dokumenter</h3><button class="action" onclick="openModule('documents')">Åpne arkiv</button></div>${documentList(docs)}</div>
  </div>`;
}
function dashboardMetric(label,value,caption,type='info'){
  return `<button class="card s4 dashboard-metric ${type}" onclick="${dashboardMetricAction(label)}"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(caption)}</span></button>`;
}
function dashboardMoneyRisk(){
  const lines=DP.cache.budget_lines||[];
  const budget=lines.reduce((s,l)=>s+Number(l.budget_amount||l.budget||0),0);
  const actual=lines.reduce((s,l)=>s+Number(l.actual_amount||l.actual||0),0);
  const variance=actual-budget;
  return {amount:variance>0?variance:0,caption:variance>0?'Over budsjett og bør forklares':'Innenfor registrert budsjett'};
}
function missingDocumentCount(docs){
  const categories=(docs||[]).map(d=>String(d.category||'').toLowerCase());
  return ['fdv','hms','kontrakt','styrepapir'].filter(c=>!categories.includes(c)).length;
}
function focusCard(title,value,caption,type='info',module='dashboard'){
  return `<button class="card s3 executive-card ${type}" onclick="openModule('${module}')"><small>${esc(title)}</small><strong>${esc(value)}</strong><span>${esc(caption)}</span></button>`;
}
function dashboardMetricAction(label){
  if(label.includes('avvik')||label.includes('Arbeidsordre'))return "openModule('cases')";
  if(label.includes('Dokumenter'))return "openModule('documents')";
  if(label.includes('Tilbud'))return "openModule('market')";
  if(label.includes('Konto'))return "openModule('finance')";
  return "hydrateAll().then(render)";
}
function caseList(rows){
  const data=(rows||[]).slice(0,7);
  if(!data.length)return '<div class="empty-state"><strong>Ingen avvik registrert.</strong><span>Registrer første avvik hvis noe må følges opp på eiendommen.</span><button class="action primary" onclick="openModule(\'cases\')">Registrer avvik</button></div>';
  return `<div class="clean-list">${data.map(r=>`<button class="clean-row" onclick="openModule('cases')"><div><strong>${esc(r.title||'Uten tittel')}</strong><small>${esc(r.status||'Ukjent status')}</small></div><span class="soft-pill ${priorityClass(r.priority)}">${esc(r.priority||'Ikke satt')}</span></button>`).join('')}</div>`;
}
function documentList(rows){
  const data=(rows||[]).slice(0,7);
  if(!data.length)return '<div class="empty-state"><strong>Ingen dokumenter registrert.</strong><span>Last opp FDV, HMS, kontrakter eller styrepapirer for å bygge historikken.</span><button class="action primary" onclick="openModule(\'documents\')">Åpne dokumentarkiv</button></div>';
  return `<div class="clean-list">${data.map(r=>`<button class="clean-row" onclick="openModule('documents')"><div><strong>${esc(r.title||'Uten tittel')}</strong><small>${esc(r.category||'Uten kategori')}</small></div><span class="soft-pill neutral">${esc(r.status||'Arkiv')}</span></button>`).join('')}</div>`;
}
function priorityClass(value){
  const p=String(value||'').toLowerCase();
  if(p.includes('kritisk')||p.includes('høy'))return 'bad';
  if(p.includes('medium'))return 'warn';
  if(p.includes('lav'))return 'ok';
  return 'neutral';
}
function ProductionFlowMini(){
  const steps=[['Avvik',(DP.cache.deviations||[]).length],['Arbeidsordre',(DP.cache.work_orders||[]).length],['Tilbudsforespørsel',(DP.cache.quote_requests||[]).length],['Tilbud',(DP.cache.offers||[]).length],['FDV',(DP.cache.documents||[]).filter(d=>String(d.category).toLowerCase()==='fdv').length]];
  return `<div class="ops-budget-summary">${steps.map(s=>`<div><small>${esc(s[0])}</small><b>${s[1]}</b></div>`).join('')}</div><p class="muted">Tallene kommer fra valgt eiendom. Mangler et steg, må det opprettes live før flyten kan fullføres.</p>`;
}
function AiDirectorCard(){
  const cached=DP.cache.ai_director_answer||'AI Director leser live data fra valgt eiendom når du starter analysen.';
  return `<div class="dash-title"><div><h3>AI Director</h3><p class="muted">Analyserer avvik, arbeidsordre, FDV, økonomi, tilbud og aktivitet for valgt eiendom.</p></div><button class="action primary" onclick="runAiDirector()">Analyser valgt eiendom</button></div>
    <label>Spørsmål til AI Director</label>
    <textarea id="aiQuestion" placeholder="Hva bør styret prioritere nå?">Hva bør styret prioritere nå?</textarea>
    <div class="inline-actions"><button class="action" onclick="runAiDirector('prioritering')">Prioriteringer</button><button class="action" onclick="runAiDirector('risiko')">Risiko</button><button class="action" onclick="runAiDirector('styrapport')">Styrerapport</button></div>
    <div id="aiDirectorOut" class="ai-report">${formatAiReport(cached)}</div>`;
}
function cleanAiLine(line){
  return esc(String(line||'').replace(/\*\*/g,'').replace(/^\s*[-•]\s*/,'').replace(/^\s*\d+\)\s*/,'').trim());
}
function formatAiReport(text){
  const raw=String(text||'').trim();
  if(!raw)return '<div class="ai-report-empty">Ingen analyse enda.</div>';
  if(raw.length<140&&!/\n/.test(raw))return `<div class="ai-report-empty">${esc(raw)}</div>`;
  const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const sections=[];
  let current={title:'AI Director',items:[]};
  const isHeading=line=>/^\d+\.\s+/.test(line)||/^(kort status|topp|risiko|mangler|foresl|neste handling|data som mangler)/i.test(line);
  lines.forEach(line=>{
    if(isHeading(line)){
      if(current.items.length)sections.push(current);
      current={title:cleanAiLine(line.replace(/^\d+\.\s*/,'')),items:[]};
    }else{
      current.items.push(cleanAiLine(line));
    }
  });
  if(current.items.length||!sections.length)sections.push(current);
  return sections.map((section,index)=>{
    const cls=index===0?'ai-section status':'ai-section';
    return `<section class="${cls}"><h4>${sectionTitleIcon(section.title)} ${esc(section.title)}</h4><div>${section.items.map(item=>`<p>${item}</p>`).join('')}</div></section>`;
  }).join('');
}
function sectionTitleIcon(title){
  const t=String(title||'').toLowerCase();
  if(t.includes('prior'))return '<span class="ai-dot blue"></span>';
  if(t.includes('risiko')||t.includes('mangler'))return '<span class="ai-dot red"></span>';
  if(t.includes('handling'))return '<span class="ai-dot green"></span>';
  return '<span class="ai-dot purple"></span>';
}
async function runAiDirector(mode='prioritering'){
  const out=document.getElementById('aiDirectorOut');
  try{
    requireLive('AI Director');
    if(!DP.session?.access_token)throw new Error('Du må være innlogget for å bruke AI Director.');
    const p=currentProperty();
    if(!p?.id)throw new Error('Velg en eiendom for du starter AI Director.');
    if(out)out.textContent='AI Director analyserer live data...';
    const question=document.getElementById('aiQuestion')?.value.trim()||'Hva bør styret prioritere nå?';
    const res=await fetch('/.netlify/functions/ai-director',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+DP.session.access_token},body:JSON.stringify({property_id:p.id,mode,question})});
    const data=await readJsonResponse(res,'AI Director svarte ikke riktig. Sjekk at siste pakke er publisert.');
    if(!res.ok||!data.ok)throw new Error(data.message||'AI Director kunne ikke fullføre analysen.');
    DP.cache.ai_director_answer=data.answer||'Ingen anbefaling mottatt.';
    if(out)out.innerHTML=formatAiReport(DP.cache.ai_director_answer);
    await insertActivity('AI Director analyse kjørt','ai_director',p.id);
  }catch(e){
    const msg=String(e?.message||e||'AI Director kunne ikke fullføre analysen.');
    if(out)out.textContent=msg;
    showDrawer('AI Director kunne ikke kjøre',`<div class="output">${esc(msg)}</div>`);
  }
}
function PropertyPage(){
  const p=currentProperty();
  return `<div class="grid"><div class="card s7"><div class="dash-title"><h3>Eiendomskort</h3><button class="action primary" onclick="showPropertyForm()">Endre info</button></div>
    <table><tr><td>Navn</td><td>${esc(p?.name)}</td></tr><tr><td>Kunde</td><td>${esc(p?.customer)}</td></tr><tr><td>Adresse</td><td>${esc(p?.address)}</td></tr><tr><td>Type</td><td>${esc(p?.type)}</td></tr><tr><td>Gnr/Bnr</td><td>${esc(p?.gnr)}/${esc(p?.bnr)}</td></tr><tr><td>Enheter</td><td>${esc(p?.units_count)}</td></tr><tr><td>Areal</td><td>${esc(p?.gross_area)} m2</td></tr></table></div>
    <div class="card s5"><h3>Teknisk info</h3><p>${esc(p?.technical_summary||'Ikke registrert.')}</p><button class="action" onclick="openModule('documents')">FDV/dokumenter</button></div>
    <div class="card s12"><h3>Kontaktpersoner</h3>${contactsTable()}</div></div>`;
}
function contactsTable(){const rows=(DP.cache.contacts||[]).map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.role)}</td><td>${esc(c.email)}</td><td>${esc(c.phone)}</td></tr>`);return table(['Navn','Rolle','E-post','Telefon'],rows)}
function showPropertyForm(){
  const p=currentProperty();requireLive('endre eiendom');
  showDrawer('Endre eiendom',`<label>Navn</label><input id="propName" value="${esc(p.name)}"><label>Adresse</label><input id="propAddress" value="${esc(p.address)}"><label>Type</label><input id="propType" value="${esc(p.type)}"><label>Gnr</label><input id="propGnr" value="${esc(p.gnr)}"><label>Bnr</label><input id="propBnr" value="${esc(p.bnr)}"><label>Enheter</label><input id="propUnits" type="number" value="${esc(p.units_count)}"><label>Areal</label><input id="propArea" type="number" value="${esc(p.gross_area)}"><label>Teknisk info</label><textarea id="propTech">${esc(p.technical_summary)}</textarea><button class="action primary" onclick="saveProperty()">Lagre</button>`);
}
async function saveProperty(){
  try{requireLive('lagre eiendom');const p=currentProperty();const payload={name:propName.value.trim(),address:propAddress.value.trim(),property_type:propType.value.trim(),gnr:propGnr.value.trim(),bnr:propBnr.value.trim(),units_count:+propUnits.value||0,gross_area:+propArea.value||0,technical_summary:propTech.value.trim()};const r=await db().from('properties').update(payload).eq('id',p.id).select().single();if(r.error)throw r.error;Object.assign(p,mapProperty({...r.data,customers:{name:p.customer}}));await insertActivity('Eiendom oppdatert','property',p.id);hideDrawer();render()}catch(e){showDrawer('Eiendom ble ikke lagret',`<div class=\"output\">${esc(customerError(e))}</div>`)}}




