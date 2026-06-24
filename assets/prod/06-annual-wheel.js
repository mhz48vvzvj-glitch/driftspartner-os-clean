function annualWheelRows(){return DP.cache.annual_wheel_items||[]}
function annualWheelMonths(){return ['Januar','Februar','Mars','April','Mai','Juni','Juli','August','September','Oktober','November','Desember']}
function annualWheelMonthName(month){return annualWheelMonths()[Math.max(0,Math.min(11,(Number(month)||1)-1))]}
function annualWheelStatusClass(status){
  const s=String(status||'').toLowerCase();
  if(/ferdig|utført|utfort|lukket/.test(s))return 'ok';
  if(/forfalt|kritisk/.test(s))return 'bad';
  if(/pågår|pagar|arbeid|sendt/.test(s))return 'info';
  return 'warn';
}
function annualWheelMonthCard(month){
  const rows=annualWheelRows().filter(x=>Number(x.month||0)===month);
  return `<section class="annual-month ${rows.length?'has-items':''}"><header><strong>${annualWheelMonthName(month)}</strong><span>${rows.length}</span></header>${rows.length?rows.map(annualWheelItemMini).join(''):'<p>Ingen punkter</p>'}</section>`;
}
function annualWheelItemMini(row){
  return `<button class="annual-item" onclick="showAnnualWheelForm('${esc(row.id)}')"><span class="soft-pill ${annualWheelStatusClass(row.status)}">${esc(row.status||'Planlagt')}</span><strong>${esc(row.title||'Årshjulpunkt')}</strong><small>${esc([row.category,row.responsible,row.due_date].filter(Boolean).join(' · '))}</small></button>`;
}
function AnnualWheelPanel(){
  const rows=annualWheelRows();
  const done=rows.filter(r=>annualWheelStatusClass(r.status)==='ok').length;
  const overdue=rows.filter(r=>annualWheelStatusClass(r.status)==='bad').length;
  const next=rows.filter(r=>annualWheelStatusClass(r.status)!=='ok')[0];
  return `<div class="annual-wheel">
    <div class="dash-title"><div><h3>Årshjul</h3><p class="muted">Planlegg styrearbeid, kontroller, økonomi, HMS, FDV og faste oppgaver gjennom året.</p></div><div class="module-actions"><button class="action primary" onclick="showAnnualWheelForm()">Nytt årshjulpunkt</button><button class="action" onclick="seedAnnualWheel()">Foreslå standard årshjul</button></div></div>
    <div class="annual-summary"><section><small>Punkter</small><strong>${rows.length}</strong><span>Totalt i årshjulet</span></section><section><small>Utført</small><strong>${done}</strong><span>Ferdige punkter</span></section><section><small>Må følges opp</small><strong>${rows.length-done}</strong><span>Ikke ferdig</span></section><section><small>Forfalt</small><strong>${overdue}</strong><span>Krever oppfølging</span></section></div>
    <div class="annual-next"><small>Neste oppfølging</small><strong>${esc(next?.title||'Ingen åpne punkter')}</strong><span>${esc(next?[annualWheelMonthName(next.month),next.category,next.responsible].filter(Boolean).join(' · '):'Når årshjulpunkt legges inn, vises neste åpne punkt her.')}</span></div>
    <div class="annual-grid">${annualWheelMonths().map((_,i)=>annualWheelMonthCard(i+1)).join('')}</div>
  </div>`;
}
function showAnnualWheelForm(id=''){
  if(typeof subscriptionHas==='function'&&!subscriptionHas('maintenance')){
    showDrawer('Årshjul krever Pro eller Premium','<div class="empty-state"><strong>Årshjul er en Pro/Premium-funksjon.</strong><span>Oppgrader for vedlikeholdsplan, årshjul, rapport og bedre styring av faste oppgaver.</span></div>');
    return;
  }
  const row=annualWheelRows().find(x=>String(x.id)===String(id))||{};
  const month=Number(row.month||new Date().getMonth()+1);
  showDrawer(id?'Endre årshjulpunkt':'Nytt årshjulpunkt',`<input id="annualWheelId" type="hidden" value="${esc(id)}"><div class="form-grid two"><label>Tittel<input id="annualTitle" value="${esc(row.title||'')}" placeholder="For eksempel: Årskontroll brannalarm"></label><label>Måned<select id="annualMonth">${annualWheelMonths().map((m,i)=>`<option value="${i+1}" ${month===i+1?'selected':''}>${esc(m)}</option>`).join('')}</select></label><label>Dato/frist<input id="annualDue" type="date" value="${esc(row.due_date||'')}"></label><label>Kategori<select id="annualCategory">${['Styre','Økonomi','HMS','Brann','FDV','Vedlikehold','Kontroll','Forsikring','Leverandør','Annet'].map(c=>`<option ${String(row.category||'')===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label><label>Ansvarlig<input id="annualResponsible" value="${esc(row.responsible||'')}" placeholder="Styreleder, vaktmester, forvalter..."></label><label>Status<select id="annualStatus">${['Planlagt','Pågår','Sendt','Ferdig','Forfalt'].map(s=>`<option ${String(row.status||'Planlagt')===s?'selected':''}>${esc(s)}</option>`).join('')}</select></label></div><label>Beskrivelse / notat</label><textarea id="annualNotes" rows="4" placeholder="Hva skal gjøres, hva må styret vite, og hvor lagres dokumentasjon?">${esc(row.notes||'')}</textarea><div class="module-actions"><button class="action primary" onclick="saveAnnualWheelItem()">Lagre årshjulpunkt</button>${id?`<button class="action red" onclick="deleteAnnualWheelItem('${esc(id)}')">Slett</button>`:''}</div><div id="annualOut" class="output">Klar til lagring.</div>`);
}
async function saveAnnualWheelItem(){
  const out=document.getElementById('annualOut');
  try{
    requireLive('lagre årshjul');
    if(typeof subscriptionHas==='function'&&!subscriptionHas('maintenance'))throw new Error('Årshjul krever Pro eller Premium.');
    const id=document.getElementById('annualWheelId')?.value||'';
    const row={property_id:currentProperty().id,title:annualTitle.value||'Årshjulpunkt',month:Number(annualMonth.value)||1,due_date:annualDue.value||null,category:annualCategory.value||'Annet',responsible:annualResponsible.value||null,status:annualStatus.value||'Planlagt',notes:annualNotes.value||null,updated_at:new Date().toISOString()};
    const r=id?await db().from('annual_wheel_items').update(row).eq('id',id).select().single():await db().from('annual_wheel_items').insert(row).select().single();
    if(r.error)throw r.error;
    await insertActivity(id?'Årshjulpunkt oppdatert':'Årshjulpunkt opprettet','annual_wheel',r.data.id);
    await finishAction('Årshjulpunktet er lagret.','maintenance');
  }catch(e){
    const msg=/annual_wheel_items|relation|schema|column|does not exist/i.test(String(e?.message||e))?'Årshjul-tabellen mangler. Kjør supabase-annual-wheel-v1.sql i Supabase SQL Editor og prøv igjen.':customerError(e);
    if(out)out.textContent=msg;else showDrawer('Årshjul ble ikke lagret',`<div class="output">${esc(msg)}</div>`);
  }
}
async function deleteAnnualWheelItem(id){
  if(!confirm('Slette årshjulpunkt?'))return;
  try{
    requireLive('slette årshjulpunkt');
    const r=await db().from('annual_wheel_items').delete().eq('id',id);
    if(r.error)throw r.error;
    await insertActivity('Årshjulpunkt slettet','annual_wheel',id);
    await finishAction('Årshjulpunktet er slettet.','maintenance');
  }catch(e){showDrawer('Årshjulpunkt ble ikke slettet',`<div class="output">${esc(customerError(e))}</div>`)}
}
async function seedAnnualWheel(){
  const defaults=[
    [1,'Årsbudsjett og vedlikeholdsplan','Økonomi','Styreleder'],
    [2,'HMS-gjennomgang','HMS','Styreleder'],
    [3,'Brannvernkontroll','Brann','Vaktmester'],
    [4,'Vårbefaring uteområde','Vedlikehold','Vaktmester'],
    [5,'Kontroll av tak og fasade','Vedlikehold','Forvalter'],
    [6,'Gjennomgang av leverandøravtaler','Leverandør','Styreleder'],
    [8,'FDV- og dokumentkontroll','FDV','Forvalter'],
    [9,'Forsikringsgjennomgang','Forsikring','Styreleder'],
    [10,'Plan for vinterdrift','Vedlikehold','Vaktmester'],
    [11,'Neste års budsjettgrunnlag','Økonomi','Styreleder'],
    [12,'Årsoppsummering til styret','Styre','Styreleder']
  ];
  try{
    requireLive('opprette standard årshjul');
    if(annualWheelRows().length&&!confirm('Det finnes allerede årshjulpunkt. Vil du likevel legge til standardpunkter?'))return;
    const rows=defaults.map(x=>({property_id:currentProperty().id,month:x[0],title:x[1],category:x[2],responsible:x[3],status:'Planlagt',notes:'Standard punkt fra Driftspartner OS årshjul.'}));
    const r=await db().from('annual_wheel_items').insert(rows);
    if(r.error)throw r.error;
    await insertActivity('Standard årshjul opprettet','annual_wheel',currentProperty().id);
    await finishAction('Standard årshjul er lagt inn.','maintenance');
  }catch(e){showDrawer('Standard årshjul ble ikke opprettet',`<div class="output">${esc(customerError(e))}</div>`)}
}
const __dpOriginalMaintenancePage=typeof MaintenancePage==='function'?MaintenancePage:null;
MaintenancePage=function(){
  if(typeof subscriptionHas==='function'&&!subscriptionHas('maintenance'))return '<div class="grid"><div class="card s12"><h2>Årshjul og vedlikeholdsplan krever Pro eller Premium</h2><p class="muted">Start-pakken har FDV, dokumenter, avvik og styre. Pro åpner årshjul, arbeidsordre, økonomi og rapporter.</p></div></div>';
  const base=__dpOriginalMaintenancePage?__dpOriginalMaintenancePage():'<div class="grid"></div>';
  return base.replace('<div class="card s8">',`<div class="card s12">${AnnualWheelPanel()}</div><div class="card s8">`);
}

