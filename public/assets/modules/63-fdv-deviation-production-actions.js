/* Driftspartner OS module: 63-fdv-deviation-production-actions.js
   Document delete/open, FDV live table and deviation category persistence.
   Source: 60-dashboard-market-economy.js:207-292
*/
function dpDeviationCategories(){
  return ['Tak','VVS','EL','Ute','Annet'];
}
function dpFindDocumentById(id){
  let docs=dpV1Ensure().documents||[];
  return docs.find(x=>String(x.id)===String(id))||docs[+id]||null;
}
function dpDocumentKey(d){
  return d?.id||d?.path||d?.name||d?.title||'';
}
LiveFdvPage=function(){
  let p=dpV1Ensure(),folders=dpFolderMissingRows(),docs=p.documents||[],buildings=p.buildings||[];
  return `<div class="grid">${dpLiveNotice()}<div class="card s4"><div class="dash-title"><h3>FDV-mapper</h3><button class="action primary" onclick="showCreateFdvFolderV1()">Ny mappe</button></div>${folders.map(f=>`<button class="action" onclick="showFdvFolderV1('${esc(f.name)}')">${esc(f.name)} <span class="badge ${f.missing?'warn':'ok'}">${f.missing?'Mangler':f.count}</span></button>`).join('')}</div><div class="card s8"><div class="dash-title"><h3>Dokumentarkiv</h3><button class="action primary" onclick="showUploadFDV()">Last opp</button></div><table><tr><th>Dokument</th><th>Mappe</th><th>Bygg</th><th>Versjon</th><th>Utløper</th><th>Handling</th></tr>${docs.length?docs.map((d,i)=>`<tr><td>${esc(d.name||d.title)}</td><td>${esc(d.folder||d.category||d.type||'-')}</td><td>${esc((buildings.find(b=>b.id===d.building)?.name)||d.building||'-')}</td><td>${esc(d.version||'1.0')}</td><td>${esc(d.expires||'-')}</td><td><button class="action" onclick="showDocumentDetailLive('${esc(dpDocumentKey(d)||i)}')">Åpne</button><button class="action red" onclick="deleteDocumentLive('${esc(dpDocumentKey(d)||i)}')">Slett</button></td></tr>`).join(''):`<tr><td colspan="6">Ingen dokumenter registrert live ennå.</td></tr>`}</table></div><div class="card s12"><h3>FDV-mangler</h3><table><tr><th>Mappe</th><th>Status</th><th>Neste steg</th></tr>${folders.map(f=>`<tr><td>${esc(f.name)}</td><td><span class="badge ${f.missing?'warn':'ok'}">${f.missing?'Mangler dokument':'OK'}</span></td><td>${f.missing?`<button class="action" onclick="showUploadFDV('${esc(f.name)}')">Last opp ${esc(f.name)}</button>`:'Dokument finnes'}</td></tr>`).join('')}</table></div></div>`;
};
showDocumentDetailLive=function(id){
  let d=dpFindDocumentById(id)||{};
  showDrawer('Dokument',`<table><tr><td>Tittel</td><td>${esc(d.name||d.title||'-')}</td></tr><tr><td>Kategori/mappe</td><td>${esc(d.folder||d.category||d.type||'-')}</td></tr><tr><td>Versjon</td><td>${esc(d.version||'1.0')}</td></tr><tr><td>Utløpsdato</td><td>${esc(d.expires||'-')}</td></tr><tr><td>Storage-path</td><td>${esc(d.path||'-')}</td></tr></table><button class="action primary" onclick="showUploadFDV('${esc(d.folder||d.category||d.type||'FDV')}')">Last opp ny versjon</button><button class="action" onclick="openDocumentByKey('${esc(dpDocumentKey(d))}')">Åpne fil</button><button class="action red" onclick="deleteDocumentLive('${esc(dpDocumentKey(d))}')">Slett dokument</button>`);
};
async function openDocumentByKey(key){
  let p=dpV1Ensure(),docs=p.documents||[],idx=docs.findIndex(d=>String(dpDocumentKey(d))===String(key));
  if(idx>=0)return openDocument(idx);
  showDrawer('Fant ikke dokument','<div class="output">Dokumentet finnes ikke i lokal liste. Trykk Oppdater fra Supabase.</div>');
}
async function deleteDocumentLive(key){
  let p=dpV1Ensure(),docs=p.documents||[],d=docs.find(x=>String(dpDocumentKey(x))===String(key))||docs[+key];
  if(!d){showDrawer('Fant ikke dokument','<div class="output">Dokumentet finnes ikke i listen.</div>');return}
  if(!confirm(`Slette dokumentet "${d.name||d.title}"?`))return;
  try{
    if(isRealSession()){
      let db=supabaseClient();
      if(d.path){
        let removed=await db.storage.from('documents').remove([d.path]);
        if(removed.error)throw removed.error;
      }
      if(isUuid(d.id)){
        let deleted=await db.from('documents').delete().eq('id',d.id);
        if(deleted.error)throw deleted.error;
      }
    }
    p.documents=docs.filter(x=>x!==d);
    p.fdv=(p.documents||[]).filter(x=>(x.type||x.category)==='FDV').map(x=>x.name||x.title);
    logActivity('Dokument slettet',d.id||d.name||d.title);
    showDrawer('Dokument slettet',`<div class="output">${esc(d.name||d.title)} er slettet fra ${isRealSession()?'Supabase/Storage':'lokal liste'}.</div><button class="action primary" onclick="openPropertyTabV1('FDV/HMS')">Tilbake til FDV</button>`);
  }catch(e){
    showDrawer('Dokument ble ikke slettet',`<div class="output">${esc(e.message)}</div><p class="muted">Sjekk Storage- og documents-policy i Supabase.</p>`);
  }
}
deviationsPageV1=function(){
  let p=dpV1Ensure(),cats=dpDeviationCategories();
  return `<div class="grid"><div class="card s5"><h3>Nytt avvik for ${esc(p.name)}</h3><label>Innsender</label><select id="devReporter"><option>Beboer</option><option>Vaktmester</option><option>Styremedlem</option><option>Leverandør</option></select><label>Tittel</label><input id="devTitle" value=""><label>Beskrivelse</label><textarea id="devDesc">Beskriv avvik, omfang og hvor det er observert.</textarea><label>Bygg</label><select id="devBuilding"><option value="">Ikke valgt</option>${(p.buildings||[]).map(b=>`<option>${esc(b.name)}</option>`).join('')}</select><label>Leilighet / område</label><input id="devUnit" value=""><label>Kategori</label><select id="devCategory">${cats.map(c=>`<option>${esc(c)}</option>`).join('')}</select><label>Prioritet</label><select id="devPrio"><option>Kritisk</option><option>Høy</option><option>Medium</option><option>Lav</option></select><label>Tildel / send til</label><textarea id="devAssign">${dpUniqueEmails([p.email,...dpBoardEmails(p),...dpSupplierEmails()]).join(', ')}</textarea><label>Bilder/dokumentasjon</label><input id="devFile" type="file" accept="image/*,.pdf,.doc,.docx"><button class="action primary" onclick="createDeviationFromForm()">Opprett avvik</button></div><div class="card s7"><div class="dash-title"><h3>Avviksliste</h3><button class="action" onclick="refreshCaseFlow()">Oppdater</button></div>${deviationsTableV1()}</div></div>`;
};
async function saveDeviationToSupabaseWithCategory(payload){
  let db=supabaseClient(),p=property(),insert={property_id:p.id,title:payload.title,description:payload.description,priority:normalizePriority(payload.priority),status:'Ny',category:payload.category};
  let result=await db.from('deviations').insert(insert).select().single();
  if(result.error&&String(result.error.message||'').includes('category')){
    delete insert.category;
    insert.description=`${payload.description}\n\nKategori: ${payload.category}`;
    result=await db.from('deviations').insert(insert).select().single();
  }
  if(result.error)throw result.error;
  await db.from('activity_log').insert({property_id:p.id,action:'Avvik opprettet',entity_type:'deviation',entity_id:result.data.id,metadata:{title:payload.title,priority:payload.priority,category:payload.category,actor:user().name,role:user().role}});
  return result.data;
}
createDeviationFromForm=async function(){
  let p=dpV1Ensure(),title=document.getElementById('devTitle').value.trim(),description=document.getElementById('devDesc').value,priority=document.getElementById('devPrio').value,file=document.getElementById('devFile')?.files?.[0],category=document.getElementById('devCategory')?.value||'Annet';
  let extra={reporter:document.getElementById('devReporter')?.value,building:document.getElementById('devBuilding')?.value,unit:document.getElementById('devUnit')?.value,category,assignedEmails:parseEmails(document.getElementById('devAssign')?.value)};
  if(!title){showDrawer('Mangler tittel','<div class="output">Skriv inn tittel på avviket.</div>');return}
  let row=null,storage='Lokal';
  try{
    row=await saveDeviationToSupabaseWithCategory({title,description:`${description}\n\nBygg: ${extra.building||'-'}\nLeilighet/område: ${extra.unit||'-'}\nKategori: ${category}\nInnsender: ${extra.reporter||'-'}\nTildelt: ${extra.assignedEmails.join(', ')}`,priority,category});
    storage='Supabase';
    if(file)await uploadPropertyDocument({category:'Annet',title:`Avvik ${title} - ${file.name}`,file,status:'Dokumentasjon'});
  }catch(e){
    if(isRealSession()){showDrawer('Avvik ble ikke lagret',`<div class="output">${esc(e.message)}</div>`);return}
    row={id:'AV-'+Date.now().toString().slice(-5),title,description,priority,status:'Ny',category,created_at:new Date().toISOString()};
    storage='Supabase-feil: '+e.message;
  }
  Object.assign(row,extra);
  p.deviations=p.deviations||[];
  p.deviations.unshift(row);
  row.display_id=dpFriendlyId(row,'AV',p.deviations);
  p.dev=p.deviations.length;
  p.openCases=p.deviations.filter(d=>d.status!=='Lukket').length;
  logActivity('Avvik opprettet',row.display_id);
  showDrawer('Avvik opprettet',`<table><tr><td>Saksnummer</td><td>${esc(row.display_id)}</td></tr>${dpTechnicalRow(row.id)}<tr><td>Kategori</td><td>${esc(category)}</td></tr><tr><td>Bygg</td><td>${esc(extra.building||'-')}</td></tr><tr><td>Tildelt</td><td>${esc(extra.assignedEmails.join(', ')||'-')}</td></tr><tr><td>Lagring</td><td>${esc(storage)}</td></tr></table><button class="action primary" onclick="showCreateWorkOrder('${esc(row.id)}')">Lag arbeidsordre</button><button class="action" onclick="showEmailFlow('deviation','${esc(row.id)}')">Send e-post</button>`);
};
