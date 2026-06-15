/* Driftspartner OS module: 00-core-state.js
   Generated from driftspartner-property-os.js. Keep classic script order in HTML. */
const state={
  isLoggedIn:false,
  supabase:{url:'https://oobljkqropvlcnbrcksh.supabase.co',key:'sb_publishable_4TpC7xmd2iDYPqOsM3CYNw_olG7vnVw'},
  currentUser:'public-user',
  selectedProperty:'',
  users:[
    {id:'public-user',name:'Ikke innlogget',email:'',phone:'',role:'public',org:'Driftspartner OS',properties:[]}
  ],
  properties:[],
  suppliers:[]
};

const roleMenus={
  superadmin:['home','property','operations','finance','board','ai','market','portal','cloud','admin'],
  styreleder:['home','property','finance','board','cloud'],
  vaktmester:['home','property','operations','portal'],
  leverandør:['home','market','portal']
};
const menuLabels={home:'Start',property:'Eiendom',operations:'Drift',finance:'Økonomi',board:'Styre',ai:'AI Director',market:'Marked',portal:'Portaler',cloud:'Property Brain',admin:'Admin'};
const menuIcons={home:'home',property:'building',operations:'tool',finance:'wallet',board:'landmark',ai:'bot',market:'cart',portal:'users',cloud:'brain',admin:'settings'};
function Icon(name){let p={home:'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',building:'M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M8 7h1M12 7h1M8 11h1M12 11h1M8 15h1M12 15h1M3 21h18',tool:'M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-3 3-3-3z',wallet:'M3 7h15a3 3 0 0 1 3 3v8H5a2 2 0 0 1-2-2zM3 7a2 2 0 0 1 2-2h13v4M17 13h2',landmark:'M3 21h18M5 10h14M6 18V10M10 18V10M14 18V10M18 18V10M12 3l8 5H4z',bot:'M12 8V4M8 4h8M6 12h12v7H6zM9 15h.01M15 15h.01M4 14H2M22 14h-2',cart:'M6 6h15l-2 8H8L6 3H3M9 20h.01M18 20h.01',users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',brain:'M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0-2 5 3 3 0 0 0 2 5v1a3 3 0 0 0 5 2M15 3a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5 3 3 0 0 1-2 5v1a3 3 0 0 1-5 2M12 4v16',settings:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.5-.2-.1a1.7 1.7 0 0 0-1.9.3l-.2.1-4 0-.2-.1a1.7 1.7 0 0 0-1.9-.3l-.2.1-2-3.5.1-.1a1.7 1.7 0 0 0 .3-1.9l-.1-.2-2-3.5.1-.2a1.7 1.7 0 0 0 0-2l-.1-.2 2-3.5.2.1a1.7 1.7 0 0 0 1.9-.3l.2-.1h4l.2.1a1.7 1.7 0 0 0 1.9.3l.2-.1 2 3.5-.1.2a1.7 1.7 0 0 0 0 2l.1.2z',file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',alert:'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',calendar:'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2z',briefcase:'M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1M3 7h18v12H3zM3 12h18',plus:'M12 5v14M5 12h14',mail:'M4 4h16v16H4zM4 7l8 6 8-6',chart:'M4 19V5M4 19h16M8 15l3-4 3 2 4-7',check:'M20 6 9 17l-5-5',bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4'}[name]||'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6';return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${p}"/></svg>`}
function user(){return state.users.find(u=>u.id===state.currentUser)}
function allowedProperties(){let u=user();return u.role==='superadmin'?state.properties:state.properties.filter(p=>u.properties.includes(p.id))}
function property(){return allowedProperties().find(p=>p.id===state.selectedProperty)||allowedProperties()[0]}
function money(v){return v.toLocaleString('nb-NO')+' kr'}
function canCreateProperty(){return user().role==='superadmin'}
function ensurePropertyData(p){
  p.orgnr=p.orgnr||'';p.invoiceAddress=p.invoiceAddress||p.address;p.manager=p.manager||'';p.sla=p.sla||'';p.paymentStatus=p.paymentStatus||'';p.boardMembers=p.boardMembers||[];p.agreements=p.agreements||[];
  if(typeof p.boardMembers[0]==='string')p.boardMembers=[
    {name:p.contact||'Kontaktperson',role:'Styreleder',email:p.email||'',phone:p.phone||'',notes:'Primærkontakt'}
  ];
  p.documents=p.documents||[];
  p.activity=p.activity||[];
  p.offers=p.offers||[];
  p.workOrders=p.workOrders||[];
  p.invoiceBasis=p.invoiceBasis||[];
  p.drawings=p.drawings||[];
  p.hmsLists=p.hmsLists||[];
  p.caseFlow=p.caseFlow||[];
  return p;
}
function logActivity(action,caseId='-'){let p=ensurePropertyData(property());p.activity.unshift({time:new Date().toLocaleString('nb-NO'),actor:user().name,action,caseId});saveActivityLogToSupabase(action,caseId).catch(()=>{})}
async function saveActivityLogToSupabase(action,caseId='-',entityType='test'){try{let db=supabaseClient(),p=property();await db.from('activity_log').insert({property_id:p.id,action,entity_type:entityType,metadata:{caseId,actor:user().name,role:user().role}})}catch(e){}}
function addDocument(type,name,status='Arkivert'){let p=ensurePropertyData(property());p.documents.unshift({type,name,status});logActivity(`${type} lagt i dokumentarkiv`,name)}
function renderRoleMenu(){let allowed=roleMenus[user().role]||roleMenus.superadmin;document.getElementById('sideNav').innerHTML=allowed.map((id,i)=>`<button class="${id===current?'active':''}" onclick="openMain('${id}',this)"><span class="nav-ico">${Icon(menuIcons[id])}</span>${menuLabels[id]}</button>`).join('')}
function renderUserSelect(){let s=document.getElementById('userSelect');s.innerHTML=state.users.map(u=>`<option value="${u.id}" ${u.id===state.currentUser?'selected':''}>${u.name}</option>`).join('')}
function renderPropertyContext(){
  let p=property(), u=user();
  state.selectedProperty=p.id;
  document.getElementById('userLabel').textContent=`${u.name} · ${u.org}`;
  document.getElementById('rolePill').textContent=u.role;
  document.getElementById('subtitle').textContent=`Aktiv eiendom: ${p.name}`;
  document.getElementById('propertyContext').innerHTML=`<div><select id="propertySelect" onchange="switchProperty(this.value)">${allowedProperties().map(x=>`<option value="${x.id}" ${x.id===p.id?'selected':''}>${x.name}</option>`).join('')}</select></div><div class="top-search"><input placeholder="Søk i eiendom, saker, dokumenter..." onkeydown="if(event.key==='Enter')act('Søk kjørt i '+property().name)"></div><button class="action notify" onclick="openTabSafe('Varsler')">${Icon('bell')}Varsler</button><button class="action" onclick="showDrawer('Hjelp','<div class=output>Velg eiendom, bruk hurtighandlinger eller spør AI Director nederst.</div>')">Hjelp</button><div class="profile"><div class="avatar">${u.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div><div><strong>${u.name}</strong><small>${u.role}</small></div></div>`;
}
function openTabSafe(name){if(app[current].tabs[name])openTab(name);else showDrawer(name,alertsPanel())}
function refresh(){if(!state.isLoggedIn){renderPublic();return}let allowed=roleMenus[user().role]||roleMenus.superadmin;if(!allowed.includes(current))current=allowed[0];document.body.classList.remove('public-mode');renderUserSelect();renderRoleMenu();renderPropertyContext();renderTabs();openTab(Object.keys(app[current].tabs)[0])}
function switchUser(id){state.currentUser=id;let props=allowedProperties();state.selectedProperty=props[0]?.id;current=(roleMenus[user().role]||roleMenus.superadmin)[0];refresh();act('Tilgang byttet. Viser kun eiendommer og menyer brukeren har tilgang til.')}
function switchProperty(id){state.selectedProperty=id;renderPropertyContext();openTab(Object.keys(app[current].tabs)[0]);act('Valgt eiendom: '+property().name)}
function openWorkOrders(){if(!state.isLoggedIn){showLogin();return}current='operations';document.getElementById('title').textContent=app.operations.title;renderRoleMenu();renderPropertyContext();renderTabs();openTab('Arbeidsordre');act('Åpnet arbeidsordre for '+property().name)}
function renderPublic(){document.body.classList.add('public-mode','hide-tabs-home');document.getElementById('drawer').innerHTML='';document.getElementById('drawer').classList.remove('show');document.getElementById('content').innerHTML=SalesPage()}
function loginDisabled(){state.currentUser=document.getElementById('loginUser')?.value||'u-admin';state.isLoggedIn=true;let props=allowedProperties();state.selectedProperty=props[0]?.id;current='home';document.body.classList.remove('public-mode');refresh();act('Test åpnet. Du er nå inne i selve systemet.')}
function logoutApp(){state.isLoggedIn=false;current='home';renderPublic()}

function normalizeRole(role){return role==='leverandor'?'leverandør':role}
function showLogin(){showDrawer('Logg inn',`<div class="grid"><div class="card s12 login-box"><h3>Ekte innlogging</h3><label>E-post</label><input id="authEmail" value=""><label>Passord</label><input id="authPassword" type="password" value=""><button class="action primary" onclick="loginSupabase()">Logg inn med Supabase</button><div id="authOut" class="output">Bruker må finnes i Supabase Auth, app_users og property_access.</div></div></div>`)}
async function loginSupabase(){let out=document.getElementById('authOut');try{let db=supabaseClient(),email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value;let {data,error}=await db.auth.signInWithPassword({email,password});if(error)throw error;let {data:profile,error:profileError}=await db.from('app_users').select('*').eq('auth_user_id',data.user.id).single();if(profileError)throw profileError;state.currentUserRecord=profile;state.currentUser=profile.id;state.users=[{id:profile.id,name:profile.name,email:profile.email,phone:profile.phone||'',role:normalizeRole(profile.role),org:'Supabase',properties:[]}];await loadPropertiesForCurrentUser(db,profile);state.isLoggedIn=true;current='home';document.body.classList.remove('public-mode');refresh();act('Innlogget med Supabase')}catch(e){out.textContent='Innlogging feilet: '+e.message}}
async function loadPropertiesForCurrentUser(db,profile){if(normalizeRole(profile.role)==='superadmin'){let {data:allProps,error:allError}=await db.from('properties').select('*, customers(name)').limit(200);if(allError)throw allError;let props=(allProps||[]).map(mapSupabaseProperty);state.properties=props.length?props:state.properties;state.users[0].properties=state.properties.map(p=>p.id);state.selectedProperty=state.properties[0]?.id;await hydrateCurrentPropertyData(db);return}let {data,error}=await db.from('property_access').select('access_role, properties(*, customers(name))').eq('user_id',profile.id);if(error)throw error;let props=data.map(r=>mapSupabaseProperty(r.properties));state.properties=props.length?props:state.properties;state.users[0].properties=state.properties.map(p=>p.id);state.selectedProperty=state.properties[0]?.id;await hydrateCurrentPropertyData(db)}
async function logoutSupabase(){try{await supabaseClient().auth.signOut()}catch(e){}state.isLoggedIn=false;state.currentUser='u-admin';current='home';renderPublic()}
function logoutApp(){logoutSupabase()}
async function switchProperty(id){state.selectedProperty=id;try{await hydrateCurrentPropertyData()}catch(e){}renderPropertyContext();openTab(Object.keys(app[current].tabs)[0]);act('Valgt eiendom: '+property().name)}
