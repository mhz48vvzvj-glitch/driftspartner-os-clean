function PeoplePage(){
  const contacts=DP.cache.contacts||[],roleOf=c=>String(c.role||c.contact_role||c.contact_type||c.type||''),board=contacts.filter(c=>/styre|leder|vara/i.test(roleOf(c))),res=contacts.filter(c=>/bebo|resident|leilighet|enhet/i.test(roleOf(c))),other=contacts.filter(c=>!board.includes(c)&&!res.includes(c));
  return `<div class="grid"><div class="card s12"><div class="dash-title"><h3>Beboere og styre</h3><div><button class="action primary" onclick="showPersonForm('Beboer')">Legg til beboer</button><button class="action" onclick="showPersonForm('Styremedlem')">Legg til styremedlem</button><button class="action" onclick="showUserForm()">Opprett innlogging</button></div></div></div>
  <div class="card s6"><h3>Styre</h3>${personTable(board)}</div><div class="card s6"><h3>Beboere</h3>${personTable(res)}</div><div class="card s12"><h3>Andre kontakter</h3>${personTable(other)}</div></div>`;
}
function personTable(rows){return table(['Navn','Rolle','E-post','Telefon','Handling'],rows.map(c=>`<tr><td>${esc(c.name||'-')}</td><td>${esc(c.role||c.contact_role||c.contact_type||c.type||'-')}</td><td>${esc(c.email||'-')}</td><td>${esc(c.phone||'-')}</td><td><button class="action red" onclick="deleteContact('${esc(c.id)}')">Slett</button></td></tr>`))}
function showPersonForm(role){showDrawer('Legg til '+role,`<label>Navn</label><input id="personName"><label>Rolle</label><input id="personRole" value="${esc(role)}"><label>E-post</label><input id="personEmail"><label>Telefon</label><input id="personPhone"><label>Notat/enhet</label><textarea id="personNotes"></textarea><button class="action primary" onclick="saveContact()">Lagre</button><div id="personOut" class="output">Klar til lagring.</div>`)}
function isPeopleSchemaError(error){return /column|schema|cache|relation|does not exist|could not find|not-null|null value|violates/i.test(String(error?.message||error||''))}
async function saveContact(){
  const out=document.getElementById('personOut');
  try{
    requireLive('lagre kontakt');
    if(out)out.textContent='Lagrer kontakt...';
    const propertyId=currentProperty().id,name=personName.value.trim(),role=personRole.value.trim()||'Kontakt',email=personEmail.value.trim(),phone=personPhone.value.trim(),notes=personNotes.value.trim();
    if(!name)throw new Error('Fyll inn navn.');
    const variants=[
      {property_id:propertyId,name,role,contact_role:role,contact_type:role,email,phone,notes},
      {property_id:propertyId,name,role,contact_role:role,contact_type:role,email,phone},
      {property_id:propertyId,name,role,email,phone,notes},
      {property_id:propertyId,name,contact_role:role,email,phone,notes},
      {property_id:propertyId,name,contact_type:role,email,phone,notes},
      {property_id:propertyId,name,role,email,phone},
      {property_id:propertyId,name,contact_role:role,email,phone},
      {property_id:propertyId,name,contact_type:role,email,phone},
      {property_id:propertyId,name,email,phone},
      {property_id:propertyId,name,role},
      {property_id:propertyId,name,contact_role:role},
      {property_id:propertyId,name,contact_type:role},
      {property_id:propertyId,name}
    ];
    let r,lastError=null;
    for(const row of variants){
      r=await db().from('property_contacts').insert(row).select().single();
      if(!r.error)break;
      lastError=r.error;
      if(!isPeopleSchemaError(r.error))break;
    }
    if(r?.error)throw lastError||r.error;
    await insertActivity('Kontakt lagret','contact',r.data?.id||name);
    await hydrateAll();hideDrawer();render();
  }catch(e){
    const msg=isPeopleSchemaError(e)?'Kontakt-tabellen mangler riktig oppsett eller tilgang. Kjør supabase-people-v1.sql i Supabase og prøv igjen.':customerError(e);
    showDrawer('Kontakt ble ikke lagret',`<div class=\"output\">${esc(msg)}</div>`);
  }
}
async function deleteContact(id){if(!confirm('Slette kontakt?'))return;try{requireLive('slette kontakt');const r=await db().from('property_contacts').delete().eq('id',id);if(r.error)throw r.error;await insertActivity('Kontakt slettet','contact',id);await hydrateAll();render()}catch(e){showDrawer('Kontakt ble ikke slettet',`<div class=\"output\">${esc(customerError(e))}</div>`)}}
function showUserForm(){showDrawer('Opprett bruker med innlogging',`<label>Navn</label><input id="newName"><label>E-post</label><input id="newEmail"><label>Telefon</label><input id="newPhone"><label>Rolle</label><select id="newRole"><option value="beboer">Beboer</option><option value="styreleder">Styreleder</option><option value="styremedlem">Styremedlem</option><option value="vaktmester">Vaktmester</option><option value="leverandor">Leverandor</option></select><label>Midlertidig passord</label><input id="newPassword" type="password"><button class="action primary" onclick="createUserLogin()">Opprett bruker</button><div id="newUserOut" class="output">Krever Netlify Functions med Supabase servernokkel.</div>`)}
async function createUserLogin(){const out=document.getElementById('newUserOut');try{requireLive('opprette bruker');const token=DP.session?.access_token;if(!token)throw new Error('Mangler innloggingstoken.');const access={beboer:'resident',styreleder:'owner',styremedlem:'member',vaktmester:'caretaker',leverandor:'vendor'}[newRole.value]||'member';const res=await fetch('/.netlify/functions/create-user',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({name:newName.value,email:newEmail.value,phone:newPhone.value,role:newRole.value,property_id:currentProperty().id,access_role:access,password:newPassword.value})});const data=await readJsonResponse(res,'Bruker-tjenesten svarte ikke riktig. Publiser siste pakke og prøv igjen.');if(!data.ok)throw new Error(data.message);out.textContent='Bruker opprettet.';await insertActivity('Bruker opprettet','user',data.user?.id||newEmail.value)}catch(e){setOutputError(out,e)}}

function CasesPage(){const devs=DP.cache.deviations||[],wos=DP.cache.work_orders||[];return `<div class="grid"><div class="card s12"><div class="dash-title"><h3>Avvik og arbeidsordre</h3><div><button class="action primary" onclick="showDeviationForm()">Nytt avvik</button><button class="action" onclick="showWorkOrderForm()">Ny arbeidsordre</button><button class="action" onclick="showCaseFlow()">Full saksløp</button></div></div></div><div class="card s6"><h3>Avvik</h3>${deviationTable(devs)}</div><div class="card s6"><h3>Arbeidsordre</h3>${workOrderTable(wos)}</div></div>`}
function deviationTable(rows){return table(['Tittel','Kategori','Prioritet','Status','Handling'],rows.map(d=>`<tr><td>${esc(d.title)}</td><td>${esc(d.category)}</td><td>${esc(d.priority)}</td><td>${esc(d.status)}</td><td><button class="action" onclick="showCaseFlow('${esc(d.id)}')">Saksløp</button><button class="action" onclick="showWorkOrderForm('${esc(d.id)}')">Arbeidsordre</button><button class="action red" onclick="deleteRow('deviations','${esc(d.id)}')">Slett</button></td></tr>`))}
function workOrderTable(rows){return table(['Tittel','Frist','Status','Handling'],rows.map(w=>`<tr><td>${esc(w.title)}</td><td>${esc(w.due_date||'-')}</td><td>${esc(w.status)}</td><td><button class="action" onclick="showRfqForm('${esc(w.id)}')">Tilbudsforespørsel</button><button class="action red" onclick="deleteRow('work_orders','${esc(w.id)}')">Slett</button></td></tr>`))}
function showDeviationForm(){showDrawer('Nytt avvik',`<label>Tittel</label><input id="devTitle"><label>Beskrivelse</label><textarea id="devDesc"></textarea><label>Kategori</label><select id="devCat"><option>Tak</option><option>VVS</option><option>Elektro</option><option>Uteomrade</option><option>HMS</option><option>Annet</option></select><label>Prioritet</label><select id="devPrio"><option>Lav</option><option>Medium</option><option>Hoy</option><option>Kritisk</option></select><button class="action primary" onclick="saveDeviation()">Lagre avvik</button>`)}
async function saveDeviation(){try{requireLive('lagre avvik');const r=await db().from('deviations').insert({property_id:currentProperty().id,title:devTitle.value,description:devDesc.value,category:devCat.value,priority:devPrio.value,status:'Ny'}).select().single();if(r.error)throw r.error;await insertActivity('Avvik opprettet','deviation',r.data.id);await hydrateAll();hideDrawer();render()}catch(e){showDrawer('Avvik ble ikke lagret',`<div class=\"output\">${esc(customerError(e))}</div>`)}}
function showWorkOrderForm(deviationId=''){showDrawer('Ny arbeidsordre',`<input id="woDev" type="hidden" value="${esc(deviationId)}"><label>Tittel</label><input id="woTitle"><label>Beskrivelse</label><textarea id="woDesc"></textarea><label>Frist</label><input id="woDue" type="date"><button class="action primary" onclick="saveWorkOrder()">Lagre arbeidsordre</button>`)}
async function saveWorkOrder(){try{requireLive('lagre arbeidsordre');let row={property_id:currentProperty().id,title:woTitle.value,description:woDesc.value,due_date:woDue.value||null,status:'Ny'};if(isUuid(woDev.value))row.deviation_id=woDev.value;const r=await db().from('work_orders').insert(row).select().single();if(r.error)throw r.error;await insertActivity('Arbeidsordre opprettet','work_order',r.data.id);await hydrateAll();hideDrawer();render()}catch(e){showDrawer('Arbeidsordre ble ikke lagret',`<div class=\"output\">${esc(customerError(e))}</div>`)}}
async function deleteRow(tableName,id){if(!confirm('Slette raden?'))return;try{requireLive('slette');const r=await db().from(tableName).delete().eq('id',id);if(r.error)throw r.error;await insertActivity('Slettet '+tableName,'delete',id);await hydrateAll();render()}catch(e){showDrawer('Sletting feilet',`<div class=\"output\">${esc(customerError(e))}</div>`)}}

function findCaseParts(deviationId=''){
  const devs=DP.cache.deviations||[],wos=DP.cache.work_orders||[],rfqs=DP.cache.quote_requests||[],offers=DP.cache.offers||[],docs=DP.cache.documents||[];
  const deviation=devs.find(d=>d.id===deviationId)||devs[0]||null;
  const workOrder=deviation?wos.find(w=>w.deviation_id===deviation.id)||wos[0]||null:wos[0]||null;
  const rfq=workOrder?rfqs.find(q=>q.work_order_id===workOrder.id)||rfqs[0]||null:rfqs[0]||null;
  const offer=offers[0]||null;
  const hasDoc=cat=>docs.some(d=>String(d.category||'').toLowerCase()===cat.toLowerCase());
  return {deviation,workOrder,rfq,offer,docs,hasBoard:hasDoc('Styrepapir'),hasContract:hasDoc('Kontrakt'),hasFdv:hasDoc('FDV'),hasReport:docs.some(d=>/rapport/i.test(d.title||''))};
}
function showCaseFlow(deviationId=''){
  const c=findCaseParts(deviationId);
  const selected=(DP.cache.deviations||[]).map(d=>`<option value="${esc(d.id)}" ${c.deviation?.id===d.id?'selected':''}>${esc(d.title)}</option>`).join('');
  showDrawer('Full saksløp',`<label>Velg avvik</label><select id="flowDeviation" onchange="showCaseFlow(this.value)">${selected}</select>${caseFlowStatus(c)}<div class="flow-actions"><button class="action primary" onclick="flowCreateWorkOrder()">1. Lag arbeidsordre</button><button class="action" onclick="flowCreateRfq()">2. Lag tilbudsforespørsel</button><button class="action" onclick="showOfferForm()">3. Last opp tilbud/PDF</button><button class="action" onclick="flowBoardApproval()">4. Styregodkjenning</button><button class="action" onclick="flowContract()">5. Generer kontrakt</button><button class="action" onclick="flowFdv()">6. Oppdater FDV</button></div><label>Sluttrapport / utført arbeid</label><textarea id="flowReportText" rows="7" placeholder="Skriv hva som er gjort, vurdering, avvik, anbefaling og neste steg."></textarea><button class="action primary" onclick="flowReport()">7. Lag rapport</button><div id="flowOut" class="output">Alle steg lagres live mot valgt eiendom.</div>`);
}
function caseFlowStatus(c){
  const item=(name,ok,detail)=>`<tr><td>${esc(name)}</td><td>${ok?'OK':'Mangler'}</td><td>${esc(detail||'-')}</td></tr>`;
  return table(['Steg','Status','Detalj'],[
    item('Avvik',!!c.deviation,c.deviation?.title),
    item('Arbeidsordre',!!c.workOrder,c.workOrder?.title),
    item('Tilbudsforespørsel',!!c.rfq,c.rfq?.title),
    item('Tilbud/PDF',!!c.offer,c.offer?`${money(c.offer.price)} - ${c.offer.status||''}`:''),
    item('Styregodkjenning',c.hasBoard,'Styrepapir i dokumentarkiv'),
    item('Kontrakt',c.hasContract,'Kontrakt i dokumentarkiv'),
    item('FDV',c.hasFdv,'FDV-dokument i dokumentarkiv'),
    item('Rapport',c.hasReport,'Rapport i dokumentarkiv')
  ]);
}
function flowSelectedDeviation(){const id=document.getElementById('flowDeviation')?.value;const c=findCaseParts(id);if(!c.deviation)throw new Error('Opprett eller velg avvik først.');return c}
async function flowCreateWorkOrder(){
  const out=document.getElementById('flowOut');
  try{requireLive('lage arbeidsordre');const c=flowSelectedDeviation();if(c.workOrder)throw new Error('Arbeidsordre finnes allerede for denne saken.');const row={property_id:currentProperty().id,deviation_id:c.deviation.id,title:c.deviation.title,description:c.deviation.description||'',status:'Ny'};const r=await db().from('work_orders').insert(row).select().single();if(r.error)throw r.error;await db().from('deviations').update({status:'Arbeidsordre opprettet'}).eq('id',c.deviation.id);await insertActivity('Arbeidsordre laget fra avvik','work_order',r.data.id);await hydrateAll();out.textContent='Arbeidsordre opprettet.';showCaseFlow(c.deviation.id)}catch(e){if(out)setOutputError(out,e)}
}
async function flowCreateRfq(){
  const out=document.getElementById('flowOut');
  try{requireLive('lage tilbudsforespørsel');const c=flowSelectedDeviation();if(!c.workOrder)throw new Error('Lag arbeidsordre først.');if(c.rfq)throw new Error('Tilbudsforespørsel finnes allerede for denne saken.');const row={property_id:currentProperty().id,work_order_id:c.workOrder.id,title:c.workOrder.title||c.deviation.title,description:c.workOrder.description||c.deviation.description||'',deadline:null,status:'Utkast'};const r=await db().from('quote_requests').insert(row).select().single();if(r.error)throw r.error;await db().from('work_orders').update({status:'Tilbudsforespørsel opprettet'}).eq('id',c.workOrder.id);await insertActivity('Tilbudsforespørsel laget fra arbeidsordre','quote_request',r.data.id);await hydrateAll();out.textContent='Tilbudsforespørsel opprettet.';showCaseFlow(c.deviation.id)}catch(e){if(out)setOutputError(out,e)}
}
function safeStorageName(value){
  return String(value||'dokument')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[æÆ]/g,'ae')
    .replace(/[øØ]/g,'o')
    .replace(/[åÅ]/g,'a')
    .replace(/[^A-Za-z0-9._-]+/g,'-')
    .replace(/-+/g,'-')
    .replace(/^[.-]+|[.-]+$/g,'')
    .slice(0,90)||'dokument';
}
async function uploadGeneratedDocument(title,category,text,status='Arkivert'){
  requireLive('lagre dokument');
  const safeTitle=safeStorageName(title||category);
  const safeCategory=safeStorageName(category);
  const path=`${currentProperty().id}/${safeCategory}/${Date.now()}-${safeTitle}.html`;
  const blob=new Blob([text],{type:'text/html;charset=utf-8'});
  const up=await db().storage.from('documents').upload(path,blob,{upsert:false,contentType:'text/html;charset=utf-8'});
  if(up.error)throw up.error;
  const r=await db().from('documents').insert({property_id:currentProperty().id,title,category,storage_path:path,mime_type:'text/html',status}).select().single();
  if(r.error)throw r.error;
  await insertActivity(`${category} opprettet`, 'document', r.data.id);
  return r.data;
}
function generatedCaseDocument(kind,c,extraText=''){
  const p=currentProperty();
  const title=esc(kind);
  const clean=v=>esc(String(v??'-').replace(/\u00a0/g,' '));
  const rows=[
    ['Eiendom',p?.name||'-'],
    ['Avvik',c.deviation?.title||'-'],
    ['Arbeidsordre',c.workOrder?.title||'-'],
    ['Tilbudsforespørsel',c.rfq?.title||'-'],
    ['Tilbud',c.offer?money(c.offer.price):'-'],
    ['Status',c.workOrder?.status||c.deviation?.status||'-'],
    ['Dato',new Date().toLocaleString('nb-NO')]
  ];
  const extra=String(extraText||'').trim();
  return `<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;background:#eef3f9;color:#172033;font-family:Arial,Helvetica,sans-serif;line-height:1.55}
    .page{max-width:900px;margin:34px auto;background:#fff;border:1px solid #d8e0eb;border-radius:16px;box-shadow:0 18px 50px rgba(19,31,55,.12);overflow:hidden}
    header{background:linear-gradient(135deg,#06101f,#0d347d 62%,#176bff);color:#fff;padding:34px 38px}
    header small{display:block;color:#c5d9f7;text-transform:uppercase;letter-spacing:.08em;font-weight:700}
    h1{margin:8px 0 0;font-size:32px;line-height:1.15}
    .meta{margin-top:12px;color:#dbe8ff}
    main{padding:32px 38px}
    .summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:26px}
    .field{border:1px solid #e2e9f2;background:#fbfdff;border-radius:12px;padding:14px 16px}
    .field span{display:block;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
    .field strong{display:block;margin-top:5px;color:#142033;font-size:16px}
    .report-text{border:1px solid #dbe6f3;background:#fbfdff;border-radius:14px;padding:20px 22px;margin:0 0 24px}
    .report-text h2{margin:0 0 10px;font-size:20px;color:#142033}
    .report-text p{margin:0;white-space:normal;color:#26384f}
    .note{border-left:4px solid #176bff;background:#eef5ff;padding:16px 18px;border-radius:10px;color:#26384f}
    footer{padding:18px 38px;color:#6c7b91;background:#f8fafc;border-top:1px solid #e6edf5;font-size:13px}
    @media(max-width:680px){.page{margin:0;border-radius:0}.summary{grid-template-columns:1fr}header,main,footer{padding-left:22px;padding-right:22px}}
  </style>
</head>
<body>
  <section class="page">
    <header>
      <small>Driftspartner OS</small>
      <h1>${title}</h1>
      <div class="meta">${clean(p?.name||'Eiendom')} · ${clean(new Date().toLocaleString('nb-NO'))}</div>
    </header>
    <main>
      <section class="summary">
        ${rows.map(r=>`<div class="field"><span>${clean(r[0])}</span><strong>${clean(r[1])}</strong></div>`).join('')}
      </section>
      ${extra?`<section class="report-text"><h2>Notat</h2><p>${clean(extra).replace(/\n/g,'<br>')}</p></section>`:''}
      <div class="note">Dette dokumentet er opprettet fra saksløpet i Driftspartner OS og lagret på valgt eiendom.</div>
    </main>
    <footer>${clean(p?.name||'Eiendom')} · Driftspartner OS</footer>
  </section>
</body>
</html>`;
}
function showCaseFlowResult(message,doc){const out=document.getElementById('flowOut');if(out)out.innerHTML=`${esc(message)}<br><button class="action primary" onclick="openDocument('${esc(doc.id)}')">Åpne dokument</button>`}
async function flowBoardApproval(){const out=document.getElementById('flowOut');try{const c=flowSelectedDeviation();if(!c.offer)throw new Error('Last opp tilbud før styregodkjenning.');const doc=await uploadGeneratedDocument('Styregodkjenning - '+c.deviation.title,'Styrepapir',generatedCaseDocument('Styregodkjenning',c),'Godkjent');await insertActivity('Styregodkjenning registrert','board',c.deviation.id);await hydrateAll();showCaseFlow(c.deviation.id);setTimeout(()=>showCaseFlowResult('Styregodkjenning lagret i dokumentarkivet.',doc),0)}catch(e){if(out)setOutputError(out,e)}}
async function flowContract(){const out=document.getElementById('flowOut');try{const c=flowSelectedDeviation();if(!c.offer)throw new Error('Last opp tilbud før kontrakt.');const doc=await uploadGeneratedDocument('Kontrakt - '+c.deviation.title,'Kontrakt',generatedCaseDocument('Kontrakt',c),'Klar');if(c.workOrder)await db().from('work_orders').update({status:'Kontrakt'}).eq('id',c.workOrder.id);await hydrateAll();showCaseFlow(c.deviation.id);setTimeout(()=>showCaseFlowResult('Kontrakt lagret i dokumentarkivet.',doc),0)}catch(e){if(out)setOutputError(out,e)}}
async function flowFdv(){const out=document.getElementById('flowOut');try{const c=flowSelectedDeviation();const doc=await uploadGeneratedDocument('FDV oppdatert - '+c.deviation.title,'FDV',generatedCaseDocument('FDV-oppdatering',c),'Arkivert');if(c.workOrder)await db().from('work_orders').update({status:'Utført'}).eq('id',c.workOrder.id);await db().from('deviations').update({status:'Lukket'}).eq('id',c.deviation.id);await hydrateAll();showCaseFlow(c.deviation.id);setTimeout(()=>showCaseFlowResult('FDV oppdatert og sak lukket.',doc),0)}catch(e){if(out)setOutputError(out,e)}}
async function flowReport(){const out=document.getElementById('flowOut');try{const c=flowSelectedDeviation();const note=document.getElementById('flowReportText')?.value||'';const doc=await uploadGeneratedDocument('Rapport - '+c.deviation.title,'Annet',generatedCaseDocument('Sluttrapport',c,note),'Ferdig');await hydrateAll();showCaseFlow(c.deviation.id);setTimeout(()=>showCaseFlowResult('Rapport lagret i dokumentarkivet.',doc),0)}catch(e){if(out)setOutputError(out,e)}}

function DocumentsPage(){
  const docs=DP.cache.documents||[],cats=['Alle','FDV','HMS','Tilbud','Kontrakt','Styrepapir','Bilde','Tegning','Annet'];
  const active=DP.docCat||'Alle';
  const filtered=active==='Alle'?docs:docs.filter(d=>String(d.category||'')===active);
  const byCat=c=>docs.filter(d=>String(d.category||'')===c).length;
  const stats=cats.slice(1).map(c=>`<button class="action ${active===c?'primary':''}" onclick="DP.docCat='${esc(c)}';render()">${esc(c)} (${byCat(c)})</button>`).join('');
  return `<div class="grid"><div class="card s12"><div class="dash-title"><h3>Dokumentarkiv</h3><button class="action primary" onclick="showDocForm()">Last opp dokument</button></div><div class="row"><button class="action ${active==='Alle'?'primary':''}" onclick="DP.docCat='Alle';render()">Alle (${docs.length})</button>${stats}</div>${documentsTable(filtered)}</div></div>`;
}
function documentsTable(docs){
  return table(['Tittel','Kategori','Knyttet til','Versjon','Utløp','Status','Handling'],docs.map(d=>`<tr><td>${esc(d.title)}</td><td>${esc(d.category)}</td><td>${esc(documentLinkLabel(d))}</td><td>v${esc(d.version||1)}</td><td>${esc(d.expires_at||'-')}</td><td>${esc(d.status||'Arkivert')}</td><td><button class="action" onclick="showDocumentDetails('${esc(d.id)}')">Detaljer</button><button class="action" onclick="openDocument('${esc(d.id)}')">Åpne</button><button class="action" onclick="showDocumentVersionForm('${esc(d.id)}')">Ny versjon</button><button class="action red" onclick="deleteDocument('${esc(d.id)}','${esc(d.storage_path)}')">Slett</button></td></tr>`));
}
function documentLinkLabel(d){
  const buildings=DP.cache.buildings||[],devs=DP.cache.deviations||[],wos=DP.cache.work_orders||[];
  const b=buildings.find(x=>x.id===d.building_id),dev=devs.find(x=>x.id===d.deviation_id),wo=wos.find(x=>x.id===d.work_order_id);
  return [b?.name,dev?`Avvik: ${dev.title}`:'',wo?`Arbeidsordre: ${wo.title}`:''].filter(Boolean).join(' · ')||'Eiendom';
}
function docOptions(rows,selected=''){return rows.map(r=>`<option value="${esc(r.id)}" ${r.id===selected?'selected':''}>${esc(r.name||r.title)}</option>`).join('')}
function showDocForm(){
  const buildings=DP.cache.buildings||[],devs=DP.cache.deviations||[],wos=DP.cache.work_orders||[];
  showDrawer('Last opp dokument',`<label>Tittel</label><input id="docTitle"><label>Kategori</label><select id="docCat"><option>FDV</option><option>HMS</option><option>Tilbud</option><option>Kontrakt</option><option>Styrepapir</option><option>Bilde</option><option>Tegning</option><option>Annet</option></select><label>Bygg</label><select id="docBuilding"><option value="">Hele eiendommen</option>${docOptions(buildings)}</select><label>Knytt til sak</label><select id="docCase"><option value="">Ingen sak</option><optgroup label="Avvik">${docOptions(devs)}</optgroup><optgroup label="Arbeidsordre">${docOptions(wos)}</optgroup></select><label>Utløpsdato / fornyelse</label><input id="docExpires" type="date"><label>Notat</label><textarea id="docNotes" placeholder="Kort beskrivelse, garanti, kontrollfrist eller annen relevant informasjon"></textarea><label>Fil</label><input id="docFile" type="file"><button class="action primary" onclick="uploadDocument()">Last opp</button><div id="docOut" class="output"></div>`);
}
function documentPayloadFromForm(path,file){
  const caseId=document.getElementById('docCase')?.value||'',devs=DP.cache.deviations||[],wos=DP.cache.work_orders||[];
  const row={property_id:currentProperty().id,title:docTitle.value.trim()||file.name,category:docCat.value,storage_path:path,mime_type:file.type||null,status:'Arkivert',version:1,building_id:docBuilding.value||null,expires_at:docExpires.value||null,notes:docNotes.value.trim()||null};
  if(devs.some(d=>d.id===caseId))row.deviation_id=caseId;
  if(wos.some(w=>w.id===caseId))row.work_order_id=caseId;
  return row;
}
async function insertDocumentRow(row){
  let r=await db().from('documents').insert(row).select().single();
  if(!r.error)return r;
  if(!/column|schema|cache|relationship/i.test(String(r.error.message||'')))return r;
  const minimal={property_id:row.property_id,title:row.title,category:row.category,storage_path:row.storage_path,mime_type:row.mime_type,status:row.status};
  return await db().from('documents').insert(minimal).select().single();
}
async function uploadDocument(){
  const out=document.getElementById('docOut');
  try{
    requireLive('laste opp dokument');
    const file=docFile.files[0];if(!file)throw new Error('Velg fil.');
    const path=`${currentProperty().id}/${safeStorageName(docCat.value)}/${Date.now()}-${safeStorageName(file.name)}`;
    let up=await db().storage.from('documents').upload(path,file,{upsert:false,contentType:file.type||undefined});if(up.error)throw up.error;
    let r=await insertDocumentRow(documentPayloadFromForm(path,file));if(r.error)throw r.error;
    await saveDocumentVersion(r.data,file,path,1);
    await insertActivity('Dokument lastet opp','document',r.data.id);
    await hydrateAll();hideDrawer();render();
  }catch(e){setOutputError(out,e,'Dokumentet kunne ikke lastes opp. Sjekk filen og prøv igjen.')}
}
async function openDocument(idOrPath){
  try{
    const docs=DP.cache.documents||[];
    const doc=docs.find(d=>d.id===idOrPath)||docs.find(d=>d.storage_path===idOrPath)||{storage_path:idOrPath,title:'Dokument'};
    const path=doc.storage_path;
    const r=await db().storage.from('documents').createSignedUrl(path,120);
    if(r.error)throw r.error;
    const mime=String(doc.mime_type||'').toLowerCase();
    if(mime.includes('html')||String(path).toLowerCase().endsWith('.html')){
      const res=await fetch(r.data.signedUrl);
      if(!res.ok)throw new Error('Kunne ikke hente dokumentvisning.');
      const html=await res.text();
      showDrawer(doc.title||'Dokument',`<iframe id="docPreviewFrame" title="Dokumentvisning" style="width:100%;height:72vh;border:1px solid #263850;border-radius:10px;background:#fff"></iframe><div class="row"><button class="action" onclick="window.open('${esc(r.data.signedUrl)}','_blank')">Åpne original</button></div>`);
      const frame=document.getElementById('docPreviewFrame');
      if(frame)frame.srcdoc=html;
      return;
    }
    window.open(r.data.signedUrl,'_blank')
  }catch(e){showDrawer('Kunne ikke åpne dokument',`<div class=\"output\">${esc(customerError(e))}</div>`)}
}
function showDocumentDetails(id){
  const d=(DP.cache.documents||[]).find(x=>x.id===id);if(!d)return;
  const versions=(DP.cache.document_versions||[]).filter(v=>v.document_id===id);
  const rows=[
    ['Tittel',d.title],['Kategori',d.category],['Knyttet til',documentLinkLabel(d)],['Versjon','v'+(d.version||1)],['Utløpsdato',d.expires_at||'-'],['Status',d.status||'Arkivert'],['Notat',d.notes||'-']
  ].map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('');
  const versionRows=versions.map(v=>`<tr><td>v${esc(v.version||'-')}</td><td>${esc(v.created_at||'-')}</td><td>${esc(v.file_name||v.storage_path||'-')}</td><td><button class="action" onclick="openDocumentVersion('${esc(v.storage_path)}')">Åpne</button></td></tr>`);
  showDrawer('Dokumentdetaljer',`<table>${rows}</table><div class="row"><button class="action primary" onclick="openDocument('${esc(id)}')">Åpne siste versjon</button><button class="action" onclick="showDocumentVersionForm('${esc(id)}')">Last opp ny versjon</button></div><h3>Versjoner</h3>${table(['Versjon','Dato','Fil','Handling'],versionRows,'Ingen versjonshistorikk registrert.')}`);
}
function showDocumentVersionForm(id){
  const d=(DP.cache.documents||[]).find(x=>x.id===id);if(!d)return;
  showDrawer('Ny versjon',`<p class="muted">${esc(d.title)} · gjeldende versjon v${esc(d.version||1)}</p><label>Ny fil</label><input id="docVersionFile" type="file"><label>Endringsnotat</label><textarea id="docVersionNotes" placeholder="Hva er endret i denne versjonen?"></textarea><button class="action primary" onclick="uploadDocumentVersion('${esc(id)}')">Last opp ny versjon</button><div id="docVersionOut" class="output"></div>`);
}
async function saveDocumentVersion(doc,file,path,version){
  const row={property_id:currentProperty().id,document_id:doc.id,version,storage_path:path,mime_type:file.type||null,file_name:file.name,notes:document.getElementById('docVersionNotes')?.value||doc.notes||null};
  const r=await db().from('document_versions').insert(row);
  if(r.error&&!/relation|schema|cache|does not exist/i.test(String(r.error.message||'')))throw r.error;
}
async function uploadDocumentVersion(id){
  const out=document.getElementById('docVersionOut');
  try{
    requireLive('versjonere dokument');
    const doc=(DP.cache.documents||[]).find(d=>d.id===id);if(!doc)throw new Error('Dokumentet finnes ikke.');
    const file=docVersionFile.files[0];if(!file)throw new Error('Velg fil.');
    const next=(Number(doc.version)||1)+1,path=`${currentProperty().id}/${safeStorageName(doc.category||'Dokument')}/${Date.now()}-v${next}-${safeStorageName(file.name)}`;
    const up=await db().storage.from('documents').upload(path,file,{upsert:false,contentType:file.type||undefined});if(up.error)throw up.error;
    let r=await db().from('documents').update({storage_path:path,mime_type:file.type||null,version:next,notes:docVersionNotes.value||doc.notes||null,status:'Arkivert'}).eq('id',id).select().single();
    if(r.error&&/column|schema|cache/i.test(String(r.error.message||'')))r=await db().from('documents').update({storage_path:path,mime_type:file.type||null,status:'Arkivert'}).eq('id',id).select().single();
    if(r.error)throw r.error;
    await saveDocumentVersion(r.data,file,path,next);
    await insertActivity('Dokumentversjon lastet opp','document',id);
    await hydrateAll();showDocumentDetails(id);
  }catch(e){setOutputError(out,e,'Ny dokumentversjon kunne ikke lastes opp. Prøv igjen.')}
}
async function openDocumentVersion(path){
  try{const r=await db().storage.from('documents').createSignedUrl(path,120);if(r.error)throw r.error;window.open(r.data.signedUrl,'_blank')}catch(e){showDrawer('Kunne ikke åpne versjon',`<div class="output">${esc(customerError(e))}</div>`)}
}
async function deleteDocument(id,path){
  if(!confirm('Slette dokumentet og tilhørende filversjoner?'))return;
  try{
    requireLive('slette dokument');
    const versions=(DP.cache.document_versions||[]).filter(v=>v.document_id===id).map(v=>v.storage_path).filter(Boolean);
    let r=await db().from('documents').delete().eq('id',id);if(r.error)throw r.error;
    const vr=await db().from('document_versions').delete().eq('document_id',id);
    if(vr.error&&!/relation|schema|cache|does not exist/i.test(String(vr.error.message||'')))throw vr.error;
    const files=[path,...versions].filter(Boolean);
    if(files.length)await db().storage.from('documents').remove([...new Set(files)]);
    await insertActivity('Dokument slettet','document',id);await hydrateAll();render();
  }catch(e){showDrawer('Dokument ble ikke slettet',`<div class=\"output\">${esc(customerError(e))}</div>`)}
}



