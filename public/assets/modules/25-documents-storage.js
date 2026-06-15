/* Driftspartner OS module: 25-documents-storage.js
   Document upload, FDV upload, offer upload and document archive.
   Source: 24-storage-documents-cases.js:17-102
*/
async function uploadPropertyDocument({category,title,file,status='Arkivert'}){
  let p=ensurePropertyData(property()),storage='Supabase-feil',path=title,documentId=null,mime=file?.type||null;
  if(!file){addDocument(category,title,status);return {documentId,path,title,storage:'Lokal metadata',fileName:title}}
  try{
    let db=supabaseClient();
    path=`${p.id}/${category}/${Date.now()}-${file.name}`.replace(/\s+/g,'-');
    let upload=await db.storage.from('documents').upload(path,file,{upsert:false,contentType:file.type||undefined});
    if(upload.error)throw upload.error;
    let doc=await db.from('documents').insert({property_id:p.id,category,title,storage_path:path,mime_type:mime,status}).select('id').single();
    if(doc.error)throw doc.error;
    documentId=doc.data.id;
    storage='Supabase Storage';
  }catch(e){storage='Supabase-feil: '+e.message}
  addDocument(category,title,status);
  return {documentId,path,title,storage,fileName:file.name};
}
function showUploadFDV(){
  let p=property();
  showDrawer('Last opp dokument',`<label>Eiendom</label><input value="${p.name}" disabled><label>Dokumenttype</label><select id="fdvType"><option>FDV</option><option>HMS</option><option>Tegning</option><option>Bilde</option><option>Tilbud</option><option>Kontrakt</option><option>Annet</option></select><label>Tittel</label><input id="fdvName" value="Ny FDV rapport.pdf"><label>Velg fil</label><input id="fdvFile" type="file"><button class="action primary" onclick="uploadDocumentToSupabase()">Last opp dokument</button><div id="fdvOut" class="output">Filen lagres i Supabase Storage under valgt eiendom og registreres i dokumentarkivet.</div>`);
}
async function uploadDocumentToSupabase(){
  let type=document.getElementById('fdvType').value,title=document.getElementById('fdvName').value,file=document.getElementById('fdvFile').files?.[0],out=document.getElementById('fdvOut');
  let result=await uploadPropertyDocument({category:type,title:title||file?.name||'Dokument',file,status:'Arkivert'});
  if(out)out.textContent=`Dokument registrert.\nLagring: ${result.storage}\nFil: ${result.fileName||result.title}\nSti: ${result.path}`;
  openFdvTab();
}
function showUploadOffer(){
  let suppliers=state.suppliers.filter(s=>s.email).map(s=>`<option value="${s.id}">${esc(s.name)} · ${esc(s.email)}</option>`).join('');
  showDrawer('Last opp tilbud',`<label>Eiendom</label><input value="${property().name}" disabled><label>Leverandør</label><select id="offerSupplier">${suppliers}</select><label>Pris</label><input id="offerPrice" value="45000"><label>Frist</label><input id="offerDeadline" value="2026-06-20"><label>Tilbud PDF/vedlegg</label><input id="offerUploadFile" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"><label>Tittel i dokumentarkiv</label><input id="offerFileTitle" value="Tilbud ${property().name}.pdf"><label>Bilder/vedlegg-notat</label><input id="offerImages" value="bilde-tak-1.jpg, bilde-fukt-2.jpg"><label>Forbehold</label><textarea id="offerTerms">Ingen vesentlige forbehold.</textarea><button class="action primary" onclick="saveOffer()">Last opp tilbud</button><button class="action" onclick="analyzeUploadedOfferDraft()">AI-forhåndsvurder</button><div id="offerAiOut" class="output">Velg PDF/vedlegg. Filen havner i dokumentarkivet på valgt eiendom.</div>`);
}
async function saveOffer(){
  let p=ensurePropertyData(property()),s=state.suppliers.find(x=>x.id===document.getElementById('offerSupplier').value),price=+document.getElementById('offerPrice').value||0,terms=document.getElementById('offerTerms').value,images=document.getElementById('offerImages')?.value||'',deadline=document.getElementById('offerDeadline').value,file=document.getElementById('offerUploadFile')?.files?.[0],title=document.getElementById('offerFileTitle')?.value||file?.name||'Tilbud.pdf',storage='Supabase-feil',documentResult=null;
  if(!s){showDrawer('Mangler leverandør',`<div class="output">Registrer leverandør med e-post først.</div><button class="action" onclick="showSupplierRegistration()">Registrer leverandør</button>`);return}
  let offer={id:'TIL-'+(p.offers.length+1),supplier:s.name,email:s.email,price,deadline,file:title,images,terms,score:0};
  try{
    documentResult=await uploadPropertyDocument({category:'Tilbud',title,file,status:'Mottatt'});
    let db=supabaseClient(),supplierId=await getOrCreateSupplierId(db,s);
    let insert={supplier_id:supplierId,property_id:p.id,price,deadline,reservations:terms,status:'Mottatt'};
    let saved=await db.from('offers').insert(insert).select().single();
    if(saved.error)throw saved.error;
    offer.id=saved.data.id;
    if(documentResult.documentId){
      let link=await db.from('offer_files').insert({offer_id:offer.id,document_id:documentResult.documentId,title,storage_path:documentResult.path});
      if(link.error)throw link.error;
    }
    storage=documentResult.storage;
  }catch(e){
    if(!documentResult)addDocument('Tilbud',title,'Mottatt');
    storage='Supabase-feil: '+e.message;
  }
  p.offers.push(offer);
  logActivity(`Tilbud lastet opp fra ${s.name}`,offer.id);
  showDrawer('Tilbud lastet opp',`<table><tr><td>Leverandør</td><td>${esc(s.name)}</td></tr><tr><td>E-post</td><td>${esc(s.email)}</td></tr><tr><td>Pris</td><td>${money(price)}</td></tr><tr><td>PDF/vedlegg</td><td>${esc(title)}</td></tr><tr><td>Bilder/notat</td><td>${esc(images)}</td></tr><tr><td>Dokumentarkiv</td><td>${esc(documentResult?.path||title)}</td></tr><tr><td>Lagring</td><td>${esc(storage)}</td></tr></table><button class="action" onclick="analyzeOffer('${offer.id}')">Analyser tilbud</button><button class="action" onclick="openFdvTab()">Åpne dokumentarkiv</button>`);
}

function documentArchive(){
  let p=ensurePropertyData(property());
  return `<div class="card s12"><div class="dash-title"><h3>Dokumentarkiv for ${esc(p.name)}</h3><div><button class="action" onclick="refreshDocuments()">Oppdater fra Supabase</button><button class="action primary" onclick="showUploadFDV()">Last opp dokument</button></div></div><table><tr><th>Type</th><th>Dokument</th><th>Status</th><th>Lagring</th><th>Handling</th></tr>${p.documents.map((d,i)=>`<tr><td>${esc(d.type)}</td><td>${esc(d.name)}</td><td>${esc(d.status)}</td><td>${esc(d.path?'Supabase':'Test')}</td><td><button class="action" onclick="openDocument(${i})">Åpne</button></td></tr>`).join('')||'<tr><td colspan=5>Ingen dokumenter ennå.</td></tr>'}</table><div id="docOut" class="output" style="margin-top:12px">Dokumenter er filtrert på valgt eiendom.</div></div>`;
}
async function refreshDocuments(){
  let out=document.getElementById('docOut'),p=ensurePropertyData(property());
  try{
    if(out)out.textContent='Henter dokumenter...';
    let db=supabaseClient();
    let {data,error}=await db.from('documents').select('*').eq('property_id',p.id).order('created_at',{ascending:false}).limit(200);
    if(error)throw error;
    p.documents=(data||[]).map(d=>({id:d.id,type:d.category,name:d.title,status:d.status||'Arkivert',path:d.storage_path,mime:d.mime_type}));
    p.fdv=p.documents.filter(d=>d.type==='FDV').map(d=>d.name);
    openFdvTab();
  }catch(e){if(out)out.textContent='Kunne ikke hente dokumenter: '+e.message}
}
async function openDocument(index){
  let p=ensurePropertyData(property()),d=p.documents[index];
  if(!d)return;
  if(!d.path){showDrawer('Dokument',`<div class="output">${esc(d.name)} ligger bare i lokal test. Last opp fil til Supabase for å åpne den.</div>`);return}
  try{
    let db=supabaseClient();
    let signed=await db.storage.from('documents').createSignedUrl(d.path,60*10);
    if(signed.error)throw signed.error;
    window.open(signed.data.signedUrl,'_blank');
    logActivity('Dokument åpnet',d.id||d.name);
  }catch(e){
    showDrawer('Kunne ikke åpne dokument',`<div class="output">${esc(e.message)}\n\nSjekk Storage-policy og at filen ligger i bucket documents.</div>`);
  }
}

