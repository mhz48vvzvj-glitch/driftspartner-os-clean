/* Driftspartner OS module: 46-email-storage-offer-strict.js
   Email send override, strict document upload and offer save wrapper.
   Source: 43-build-order-live-dashboard-checks.js:165-194
*/
async function sendEmailLog(kind,caseId){
  let checked=[...document.querySelectorAll('.mailRecipient:checked')].map(x=>x.value),extra=parseEmails(document.getElementById('emailExtra')?.value),recipients=dpUniqueEmails([...checked,...extra]),sub=document.getElementById('emailSubject').value,msg=document.getElementById('emailBody').value;
  if(!recipients.length){showDrawer('Mangler mottaker','<div class="output">Legg inn minst én e-postadresse.</div>');return}
  if(location.protocol==='file:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'){
    showDrawer('E-post kan ikke sendes lokalt',`<div class="output">Du åpner appen lokalt (${esc(location.protocol)}). E-post sendes bare fra publisert Netlify-side.\n\nMottakere:\n${esc(recipients.join('\n'))}</div>`);
    return;
  }
  let status='Sender...',detail='';showDrawer('Sender e-post',`<div class="output">${esc(status)}</div>`);
  try{
    let res=await fetch('/.netlify/functions/send-email',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({to:recipients,subject:sub,message:msg,kind,caseId,property:property().name})});
    let data=await res.json().catch(()=>({ok:false,message:'Kunne ikke lese JSON-svar fra e-postfunksjonen'}));
    status=data.ok?'Sendt via Resend':(data.message||`E-post feilet med HTTP ${res.status}`);
    detail=[data.id?`Resend ID: ${data.id}`:'',data.resend_status?`Resend status: ${data.resend_status}`:'',data.missing?`Mangler: ${data.missing}`:''].filter(Boolean).join(' · ');
  }catch(e){status='Ikke sendt: '+e.message}
  logActivity(`E-post sendt/logget til ${recipients.join(', ')}: ${sub}`,caseId);
  showDrawer('E-post',`<table><tr><td>Eiendom</td><td>${esc(property().name)}</td></tr><tr><td>Mottakere</td><td>${recipients.map(esc).join('<br>')}</td></tr><tr><td>Emne</td><td>${esc(sub)}</td></tr><tr><td>Status</td><td>${esc(status)}</td></tr><tr><td>Detalj</td><td>${esc(detail||'-')}</td></tr></table><div class="output">Logg lagret på eiendomskortet.</div>`);
}
const dpUploadPropertyDocumentStrict=uploadPropertyDocument;
uploadPropertyDocument=async function(args){
  if((!args.file)&&isRealSession())throw new Error('Velg en faktisk fil. I produksjonsmodus lagres ikke tom dokument-metadata som filopplasting.');
  return dpUploadPropertyDocumentStrict(args);
};
const dpSaveOfferBase=saveOffer;
saveOffer=async function(){
  try{
    await dpSaveOfferBase();
  }catch(e){
    if(isRealSession())showDrawer('Tilbud ble ikke lagret',`<div class="output">${esc(e.message)}\n\nRett feilen og prøv igjen. I produksjonsmodus faller vi ikke tilbake til lokal test.</div>`);
    else throw e;
  }
