/* Driftspartner OS module: 50-live-fdv-documents.js
   Live FDV folders, document upload and document details.
   Source: 50-drift-cases.js:1-63
*/
/* Driftspartner OS module: 50-drift-cases.js
   Generated from driftspartner-property-os.js. Keep classic script order in HTML. */
function dpLiveNotice(){
  let p=property(),ok=state.currentUserRecord&&isUuid(p.id);
  return `<div class="card s12"><div class="dash-title"><div><h3>${ok?'Live-modus':'Ikke live ennå'}</h3><p class="muted">${ok?`Alt i denne modulen forsøker å lese/skrive mot Supabase for ${esc(p.name)}.`:'Logg inn ekte og velg Supabase-eiendom. Test-data skal ikke brukes i kundedrift.'}</p></div><span class="badge ${ok?'ok':'warn'}">${ok?'Supabase live':'Lokal'}</span></div>${(p.liveErrors||[]).length?`<div class="output">${esc(p.liveErrors.join('\n'))}</div>`:''}</div>`;
}
function dpRequiredFdvFolders(){return ['Bygg','VVS','Elektro','Brann','Ventilasjon','Tak','Fasade','Heis','HMS','Forsikring','Garantier','Tegninger','Kontrakter','Serviceavtaler']}
function dpFolderDocs(folder){
  let p=dpV1Ensure();
  return (p.documents||[]).filter(d=>String(d.folder||d.category||d.type||'').toLowerCase()===String(folder).toLowerCase());
}
function dpFolderMissingRows(){
  return dpRequiredFdvFolders().map(f=>({name:f,count:dpFolderDocs(f).length,missing:dpFolderDocs(f).length===0}));
}
function LiveFdvPage(){
  let p=dpV1Ensure(),folders=dpFolderMissingRows(),docs=p.documents||[],buildings=p.buildings||[];
  return `<div class="grid">${dpLiveNotice()}<div class="card s4"><div class="dash-title"><h3>FDV-mapper</h3><button class="action primary" onclick="showCreateFdvFolderV1()">Ny mappe</button></div>${folders.map(f=>`<button class="action" onclick="showFdvFolderV1('${esc(f.name)}')">${esc(f.name)} <span class="badge ${f.missing?'warn':'ok'}">${f.missing?'Mangler':f.count}</span></button>`).join('')}</div><div class="card s8"><div class="dash-title"><h3>Dokumentarkiv</h3><button class="action primary" onclick="showUploadFDV()">Last opp</button></div><table><tr><th>Dokument</th><th>Mappe</th><th>Bygg</th><th>Versjon</th><th>Utløper</th><th>Handling</th></tr>${docs.length?docs.map((d,i)=>`<tr><td>${esc(d.name||d.title)}</td><td>${esc(d.folder||d.category||d.type||'-')}</td><td>${esc((buildings.find(b=>b.id===d.building)?.name)||d.building||'-')}</td><td>${esc(d.version||'1.0')}</td><td>${esc(d.expires||'-')}</td><td><button class="action" onclick="showDocumentDetailLive('${esc(d.id||i)}')">Åpne</button></td></tr>`).join(''):`<tr><td colspan="6">Ingen dokumenter registrert live ennå.</td></tr>`}</table></div><div class="card s12"><h3>FDV-mangler</h3><table><tr><th>Mappe</th><th>Status</th><th>Neste steg</th></tr>${folders.map(f=>`<tr><td>${esc(f.name)}</td><td><span class="badge ${f.missing?'warn':'ok'}">${f.missing?'Mangler dokument':'OK'}</span></td><td>${f.missing?`<button class="action" onclick="showUploadFDV('${esc(f.name)}')">Last opp ${esc(f.name)}</button>`:'Dokument finnes'}</td></tr>`).join('')}</table></div></div>`;
}
function showDocumentDetailLive(id){
  let p=dpV1Ensure(),docs=p.documents||[],d=docs.find(x=>String(x.id)===String(id))||docs[+id]||{};
  showDrawer('Dokument',`<table><tr><td>Tittel</td><td>${esc(d.name||d.title||'-')}</td></tr><tr><td>Kategori/mappe</td><td>${esc(d.folder||d.category||d.type||'-')}</td></tr><tr><td>Versjon</td><td>${esc(d.version||'1.0')}</td></tr><tr><td>Utløpsdato</td><td>${esc(d.expires||'-')}</td></tr><tr><td>Storage-path</td><td>${esc(d.path||'-')}</td></tr></table><button class="action primary" onclick="showUploadFDV('${esc(d.folder||d.category||d.type||'FDV')}')">Last opp ny versjon</button>`);
}
function showCreateFdvFolderV1(){
  showDrawer('Ny FDV-mappe',`<label>Navn</label><input id="folderName" value=""><label>Sortering</label><input id="folderSort" value="150"><button class="action primary" onclick="saveFdvFolderV1()">Lagre mappe</button>`);
}
async function saveFdvFolderV1(){
  let p=dpV1Ensure(),name=document.getElementById('folderName')?.value.trim(),sort=+document.getElementById('folderSort')?.value||150;
  if(!name){showDrawer('Mangler navn','<div class="output">Skriv inn mappenavn.</div>');return}
  if(isRealSession()){
    if(!dpLiveWriteReady('FDV-mappe'))return;
    try{
      let r=await supabaseClient().from('document_folders').insert({property_id:p.id,name,sort_order:sort}).select().single();
      if(r.error)throw r.error;
    }catch(e){showDrawer('FDV-mappe ble ikke lagret',`<div class="output">${esc(e.message)}</div><p class="muted">Kjør SQL-filen driftspartner-live-finance-fdv-projects.sql hvis tabellen/policy mangler.</p>`);return}
  }
  if(!p.fdvFolders.includes(name))p.fdvFolders.push(name);
  logActivity('FDV-mappe opprettet',name);
  openPropertyTabV1('FDV/HMS');
}
function showUploadFDV(folder='FDV'){
  let p=dpV1Ensure(),folders=[...new Set([folder,...dpRequiredFdvFolders(),...(p.fdvFolders||[])])],buildings=p.buildings||[];
  showDrawer('Last opp dokument',`<label>Mappe/kategori</label><select id="fdvType">${folders.map(f=>`<option ${f===folder?'selected':''}>${esc(f)}</option>`).join('')}</select><label>Tittel</label><input id="fdvName" value=""><label>Bygg</label><select id="fdvBuilding"><option value="">Hele eiendommen</option>${buildings.map(b=>`<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('')}</select><label>Versjon</label><input id="fdvVersion" value="1.0"><label>Utløpsdato</label><input id="fdvExpires" type="date"><label>PDF/vedlegg</label><input id="fdvFile" type="file"><button class="action primary" onclick="uploadDocumentToSupabase()">Last opp til arkiv</button><div id="fdvOut" class="output">Dokumenter i kundedrift skal ha faktisk fil og lagres i Supabase Storage.</div>`);
}
async function uploadDocumentToSupabase(){
  let p=dpV1Ensure(),type=document.getElementById('fdvType').value,title=document.getElementById('fdvName').value,file=document.getElementById('fdvFile').files?.[0],out=document.getElementById('fdvOut'),building=document.getElementById('fdvBuilding').value,version=document.getElementById('fdvVersion').value||'1.0',expires=document.getElementById('fdvExpires').value||null;
  try{
    if(isRealSession()&&!dpLiveWriteReady('Dokumentopplasting'))return;
    let result=await uploadPropertyDocument({category:dpNormalizeDocumentCategory(type),title:title||file?.name||type,file,status:'Arkivert'});
    if(isRealSession()&&result.documentId){
      let folderId=null,folders=await supabaseClient().from('document_folders').select('id,name').eq('property_id',p.id).eq('name',type).maybeSingle();
      if(!folders.error&&folders.data)folderId=folders.data.id;
      let upd={version,expires_at:expires,building_id:building||null,folder_id:folderId};
      let saved=await supabaseClient().from('documents').update(upd).eq('id',result.documentId);
      if(saved.error)throw saved.error;
    }
    let doc=(p.documents||[])[0];if(doc){doc.folder=type;doc.building=building;doc.version=version;doc.expires=expires;doc.uploadedBy=user().name;doc.date=new Date().toLocaleDateString('nb-NO')}
    if(out)out.textContent=`Dokument lagret.\nMappe: ${type}\nBygg: ${building||'Hele eiendommen'}\nLagring: ${result.storage}`;
    await hydrateDashboardNow();
  }catch(e){
    if(out)out.textContent='FEIL: '+e.message;
    showDrawer('Dokument ble ikke lagret',`<div class="output">${esc(e.message)}</div><p class="muted">Sjekk Storage-bucket, documents-tabell, kategori og RLS-policy.</p>`);
  }
}
