/* Driftspartner OS module: 21-admin-users-customers.js
   User administration, board overview and customer/property creation.
   Source: 20-auth-supabase.js:18-51
*/
function usersAdmin(){let props=state.properties.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');return `<div class="grid"><div class="card s8"><h3>Brukere</h3><table><tr><th>Navn</th><th>Rolle</th><th>E-post</th><th>Telefon</th><th>Eiendommer</th></tr>${state.users.map(u=>`<tr><td>${u.name}</td><td>${u.role}</td><td>${u.email||'-'}</td><td>${u.phone||'-'}</td><td>${u.role==='superadmin'?'Alle':state.properties.filter(p=>u.properties.includes(p.id)).map(p=>p.name).join(', ')}</td></tr>`).join('')}</table></div><div class="card s4"><h3>Legg til bruker</h3><label>Navn</label><input id="newUserName" value="Ny bruker"><label>E-post</label><input id="newUserEmail" value="bruker@kunde.no"><label>Telefon</label><input id="newUserPhone" value="900 00 000"><label>Rolle</label><select id="newUserRole"><option>styreleder</option><option>vaktmester</option><option>leverandør</option><option>superadmin</option></select><label>Eiendom</label><select id="newUserProperty">${props}</select><button class="action green" onclick="saveUser()">Lagre bruker</button></div></div>`}
function saveUser(){let role=document.getElementById('newUserRole').value,prop=document.getElementById('newUserProperty').value,id='u-'+Date.now();let u={id,name:document.getElementById('newUserName').value,email:document.getElementById('newUserEmail').value,phone:document.getElementById('newUserPhone').value,role,org:property().customer,properties:role==='superadmin'?state.properties.map(p=>p.id):[prop]};if(!u.email.includes('@')){showDrawer('Mangler e-post',`<div class="output">Brukeren må ha gyldig e-post.</div>`);return}state.users.push(u);logActivity(`Bruker lagt til: ${u.name}`,u.id);renderUserSelect();openTab('Brukere');act('Bruker lagt til')}
function boardOverview(){let p=ensurePropertyData(property());return `<div class="grid"><div class="card s8"><h3>Styre for ${p.customer}</h3><table><tr><th>Navn</th><th>Rolle</th><th>E-post</th><th>Telefon</th><th>Notat/div</th><th>Handling</th></tr>${p.boardMembers.map((m,i)=>`<tr><td>${m.name}</td><td>${m.role}</td><td>${m.email}</td><td>${m.phone}</td><td>${m.notes||''}</td><td><button class="action" onclick="showEmailFlow('board','Styre-${i+1}')">E-post</button></td></tr>`).join('')}</table></div><div class="card s4"><h3>Legg til styremedlem</h3><label>Navn</label><input id="boardName" value="Nytt styremedlem"><label>Rolle</label><input id="boardRole" value="Styremedlem"><label>E-post</label><input id="boardEmail" value="styre@kunde.no"><label>Telefon</label><input id="boardPhone" value="900 00 000"><label>Notat/div</label><textarea id="boardNotes">Ansvar/kommentar</textarea><button class="action green" onclick="saveBoardMember()">Lagre styremedlem</button></div></div>`}
function saveBoardMember(){let p=ensurePropertyData(property());let m={name:document.getElementById('boardName').value,role:document.getElementById('boardRole').value,email:document.getElementById('boardEmail').value,phone:document.getElementById('boardPhone').value,notes:document.getElementById('boardNotes').value};if(!m.email.includes('@')){showDrawer('Mangler e-post',`<div class="output">Styremedlem må ha gyldig e-post.</div>`);return}p.boardMembers.push(m);logActivity(`Styremedlem lagt til: ${m.name}`,'Styre');openTab('Styreoversikt');act('Styremedlem lagt til')}
function showCreateCustomerCard(){
  if(!canCreateProperty()){showDrawer('Ingen tilgang',`<div class="output">Bare superadmin kan opprette nye kundekort og eiendommer. ${user().name} kan kun jobbe med egne eiendommer.</div>`);return}
  showDrawer('Opprett kundekort og eiendom',`<div class="grid"><div class="card s6"><h3>Kunde</h3><label>Kundenavn</label><input id="custName" value="Nytt Borettslag"><label>Org.nr</label><input id="custOrgnr" value="999 888 777"><label>Kontaktperson</label><input id="custContact" value="Navn Navnesen"><label>E-post</label><input id="custEmail" value="styret@kunde.no"><label>Fakturaadresse</label><input id="custInvoice" value="Fakturaadresse 1"></div><div class="card s6"><h3>Eiendom</h3><label>Eiendomsnavn</label><input id="propName" value="Nytt Borettslag"><label>Adresse</label><input id="propAddress" value="Adresse 1"><label>Type</label><select id="propType"><option>Borettslag</option><option>Sameie</option><option>Næring</option></select><label>Ansvarlig forvalter</label><input id="propManager" value="Driftspartner Nord"><label>SLA</label><select id="propSla"><option>Normal</option><option>Prioritert</option><option>Beredskap 24/7</option></select><button class="action green" onclick="createCustomerCard()">Lagre kundekort</button></div></div>`)
}
async function createCustomerCard(){
  let id='p-'+Date.now();
  let p={id,customer:document.getElementById('custName').value,name:document.getElementById('propName').value,address:document.getElementById('propAddress').value,type:document.getElementById('propType').value,contact:document.getElementById('custContact').value,email:document.getElementById('custEmail').value,orgnr:document.getElementById('custOrgnr').value,invoiceAddress:document.getElementById('custInvoice').value,manager:document.getElementById('propManager').value,sla:document.getElementById('propSla').value,paymentStatus:'Ny kunde',boardMembers:[{name:document.getElementById('custContact').value,role:'Styreleder',email:document.getElementById('custEmail').value,phone:'',notes:'Opprettet fra kundekort'}],agreements:['Oppstart'],buildings:1,area:0,score:70,openCases:0,dev:0,wo:0,invoice:0,margin:0,risk:'Ikke kartlagt',capital:'Ikke beregnet',fdv:[],hms:['Brannkontroll','Vernerunde'],documents:[],activity:[],offers:[]};
  try{
    let db=supabaseClient();
    let {data:customer,error:custErr}=await db.from('customers').insert({name:p.customer,org_number:p.orgnr,invoice_address:p.invoiceAddress,billing_email:p.email,status:'active'}).select().single();
    if(custErr)throw custErr;
    let {data:prop,error:propErr}=await db.from('properties').insert({customer_id:customer.id,name:p.name,address:p.address,property_type:p.type,sla:p.sla,risk_summary:p.risk,status:'active'}).select().single();
    if(propErr)throw propErr;
    await db.from('property_contacts').insert({property_id:prop.id,name:p.contact,role:'Styreleder',email:p.email,phone:'',notes:'Opprettet fra Driftspartner OS'});
    p.id=prop.id;
    p.customer_id=customer.id;
    id=prop.id;
    p.activity=[{time:'Nå',actor:user().name,action:'Kundekort lagret i Supabase',caseId:prop.id}];
  }catch(e){
    showDrawer('Kun lagret lokalt',`<div class="output">Eiendommen ble ikke lagret i Supabase: ${e.message}\n\nDen ble ikke lagret permanent og blir borte ved refresh. Sjekk at Supabase URL/nøkkel er satt, og at tabellene customers, properties og property_contacts finnes.</div>`);
  }
  state.properties.push(p);
  if(!state.users.find(u=>u.id==='u-admin').properties.includes(id))state.users.find(u=>u.id==='u-admin').properties.push(id);
  state.selectedProperty=id;
  refresh();
  ensurePropertyData(p);logActivity('Kundekort opprettet',p.id);
  showDrawer('Kundekort opprettet',`<table><tr><td>Kunde</td><td>${p.customer}</td></tr><tr><td>Org.nr</td><td>${p.orgnr}</td></tr><tr><td>Eiendom</td><td>${p.name}</td></tr><tr><td>Adresse</td><td>${p.address}</td></tr><tr><td>Lagring</td><td>${p.customer_id?'Supabase':'Supabase-feil'}</td></tr><tr><td>Tilgang</td><td>Superadmin</td></tr></table>`);
  act('Ny kunde og eiendom opprettet')
}

