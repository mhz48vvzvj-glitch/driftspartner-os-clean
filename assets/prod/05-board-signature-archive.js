function boardMeetingRows(){return DP.cache.board_meetings||[]}
function shortBoardText(value){const s=String(value||'').trim();return s.length>120?s.slice(0,117)+'...':s}
function toLocalDatetimeValue(value){
  if(!value)return '';
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return '';
  const pad=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function boardMeetingList(){
  const rows=boardMeetingRows();
  if(!rows.length)return '<div class="empty-state"><strong>Ingen styremøter registrert.</strong><span>Opprett første styremøte med agenda, vedtak og referat.</span><button class="action primary" onclick="showBoardMeetingForm()">Nytt styremøte</button></div>';
  return `<div class="stack-list">${rows.map(boardMeetingCard).join('')}</div>`;
}
function boardMeetingCard(m){
  return `<section class="mini-record board-meeting-card"><div><strong>${esc(m.title||'Styremøte')}</strong><small>${esc([m.meeting_type,m.meeting_date?new Date(m.meeting_date).toLocaleString('nb-NO'):'',m.status].filter(Boolean).join(' · '))}</small></div><div class="mini-meta"><span>Agenda</span><span>${esc(shortBoardText(m.agenda||'Ikke lagt inn'))}</span></div><div class="mini-meta"><span>Vedtak</span><span>${esc(shortBoardText(m.decisions||'Ikke lagt inn'))}</span></div><div class="row-actions"><button class="action" onclick="showBoardMeetingForm('${esc(m.id)}')">Endre</button><button class="action" onclick="saveBoardMeetingDocument('${esc(m.id)}')">Lagre som styrepapir</button><button class="action" onclick="showSignatureRequestForm('Styrevedtak','board_meeting','${esc(m.id)}','Styrevedtak - ${esc(m.title||'Styremøte')}')">Signer vedtak</button><button class="action red" onclick="deleteBoardMeeting('${esc(m.id)}')">Slett</button></div></section>`;
}
function showBoardMeetingForm(id=''){
  const m=boardMeetingRows().find(x=>String(x.id)===String(id))||{};
  showDrawer(id?'Endre styremøte':'Nytt styremøte',`<input id="boardMeetingId" type="hidden" value="${esc(id)}"><div class="form-grid two"><label>Tittel<input id="boardMeetingTitle" value="${esc(m.title||'Styremøte')}" placeholder="Styremøte / årsmøte / ekstraordinært møte"></label><label>Type<select id="boardMeetingType"><option ${m.meeting_type==='Styremøte'?'selected':''}>Styremøte</option><option ${m.meeting_type==='Årsmøte'?'selected':''}>Årsmøte</option><option ${m.meeting_type==='Ekstraordinært møte'?'selected':''}>Ekstraordinært møte</option><option ${m.meeting_type==='Beboermøte'?'selected':''}>Beboermøte</option></select></label><label>Dato<input id="boardMeetingDate" type="datetime-local" value="${esc(toLocalDatetimeValue(m.meeting_date))}"></label><label>Status<select id="boardMeetingStatus"><option ${m.status==='Planlagt'?'selected':''}>Planlagt</option><option ${m.status==='Gjennomført'?'selected':''}>Gjennomført</option><option ${m.status==='Referat klart'?'selected':''}>Referat klart</option><option ${m.status==='Vedtak signert'?'selected':''}>Vedtak signert</option></select></label></div><label>Agenda</label><textarea id="boardMeetingAgenda" rows="5" placeholder="Sak 1, sak 2, dokumenter som skal gjennomgås...">${esc(m.agenda||'')}</textarea><label>Vedtak</label><textarea id="boardMeetingDecisions" rows="5" placeholder="Hva ble vedtatt, hvem følger opp og frist?">${esc(m.decisions||'')}</textarea><label>Oppgaver / ansvar</label><textarea id="boardMeetingTasks" rows="4" placeholder="Ansvarlig, oppgave og frist">${esc(m.tasks||'')}</textarea><label>Referat / notat</label><textarea id="boardMeetingMinutes" rows="5" placeholder="Kort referat eller intern kommentar">${esc(m.minutes||m.notes||'')}</textarea><button class="action primary" onclick="saveBoardMeeting()">Lagre styremøte</button><div id="boardMeetingOut" class="output">Klar til lagring.</div>`);
}
async function saveBoardMeeting(){
  const out=document.getElementById('boardMeetingOut');
  try{
    requireLive('lagre styremøte');
    const id=document.getElementById('boardMeetingId')?.value||'';
    const row={property_id:currentProperty().id,title:boardMeetingTitle.value||'Styremøte',meeting_type:boardMeetingType.value||'Styremøte',meeting_date:boardMeetingDate.value?new Date(boardMeetingDate.value).toISOString():null,status:boardMeetingStatus.value||'Planlagt',agenda:boardMeetingAgenda.value||null,decisions:boardMeetingDecisions.value||null,tasks:boardMeetingTasks.value||null,minutes:boardMeetingMinutes.value||null,updated_at:new Date().toISOString()};
    const r=id?await db().from('board_meetings').update(row).eq('id',id).select().single():await db().from('board_meetings').insert(row).select().single();
    if(r.error)throw r.error;
    await insertActivity(id?'Styremøte oppdatert':'Styremøte opprettet','board_meeting',r.data.id);
    await finishAction('Styremøtet er lagret.','people');
  }catch(e){
    const msg=/board_meetings|schema|relation|does not exist|column/i.test(String(e?.message||e))?'Styremøte-tabellen mangler. Kjør supabase-board-v1.sql i Supabase SQL Editor og prøv igjen.':customerError(e);
    if(out)out.textContent=msg;else showDrawer('Styremøte ble ikke lagret',`<div class="output">${esc(msg)}</div>`);
  }
}
function boardMeetingDocumentHtml(m){
  const p=currentProperty(),row=(a,b)=>`<tr><td>${esc(a)}</td><td>${esc(b||'-')}</td></tr>`;
  return `<!doctype html><html lang="no"><head><meta charset="utf-8"><title>${esc(m.title||'Styremøte')}</title><style>body{font-family:Arial,sans-serif;background:#f4f7fb;color:#172033;margin:0}.page{max-width:900px;margin:32px auto;background:#fff;border:1px solid #d8e0eb;border-radius:14px;overflow:hidden}header{background:#0d347d;color:#fff;padding:28px 34px}main{padding:28px 34px}table{width:100%;border-collapse:collapse;margin:0 0 24px}td{border-bottom:1px solid #e6edf5;padding:10px;vertical-align:top}td:first-child{width:180px;color:#64748b;font-weight:700}.box{white-space:pre-wrap;border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#f8fafc;margin-bottom:18px}</style></head><body><section class="page"><header><small>Driftspartner OS</small><h1>${esc(m.title||'Styremøte')}</h1><p>${esc(p?.name||'Eiendom')}</p></header><main><table>${row('Type',m.meeting_type)}${row('Dato',m.meeting_date?new Date(m.meeting_date).toLocaleString('nb-NO'):'')}${row('Status',m.status)}</table><h2>Agenda</h2><div class="box">${esc(m.agenda||'Ingen agenda registrert.')}</div><h2>Vedtak</h2><div class="box">${esc(m.decisions||'Ingen vedtak registrert.')}</div><h2>Oppgaver / ansvar</h2><div class="box">${esc(m.tasks||'Ingen oppgaver registrert.')}</div><h2>Referat / notat</h2><div class="box">${esc(m.minutes||m.notes||'Ingen referat registrert.')}</div></main></section></body></html>`;
}
async function saveBoardMeetingDocument(id){
  try{
    const m=boardMeetingRows().find(x=>String(x.id)===String(id));if(!m)throw new Error('Fant ikke styremøtet.');
    if(typeof uploadGeneratedDocument!=='function')throw new Error('Dokumentarkivet er ikke klart.');
    const doc=await uploadGeneratedDocument((m.meeting_type||'Styremøte')+' - '+(m.title||currentProperty()?.name||'eiendom'),'Styrepapir',boardMeetingDocumentHtml(m),'Klar');
    await insertActivity('Styremøte lagret som styrepapir','document',doc.id);
    await finishAction('Styremøtet er lagret som styrepapir.','people');
  }catch(e){showDrawer('Styrepapir ble ikke laget',`<div class="output">${esc(customerError(e))}</div>`)}
}
async function deleteBoardMeeting(id){
  if(!confirm('Slette styremøte?'))return;
  try{requireLive('slette styremøte');const r=await db().from('board_meetings').delete().eq('id',id);if(r.error)throw r.error;await insertActivity('Styremøte slettet','board_meeting',id);await finishAction('Styremøtet er slettet.','people')}catch(e){showDrawer('Styremøte ble ikke slettet',`<div class="output">${esc(customerError(e))}</div>`)}
}
function PeoplePage(){
  const contacts=DP.cache.contacts||[];
  const roleOf=c=>String(c.role||c.contact_role||c.contact_type||c.type||'');
  const board=contacts.filter(c=>/styre|leder|vara/i.test(roleOf(c)));
  const res=contacts.filter(c=>/bebo|resident|leilighet|enhet/i.test(roleOf(c)));
  const other=contacts.filter(c=>!board.includes(c)&&!res.includes(c));
  return `<div class="grid people-page premium-people">
    <div class="card s12 module-hero people-hero"><div><small>Beboere og styre</small><h2>${esc(currentProperty()?.name||'Valgt eiendom')}</h2><p>Kontaktregister, styreoversikt, styremøter og innlogginger for valgt eiendom.</p></div><div class="module-actions"><button class="action primary" onclick="showPersonForm('Beboer')">Legg til beboer</button><button class="action" onclick="showPersonForm('Styremedlem')">Legg til styremedlem</button><button class="action" onclick="showBoardMeetingForm()">Nytt styremøte</button><button class="action" onclick="showUserForm()">Opprett innlogging</button><button class="action" onclick="showEmailFlow('all')">Melding til alle</button></div></div>
    ${peopleSummaryCard('Styre',board.length,'Styreleder, styremedlemmer og vara','showPersonForm("Styremedlem")','info')}
    ${peopleSummaryCard('Beboere',res.length,'Kontakter som kan få beboertilgang','showPersonForm("Beboer")','ok')}
    ${peopleSummaryCard('Styremøter',boardMeetingRows().length,'Agenda, vedtak og referat','showBoardMeetingForm()','purple')}
    ${peopleSummaryCard('Innlogging',contacts.filter(c=>String(c.email||'').includes('@')).length,'Kontakter med registrert e-post','showUserForm()','warn')}
    <div class="card s12 people-section board-meetings-section"><div class="dash-title"><div><h3>Styremøter og vedtak</h3><p class="muted">Agenda, vedtak, oppgaver og referat lagres på valgt eiendom.</p></div><button class="action primary" onclick="showBoardMeetingForm()">Nytt styremøte</button></div>${boardMeetingList()}</div>
    <div class="card s7 people-section"><div class="dash-title"><div><h3>Styre</h3><p class="muted">Legg inn rolle, e-post, telefon og periode.</p></div><button class="action primary" onclick="showPersonForm('Styremedlem')">Legg til</button></div>${personList(board,'Ingen styremedlemmer registrert.','Legg inn styreleder, styremedlemmer og vara for valgt eiendom.')}</div>
    <div class="card s5 people-access-card"><h3>Tilgang per rolle</h3><div class="people-access-list"><section><strong>Styreleder</strong><span>Dashboard, eiendom, styre, økonomi, FDV og saker.</span></section><section><strong>Styremedlem</strong><span>Styre, saker, dokumenter og økonomigrunnlag.</span></section><section><strong>Beboer</strong><span>Kan melde avvik og følge egne saker.</span></section><section><strong>Vaktmester</strong><span>Arbeidsordre, avvik og dokumentasjon.</span></section></div></div>
    <div class="card s6 people-section"><div class="dash-title"><div><h3>Beboere</h3><p class="muted">Beboere kan registreres som kontakt eller få egen innlogging.</p></div><button class="action primary" onclick="showPersonForm('Beboer')">Legg til</button></div>${personList(res,'Ingen beboere registrert.','Legg inn beboere eller kontaktpersoner som skal kunne melde avvik.')}</div>
    <div class="card s6 people-section"><div class="dash-title"><div><h3>Andre kontakter</h3><p class="muted">Forvalter, vaktmester, leverandørkontakt eller annen fast kontakt.</p></div><button class="action" onclick="showPersonForm('Kontakt')">Legg til kontakt</button></div>${personList(other,'Ingen andre kontakter registrert.','Her kan forvalter, vaktmester eller andre faste kontaktpersoner ligge.')}</div>
  </div>`;
}
function signatureArchiveCategory(row={}){
  const value=String(row.archive_category||document.getElementById('signArchiveCategory')?.value||'').trim();
  if(value)return value;
  const type=String(row.signature_type||document.getElementById('signType')?.value||'').toLowerCase();
  if(type.includes('kontrakt'))return 'Kontrakt';
  if(type.includes('styre'))return 'Styrepapir';
  if(type.includes('tilbud'))return 'Tilbud';
  return 'Annet';
}
function signatureArchiveHtml(row,stage){
  const p=currentProperty();
  const log=signatureLogArray(row);
  const recipients=Array.isArray(row.recipients)?row.recipients:[];
  const item=(a,b)=>`<tr><td>${esc(a)}</td><td>${esc(b||'-')}</td></tr>`;
  const logRows=log.map(x=>`<tr><td>${esc(x.event||'-')}</td><td>${esc(x.name||'-')}</td><td>${esc(x.role||'-')}</td><td>${esc(x.at?new Date(x.at).toLocaleString('nb-NO'):'-')}</td></tr>`).join('');
  return `<!doctype html><html lang="no"><head><meta charset="utf-8"><title>${esc(row.title||'Signering')}</title><style>body{font-family:Arial,sans-serif;background:#f4f7fb;color:#172033;margin:0}.page{max-width:900px;margin:32px auto;background:#fff;border:1px solid #d8e0eb;border-radius:14px;overflow:hidden}header{background:#0d347d;color:#fff;padding:28px 34px}main{padding:28px 34px}table{width:100%;border-collapse:collapse;margin:0 0 24px}td,th{border-bottom:1px solid #e6edf5;padding:10px;text-align:left;vertical-align:top}td:first-child{width:190px;color:#64748b;font-weight:700}.box{white-space:pre-wrap;border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#f8fafc;margin-bottom:18px}</style></head><body><section class="page"><header><small>Driftspartner OS · Intern signatur</small><h1>${esc(row.title||'Signering')}</h1><p>${esc(p?.name||'Eiendom')} · ${esc(stage)}</p></header><main><table>${item('Eiendom',p?.name)}${item('Type',row.signature_type)}${item('Status',row.status)}${item('Kategori/mappe',signatureArchiveCategory(row))}${item('Sendt av',row.sent_by_name)}${item('Signert av',row.signed_by_name)}${item('Frist',row.due_date)}</table><h2>Godkjenningsgrunnlag</h2><div class="box">${esc(row.notes||row.title||'Ikke beskrevet')}</div><h2>Mottakere</h2><div class="box">${esc(recipients.map(r=>[r.name,r.role,r.email].filter(Boolean).join(' · ')).join('\\n')||'Ingen mottakere registrert.')}</div><h2>Signaturlogg</h2><table><tr><th>Hendelse</th><th>Navn</th><th>Rolle</th><th>Tidspunkt</th></tr>${logRows||'<tr><td colspan="4">Ingen logg registrert.</td></tr>'}</table></main></section></body></html>`;
}
async function archiveSignatureDocument(row,stage){
  try{
    if(typeof uploadGeneratedDocument!=='function'||!row?.id)return null;
    const category=signatureArchiveCategory(row);
    const title=`Signaturbevis - ${row.title||'Signering'}`;
    const html=signatureArchiveHtml(row,stage);
    let doc=null;
    if(row.archive_document_id){
      const existing=await db().from('documents').select('*').eq('id',row.archive_document_id).maybeSingle();
      if(!existing.error&&existing.data?.storage_path){
        const blob=new Blob([html],{type:'text/html;charset=utf-8'});
        const up=await db().storage.from('documents').upload(existing.data.storage_path,blob,{upsert:true,contentType:'text/html;charset=utf-8'});
        if(up.error)throw up.error;
        const upd=await db().from('documents').update({title,category,status:'Signert'}).eq('id',existing.data.id).select().single();
        if(upd.error)throw upd.error;
        doc=upd.data;
      }
    }
    if(!doc)doc=await uploadGeneratedDocument(title,category,html,'Signert');
    await db().from('signature_requests').update({archive_category:category,archive_document_id:doc.id,updated_at:new Date().toISOString()}).eq('id',row.id);
    await insertActivity(`${stage} arkivert som signaturbevis`,'signature_request',row.id);
    return doc;
  }catch(e){console.warn('Signaturarkiv feilet',e);return null}
}
const __dpOriginalShowSignatureRequestForm=typeof showSignatureRequestForm==='function'?showSignatureRequestForm:null;
showSignatureRequestForm=function(type='Kontrakt',relatedType='',relatedId='',title=''){
  if(!__dpOriginalShowSignatureRequestForm)return;
  __dpOriginalShowSignatureRequestForm(type,relatedType,relatedId,title);
  const status=document.getElementById('signStatus')?.closest('label');
  if(status&&!document.getElementById('signArchiveCategory')){
    status.insertAdjacentHTML('afterend',`<label>Arkiver i mappe/kategori<select id="signArchiveCategory"><option ${type==='Kontrakt'?'selected':''}>Kontrakt</option><option ${type==='Styrevedtak'?'selected':''}>Styrepapir</option><option ${type==='Tilbudsgodkjenning'?'selected':''}>Tilbud</option><option>FDV</option><option>HMS</option><option>Annet</option></select></label>`);
  }
}
const __dpOriginalSaveSignatureRequest=typeof saveSignatureRequest==='function'?saveSignatureRequest:null;
saveSignatureRequest=async function(relatedType='',relatedId=''){
  const category=signatureArchiveCategory({});
  if(__dpOriginalSaveSignatureRequest){
    await __dpOriginalSaveSignatureRequest(relatedType,relatedId);
    try{
      const rows=signatureRows();
      const latest=rows[0];
      if(latest&&!latest.archive_category)await db().from('signature_requests').update({archive_category:category}).eq('id',latest.id);
    }catch(e){console.warn(e)}
  }
}
const __dpOriginalSendSignatureEmailRow=typeof sendSignatureEmailRow==='function'?sendSignatureEmailRow:null;
sendSignatureEmailRow=async function(row,out){
  const data=await __dpOriginalSendSignatureEmailRow(row,out);
  try{
    const category=signatureArchiveCategory(row);
    await db().from('signature_requests').update({archive_category:category,updated_at:new Date().toISOString()}).eq('id',row.id);
  }catch(e){console.warn(e)}
  return data;
}
const __dpOriginalUpdateSignatureStatus=typeof updateSignatureStatus==='function'?updateSignatureStatus:null;
updateSignatureStatus=async function(id,status){
  await __dpOriginalUpdateSignatureStatus(id,status);
  if(/signert|ferdig|godkjent/i.test(status)){
    const row=(signatureRows()||[]).find(x=>String(x.id)===String(id));
    if(row)await archiveSignatureDocument({...row,status},'Signert');
  }
}
