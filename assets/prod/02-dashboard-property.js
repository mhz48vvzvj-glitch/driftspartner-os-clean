function DashboardPage(){
  const devs=DP.cache.deviations||[],wos=DP.cache.work_orders||[],docs=DP.cache.documents||[],rfqs=DP.cache.quote_requests||[],offers=DP.cache.offers||[],f=(DP.cache.finance||[])[0]||{};
  const open=x=>!['lukket','ferdig','utført','utfort','fullført','fullfort'].includes(String(x.status||'').toLowerCase());
  const critical=devs.filter(d=>open(d)&&String(d.priority||'').toLowerCase().includes('kritisk')).length;
  const openDevs=devs.filter(open).length,openWos=wos.filter(open).length;
  const moneyRisk=dashboardMoneyRisk(),missingDocs=missingDocumentCount(docs);
  const boardDecisions=rfqs.filter(q=>String(q.status||'').toLowerCase().includes('utkast')).length+offers.length;
  return `<div class="grid dashboard-page">
    <div class="card s12 executive-hero"><div><small>Styrets oversikt · Dashboard V2 live-graf</small><h2>${esc(currentProperty()?.name||'Valgt eiendom')}</h2><p>Live status fra avvik, arbeidsordre, dokumenter, økonomi og innkjøp. Bruk dette som beslutningsgrunnlag før neste styremøte.</p></div><div class="executive-actions"><button class="action primary" onclick="runAiDirector('styrapport')">Lag styrerapport</button><button class="action" onclick="hydrateAll().then(render)">Oppdater tall</button></div></div>
    ${focusCard('Hva haster?',critical||openDevs,critical?'Kritiske avvik må behandles først':openDevs?'Åpne avvik bør fordeles og følges opp':'Ingen åpne avvik nå',critical?'bad':openDevs?'warn':'ok','cases')}
    ${focusCard('Hva koster penger?',money(moneyRisk.amount),moneyRisk.caption,moneyRisk.amount>0?'bad':'ok','finance')}
    ${focusCard('Hva mangler dokumentasjon?',missingDocs,missingDocs?'FDV, HMS, kontrakt eller styrepapir mangler':'Dokumentasjonen ser ryddig ut',missingDocs?'warn':'ok','documents')}
    ${focusCard('Hva må styret beslutte?',boardDecisions,boardDecisions?'Tilbud, RFQ eller sak bør avklares':'Ingen åpne beslutningspunkter',boardDecisions?'info':'ok','market')}
    <div class="card s7 premium-finance-card">${DashboardFinanceChart()}</div>
    <div class="card s5 premium-deviation-card">${DashboardDeviationPie(devs)}</div>
    ${dashboardMetric('Åpne avvik',openDevs,openDevs?'Må følges opp':'Ingen åpne avvik','info')}
    ${dashboardMetric('Kritiske avvik',critical,critical?'Krever rask handling':'Ingen kritiske avvik',critical?'bad':'ok')}
    ${dashboardMetric('Arbeidsordre',openWos,openWos?'Pågående oppgaver':'Ingen åpne ordre',openWos?'warn':'ok')}
    ${dashboardMetric('Dokumenter',docs.length,'Lagret på valgt eiendom','ok')}
    ${dashboardMetric('Tilbud/RFQ',`${rfqs.length}/${offers.length}`,'Forespørsler og tilbud','info')}
    ${dashboardMetric('Konto',money(f.bank_balance),'Registrert banksaldo','purple')}
    <div class="card s12 dashboard-flow"><div class="dash-title"><div><h3>Saksløp</h3><p class="muted">Viser om eiendommen har en komplett driftssak fra avvik til rapport.</p></div><button class="action primary" onclick="openModule('cases')">Åpne saksløp</button></div>${ProductionFlowMini()}</div>
    <div class="card s12 dashboard-ai">${AiDirectorCard()}</div>
    <div class="card s6 dashboard-list"><div class="dash-title"><h3>Siste avvik</h3><button class="action" onclick="openModule('cases')">Åpne avvik</button></div>${caseList(devs)}</div>
    <div class="card s6 dashboard-list"><div class="dash-title"><h3>Siste dokumenter</h3><button class="action" onclick="openModule('documents')">Åpne arkiv</button></div>${documentList(docs)}</div>
  </div>`;
}
function DashboardFinanceChart(){
  const lines=DP.cache.budget_lines||[],projects=DP.cache.projects||[],finance=(DP.cache.finance||[])[0]||{};
  const budget=lines.reduce((s,l)=>s+Number(l.budget_amount||l.budget||0),0);
  const actual=lines.reduce((s,l)=>s+Number(l.actual_amount||l.actual||0),0);
  const projectBudget=projects.reduce((s,p)=>s+Number(p.budget||p.budget_amount||0),0);
  const projectActual=projects.reduce((s,p)=>s+Number(p.actual_cost||p.actual_amount||0),0);
  const rows=[
    ...lines.map(l=>({label:l.category||l.label||'Budsjettlinje',budget:Number(l.budget_amount||l.budget||0),actual:Number(l.actual_amount||l.actual||0)})),
    ...projects.map(p=>({label:p.name||p.title||'Prosjekt',budget:Number(p.budget||p.budget_amount||0),actual:Number(p.actual_cost||p.actual_amount||0)}))
  ].filter(r=>r.budget||r.actual).slice(0,6);
  const max=Math.max(1,...rows.flatMap(r=>[r.budget,r.actual]),budget,actual,projectBudget,projectActual);
  const variance=actual-budget,projectVariance=projectActual-projectBudget;
  const summary=[
    ['Bank/konto',money(finance.bank_balance||0),'ok'],
    ['Budsjett',money(budget),'info'],
    ['Faktisk',money(actual),variance>0?'bad':'ok'],
    ['Prosjekt',`${money(projectActual)} / ${money(projectBudget)}`,projectVariance>0?'warn':'purple']
  ];
  const bars=rows.length?rows.map(r=>{
    const bw=Math.max(2,Math.round((r.budget/max)*100)),aw=Math.max(2,Math.round((r.actual/max)*100)),over=r.actual>r.budget;
    return `<div class="finance-bar-row"><div class="finance-bar-label">${esc(r.label)}</div><div class="finance-bars"><span class="budget" style="width:${bw}%"></span><span class="actual ${over?'over':''}" style="width:${aw}%"></span></div><div class="finance-bar-value">${money(r.actual-r.budget)}</div></div>`;
  }).join(''):'<div class="empty-state"><strong>Ingen økonomilinjer registrert.</strong><span>Legg inn bank/konto, budsjettlinjer eller prosjektøkonomi for å vise live graf.</span><button class="action primary" onclick="openModule(\'finance\')">Åpne økonomi</button></div>';
  return `<div class="dash-title"><div><h3>Økonomi live</h3><p class="muted">Budsjett, faktisk kostnad og prosjektøkonomi fra valgt eiendom.</p></div><button class="action" onclick="openModule('finance')">Åpne økonomi</button></div><div class="finance-summary-strip">${summary.map(s=>`<div class="${esc(s[2])}"><small>${esc(s[0])}</small><b>${esc(s[1])}</b></div>`).join('')}</div><div class="premium-finance-legend"><span><i class="budget"></i>Budsjett</span><span><i class="actual"></i>Faktisk</span><span><i class="over"></i>Over budsjett</span></div><div class="premium-finance-bars">${bars}</div>`;
}
function DashboardDeviationPie(devs){
  const counts={};
  (devs||[]).forEach(d=>{const key=String(d.category||'Annet').trim()||'Annet';counts[key]=(counts[key]||0)+1});
  const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6),total=entries.reduce((s,e)=>s+e[1],0);
  const colors=['#2d72ff','#8b5cf6','#22c55e','#f8b51d','#ff4d58','#56d6d6'];
  if(!total)return `<div class="dash-title"><div><h3>Avvik fordelt</h3><p class="muted">Live fordeling av avvikskategorier.</p></div><button class="action" onclick="openModule('cases')">Åpne avvik</button></div><div class="empty-state"><strong>Ingen avvik registrert.</strong><span>Når avvik opprettes med kategori, vises kaken her.</span><button class="action primary" onclick="openModule('cases')">Registrer avvik</button></div>`;
  let acc=0;
  const gradient=entries.map((entry,i)=>{const start=acc,totalPct=entry[1]/total*100;acc+=totalPct;return `${colors[i]} ${start}% ${acc}%`}).join(',');
  return `<div class="dash-title"><div><h3>Avvik fordelt</h3><p class="muted">Live kake basert på avvikskategori.</p></div><button class="action" onclick="openModule('cases')">Åpne avvik</button></div><div class="premium-pie-wrap"><div class="premium-pie" style="background:conic-gradient(${gradient})"><div><strong>${total}</strong><span>Totalt</span></div></div><div class="premium-pie-list">${entries.map((e,i)=>`<button onclick="openModule('cases')"><span><i style="background:${colors[i]}"></i>${esc(e[0])}</span><b>${e[1]} (${Math.round(e[1]/total*100)}%)</b></button>`).join('')}</div></div>`;
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
  return `<div class="ops-budget-summary">${steps.map(s=>`<div><small>${esc(s[0])}</small><b>${s[1]}</b></div>`).join('')}</div><p class="muted">Basert på registrerte saker for valgt eiendom.</p>`;
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
function PropertyBrainPage(){
  const p=currentProperty(),analysis=propertyBrainAnalysis();
  return `<div class="grid property-brain-page">
    <div class="card s12 module-hero brain-hero"><div><small>Property Brain</small><h2>Teknisk analyse av ${esc(p?.name||'valgt eiendom')}</h2><p>Live vurdering av FDV, avvik, arbeidsordre, økonomi, prosjekter og dokumentasjon. Brukes som beslutningsgrunnlag for styre og forvalter.</p></div><div class="module-actions"><button class="action primary" onclick="runPropertyBrainAi()">Kjør AI-vurdering</button><button class="action" onclick="hydrateAll().then(render)">Oppdater live data</button></div></div>
    <div class="card s4 brain-score-card"><div class="brain-score-ring" style="--score:${analysis.score}"><strong>${analysis.score}</strong><span>Tilstandscore</span></div><p>${esc(analysis.summary)}</p></div>
    <div class="card s8"><div class="brain-metrics">${analysis.metrics.map(m=>`<button class="${esc(m.type)}" onclick="openModule('${esc(m.module)}')"><small>${esc(m.label)}</small><strong>${esc(m.value)}</strong><span>${esc(m.caption)}</span></button>`).join('')}</div></div>
    <div class="card s6"><div class="dash-title"><h3>Risikofunn</h3><button class="action" onclick="openModule('cases')">Åpne saker</button></div>${brainFindingList(analysis.risks,'Ingen kritiske risikofunn akkurat nå.')}</div>
    <div class="card s6"><div class="dash-title"><h3>Dokumentasjon</h3><button class="action" onclick="openModule('documents')">Åpne arkiv</button></div>${brainFindingList(analysis.documentation,'Dokumentasjonen ser komplett ut for V1-kontroll.')}</div>
    <div class="card s12"><h3>Anbefalt neste handling</h3><div class="brain-actions">${analysis.actions.map(a=>`<button onclick="${esc(a.open)}"><span>${esc(a.priority)}</span><strong>${esc(a.title)}</strong><small>${esc(a.detail)}</small></button>`).join('')}</div></div>
    <div class="card s12"><div class="dash-title"><div><h3>AI-vurdering</h3><p class="muted">Sender live eiendomsdata til AI Director hvis API-kvote er tilgjengelig.</p></div><button class="action primary" onclick="runPropertyBrainAi()">Analyser med AI</button></div><label>Spørsmål til Property Brain</label><textarea id="brainQuestion">Hva er største tekniske risiko for eiendommen nå, og hva bør styret gjøre først?</textarea><div id="propertyBrainOut" class="ai-report">${formatAiReport(DP.cache.property_brain_answer||propertyBrainTextFallback(analysis))}</div></div>
  </div>`;
}
function propertyBrainAnalysis(){
  const devs=DP.cache.deviations||[],wos=DP.cache.work_orders||[],docs=DP.cache.documents||[],buildings=DP.cache.buildings||[],projects=DP.cache.projects||[],lines=DP.cache.budget_lines||[],offers=DP.cache.offers||[],rfqs=DP.cache.quote_requests||[];
  const open=x=>!['lukket','ferdig','utført','utfort','fullført','fullfort'].includes(String(x.status||'').toLowerCase());
  const openDevs=devs.filter(open),critical=openDevs.filter(d=>/kritisk|høy|hoy/i.test(String(d.priority||'')));
  const openWos=wos.filter(open),overdue=wos.filter(w=>w.due_date&&new Date(w.due_date)<new Date()&&open(w));
  const categories=(docs||[]).map(d=>String(d.category||'').toLowerCase());
  const missing=['FDV','HMS','Kontrakt','Styrepapir','Tegning'].filter(c=>!categories.includes(c.toLowerCase()));
  const budget=lines.reduce((s,l)=>s+Number(l.budget_amount||l.budget||0),0),actual=lines.reduce((s,l)=>s+Number(l.actual_amount||l.actual||0),0),variance=actual-budget;
  const projectOver=projects.filter(pr=>Number(pr.actual_cost||pr.actual_amount||0)>Number(pr.budget||pr.budget_amount||0));
  let score=100;
  score-=Math.min(30,critical.length*12);
  score-=Math.min(18,openWos.length*4);
  score-=Math.min(20,missing.length*5);
  if(variance>0)score-=Math.min(18,Math.round((variance/Math.max(1,budget))*20));
  score-=Math.min(10,overdue.length*5);
  score=Math.max(0,Math.min(100,score));
  const risks=[
    ...critical.map(d=>({type:'bad',title:d.title||'Kritisk avvik',detail:`Prioritet: ${d.priority||'ikke satt'} · status: ${d.status||'ny'}`,module:'cases'})),
    ...overdue.map(w=>({type:'warn',title:w.title||'Forfalt arbeidsordre',detail:`Frist: ${w.due_date}`,module:'cases'})),
    ...(variance>0?[{type:'bad',title:'Økonomiavvik',detail:`Faktisk er ${money(variance)} over budsjett.`,module:'finance'}]:[]),
    ...projectOver.map(pr=>({type:'warn',title:pr.name||'Prosjekt over budsjett',detail:`Faktisk: ${money(pr.actual_cost||pr.actual_amount)} · budsjett: ${money(pr.budget||pr.budget_amount)}`,module:'finance'}))
  ].slice(0,8);
  const documentation=missing.map(c=>({type:'warn',title:`Mangler ${c}`,detail:'Last opp eller knytt dokumentasjon til valgt eiendom.',module:'documents'}));
  if(!buildings.length)documentation.push({type:'info',title:'Ingen bygg registrert',detail:'Legg inn bygg for bedre FDV- og risikovurdering.',module:'property'});
  const actions=[
    critical.length?{priority:'1',title:'Følg opp kritiske avvik',detail:`${critical.length} kritiske/høye avvik bør behandles først.`,open:"openModule('cases')"}:null,
    missing.length?{priority:critical.length?'2':'1',title:'Tett FDV-mangler',detail:`Mangler: ${missing.join(', ')}.`,open:"openModule('documents')"}:null,
    variance>0?{priority:'3',title:'Forklar budsjettavvik',detail:`Avvik på ${money(variance)} bør inn i styrerapport.`,open:"openModule('finance')"}:null,
    rfqs.length||offers.length?{priority:'4',title:'Avklar innkjøp og tilbud',detail:`${rfqs.length} forespørsler og ${offers.length} tilbud er registrert.`,open:"openModule('market')"}:null,
    {priority:'+',title:'Oppdater live grunnlag',detail:'Hent nyeste data før styremøte eller rapport.',open:"hydrateAll().then(render)"}
  ].filter(Boolean).slice(0,5);
  const metrics=[
    {label:'Åpne avvik',value:openDevs.length,caption:'Live fra avvik',type:openDevs.length?'warn':'ok',module:'cases'},
    {label:'Høy risiko',value:critical.length,caption:'Kritisk/høy prioritet',type:critical.length?'bad':'ok',module:'cases'},
    {label:'FDV-mangler',value:missing.length,caption:'Kravdokumenter',type:missing.length?'warn':'ok',module:'documents'},
    {label:'Forfalte ordre',value:overdue.length,caption:'Frist passert',type:overdue.length?'bad':'ok',module:'cases'},
    {label:'Budsjettavvik',value:money(Math.max(0,variance)),caption:'Faktisk over budsjett',type:variance>0?'bad':'ok',module:'finance'},
    {label:'Dokumenter',value:docs.length,caption:'I arkivet',type:'info',module:'documents'}
  ];
  const summary=score>=85?'Eiendommen ser godt kontrollert ut basert på registrert live-data.':score>=65?'Eiendommen har noen punkter styret bør følge opp.':'Eiendommen har flere risikopunkter som bør prioriteres før nye tiltak.';
  return {score,summary,risks,documentation,actions,metrics,missing,variance,openDevs,critical,openWos,docs};
}
function brainFindingList(items,empty){
  if(!items.length)return `<div class="empty-state"><strong>${esc(empty)}</strong><span>Property Brain bruker kun live data fra valgt eiendom.</span></div>`;
  return `<div class="brain-findings">${items.map(i=>`<button onclick="openModule('${esc(i.module)}')" class="${esc(i.type)}"><strong>${esc(i.title)}</strong><span>${esc(i.detail)}</span></button>`).join('')}</div>`;
}
function propertyBrainTextFallback(a){
  return `1. Kort status\n${a.summary}\n\n2. Viktigste funn\nÅpne avvik: ${a.openDevs.length}\nKritiske/høye avvik: ${a.critical.length}\nÅpne arbeidsordre: ${a.openWos.length}\nDokumenter: ${a.docs.length}\nFDV-mangler: ${a.missing.length}\nBudsjettavvik: ${money(Math.max(0,a.variance))}\n\n3. Anbefalt neste handling\n${a.actions.map(x=>`${x.priority}. ${x.title} - ${x.detail}`).join('\n')}`;
}
async function runPropertyBrainAi(){
  const out=document.getElementById('propertyBrainOut');
  try{
    requireLive('Property Brain');
    if(!DP.session?.access_token)throw new Error('Du må være innlogget for å bruke Property Brain.');
    const p=currentProperty();
    if(out)out.textContent='Property Brain analyserer live data...';
    const question=document.getElementById('brainQuestion')?.value.trim()||'Hva er største tekniske risiko nå?';
    const res=await fetch('/.netlify/functions/ai-director',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+DP.session.access_token},body:JSON.stringify({property_id:p.id,mode:'property_brain',question})});
    const data=await readJsonResponse(res,'Property Brain svarte ikke riktig. Sjekk at siste pakke er publisert.');
    if(!res.ok||!data.ok)throw new Error(data.message||'Property Brain kunne ikke fullføre analysen.');
    DP.cache.property_brain_answer=data.answer||'Ingen analyse mottatt.';
    if(out)out.innerHTML=formatAiReport(DP.cache.property_brain_answer);
    await insertActivity('Property Brain analyse kjørt','property_brain',p.id);
  }catch(e){
    const msg=String(e?.message||e||'Property Brain kunne ikke fullføre analysen.');
    if(out)out.textContent=msg;
    showDrawer('Property Brain kunne ikke kjøre',`<div class="output">${esc(customerError(e,msg))}</div>`);
  }
}
function PropertyPage(){
  const p=currentProperty();
  return `<div class="grid property-page"><div class="card s12 module-hero"><div><small>Eiendom</small><h2>${esc(p?.name||'Valgt eiendom')}</h2><p>${esc(p?.address||'Adresse ikke registrert')}</p></div><div class="module-actions"><button class="action primary" onclick="showPropertyForm()">Endre info</button><button class="action" onclick="openModule('documents')">FDV/dokumenter</button></div></div><div class="card s7">
    <div class="info-grid"><div><small>Kunde</small><b>${esc(p?.customer||'-')}</b></div><div><small>Type</small><b>${esc(p?.type||'-')}</b></div><div><small>Gnr/Bnr</small><b>${esc(p?.gnr||'-')}/${esc(p?.bnr||'-')}</b></div><div><small>Enheter</small><b>${esc(p?.units_count||'-')}</b></div><div><small>Areal</small><b>${esc(p?.gross_area||'-')} m2</b></div></div></div>
    <div class="card s5"><h3>Teknisk info</h3><p>${esc(p?.technical_summary||'Ikke registrert.')}</p></div>
    <div class="card s12"><h3>Kontaktpersoner</h3>${contactsTable()}</div></div>`;
}
function contactsTable(){const rows=(DP.cache.contacts||[]).map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.role)}</td><td>${esc(c.email)}</td><td>${esc(c.phone)}</td></tr>`);return table(['Navn','Rolle','E-post','Telefon'],rows)}
function showPropertyForm(){
  const p=currentProperty();requireLive('endre eiendom');
  showDrawer('Endre eiendom',`<label>Navn</label><input id="propName" value="${esc(p.name)}"><label>Adresse</label><input id="propAddress" value="${esc(p.address)}"><label>Type</label><input id="propType" value="${esc(p.type)}"><label>Gnr</label><input id="propGnr" value="${esc(p.gnr)}"><label>Bnr</label><input id="propBnr" value="${esc(p.bnr)}"><label>Enheter</label><input id="propUnits" type="number" value="${esc(p.units_count)}"><label>Areal</label><input id="propArea" type="number" value="${esc(p.gross_area)}"><label>Teknisk info</label><textarea id="propTech">${esc(p.technical_summary)}</textarea><button class="action primary" onclick="saveProperty()">Lagre</button>`);
}
async function saveProperty(){
  try{requireLive('lagre eiendom');const p=currentProperty();const payload={name:propName.value.trim(),address:propAddress.value.trim(),property_type:propType.value.trim(),gnr:propGnr.value.trim(),bnr:propBnr.value.trim(),units_count:+propUnits.value||0,gross_area:+propArea.value||0,technical_summary:propTech.value.trim()};const r=await db().from('properties').update(payload).eq('id',p.id).select().single();if(r.error)throw r.error;Object.assign(p,mapProperty({...r.data,customers:{name:p.customer}}));await insertActivity('Eiendom oppdatert','property',p.id);await finishAction('Eiendommen er lagret.','property')}catch(e){showDrawer('Eiendom ble ikke lagret',`<div class=\"output\">${esc(customerError(e))}</div>`)}}




