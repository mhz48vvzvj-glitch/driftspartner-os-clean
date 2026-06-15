/* Driftspartner OS module: 33-mail-economy-workorder.js
   Production email UI, multi-recipient sending, work order override and economy page.
   Source: 25-mail-friendly-ids-production.js:125-184
*/

function dpEnsureMoneyData(p=property()){
  p=ensurePropertyData(p);
  p.bankBalance=Number.isFinite(+p.bankBalance)?+p.bankBalance:1250000;
  p.reservedFunds=Number.isFinite(+p.reservedFunds)?+p.reservedFunds:350000;
  p.monthlyIncome=Number.isFinite(+p.monthlyIncome)?+p.monthlyIncome:185000;
  p.monthlyFixedCosts=Number.isFinite(+p.monthlyFixedCosts)?+p.monthlyFixedCosts:142000;
  return p;
}
function parseEmails(value){return dpUniqueEmails(String(value||'').split(/[,\n;]/).map(x=>x.trim()).filter(x=>x.includes('@')))}
function allRelevantEmails(kind='general',caseId='-'){
  let p=ensurePropertyData(property()),base=[p.email,'post@driftspartnernord.no'],board=dpBoardEmails(p),suppliers=dpSupplierEmails();
  if(kind==='quote'||kind==='contract')return dpUniqueEmails([...suppliers,...base]);
  if(kind==='workorder'||kind==='deviation')return dpUniqueEmails([...base,...board,...suppliers]);
  return dpUniqueEmails([...base,...board]);
}
function recipientCheckboxes(kind='general',caseId='-'){
  let p=ensurePropertyData(property()),emails=allRelevantEmails(kind,caseId);
  return `<div class="recipient-grid">${emails.map((e,i)=>`<label class="tile"><input type="checkbox" class="mailRecipient" value="${esc(e)}" ${i<3?'checked':''}> ${esc(e)}</label>`).join('')}</div>`;
}
function showEmailFlow(kind='general',caseId='-'){
  let t=dpMailTemplate(kind,caseId),suggested=allRelevantEmails(kind,caseId).join(', ');
  showDrawer('Send e-post',`<label>Mottakere</label>${recipientCheckboxes(kind,caseId)}<label>Ekstra e-postadresser</label><textarea id="emailExtra" style="min-height:64px" placeholder="Skriv flere e-poster, separert med komma eller linjeskift">${esc(suggested)}</textarea><label>Emne</label><input id="emailSubject" value="${esc(t.subject)}"><label>Melding</label><textarea id="emailBody">${esc(t.body)}</textarea><button class="action primary" onclick="sendEmailLog('${esc(kind)}','${esc(caseId)}')">Send e-post</button>`);
}
async function sendEmailLog(kind,caseId){
  let checked=[...document.querySelectorAll('.mailRecipient:checked')].map(x=>x.value),extra=parseEmails(document.getElementById('emailExtra')?.value),recipients=dpUniqueEmails([...checked,...extra]),sub=document.getElementById('emailSubject').value,msg=document.getElementById('emailBody').value,results=[];
  if(!recipients.length){showDrawer('Mangler mottaker','<div class="output">Legg inn minst én e-postadresse.</div>');return}
  for(let to of recipients){
    let status='Logget lokalt',detail='';
    try{
      if(location.protocol==='file:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')throw new Error('Lokal test: e-post sendes bare fra publisert Netlify-side.');
      let res=await fetch('/.netlify/functions/send-email',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({to,subject:sub,message:msg,kind,caseId,property:property().name})});
      let data=await res.json().catch(()=>({message:'Kunne ikke lese svar fra e-postfunksjonen'}));
      status=data.ok?'Sendt via Resend':(data.message||'E-postfunksjon svarte uten sending');detail=data.id?`Resend ID: ${data.id}`:(data.data?JSON.stringify(data.data):'');
    }catch(e){status='Ikke sendt: '+e.message}
    results.push({to,status,detail});
  }
  logActivity(`E-post sendt/logget til ${recipients.join(', ')}: ${sub}`,caseId);
  showDrawer('E-post',`<table><tr><th>Mottaker</th><th>Status</th><th>Detalj</th></tr>${results.map(r=>`<tr><td>${esc(r.to)}</td><td>${esc(r.status)}</td><td>${esc(r.detail||'-')}</td></tr>`).join('')}</table><div class="output">Logg lagret på eiendomskortet.</div>`);
}
function showCreateWorkOrder(deviationId=''){
  let p=ensureCaseCollections(),dev=p.deviations.find(d=>String(d.id)===String(deviationId)),board=dpBoardEmails(p).join(', '),suppliers=dpSupplierEmails().join(', ');
  showDrawer('Opprett arbeidsordre',`<label>Eiendom</label><input value="${esc(p.name)}" disabled><input id="woDeviationId" type="hidden" value="${esc(deviationId)}"><label>Sak / avvik</label><input id="woTitle" value="${esc(dev?.title||p.risk)}"><label>Ansvarlig</label><select id="woOwner"><option>Vaktmester</option>${state.suppliers.filter(s=>s.email).map(s=>`<option>${esc(s.name)}</option>`).join('')}</select><label>Status</label><select id="woStatus"><option>Ny</option><option>Pågår</option><option>Venter tilbud</option><option>Utført</option></select><label>Frist</label><input id="woDue" value="2026-06-15"><label>E-post til styre/kopi</label><textarea id="woBoard" style="min-height:58px">${esc(board)}</textarea><label>E-post til leverandør/utførende</label><textarea id="woVendorEmails" style="min-height:58px">${esc(suppliers)}</textarea><label>Instruks / relevant info</label><textarea id="woInfo">Beskriv befaring, bilder, HMS-krav og ønsket dokumentasjon.</textarea><button class="action primary" onclick="createWorkOrderDrawer()">Lagre arbeidsordre</button>`);
}
async function createWorkOrderDrawer(){
  let p=ensureCaseCollections(),deviationId=document.getElementById('woDeviationId')?.value||'',title=document.getElementById('woTitle').value,owner=document.getElementById('woOwner').value,board=document.getElementById('woBoard').value,due=document.getElementById('woDue').value,info=document.getElementById('woInfo').value,status=document.getElementById('woStatus')?.value||'Ny',vendorEmails=document.getElementById('woVendorEmails')?.value||'',id='WO-'+Date.now().toString().slice(-5),storage='Supabase-feil';
  try{let db=supabaseClient(),insert={property_id:p.id,title,description:`Ansvarlig: ${owner}\nKopi: ${board}\nLeverandør e-post: ${vendorEmails}\n\n${info}`,status,due_date:due||null};if(isUuid(deviationId))insert.deviation_id=deviationId;let {data,error}=await db.from('work_orders').insert(insert).select().single();if(error)throw error;id=data.id;storage='Supabase'}catch(e){storage='Supabase-feil: '+e.message}
  let wo={id,title,owner,status,due,source:storage,board,info,vendorEmails,deviation_id:deviationId};if(isUuid(id))wo.technical_id=id;p.workOrders.unshift(wo);wo.display_id=dpFriendlyId(wo,'WO',p.workOrders);logActivity('Arbeidsordre opprettet',wo.display_id);
  showDrawer('Arbeidsordre opprettet',`<table><tr><td>WO</td><td>${esc(wo.display_id)}</td></tr>${dpTechnicalRow(id)}<tr><td>Avvik</td><td>${esc(deviationId?dpCaseLabel(deviationId):'-')}</td></tr><tr><td>Sak</td><td>${esc(title)}</td></tr><tr><td>Ansvarlig</td><td>${esc(owner)}</td></tr><tr><td>Status</td><td>${esc(status)}</td></tr><tr><td>E-post styre/kopi</td><td>${esc(board||'-')}</td></tr><tr><td>E-post leverandør</td><td>${esc(vendorEmails||'-')}</td></tr><tr><td>Lagring</td><td>${esc(storage)}</td></tr></table><button class="action primary" onclick="showQuoteRequest('${esc(id)}')">Lag tilbudsforespørsel</button><button class="action" onclick="showEmailFlow('workorder','${esc(id)}')">Send e-post</button><button class="action" onclick="openTab('Sakslop')">Se saksløp</button>`);
}
function EconomyPage(){
  let p=dpEnsureMoneyData(property()),cost=Math.round(p.invoice*(1-p.margin/100)),available=p.bankBalance-p.reservedFunds,monthlyNet=p.monthlyIncome-p.monthlyFixedCosts;
  return `<div class="grid">${kpi('Konto',money(p.bankBalance),'ok')}${kpi('Disponibelt',money(available),'info')}${kpi('Reservert',money(p.reservedFunds),'warn')}${kpi('Netto/mnd',money(monthlyNet),'purple')}<div class="card s5"><h3>Oppdater økonomi</h3><label>Saldo på konto</label><input id="bankBalance" value="${p.bankBalance}"><label>Reservert buffer / vedlikehold</label><input id="reservedFunds" value="${p.reservedFunds}"><label>Månedlige inntekter</label><input id="monthlyIncome" value="${p.monthlyIncome}"><label>Faste kostnader per måned</label><input id="monthlyFixedCosts" value="${p.monthlyFixedCosts}"><button class="action primary" onclick="saveEconomySettings()">Lagre økonomi</button></div><div class="card s7"><h3>Økonomistatus</h3><table><tr><td>Omsetning/fakturaklart</td><td>${money(p.invoice)}</td></tr><tr><td>Beregnet kost</td><td>${money(cost)}</td></tr><tr><td>DB</td><td>${money(p.invoice-cost)}</td></tr><tr><td>Margin</td><td>${p.margin}%</td></tr><tr><td>Likviditet etter reserver</td><td>${money(available)}</td></tr><tr><td>Månedsnetto</td><td>${money(monthlyNet)}</td></tr></table><button class="action" onclick="showMarginReport()">Åpne DB-rapport</button><button class="action" onclick="showInvoiceBasisList()">Se fakturagrunnlag</button></div></div>`;
}
function saveEconomySettings(){
  let p=dpEnsureMoneyData(property());p.bankBalance=+document.getElementById('bankBalance').value||0;p.reservedFunds=+document.getElementById('reservedFunds').value||0;p.monthlyIncome=+document.getElementById('monthlyIncome').value||0;p.monthlyFixedCosts=+document.getElementById('monthlyFixedCosts').value||0;logActivity('Økonomi oppdatert','ECONOMY');openTab('DB/kundeøkonomi');
}
app.finance.tabs['DB/kundeøkonomi']=()=>EconomyPage();
function showMarginReport(){let p=dpEnsureMoneyData(property()),cost=Math.round(p.invoice*(1-p.margin/100)),available=p.bankBalance-p.reservedFunds;showDrawer('DB- og likviditetsrapport',`<table><tr><td>Eiendom</td><td>${esc(p.name)}</td></tr><tr><td>Saldo på konto</td><td>${money(p.bankBalance)}</td></tr><tr><td>Reservert</td><td>${money(p.reservedFunds)}</td></tr><tr><td>Disponibelt</td><td>${money(available)}</td></tr><tr><td>Omsetning/fakturaklart</td><td>${money(p.invoice)}</td></tr><tr><td>Kost</td><td>${money(cost)}</td></tr><tr><td>DB</td><td>${money(p.invoice-cost)}</td></tr><tr><td>Margin</td><td>${p.margin}%</td></tr></table>`)}

