/* Driftspartner OS module: 98-production-hard-stop.js
   Hard production guardrails: block old local/test paths that made the app feel unreliable. */
function dpHardStopMessage(action){
  return `${action} krever innlogging, valgt Supabase-eiendom og vellykket lagring. Systemet lagrer ikke lokalt hvis produksjonslagring feiler.`;
}
function dpHardRequireLive(action){
  if(typeof dpRequireLiveWrite==='function'){dpRequireLiveWrite(action);return true}
  if(!state.currentUserRecord||!isUuid(property()?.id))throw new Error(dpHardStopMessage(action));
  return true;
}
loginDisabled=function(){
  showDrawer('Kun ekte innlogging',`<div class="output">Testinnlogging er stengt. Driftspartner OS skal bare åpnes med Supabase Auth og tilgang til valgt eiendom.</div><button class="action primary" onclick="showLogin()">Logg inn</button>`);
};
saveActivityLogToSupabase=async function(action,caseId='-',entityType='activity'){
  if(!state.currentUserRecord||!isUuid(property()?.id))return;
  const db=supabaseClient(),p=property();
  const row={property_id:p.id,action,entity_type:entityType||'activity',metadata:{caseId,actor:user().name,role:user().role}};
  const r=await db.from('activity_log').insert(row);
  if(r.error)throw r.error;
};
addDocument=function(type,name,status='Arkivert'){
  showDrawer('Dokument ikke lagret',`<div class="output">Dokumenter må lastes opp med faktisk fil til filarkivet. Metadata alene lagres ikke.</div><button class="action primary" onclick="showUploadFDV('${esc(type||'FDV')}')">Last opp fil</button>`);
};
testSupabaseConnection=async function(){
  const out=document.getElementById('sbOut');
  try{
    saveSupabaseConfig();
    const db=supabaseClient();
    const r=await db.from('customers').select('id,name').limit(3);
    if(r.error)throw r.error;
    if(out)out.textContent=`Kobling OK.\nFant ${r.data?.length||0} kunder.`;
  }catch(e){if(out)out.textContent='Kobling feilet: '+e.message}
};
loadSupabaseProperties=async function(){
  const out=document.getElementById('sbOut');
  try{
    saveSupabaseConfig();
    const db=supabaseClient();
    const r=await db.from('properties').select('*, customers(name)').limit(200);
    if(r.error)throw r.error;
    state.properties=(r.data||[]).map(mapSupabaseProperty);
    if(state.users[0])state.users[0].properties=state.properties.map(p=>p.id);
    state.selectedProperty=state.properties[0]?.id||'';
    if(state.selectedProperty)await hydrateCurrentPropertyData(db);
    renderPropertyContext();
    if(out)out.textContent=`Hentet ${state.properties.length} eiendommer fra Supabase.`;
  }catch(e){if(out)out.textContent='Henting feilet: '+e.message}
};
sendEmailLog=async function(kind,caseId){
  const checked=[...document.querySelectorAll('.mailRecipient:checked')].map(x=>x.value);
  const extra=typeof parseEmails==='function'?parseEmails(document.getElementById('emailExtra')?.value):String(document.getElementById('emailExtra')?.value||'').split(/[,\s;]+/).filter(x=>x.includes('@'));
  const recipients=typeof dpUniqueEmails==='function'?dpUniqueEmails([...checked,...extra]):[...new Set([...checked,...extra])];
  const subject=document.getElementById('emailSubject')?.value||'',message=document.getElementById('emailBody')?.value||'';
  if(!recipients.length){showDrawer('Mangler mottaker','<div class="output">Legg inn minst en mottaker.</div>');return}
  if(location.protocol==='file:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'){
    showDrawer('E-post ikke sendt',`<div class="output">E-post sendes bare fra publisert Netlify-side. Ingenting er logget som sendt.</div>`);
    return;
  }
  const results=[];
  for(const to of recipients){
    try{
      const res=await fetch('/.netlify/functions/send-email',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({to,subject,message,kind,caseId,property:property().name})});
      const data=await res.json().catch(()=>({ok:false,message:'Kunne ikke lese svar fra e-postfunksjonen'}));
      if(!res.ok||!data.ok)throw new Error(data.message||`HTTP ${res.status}`);
      results.push({to,ok:true,id:data.id||data.data?.id||'-'});
      logActivity(`E-post sendt til ${to}: ${subject}`,caseId);
    }catch(e){results.push({to,ok:false,error:e.message})}
  }
  const failed=results.filter(r=>!r.ok);
  showDrawer(failed.length?'E-post feilet for noen mottakere':'E-post sendt',`<table><tr><th>Mottaker</th><th>Status</th><th>Detalj</th></tr>${results.map(r=>`<tr><td>${esc(r.to)}</td><td>${r.ok?'<span class="badge ok">Sendt</span>':'<span class="badge bad">Feilet</span>'}</td><td>${esc(r.id||r.error||'-')}</td></tr>`).join('')}</table>${failed.length?'<div class="output">Feilede mottakere er ikke logget som sendt.</div>':'<div class="output">Sendingen er logget på valgt eiendom.</div>'}`);
};
createCustomerCard=async function(){
  try{
    dpHardRequireLive('opprette kunde og eiendom');
    if(normalizeRole(user().role)!=='superadmin')throw new Error('Bare superadmin kan opprette nye kunder.');
    const db=supabaseClient();
    const customerPayload={name:document.getElementById('custName').value.trim(),org_number:document.getElementById('custOrgnr').value.trim(),invoice_address:document.getElementById('custInvoice').value.trim(),billing_email:document.getElementById('custEmail').value.trim(),status:'active'};
    if(!customerPayload.name)throw new Error('Kundenavn mangler.');
    const customer=await db.from('customers').insert(customerPayload).select().single();
    if(customer.error)throw customer.error;
    const propPayload={customer_id:customer.data.id,name:document.getElementById('propName').value.trim(),address:document.getElementById('propAddress').value.trim(),property_type:document.getElementById('propType').value};
    if(!propPayload.name)throw new Error('Eiendomsnavn mangler.');
    const prop=await db.from('properties').insert(propPayload).select().single();
    if(prop.error)throw prop.error;
    const contact=await db.from('property_contacts').insert({property_id:prop.data.id,name:document.getElementById('custContact').value.trim(),role:'Styreleder',email:customerPayload.billing_email,phone:'',notes:'Opprettet fra Driftspartner OS'});
    if(contact.error)throw contact.error;
    const p=mapSupabaseProperty({...prop.data,customers:{name:customer.data.name}});
    state.properties.unshift(p);
    if(state.users[0])state.users[0].properties=[...new Set([...(state.users[0].properties||[]),p.id])];
    state.selectedProperty=p.id;
    logActivity('Kunde og eiendom opprettet',p.id);
    showDrawer('Kunde og eiendom opprettet',`<table><tr><td>Kunde</td><td>${esc(customer.data.name)}</td></tr><tr><td>Eiendom</td><td>${esc(p.name)}</td></tr><tr><td>Lagring</td><td>Supabase</td></tr></table><button class="action primary" onclick="openMain('property',null)">Åpne eiendom</button>`);
  }catch(e){dpShowSupabaseError('Kunde/eiendom ble ikke lagret',e,'customers / properties / property_contacts')}
};
savePropertyAccess=async function(){
  const auth_user_id=document.getElementById('accessAuthUid')?.value.trim(),name=document.getElementById('accessName')?.value.trim(),email=document.getElementById('accessEmail')?.value.trim(),phone=document.getElementById('accessPhone')?.value.trim(),role=document.getElementById('accessRole')?.value,property_id=document.getElementById('accessProperty')?.value,access_role=document.getElementById('accessLevel')?.value;
  try{
    dpHardRequireLive('lagre tilgang');
    if(!auth_user_id||!email||!name)throw new Error('Fyll inn Auth UID, navn og e-post.');
    const db=supabaseClient();
    const profile=await db.from('app_users').upsert({auth_user_id,name,email,phone,role},{onConflict:'email'}).select().single();
    if(profile.error)throw profile.error;
    const access=await db.from('property_access').upsert({property_id,user_id:profile.data.id,access_role},{onConflict:'property_id,user_id'});
    if(access.error)throw access.error;
    await refreshAccessOverview();
    showDrawer('Tilgang lagret',`<table><tr><td>Bruker</td><td>${esc(name)}</td></tr><tr><td>E-post</td><td>${esc(email)}</td></tr><tr><td>Rolle</td><td>${esc(role)}</td></tr><tr><td>Lagring</td><td>Supabase</td></tr></table>`);
  }catch(e){dpShowSupabaseError('Tilgang ble ikke lagret',e,'app_users / property_access')}
};
if(app?.admin?.tabs){
  delete app.admin.tabs['MVP-plan'];
  delete app.admin.tabs['MVP-moduler'];
  app.admin.tabs['Produksjonsplan']=()=>mvpPlanPage();
}
