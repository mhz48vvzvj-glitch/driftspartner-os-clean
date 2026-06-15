/* Driftspartner OS module: 52-live-suppliers-offers-mail.js
   Live suppliers, offers, production email recipients and public login cleanup.
   Source: 50-drift-cases.js:161-250
*/
saveSupplier=async function(){
  let name=document.getElementById('supplierName').value.trim(),email=document.getElementById('supplierEmail').value.trim(),trade=document.getElementById('supplierTrade').value.trim(),score=+document.getElementById('supplierScore').value||0,id='s-'+Date.now(),storage='Supabase-feil';
  if(!name){showDrawer('Mangler navn','<div class="output">Skriv inn navn på leverandøren.</div>');return}
  if(!email||!email.includes('@')){showDrawer('Mangler e-post','<div class="output">Leverandøren må ha gyldig e-postadresse.</div>');return}
  try{
    let db=supabaseClient();
    let saved=await db.from('suppliers').insert({name,email,trade,score,status:'active'}).select('id').single();
    if(saved.error)throw saved.error;
    id=saved.data.id;storage='Supabase';
  }catch(e){
    if(isRealSession()){showDrawer('Leverandør ble ikke lagret',`<div class="output">${esc(e.message)}\n\nI produksjonsmodus lagres ikke leverandører lokalt.</div>`);return}
    storage='Supabase-feil: '+e.message;
  }
  let existing=state.suppliers.find(s=>String(s.id)===String(id)||s.email===email);
  if(existing)Object.assign(existing,{id,name,email,trade,score});else state.suppliers.push({id,name,email,trade,score});
  logActivity('Leverandør registrert',id);
  showDrawer('Leverandør registrert',`<table><tr><td>Navn</td><td>${esc(name)}</td></tr><tr><td>E-post</td><td>${esc(email)}</td></tr><tr><td>Fag</td><td>${esc(trade)}</td></tr><tr><td>Lagring</td><td>${esc(storage)}</td></tr></table><button class="action" onclick="openSuppliers()">Åpne leverandører</button>`);
};
saveOffer=async function(){
  let p=ensurePropertyData(property()),supplier=state.suppliers.find(x=>String(x.id)===String(document.getElementById('offerSupplier')?.value)),price=+document.getElementById('offerPrice')?.value||0,terms=document.getElementById('offerTerms')?.value||'',images=document.getElementById('offerImages')?.value||'',deadline=document.getElementById('offerDeadline')?.value||'',file=document.getElementById('offerUploadFile')?.files?.[0],title=document.getElementById('offerFileTitle')?.value||file?.name||'Tilbud.pdf',id='TIL-'+(p.offers.length+1),storage='Supabase-feil',documentResult=null;
  if(!supplier){showDrawer('Mangler leverandør','<div class="output">Registrer eller velg leverandør med e-post først.</div><button class="action" onclick="showSupplierRegistration()">Registrer leverandør</button>');return}
  if(isRealSession()&&!file){showDrawer('Mangler PDF/vedlegg','<div class="output">Velg faktisk tilbudsfil. I produksjon skal tilbud ligge i Storage og dokumentarkivet.</div>');return}
  try{
    documentResult=await uploadPropertyDocument({category:'Tilbud',title,file,status:'Mottatt'});
    let db=supabaseClient(),supplierId=await getOrCreateSupplierId(db,supplier);
    let saved=await db.from('offers').insert({property_id:p.id,supplier_id:supplierId,price,deadline,reservations:terms,status:'Mottatt'}).select('id').single();
    if(saved.error)throw saved.error;
    id=saved.data.id;
    if(documentResult.documentId){
      let linked=await db.from('offer_files').insert({offer_id:id,document_id:documentResult.documentId,title,storage_path:documentResult.path});
      if(linked.error)throw linked.error;
    }
    storage=documentResult.storage||'Supabase';
  }catch(e){
    if(isRealSession()){showDrawer('Tilbud ble ikke lagret',`<div class="output">${esc(e.message)}\n\nI produksjonsmodus lagres ikke tilbud lokalt. Rett feilen og prøv igjen.</div>`);return}
    if(!documentResult)addDocument('Tilbud',title,'Mottatt');
    storage='Supabase-feil: '+e.message;
  }
  let offer={id,supplier:supplier.name,email:supplier.email,price,deadline,file:title,images,terms,score:0};
  p.offers.push(offer);logActivity(`Tilbud lastet opp fra ${supplier.name}`,id);
  showDrawer('Tilbud lastet opp',`<table><tr><td>Leverandør</td><td>${esc(supplier.name)}</td></tr><tr><td>E-post</td><td>${esc(supplier.email)}</td></tr><tr><td>Pris</td><td>${money(price)}</td></tr><tr><td>PDF/vedlegg</td><td>${esc(title)}</td></tr><tr><td>Lagring</td><td>${esc(storage)}</td></tr></table><button class="action primary" onclick="analyzeOffer('${esc(id)}')">Analyser tilbud</button><button class="action" onclick="showDashboardQuotes()">Åpne tilbud/RFQ</button>`);
};
function dpProductionEmailsOnly(emails){
  return dpUniqueEmails((emails||[])
    .flatMap(e=>parseEmails(String(e||'')))
    .filter(e=>!['styret@kunde.no','per@kunde.no','bruker@kunde.no','test@driftspartner.no','admin@driftspartner.no'].includes(e.toLowerCase()))
  );
}
dpBoardContacts=function(p=property()){
  p=ensurePropertyData(p);
  let contacts=(p.boardMembers||p.board||[]).filter(x=>x&&x.email);
  if(contacts.length)return contacts.map(x=>({name:x.name||x.email,role:x.role||'Styremedlem',email:x.email,phone:x.phone||'',notes:x.notes||''}));
  return [];
};
dpBoardEmails=function(p=property()){
  return dpProductionEmailsOnly(dpBoardContacts(p).map(x=>x.email));
};
function allRelevantEmails(kind='general',caseId='-'){
  let p=ensurePropertyData(property()),base=dpProductionEmailsOnly([p.email,user()?.email,'post@driftspartnernord.no']),board=dpBoardEmails(p),suppliers=dpProductionEmailsOnly(dpSupplierEmails());
  if(kind==='quote'||kind==='contract')return dpProductionEmailsOnly([...suppliers,...base]);
  if(kind==='workorder'||kind==='deviation'||kind==='board')return dpProductionEmailsOnly([...base,...board,...suppliers]);
  return dpProductionEmailsOnly([...base,...board]);
}
function recipientCheckboxes(kind='general',caseId='-'){
  let emails=allRelevantEmails(kind,caseId);
  if(!emails.length)return `<div class="output">Ingen mottakere er registrert ennå. Skriv inn e-postadresser i feltet under.</div>`;
  return `<div class="recipient-grid">${emails.map((e,i)=>`<label class="tile"><input type="checkbox" class="mailRecipient" value="${esc(e)}" ${i<3?'checked':''}><span class="recipient-email">${esc(e)}</span></label>`).join('')}</div>`;
}
function showEmailFlow(kind='general',caseId='-'){
  let t=dpMailTemplate(kind,caseId);
  showDrawer('Send e-post',`<label>Mottakere</label>${recipientCheckboxes(kind,caseId)}<label>Ekstra e-postadresser</label><small class="mail-field-note">Bruk dette bare hvis mottakeren ikke ligger i listen over.</small><textarea id="emailExtra" style="min-height:72px" placeholder="navn@domene.no"></textarea><label>Emne</label><input id="emailSubject" value="${esc(t.subject)}"><label>Melding</label><textarea id="emailBody">${esc(t.body)}</textarea><button class="action primary" onclick="sendEmailLog('${esc(kind)}','${esc(caseId)}')">Send e-post</button>`);
}
function showLogin(){
  showDrawer('Logg inn',`<div class="grid"><div class="card s12 login-box"><h3>Ekte innlogging</h3><label>E-post</label><input id="authEmail" value="post@driftspartnernord.no"><label>Passord</label><input id="authPassword" type="password" value="" placeholder="Passord fra Supabase Auth"><button class="action primary" onclick="loginSupabase()">Logg inn med passord</button><button class="action" onclick="sendMagicLink()">Send magic link</button><button class="action" onclick="diagnoseAuthUser()">Diagnose</button><div id="authOut" class="output">Bruker må finnes i Supabase Auth, app_users og property_access.</div></div></div>`);
}
function loginDisabled(){
  showDrawer('Test er fjernet',`<div class="output">Systemet er satt til produksjonsflyt. Bruk ekte Supabase-innlogging for å åpne Driftspartner OS.</div><button class="action primary" onclick="showLogin()">Gå til innlogging</button>`);
}
usersAdmin=function(){
  let props=state.properties.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
  return `<div class="grid"><div class="card s8"><h3>Brukere</h3><table><tr><th>Navn</th><th>Rolle</th><th>E-post</th><th>Telefon</th><th>Eiendommer</th></tr>${state.users.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.role)}</td><td>${esc(u.email||'-')}</td><td>${esc(u.phone||'-')}</td><td>${u.role==='superadmin'?'Alle':state.properties.filter(p=>u.properties.includes(p.id)).map(p=>esc(p.name)).join(', ')}</td></tr>`).join('')}</table></div><div class="card s4"><h3>Legg til bruker</h3><label>Navn</label><input id="newUserName" value=""><label>E-post</label><input id="newUserEmail" value="" placeholder="navn@domene.no"><label>Telefon</label><input id="newUserPhone" value=""><label>Rolle</label><select id="newUserRole"><option>styreleder</option><option>vaktmester</option><option>leverandør</option><option>superadmin</option></select><label>Eiendom</label><select id="newUserProperty">${props}</select><button class="action green" onclick="saveUser()">Lagre bruker</button></div></div>`;
};
boardOverview=function(){
  let p=ensurePropertyData(property());
  return `<div class="grid"><div class="card s8"><h3>Styre for ${esc(p.customer)}</h3><table><tr><th>Navn</th><th>Rolle</th><th>E-post</th><th>Telefon</th><th>Notat/div</th><th>Handling</th></tr>${p.boardMembers.map((m,i)=>`<tr><td>${esc(m.name)}</td><td>${esc(m.role)}</td><td>${esc(m.email||'-')}</td><td>${esc(m.phone||'-')}</td><td>${esc(m.notes||'')}</td><td><button class="action" onclick="showEmailFlow('board','Styre-${i+1}')">E-post</button></td></tr>`).join('')}</table></div><div class="card s4"><h3>Legg til styremedlem</h3><label>Navn</label><input id="boardName" value=""><label>Rolle</label><input id="boardRole" value="Styremedlem"><label>E-post</label><input id="boardEmail" value="" placeholder="navn@domene.no"><label>Telefon</label><input id="boardPhone" value=""><label>Notat/div</label><textarea id="boardNotes"></textarea><button class="action green" onclick="saveBoardMember()">Lagre styremedlem</button></div></div>`;
};
showCreateCustomerCard=function(){
  if(!canCreateProperty()){showDrawer('Ingen tilgang',`<div class="output">Bare superadmin kan opprette nye kundekort og eiendommer. ${esc(user().name)} kan kun jobbe med egne eiendommer.</div>`);return}
  showDrawer('Opprett kundekort og eiendom',`<div class="grid"><div class="card s6"><h3>Kunde</h3><label>Kundenavn</label><input id="custName" value=""><label>Org.nr</label><input id="custOrgnr" value=""><label>Kontaktperson</label><input id="custContact" value=""><label>E-post</label><input id="custEmail" value="" placeholder="styreleder@domene.no"><label>Fakturaadresse</label><input id="custInvoice" value=""></div><div class="card s6"><h3>Eiendom</h3><label>Eiendomsnavn</label><input id="propName" value=""><label>Adresse</label><input id="propAddress" value=""><label>Type</label><select id="propType"><option>Borettslag</option><option>Sameie</option><option>Næring</option></select><label>Ansvarlig forvalter</label><input id="propManager" value="Driftspartner Nord"><label>SLA</label><select id="propSla"><option>Normal</option><option>Prioritert</option><option>Beredskap 24/7</option></select><button class="action green" onclick="createCustomerCard()">Lagre kundekort</button></div></div>`);
};
