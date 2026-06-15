/* Driftspartner OS module: 26-deviations-workorders-base.js
   Base deviations and work order creation/detail flows.
   Source: 24-storage-documents-cases.js:103-148
*/
function ensureCaseCollections(){
  let p=ensurePropertyData(property());
  p.deviations=p.deviations||[];
  p.boardCases=p.boardCases||[];
  p.contracts=p.contracts||[];
  p.quoteRequests=p.quoteRequests||[];
  return p;
}
function deviationRows(){
  let p=ensureCaseCollections();
  return p.deviations.map(d=>`<tr><td>${esc(d.id)}</td><td>${esc(d.title)}</td><td><span class="badge ${d.priority==='Kritisk'?'bad':d.priority==='Hoy'||d.priority==='Høy'?'warn':'info'}">${esc(d.priority||'Medium')}</span></td><td>${esc(d.status||'Ny')}</td><td>${esc((d.created_at||'').slice(0,10)||'I dag')}</td><td><button class="action" onclick="showDeviation('${esc(d.id)}')">Åpne</button><button class="action" onclick="showCreateWorkOrder('${esc(d.id)}')">Arbeidsordre</button></td></tr>`).join('');
}
function deviationsPage(){
  let p=ensureCaseCollections();
  return `<div class="grid"><div class="card s5"><h3>Nytt avvik for ${esc(p.name)}</h3><label>Tittel</label><input id="devTitle" value="${esc(p.risk)} - oppfølging"><label>Beskrivelse</label><textarea id="devDesc">Beskriv avvik på ${esc(p.address)}.</textarea><label>Prioritet</label><select id="devPrio"><option>Kritisk</option><option>Høy</option><option>Medium</option><option>Lav</option></select><label>Bilde/dokumentasjon</label><input id="devFile" type="file" accept="image/*,.pdf,.doc,.docx"><button class="action primary" onclick="createDeviationFromForm()">Opprett avvik</button></div><div class="card s7"><div class="dash-title"><h3>Avviksliste</h3><button class="action" onclick="refreshCaseFlow()">Oppdater fra Supabase</button></div><table id="devTable"><tr><th>ID</th><th>Tittel</th><th>Prioritet</th><th>Status</th><th>Dato</th><th>Handling</th></tr>${deviationRows()}</table></div></div>`;
}
async function createDeviationFromForm(){
  let p=ensureCaseCollections(),title=document.getElementById('devTitle').value,description=document.getElementById('devDesc').value,priority=document.getElementById('devPrio').value,file=document.getElementById('devFile')?.files?.[0],row=null,storage='Supabase-feil';
  try{row=await saveDeviationToSupabase(title,description,priority);storage='Supabase';if(file)await uploadPropertyDocument({category:'Avvik',title:`Avvik ${title} - ${file.name}`,file,status:'Dokumentasjon'});}catch(e){row={id:'AV-'+Date.now().toString().slice(-5),title,description,priority,status:'Ny',created_at:new Date().toISOString()};storage='Supabase-feil: '+e.message}
  p.deviations.unshift(row);p.dev=p.deviations.length;p.openCases=p.deviations.filter(d=>d.status!=='Lukket').length;logActivity('Avvik opprettet',row.id);
  showDrawer('Avvik opprettet',`<table><tr><td>ID</td><td>${esc(row.id)}</td></tr><tr><td>Tittel</td><td>${esc(title)}</td></tr><tr><td>Prioritet</td><td>${esc(priority)}</td></tr><tr><td>Lagring</td><td>${esc(storage)}</td></tr></table><button class="action primary" onclick="showCreateWorkOrder('${esc(row.id)}')">Lag arbeidsordre</button><button class="action" onclick="openTab('Saksløp')">Se saksløp</button>`);
}
function showDeviation(id,title=''){
  let p=ensureCaseCollections(),d=p.deviations.find(x=>String(x.id)===String(id))||{id,title:title||p.risk,description:'',priority:'Kritisk',status:'Ny'};
  showDrawer('Avvik '+d.id,`<table><tr><td>Eiendom</td><td>${esc(p.name)}</td></tr><tr><td>Tittel</td><td>${esc(d.title)}</td></tr><tr><td>Prioritet</td><td>${esc(d.priority||'-')}</td></tr><tr><td>Status</td><td>${esc(d.status||'Ny')}</td></tr><tr><td>Beskrivelse</td><td>${esc(d.description||'-')}</td></tr></table><label>Endre status</label><select id="devStatus"><option>Ny</option><option>Pågår</option><option>Venter tilbud</option><option>Utført</option><option>Lukket</option></select><label>Koble bilde/dokument</label><input id="devAttachFile" type="file" accept="image/*,.pdf,.doc,.docx"><button class="action" onclick="updateDeviationStatus('${esc(d.id)}')">Lagre status</button><button class="action" onclick="attachDeviationDocument('${esc(d.id)}')">Last opp vedlegg</button><button class="action primary" onclick="showCreateWorkOrder('${esc(d.id)}')">Lag arbeidsordre</button><button class="action" onclick="showQuoteRequest('${esc(d.id)}')">Lag tilbudsforespørsel</button>`);
}
async function updateDeviationStatus(id){
  let p=ensureCaseCollections(),status=document.getElementById('devStatus').value,d=p.deviations.find(x=>String(x.id)===String(id));if(d)d.status=status;
  try{if(isUuid(id)){let db=supabaseClient();let {error}=await db.from('deviations').update({status}).eq('id',id);if(error)throw error}}catch(e){}
  p.openCases=p.deviations.filter(x=>x.status!=='Lukket').length;logActivity('Avviksstatus endret til '+status,id);showDeviation(id);
}
async function attachDeviationDocument(id){
  let file=document.getElementById('devAttachFile')?.files?.[0];if(!file){showDrawer('Mangler fil',`<div class="output">Velg bilde eller dokument først.</div>`);return}
  let result=await uploadPropertyDocument({category:'Avvik',title:`Avvik ${id} - ${file.name}`,file,status:'Dokumentasjon'});logActivity('Vedlegg koblet til avvik',id);
  showDrawer('Vedlegg lagret',`<div class="output">Fil: ${esc(file.name)}\nLagring: ${esc(result.storage)}\nSti: ${esc(result.path)}</div><button class="action" onclick="showDeviation('${esc(id)}')">Tilbake til avvik</button>`);
}
function showCreateWorkOrder(deviationId=''){
  let p=ensureCaseCollections(),dev=p.deviations.find(d=>String(d.id)===String(deviationId)),board=p.boardMembers.map(m=>`<option value="${esc(m.email)}">${esc(m.name)} · ${esc(m.role)}</option>`).join('');
  showDrawer('Opprett arbeidsordre',`<label>Eiendom</label><input value="${esc(p.name)}" disabled><input id="woDeviationId" type="hidden" value="${esc(deviationId)}"><label>Sak / avvik</label><input id="woTitle" value="${esc(dev?.title||p.risk)}"><label>Ansvarlig</label><select id="woOwner"><option>Vaktmester</option>${state.suppliers.filter(s=>s.email).map(s=>`<option>${esc(s.name)}</option>`).join('')}</select><label>Send kopi til styreleder/styre</label><select id="woBoard">${board}</select><label>Status</label><select id="woStatus"><option>Ny</option><option>Pågår</option><option>Venter tilbud</option><option>Utført</option></select><label>Frist</label><input id="woDue" value="2026-06-15"><label>Instruks / relevant info</label><textarea id="woInfo">Beskriv befaring, bilder, HMS-krav og ønsket dokumentasjon.</textarea><button class="action primary" onclick="createWorkOrderDrawer()">Lagre arbeidsordre</button>`);
}
async function createWorkOrderDrawer(){
  let p=ensureCaseCollections(),deviationId=document.getElementById('woDeviationId')?.value||'',title=document.getElementById('woTitle').value,owner=document.getElementById('woOwner').value,board=document.getElementById('woBoard').value,due=document.getElementById('woDue').value,info=document.getElementById('woInfo').value,status=document.getElementById('woStatus')?.value||'Ny',id='WO-'+Date.now().toString().slice(-5),storage='Supabase-feil';
  try{let db=supabaseClient(),insert={property_id:p.id,title,description:`Ansvarlig: ${owner}\nKopi styre: ${board}\n\n${info}`,status,due_date:due||null};if(isUuid(deviationId))insert.deviation_id=deviationId;let {data,error}=await db.from('work_orders').insert(insert).select().single();if(error)throw error;id=data.id;storage='Supabase'}catch(e){storage='Supabase-feil: '+e.message}
  p.workOrders.unshift({id,title,owner,status,due,source:storage,board,info,deviation_id:deviationId});logActivity('Arbeidsordre opprettet',id);
  showDrawer('Arbeidsordre opprettet',`<table><tr><td>ID</td><td>${esc(id)}</td></tr><tr><td>Avvik</td><td>${esc(deviationId||'-')}</td></tr><tr><td>Sak</td><td>${esc(title)}</td></tr><tr><td>Ansvarlig</td><td>${esc(owner)}</td></tr><tr><td>Status</td><td>${esc(status)}</td></tr><tr><td>Lagring</td><td>${esc(storage)}</td></tr></table><button class="action primary" onclick="showQuoteRequest('${esc(id)}')">Lag tilbudsforespørsel</button><button class="action" onclick="openTab('Saksløp')">Se saksløp</button>`);
}
