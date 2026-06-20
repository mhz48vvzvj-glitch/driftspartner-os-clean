function normalizeRole(role){
  const value=String(role||'').trim().toLowerCase();
  if(value==='leverandør')return 'leverandor';
  return value;
}
async function login(){
  const out=document.getElementById('loginOut');
  if(window.__dpLoginBusy)return;
  window.__dpLoginBusy=true;
  const buttons=[...document.querySelectorAll('[data-login-submit]')];
  try{
    buttons.forEach(b=>{b.disabled=true;b.textContent='Logger inn...'});
    if(out)out.textContent='Logger inn...';
    setStatus('Logger inn...');
    if(!window.supabase)throw new Error('Appen er ikke ferdig lastet. Last siden på nytt og prøv igjen.');
    const email=document.getElementById('loginEmail').value.trim(),password=document.getElementById('loginPassword').value;
    if(!email||!password)throw new Error('Fyll inn e-post og passord.');
    if(location.protocol==='file:'&&out)out.textContent='Logger inn fra lokal fil. Hvis dette feiler, bruk publisert Netlify-adresse.';
    const client=db();
    const auth=await client.auth.signInWithPassword({email,password});
    if(auth.error)throw auth.error;
    if(out)out.textContent='Innlogging godkjent. Henter brukerprofil...';
    DP.session=auth.data.session;
    let profileData=null,propertyData=null;
    if(location.protocol!=='file:'){
      const serverProfile=await fetch('/.netlify/functions/auth-profile',{method:'POST',headers:{authorization:`Bearer ${auth.data.session.access_token}`,'content-type':'application/json'},body:'{}'}).then(r=>readJsonResponse(r,'Profil-tjenesten svarte ikke riktig. Publiser siste pakke og prøv igjen.')).catch(e=>({ok:false,message:e.message}));
      if(serverProfile.ok){profileData=serverProfile.profile;propertyData=serverProfile.properties||[]}
      else if(out)out.textContent='Henter brukerprofil...';
    }
    if(!profileData){
      let profile=await client.from('app_users').select('*').eq('auth_user_id',auth.data.user.id).maybeSingle();
      if(profile.error)throw profile.error;
      if(!profile.data)profile=await client.from('app_users').select('*').eq('email',auth.data.user.email).maybeSingle();
      if(!profile.data)throw new Error('Brukeren mangler app-tilgang. Kontakt Driftspartner Nord for å få tilgang.');
      profileData=profile.data;
    }
    DP.user={...profileData,role:normalizeRole(profileData.role)};
    if(out)out.textContent='Profil funnet. Henter eiendommer...';
    if(propertyData){DP.properties=propertyData.map(mapProperty).filter(Boolean);DP.propertyId=DP.properties[0]?.id||''}
    else await loadProperties();
    if(!DP.properties.length)throw new Error('Brukeren har ikke tilgang til noen eiendom ennå. Kontakt administrator.');
    await hydrateAll();
    hideDrawer();DP.module='dashboard';render();setStatus('Innlogget.');
  }catch(e){
    const msg=customerError(e,'Innlogging feilet. Sjekk e-post/passord, eller kontakt Driftspartner Nord.');
    if(out)out.textContent=msg;
    setStatus(msg,'bad');
  }finally{
    window.__dpLoginBusy=false;
    buttons.forEach(b=>{b.disabled=false;b.textContent='Logg inn'});
  }
}
async function testLoginConnection(){
  const out=document.getElementById('loginOut');
  try{
    if(out)out.textContent='Tester kobling...';
    setStatus('Tester kobling...');
    if(!window.supabase)throw new Error('Appen er ikke ferdig lastet. Last siden på nytt og prøv igjen.');
    if(!DP?.sb?.url||!DP?.sb?.key)throw new Error('Appen mangler kobling.');
    const client=db();
    const authCheck=await client.auth.getSession();
    if(authCheck.error)throw authCheck.error;
    const r=await client.from('properties').select('id,name').limit(1);
    if(r.error)throw r.error;
    const msg=`Tilkobling klar. Fant ${r.data?.length||0} eiendommer. Du kan prøve innlogging.`;
    if(out)out.textContent=msg;
    setStatus('Tilkobling klar.');
  }catch(e){
    const msg=customerError(e,'Koblingen kunne ikke testes akkurat nå. Last siden på nytt og prøv igjen.');
    if(out)out.textContent=msg;
    setStatus(msg,'bad');
  }
}
window.login=login;
window.testLoginConnection=testLoginConnection;
window.showLogin=showLogin;
document.addEventListener('DOMContentLoaded',()=>{
  const out=document.getElementById('loginOut');
  if(out&&out.textContent.includes('Venter pa app-script'))out.textContent='Appen er lastet. Sjekker tilkobling...';
});
async function logout(){try{await db().auth.signOut()}catch(e){}DP.session=null;DP.user=null;DP.properties=[];DP.propertyId='';DP.cache={};renderPublic()}
async function resumeSession(){
  renderPublic();
  try{
    const client=db(),s=await client.auth.getSession();
    if(!s.data.session)return;
    DP.session=s.data.session;
    const u=s.data.session.user;
    let profileData=null,propertyData=null;
    if(location.protocol!=='file:'){
      const serverProfile=await fetch('/.netlify/functions/auth-profile',{method:'POST',headers:{authorization:`Bearer ${s.data.session.access_token}`,'content-type':'application/json'},body:'{}'}).then(r=>readJsonResponse(r,'Profil-tjenesten svarte ikke riktig.')).catch(()=>null);
      if(serverProfile?.ok){profileData=serverProfile.profile;propertyData=serverProfile.properties||[]}
    }
    if(!profileData){
      let profile=await client.from('app_users').select('*').eq('auth_user_id',u.id).maybeSingle();
      if(profile.error)throw profile.error;
      if(!profile.data)return;
      profileData=profile.data;
    }
    DP.user={...profileData,role:normalizeRole(profileData.role)};
    if(propertyData){DP.properties=propertyData.map(mapProperty).filter(Boolean);DP.propertyId=DP.properties[0]?.id||''}
    else await loadProperties();
    await hydrateAll();render();
  }catch(e){console.warn(e);renderPublic()}
}
async function loadProperties(){
  const client=db();
  if(DP.user.role==='superadmin'){
    const r=await client.from('properties').select('*, customers(*)').order('name').limit(200);
    if(r.error)throw r.error;
    DP.properties=(r.data||[]).map(mapProperty);
  }else{
    const r=await client.from('property_access').select('access_role, properties(*, customers(*))').eq('user_id',DP.user.id);
    if(r.error)throw r.error;
    DP.properties=(r.data||[]).map(x=>mapProperty(x.properties)).filter(Boolean);
  }
  DP.propertyId=DP.propertyId||DP.properties[0]?.id||'';
}
function mapProperty(p){return p?{id:p.id,customer_id:p.customer_id,name:p.name||'Eiendom',customer:p.customers?.name||p.customer_name||'',customer_org_number:p.customers?.org_number||p.org_number||'',customer_invoice_address:p.customers?.invoice_address||p.invoice_address||'',customer_billing_email:p.customers?.billing_email||p.billing_email||'',customer_status:p.customers?.status||p.customer_status||'',address:p.address||'',type:p.property_type||'',status:p.status||'',sla:p.sla||'',gnr:p.gnr||'',bnr:p.bnr||'',built_year:p.built_year||'',units_count:p.units_count||0,gross_area:p.gross_area||0,technical_summary:p.technical_summary||'',access_role:p.access_role||'',subscription_plan:p.customers?.subscription_plan||p.subscription_plan||'',subscription_status:p.customers?.subscription_status||p.subscription_status||'',subscription_first_year_amount:p.customers?.subscription_first_year_amount||p.subscription_first_year_amount||0,subscription_year_two_amount:p.customers?.subscription_year_two_amount||p.subscription_year_two_amount||0,subscription_billing_period:p.customers?.subscription_billing_period||p.subscription_billing_period||''}:null}
async function refreshCurrentSubscription(){
  const p=currentProperty();
  if(!p?.customer_id)return;
  try{
    const r=await db().from('customers').select('subscription_plan,subscription_status,subscription_first_year_amount,subscription_year_two_amount,subscription_billing_period,status').eq('id',p.customer_id).maybeSingle();
    if(r.error||!r.data)return;
    Object.assign(p,{
      subscription_plan:r.data.subscription_plan||p.subscription_plan||'',
      subscription_status:r.data.subscription_status||p.subscription_status||r.data.status||'',
      subscription_first_year_amount:r.data.subscription_first_year_amount||p.subscription_first_year_amount||0,
      subscription_year_two_amount:r.data.subscription_year_two_amount||p.subscription_year_two_amount||0,
      subscription_billing_period:r.data.subscription_billing_period||p.subscription_billing_period||''
    });
  }catch(e){console.warn('Abonnement kunne ikke hentes',e)}
}
async function hydrateAll(){
  const p=currentProperty();if(!p)return;
  const client=db(),id=p.id,errors=[];
  await refreshCurrentSubscription();
  async function q(key,call){const r=await call();if(r.error){errors.push(customerError(r.error));DP.cache[key]=[]}else DP.cache[key]=r.data||[]}
  await q('contacts',async()=>{let r=await client.from('property_contacts').select('*').eq('property_id',id).order('created_at',{ascending:false});if(r.error&&/column|schema|cache|created_at/i.test(String(r.error.message||'')))r=await client.from('property_contacts').select('*').eq('property_id',id);return r});
  await q('deviations',()=>client.from('deviations').select('*').eq('property_id',id).order('created_at',{ascending:false}));
  await q('work_orders',()=>client.from('work_orders').select('*').eq('property_id',id).order('created_at',{ascending:false}));
  await q('documents',()=>client.from('documents').select('*').eq('property_id',id).order('created_at',{ascending:false}));
  await q('document_versions',()=>client.from('document_versions').select('*').eq('property_id',id).order('created_at',{ascending:false}));
  await q('buildings',()=>client.from('buildings').select('*').eq('property_id',id).order('name',{ascending:true}));
  await q('finance',()=>client.from('property_finance').select('*').eq('property_id',id).limit(1));
  await q('budget_lines',()=>client.from('budget_lines').select('*').eq('property_id',id).order('created_at',{ascending:false}));
  await q('projects',()=>client.from('projects').select('*').eq('property_id',id).order('created_at',{ascending:false}));
  await q('quote_requests',()=>client.from('quote_requests').select('*').eq('property_id',id).order('created_at',{ascending:false}));
  await q('offers',()=>client.from('offers').select('*, suppliers(name,email)').eq('property_id',id).order('created_at',{ascending:false}));
  await q('activity',()=>client.from('activity_log').select('*').eq('property_id',id).order('created_at',{ascending:false}).limit(80));
  const suppliers=await client.from('suppliers').select('*').order('name').limit(200);if(!suppliers.error)DP.suppliers=suppliers.data||[];
  if(errors.length)setStatus('Noen live-data kunne ikke hentes: '+errors[0],'warn');else setStatus('Live-data hentet.');
}


window.__dpAuthReady=true;


