/* Driftspartner OS module: 22-production-workflows.js
   Active workflow helpers without presentation/test numbers. */
function voiceToDeviation(){
  const text=document.getElementById('voice')?.value||'';
  showDrawer('Lag avvik fra tekst',`<div class="output">Teksten kan brukes som beskrivelse pa nytt avvik.</div><label>Beskrivelse</label><textarea id="devDescFromVoice">${esc(text)}</textarea><button class="action primary" onclick="showCreateDeviation()">Opprett avvik</button>`);
}
function imageToDeviation(){
  showDrawer('Bildeanalyse',`<div class="output">Bildeanalyse krever egen AI-funksjon i backend. Last opp bildet pa avviket, sa lagres det pa valgt eiendom.</div><button class="action primary" onclick="showCreateDeviation()">Opprett avvik med bilde</button>`);
}
function showAgenda(){
  showDrawer('Agenda',`<label>Agenda</label><textarea>1. Apne avvik
2. Arbeidsordre
3. FDV/dokumentasjon
4. Okonomi
5. Vedtak og oppgaver</textarea><button class="action" onclick="showEmailFlow('board','Styremote')">Send til styret</button>`);
}
function showMinutes(){
  showDrawer('Referat',`<label>Referat</label><textarea id="minutesText">Skriv referat, vedtak og ansvarlige her.</textarea><button class="action primary" onclick="logActivity('Referat lagret','Styre');act('Referat logget pa eiendom')">Lagre referat</button>`);
}
function showMeetingTasks(){
  showDrawer('Oppgaver etter mote',`<label>Oppgave</label><input id="meetingTask" value=""><label>Ansvarlig</label><input id="meetingOwner" value=""><label>Frist</label><input id="meetingDue" type="date"><button class="action primary" onclick="logActivity('Styremoteoppgave opprettet',document.getElementById('meetingTask').value);act('Oppgave logget')">Lagre oppgave</button>`);
}
function runDirectorFlow(){
  const p=ensurePropertyData(property());
  showDrawer('AI Director - live grunnlag',`<table><tr><td>Eiendom</td><td>${esc(p.name)}</td></tr><tr><td>Avvik</td><td>${(p.deviations||[]).length}</td></tr><tr><td>Arbeidsordre</td><td>${(p.workOrders||[]).length}</td></tr><tr><td>Dokumenter</td><td>${(p.documents||[]).length}</td></tr><tr><td>Tilbudsforesporsler</td><td>${(p.quoteRequests||[]).length}</td></tr></table><div class="output">Dette er regelbasert V1. Ekte AI-agent med full datatilgang ma kobles via backend senere.</div><button class="action primary" onclick="showPriorities()">Se prioriteringer</button>`);
}
function showAgent(n){
  const p=property();
  showDrawer('AI '+esc(n),`<label>Relevant info</label><textarea id="agentInput">Analyser ${esc(p.name)} basert pa registrerte live-data.</textarea><button class="action primary" onclick="runAgent('${esc(n)}')">Analyser</button><div id="agentOut" class="output">V1 bruker regelbaserte funn fra eiendommen.</div>`);
}
function runAgent(n){
  const p=ensurePropertyData(property()),txt=document.getElementById('agentInput')?.value||'';
  const critical=(p.deviations||[]).filter(d=>String(d.priority||'').toLowerCase().includes('kritisk')).length;
  const overdue=(p.workOrders||[]).filter(w=>w.due_date&&new Date(w.due_date)<new Date()).length;
  document.getElementById('agentOut').textContent=`${n} - V1 analyse\n\nInput: ${txt}\n\nLive funn:\n- Kritiske avvik: ${critical}\n- Forfalte arbeidsordre: ${overdue}\n- Dokumenter pa eiendom: ${(p.documents||[]).length}\n\nForeslatt handling: prioriter kritiske avvik, lukk forfalte arbeidsordre og kompletter FDV.`;
  logActivity('AI '+n+' analysert','AI');
}
function showTender(){
  const p=property();
  showDrawer('Publiser anbud',`<label>Eiendom</label><input value="${esc(p.name)}" disabled><label>Oppdrag</label><input id="tenderTitle" value=""><label>Beskrivelse / tekstgrunnlag</label><textarea id="tenderText"></textarea><label>Bilder / vedlegg</label><input id="tenderImages" value=""><label>PDF-grunnlag</label><input id="tenderPdf" value=""><label>Frist</label><input id="tenderDeadline" type="date"><button class="action" onclick="generateTenderBasis()">Lag grunnlag</button><button class="action primary" onclick="showQuoteRequest()">Lag tilbudsforesporsel</button><div id="tenderOut" class="output">Fyll inn grunnlag for anbudet.</div>`);
}
function generateTenderBasis(){
  const title=document.getElementById('tenderTitle')?.value||'',text=document.getElementById('tenderText')?.value||'',deadline=document.getElementById('tenderDeadline')?.value||'';
  document.getElementById('tenderOut').textContent=`Tilbudsgrunnlag\n\nOppdrag: ${title}\nFrist: ${deadline||'-'}\n\nBeskrivelse:\n${text}\n\nKrav:\n- Pris og eventuelle forbehold\n- Fremdriftsplan\n- HMS/KS\n- FDV/sluttdokumentasjon\n- Kontaktperson og gyldig e-post`;
  logActivity('Tilbudsgrunnlag opprettet','Marked');
}
function showResidentDeviation(){showCreateDeviation()}
function showJanitorTask(){
  showDrawer('Vaktmesteroppgave',`<label>Oppgave</label><input id="janTask" value=""><label>Timer</label><input id="janHours" type="number" value="0"><label>Materialer</label><input id="janMat" value=""><label>Notat</label><textarea id="janNote"></textarea><button class="action primary" onclick="logActivity('Vaktmester registrerte info',document.getElementById('janTask').value);act('Vaktmesterinfo lagret')">Lagre info</button>`);
}
function showSupplierOffer(){
  const s=state.suppliers.find(x=>x.email);
  if(!s){showSupplierRegistration();return}
  showDrawer('Leverandorportal',`<label>Leverandor</label><input value="${esc(s.name)} · ${esc(s.email)}" disabled><label>Melding</label><textarea id="supMsg"></textarea><label>Pris / estimat</label><input id="supPrice" type="number" value="0"><label>PDF-tilbud</label><input id="offerFile" type="file"><button class="action primary" onclick="showUploadOffer()">Last opp formelt tilbud</button><button class="action" onclick="logActivity('Leverandor sendte melding','Leverandor');act('Leverandormelding lagret')">Lagre melding</button>`);
}
function showInvestment(){
  const p=ensurePropertyData(property());
  const budget=(p.budgetLines||[]).reduce((s,x)=>s+(+x.budget_amount||+x.budget||0),0);
  const actual=(p.budgetLines||[]).reduce((s,x)=>s+(+x.actual_amount||+x.actual||0),0);
  showDrawer('Okonomianalyse',`<table><tr><td>Eiendom</td><td>${esc(p.name)}</td></tr><tr><td>Konto</td><td>${money(+p.bankBalance||0)}</td></tr><tr><td>Budsjett</td><td>${money(budget)}</td></tr><tr><td>Faktisk</td><td>${money(actual)}</td></tr><tr><td>Avvik</td><td>${money(actual-budget)}</td></tr></table><div class="output">Tallene kommer fra live okonomi/budsjettdata nar de finnes.</div>`);
}
function showAPIKey(){showDrawer('API',`<div class="output">Ekstern API-nokkel er ikke aktivert i denne frontenden. Dette bor settes opp via backend for produksjon.</div>`)}
function showAPITest(){showDrawer('API-kontroll',`<div class="output">API-kontroll krever backend-endepunkt. Ingen data vises uten backend-endepunkt.</div>`)}
function showGuardrailEdit(){showDrawer('Guardrails',`<label>Regel</label><textarea id="guardrailText">Skriv produksjonsregler for AI/automatisering her.</textarea><button class="action primary" onclick="logActivity('Guardrails oppdatert','AI');act('Guardrails logget')">Lagre</button>`)}
function showAudit(){
  const rows=(property().activity||[]).slice(0,20).map(a=>`<tr><td>${esc(a.time||a.created_at||'-')}</td><td>${esc(a.action||a.title||'-')}</td><td>${esc(a.ref||a.entity_type||'-')}</td></tr>`).join('');
  showDrawer('Audit-logg',`<table><tr><th>Tid</th><th>Handling</th><th>Ref</th></tr>${rows||'<tr><td colspan="3">Ingen aktivitet hentet.</td></tr>'}</table>`);
}
function showBrainAnswer(){
  const p=ensurePropertyData(property()),mode=document.getElementById('brainMode')?.value||'Status';
  const answer=`${p.name}: ${mode}. Live grunnlag: ${(p.deviations||[]).length} avvik, ${(p.workOrders||[]).length} arbeidsordre, ${(p.documents||[]).length} dokumenter, ${(state.suppliers||[]).length} leverandorer.`;
  const out=document.getElementById('brainOut');if(out)out.textContent=answer;
  showDrawer('Property Brain',`<div class="output">${esc(answer)}</div><button class="action" onclick="showPriorities()">Se prioriteringer</button>`);
}
function showHealthReport(){
  const p=ensurePropertyData(property());
  showDrawer('Eiendomsrapport',`<table><tr><td>Eiendom</td><td>${esc(p.name)}</td></tr><tr><td>Avvik</td><td>${(p.deviations||[]).length}</td></tr><tr><td>Arbeidsordre</td><td>${(p.workOrders||[]).length}</td></tr><tr><td>Dokumenter</td><td>${(p.documents||[]).length}</td></tr></table>`);
}
function showHMSChecklist(){showDrawer('HMS-sjekkliste',`<label>Punkt</label><input id="hmsPoint" value=""><label>Status/notat</label><textarea id="hmsNote"></textarea><button class="action primary" onclick="logActivity('HMS-sjekkliste oppdatert',document.getElementById('hmsPoint').value);act('HMS lagret')">Lagre</button>`)}
function openFdvTab(){current='property';document.getElementById('title').textContent=app.property.title;renderRoleMenu();renderPropertyContext();renderTabs();openTab('FDV/HMS')}
app.market.tabs['Marketplace']=()=>`<div class="grid"><div class="card s12"><div class="dash-title"><h3>Marked / tilbud</h3><div><button class="action primary" onclick="showQuoteRequest()">Lag tilbudsforesporsel</button><button class="action" onclick="showSupplierRegistration()">Registrer leverandor</button><button class="action" onclick="showTender()">Publiser anbud</button><button class="action" onclick="openSuppliers()">Leverandoroversikt</button></div></div><p class="muted">Marked viser kun live leverandorer, tilbudsforesporsler og tilbud nar Supabase-data finnes.</p></div></div>`;
