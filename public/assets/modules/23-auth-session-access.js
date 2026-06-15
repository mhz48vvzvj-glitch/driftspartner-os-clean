/* Driftspartner OS module: 23-auth-session-access.js
   Auth status, login, magic link, session resume and property access.
   Source: 20-auth-supabase.js:164-304
*/
function authStatusText(){
  let u=user(), p=property();
  return `Innlogget bruker: ${u.name}\nRolle: ${u.role}\nValgt eiendom: ${p?.name||'-'}\nTilgjengelige eiendommer: ${allowedProperties().map(x=>x.name).join(', ')||'Ingen'}`;
}
function authAccessPage(){
  let props=state.properties.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  return `<div class="grid"><div class="card s12"><div class="dash-title"><h3>Auth og tilgang per eiendom</h3><div><button class="action" onclick="refreshAccessOverview()">Oppdater</button><button class="action primary" onclick="showLogin()">Test ekte innlogging</button></div></div><p class="muted">Brukere skal finnes i Supabase Auth, app_users og property_access. Da ser de bare eiendommene de har tilgang til.</p><div id="accessStatus" class="output">${authStatusText()}</div></div><div class="card s7"><h3>Tilganger</h3><div id="accessList">${accessTable()}</div></div><div class="card s5"><h3>Legg til brukerprofil og tilgang</h3><label>Auth User UID</label><input id="accessAuthUid" placeholder="UUID fra Supabase Auth"><label>Navn</label><input id="accessName" value="Ny bruker"><label>E-post</label><input id="accessEmail" value="bruker@kunde.no"><label>Telefon</label><input id="accessPhone" value="900 00 000"><label>Rolle</label><select id="accessRole"><option value="styreleder">Styreleder</option><option value="vaktmester">Vaktmester</option><option value="leverandor">Leverandor</option><option value="superadmin">Superadmin</option></select><label>Eiendom</label><select id="accessProperty">${props}</select><label>Tilgangsniva</label><select id="accessLevel"><option value="owner">Eier/admin</option><option value="member">Medlem</option><option value="vendor">Leverandor</option><option value="readonly">Kun lesing</option></select><button class="action green" onclick="savePropertyAccess()">Lagre tilgang</button><div class="output">Passord og invitasjon lages i Supabase Auth. Denne skjermen kobler Auth-brukeren til appen og eiendommen.</div></div></div>`;
}
function accessTable(){
  return `<table><tr><th>Bruker</th><th>Rolle</th><th>E-post</th><th>Eiendommer</th></tr>${state.users.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.role)}</td><td>${esc(u.email||'-')}</td><td>${u.role==='superadmin'?'Alle':state.properties.filter(p=>(u.properties||[]).includes(p.id)).map(p=>esc(p.name)).join(', ')||'-'}</td></tr>`).join('')}</table>`;
}
async function refreshAccessOverview(){
  let out=document.getElementById('accessStatus');
  if(out)out.textContent='Henter brukere og tilganger fra Supabase...';
  try{
    let db=supabaseClient();
    let {data:users,error:userError}=await db.from('app_users').select('*').order('name',{ascending:true});
    if(userError)throw userError;
    let {data:access,error:accessError}=await db.from('property_access').select('user_id, property_id, access_role, properties(name)');
    if(accessError)throw accessError;
    if(users?.length){
      state.users=users.map(u=>({id:u.id,name:u.name,email:u.email,phone:u.phone||'',role:normalizeRole(u.role),org:'Supabase',properties:access.filter(a=>a.user_id===u.id).map(a=>a.property_id)}));
      if(!state.users.find(u=>u.id===state.currentUser))state.currentUser=state.users[0].id;
    }
    let list=document.getElementById('accessList');
    if(list)list.innerHTML=accessTable();
    if(out)out.textContent=`Koblet til Supabase.\nBrukere: ${users?.length||0}\nTilganger: ${access?.length||0}\n\n${authStatusText()}`;
    renderUserSelect();renderPropertyContext();renderRoleMenu();
  }catch(e){
    if(out)out.textContent='Kun lokal visning: '+e.message+'\n\nKjor driftspartner-auth-property-access.sql i Supabase, og logg inn med ekte bruker.';
  }
}
async function savePropertyAccess(){
  let auth_user_id=document.getElementById('accessAuthUid').value.trim(),name=document.getElementById('accessName').value.trim(),email=document.getElementById('accessEmail').value.trim(),phone=document.getElementById('accessPhone').value.trim(),role=document.getElementById('accessRole').value,property_id=document.getElementById('accessProperty').value,access_role=document.getElementById('accessLevel').value;
  if(!auth_user_id||!email||!name){showDrawer('Mangler info',`<div class="output">Fyll inn Auth User UID, navn og e-post. UID finner du i Supabase Auth > Users.</div>`);return}
  let storage='Supabase-feil';
  try{
    let db=supabaseClient();
    let {data:profile,error:profileError}=await db.from('app_users').upsert({auth_user_id,name,email,phone,role},{onConflict:'email'}).select().single();
    if(profileError)throw profileError;
    let {error:accessError}=await db.from('property_access').upsert({property_id,user_id:profile.id,access_role},{onConflict:'property_id,user_id'});
    if(accessError)throw accessError;
    storage='Supabase';
  }catch(e){storage='Supabase-feil: '+e.message}
  let local=state.users.find(u=>u.email?.toLowerCase()===email.toLowerCase());
  if(!local){local={id:'u-'+Date.now(),name,email,phone,role:normalizeRole(role),org:'Supabase',properties:[]};state.users.push(local)}
  Object.assign(local,{name,email,phone,role:normalizeRole(role)});
  if(!local.properties.includes(property_id))local.properties.push(property_id);
  let list=document.getElementById('accessList');if(list)list.innerHTML=accessTable();
  let out=document.getElementById('accessStatus');if(out)out.textContent=`Tilgang lagret: ${storage}\n${name} -> ${state.properties.find(p=>p.id===property_id)?.name||property_id}`;
  renderUserSelect();act('Tilgang oppdatert for '+name);
}
app.admin.tabs['Tilganger']=()=>authAccessPage();
app.admin.tabs['Brukere']=()=>authAccessPage();

function friendlyAuthError(e){
  let m=String(e?.message||e||'Ukjent feil');
  let l=m.toLowerCase();
  if(l.includes('invalid login credentials'))return 'Feil e-post eller passord. Hvis brukeren ikke har passord, bruk Send magic link eller Send passordlenke fra Supabase Auth.';
  if(l.includes('email not confirmed'))return 'E-posten er ikke bekreftet i Supabase Auth.';
  if(l.includes('failed to fetch')||l.includes('load failed'))return 'Fikk ikke kontakt med Supabase. Sjekk nett, Project URL og publishable key.';
  if(l.includes('row level security')||l.includes('permission denied'))return 'Tilgangsreglene stopper lesing. Sjekk at brukeren finnes i app_users og property_access.';
  if(l.includes('no rows'))return 'Innlogging virket, men brukeren mangler app_users-profil. Kjor driftspartner-create-first-superadmin.sql eller legg brukeren inn under Admin > Tilganger.';
  return m;
}
function showLogin(){
  showDrawer('Logg inn',`<div class="grid"><div class="card s6 login-box"><h3>Ekte innlogging</h3><label>E-post</label><input id="authEmail" value="post@driftspartnernord.no"><label>Passord</label><input id="authPassword" type="password" value="" placeholder="Passord fra Supabase Auth"><button class="action primary" onclick="loginSupabase()">Logg inn med passord</button><button class="action" onclick="sendMagicLink()">Send magic link</button><button class="action" onclick="diagnoseAuthUser()">Diagnose</button><div id="authOut" class="output">Bruker ma finnes i Supabase Auth, app_users og property_access. Hvis du ikke har passord, send magic link eller lag/reset passord i Supabase.</div></div><div class="card s6 login-box"><h3>Supabase-innlogging</h3><label>Velg rolle</label><select id="loginUser">${state.users.map(u=>`<option value="${u.id}">${u.name} - ${u.role}</option>`).join('')}</select><button class="action" onclick="loginDisabled()">Innlogging uten Supabase er deaktivert</button><div class="hint">Supabase-innlogging er kun for visning. Kundedrift skal bruke ekte Supabase-login.</div></div></div>`);
}
async function loginSupabase(){
  let out=document.getElementById('authOut');
  try{
    let db=supabaseClient(),email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value;
    if(!email)throw new Error('Skriv inn e-post.');
    if(!password)throw new Error('Skriv inn passord, eller bruk Send magic link.');
    out.textContent='Logger inn...';
    let {data,error}=await db.auth.signInWithPassword({email,password});
    if(error)throw error;
    await completeSupabaseLogin(db,data.user,out);
  }catch(e){if(out)out.textContent='Innlogging feilet: '+friendlyAuthError(e)}
}
async function completeSupabaseLogin(db,authUser,out){
  let {data:profile,error:profileError}=await db.from('app_users').select('*').eq('auth_user_id',authUser.id).maybeSingle();
  if(profileError)throw profileError;
  if(!profile&&authUser.email){
    let fallback=await db.from('app_users').select('*').eq('email',authUser.email).maybeSingle();
    if(fallback.error)throw fallback.error;
    profile=fallback.data;
  }
  if(!profile&&authUser.email?.toLowerCase()==='post@driftspartnernord.no'){
    let created=await db.from('app_users').insert({auth_user_id:authUser.id,name:'Driftspartner Nord',email:authUser.email,role:'superadmin'}).select('*').single();
    if(created.error)throw created.error;
    profile=created.data;
  }
  if(!profile)throw new Error('no rows in app_users for auth uid '+authUser.id);
  state.currentUserRecord=profile;
  state.currentUser=profile.id;
  state.users=[{id:profile.id,name:profile.name,email:profile.email,phone:profile.phone||'',role:normalizeRole(profile.role),org:'Supabase',properties:[]}];
  await loadPropertiesForCurrentUser(db,profile);
  if(!state.properties.length)throw new Error('Brukeren har ingen eiendommer i property_access.');
  state.isLoggedIn=true;
  current='home';
  document.body.classList.remove('public-mode');
  refresh();
  act('Innlogget med Supabase');
}
async function sendMagicLink(){
  let out=document.getElementById('authOut');
  try{
    let db=supabaseClient(),email=document.getElementById('authEmail').value.trim();
    if(!email)throw new Error('Skriv inn e-post.');
    out.textContent='Sender magic link...';
    let {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.href}});
    if(error)throw error;
    out.textContent='Magic link sendt til '+email+'. Apne e-posten og bruk lenken for a logge inn.';
  }catch(e){if(out)out.textContent='Magic link feilet: '+friendlyAuthError(e)}
}
async function diagnoseAuthUser(){
  let out=document.getElementById('authOut');
  try{
    let db=supabaseClient(),email=document.getElementById('authEmail').value.trim();
    if(!email)throw new Error('Skriv inn e-post.');
    out.textContent='Sjekker app_users og property_access...';
    let {data:profiles,error:profileError}=await db.from('app_users').select('*').eq('email',email);
    if(profileError)throw profileError;
    if(!profiles?.length){out.textContent='Fant ikke brukeren i app_users. Opprett profil med Auth UID i Admin > Tilganger, eller kjor driftspartner-create-first-superadmin.sql.';return}
    let profile=profiles[0];
    let {data:access,error:accessError}=await db.from('property_access').select('access_role, properties(name)').eq('user_id',profile.id);
    if(accessError)throw accessError;
    out.textContent=`app_users: OK\nNavn: ${profile.name}\nRolle: ${profile.role}\nAuth UID: ${profile.auth_user_id||'Mangler'}\nproperty_access: ${access?.length||0}\n${(access||[]).map(a=>'- '+(a.properties?.name||'Eiendom')+' ('+a.access_role+')').join('\n')||'Ingen eiendomstilgang funnet.'}`;
  }catch(e){if(out)out.textContent='Diagnose feilet: '+friendlyAuthError(e)}
}
async function resumeSupabaseSession(){
  try{
    let db=supabaseClient();
    let {data}=await db.auth.getSession();
    if(!data?.session?.user)return false;
    await completeSupabaseLogin(db,data.session.user,null);
    return true;
  }catch(e){return false}
}

