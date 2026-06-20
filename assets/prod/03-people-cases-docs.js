function PeoplePage(){
  const contacts=DP.cache.contacts||[],roleOf=c=>String(c.role||c.contact_role||c.contact_type||c.type||''),board=contacts.filter(c=>/styre|leder|vara/i.test(roleOf(c))),res=contacts.filter(c=>/bebo|resident|leilighet|enhet/i.test(roleOf(c))),other=contacts.filter(c=>!board.includes(c)&&!res.includes(c));
  return `<div class="grid people-page"><div class="card s12"><div class="dash-title"><div><h3>Beboere og styre</h3><p class="muted">Personer knyttet til valgt eiendom. Bruk dette som kontakt- og tilgangsgrunnlag.</p></div><div><button class="action primary" onclick="showPersonForm('Beboer')">Legg til beboer</button><button class="action" onclick="showPersonForm('Styremedlem')">Legg til styremedlem</button><button class="action" onclick="showUserForm()">Opprett innlogging</button></div></div></div>
  <div class="card s6"><div class="dash-title"><h3>Styre</h3><button class="action" onclick="showPersonForm('Styremedlem')">Legg til</button></div>${personList(board,'Ingen styremedlemmer registrert.','Legg inn styreleder, styremedlemmer og vara for valgt eiendom.')}</div>
  <div class="card s6"><div class="dash-title"><h3>Beboere</h3><button class="action" onclick="showPersonForm('Beboer')">Legg til</button></div>${personList(res,'Ingen beboere registrert.','Legg inn beboere eller kontaktpersoner som skal kunne melde avvik.')}</div>
  <div class="card s12"><div class="dash-title"><h3>Andre kontakter</h3><button class="action" onclick="showPersonForm('Kontakt')">Legg til kontakt</button></div>${personList(other,'Ingen andre kontakter registrert.','Her kan forvalter, vaktmester eller andre faste kontaktpersoner ligge.')}</div></div>`;
}
function personList(rows,emptyTitle,emptyText){
  if(!rows.length)return `<div class="empty-state"><strong>${esc(emptyTitle)}</strong><span>${esc(emptyText)}</span></div>`;
  return `<div class="person-list">${rows.map(c=>personCard(c)).join('')}</div>`;
}
function personCard(c){
  const role=c.role||c.contact_role||c.contact_type||c.type||'Kontakt';
  const email=c.email||'-',phone=c.phone||'-';
  return `<section class="person-card"><div class="person-main"><div class="person-avatar">${esc(initials(c.name||role))}</div><div class="person-text"><strong>${esc(c.name||'-')}</strong><span>${esc(role)}</span></div></div><div class="person-meta"><div><small>E-post</small><b>${esc(email)}</b></div><div><small>Telefon</small><b>${esc(phone)}</b></div></div><div class="row-actions"><button class="action red" onclick="deleteContact('${esc(c.id)}')">Slett</button></div></section>`;
}
function initials(value){
  return String(value||'K').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'K';
}
function showPersonForm(role){
  const canCreateLogin=/beboer|styre|leder|vara/i.test(role);
  const loginRole=/beboer/i.test(role)?'beboer':'styremedlem';
  const accessText=/beboer/i.test(role)?'beboerportal-tilgang':'styreportal-tilgang';
  const loginBlock=canCreateLogin?`<section class="inline-option"><label><input id="personCreateLogin" type="checkbox" checked> Opprett innlogging og send e-post</label><small>Hvis e-post er fylt inn, opprettes ${accessText} til valgt eiendom.</small><input id="personLoginRole" type="hidden" value="${loginRole}"><label>Midlertidig passord</label><input id="personPassword" type="password" placeholder="La stå tomt for automatisk passord"></section>`:'';
  showDrawer('Legg til '+role,`<label>Navn</label><input id="personName"><label>Rolle</label><input id="personRole" value="${esc(role)}"><label>E-post</label><input id="personEmail"><label>Telefon</label><input id="personPhone"><label>Notat/enhet</label><textarea id="personNotes"></textarea>${loginBlock}<button class="action primary" onclick="saveContact()">Lagre</button><div id="personOut" class="output">Klar til lagring.</div>`)
}
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
    const shouldCreateLogin=Boolean(document.getElementById('personCreateLogin')?.checked);
    if(shouldCreateLogin){
      if(!email.includes('@'))throw new Error('Fyll inn e-post for å opprette innlogging.');
      if(out)out.textContent='Kontakt lagret. Oppretter innlogging og sender e-post...';
      const loginRole=boardLoginRole(role,document.getElementById('personLoginRole')?.value||'');
      const login=await createPersonLogin({name,email,phone,role:loginRole,password:document.getElementById('personPassword')?.value||''});
      const label=loginRole==='beboer'?'Beboer':'Styremedlem';
      await insertActivity(login.email_sent?`${label} og innlogging opprettet`:`${label} opprettet, e-post ikke sendt`,'user',login.user?.id||email);
      await finishAction(login.email_sent?`${label} er lagret, innlogging er opprettet og e-post er sendt.`:`${label} er lagret og innlogging er opprettet. E-post ble ikke sendt.`,'people');
      return;
    }
    await insertActivity('Kontakt lagret','contact',r.data?.id||name);
    await finishAction('Kontakt er lagret.','people');
  }catch(e){
    const msg=isPeopleSchemaError(e)?'Kontakt-tabellen mangler riktig oppsett eller tilgang. Kjør supabase-people-v1.sql i Supabase og prøv igjen.':customerError(e);
    showDrawer('Kontakt ble ikke lagret',`<div class=\"output\">${esc(msg)}</div>`);
  }
}
function boardLoginRole(contactRole,forcedRole=''){
  const value=String(contactRole||'').toLowerCase();
  if(String(forcedRole||'').toLowerCase()==='beboer')return 'beboer';
  if(value.includes('styreleder')||value.includes('leder'))return 'styreleder';
  return 'styremedlem';
}
async function createPersonLogin({name,email,phone,role='beboer',password=''}){
  const token=DP.session?.access_token;if(!token)throw new Error('Mangler innloggingstoken.');
  const normalized=normalizeRole(role),access={beboer:'resident',styreleder:'owner',styremedlem:'member'}[normalized]||'member';
  const res=await fetch('/.netlify/functions/create-user',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({name,email,phone,role:normalized,property_id:currentProperty().id,access_role:access,password})});
  const data=await readJsonResponse(res,'Bruker-tjenesten svarte ikke riktig. Publiser siste pakke og prøv igjen.');
  if(!data.ok)throw new Error(data.message||'Innlogging kunne ikke opprettes.');
  return data;
}
async function deleteContact(id){if(!confirm('Slette kontakt?'))return;try{requireLive('slette kontakt');const r=await db().from('property_contacts').delete().eq('id',id);if(r.error)throw r.error;await insertActivity('Kontakt slettet','contact',id);await finishAction('Kontakten er slettet.','people')}catch(e){showDrawer('Kontakt ble ikke slettet',`<div class=\"output\">${esc(customerError(e))}</div>`)}}
function showUserForm(){showDrawer('Opprett bruker med innlogging',`<label>Navn</label><input id="newName"><label>E-post</label><input id="newEmail"><label>Telefon</label><input id="newPhone"><label>Rolle</label><select id="newRole"><option value="beboer">Beboer</option><option value="styreleder">Styreleder</option><option value="styremedlem">Styremedlem</option><option value="vaktmester">Vaktmester</option><option value="leverandor">Leverandør</option></select><label>Midlertidig passord</label><input id="newPassword" type="password"><button class="action primary" onclick="createUserLogin()">Opprett bruker</button><div id="newUserOut" class="output">Klar til å opprette bruker.</div>`)}
async function createUserLogin(){const out=document.getElementById('newUserOut');try{requireLive('opprette bruker');const token=DP.session?.access_token;if(!token)throw new Error('Mangler innloggingstoken.');const access={beboer:'resident',styreleder:'owner',styremedlem:'member',vaktmester:'caretaker',leverandor:'vendor'}[newRole.value]||'member';const res=await fetch('/.netlify/functions/create-user',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({name:newName.value,email:newEmail.value,phone:newPhone.value,role:newRole.value,property_id:currentProperty().id,access_role:access,password:newPassword.value})});const data=await readJsonResponse(res,'Bruker-tjenesten svarte ikke riktig. Publiser siste pakke og prøv igjen.');if(!data.ok)throw new Error(data.message);await insertActivity(data.email_sent?'Bruker opprettet og e-post sendt':'Bruker opprettet','user',data.user?.id||newEmail.value);await finishAction(data.email_sent?'Bruker er opprettet og innloggingsmail er sendt.':'Bruker er opprettet. Innloggingsmail ble ikke sendt.','people')}catch(e){setOutputError(out,e)}}

function PeoplePage(){
  const contacts=DP.cache.contacts||[];
  const roleOf=c=>String(c.role||c.contact_role||c.contact_type||c.type||'');
  const board=contacts.filter(c=>/styre|leder|vara/i.test(roleOf(c)));
  const res=contacts.filter(c=>/bebo|resident|leilighet|enhet/i.test(roleOf(c)));
  const other=contacts.filter(c=>!board.includes(c)&&!res.includes(c));
  return `<div class="grid people-page premium-people">
    <div class="card s12 module-hero people-hero"><div><small>Beboere og styre</small><h2>${esc(currentProperty()?.name||'Valgt eiendom')}</h2><p>Kontaktregister, styreoversikt og innlogginger for valgt eiendom. Beboere skal kunne melde avvik, styret skal kunne behandle saker.</p></div><div class="module-actions"><button class="action primary" onclick="showPersonForm('Beboer')">Legg til beboer</button><button class="action" onclick="showPersonForm('Styremedlem')">Legg til styremedlem</button><button class="action" onclick="showUserForm()">Opprett innlogging</button><button class="action" onclick="showEmailFlow('all')">Melding til alle</button><button class="action" onclick="showEmailFlow('board')">Til styret</button><button class="action" onclick="showEmailFlow('resident')">Til beboere</button></div></div>
    ${peopleSummaryCard('Styre',board.length,'Styreleder, styremedlemmer og vara','showPersonForm("Styremedlem")','info')}
    ${peopleSummaryCard('Beboere',res.length,'Kontakter som kan få beboertilgang','showPersonForm("Beboer")','ok')}
    ${peopleSummaryCard('Andre kontakter',other.length,'Forvalter, vaktmester og faste kontakter','showPersonForm("Kontakt")','purple')}
    ${peopleSummaryCard('Innlogging',contacts.filter(c=>String(c.email||'').includes('@')).length,'Kontakter med registrert e-post','showUserForm()','warn')}
    <div class="card s7 people-section"><div class="dash-title"><div><h3>Styre</h3><p class="muted">Legg inn rolle, e-post, telefon og periode. Styremedlemmer kan få innlogging direkte.</p></div><button class="action primary" onclick="showPersonForm('Styremedlem')">Legg til</button></div>${personList(board,'Ingen styremedlemmer registrert.','Legg inn styreleder, styremedlemmer og vara for valgt eiendom.')}</div>
    <div class="card s5 people-access-card"><h3>Tilgang per rolle</h3><div class="people-access-list"><section><strong>Styreleder</strong><span>Dashboard, eiendom, styre, økonomi, FDV og saker.</span></section><section><strong>Styremedlem</strong><span>Styre, saker, dokumenter og økonomigrunnlag.</span></section><section><strong>Beboer</strong><span>Kan melde avvik og følge egne saker.</span></section><section><strong>Vaktmester</strong><span>Arbeidsordre, avvik og dokumentasjon.</span></section></div></div>
    <div class="card s6 people-section"><div class="dash-title"><div><h3>Beboere</h3><p class="muted">Beboere kan registreres som kontakt eller få egen innlogging.</p></div><button class="action primary" onclick="showPersonForm('Beboer')">Legg til</button></div>${personList(res,'Ingen beboere registrert.','Legg inn beboere eller kontaktpersoner som skal kunne melde avvik.')}</div>
    <div class="card s6 people-section"><div class="dash-title"><div><h3>Andre kontakter</h3><p class="muted">Forvalter, vaktmester, leverandørkontakt eller annen fast kontakt.</p></div><button class="action" onclick="showPersonForm('Kontakt')">Legg til kontakt</button></div>${personList(other,'Ingen andre kontakter registrert.','Her kan forvalter, vaktmester eller andre faste kontaktpersoner ligge.')}</div>
  </div>`;
}
function peopleSummaryCard(label,value,caption,action,type='info'){
  return `<button class="card s3 people-summary ${type}" onclick="${action}"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(caption)}</span></button>`;
}
function personCard(c){
  const role=c.role||c.contact_role||c.contact_type||c.type||'Kontakt';
  const email=c.email||'-',phone=c.phone||'-',notes=c.notes||c.unit||'-';
  return `<section class="person-card"><div class="person-main"><div class="person-avatar">${esc(initials(c.name||role))}</div><div class="person-text"><strong>${esc(c.name||'-')}</strong><span>${esc(role)}</span></div></div><div class="person-meta"><div><small>E-post</small><b>${esc(email)}</b></div><div><small>Telefon</small><b>${esc(phone)}</b></div><div><small>Notat/enhet</small><b>${esc(notes)}</b></div></div><div class="row-actions"><button class="action" onclick="showPersonForm('${esc(role)}','${esc(c.id)}')">Endre</button><button class="action red" onclick="deleteContact('${esc(c.id)}')">Slett</button></div></section>`;
}
function showPersonForm(role,id=''){
  const existing=(DP.cache.contacts||[]).find(c=>c.id===id)||{};
  const currentRole=existing.role||existing.contact_role||existing.contact_type||existing.type||role;
  const canCreateLogin=/beboer|styre|leder|vara/i.test(currentRole);
  const loginRole=/beboer/i.test(currentRole)?'beboer':'styremedlem';
  const accessText=/beboer/i.test(currentRole)?'beboerportal-tilgang':'styreportal-tilgang';
  const loginBlock=canCreateLogin&&!id?`<section class="inline-option"><label><input id="personCreateLogin" type="checkbox" checked> Opprett innlogging og send e-post</label><small>Hvis e-post er fylt inn, opprettes ${accessText} til valgt eiendom.</small><input id="personLoginRole" type="hidden" value="${loginRole}"><label>Midlertidig passord</label><input id="personPassword" type="password" placeholder="La stå tomt for automatisk passord"></section>`:'';
  const roleField=/styre|leder|vara/i.test(currentRole)?`<select id="personRole"><option ${currentRole==='Styreleder'?'selected':''}>Styreleder</option><option ${currentRole==='Nestleder'?'selected':''}>Nestleder</option><option ${currentRole==='Styremedlem'?'selected':''}>Styremedlem</option><option ${currentRole==='Vara'?'selected':''}>Vara</option></select>`:`<input id="personRole" value="${esc(currentRole||role)}">`;
  showDrawer((id?'Endre ':'Legg til ')+role,`<input id="personId" type="hidden" value="${esc(id)}"><div class="form-grid two"><label>Navn<input id="personName" value="${esc(existing.name||'')}"></label><label>Rolle${roleField}</label><label>E-post<input id="personEmail" type="email" value="${esc(existing.email||'')}"></label><label>Telefon<input id="personPhone" value="${esc(existing.phone||'')}"></label></div><label>${/bebo/i.test(currentRole)?'Leilighet/enhet eller notat':'Periode, verv eller notat'}</label><textarea id="personNotes" rows="4">${esc(existing.notes||existing.unit||'')}</textarea>${loginBlock}<button class="action primary" onclick="saveContact()">${id?'Lagre endring':'Lagre'}</button><div id="personOut" class="output">${id?'Klar til å lagre endring.':'Klar til lagring.'}</div>`);
}
async function saveContact(){
  const out=document.getElementById('personOut');
  try{
    requireLive('lagre kontakt');
    if(out)out.textContent='Lagrer kontakt...';
    const propertyId=currentProperty().id,id=document.getElementById('personId')?.value||'',name=personName.value.trim(),role=personRole.value.trim()||'Kontakt',email=personEmail.value.trim(),phone=personPhone.value.trim(),notes=personNotes.value.trim();
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
      r=id?await db().from('property_contacts').update(row).eq('id',id).select().single():await db().from('property_contacts').insert(row).select().single();
      if(!r.error)break;
      lastError=r.error;
      if(!isPeopleSchemaError(r.error))break;
    }
    if(r?.error)throw lastError||r.error;
    if(id){
      await insertActivity('Kontakt oppdatert','contact',id);
      await finishAction('Kontakt er oppdatert.','people');
      return;
    }
    const shouldCreateLogin=Boolean(document.getElementById('personCreateLogin')?.checked);
    if(shouldCreateLogin){
      if(!email.includes('@'))throw new Error('Fyll inn e-post for å opprette innlogging.');
      if(out)out.textContent='Kontakt lagret. Oppretter innlogging og sender e-post...';
      const loginRole=boardLoginRole(role,document.getElementById('personLoginRole')?.value||'');
      const login=await createPersonLogin({name,email,phone,role:loginRole,password:document.getElementById('personPassword')?.value||''});
      const label=loginRole==='beboer'?'Beboer':'Styremedlem';
      await insertActivity(login.email_sent?`${label} og innlogging opprettet`:`${label} opprettet, e-post ikke sendt`,'user',login.user?.id||email);
      await finishAction(login.email_sent?`${label} er lagret, innlogging er opprettet og e-post er sendt.`:`${label} er lagret og innlogging er opprettet. E-post ble ikke sendt.`,'people');
      return;
    }
    await insertActivity('Kontakt lagret','contact',r.data?.id||name);
    await finishAction('Kontakt er lagret.','people');
  }catch(e){
    const msg=isPeopleSchemaError(e)?'Kontakt-tabellen mangler riktig oppsett eller tilgang. Kjør supabase-people-v1.sql i Supabase og prøv igjen.':customerError(e);
    showDrawer('Kontakt ble ikke lagret',`<div class=\"output\">${esc(msg)}</div>`);
  }
}

function CasesPage(){const devs=DP.cache.deviations||[],wos=DP.cache.work_orders||[];return `<div class="grid cases-page"><div class="card s12 module-hero"><div><small>Drift</small><h2>Avvik og arbeidsordre</h2><p>Registrer avvik, fordel ansvar og følg saken videre til tilbud, kontrakt, FDV og rapport.</p></div><div class="module-actions"><button class="action primary" onclick="showDeviationForm()">Nytt avvik</button><button class="action" onclick="showWorkOrderForm()">Ny arbeidsordre</button><button class="action" onclick="showCaseFlow()">Fullt saksløp</button></div></div><div class="card s6"><h3>Avvik</h3>${caseCards(devs,'deviation')}</div><div class="card s6"><h3>Arbeidsordre</h3>${caseCards(wos,'work_order')}</div></div>`}
function deviationTable(rows){return table(['Tittel','Kategori','Prioritet','Status','Handling'],rows.map(d=>`<tr><td>${esc(d.title)}</td><td>${esc(d.category)}</td><td>${esc(d.priority)}</td><td>${esc(d.status)}</td><td><button class="action" onclick="showCaseFlow('${esc(d.id)}')">Saksløp</button><button class="action" onclick="showWorkOrderForm('${esc(d.id)}')">Arbeidsordre</button><button class="action red" onclick="deleteRow('deviations','${esc(d.id)}')">Slett</button></td></tr>`))}
function workOrderTable(rows){return table(['Tittel','Frist','Status','Handling'],rows.map(w=>`<tr><td>${esc(w.title)}</td><td>${esc(w.due_date||'-')}</td><td>${esc(w.status)}</td><td><button class="action" onclick="showRfqForm('${esc(w.id)}')">Tilbudsforespørsel</button><button class="action red" onclick="deleteRow('work_orders','${esc(w.id)}')">Slett</button></td></tr>`))}
function caseCards(rows,type){
  if(!rows.length)return `<div class="empty-state"><strong>${type==='deviation'?'Ingen avvik registrert.':'Ingen arbeidsordre registrert.'}</strong><span>${type==='deviation'?'Registrer første avvik hvis noe må følges opp.':'Lag arbeidsordre fra et avvik eller som egen oppgave.'}</span></div>`;
  return `<div class="stack-list">${rows.map(r=>`<section class="mini-record"><div><strong>${esc(r.title||'Uten tittel')}</strong><small>${esc([r.category,r.priority,r.due_date,r.status].filter(Boolean).join(' · '))}</small></div><div class="row-actions">${type==='deviation'?`<button class="action" onclick="showCaseFlow('${esc(r.id)}')">Saksløp</button><button class="action" onclick="showWorkOrderForm('${esc(r.id)}')">Arbeidsordre</button>`:`<button class="action" onclick="showRfqForm('${esc(r.id)}')">Tilbud</button>`}<button class="action red" onclick="deleteRow('${type==='deviation'?'deviations':'work_orders'}','${esc(r.id)}')">Slett</button></div></section>`).join('')}</div>`;
}
function showDeviationForm(){showDrawer('Nytt avvik',`<label>Tittel</label><input id="devTitle"><label>Beskrivelse</label><textarea id="devDesc"></textarea><label>Kategori</label><select id="devCat"><option>Tak</option><option>VVS</option><option>Elektro</option><option>Uteomrade</option><option>HMS</option><option>Annet</option></select><label>Prioritet</label><select id="devPrio"><option>Lav</option><option>Medium</option><option>Hoy</option><option>Kritisk</option></select><button class="action primary" onclick="saveDeviation()">Lagre avvik</button>`)}
async function saveDeviation(){try{requireLive('lagre avvik');const r=await db().from('deviations').insert({property_id:currentProperty().id,title:devTitle.value,description:devDesc.value,category:devCat.value,priority:devPrio.value,status:'Ny'}).select().single();if(r.error)throw r.error;hideDrawer();showNotice('Avviket er lagret. Oppdaterer listen...','ok');await insertActivity('Avvik opprettet','deviation',r.data.id);await finishAction('Avviket er opprettet.','cases')}catch(e){showDrawer('Avvik ble ikke lagret',`<div class=\"output\">${esc(customerError(e))}</div>`)}}
function showWorkOrderForm(deviationId=''){showDrawer('Ny arbeidsordre',`<input id="woDev" type="hidden" value="${esc(deviationId)}"><label>Tittel</label><input id="woTitle"><label>Beskrivelse</label><textarea id="woDesc"></textarea><label>Frist</label><input id="woDue" type="date"><button class="action primary" onclick="saveWorkOrder()">Lagre arbeidsordre</button>`)}
async function saveWorkOrder(){try{requireLive('lagre arbeidsordre');let row={property_id:currentProperty().id,title:woTitle.value,description:woDesc.value,due_date:woDue.value||null,status:'Ny'};if(isUuid(woDev.value))row.deviation_id=woDev.value;const r=await db().from('work_orders').insert(row).select().single();if(r.error)throw r.error;hideDrawer();showNotice('Arbeidsordren er lagret. Oppdaterer listen...','ok');await insertActivity('Arbeidsordre opprettet','work_order',r.data.id);await finishAction('Arbeidsordren er opprettet.','cases')}catch(e){showDrawer('Arbeidsordre ble ikke lagret',`<div class=\"output\">${esc(customerError(e))}</div>`)}}
async function deleteRow(tableName,id){if(!confirm('Slette raden?'))return;try{requireLive('slette');const r=await db().from(tableName).delete().eq('id',id);if(r.error)throw r.error;await insertActivity('Slettet '+tableName,'delete',id);await finishAction('Elementet er slettet.',DP.module)}catch(e){showDrawer('Sletting feilet',`<div class=\"output\">${esc(customerError(e))}</div>`)}}

function CasesPage(){
  const devs=DP.cache.deviations||[],wos=DP.cache.work_orders||[];
  const hasBrain=typeof subscriptionHas==='function'?subscriptionHas('brain'):true;
  const brainAction=hasBrain?`<button class="action" onclick="openModule('brain')">Property Brain</button>`:'';
  const open=x=>!['lukket','ferdig','utført','utfort','fullført','fullfort'].includes(String(x.status||'').toLowerCase());
  const critical=devs.filter(d=>open(d)&&/kritisk|høy|hoy/i.test(String(d.priority||''))).length;
  const overdue=wos.filter(w=>open(w)&&w.due_date&&new Date(w.due_date)<new Date()).length;
  const waiting=devs.filter(d=>/venter|leverandør|leverandor|arbeidsordre/i.test(String(d.status||''))).length;
  return `<div class="grid cases-page premium-cases">
    <div class="card s12 module-hero cases-hero"><div><small>Avvik og arbeidsordre</small><h2>Driftssaker for ${esc(currentProperty()?.name||'valgt eiendom')}</h2><p>Registrer avvik, fordel ansvar, sett frister og følg saken videre til tilbud, kontrakt, FDV og rapport.</p></div><div class="module-actions"><button class="action primary" onclick="showDeviationForm()">Nytt avvik</button><button class="action" onclick="showWorkOrderForm()">Ny arbeidsordre</button><button class="action" onclick="showEmailFlow('workorder')">Send e-post</button><button class="action" onclick="showCaseFlow()">Fullt saksløp</button></div></div>
    ${caseSummaryCard('Åpne avvik',devs.filter(open).length,'Avvik som må behandles','showDeviationForm()','info')}
    ${caseSummaryCard('Kritisk/høy',critical,'Bør prioriteres først','openCaseFilter("critical")','bad')}
    ${caseSummaryCard('Arbeidsordre',wos.filter(open).length,'Pågående oppgaver','showWorkOrderForm()','warn')}
    ${caseSummaryCard('Forfalt',overdue,'Oppgaver over frist','openCaseFilter("overdue")','bad')}
    <div class="card s8 case-priority-board"><div class="dash-title"><div><h3>Hva bør følges opp nå?</h3><p class="muted">Basert på prioritet, status og frister for valgt eiendom.</p></div>${brainAction}</div>${casePriorityList(devs,wos)}</div>
    <div class="card s4 case-pipeline"><h3>Status</h3><div class="case-pipeline-list">${casePipelineRows(devs,wos,waiting)}</div></div>
    <div class="card s6 case-section"><div class="dash-title"><div><h3>Avvik</h3><p class="muted">Registrerte avvik med kategori, prioritet og status.</p></div><button class="action primary" onclick="showDeviationForm()">Nytt avvik</button></div>${caseCards(devs,'deviation')}</div>
    <div class="card s6 case-section"><div class="dash-title"><div><h3>Arbeidsordre</h3><p class="muted">Oppgaver som kan sendes til vaktmester, styre eller leverandør.</p></div><button class="action primary" onclick="showWorkOrderForm()">Ny arbeidsordre</button></div>${caseCards(wos,'work_order')}</div>
  </div>`;
}
function caseSummaryCard(label,value,caption,action,type='info'){
  return `<button class="card s3 case-summary ${type}" onclick="${action}"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(caption)}</span></button>`;
}
function casePipelineRows(devs,wos,waiting){
  const open=x=>!['lukket','ferdig','utført','utfort','fullført','fullfort'].includes(String(x.status||'').toLowerCase());
  const rows=[['Nye avvik',devs.filter(d=>/ny/i.test(String(d.status||''))).length,'info'],['Venter avklaring',waiting,'warn'],['Pågående ordre',wos.filter(open).length,'purple'],['Ferdig/lukket',devs.filter(d=>!open(d)).length+wos.filter(w=>!open(w)).length,'ok']];
  return rows.map(r=>`<section class="${esc(r[2])}"><span>${esc(r[0])}</span><strong>${esc(r[1])}</strong></section>`).join('');
}
function casePriorityList(devs,wos){
  const open=x=>!['lukket','ferdig','utført','utfort','fullført','fullfort'].includes(String(x.status||'').toLowerCase());
  const items=[
    ...devs.filter(open).map(d=>({kind:'Avvik',title:d.title||'Avvik',meta:[d.category,d.priority,d.status].filter(Boolean).join(' · '),priority:/kritisk/i.test(d.priority||'')?1:/høy|hoy/i.test(d.priority||'')?2:4,open:`showCaseFlow('${esc(d.id)}')`})),
    ...wos.filter(open).map(w=>({kind:'Arbeidsordre',title:w.title||'Arbeidsordre',meta:[w.due_date,w.status].filter(Boolean).join(' · '),priority:w.due_date&&new Date(w.due_date)<new Date()?1:3,open:`showWorkOrderForm('${esc(w.deviation_id||'')}','${esc(w.id)}')`}))
  ].sort((a,b)=>a.priority-b.priority).slice(0,5);
  if(!items.length)return '<div class="empty-state"><strong>Ingen åpne driftssaker.</strong><span>Registrer avvik eller arbeidsordre når noe må følges opp.</span><button class="action primary" onclick="showDeviationForm()">Registrer avvik</button></div>';
  return `<div class="case-priority-list">${items.map((x,i)=>`<button onclick="${x.open}" class="${x.priority===1?'bad':'info'}"><span>${i+1}</span><div><strong>${esc(x.title)}</strong><small>${esc(x.kind)} · ${esc(x.meta||'Ikke klassifisert')}</small></div></button>`).join('')}</div>`;
}
function openCaseFilter(kind){showDrawer(kind==='critical'?'Kritiske/høye saker':'Forfalte arbeidsordre',`<div class="output">Listen er filtrert i oversikten. Bruk kortene under Avvik og Arbeidsordre for å åpne sakene.</div><button class="action primary" onclick="hideDrawer();openModule('cases')">Til oversikten</button>`)}
function caseCards(rows,type){
  if(!rows.length)return `<div class="empty-state"><strong>${type==='deviation'?'Ingen avvik registrert.':'Ingen arbeidsordre registrert.'}</strong><span>${type==='deviation'?'Registrer første avvik hvis noe må følges opp.':'Lag arbeidsordre fra et avvik eller som egen oppgave.'}</span><button class="action primary" onclick="${type==='deviation'?'showDeviationForm()':'showWorkOrderForm()'}">${type==='deviation'?'Nytt avvik':'Ny arbeidsordre'}</button></div>`;
  return `<div class="case-card-list">${rows.map(r=>caseCard(r,type)).join('')}</div>`;
}
function caseCard(r,type){
  const isDev=type==='deviation',prio=priorityClass(r.priority),status=String(r.status||'Ny');
  const meta=isDev?[r.category,r.priority,status].filter(Boolean).join(' · '):[r.due_date?`Frist ${r.due_date}`:'Ingen frist',status].join(' · ');
  const primary=isDev?`showCaseFlow('${esc(r.id)}')`:`showWorkOrderForm('${esc(r.deviation_id||'')}','${esc(r.id)}')`;
  return `<section class="case-card ${isDev?prio:statusClass(status)}"><div class="case-card-head"><div><small>${isDev?'Avvik':'Arbeidsordre'}</small><strong>${esc(r.title||'Uten tittel')}</strong><span>${esc(meta)}</span></div><b>${esc(status)}</b></div><p>${esc(r.description||'Ingen beskrivelse registrert.')}</p><div class="row-actions"><button class="action primary" onclick="${primary}">${isDev?'Åpne saksløp':'Endre ordre'}</button>${isDev?`<button class="action" onclick="showWorkOrderForm('${esc(r.id)}')">Lag arbeidsordre</button>`:`<button class="action" onclick="showRfqForm('${esc(r.id)}')">Tilbud</button>`}<button class="action" onclick="showEmailFlow('${isDev?'deviation':'workorder'}','${esc(r.id)}')">E-post</button><button class="action" onclick="showCaseStatusForm('${type==='deviation'?'deviations':'work_orders'}','${esc(r.id)}','${esc(status)}')">Status</button><button class="action red" onclick="deleteRow('${type==='deviation'?'deviations':'work_orders'}','${esc(r.id)}')">Slett</button></div></section>`;
}
function statusClass(status){const s=String(status||'').toLowerCase();if(/kritisk|forfalt|venter/.test(s))return 'warn';if(/utført|utfort|fullført|fullfort|lukket|ferdig/.test(s))return 'ok';return 'info'}
function showCaseStatusForm(tableName,id,status='Ny'){
  const options=['Ny','Under behandling','Venter leverandør','Arbeidsordre opprettet','I arbeid','Utført','Ferdig','Lukket'].map(s=>`<option ${s===status?'selected':''}>${esc(s)}</option>`).join('');
  showDrawer('Endre status',`<label>Status</label><select id="caseStatus">${options}</select><label>Kommentar</label><textarea id="caseStatusNote" rows="4" placeholder="Kort kommentar til endringen"></textarea><button class="action primary" onclick="updateCaseStatus('${esc(tableName)}','${esc(id)}')">Lagre status</button>`);
}
async function updateCaseStatus(tableName,id){
  try{requireLive('endre status');const r=await db().from(tableName).update({status:caseStatus.value}).eq('id',id).select().single();if(r.error)throw r.error;await insertActivity(`Status endret til ${caseStatus.value}`,'case',id);await finishAction('Status er oppdatert.','cases')}catch(e){showDrawer('Status ble ikke lagret',`<div class=\"output\">${esc(customerError(e))}</div>`)}
}
function showDeviationForm(id=''){
  const d=(DP.cache.deviations||[]).find(x=>x.id===id)||{},buildings=DP.cache.buildings||[];
  const buildingOptions=`<option value="">Hele eiendommen</option>${buildings.map(b=>`<option value="${esc(b.id)}" ${b.id===d.building_id?'selected':''}>${esc(b.name)}</option>`).join('')}`;
  showDrawer(id?'Endre avvik':'Nytt avvik',`<input id="devId" type="hidden" value="${esc(id)}"><div class="form-grid two"><label>Tittel<input id="devTitle" value="${esc(d.title||'')}"></label><label>Kategori<select id="devCat">${['Tak','VVS','Elektro','Brann','HMS','Heis','Uteområde','Bygg','Annet'].map(c=>`<option ${c===d.category?'selected':''}>${c}</option>`).join('')}</select></label><label>Prioritet<select id="devPrio">${['Lav','Medium','Høy','Kritisk'].map(c=>`<option ${c===d.priority?'selected':''}>${c}</option>`).join('')}</select></label><label>Bygg/anlegg<select id="devBuilding">${buildingOptions}</select></label><label>Leilighet/område<input id="devUnit" value="${esc(d.unit||d.area||'')}"></label><label>Innsender<select id="devReporter">${['Styremedlem','Beboer','Vaktmester','Leverandør','Forvalter'].map(c=>`<option ${c===d.reporter_type?'selected':''}>${c}</option>`).join('')}</select></label></div><label>Beskrivelse</label><textarea id="devDesc" rows="5">${esc(d.description||'')}</textarea><label>Tildel/send til flere</label><input id="devAssign" value="${esc(d.assigned_to||'')}" placeholder="post@kunde.no, vaktmester@kunde.no"><button class="action primary" onclick="saveDeviation()">${id?'Lagre avvik':'Lagre avvik'}</button>`);
}
async function saveDeviation(){
  try{
    requireLive('lagre avvik');
    const id=document.getElementById('devId')?.value||'';
    const base={property_id:currentProperty().id,title:devTitle.value.trim(),description:devDesc.value.trim(),category:devCat.value,priority:devPrio.value,status:id?undefined:'Ny',building_id:devBuilding.value||null,unit:devUnit.value.trim()||null,reporter_type:devReporter.value,assigned_to:devAssign.value.trim()||null};
    if(!base.title)throw new Error('Fyll inn tittel.');
    const variants=[base,{property_id:base.property_id,title:base.title,description:base.description,category:base.category,priority:base.priority,status:id?undefined:'Ny',building_id:base.building_id},{property_id:base.property_id,title:base.title,description:base.description,category:base.category,priority:base.priority,status:id?undefined:'Ny'}].map(x=>Object.fromEntries(Object.entries(x).filter(([,v])=>v!==undefined)));
    let r,lastError=null;
    for(const row of variants){r=id?await db().from('deviations').update(row).eq('id',id).select().single():await db().from('deviations').insert(row).select().single();if(!r.error)break;lastError=r.error;if(!isPeopleSchemaError(r.error))break}
    if(r?.error)throw lastError||r.error;
    await insertActivity(id?'Avvik oppdatert':'Avvik opprettet','deviation',r.data.id);
    await finishAction(id?'Avviket er oppdatert.':'Avviket er opprettet.','cases');
  }catch(e){showDrawer('Avvik ble ikke lagret',`<div class=\"output\">${esc(customerError(e))}</div>`)}
}
function showWorkOrderForm(deviationId='',id=''){
  const w=(DP.cache.work_orders||[]).find(x=>x.id===id)||{},devs=DP.cache.deviations||[];
  const selectedDev=deviationId||w.deviation_id||'';
  const devOptions=`<option value="">Ingen avvik</option>${devs.map(d=>`<option value="${esc(d.id)}" ${d.id===selectedDev?'selected':''}>${esc(d.title)}</option>`).join('')}`;
  showDrawer(id?'Endre arbeidsordre':'Ny arbeidsordre',`<input id="woId" type="hidden" value="${esc(id)}"><div class="form-grid two"><label>Knytt til avvik<select id="woDev">${devOptions}</select></label><label>Tittel<input id="woTitle" value="${esc(w.title||devs.find(d=>d.id===selectedDev)?.title||'')}"></label><label>Frist<input id="woDue" type="date" value="${esc(w.due_date||'')}"></label><label>Status<select id="woStatus">${['Ny','Planlagt','I arbeid','Venter leverandør','Utført','Lukket'].map(s=>`<option ${s===w.status?'selected':''}>${s}</option>`).join('')}</select></label></div><label>Arbeidsbeskrivelse</label><textarea id="woDesc" rows="5">${esc(w.description||devs.find(d=>d.id===selectedDev)?.description||'')}</textarea><label>Ansvarlig / send til</label><input id="woAssignee" value="${esc(w.assigned_to||'')}" placeholder="vaktmester@kunde.no, leverandør@firma.no"><button class="action primary" onclick="saveWorkOrder()">${id?'Lagre arbeidsordre':'Lagre arbeidsordre'}</button>`);
}
async function saveWorkOrder(){
  try{
    requireLive('lagre arbeidsordre');
    const id=document.getElementById('woId')?.value||'';
    const base={property_id:currentProperty().id,title:woTitle.value.trim(),description:woDesc.value.trim(),due_date:woDue.value||null,status:woStatus.value||'Ny',deviation_id:isUuid(woDev.value)?woDev.value:null,assigned_to:woAssignee.value.trim()||null};
    if(!base.title)throw new Error('Fyll inn tittel.');
    const variants=[base,{property_id:base.property_id,title:base.title,description:base.description,due_date:base.due_date,status:base.status,deviation_id:base.deviation_id},{property_id:base.property_id,title:base.title,description:base.description,due_date:base.due_date,status:base.status}];
    let r,lastError=null;
    for(const row of variants){r=id?await db().from('work_orders').update(row).eq('id',id).select().single():await db().from('work_orders').insert(row).select().single();if(!r.error)break;lastError=r.error;if(!isPeopleSchemaError(r.error))break}
    if(r?.error)throw lastError||r.error;
    if(base.deviation_id&&!id)await db().from('deviations').update({status:'Arbeidsordre opprettet'}).eq('id',base.deviation_id);
    await insertActivity(id?'Arbeidsordre oppdatert':'Arbeidsordre opprettet','work_order',r.data.id);
    await finishAction(id?'Arbeidsordren er oppdatert.':'Arbeidsordren er opprettet.','cases');
  }catch(e){showDrawer('Arbeidsordre ble ikke lagret',`<div class=\"output\">${esc(customerError(e))}</div>`)}
}

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
  showDrawer('Full saksløp',`<section class="case-flow"><div class="case-flow-head"><div><small>Valgt sak</small><h3>${esc(c.deviation?.title||'Velg avvik')}</h3></div><div><label>Velg avvik</label><select id="flowDeviation" onchange="showCaseFlow(this.value)">${selected}</select></div></div>${caseFlowStatus(c)}<h3>Neste handling</h3><div class="flow-actions"><button class="action primary" onclick="showFlowWorkOrderStep()"><span>1</span>Lag arbeidsordre</button><button class="action" onclick="showFlowRfqStep()"><span>2</span>Lag tilbudsforespørsel</button><button class="action" onclick="showFlowOfferStep()"><span>3</span>Last opp tilbud/PDF</button><button class="action" onclick="showFlowBoardStep()"><span>4</span>Styregodkjenning</button><button class="action" onclick="showFlowContractStep()"><span>5</span>Generer kontrakt</button><button class="action" onclick="showFlowFdvStep()"><span>6</span>Oppdater FDV</button><button class="action" onclick="showFlowReportStep()"><span>7</span>Lag rapport</button></div><div id="flowStepPanel" class="flow-step-panel"><div class="empty-state"><h3>Velg neste steg</h3><p>Knappene over åpner et kontrollert steg med forklaring og felter. Ingenting lagres før du bekrefter.</p></div></div><div id="flowOut" class="output">Alle steg lagres live mot valgt eiendom.</div></section>`);
}
function caseFlowStatus(c){
  const items=[
    ['Avvik',!!c.deviation,c.deviation?.title],
    ['Arbeidsordre',!!c.workOrder,c.workOrder?.title],
    ['Tilbudsforespørsel',!!c.rfq,c.rfq?.title],
    ['Tilbud/PDF',!!c.offer,c.offer?`${money(c.offer.price)} - ${c.offer.status||''}`:'Venter på tilbud'],
    ['Styregodkjenning',c.hasBoard,'Styrepapir i dokumentarkiv'],
    ['Kontrakt',c.hasContract,'Kontrakt i dokumentarkiv'],
    ['FDV',c.hasFdv,'FDV-dokument i dokumentarkiv'],
    ['Rapport',c.hasReport,'Rapport i dokumentarkiv']
  ];
  return `<div class="case-flow-steps">${items.map((x,i)=>`<section class="case-step ${x[1]?'done':'missing'}"><div class="case-step-index">${i+1}</div><div><strong>${esc(x[0])}</strong><small>${esc(x[2]||'Mangler')}</small></div><span>${x[1]?'Fullført':'Mangler'}</span></section>`).join('')}</div>`;
}
function flowSelectedDeviation(){const id=document.getElementById('flowDeviation')?.value;const c=findCaseParts(id);if(!c.deviation)throw new Error('Opprett eller velg avvik først.');return c}
function flowPanel(html){const el=document.getElementById('flowStepPanel')||document.getElementById('flowOut');if(el){el.innerHTML=html;el.scrollIntoView({behavior:'smooth',block:'nearest'})}}
function flowDisabledStep(title,message){flowPanel(`<section class="flow-step-card"><h3>${esc(title)}</h3><p>${esc(message)}</p></section>`)}
function flowRead(id){return String(document.getElementById(id)?.value||'').trim()}
function flowNote(parts){return parts.filter(x=>x[1]).map(x=>`${x[0]}:\n${x[1]}`).join('\n\n')}
function flowCaseMini(c){
  return `<div class="flow-context"><div><span>Avvik</span><strong>${esc(c.deviation?.title||'-')}</strong></div><div><span>Arbeidsordre</span><strong>${esc(c.workOrder?.status||'Ikke opprettet')}</strong></div><div><span>Tilbud</span><strong>${esc(c.offer?money(c.offer.price):'Ikke mottatt')}</strong></div></div>`;
}
function flowActions(primary,label,secondary=''){
  return `<div class="flow-button-row"><button class="action primary" onclick="${primary}">${esc(label)}</button>${secondary?`<button class="action" onclick="${secondary}">Avbryt</button>`:''}</div>`;
}
function showFlowWorkOrderStep(){try{const c=flowSelectedDeviation();if(c.workOrder)return flowDisabledStep('Arbeidsordre finnes allerede','Denne saken har allerede arbeidsordre. Åpne arbeidsordre for å endre status, ansvarlig eller frist.');flowPanel(`<section class="flow-step-card"><small>Steg 1 av 7</small><h3>Lag arbeidsordre</h3>${flowCaseMini(c)}<p>Arbeidsordren er oppgaven som sendes videre til vaktmester, leverandør eller styreleder. Fyll inn hva som faktisk skal gjøres før den opprettes.</p><div class="flow-form-grid"><label>Tittel<input id="flowWoTitle" value="${esc(c.deviation.title||'')}"></label><label>Frist<input id="flowWoDue" type="date"></label></div><label>Arbeidsbeskrivelse<textarea id="flowWoDesc" rows="5" placeholder="Beskriv arbeid, sted, ansvar og forventet resultat.">${esc(c.deviation.description||'')}</textarea></label>${flowActions("flowCreateWorkOrder()","Opprett arbeidsordre","showCaseFlow(document.getElementById('flowDeviation')?.value)")}</section>`)}catch(e){flowDisabledStep('Velg avvik',e.message)}}
function showFlowRfqStep(){try{const c=flowSelectedDeviation();if(!c.workOrder)return flowDisabledStep('Lag arbeidsordre først','Tilbudsforespørsel må knyttes til en arbeidsordre.');if(c.rfq)return flowDisabledStep('Tilbudsforespørsel finnes allerede','Denne saken har allerede en tilbudsforespørsel. Åpne marked/tilbud for å sende eller endre den.');flowPanel(`<section class="flow-step-card"><small>Steg 2 av 7</small><h3>Lag tilbudsforespørsel</h3>${flowCaseMini(c)}<p>Dette blir grunnlaget leverandørene skal prise. Beskriv omfang, krav, dokumentasjon og frist tydelig.</p><div class="flow-form-grid"><label>Tittel<input id="flowRfqTitle" value="${esc(c.workOrder.title||c.deviation.title||'')}"></label><label>Tilbudsfrist<input id="flowRfqDeadline" type="date"></label></div><label>Hva skal prises?<textarea id="flowRfqDesc" rows="6" placeholder="Beskriv arbeid, befaring, krav til dokumentasjon, bilder/PDF og hvordan tilbud skal leveres.">${esc(c.workOrder.description||c.deviation.description||'')}</textarea></label>${flowActions("flowCreateRfq()","Opprett tilbudsforespørsel","showCaseFlow(document.getElementById('flowDeviation')?.value)")}</section>`)}catch(e){flowDisabledStep('Velg avvik',e.message)}}
function showFlowOfferStep(){try{const c=flowSelectedDeviation();flowPanel(`<section class="flow-step-card"><small>Steg 3 av 7</small><h3>Last opp tilbud/PDF</h3>${flowCaseMini(c)}<p>Registrer leverandørens pris, frist, forbehold og dokumentasjon. Tilbudet brukes senere i styregodkjenning og kontrakt.</p><div class="flow-note">Tips: legg alltid ved PDF eller bilde av tilbudet, så styret har sporbar dokumentasjon.</div>${flowActions("showOfferForm()","Åpne tilbudsopplasting","showCaseFlow(document.getElementById('flowDeviation')?.value)")}</section>`)}catch(e){flowDisabledStep('Velg avvik',e.message)}}
function showFlowBoardStep(){try{const c=flowSelectedDeviation();if(!c.offer)return flowDisabledStep('Last opp tilbud først','Styregodkjenning bør bygge på mottatt tilbud og pris.');flowPanel(`<section class="flow-step-card"><small>Steg 4 av 7</small><h3>Styregodkjenning</h3>${flowCaseMini(c)}<p>Lag et ryddig styrepapir med forslag til vedtak. Dette lagres under styrepapirer på eiendommen.</p><label>Forslag til vedtak<textarea id="flowBoardDecision" rows="3" placeholder="Styret godkjenner ..."></textarea></label><label>Begrunnelse<textarea id="flowBoardReason" rows="4" placeholder="Kort begrunnelse for valg, pris, risiko og anbefaling."></textarea></label><label>Forbehold eller oppfølging<textarea id="flowBoardConditions" rows="3" placeholder="Eventuelle forbehold, krav til dokumentasjon eller neste steg."></textarea></label>${flowActions("flowBoardApproval()","Lagre styregodkjenning","showCaseFlow(document.getElementById('flowDeviation')?.value)")}</section>`)}catch(e){flowDisabledStep('Velg avvik',e.message)}}
function showFlowContractStep(){try{const c=flowSelectedDeviation();flowPanel(`<section class="flow-step-card contract-step"><small>Steg 5 av 7</small><h3>Generer kontrakt</h3>${flowCaseMini(c)}<p>Kontrakten skal være tydelig nok til at styret og leverandør vet hva som er avtalt. Den får signaturfelt og lagres i dokumentarkivet.</p><div class="flow-form-grid"><label>Leverandør<input id="flowContractSupplier" value="${esc(c.offer?.supplier_name||'')}"></label><label>Avtalt pris<input id="flowContractPrice" value="${esc(c.offer?.price||'')}"></label><label>Frist / leveringsdato<input id="flowContractDeadline" type="date"></label><label>Kontaktperson<input id="flowContractContact" placeholder="Navn, e-post eller telefon"></label></div><label>Arbeidsomfang<textarea id="flowContractScope" rows="5" placeholder="Beskriv nøyaktig hva leverandøren skal levere.">${esc(c.workOrder?.description||c.deviation?.description||'')}</textarea></label><label>Vilkår, forbehold og dokumentasjonskrav<textarea id="flowContractTerms" rows="5" placeholder="Prisforbehold, HMS, FDV-dokumentasjon, garanti, fakturering, avvikshåndtering."></textarea></label>${flowActions("flowContract()","Generer og lagre kontrakt","showCaseFlow(document.getElementById('flowDeviation')?.value)")}</section>`)}catch(e){flowDisabledStep('Velg avvik',e.message)}}
function showFlowFdvStep(){try{const c=flowSelectedDeviation();flowPanel(`<section class="flow-step-card"><small>Steg 6 av 7</small><h3>Oppdater FDV</h3>${flowCaseMini(c)}<p>FDV-oppdateringen dokumenterer hva som er gjort og hva som må følges opp. Når dette lagres, lukkes saken.</p><label>Utført arbeid<textarea id="flowFdvDone" rows="4" placeholder="Hva ble utført, hvor og av hvem?"></textarea></label><label>Dokumentasjon og kontroll<textarea id="flowFdvDocs" rows="4" placeholder="FDV, bilder, kontrollskjema, garanti, serviceinformasjon."></textarea></label><label>Videre oppfølging<textarea id="flowFdvFollowup" rows="3" placeholder="Neste kontroll, frist, ansvarlig eller anbefalt tiltak."></textarea></label>${flowActions("flowFdv()","Lagre FDV og lukk sak","showCaseFlow(document.getElementById('flowDeviation')?.value)")}</section>`)}catch(e){flowDisabledStep('Velg avvik',e.message)}}
function showFlowReportStep(){try{const c=flowSelectedDeviation();flowPanel(`<section class="flow-step-card"><small>Steg 7 av 7</small><h3>Sluttrapport / utført arbeid</h3>${flowCaseMini(c)}<p>Rapporten er styrets oppsummering av saken. Den bør kunne leses uten å kjenne hele historikken.</p><label>Hva er gjort?<textarea id="flowReportDone" rows="4" placeholder="Kort oppsummering av arbeidet."></textarea></label><label>Vurdering og avvik<textarea id="flowReportAssessment" rows="4" placeholder="Hva ble vurdert, og finnes det avvik eller risiko?"></textarea></label><label>Anbefaling og neste steg<textarea id="flowReportNext" rows="4" placeholder="Hva bør styret eller forvalter gjøre videre?"></textarea></label>${flowActions("flowReport()","Lagre sluttrapport","showCaseFlow(document.getElementById('flowDeviation')?.value)")}</section>`)}catch(e){flowDisabledStep('Velg avvik',e.message)}}
async function flowCreateWorkOrder(){
  const out=document.getElementById('flowOut');
  try{requireLive('lage arbeidsordre');const c=flowSelectedDeviation();if(c.workOrder)throw new Error('Arbeidsordre finnes allerede for denne saken.');const row={property_id:currentProperty().id,deviation_id:c.deviation.id,title:document.getElementById('flowWoTitle')?.value||c.deviation.title,description:document.getElementById('flowWoDesc')?.value||c.deviation.description||'',due_date:document.getElementById('flowWoDue')?.value||null,status:'Ny'};const r=await db().from('work_orders').insert(row).select().single();if(r.error)throw r.error;await db().from('deviations').update({status:'Arbeidsordre opprettet'}).eq('id',c.deviation.id);await insertActivity('Arbeidsordre laget fra avvik','work_order',r.data.id);await hydrateAll();out.textContent='Arbeidsordre opprettet.';showCaseFlow(c.deviation.id)}catch(e){if(out)setOutputError(out,e)}
}
async function flowCreateRfq(){
  const out=document.getElementById('flowOut');
  try{requireLive('lage tilbudsforespørsel');const c=flowSelectedDeviation();if(!c.workOrder)throw new Error('Lag arbeidsordre først.');if(c.rfq)throw new Error('Tilbudsforespørsel finnes allerede for denne saken.');const row={property_id:currentProperty().id,work_order_id:c.workOrder.id,title:document.getElementById('flowRfqTitle')?.value||c.workOrder.title||c.deviation.title,description:document.getElementById('flowRfqDesc')?.value||c.workOrder.description||c.deviation.description||'',deadline:document.getElementById('flowRfqDeadline')?.value||null,status:'Utkast'};const r=await db().from('quote_requests').insert(row).select().single();if(r.error)throw r.error;await db().from('work_orders').update({status:'Tilbudsforespørsel opprettet'}).eq('id',c.workOrder.id);await insertActivity('Tilbudsforespørsel laget fra arbeidsordre','quote_request',r.data.id);await hydrateAll();out.textContent='Tilbudsforespørsel opprettet.';showCaseFlow(c.deviation.id)}catch(e){if(out)setOutputError(out,e)}
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
  const signature=String(kind||'').toLowerCase().includes('kontrakt')?`<section class="signatures"><h2>Signatur</h2><div class="signature-grid"><div><span>For kunde / styret</span><strong>${clean(p?.name||'Eiendom')}</strong><div class="line"></div><small>Dato / signatur</small></div><div><span>For leverandør</span><strong>Leverandør</strong><div class="line"></div><small>Dato / signatur</small></div></div></section>`:'';
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
    .signatures{border:1px solid #dbe6f3;background:#fbfdff;border-radius:14px;padding:20px 22px;margin:0 0 24px}
    .signatures h2{margin:0 0 16px;font-size:20px;color:#142033}
    .signature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}
    .signature-grid>div{border:1px solid #e2e9f2;border-radius:12px;padding:18px;background:#fff}
    .signature-grid span{display:block;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
    .signature-grid strong{display:block;margin-top:6px;color:#142033}
    .line{height:52px;border-bottom:2px solid #96a4b8;margin:18px 0 8px}
    .signature-grid small{color:#64748b}
    footer{padding:18px 38px;color:#6c7b91;background:#f8fafc;border-top:1px solid #e6edf5;font-size:13px}
    @media(max-width:680px){.page{margin:0;border-radius:0}.summary,.signature-grid{grid-template-columns:1fr}header,main,footer{padding-left:22px;padding-right:22px}}
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
      ${signature}
      <div class="note">Dette dokumentet er opprettet fra saksløpet i Driftspartner OS og lagret på valgt eiendom.</div>
    </main>
    <footer>${clean(p?.name||'Eiendom')} · Driftspartner OS</footer>
  </section>
</body>
</html>`;
}
function showCaseFlowResult(message,doc){const out=document.getElementById('flowOut');if(out)out.innerHTML=`${esc(message)}<br><button class="action primary" onclick="openDocument('${esc(doc.id)}')">Åpne dokument</button>`}
async function flowBoardApproval(){const out=document.getElementById('flowOut');try{const c=flowSelectedDeviation();if(!c.offer)throw new Error('Last opp tilbud før styregodkjenning.');const note=flowNote([['Forslag til vedtak',flowRead('flowBoardDecision')],['Begrunnelse',flowRead('flowBoardReason')],['Forbehold og oppfølging',flowRead('flowBoardConditions')]]);const doc=await uploadGeneratedDocument('Styregodkjenning - '+c.deviation.title,'Styrepapir',generatedCaseDocument('Styregodkjenning',c,note),'Godkjent');await insertActivity('Styregodkjenning registrert','board',c.deviation.id);await hydrateAll();showCaseFlow(c.deviation.id);setTimeout(()=>showCaseFlowResult('Styregodkjenning lagret i dokumentarkivet.',doc),0)}catch(e){if(out)setOutputError(out,e)}}
async function flowContract(){const out=document.getElementById('flowOut');try{const c=flowSelectedDeviation();const note=flowNote([['Leverandør',flowRead('flowContractSupplier')],['Avtalt pris',flowRead('flowContractPrice')],['Frist / leveringsdato',flowRead('flowContractDeadline')],['Kontaktperson',flowRead('flowContractContact')],['Arbeidsomfang',flowRead('flowContractScope')],['Vilkår, forbehold og dokumentasjonskrav',flowRead('flowContractTerms')]]);const doc=await uploadGeneratedDocument('Kontrakt - '+c.deviation.title,'Kontrakt',generatedCaseDocument('Kontrakt',c,note),'Klar');if(c.workOrder)await db().from('work_orders').update({status:'Kontrakt'}).eq('id',c.workOrder.id);await hydrateAll();showCaseFlow(c.deviation.id);setTimeout(()=>showCaseFlowResult('Kontrakt lagret i dokumentarkivet.',doc),0)}catch(e){if(out)setOutputError(out,e)}}
async function flowFdv(){const out=document.getElementById('flowOut');try{const c=flowSelectedDeviation();const note=flowNote([['Utført arbeid',flowRead('flowFdvDone')],['Dokumentasjon og kontroll',flowRead('flowFdvDocs')],['Videre oppfølging',flowRead('flowFdvFollowup')]]);const doc=await uploadGeneratedDocument('FDV oppdatert - '+c.deviation.title,'FDV',generatedCaseDocument('FDV-oppdatering',c,note),'Arkivert');if(c.workOrder)await db().from('work_orders').update({status:'Utført'}).eq('id',c.workOrder.id);await db().from('deviations').update({status:'Lukket'}).eq('id',c.deviation.id);await hydrateAll();showCaseFlow(c.deviation.id);setTimeout(()=>showCaseFlowResult('FDV oppdatert og sak lukket.',doc),0)}catch(e){if(out)setOutputError(out,e)}}
async function flowReport(){const out=document.getElementById('flowOut');try{const c=flowSelectedDeviation();const note=flowNote([['Hva er gjort',flowRead('flowReportDone')],['Vurdering og avvik',flowRead('flowReportAssessment')],['Anbefaling og neste steg',flowRead('flowReportNext')]]);const doc=await uploadGeneratedDocument('Rapport - '+c.deviation.title,'Annet',generatedCaseDocument('Sluttrapport',c,note),'Ferdig');await hydrateAll();showCaseFlow(c.deviation.id);setTimeout(()=>showCaseFlowResult('Rapport lagret i dokumentarkivet.',doc),0)}catch(e){if(out)setOutputError(out,e)}}

function DocumentsPage(){
  const docs=DP.cache.documents||[],cats=['Alle','FDV','HMS','Tilbud','Kontrakt','Styrepapir','Bilde','Tegning','Annet'];
  const active=DP.docCat||'Alle';
  const filtered=active==='Alle'?docs:docs.filter(d=>String(d.category||'')===active);
  const byCat=c=>docs.filter(d=>String(d.category||'')===c).length;
  const stats=cats.map(c=>`<button class="doc-filter ${active===c?'active':''}" onclick="DP.docCat='${esc(c)}';render()"><span>${esc(c)}</span><b>${c==='Alle'?docs.length:byCat(c)}</b></button>`).join('');
  return `<div class="grid documents-page"><div class="card s12 module-hero"><div><small>Dokumentarkiv</small><h2>FDV, HMS, tilbud og kontrakter</h2><p>Alle filer ligger på valgt eiendom og kan knyttes til bygg, avvik eller arbeidsordre.</p></div><div class="module-actions"><button class="action primary" onclick="showDocForm()">Last opp dokument</button><button class="action" onclick="showStandaloneContractForm()">Lag kontrakt</button></div></div><div class="card s12 document-filters">${stats}</div><div class="card s12">${documentCards(filtered)}</div></div>`;
}
function documentsTable(docs){
  return table(['Tittel','Kategori','Knyttet til','Versjon','Utløp','Status','Handling'],docs.map(d=>`<tr><td>${esc(d.title)}</td><td>${esc(d.category)}</td><td>${esc(documentLinkLabel(d))}</td><td>v${esc(d.version||1)}</td><td>${esc(d.expires_at||'-')}</td><td>${esc(d.status||'Arkivert')}</td><td><button class="action" onclick="showDocumentDetails('${esc(d.id)}')">Detaljer</button><button class="action" onclick="openDocument('${esc(d.id)}')">Åpne</button><button class="action" onclick="showDocumentVersionForm('${esc(d.id)}')">Ny versjon</button><button class="action red" onclick="deleteDocument('${esc(d.id)}','${esc(d.storage_path)}')">Slett</button></td></tr>`));
}
function documentCards(docs){
  if(!docs.length)return '<div class="empty-state"><strong>Ingen dokumenter i denne visningen.</strong><span>Last opp første FDV-fil, tegning, kontrakt eller styrepapir for valgt eiendom.</span><button class="action primary" onclick="showDocForm()">Last opp dokument</button></div>';
  return `<div class="document-grid">${docs.map(d=>`<section class="document-card"><div class="document-head"><div><span>${esc(d.category||'Dokument')}</span><strong>${esc(d.title||'Uten tittel')}</strong></div><b>v${esc(d.version||1)}</b></div><div class="document-meta"><div><small>Knyttet til</small><b>${esc(documentLinkLabel(d))}</b></div><div><small>Status</small><b>${esc(d.status||'Arkivert')}</b></div><div><small>Utløp</small><b>${esc(d.expires_at||'Ikke satt')}</b></div></div><div class="row-actions"><button class="action" onclick="showDocumentDetails('${esc(d.id)}')">Detaljer</button><button class="action" onclick="openDocument('${esc(d.id)}')">Åpne</button><button class="action" onclick="showDocumentVersionForm('${esc(d.id)}')">Ny versjon</button><button class="action red" onclick="deleteDocument('${esc(d.id)}','${esc(d.storage_path)}')">Slett</button></div></section>`).join('')}</div>`;
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
function showStandaloneContractForm(){
  showDrawer('Lag kontrakt',`<p class="muted">Opprett en kontrakt direkte på valgt eiendom, uavhengig av avvik, prosjekt eller tilbud.</p><label>Kontraktsnavn</label><input id="contractTitle" placeholder="Serviceavtale, vedlikeholdsavtale, rammeavtale..."><label>Leverandør / motpart</label><input id="contractSupplier"><label>Kontaktperson</label><input id="contractContact"><label>Kontraktsverdi</label><input id="contractValue" type="number"><label>Startdato</label><input id="contractStart" type="date"><label>Sluttdato / fornyelse</label><input id="contractEnd" type="date"><label>Omfang og vilkår</label><textarea id="contractScope" rows="7" placeholder="Beskriv leveranse, ansvar, pris, forbehold, frister og særlige vilkår."></textarea><button class="action primary" onclick="saveStandaloneContract()">Opprett kontrakt</button><div id="contractOut" class="output">Kontrakten lagres i dokumentarkivet med signaturfelt.</div>`);
}
async function saveStandaloneContract(){
  const out=document.getElementById('contractOut');
  try{
    requireLive('lage kontrakt');
    const title=contractTitle.value.trim()||'Kontrakt';
    const html=generatedStandaloneContract({
      title,
      supplier:contractSupplier.value.trim(),
      contact:contractContact.value.trim(),
      value:+contractValue.value||0,
      start:contractStart.value,
      end:contractEnd.value,
      scope:contractScope.value.trim()
    });
    await uploadGeneratedDocument(title,'Kontrakt',html,'Klar');
    await finishAction('Kontrakten er opprettet og lagret i dokumentarkivet.','documents');
  }catch(e){setOutputError(out,e,'Kontrakten kunne ikke opprettes akkurat nå.')}
}
function generatedStandaloneContract(data){
  const p=currentProperty();
  return generatedCaseDocument('Kontrakt',{
    deviation:{title:data.title,status:'Klar'},
    workOrder:{title:data.supplier||'Uavhengig kontrakt',status:'Klar'},
    rfq:{title:data.contact||'Ikke knyttet til tilbudsforespørsel'},
    offer:data.value?{price:data.value,status:'Avtalt'}:null
  },[
    `Leverandør / motpart: ${data.supplier||'-'}`,
    `Kontaktperson: ${data.contact||'-'}`,
    `Kontraktsverdi: ${data.value?money(data.value):'-'}`,
    `Startdato: ${data.start||'-'}`,
    `Sluttdato / fornyelse: ${data.end||'-'}`,
    '',
    'Omfang og vilkår:',
    data.scope||'-',
    '',
    `Eiendom: ${p?.name||'-'}`
  ].join('\n'));
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
    await finishAction('Dokumentet er lastet opp.','documents');
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
    await finishAction('Ny dokumentversjon er lagret.','documents');
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
    await insertActivity('Dokument slettet','document',id);await finishAction('Dokumentet er slettet.','documents');
  }catch(e){showDrawer('Dokument ble ikke slettet',`<div class=\"output\">${esc(customerError(e))}</div>`)}
}

function DocumentsPage(){
  const docs=DP.cache.documents||[],versions=DP.cache.document_versions||[];
  const cats=['Alle','FDV','HMS','Tilbud','Kontrakt','Styrepapir','Bilde','Tegning','Annet'];
  const active=DP.docCat||'Alle';
  const filtered=active==='Alle'?docs:docs.filter(d=>String(d.category||'')===active);
  const byCat=c=>docs.filter(d=>String(d.category||'')===c).length;
  const required=['FDV','HMS','Tegning','Kontrakt','Styrepapir'];
  const missing=required.filter(c=>!docs.some(d=>String(d.category||'')===c));
  const hasBrain=typeof subscriptionHas==='function'?subscriptionHas('brain'):true;
  const brainAction=hasBrain?`<button class="action" onclick="openModule('brain')">Property Brain</button>`:'';
  const analyzeAction=hasBrain?`<button class="action" onclick="openModule('brain')">Analyser</button>`:'';
  const documentGradeAction=hasBrain?'openModule("brain")':'showDocForm()';
  const expiring=documentsExpiring(docs);
  const stats=cats.map(c=>`<button class="doc-filter ${active===c?'active':''}" onclick="DP.docCat='${esc(c)}';render()"><span>${esc(c)}</span><b>${c==='Alle'?docs.length:byCat(c)}</b></button>`).join('');
  return `<div class="grid documents-page premium-documents">
    <div class="card s12 module-hero documents-hero"><div><small>FDV og dokumentarkiv</small><h2>Dokumentasjon for ${esc(currentProperty()?.name||'valgt eiendom')}</h2><p>FDV, HMS, tegninger, kontrakter, styrepapirer, bilder og tilbud lagres på valgt eiendom og kan knyttes til bygg eller sak.</p></div><div class="module-actions"><button class="action primary" onclick="showDocForm()">Last opp dokument</button><button class="action" onclick="showScanDocumentForm()">Skann dokument</button><button class="action" onclick="showStandaloneContractForm()">Lag kontrakt</button><button class="action" onclick="showEmailFlow('contract')">Send e-post</button>${brainAction}</div></div>
    ${docSummaryCard('Dokumenter',docs.length,'Lagret på eiendommen','showDocForm()','info')}
    ${docSummaryCard('Dokumentasjonsgrad',`${required.length-missing.length}/${required.length}`,missing.length?'Mangler nøkkeldokumenter':'Nøkkeldokumenter finnes',documentGradeAction,missing.length?'warn':'ok')}
    ${docSummaryCard('Utløper snart',expiring.length,'Kontroller, avtaler og frister','showExpiringDocuments()','warn')}
    ${docSummaryCard('Versjoner',versions.length,'Registrerte dokumentversjoner','DP.docCat="Alle";render()','purple')}
    <div class="card s8 document-health-card"><div class="dash-title"><div><h3>Arkivstatus</h3><p class="muted">Nøkkeldokumenter styret bør ha kontroll på.</p></div>${analyzeAction}</div>${documentHealthGrid(required,docs)}</div>
    <div class="card s4 document-deadline-card"><h3>Kommende kontroller</h3>${documentDeadlineList(expiring)}</div>
    <div class="card s12 document-filters">${stats}</div>
    <div class="card s12"><div class="dash-title"><div><h3>${esc(active==='Alle'?'Alle dokumenter':active)}</h3><p class="muted">Åpne, versjoner, detaljvis eller slett dokumenter fra valgt eiendom.</p></div><button class="action primary" onclick="showDocForm()">Last opp</button></div>${documentCards(filtered)}</div>
  </div>`;
}
function docSummaryCard(label,value,caption,action,type='info'){
  return `<button class="card s3 doc-summary ${type}" onclick="${action}"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(caption)}</span></button>`;
}
function documentsExpiring(docs){
  const now=new Date(),limit=new Date();limit.setDate(limit.getDate()+120);
  return (docs||[]).filter(d=>d.expires_at).map(d=>({...d,dt:new Date(d.expires_at)})).filter(d=>!Number.isNaN(d.dt.getTime())&&d.dt<=limit).sort((a,b)=>a.dt-b.dt).slice(0,8);
}
function documentHealthGrid(required,docs){
  return `<div class="document-health-grid">${required.map(cat=>{const found=docs.find(d=>String(d.category||'')===cat);return `<button class="${found?'ok':'warn'}" onclick="${found?`showDocumentDetails('${esc(found.id)}')`:'showDocForm()'}"><span>${found?'På plass':'Mangler'}</span><strong>${esc(cat)}</strong><small>${found?esc(found.title||'Dokument registrert'):'Last opp eller knytt dokument til kategorien'}</small></button>`}).join('')}</div>`;
}
function documentDeadlineList(rows){
  if(!rows.length)return '<div class="empty-state"><strong>Ingen utløp registrert.</strong><span>Legg inn utløpsdato på garantier, serviceavtaler, HMS eller kontroller.</span></div>';
  return `<div class="document-deadlines">${rows.map(d=>`<button onclick="showDocumentDetails('${esc(d.id)}')"><span>${esc(new Date(d.expires_at).toLocaleDateString('nb-NO',{day:'2-digit',month:'short'}))}</span><div><strong>${esc(d.title||'Dokument')}</strong><small>${esc(d.category||'Dokument')}</small></div></button>`).join('')}</div>`;
}
function showExpiringDocuments(){
  const rows=documentsExpiring(DP.cache.documents||[]);
  showDrawer('Utløper snart',rows.length?`<div class="document-deadlines drawer-list">${rows.map(d=>`<button onclick="showDocumentDetails('${esc(d.id)}')"><span>${esc(new Date(d.expires_at).toLocaleDateString('nb-NO'))}</span><div><strong>${esc(d.title||'Dokument')}</strong><small>${esc(d.category||'Dokument')} · ${esc(documentLinkLabel(d))}</small></div></button>`).join('')}</div>`:'<div class="empty-state"><strong>Ingen dokumentfrister.</strong><span>Legg inn utløpsdato på dokumenter for å få varsler.</span></div>');
}
function documentCards(docs){
  if(!docs.length)return '<div class="empty-state"><strong>Ingen dokumenter i denne visningen.</strong><span>Last opp første FDV-fil, tegning, kontrakt eller styrepapir for valgt eiendom.</span><button class="action primary" onclick="showDocForm()">Last opp dokument</button></div>';
  return `<div class="document-grid premium-document-grid">${docs.map(d=>documentCard(d)).join('')}</div>`;
}
function documentCard(d){
  const exp=d.expires_at?new Date(d.expires_at):null,isSoon=exp&&!Number.isNaN(exp.getTime())&&exp<(new Date(Date.now()+1000*60*60*24*60));
  return `<section class="document-card premium-doc-card ${isSoon?'warn':''}">
    <div class="document-head"><div><span>${esc(d.category||'Dokument')}</span><strong>${esc(d.title||'Uten tittel')}</strong></div><b>v${esc(d.version||1)}</b></div>
    <div class="document-meta"><div><small>Knyttet til</small><b>${esc(documentLinkLabel(d))}</b></div><div><small>Status</small><b>${esc(d.status||'Arkivert')}</b></div><div><small>Utløp</small><b>${esc(d.expires_at||'Ikke satt')}</b></div></div>
    ${d.notes?`<p>${esc(d.notes)}</p>`:''}
    <div class="row-actions"><button class="action primary" onclick="openDocument('${esc(d.id)}')">Åpne</button><button class="action" onclick="showDocumentDetails('${esc(d.id)}')">Detaljer</button><button class="action" onclick="showDocumentVersionForm('${esc(d.id)}')">Ny versjon</button><button class="action red" onclick="deleteDocument('${esc(d.id)}','${esc(d.storage_path)}')">Slett</button></div>
  </section>`;
}
function showDocForm(){
  const buildings=DP.cache.buildings||[],devs=DP.cache.deviations||[],wos=DP.cache.work_orders||[];
  showDrawer('Last opp dokument',`<div class="doc-upload-panel"><div class="form-grid two"><label>Tittel<input id="docTitle" placeholder="Branninstruks, taktegning, serviceavtale..."></label><label>Kategori<select id="docCat"><option>FDV</option><option>HMS</option><option>Tilbud</option><option>Kontrakt</option><option>Styrepapir</option><option>Bilde</option><option>Tegning</option><option>Annet</option></select></label><label>Bygg<select id="docBuilding"><option value="">Hele eiendommen</option>${docOptions(buildings)}</select></label><label>Knytt til sak<select id="docCase"><option value="">Ingen sak</option><optgroup label="Avvik">${docOptions(devs)}</optgroup><optgroup label="Arbeidsordre">${docOptions(wos)}</optgroup></select></label><label>Utløpsdato / fornyelse<input id="docExpires" type="date"></label><label>Fil<input id="docFile" type="file"></label></div><label>Notat</label><textarea id="docNotes" rows="4" placeholder="Kort beskrivelse, garanti, kontrollfrist, leverandør eller annen relevant informasjon"></textarea><div class="flow-note">Dokumentet lagres live på valgt eiendom. Velg riktig kategori og bygg/sak hvis dokumentet skal brukes i Property Brain og rapporter.</div><button class="action primary" onclick="uploadDocument()">Last opp dokument</button><div id="docOut" class="output"></div></div>`);
}
function showScanDocumentForm(){
  const buildings=DP.cache.buildings||[],devs=DP.cache.deviations||[],wos=DP.cache.work_orders||[];
  showDrawer('Skann dokument',`<div class="doc-upload-panel scan-panel"><div class="flow-note"><strong>Mobilskanning</strong><br>Bruk kamera på mobil/nettbrett, eller velg bilde/PDF fra PC. Filen lagres live i dokumentarkivet på valgt eiendom.</div><div class="form-grid two"><label>Tittel<input id="docTitle" placeholder="Skannet dokument"></label><label>Kategori<select id="docCat"><option>FDV</option><option>HMS</option><option>Tegning</option><option>Kontrakt</option><option>Styrepapir</option><option>Bilde</option><option>Tilbud</option><option>Annet</option></select></label><label>Bygg<select id="docBuilding"><option value="">Hele eiendommen</option>${docOptions(buildings)}</select></label><label>Knytt til sak<select id="docCase"><option value="">Ingen sak</option><optgroup label="Avvik">${docOptions(devs)}</optgroup><optgroup label="Arbeidsordre">${docOptions(wos)}</optgroup></select></label><label>Utløpsdato / fornyelse<input id="docExpires" type="date"></label><label>Skann/velg fil<input id="docFile" type="file" accept="image/*,.pdf" capture="environment"></label></div><label>Notat</label><textarea id="docNotes" rows="4" placeholder="Hva er dokumentet, hvor hører det hjemme, og hva bør styret vite?"></textarea><button class="action primary" onclick="uploadDocument()">Lagre skannet dokument</button><div id="docOut" class="output">Klar til skanning.</div></div>`);
}
function showDocumentDetails(id){
  const d=(DP.cache.documents||[]).find(x=>x.id===id);if(!d)return;
  const versions=(DP.cache.document_versions||[]).filter(v=>v.document_id===id);
  const info=[['Kategori',d.category],['Knyttet til',documentLinkLabel(d)],['Versjon','v'+(d.version||1)],['Utløpsdato',d.expires_at||'-'],['Status',d.status||'Arkivert'],['Notat',d.notes||'-']];
  showDrawer('Dokumentdetaljer',`<section class="document-detail"><div class="document-detail-head"><span>${esc(d.category||'Dokument')}</span><h3>${esc(d.title||'Uten tittel')}</h3><p>${esc(documentLinkLabel(d))}</p></div><div class="property-key-grid">${info.map(x=>`<div><small>${esc(x[0])}</small><b>${esc(x[1])}</b></div>`).join('')}</div><div class="row-actions"><button class="action primary" onclick="openDocument('${esc(id)}')">Åpne siste versjon</button><button class="action" onclick="showDocumentVersionForm('${esc(id)}')">Last opp ny versjon</button><button class="action red" onclick="deleteDocument('${esc(id)}','${esc(d.storage_path)}')">Slett</button></div><h3>Versjoner</h3>${documentVersionCards(versions)}</section>`);
}
function documentVersionCards(versions){
  if(!versions.length)return '<div class="empty-state"><strong>Ingen versjonshistorikk.</strong><span>Når ny versjon lastes opp, vises historikken her.</span></div>';
  return `<div class="document-version-list">${versions.map(v=>`<button onclick="openDocumentVersion('${esc(v.storage_path)}')"><span>v${esc(v.version||'-')}</span><div><strong>${esc(v.file_name||'Dokumentversjon')}</strong><small>${esc(v.created_at||'-')}</small></div></button>`).join('')}</div>`;
}



