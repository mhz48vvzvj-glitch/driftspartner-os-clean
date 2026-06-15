/* Driftspartner OS module: 97-residents-board-production.js
   Production UI for residents and board members. Live writes only, with property_contacts fallback when board_members is not installed. */
function dpPersonKey(x){return String(x.id||x.email||x.name||'')}
function dpBoardSourceRows(){
  const p=ensurePropertyData(property());
  const members=(p.boardMembers||[]).map(x=>({...x,source:x.source||'board_members'}));
  const contacts=(p.propertyContacts||p.contacts||[])
    .filter(c=>/styre|leder|vara/i.test(String(c.role||c.type||'')))
    .map(c=>({id:c.id,name:c.name,role:c.role||'Styremedlem',email:c.email,phone:c.phone,notes:c.notes,periodStart:c.period_start,periodEnd:c.period_end,source:'property_contacts'}));
  const seen=new Set();
  return [...members,...contacts].filter(x=>{let k=(x.email||x.id||x.name||'').toLowerCase();if(seen.has(k))return false;seen.add(k);return true});
}
function dpResidentRows(){
  const p=ensurePropertyData(property());
  const users=(state.users||[])
    .filter(u=>normalizeRole(u.role)==='beboer'&&((u.properties||[]).includes(p.id)||normalizeRole(user().role)==='superadmin'))
    .map(u=>({...u,source:'app_user',login:true}));
  const contacts=(p.propertyContacts||p.contacts||[])
    .filter(c=>/bebo|resident/i.test(String(c.role||c.type||'')))
    .map(c=>({id:c.id,name:c.name,email:c.email,phone:c.phone,role:'beboer',unit:c.unit||c.notes||'',source:'property_contacts',login:false}));
  const seen=new Set();
  return [...users,...contacts].filter(x=>{let k=(x.email||x.id||x.name||'').toLowerCase();if(seen.has(k))return false;seen.add(k);return true});
}
function dpProductionRoleLabel(role){
  const r=normalizeRole(role);
  return ({beboer:'Beboer',styreleder:'Styreleder',styremedlem:'Styremedlem',vaktmester:'Vaktmester',leverandør:'Leverandor',leverandor:'Leverandor',forvalter:'Forvalter',superadmin:'Superadmin'})[r]||role||'-';
}
function boardOverview(){
  const p=ensurePropertyData(property()),rows=dpBoardSourceRows();
  return `<div class="grid">${dpLiveNotice()}<div class="card s12"><div class="dash-title"><div><h3>Styre for ${esc(p.name||p.customer||'valgt eiendom')}</h3><p class="muted">Styremedlemmer lagres live pa valgt eiendom og brukes som mottakere i styresaker og innkallinger.</p></div><button class="action primary" onclick="showBoardMemberForm()">Legg til styremedlem</button></div><table><tr><th>Navn</th><th>Rolle</th><th>E-post</th><th>Telefon</th><th>Periode</th><th>Notat</th><th>Handling</th></tr>${rows.length?rows.map((m,i)=>`<tr><td>${esc(m.name||'-')}</td><td>${esc(m.role||'-')}</td><td>${esc(m.email||'-')}</td><td>${esc(m.phone||'-')}</td><td>${esc([m.periodStart||m.period_start,m.periodEnd||m.period_end].filter(Boolean).join(' - ')||'-')}</td><td>${esc(m.notes||'')}</td><td><button class="action" onclick="showEmailFlow('board','${esc(m.id||m.email||i)}')">E-post</button><button class="action red" onclick="deleteBoardMemberProduction('${esc(m.id||m.email||i)}')">Slett</button></td></tr>`).join(''):'<tr><td colspan="7">Ingen styremedlemmer registrert.</td></tr>'}</table></div></div>`;
}
function showBoardMemberForm(){
  showDrawer('Legg til styremedlem',`<label>Navn</label><input id="boardName" value=""><label>Rolle</label><select id="boardRole"><option>Styreleder</option><option>Nestleder</option><option>Styremedlem</option><option>Vara</option></select><label>E-post</label><input id="boardEmail" value="" placeholder="navn@kunde.no"><label>Telefon</label><input id="boardPhone" value=""><label>Periode fra</label><input id="boardPeriodStart" type="date"><label>Periode til</label><input id="boardPeriodEnd" type="date"><label>Notat/ansvar</label><textarea id="boardNotes"></textarea><button class="action primary" onclick="saveBoardMember()">Lagre styremedlem</button>`);
}
async function dpInsertBoardMemberLive(member){
  dpRequireLiveWrite('lagre styremedlem');
  const db=supabaseClient(),p=property();
  const boardPayload={property_id:p.id,name:member.name,role:member.role,email:member.email,phone:member.phone,notes:member.notes,period_start:member.periodStart||null,period_end:member.periodEnd||null,created_by:user().id};
  try{
    const r=await db.from('board_members').insert(boardPayload).select().single();
    if(r.error)throw r.error;
    return {...member,id:r.data.id,source:'board_members'};
  }catch(error){
    const msg=String(error.message||'').toLowerCase();
    if(!(msg.includes('board_members')||msg.includes('relation')||msg.includes('column')))throw error;
    const contactPayload={property_id:p.id,name:member.name,role:member.role,email:member.email,phone:member.phone,notes:`${member.notes||''}${member.periodStart||member.periodEnd?` Periode: ${member.periodStart||'-'} - ${member.periodEnd||'-'}`:''}`.trim()};
    const c=await db.from('property_contacts').insert(contactPayload).select().single();
    if(c.error)throw c.error;
    return {...member,id:c.data.id,source:'property_contacts'};
  }
}
saveBoardMember=async function(){
  const p=ensurePropertyData(property());
  const member={
    name:document.getElementById('boardName')?.value.trim(),
    role:document.getElementById('boardRole')?.value.trim()||'Styremedlem',
    email:document.getElementById('boardEmail')?.value.trim(),
    phone:document.getElementById('boardPhone')?.value.trim(),
    notes:document.getElementById('boardNotes')?.value.trim(),
    periodStart:document.getElementById('boardPeriodStart')?.value||'',
    periodEnd:document.getElementById('boardPeriodEnd')?.value||''
  };
  if(!member.name){showDrawer('Mangler navn','<div class="output">Skriv inn navn pa styremedlemmet.</div>');return}
  if(!member.email||!member.email.includes('@')){showDrawer('Mangler e-post','<div class="output">Styremedlem ma ha gyldig e-postadresse.</div>');return}
  try{
    const saved=await dpInsertBoardMemberLive(member);
    p.boardMembers=p.boardMembers||[];
    p.boardMembers.push(saved);
    logActivity('Styremedlem lagt til',saved.id||saved.email);
    showDrawer('Styremedlem lagret',`<table><tr><td>Navn</td><td>${esc(saved.name)}</td></tr><tr><td>Rolle</td><td>${esc(saved.role)}</td></tr><tr><td>E-post</td><td>${esc(saved.email)}</td></tr><tr><td>Lagring</td><td>Supabase</td></tr></table><button class="action primary" onclick="openMain('board',null);openTab('Styreoversikt')">Til styreoversikt</button>`);
  }catch(e){dpShowSupabaseError('Styremedlem ble ikke lagret',e,'board_members / property_contacts')}
}
async function deleteBoardMemberProduction(key){
  const p=ensurePropertyData(property()),rows=dpBoardSourceRows(),m=rows.find(x=>String(x.id)===String(key)||String(x.email)===String(key));
  if(!m)return;
  if(!confirm(`Slette styremedlem ${m.name||m.email||''}?`))return;
  try{
    dpRequireLiveWrite('slette styremedlem');
    if(isUuid(m.id)){
      const table=m.source==='property_contacts'?'property_contacts':'board_members';
      const r=await supabaseClient().from(table).delete().eq('id',m.id);
      if(r.error)throw r.error;
    }else throw new Error('Styremedlemmet mangler Supabase-ID og kan ikke slettes sikkert.');
    p.boardMembers=(p.boardMembers||[]).filter(x=>dpPersonKey(x)!==dpPersonKey(m));
    p.propertyContacts=(p.propertyContacts||[]).filter(x=>dpPersonKey(x)!==dpPersonKey(m));
    logActivity('Styremedlem slettet',m.id);
    openMain('board',null);openTab('Styreoversikt');
  }catch(e){dpShowSupabaseError('Styremedlem ble ikke slettet',e,'board_members / property_contacts')}
}
function ResidentUsersPage(){
  const p=property(),rows=dpResidentRows();
  return `<div class="grid">${dpLiveNotice()}<div class="card s12"><div class="dash-title"><div><h3>Beboere for ${esc(p.name||'valgt eiendom')}</h3><p class="muted">Beboere kan opprettes med innlogging. Beboerrollen far kun melde avvik og se egne relevante sider.</p></div><button class="action primary" onclick="showResidentUserForm()">Legg til beboer</button></div><table><tr><th>Navn</th><th>E-post</th><th>Telefon</th><th>Enhet</th><th>Innlogging</th><th>Handling</th></tr>${rows.length?rows.map((r,i)=>`<tr><td>${esc(r.name||'-')}</td><td>${esc(r.email||'-')}</td><td>${esc(r.phone||'-')}</td><td>${esc(r.unit||'-')}</td><td>${r.login?'<span class="badge ok">Aktiv bruker</span>':'<span class="badge warn">Kontakt</span>'}</td><td><button class="action" onclick="showEmailFlow('resident','${esc(r.id||r.email||i)}')">E-post</button><button class="action red" onclick="deleteResidentProduction('${esc(r.id||r.email||i)}')">Slett</button></td></tr>`).join(''):'<tr><td colspan="6">Ingen beboere registrert.</td></tr>'}</table></div></div>`;
}
function showResidentUserForm(){
  showDrawer('Legg til beboer',`<label>Navn</label><input id="newUserName" value=""><label>E-post</label><input id="newUserEmail" value="" placeholder="navn@kunde.no"><label>Telefon</label><input id="newUserPhone" value=""><label>Leilighet/enhet</label><input id="residentUnit" value=""><input id="newUserRole" type="hidden" value="beboer"><label>Eiendom</label><select id="newUserProperty">${dpPropertyOptions()}</select><input id="newUserAccessRole" type="hidden" value="resident"><label>Midlertidig passord</label><input id="newUserPassword" type="password" placeholder="La sta tom for automatisk"><button class="action primary" onclick="saveResidentUserProduction()">Opprett beboer med innlogging</button><button class="action" onclick="saveResidentContactOnly()">Lagre kontakt uten innlogging</button><div id="newUserOut" class="output">Innlogging krever publisert Netlify-side og Supabase servernokkel i Functions.</div>`);
}
async function saveResidentUserProduction(){
  await saveUser();
  const unit=document.getElementById('residentUnit')?.value.trim();
  const email=document.getElementById('newUserEmail')?.value.trim();
  if(unit&&email){
    const u=(state.users||[]).find(x=>String(x.email||'').toLowerCase()===email.toLowerCase());
    if(u)u.unit=unit;
  }
}
async function saveResidentContactOnly(){
  const p=ensurePropertyData(property());
  const name=document.getElementById('newUserName')?.value.trim(),email=document.getElementById('newUserEmail')?.value.trim(),phone=document.getElementById('newUserPhone')?.value.trim(),unit=document.getElementById('residentUnit')?.value.trim();
  if(!name||!email.includes('@')){showDrawer('Mangler info','<div class="output">Fyll inn navn og gyldig e-post.</div>');return}
  try{
    dpRequireLiveWrite('lagre beboer');
    const r=await supabaseClient().from('property_contacts').insert({property_id:p.id,name,role:'Beboer',email,phone,notes:unit?`Enhet: ${unit}`:''}).select().single();
    if(r.error)throw r.error;
    p.propertyContacts=p.propertyContacts||[];
    p.propertyContacts.push({id:r.data.id,name,role:'Beboer',email,phone,unit,source:'property_contacts'});
    logActivity('Beboer registrert',r.data.id);
    showDrawer('Beboer lagret',`<table><tr><td>Navn</td><td>${esc(name)}</td></tr><tr><td>E-post</td><td>${esc(email)}</td></tr><tr><td>Enhet</td><td>${esc(unit||'-')}</td></tr><tr><td>Innlogging</td><td>Ikke opprettet</td></tr></table><button class="action primary" onclick="openMain('admin',null);openTab('Beboere')">Til beboere</button>`);
  }catch(e){dpShowSupabaseError('Beboer ble ikke lagret',e,'property_contacts')}
}
async function deleteResidentProduction(key){
  const p=ensurePropertyData(property()),rows=dpResidentRows(),r=rows.find(x=>String(x.id)===String(key)||String(x.email)===String(key));
  if(!r)return;
  if(!confirm(`Slette beboer ${r.name||r.email||''}?`))return;
  try{
    dpRequireLiveWrite('slette beboer');
    if(r.source==='property_contacts'&&isUuid(r.id)){
      const del=await supabaseClient().from('property_contacts').delete().eq('id',r.id);
      if(del.error)throw del.error;
      p.propertyContacts=(p.propertyContacts||[]).filter(x=>dpPersonKey(x)!==dpPersonKey(r));
    }else if(r.source==='app_user'&&isUuid(r.id)){
      const del=await supabaseClient().from('property_access').delete().eq('user_id',r.id).eq('property_id',p.id);
      if(del.error)throw del.error;
      const u=state.users.find(x=>String(x.id)===String(r.id));
      if(u)u.properties=(u.properties||[]).filter(id=>id!==p.id);
    }else throw new Error('Beboeren mangler Supabase-ID og kan ikke slettes sikkert.');
    logActivity('Beboer fjernet',r.id||r.email);
    openMain('admin',null);openTab('Beboere');
  }catch(e){dpShowSupabaseError('Beboer ble ikke slettet',e,'property_access / property_contacts')}
}
app.board.tabs['Styreoversikt']=()=>boardOverview();
app.property.tabs['Styreoversikt']=()=>boardOverview();
app.admin.tabs['Beboere']=()=>ResidentUsersPage();
