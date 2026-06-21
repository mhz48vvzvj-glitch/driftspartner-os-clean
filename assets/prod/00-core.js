var DP={
  sb:{url:'https://oobljkqropvlcnbrcksh.supabase.co',key:'sb_publishable_4TpC7xmd2iDYPqOsM3CYNw_olG7vnVw'},
  session:null,user:null,properties:[],propertyId:'',suppliers:[],tab:'dashboard',module:'dashboard',cache:{},
  menus:[
    ['dashboard','Dashboard'],['property','Eiendom'],['people','Beboere/styre'],['cases','Avvik/arbeid'],
    ['documents','FDV/dokumenter'],['maintenance','Vedlikeholdsplan'],['finance','Økonomi'],['reports','Rapporter'],['market','Marked/tilbud'],['brain','Property Brain'],['integrations','Integrasjoner'],['admin','Kontroll']
  ]
};
const ROLE_MENUS={
  superadmin:['dashboard','property','people','cases','documents','maintenance','finance','reports','market','brain','integrations','admin'],
  forvalter:['dashboard','property','people','cases','documents','maintenance','finance','reports','market','brain','integrations','admin'],
  styreleder:['dashboard','property','people','cases','documents','maintenance','finance','reports','market','brain','integrations'],
  styremedlem:['dashboard','people','cases','documents','maintenance','finance','reports','brain'],
  vaktmester:['dashboard','cases','documents'],
  beboer:['cases'],
  leverandor:['market']
};
function appRole(){return String(DP.user?.role||'').toLowerCase()}
function canManageCustomers(){return appRole()==='superadmin'}
function subscriptionPlanId(){return String(currentProperty()?.subscription_plan||'').toLowerCase()}
function subscriptionAllowedMenus(){
  const plan=subscriptionPlanId();
  if(!plan)return ['dashboard','property','people','cases','documents'];
  if(plan==='start')return ['dashboard','property','people','cases','documents'];
  if(plan==='pro')return ['dashboard','property','people','cases','documents','maintenance','finance','reports','market','integrations'];
  if(plan==='premium')return DP.menus.map(m=>m[0]);
  return ['dashboard','property','people','cases','documents'];
}
function subscriptionHas(feature){
  const plan=subscriptionPlanId();
  if(!plan)return ['dashboard','property','people','cases','documents'].includes(feature);
  const allowed=subscriptionAllowedMenus();
  if(feature==='brain')return plan==='premium';
  if(feature==='rfq')return plan==='premium';
  if(feature==='finance')return ['pro','premium'].includes(plan);
  if(feature==='market')return ['pro','premium'].includes(plan);
  if(feature==='ai_director')return ['pro','premium'].includes(plan);
  if(feature==='work_orders')return ['pro','premium'].includes(plan);
  if(feature==='maintenance')return ['pro','premium'].includes(plan);
  if(feature==='reports')return ['pro','premium'].includes(plan);
  return allowed.includes(feature);
}
function visibleMenus(){
  const allowed=ROLE_MENUS[appRole()]||['dashboard'];
  const packageAllowed=subscriptionAllowedMenus();
  return DP.menus.filter(m=>allowed.includes(m[0])&&(packageAllowed.includes(m[0])||(m[0]==='admin'&&canManageCustomers())));
}
function canOpenModule(id){return visibleMenus().some(m=>m[0]===id)}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function money(v){return (Number(v)||0).toLocaleString('nb-NO')+' kr'}
function isUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v||''))}
function db(){if(!window.supabase)throw new Error('Datatilkoblingen er ikke klar. Last siden på nytt.');return window.supabase.createClient(DP.sb.url,DP.sb.key)}
async function readJsonResponse(res,fallback='Tjenesten svarte ikke riktig. Prøv igjen, eller kontakt Driftspartner Nord hvis feilen fortsetter.'){
  const contentType=res?.headers?.get?.('content-type')||'';
  const text=await res.text().catch(()=>'');
  if(!contentType.includes('application/json')){
    const snippet=text.replace(/\s+/g,' ').slice(0,220);
    console.warn('Non JSON response',res?.status,snippet);
    return {ok:false,message:fallback,status:res?.status||0};
  }
  try{return text?JSON.parse(text):{ok:false,message:fallback,status:res?.status||0}}
  catch(e){console.warn('Could not parse service response',e);return {ok:false,message:fallback,status:res?.status||0}}
}
function currentProperty(){return DP.properties.find(p=>p.id===DP.propertyId)||DP.properties[0]||null}
function requireLive(action='lagre'){if(!DP.session||!DP.user)throw new Error(`${action} krever innlogging.`);if(!isUuid(currentProperty()?.id))throw new Error(`${action} krever valgt live-eiendom.`)}
function customerError(error,fallback='Handlingen kunne ikke fullføres akkurat nå. Prøv igjen, eller kontakt Driftspartner Nord.'){
  const msg=String(error?.message||error||'').trim();
  console.error(error);
  if(!msg)return fallback;
  if(/supabase|service_role|property_access|row level|rls|policy|relation|column|schema|uuid|storage|bucket|invalid key|violates|foreign key|jwt|function|netlify|permission|not-null|null value/i.test(msg))return fallback;
  return msg;
}
function setOutputError(el,error,fallback){if(el)el.textContent=customerError(error,fallback)}
function showDrawer(title,html){
  let el=document.getElementById('drawer');
  if(!el)return;
  el.style.display='block';
  el.className='drawer show';
  el.setAttribute('tabindex','-1');
  el.innerHTML=`<button class="x" onclick="hideDrawer()">Lukk</button><h2>${esc(title)}</h2>${html}`;
  requestAnimationFrame(()=>{
    el.scrollIntoView({behavior:'smooth',block:'start'});
    const first=el.querySelector('input:not([readonly]),textarea,button.action.primary');
    if(first)first.focus({preventScroll:true});
  });
}
function closeTransientPanels(){
  document.querySelectorAll('.drawer').forEach(el=>{el.className='drawer';el.innerHTML='';el.style.display='none'});
}
function hideDrawer(){closeTransientPanels()}
function setStatus(text,kind=''){let el=document.getElementById('status');if(el){el.className='status '+kind;el.textContent=text}}
function showNotice(message,kind='ok'){
  setStatus(message,kind);
  let el=document.getElementById('dpNotice');
  if(!el){el=document.createElement('div');el.id='dpNotice';document.body.appendChild(el)}
  el.className='dp-notice '+kind;
  el.textContent=message;
  clearTimeout(DP.noticeTimer);
  DP.noticeTimer=setTimeout(()=>{if(el)el.className='dp-notice'},3600);
}
async function finishAction(message,module){
  hideDrawer();
  if(module&&canOpenModule(module))DP.module=module;
  try{await hydrateAll()}catch(e){console.warn('Oppdatering etter lagring feilet',e)}
  try{render()}catch(e){console.warn('Visning etter lagring feilet',e)}
  hideDrawer();
  showNotice(message||'Lagret.', 'ok');
  window.scrollTo({top:0,behavior:'smooth'});
}
function propSelect(){return `<select onchange="switchProperty(this.value)">${DP.properties.map(p=>`<option value="${p.id}" ${p.id===DP.propertyId?'selected':''}>${esc(p.name)}</option>`).join('')}</select>`}
function table(headers,rows,empty='Ingen data registrert.'){return `<table><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${rows.length?rows.join(''):`<tr><td colspan="${headers.length}">${esc(empty)}</td></tr>`}</table>`}
async function safe(label,fn){try{return await fn()}catch(e){console.warn(label,e);setStatus(customerError(e),'bad');return null}}
async function insertActivity(action,entity='activity',caseId='-'){
  try{if(!DP.session||!currentProperty())return;await db().from('activity_log').insert({property_id:currentProperty().id,action,entity_type:entity,metadata:{caseId,actor:DP.user.email}})}catch(e){}
}
function renderShell(){
  document.body.classList.remove('public-mode');
  document.getElementById('userLabel').textContent=DP.user?`${DP.user.name||DP.user.email} - ${DP.user.role}`:'Ikke innlogget';
  document.getElementById('rolePill').textContent=DP.user?.role||'';
  const menus=visibleMenus();
  if(!canOpenModule(DP.module))DP.module=menus[0]?.[0]||'dashboard';
  document.getElementById('sideNav').innerHTML=menus.map(m=>`<button class="${DP.module===m[0]?'active':''}" onclick="openModule('${m[0]}')">${esc(m[1])}</button>`).join('')+`<button onclick="logout()">Logg ut</button>`;
  document.getElementById('userSelect').innerHTML=`<option>${esc(DP.user?.email||'Innlogget')}</option>`;
  document.getElementById('propertyContext').innerHTML=DP.properties.length?`<div>${propSelect()}</div><button class="action" onclick="hydrateAll().then(render)">Hent live data</button>`:'<div class="output">Ingen eiendommer funnet for brukeren.</div>';
}
function openModule(id){
  if(!canOpenModule(id)){setStatus('Denne funksjonen er ikke tilgjengelig for valgt rolle eller pakke.','bad');return}
  DP.closePanelsOnRender=true;
  closeTransientPanels();
  DP.module=id;DP.tab='';render();closeTransientPanels();
}
async function switchProperty(id){
  DP.closePanelsOnRender=true;
  closeTransientPanels();
  DP.propertyId=id;
  await hydrateAll();
  render();
  showNotice('Eiendom byttet.','ok');
}
function render(){
  if(!DP.session){renderPublic();return}
  if(DP.closePanelsOnRender)closeTransientPanels();
  renderShell();
  const map={dashboard:DashboardPage,property:PropertyPage,people:PeoplePage,cases:CasesPage,documents:DocumentsPage,maintenance:MaintenancePage,finance:FinancePage,reports:ReportsPage,market:MarketPage,brain:PropertyBrainPage,integrations:IntegrationsPage,admin:AdminPage};
  document.getElementById('title').textContent=(DP.menus.find(m=>m[0]===DP.module)||['','Dashboard'])[1];
  document.getElementById('tabs').innerHTML='';
  document.getElementById('content').innerHTML=(map[DP.module]||DashboardPage)();
  if(DP.closePanelsOnRender){closeTransientPanels();DP.closePanelsOnRender=false}
}
function renderPublic(){
  document.body.classList.add('public-mode');
  document.getElementById('title').textContent='Driftspartner OS';
  document.getElementById('propertyContext').innerHTML='';
  document.getElementById('tabs').innerHTML='';
  document.getElementById('sideNav').innerHTML='';
  document.getElementById('userSelect').innerHTML='';
  document.getElementById('userLabel').textContent='Ikke innlogget';
  document.getElementById('rolePill').textContent='Produksjon';
  document.getElementById('content').innerHTML=LandingPage();
}
function publicLoginPanel(){
  const ready=window.supabase?'Appen er klar for innlogging.':'Appen mangler en nødvendig tilkobling. Last siden på nytt.';
  return "<div class=\"dp-login\"><h2>Logg inn</h2><p>For styre, forvalter, vaktmester, leverandør og beboer.</p><label>E-post</label><input id=\"loginEmail\" autocomplete=\"username\" value=\"\"><label>Passord</label><input id=\"loginPassword\" type=\"password\" autocomplete=\"current-password\"><button class=\"action primary\" data-login-submit type=\"button\" onclick=\"login()\">Logg inn</button><button class=\"action\" data-login-test type=\"button\" onclick=\"testLoginConnection()\">Test kobling</button><button class=\"action\" type=\"button\" onclick=\"resumeSession()\">Fortsett eksisterende økt</button><button class=\"action red\" type=\"button\" onclick=\"logout()\">Logg ut av lagret økt</button><div id=\"loginOut\" class=\"output\">"+ready+"</div></div>";
}
function demoPanel(){
  return "<div class=\"dp-login\"><h2>Book demo</h2><p>Send en forespørsel til Driftspartner Nord, så tar vi kontakt.</p><label>Navn</label><input id=\"demoName\" autocomplete=\"name\"><label>E-post</label><input id=\"demoEmail\" autocomplete=\"email\"><label>Telefon</label><input id=\"demoPhone\" autocomplete=\"tel\"><label>Sameie/borettslag</label><input id=\"demoOrg\"><label>Melding</label><textarea id=\"demoMessage\" placeholder=\"Fortell kort hva dere vil se på demoen\"></textarea><button class=\"action primary\" type=\"button\" onclick=\"sendDemoRequest()\">Send demoforespørsel</button><button class=\"action\" type=\"button\" onclick=\"showLogin()\">Logg inn i stedet</button><div id=\"demoOut\" class=\"output\">Klar til sending.</div></div>";
}
function showDemoForm(){showDrawer('Book demo',demoPanel())}
function openDemoMailFallback(message,out){
  const subject=encodeURIComponent('Demoforespørsel fra Driftspartner OS');
  const body=encodeURIComponent(message);
  window.location.href='mailto:post@driftspartnernord.no?subject='+subject+'&body='+body;
  if(out)out.textContent='E-postfunksjonen er ikke tilgjengelig her. E-postklient er åpnet med ferdig utfylt demoforespørsel.';
}
async function sendDemoRequest(){
  const out=document.getElementById('demoOut');
  const name=document.getElementById('demoName')?.value.trim()||'';
  const email=document.getElementById('demoEmail')?.value.trim()||'';
  const phone=document.getElementById('demoPhone')?.value.trim()||'';
  const org=document.getElementById('demoOrg')?.value.trim()||'';
  const msg=document.getElementById('demoMessage')?.value.trim()||'';
  try{
    if(out)out.textContent='Sender demoforespørsel...';
    if(!name||!email)throw new Error('Fyll inn navn og e-post.');
    const message='Ny demoforespørsel fra Driftspartner OS\n\nNavn: '+name+'\nE-post: '+email+'\nTelefon: '+(phone||'-')+'\nSameie/borettslag: '+(org||'-')+'\n\nMelding:\n'+(msg||'-')+'\n\nKilde: '+location.href;
    if(location.hostname==='localhost'||location.hostname==='127.0.0.1'||location.protocol==='file:'){
      openDemoMailFallback(message,out);
      return;
    }
    const res=await fetch('/.netlify/functions/send-email',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({to:'post@driftspartnernord.no',subject:'Demoforespørsel fra Driftspartner OS',message,kind:'demo-request',property:'public'})});
    const contentType=res.headers.get('content-type')||'';
    if(!contentType.includes('application/json')){
      openDemoMailFallback(message,out);
      return;
    }
    const data=await readJsonResponse(res,'E-postfunksjonen svarte ikke riktig. Prøv igjen, eller kontakt Driftspartner Nord hvis feilen fortsetter.');
    if(!res.ok||!data.ok)throw new Error(data.message||'E-post ble ikke sendt.');
    hideDrawer();showNotice('Demoforespørsel er sendt. Vi tar kontakt.','ok');
  }catch(e){setOutputError(out,e,'Sendingen kunne ikke fullføres akkurat nå. Prøv igjen, eller kontakt Driftspartner Nord.');}
}
function purchasePanel(plan){
  const prices={Start:'9 990 kr første år',Pro:'19 990 kr første år',Premium:'39 990 kr første år'};
  return "<div class=\"dp-login\"><h2>Bestill "+esc(plan)+"</h2><p>Send inn bestilling, så kontakter Driftspartner Nord dere for oppstart, avtale og fakturagrunnlag.</p><label>Valgt pakke</label><input id=\"buyPlan\" value=\""+esc(plan)+" - "+esc(prices[plan]||'')+"\" readonly><label>Sameie/borettslag</label><input id=\"buyOrg\" autocomplete=\"organization\"><label>Org.nr</label><input id=\"buyOrgNo\"><label>Antall enheter</label><input id=\"buyUnits\" type=\"number\" min=\"1\"><label>Kontaktperson</label><input id=\"buyName\" autocomplete=\"name\"><label>E-post</label><input id=\"buyEmail\" autocomplete=\"email\"><label>Telefon</label><input id=\"buyPhone\" autocomplete=\"tel\"><label>Kommentar</label><textarea id=\"buyMessage\" placeholder=\"Eventuell ønsket oppstartsdato eller praktisk informasjon\"></textarea><button class=\"action primary\" type=\"button\" onclick=\"sendPurchaseRequest()\">Send bestilling</button><button class=\"action\" type=\"button\" onclick=\"showDemoForm()\">Book demo i stedet</button><div id=\"buyOut\" class=\"output\">Klar til bestilling.</div></div>";
}
function showPurchaseForm(plan){showDrawer('Bestill '+plan,purchasePanel(plan))}
function openPurchaseMailFallback(message,out){
  const subject=encodeURIComponent('Bestilling Driftspartner OS');
  const body=encodeURIComponent(message);
  window.location.href='mailto:post@driftspartnernord.no?subject='+subject+'&body='+body;
  if(out)out.textContent='E-postfunksjonen er ikke tilgjengelig her. E-postklient er åpnet med ferdig utfylt bestilling.';
}
async function sendPurchaseRequest(){
  const out=document.getElementById('buyOut');
  const plan=document.getElementById('buyPlan')?.value.trim()||'';
  const org=document.getElementById('buyOrg')?.value.trim()||'';
  const orgNo=document.getElementById('buyOrgNo')?.value.trim()||'';
  const units=document.getElementById('buyUnits')?.value.trim()||'';
  const name=document.getElementById('buyName')?.value.trim()||'';
  const email=document.getElementById('buyEmail')?.value.trim()||'';
  const phone=document.getElementById('buyPhone')?.value.trim()||'';
  const note=document.getElementById('buyMessage')?.value.trim()||'';
  try{
    if(out)out.textContent='Sender bestilling...';
    if(!org||!name||!email)throw new Error('Fyll inn sameie/borettslag, kontaktperson og e-post.');
    const message='Ny bestilling av Driftspartner OS\n\nPakke: '+plan+'\nSameie/borettslag: '+org+'\nOrg.nr: '+(orgNo||'-')+'\nAntall enheter: '+(units||'-')+'\nKontaktperson: '+name+'\nE-post: '+email+'\nTelefon: '+(phone||'-')+'\n\nKommentar:\n'+(note||'-')+'\n\nKilde: '+location.href;
    if(location.hostname==='localhost'||location.hostname==='127.0.0.1'||location.protocol==='file:'){
      openPurchaseMailFallback(message,out);
      return;
    }
    const res=await fetch('/.netlify/functions/send-email',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({to:'post@driftspartnernord.no',subject:'Bestilling Driftspartner OS - '+plan,message,kind:'purchase-request',property:'public'})});
    const contentType=res.headers.get('content-type')||'';
    if(!contentType.includes('application/json')){
      openPurchaseMailFallback(message,out);
      return;
    }
    const data=await readJsonResponse(res,'E-postfunksjonen svarte ikke riktig. Prøv igjen, eller kontakt Driftspartner Nord hvis feilen fortsetter.');
    if(!res.ok||!data.ok)throw new Error(data.message||'Bestilling ble ikke sendt.');
    hideDrawer();showNotice('Bestilling er sendt. Vi tar kontakt for oppstart.','ok');
  }catch(e){setOutputError(out,e,'Sendingen kunne ikke fullføres akkurat nå. Prøv igjen, eller kontakt Driftspartner Nord.');}
}
function LandingPage(){
  return "<section class=\"dp-landing\"><nav class=\"dp-nav\"><div class=\"dp-brand\"><img class=\"dp-logo-img\" src=\"assets/logo-os.jpg\" alt=\"Driftspartner Nord logo\"><span>Driftspartner OS</span></div><div class=\"dp-links\"><button type=\"button\" onclick=\"document.getElementById('features')?.scrollIntoView({behavior:'smooth'})\">Funksjoner</button><button type=\"button\" onclick=\"document.getElementById('packages')?.scrollIntoView({behavior:'smooth'})\">Pakker</button><button type=\"button\" onclick=\"document.getElementById('customers')?.scrollIntoView({behavior:'smooth'})\">Kunder</button><button type=\"button\" onclick=\"location.href='kommersielt.html'\">Kommersielt</button><button type=\"button\" onclick=\"document.getElementById('cta')?.scrollIntoView({behavior:'smooth'})\">Om oss</button><button type=\"button\" onclick=\"location.href='kommersielt.html#vilkar'\">Vilkår</button></div><div class=\"dp-nav-actions\"><button class=\"dp-nav-login\" type=\"button\" onclick=\"showLogin()\">Logg inn</button><button class=\"dp-primary\" type=\"button\" onclick=\"showDemoForm()\">Book demo</button></div></nav><div class=\"dp-hero\"><div class=\"dp-copy\"><span class=\"dp-eyebrow\">Alt du trenger - samlet på ett sted</span><h1>Full kontroll på eiendommen.<span>Samlet i en plattform.</span></h1><p>FDV, avvik, vedlikehold, dokumentasjon og styrearbeid samlet på ett sted. Mindre administrasjon, bedre kontroll og tryggere drift.</p><div class=\"dp-actions\"><button class=\"dp-primary\" type=\"button\" onclick=\"showDemoForm()\">Book en gratis demo</button></div><div class=\"dp-mini\"><div><i></i>Enkelt å ta i bruk</div><div><i></i>Sparer tid</div><div><i></i>Trygg og sikker</div><div><i></i>Alt i skyen</div></div></div><div class=\"dp-product\" aria-hidden=\"true\"><div class=\"dp-laptop\"><div class=\"dp-screen\"><div class=\"dp-screen-side\"><b>Driftspartner OS</b><span>Oversikt</span><span>Avvik</span><span>Vedlikehold</span><span>Dokumenter</span><span>Styreportal</span></div><div class=\"dp-screen-main\"><h3>Oversikt</h3><div class=\"dp-metrics\"><div class=\"dp-metric\"><small>Åpne avvik</small><strong>23</strong></div><div class=\"dp-metric\"><small>Planlagte oppgaver</small><strong>12</strong></div><div class=\"dp-metric\"><small>Kostnader i år</small><strong>1 248 000</strong></div><div class=\"dp-metric\"><small>Tilstandscore</small><strong>85</strong></div></div><div class=\"dp-dashgrid\"><div class=\"dp-list\"><p><span>Vannlekkasje i kjeller</span><b>Høy</b></p><p><span>Defekt belysning</span><b>Avtales</b></p><p><span>Dørpumpe virker ikke</span><b>Lav</b></p></div><div class=\"dp-chart\"><div class=\"dp-line\"></div></div></div></div></div></div><div class=\"dp-phone\"><h4>Avvik</h4><div class=\"dp-phone-img\"></div><p>Vannlekkasje i kjeller</p><p>Status: Under behandling</p></div></div></div><div id=\"features\" class=\"dp-panel\"><h2>Derfor velger styrene Driftspartner OS</h2><div class=\"dp-benefits\"><div class=\"dp-benefit\"><div class=\"ico\">Tid</div><h3>Spar tid</h3><p>Mindre administrasjon og færre manuelle oppgaver.</p></div><div class=\"dp-benefit\"><div class=\"ico\">OK</div><h3>Reduser risiko</h3><p>Alt dokumenteres og lagres på ett sted.</p></div><div class=\"dp-benefit\"><div class=\"ico\">Data</div><h3>Få bedre kontroll</h3><p>Se hva som må gjøres, når det må gjøres og hva det vil koste.</p></div><div class=\"dp-benefit\"><div class=\"ico\">Arkiv</div><h3>Sikre historikken</h3><p>All kunnskap følger eiendommen - ikke enkeltpersoner.</p></div></div><h2 id=\"packages\" class=\"dp-pricing-title\">Velg pakken som passer deres behov</h2><div class=\"dp-prices\"><div class=\"dp-price\"><div class=\"dp-plan-head\"><div class=\"dp-plan-icon\">Start</div><div><h3>Start</h3><small>For mindre sameier og borettslag.</small></div></div><b>990 <small>kr/mnd</small></b><small>Faktureres årlig</small><ul><li>FDV-arkiv</li><li>Dokumenthåndtering</li><li>Avvikshåndtering</li><li>Basisanbefalinger</li><li>Styreportal</li><li>Mobiltilgang</li></ul><p class=\"fit\">Passer for <span>opptil 20 enheter</span></p><button class=\"dp-secondary\" type=\"button\" data-purchase-plan=\"Start\">Kom i gang</button></div><div class=\"dp-price featured\"><div class=\"dp-ribbon\">Mest valgt</div><div class=\"dp-plan-head\"><div class=\"dp-plan-icon\">Pro</div><div><h3>Pro</h3><small>For de fleste sameier og borettslag.</small></div></div><b>1 990 <small>kr/mnd</small></b><small>Faktureres årlig</small><ul><li>AI Director</li><li>Vedlikeholdsplan</li><li>Arbeidsordre</li><li>Leverandørregister</li><li>Budsjettoversikt</li><li>Avansert rapportering</li><li>Ubegrenset antall styremedlemmer</li></ul><p class=\"fit\">Passer for <span>20-100 enheter</span></p><button class=\"dp-primary\" type=\"button\" data-purchase-plan=\"Pro\">Kom i gang</button></div><div class=\"dp-price premium\"><div class=\"dp-plan-head\"><div class=\"dp-plan-icon\">Premium</div><div><h3>Premium</h3><small>For større borettslag og profesjonelle aktører.</small></div></div><b>3 990 <small>kr/mnd</small></b><small>Faktureres årlig</small><ul><li>Property Brain AI</li><li>Risikoanalyse</li><li>Tilbudsinnhenting</li><li>Flere eiendommer</li><li>Prioritert support</li><li>Avanserte analyser</li></ul><p class=\"fit\">Passer for <span>100+ enheter</span></p><button class=\"dp-secondary\" type=\"button\" data-purchase-plan=\"Premium\">Kom i gang</button></div></div><div id=\"steps\" class=\"dp-steps\"><div class=\"dp-step\"><div class=\"ico\">1</div><h3><b>1</b>Opprett konto</h3><p>Registrer sameiet eller borettslaget på få minutter.</p></div><div class=\"dp-step\"><div class=\"ico\">2</div><h3><b>2</b>Last opp dokumenter</h3><p>FDV, tegninger, rapporter og historikk samles automatisk.</p></div><div class=\"dp-step\"><div class=\"ico\">AI</div><h3><b>3</b>Få full oversikt</h3><p>AI Director analyserer eiendommen og viser hva som bør prioriteres.</p></div><div class=\"dp-step\"><div class=\"ico\">4</div><h3><b>4</b>Drift smartere</h3><p>Håndter avvik, vedlikehold og styrearbeid fra en plattform.</p></div></div><div id=\"cta\" class=\"dp-cta\"><div><h2>Klar for å få kontroll</h2><p>Book en gratis demonstrasjon og se hvordan Driftspartner OS kan gi styret full kontroll over drift, vedlikehold og dokumentasjon.</p></div><div><button class=\"dp-primary\" type=\"button\" onclick=\"showDemoForm()\">Book en demo</button></div><div class=\"dp-building\"></div></div></div></section>";
}
function publicLanding(){
  const plans=[
    ['Start','9 990 kr','990 kr/mnd','For mindre sameier og borettslag','FDV-arkiv|Dokumenthåndtering|Avvikshåndtering|Basisanbefalinger|Styreportal|Mobiltilgang','opptil 20 enheter','dp-secondary'],
    ['Pro','19 990 kr','1 990 kr/mnd','For de fleste sameier og borettslag','Alt i Start|AI Director|Vedlikeholdsplan|Arbeidsordre|Leverandørregister|Budsjettoversikt|Avansert rapportering|Ubegrenset antall styremedlemmer','20-100 enheter','dp-primary'],
    ['Premium','39 990 kr','3 990 kr/mnd','For større borettslag og profesjonelle eiendomsaktører','Alt i Pro|Property Brain AI|Risikoanalyse|Tilbudsinnhenting (RFQ)|Flere eiendommer|Prioritert support|Avanserte analyser','100+ enheter','dp-secondary']
  ];
  const priceCards=plans.map(p=>`<div class="dp-price ${p[0]==='Pro'?'featured':''} ${p[0]==='Premium'?'premium':''}">${p[0]==='Pro'?'<div class="dp-ribbon">Mest valgt</div>':''}<div class="dp-plan-head"><div class="dp-plan-icon">${esc(p[0])}</div><div><h3>${esc(p[0])}</h3><small>${esc(p[3])}</small></div></div><b>${esc(p[1])} <small>første år</small></b><small>${esc(p[2])} · faktureres årlig. År 2 faktureres for 12 måneder.</small><ul>${p[4].split('|').map(i=>`<li>${esc(i)}</li>`).join('')}</ul><p class="fit">Passer for <span>${esc(p[5])}</span></p><button class="${esc(p[6])}" type="button" data-purchase-plan="${esc(p[0])}">Kom i gang</button></div>`).join('');
  return `<section class="dp-landing refined-landing"><nav class="dp-nav"><div class="dp-brand"><img class="dp-logo-img" src="assets/logo-os.jpg" alt="Driftspartner Nord logo"><span>Driftspartner OS</span></div><div class="dp-links"><button type="button" onclick="document.getElementById('features')?.scrollIntoView({behavior:'smooth'})">Funksjoner</button><button type="button" onclick="document.getElementById('packages')?.scrollIntoView({behavior:'smooth'})">Pakker</button><button type="button" onclick="document.getElementById('customers')?.scrollIntoView({behavior:'smooth'})">Kunder</button><button type="button" onclick="document.getElementById('steps')?.scrollIntoView({behavior:'smooth'})">Oppstart</button><button type="button" onclick="location.href='kommersielt.html'">Kommersielt</button></div><div class="dp-nav-actions"><button class="dp-nav-login" type="button" onclick="showLogin()">Logg inn</button><button class="dp-primary" type="button" onclick="showDemoForm()">Book demo</button></div></nav><div class="dp-hero"><div class="dp-copy"><span class="dp-eyebrow">FDV · avvik · arbeidsordre · styre · økonomi</span><h1>Full kontroll på eiendommen.<span>Samlet i én plattform.</span></h1><p>Driftspartner OS samler dokumentasjon, driftssaker, leverandører, styrearbeid og økonomi på ett sted for sameier og borettslag.</p><div class="dp-actions"><button class="dp-primary" type="button" onclick="showDemoForm()">Book demo</button><button class="dp-secondary" type="button" onclick="document.getElementById('packages')?.scrollIntoView({behavior:'smooth'})">Se pakker</button></div><div class="dp-mini"><div><i></i>Live eiendomsdata</div><div><i></i>Rollebasert tilgang</div><div><i></i>Dokumentert historikk</div><div><i></i>AI-anbefalinger</div></div></div><div class="dp-product" aria-hidden="true"><div class="dp-laptop"><div class="dp-screen"><div class="dp-screen-side"><b>Driftspartner OS</b><span>Dashboard</span><span>Avvik</span><span>FDV</span><span>Økonomi</span><span>Property Brain</span></div><div class="dp-screen-main"><h3>Styrets oversikt</h3><div class="dp-metrics"><div class="dp-metric"><small>Åpne avvik</small><strong>4</strong></div><div class="dp-metric"><small>Arbeidsordre</small><strong>8</strong></div><div class="dp-metric"><small>Budsjettstatus</small><strong>OK</strong></div><div class="dp-metric"><small>Tilstandscore</small><strong>85</strong></div></div><div class="dp-dashgrid"><div class="dp-list"><p><span>Tak/VVS må følges opp</span><b>Høy</b></p><p><span>FDV mangler kontrakt</span><b>Dok.</b></p><p><span>Styret må godkjenne tilbud</span><b>Beslutning</b></p></div><div class="dp-chart"><div class="dp-line"></div></div></div></div></div></div><div class="dp-phone"><h4>Avvik</h4><div class="dp-phone-img"></div><p>Registrer sak fra mobil</p><p>Status: Under behandling</p></div></div></div><div class="dp-proof"><div><strong>Én eiendom</strong><span>All historikk samlet</span></div><div><strong>Alle roller</strong><span>Styre, beboer, vaktmester og leverandør</span></div><div><strong>Live data</strong><span>Dashboard uten demo-tall etter innlogging</span></div></div><div id="features" class="dp-panel"><h2>Hva systemet løser</h2><div class="dp-module-grid"><section><h3>FDV og dokumentarkiv</h3><p>FDV, HMS, tegninger, kontrakter, bilder og tilbud lagres per eiendom.</p></section><section><h3>Avvik og arbeidsordre</h3><p>Registrer avvik, tildel ansvar, send e-post og følg status.</p></section><section><h3>Styre og beboere</h3><p>Styreoversikt, beboere, roller, innkalling, saker og historikk.</p></section><section><h3>Marked og tilbud</h3><p>RFQ, leverandører, tilbudsopplasting, vurdering og tildeling.</p></section><section><h3>Økonomi</h3><p>Konto, reservefond, budsjett, prosjektøkonomi og styrerapport.</p></section><section><h3>Property Brain</h3><p>Risiko, dokumentasjonsgrad, anbefalt neste handling og beslutningspunkter.</p></section></div><h2 id="packages" class="dp-pricing-title">Velg pakken som passer deres behov</h2><div class="dp-prices">${priceCards}</div><div id="steps" class="dp-steps"><div class="dp-step"><div class="ico">1</div><h3><b>1</b>Kartlegging</h3><p>Eiendom, bygg, FDV, roller og behov avklares.</p></div><div class="dp-step"><div class="ico">2</div><h3><b>2</b>Oppsett</h3><p>Kunde, eiendom, styre, beboere, leverandører og mapper opprettes.</p></div><div class="dp-step"><div class="ico">3</div><h3><b>3</b>Pilot</h3><p>Avvik, dokumenter, e-post, tilbud og økonomi testes på én eiendom.</p></div><div class="dp-step"><div class="ico">4</div><h3><b>4</b>Drift</h3><p>Dashboard, rapporter og Property Brain brukes i styrearbeidet.</p></div></div><div id="customers" class="dp-customer-grid"><section><h3>For styret</h3><p>Oversikt over status, risiko, økonomi og hva som må besluttes.</p><button class="dp-secondary" type="button" onclick="showDemoForm()">Book styredemo</button></section><section><h3>For drift og vaktmester</h3><p>Arbeidsordre, avvik, vedlegg, frister og dokumentasjon samlet.</p><button class="dp-secondary" type="button" onclick="showDemoForm()">Be om gjennomgang</button></section><section><h3>For leverandører</h3><p>Tilbud, oppdrag, PDF-er, pris, forbehold og kommunikasjon knyttes til riktig sak.</p><button class="dp-secondary" type="button" onclick="showDemoForm()">Kontakt oss</button></section></div><div id="cta" class="dp-cta"><div><h2>Klar for å få kontroll</h2><p>Book en demonstrasjon og se hvordan Driftspartner OS kan gi styret bedre kontroll over drift, vedlikehold og dokumentasjon.</p></div><div><button class="dp-primary" type="button" onclick="showDemoForm()">Book demo</button></div><div class="dp-building"></div></div></div></section>`;
}
function LandingPage(){return publicLanding()}
function showLogin(){showDrawer('Logg inn',publicLoginPanel())}
document.addEventListener('click',e=>{
  if(e.target.closest('#sideNav button,.side button')){
    closeTransientPanels();
  }
  if(e.target.closest('[data-login-submit]'))login();
  if(e.target.closest('[data-login-test]'))testLoginConnection();
  const purchaseButton=e.target.closest('[data-purchase-plan]');
  if(purchaseButton){e.preventDefault();showPurchaseForm(purchaseButton.dataset.purchasePlan||'Pro');}
});
document.addEventListener('pointerdown',e=>{
  if(e.target.closest('#sideNav button,.side button')){
    closeTransientPanels();
  }
},true);
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&(e.target?.id==='loginEmail'||e.target?.id==='loginPassword'))login();
});




window.DP=DP;
window.renderPublic=renderPublic;
window.render=render;
window.openModule=openModule;
window.hideDrawer=hideDrawer;
window.showDrawer=showDrawer;
window.showDemoForm=showDemoForm;
window.sendDemoRequest=sendDemoRequest;
window.showPurchaseForm=showPurchaseForm;
window.sendPurchaseRequest=sendPurchaseRequest;
window.setStatus=setStatus;
window.__dpCoreReady=true;





