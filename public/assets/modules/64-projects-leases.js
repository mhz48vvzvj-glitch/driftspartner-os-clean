/* Driftspartner OS module: 64-projects-leases.js
   Projects, project delete and lease agreements.
   Source: 60-dashboard-market-economy.js:293-416
*/
LiveProjectsPage=function(){
  let p=dpV1Ensure(),projects=p.projects||[],budget=projects.reduce((s,x)=>s+(+x.budget||0),0),actual=projects.reduce((s,x)=>s+(+x.actual||0),0);
  return `<div class="grid">${dpLiveNotice()}${kpi('Prosjekter',projects.length,'info')}${kpi('Pågående',projects.filter(x=>!['Ferdig','Lukket'].includes(x.status||'')).length,'warn')}${kpi('Budsjett',money(budget),'purple')}${kpi('Avvik',money(actual-budget),'ok')}<div class="card s12"><div class="dash-title"><h3>Prosjekter</h3><button class="action primary" onclick="showCreateProjectLive()">Nytt prosjekt</button></div><table><tr><th>Prosjekt</th><th>Ansvarlig</th><th>Frist</th><th>Budsjett</th><th>Faktisk</th><th>Status</th><th>Handling</th></tr>${projects.length?projects.map(x=>`<tr><td>${esc(x.name)}<br><small class="muted">${esc(x.description||'')}</small></td><td>${esc(x.owner||x.owner_name||'-')}</td><td>${esc(x.due||x.due_date||'-')}</td><td>${money(+x.budget||0)}</td><td>${money(+x.actual||0)}</td><td>${esc(x.status||'-')}</td><td><button class="action" onclick="showProjectDetailLive('${esc(x.id)}')">Åpne</button><button class="action red" onclick="deleteProjectLive('${esc(x.id)}')">Slett</button></td></tr>`).join(''):`<tr><td colspan="7">Ingen prosjekter opprettet.</td></tr>`}</table></div></div>`;
};
showProjectDetailLive=function(id){
  let p=dpV1Ensure(),x=(p.projects||[]).find(pr=>String(pr.id)===String(id));
  if(!x)return;
  showDrawer('Prosjekt: '+x.name,`<table><tr><td>Beskrivelse</td><td>${esc(x.description||'-')}</td></tr><tr><td>Ansvarlig</td><td>${esc(x.owner||x.owner_name||'-')}</td></tr><tr><td>Frist</td><td>${esc(x.due||x.due_date||'-')}</td></tr><tr><td>Budsjett</td><td>${money(+x.budget||0)}</td></tr><tr><td>Faktisk</td><td>${money(+x.actual||0)}</td></tr><tr><td>Status</td><td>${esc(x.status||'-')}</td></tr></table><button class="action primary" onclick="showQuoteRequest('${esc(x.id)}')">Lag tilbudsforespørsel</button><button class="action" onclick="showUploadFDV('Prosjekt')">Last opp dokument</button><button class="action" onclick="showEmailFlow('general','${esc(x.id)}')">Send e-post</button><button class="action red" onclick="deleteProjectLive('${esc(x.id)}')">Slett prosjekt</button>`);
};
async function deleteProjectLive(id){
  let p=dpV1Ensure(),project=(p.projects||[]).find(x=>String(x.id)===String(id));
  if(!project){showDrawer('Fant ikke prosjekt','<div class="output">Prosjektet finnes ikke i listen.</div>');return}
  if(!confirm(`Slette prosjektet "${project.name}"?`))return;
  try{
    if(isRealSession()&&isUuid(project.id)){
      let deleted=await supabaseClient().from('projects').delete().eq('id',project.id);
      if(deleted.error)throw deleted.error;
    }
    p.projects=(p.projects||[]).filter(x=>x!==project);
    logActivity('Prosjekt slettet',project.id||project.name);
    showDrawer('Prosjekt slettet',`<div class="output">${esc(project.name)} er slettet.</div><button class="action primary" onclick="openProjectsLive()">Tilbake til prosjekter</button>`);
  }catch(e){
    showDrawer('Prosjekt ble ikke slettet',`<div class="output">${esc(e.message)}</div><p class="muted">Sjekk RLS-policy for projects i Supabase.</p>`);
  }
}
function dpLeaseTemplate(data={}){
  return `LEIEFORHOLD / LEIEAVTALE

Eiendom: ${data.property||property().name}
Enhet/lokale: ${data.unit||'[enhet/lokale]'}
Leietaker: ${data.tenant||'[navn]'}
E-post: ${data.email||'[e-post]'}
Telefon: ${data.phone||'[telefon]'}

1. Leieobjekt
Avtalen gjelder leie av ${data.unit||'[enhet/lokale]'} på ${data.property||property().name}.

2. Leieperiode
Startdato: ${data.start||'[startdato]'}
Sluttdato/oppsigelse: ${data.end||'[sluttdato/oppsigelse]'}

3. Leie og depositum
Månedlig leie: ${data.rent||'[beløp]'} kr
Depositum: ${data.deposit||'[beløp]'} kr

4. Bruk og ansvar
Leietaker skal bruke leieobjektet i tråd med avtalt formål, husordensregler og gjeldende lovverk.

5. Vedlikehold og avvik
Avvik, skader og behov for vedlikehold meldes i Driftspartner OS og knyttes til riktig eiendom/enhet.

6. Dokumentasjon
Signert avtale, vedlegg, overtakelsesprotokoll og eventuell nøkkelliste lagres i dokumentarkivet på eiendommen.

7. Særlige vilkår
${data.notes||'[særlige vilkår]'}

Signatur utleier: ______________________
Signatur leietaker: ____________________`;
}
function ensureLeaseData(){
  let p=ensurePropertyData(property());
  p.leaseAgreements=p.leaseAgreements||[];
  return p;
}
function LeaseAgreementsPage(){
  let p=ensureLeaseData(),leases=p.leaseAgreements||[];
  return `<div class="grid">${dpLiveNotice()}<div class="card s12"><div class="dash-title"><div><h3>Leieforhold og avtaler</h3><p class="muted">Leieforhold knyttes til valgt eiendom og kan lagres som dokumentasjon.</p></div><button class="action primary" onclick="showCreateLeaseAgreement()">Nytt leieforhold</button></div><table><tr><th>Enhet</th><th>Leietaker</th><th>Periode</th><th>Leie</th><th>Status</th><th>Handling</th></tr>${leases.length?leases.map(l=>`<tr><td>${esc(l.unit||l.unit_label||'-')}</td><td>${esc(l.tenant||l.tenant_name||'-')}<br><small class="muted">${esc(l.email||l.tenant_email||'')}</small></td><td>${esc(l.start||l.start_date||'-')} - ${esc(l.end||l.end_date||'')}</td><td>${money(+l.rent||+l.monthly_rent||0)}</td><td>${esc(l.status||'Aktiv')}</td><td><button class="action" onclick="showLeaseAgreement('${esc(l.id)}')">Åpne</button><button class="action red" onclick="deleteLeaseAgreement('${esc(l.id)}')">Slett</button></td></tr>`).join(''):`<tr><td colspan="6">Ingen leieforhold registrert.</td></tr>`}</table></div><div class="card s12"><h3>Mal for leieforhold</h3><pre>${esc(dpLeaseTemplate())}</pre><button class="action" onclick="showLeaseTemplate()">Åpne mal</button></div></div>`;
}
function showCreateLeaseAgreement(){
  let p=property();
  showDrawer('Nytt leieforhold',`<label>Enhet/lokale</label><input id="leaseUnit" value=""><label>Leietaker</label><input id="leaseTenant" value=""><label>E-post</label><input id="leaseEmail" value=""><label>Telefon</label><input id="leasePhone" value=""><label>Startdato</label><input id="leaseStart" type="date"><label>Sluttdato/oppsigelse</label><input id="leaseEnd" type="date"><label>Månedlig leie</label><input id="leaseRent" value="0"><label>Depositum</label><input id="leaseDeposit" value="0"><label>Status</label><select id="leaseStatus"><option>Aktiv</option><option>Utkast</option><option>Avsluttet</option></select><label>Særlige vilkår/notat</label><textarea id="leaseNotes"></textarea><button class="action primary" onclick="saveLeaseAgreement()">Lagre leieforhold</button><button class="action" onclick="showLeaseTemplateFromForm()">Vis mal</button>`);
}
function dpLeaseFromForm(){
  return {id:'LEIE-'+Date.now(),property:property().name,unit:document.getElementById('leaseUnit')?.value||'',tenant:document.getElementById('leaseTenant')?.value||'',email:document.getElementById('leaseEmail')?.value||'',phone:document.getElementById('leasePhone')?.value||'',start:document.getElementById('leaseStart')?.value||'',end:document.getElementById('leaseEnd')?.value||'',rent:+document.getElementById('leaseRent')?.value||0,deposit:+document.getElementById('leaseDeposit')?.value||0,status:document.getElementById('leaseStatus')?.value||'Aktiv',notes:document.getElementById('leaseNotes')?.value||''};
}
function showLeaseTemplateFromForm(){
  let data=dpLeaseFromForm();
  showDrawer('Mal for leieforhold',`<pre>${esc(dpLeaseTemplate(data))}</pre><button class="action primary" onclick="saveLeaseAgreement()">Lagre leieforhold</button>`);
}
function showLeaseTemplate(){
  showDrawer('Mal for leieforhold',`<pre>${esc(dpLeaseTemplate())}</pre>`);
}
async function saveLeaseAgreement(){
  let p=ensureLeaseData(),l=dpLeaseFromForm();
  if(!l.tenant){showDrawer('Mangler leietaker','<div class="output">Skriv inn leietaker.</div>');return}
  l.template=dpLeaseTemplate(l);
  let storage='Lokal';
  try{
    if(isRealSession()){
      let r=await supabaseClient().from('lease_agreements').insert({property_id:p.id,unit_label:l.unit,tenant_name:l.tenant,tenant_email:l.email,tenant_phone:l.phone,start_date:l.start||null,end_date:l.end||null,monthly_rent:l.rent,deposit:l.deposit,status:l.status,notes:l.notes,template_text:l.template,created_by:user().id}).select().single();
      if(r.error)throw r.error;
      l.id=r.data.id;storage='Supabase';
    }
  }catch(e){
    if(isRealSession()){showDrawer('Leieforhold ble ikke lagret',`<div class="output">${esc(e.message)}</div><p class="muted">Kjør outputs/driftspartner-live-lease-agreements.sql i Supabase.</p>`);return}
    storage='Lokal: '+e.message;
  }
  p.leaseAgreements.unshift(l);
  logActivity('Leieforhold lagret',l.id);
  showDrawer('Leieforhold lagret',`<table><tr><td>Leietaker</td><td>${esc(l.tenant)}</td></tr><tr><td>Enhet</td><td>${esc(l.unit||'-')}</td></tr><tr><td>Lagring</td><td>${esc(storage)}</td></tr></table><button class="action primary" onclick="openPropertyTabV1('Leieforhold')">Åpne leieforhold</button><button class="action" onclick="showLeaseAgreement('${esc(l.id)}')">Vis avtale</button>`);
}
function showLeaseAgreement(id){
  let p=ensureLeaseData(),l=(p.leaseAgreements||[]).find(x=>String(x.id)===String(id));
  if(!l){showDrawer('Fant ikke leieforhold','<div class="output">Leieforholdet finnes ikke i listen.</div>');return}
  let data={property:p.name,unit:l.unit||l.unit_label,tenant:l.tenant||l.tenant_name,email:l.email||l.tenant_email,phone:l.phone||l.tenant_phone,start:l.start||l.start_date,end:l.end||l.end_date,rent:l.rent||l.monthly_rent,deposit:l.deposit,notes:l.notes};
  showDrawer('Leieforhold',`<table><tr><td>Enhet</td><td>${esc(data.unit||'-')}</td></tr><tr><td>Leietaker</td><td>${esc(data.tenant||'-')}</td></tr><tr><td>E-post</td><td>${esc(data.email||'-')}</td></tr><tr><td>Telefon</td><td>${esc(data.phone||'-')}</td></tr><tr><td>Periode</td><td>${esc(data.start||'-')} - ${esc(data.end||'')}</td></tr><tr><td>Leie</td><td>${money(+data.rent||0)}</td></tr></table><h3>Avtalemal</h3><pre>${esc(l.template||l.template_text||dpLeaseTemplate(data))}</pre><button class="action red" onclick="deleteLeaseAgreement('${esc(l.id)}')">Slett</button>`);
}
async function deleteLeaseAgreement(id){
  let p=ensureLeaseData(),l=(p.leaseAgreements||[]).find(x=>String(x.id)===String(id));
  if(!l)return;
  if(!confirm(`Slette leieforhold for ${l.tenant||l.tenant_name}?`))return;
  try{
    if(isRealSession()&&isUuid(l.id)){
      let r=await supabaseClient().from('lease_agreements').delete().eq('id',l.id);
      if(r.error)throw r.error;
    }
    p.leaseAgreements=p.leaseAgreements.filter(x=>x!==l);
    logActivity('Leieforhold slettet',id);
    showDrawer('Leieforhold slettet',`<div class="output">Leieforholdet er slettet.</div><button class="action primary" onclick="openPropertyTabV1('Leieforhold')">Tilbake</button>`);
  }catch(e){showDrawer('Leieforhold ble ikke slettet',`<div class="output">${esc(e.message)}</div>`)}
}
app.property.tabs['Leieforhold']=()=>LeaseAgreementsPage();

