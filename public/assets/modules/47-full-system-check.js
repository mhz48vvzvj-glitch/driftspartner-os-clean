/* Driftspartner OS module: 47-full-system-check.js
   Full system check page and live write readiness helper.
   Source: 43-build-order-live-dashboard-checks.js:195-233
*/
};
function fullSystemCheckPage(){
  let p=property(),s=dpLiveDashboardStats(),errors=p.liveErrors||[];
  let rows=[
    ['Innlogging',!!state.currentUserRecord,'Ekte Supabase Auth kreves for live drift.'],
    ['Valgt eiendom',isUuid(p.id),'Må være Supabase UUID, ikke lokal data-ID.'],
    ['Dashboard live',!!p.liveCheckedAt&&!errors.length,errors.length?errors.join(' | '):`Sist hentet: ${p.liveCheckedAt||'ikke hentet'}`],
    ['Avvik',Array.isArray(p.deviations),'deviations'],
    ['Arbeidsordre',Array.isArray(p.workOrders),'work_orders'],
    ['Dokumenter',Array.isArray(p.documents),'documents + Storage'],
    ['Leverandører',(state.suppliers||[]).some(x=>x.email),'suppliers med e-post'],
    ['Tilbud/RFQ',Array.isArray(p.quoteRequests)&&Array.isArray(p.offers),'quote_requests + offers'],
    ['E-post',location.protocol!=='file:','Må testes på publisert Netlify-side med RESEND_API_KEY og RESEND_FROM.']
  ];
  return `<div class="grid"><div class="card s12"><div class="dash-title"><div><h3>Fullsjekk system</h3><p class="muted">Ærlig status for hva som er live, hva som feiler og hva som fortsatt er test.</p></div><button class="action primary" onclick="runFullSystemCheck()">Kjør fullsjekk</button></div><table><tr><th>Område</th><th>Status</th><th>Detalj</th></tr>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${r[1]?'<span class="badge ok">OK</span>':'<span class="badge bad">Feil/mangler</span>'}</td><td>${esc(r[2])}</td></tr>`).join('')}</table><div id="fullCheckOut" class="output">Trykk Kjør fullsjekk etter innlogging online.</div></div><div class="card s6"><h3>Dashboard-data</h3><table><tr><td>Åpne avvik</td><td>${s.openDevs}</td></tr><tr><td>Arbeidsordre</td><td>${s.openWos}</td></tr><tr><td>Dokumenter</td><td>${s.docs.length}</td></tr><tr><td>Tilbud/RFQ</td><td>${s.offers.length}/${s.rfqs.length}</td></tr><tr><td>Aktivitet</td><td>${s.activity.length}</td></tr></table></div><div class="card s6"><h3>Handlinger</h3><button class="action" onclick="hydrateDashboardNow()">Hent live dashboard-data</button><button class="action" onclick="showEmailFlow('general','FULLSJEKK')">Test e-postflyt</button><button class="action" onclick="openMain('admin',null);openTab('Lagringstest')">Lagringstest</button><button class="action" onclick="openMain('admin',null);openTab('Produksjonssjekk')">Produksjonssjekk</button></div></div>`;
}
async function runFullSystemCheck(){
  let out=document.getElementById('fullCheckOut'),lines=[];
  function line(ok,msg){lines.push(`${ok?'OK':'FEIL'} ${msg}`);out.textContent=lines.join('\n')}
  try{
    line(!!state.currentUserRecord,'Ekte innlogging');
    line(isUuid(property().id),'Valgt eiendom er Supabase UUID');
    if(state.currentUserRecord&&isUuid(property().id)){
      let p=await hydrateCurrentPropertyData(supabaseClient());
      (p.liveErrors||[]).forEach(e=>line(false,e));
      line(!(p.liveErrors||[]).length,'Live henting fullført');
    }
    line(location.protocol!=='file:','Netlify/e-post kan bare slutt-testes online');
    line(true,'Fullsjekk ferdig. Oppdater siden/fanen for oppdatert tabell.');
  }catch(e){line(false,e.message)}
}
app.admin.tabs['Fullsjekk']=()=>fullSystemCheckPage();
function dpLiveWriteReady(label='Denne handlingen'){
  if(!state.currentUserRecord){showDrawer('Krever ekte innlogging',`<div class="output">${esc(label)} skal lagres live. Logg inn med Supabase, ikke Supabase-innlogging.</div>`);return false}
  if(!isUuid(property().id)){showDrawer('Krever Supabase-eiendom',`<div class="output">Valgt eiendom har test-ID. Velg en eiendom hentet fra Supabase før du lagrer.</div>`);return false}
  return true;
}


