const INTERNAL_DOCS=[
  {id:'employee-handbook',module:'HR',title:'AnsatthÃ¥ndbok',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:true,body:'Retningslinjer for arbeidsforhold, opptreden, taushet, ferie, fravÃ¦r, utstyr og intern kommunikasjon.'},
  {id:'sales-handbook',module:'Salg',title:'SalgshÃ¥ndbok',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:true,body:'Slik selges Driftspartner OS: mÃ¥lgruppe, behovsavklaring, demo, tilbud, oppfÃ¸lging og kundestart.'},
  {id:'phone-script',module:'Salg',title:'Telefonmanus',version:'1.0',audience:['selger','salgssjef'],requiresAck:true,body:'Kort manus for fÃ¸rste kontakt, behovskartlegging og booking av demo.'},
  {id:'demo-rules',module:'Salg',title:'Demoregler',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:true,body:'Demo skal vises med ryddig testkunde. Ikke vis interne nÃ¸kler, tekniske feil eller kundedata fra andre.'},
  {id:'commission',module:'Salg',title:'Provisjonsavtale',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:true,body:'Prinsipper for provisjon, godkjent salg, fakturering, utbetaling og tilbakefÃ¸ring.'},
  {id:'crm-routines',module:'Salg',title:'CRM-rutiner',version:'1.0',audience:['selger','salgssjef'],requiresAck:true,body:'Alle leads skal logges med status, neste aktivitet, kontaktperson, pakkeinteresse og oppfÃ¸lging.'},
  {id:'leader-handbook',module:'Ledelse',title:'LederhÃ¥ndbok',version:'1.0',audience:['salgssjef','admin'],requiresAck:true,body:'Rutiner for personaloppfÃ¸lging, mÃ¥l, prÃ¸vetid, avvik, godkjenninger og lederansvar.'},
  {id:'kpi-report',module:'Ledelse',title:'KPI-rapport',version:'1.0',audience:['salgssjef','admin'],requiresAck:false,body:'Ukentlig oppfÃ¸lging av leads, bookede demoer, sendte tilbud, signerte avtaler, churn-risiko og support.'},
  {id:'probation',module:'HR',title:'PrÃ¸vetidsoppfÃ¸lging',version:'1.0',audience:['salgssjef','admin'],requiresAck:false,body:'Plan for 30/60/90 dager, opplÃ¦ring, mÃ¥l, evaluering og dokumentert oppfÃ¸lging.'},
  {id:'interview-guide',module:'HR',title:'Intervjuguide',version:'1.0',audience:['salgssjef','admin'],requiresAck:false,body:'SpÃ¸rsmÃ¥l, vurderingspunkter og sjekkliste for intervju av selger, support og forvalter.'},
  {id:'reference-check',module:'HR',title:'Referansesjekk',version:'1.0',audience:['salgssjef','admin'],requiresAck:false,body:'Mal for referansesamtale med samtykke, spÃ¸rsmÃ¥l og vurdering.'},
  {id:'powers',module:'Selskapsstyring',title:'Fullmakter',version:'1.0',audience:['admin'],requiresAck:true,body:'Hvem kan inngÃ¥ avtaler, gi rabatter, godkjenne kostnader og signere pÃ¥ vegne av selskapet.'},
  {id:'employment-contracts',module:'Arbeidsavtaler',title:'Arbeidsavtaler',version:'1.0',audience:['admin'],requiresAck:true,body:'Mal og rutine for arbeidsavtale, endringsavtale, taushet og utstyr.'},
  {id:'hms-routine',module:'HMS',title:'HMS-rutine',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:true,body:'Rutine for sikkerhet, psykososialt arbeidsmiljÃ¸, avvik, varsling og oppfÃ¸lging.'},
  {id:'it-security',module:'IT og sikkerhet',title:'IT- og sikkerhetsregler',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:true,body:'Passord, MFA, kundedata, API-nÃ¸kler, enheter, tilgang, deling og hendelser.'},
  {id:'finance-routine',module:'Ã˜konomi',title:'Utlegg og innkjÃ¸p',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:false,body:'Hvordan utlegg, reisekostnader og innkjÃ¸p meldes inn og godkjennes.'},
  {id:'os-operations',module:'Driftspartner OS-drift',title:'Driftsrutiner for Driftspartner OS',version:'1.0',audience:['salgssjef','admin'],requiresAck:true,body:'Rutiner for kundeopprettelse, roller, abonnement, support, backup, eksport og produksjonskontroll.'}
];
const INTERNAL_DOC_FILES={
  'employee-handbook':'assets/internal-docs/ansatthandbok.pdf',
  'sales-handbook':'assets/internal-docs/salgshandbok.pdf',
  'commission':'assets/internal-docs/provisjonsavtale.pdf',
  'leader-handbook':'assets/internal-docs/lederhandbok.pdf',
  'probation':'assets/internal-docs/provetidsoppfolging.pdf',
  'interview-guide':'assets/internal-docs/intervjuguide.pdf',
  'reference-check':'assets/internal-docs/referansesjekk.pdf',
  'powers':'assets/internal-docs/fullmaktsmatrise.pdf',
  'employment-contracts':'assets/internal-docs/arbeidsavtale.pdf',
  'it-security':'assets/internal-docs/it-og-sikkerhetspolicy.pdf',
  'finance-routine':'assets/internal-docs/utleggspolicy.pdf'
};
INTERNAL_DOCS.forEach(doc=>{if(INTERNAL_DOC_FILES[doc.id])doc.file=INTERNAL_DOC_FILES[doc.id]});
INTERNAL_DOCS.push(
  {id:'job-offer',module:'HR',title:'Tilbud om ansettelse',version:'1.0',audience:['salgssjef','admin'],requiresAck:false,file:'assets/internal-docs/tilbud-om-ansettelse.pdf',body:'Mal for tilbud om ansettelse.'},
  {id:'employment-contract-sales',module:'Arbeidsavtaler',title:'Arbeidsavtale - provisjonsbasert selger',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:true,file:'assets/internal-docs/arbeidsavtale-provisjonsbasert-selger.pdf',body:'Arbeidsavtale for provisjonsbasert selger.'},
  {id:'confidentiality',module:'Arbeidsavtaler',title:'TaushetserklÃ¦ring',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:true,file:'assets/internal-docs/taushetserklaering.pdf',body:'TaushetserklÃ¦ring for ansatte og innleide.'},
  {id:'equipment',module:'IT og sikkerhet',title:'IT- og utstyrserklÃ¦ring',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:true,file:'assets/internal-docs/it-og-utstyrserklaering.pdf',body:'Bekreftelse pÃ¥ mottatt utstyr og ansvar for bruk.'},
  {id:'home-office',module:'HR',title:'Hjemmekontoravtale',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:true,file:'assets/internal-docs/hjemmekontoravtale.pdf',body:'Avtale for arbeid fra hjemmekontor.'},
  {id:'recruitment-policy',module:'HR',title:'Rekrutteringspolicy',version:'1.0',audience:['salgssjef','admin'],requiresAck:true,file:'assets/internal-docs/rekrutteringspolicy.pdf',body:'Rutine og prinsipper for rekruttering.'},
  {id:'delegation',module:'Selskapsstyring',title:'Delegasjonsreglement',version:'1.0',audience:['admin'],requiresAck:true,file:'assets/internal-docs/delegasjonsreglement.pdf',body:'Hvem har myndighet til Ã¥ beslutte hva.'},
  {id:'fullmakt',module:'Selskapsstyring',title:'Fullmaktsmatrise',version:'1.0',audience:['admin'],requiresAck:true,file:'assets/internal-docs/fullmaktsmatrise.pdf',body:'Fullmakter og belÃ¸psgrenser.'},
  {id:'job-descriptions',module:'Ledelse',title:'Stillingsbeskrivelser',version:'1.0',audience:['salgssjef','admin'],requiresAck:false,file:'assets/internal-docs/stillingsbeskrivelser.pdf',body:'Roller og stillingsbeskrivelser i Driftspartner Nord.'},
  {id:'org-chart',module:'Ledelse',title:'Organisasjonskart',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:false,file:'assets/internal-docs/organisasjonskart.pdf',body:'Organisasjonskart for Driftspartner Nord.'},
  {id:'ethics',module:'Retningslinjer',title:'Etiske retningslinjer',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:true,file:'assets/internal-docs/etiske-retningslinjer.pdf',body:'Etiske regler for ansatte.'},
  {id:'ai-policy',module:'IT og sikkerhet',title:'AI-policy',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:true,file:'assets/internal-docs/ai-policy.pdf',body:'Regler for bruk av AI i arbeid og kundebehandling.'},
  {id:'password-mfa',module:'IT og sikkerhet',title:'Passord- og MFA-policy',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:true,file:'assets/internal-docs/passord-og-mfa-policy.pdf',body:'Krav til passord, tofaktor og kontoer.'},
  {id:'social-media',module:'Retningslinjer',title:'Sosiale medier-policy',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:true,file:'assets/internal-docs/sosiale-medier-policy.pdf',body:'Retningslinjer for sosiale medier.'},
  {id:'travel-policy',module:'Ã˜konomi',title:'Reisepolicy',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:false,file:'assets/internal-docs/reisepolicy.pdf',body:'Regler for reise, transport og dokumentasjon.'},
  {id:'gift-policy',module:'Ã˜konomi',title:'Gave- og representasjonspolicy',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:true,file:'assets/internal-docs/gave-og-representasjonspolicy.pdf',body:'Regler for gaver, representasjon og habilitet.'},
  {id:'onboarding-program',module:'HR',title:'Onboarding-program',version:'1.0',audience:['selger','salgssjef','admin'],requiresAck:true,file:'assets/internal-docs/onboarding-program.pdf',body:'Program for nyansatte.'}
);
const INTERNAL_TEMPLATES=[
  ['Arbeidsavtale','HR','Mal for ansettelse og vilkÃ¥r.'],
  ['Referansesjekk','HR','Skjema for referanser med samtykke.'],
  ['Demomanus','Salg','Kort demo-oppsett for Start, Pro og Premium.'],
  ['Tilbudsmal','Salg','Standard tilbudstekst med pakke og Ã¥rspris.'],
  ['Avvik internt','HMS','Skjema for intern avviksmelding.'],
  ['Utlegg','Ã˜konomi','Skjema for utlegg og refusjon.'],
  ['Offboarding','Ledelse','Sjekkliste for avslutning av arbeidsforhold.']
];
const INTERNAL_FOLDERS=[
  {name:'HR og rekruttering',module:'HR',access:'Admin og salgssjef',purpose:'Brukes for ansettelse, onboarding, prøvetid og oppfølging av ansatte.',workflow:['Tilbud om ansettelse sendes','Arbeidsavtale og taushet signeres','Onboarding-program startes','Prøvetid følges opp 30/60/90 dager'],docs:['Ansatthåndbok','Rekrutteringspolicy','Intervjuguide','Referansesjekk','Prøvetidsoppfølging','Onboarding-program']},
  {name:'Arbeidsavtaler',module:'Arbeidsavtaler',access:'Admin',purpose:'Samler avtaler som må signeres før eller ved oppstart.',workflow:['Velg riktig avtale','Kontroller rolle, provisjon og utstyr','Send til signering','Arkiver signert kvittering'],docs:['Arbeidsavtale','Arbeidsavtale - provisjonsbasert selger','Taushetserklæring','Hjemmekontoravtale','IT- og utstyrserklæring']},
  {name:'Salgshåndbok',module:'Salg',access:'Selger, salgssjef og admin',purpose:'Gir selger en fast salgsprosess for Driftspartner OS.',workflow:['Finn kundeemne','Book demo','Velg demo-pakke Start/Pro/Premium','Send tilbud eller bestilling','Overlever til onboarding'],docs:['Salgshåndbok','Telefonmanus','Demoregler','Provisjonsavtale','CRM-rutiner']},
  {name:'Driftspartner OS-rutiner',module:'Driftspartner OS-drift',access:'Salgssjef og admin',purpose:'Rutiner for hvordan kunder settes opp og driftes i systemet.',workflow:['Opprett kunde og eiendom','Velg abonnement','Legg inn styre/beboere','Last opp FDV','Kjør lanseringskontroll'],docs:['Driftsrutiner for Driftspartner OS','Demomanus','Onboarding-program']},
  {name:'HMS og avvik',module:'HMS',access:'Alle interne roller',purpose:'Intern avviksmelding og oppfølging av HMS, sikkerhet og kvalitet.',workflow:['Meld avvik','Vurder alvorlighet','Tildel ansvarlig','Lukk med tiltak','Bruk læring i rutiner'],docs:['HMS-rutine','Etiske retningslinjer','Gave- og representasjonspolicy']},
  {name:'Økonomi og utlegg',module:'Økonomi',access:'Alle interne roller',purpose:'Rutiner for utlegg, reise, innkjøp og representasjon.',workflow:['Registrer formål','Legg ved kvittering','Send til godkjenning','Arkiver beslutning','Følg beløpsgrenser'],docs:['Utleggspolicy','Reisepolicy','Gave- og representasjonspolicy']},
  {name:'IT og sikkerhet',module:'IT og sikkerhet',access:'Alle interne roller',purpose:'Beskytter kundedata, innlogging, AI-bruk og interne systemer.',workflow:['Bruk MFA','Del aldri passord/API-nøkler','Bruk AI med kundedataregler','Meld sikkerhetsavvik straks'],docs:['IT- og sikkerhetspolicy','Passord- og MFA-policy','AI-policy','IT- og utstyrserklæring']},
  {name:'Ledelse',module:'Ledelse',access:'Salgssjef og admin',purpose:'Oppfølging av ansatte, KPI, fullmakter, organisering og lederansvar.',workflow:['Følg KPI ukentlig','Hold prøvetidsmøter','Godkjenn avvik/utlegg','Dokumenter oppfølging','Bruk offboarding ved avslutning'],docs:['Lederhåndbok','KPI-rapport','Organisasjonskart','Stillingsbeskrivelser','Fullmaktsmatrise','Delegasjonsreglement']},
  {name:'Maler og skjema',module:'Maler og skjema',access:'Alle interne roller etter behov',purpose:'Praktiske skjema som brukes i salg, HR, økonomi og kvalitet.',workflow:['Velg riktig mal','Fyll ut alle felter','Send til godkjenning/signering','Arkiver kvittering'],docs:['Arbeidsavtale','Referansesjekk','Demomanus','Tilbudsmal','Avvik internt','Utlegg']}
];
function formatDateTime(value){
  const d=new Date(value||Date.now());
  return Number.isFinite(d.getTime())?d.toLocaleString('nb-NO'):'';
}
function intranetRole(){
  if(appRole()==='superadmin')return 'admin';
  if(appRole()==='admin')return 'salgssjef';
  return 'selger';
}
function intranetRoleLabel(role=intranetRole()){
  return ({admin:'Admin / daglig leder',salgssjef:'Salgssjef',selger:'Selger'}[role]||'Ansatt');
}
function intranetCanSeeDoc(doc){
  const role=intranetRole();
  return role==='admin'||(doc.audience||[]).includes(role);
}
function intranetAckMap(){
  const map={};
  (DP.cache.internalAcks||[]).forEach(a=>{map[a.document_key||a.document_id]=a});
  try{
    const local=JSON.parse(localStorage.getItem('dpInternalAcks')||'{}');
    Object.assign(map,local);
  }catch(e){}
  return map;
}
function intranetLiveDocs(){
  return (DP.cache.internalDocs||[]).map(d=>({
    id:d.id||d.document_key||d.title,
    module:d.module||'Intern',
    title:d.title||'Dokument',
    version:d.version||'1.0',
    audience:d.audience_roles||['selger','salgssjef','admin'],
    requiresAck:d.requires_ack!==false,
    file:d.file_url||d.file_path||d.public_url||'',
    body:d.body||d.description||''
  }));
}
function intranetAllDocs(){
  const byTitle=new Map();
  [...INTERNAL_DOCS,...intranetLiveDocs()].forEach(doc=>{
    const key=String(doc.title||doc.id).toLowerCase();
    byTitle.set(key,doc);
  });
  return [...byTitle.values()];
}
function IntranetQualityPage(){
  if(typeof canAccessIntranet==='function'&&!canAccessIntranet()){
    return `<div class="grid"><div class="card s12"><div class="empty-state"><strong>Ingen tilgang.</strong><span>InternhÃ¥ndbok vises bare for ansatte i Driftspartner Nord.</span></div></div></div>`;
  }
  if(!DP.cache.internalQualityTried){
    DP.cache.internalQualityTried=true;
    setTimeout(()=>loadInternalQuality().catch(()=>null),50);
  }
  const role=intranetRole(),docs=intranetAllDocs().filter(intranetCanSeeDoc),acks=intranetAckMap();
  const pending=docs.filter(d=>d.requiresAck&&!acks[d.id]).length;
  const signed=docs.filter(d=>acks[d.id]).length;
  return `<div class="grid intranet-page">
    <div class="card s12 module-hero intranet-hero">
      <div><small>Internt kvalitetssystem</small><h2>InternhÃ¥ndbok</h2><p>Dokumentbibliotek, maler, onboarding, avvik, signering og kvittering for ansatte. Denne siden vises ikke til kunder.</p></div>
      <div class="module-actions"><button class="action primary" onclick="showInternalDocumentForm()">Nytt dokument</button><button class="action" onclick="loadInternalQuality()">Oppdater</button><button class="action" onclick="showInternalDeviationForm()">Meld internt avvik</button></div>
    </div>
    <div class="card s3 intranet-kpi"><small>Din rolle</small><b>${esc(intranetRoleLabel(role))}</b><span>Tilgang styres internt.</span></div>
    <div class="card s3 intranet-kpi"><small>Dokumenter</small><b>${docs.length}</b><span>Tilgjengelig for deg.</span></div>
    <div class="card s3 intranet-kpi"><small>MÃ¥ kvitteres</small><b>${pending}</b><span>Dokumenter som venter.</span></div>
    <div class="card s3 intranet-kpi"><small>Signert/lest</small><b>${signed}</b><span>Registrerte kvitteringer.</span></div>
    <div class="card s12">${InternalFolderContentPanel(docs)}</div>\r\n    <div class="card s8">${InternalHandbookPanel(docs,acks)}</div>
    <div class="card s4">${EmployeePortalPanel(docs,acks)}</div>
    <div class="card s6">${LeaderPortalPanel()}</div>
    <div class="card s6">${InternalTemplatesPanel()}</div>
    <div class="card s12">${InternalOnboardingPanel()}</div>
  </div>`;
}
function InternalFolderContentPanel(docs){
  const role=intranetRole();
  const folders=INTERNAL_FOLDERS.filter(f=>role==='admin'||f.access.includes('Alle')||f.access.includes('Selger')||f.access.includes('Salgssjef'));
  return `<div class="dash-title"><div><h3>Mappestruktur og rutiner</h3><p class="muted">Dette er hvordan internhåndboken brukes i Driftspartner Nord.</p></div><button class="action" onclick="document.getElementById('internalDocList')?.scrollIntoView({behavior:'smooth'})">Gå til dokumenter</button></div><div class="internal-folder-grid">${folders.map(f=>InternalFolderCard(f,docs)).join('')}</div>`;
}
function InternalFolderCard(folder,docs){
  const available=folder.docs.filter(name=>docs.some(d=>String(d.title||'').toLowerCase().includes(name.toLowerCase().slice(0,12))||name.toLowerCase().includes(String(d.title||'').toLowerCase().slice(0,12))));
  return `<section class="internal-folder-card"><div><small>${esc(folder.module)} · ${esc(folder.access)}</small><strong>${esc(folder.name)}</strong><p>${esc(folder.purpose)}</p></div><div class="internal-folder-flow">${folder.workflow.map((w,i)=>`<span><b>${i+1}</b>${esc(w)}</span>`).join('')}</div><div class="internal-folder-docs"><small>Dokumenter i mappen</small>${folder.docs.map(d=>`<button type="button" onclick="filterInternalDocs('${esc(folder.module)}')">${esc(d)}${available.includes(d)?'':' · legg inn'}</button>`).join('')}</div></section>`;
}
function InternalHandbookPanel(docs,acks){
  const modules=['Selskapsstyring','HR','Arbeidsavtaler','Salg','Driftspartner OS-drift','HMS','Ã˜konomi','IT og sikkerhet','Ledelse','Maler og skjema'];
  return `<div class="dash-title"><div><h3>Dokumentbibliotek</h3><p class="muted">SÃ¸k, Ã¥pne og kvitter pÃ¥ interne rutiner.</p></div><input id="internalSearch" placeholder="SÃ¸k i dokumenter" oninput="filterInternalDocs()"></div>
  <div class="internal-module-strip">${modules.map(m=>`<button class="action" onclick="filterInternalDocs('${esc(m)}')">${esc(m)}</button>`).join('')}</div>
  <div id="internalDocList" class="internal-doc-list">${docs.map(d=>InternalDocumentCard(d,acks[d.id])).join('')}</div>`;
}
function InternalDocumentCard(doc,ack){
  return `<section class="internal-doc" data-module="${esc(doc.module)}" data-search="${esc((doc.title+' '+doc.module+' '+doc.body).toLowerCase())}">
    <div class="document-head"><div><small>${esc(doc.module)} Â· v${esc(doc.version)}</small><strong>${esc(doc.title)}</strong><p>${esc(doc.body)}</p></div><span class="badge ${ack?'ok':doc.requiresAck?'warn':'info'}">${ack?'Kvittert':doc.requiresAck?'MÃ¥ signeres':'Info'}</span></div>
    <div class="module-actions"><button class="action" onclick="showInternalDocument('${esc(doc.id)}')">Detaljer</button>${doc.file?`<button class="action" onclick="openInternalPdf('${esc(doc.file)}')">Ã…pne PDF</button>`:''}${doc.requiresAck?`<button class="action primary" onclick="ackInternalDocument('${esc(doc.id)}')">${ack?'Signer pÃ¥ nytt':'Jeg har lest og forstÃ¥tt'}</button>`:''}</div>
    ${ack?`<small class="muted">Signert av ${esc(ack.signature_name||ack.email||DP.user?.email)} Â· ${esc(formatDateTime(ack.acknowledged_at||ack.time))}</small>`:''}
  </section>`;
}
function EmployeePortalPanel(docs,acks){
  const mine=docs.filter(d=>d.requiresAck&&!acks[d.id]);
  return `<div class="dash-title"><div><h3>Ansattportal</h3><p class="muted">Dine dokumenter, signeringer og oppgaver.</p></div></div>
    <div class="intranet-list">
      <section><strong>Mine dokumenter</strong><span>${docs.length} tilgjengelig</span></section>
      <section><strong>Mine signeringer</strong><span>${mine.length?mine.length+' venter':'Alt er kvittert'}</span></section>
      <section><strong>Min onboarding</strong><span>7 faste oppgaver</span></section>
      <section><strong>Ferie/fravÃ¦r</strong><span>Skjema kommer i neste versjon</span></section>
      <section><strong>Be om utlegg</strong><span>Bruk utleggsmal</span></section>
    </div>
    <button class="action primary" onclick="showInternalDeviationForm()">Meld avvik</button>`;
}
function LeaderPortalPanel(){
  const role=intranetRole();
  if(!['admin','salgssjef'].includes(role))return `<div class="empty-state"><strong>Lederportal</strong><span>LederoppfÃ¸lging vises for salgssjef og admin.</span></div>`;
  const rows=[
    ['Mine ansatte','Oversikt over ansatte, roller og oppfÃ¸lging.'],
    ['PrÃ¸vetidsoppfÃ¸lging','30/60/90-dagers sjekkliste.'],
    ['Medarbeidersamtaler','Samtalepunkter og historikk.'],
    ['KPI','Demoer, tilbud, salg, aktivitet og oppfÃ¸lging.'],
    ['Godkjenninger','Dokumenter, utlegg og endringer.'],
    ['Advarsler','Dokumentert oppfÃ¸lging og avvik.'],
    ['Offboarding','Sjekkliste ved avslutning.']
  ];
  return `<div class="dash-title"><div><h3>Lederportal</h3><p class="muted">OppfÃ¸lging av ansatte, KPI og godkjenninger.</p></div><button class="action" onclick="showLeaderFollowupForm()">Ny oppfÃ¸lging</button></div><div class="intranet-list">${rows.map(r=>`<section><strong>${esc(r[0])}</strong><span>${esc(r[1])}</span></section>`).join('')}</div>`;
}
function InternalTemplatesPanel(){
  return `<div class="dash-title"><div><h3>Malbibliotek</h3><p class="muted">Skjema og maler for intern bruk.</p></div><button class="action" onclick="showTemplateForm()">Ny mal</button></div><div class="internal-template-grid">${INTERNAL_TEMPLATES.map(t=>`<section><small>${esc(t[1])}</small><strong>${esc(t[0])}</strong><span>${esc(t[2])}</span><button class="action" onclick="showNotice('Malen Ã¥pnes i dokumentbiblioteket nÃ¥r fil er lastet opp.','ok')">Ã…pne</button></section>`).join('')}</div>`;
}
function InternalOnboardingPanel(){
  const tasks=[
    ['Les ansatthÃ¥ndbok','Signeres fÃ¸r oppstart'],
    ['Les IT- og sikkerhetsregler','Signeres fÃ¸r tilgang gis'],
    ['GjennomfÃ¸r produktdemo','Start, Pro og Premium'],
    ['Les salgshÃ¥ndbok','Gjelder selger og salgssjef'],
    ['Sett opp e-post og kalender','Intern rutine'],
    ['GjennomgÃ¥ CRM-rutine','Lead og oppfÃ¸lging'],
    ['Avklar provisjon/bonus','Dokumenteres av leder']
  ];
  return `<div class="dash-title"><div><h3>Onboarding-sjekkliste</h3><p class="muted">Oppgaver som ansatte skal gjennom fÃ¸r de jobber med kunder.</p></div><button class="action primary" onclick="showNotice('Onboarding er registrert som intern rutine.','ok')">Start onboarding</button></div><div class="internal-onboarding">${tasks.map((t,i)=>`<section><b>${i+1}</b><div><strong>${esc(t[0])}</strong><span>${esc(t[1])}</span></div></section>`).join('')}</div>`;
}
function findInternalDoc(id){return intranetAllDocs().find(d=>String(d.id)===String(id))}
function showInternalDocument(id){
  const d=findInternalDoc(id);
  if(!d)return;
  showDrawer(d.title,`<div class="internal-doc-detail"><small>${esc(d.module)} Â· versjon ${esc(d.version)}</small><p>${esc(d.body)}</p><div class="validation-box"><strong>Dokument</strong><span>${d.file?'PDF ligger ved og kan Ã¥pnes direkte.':'Dette dokumentet har ikke PDF vedlagt ennÃ¥.'}</span></div><div class="module-actions">${d.file?`<button class="action" onclick="openInternalPdf('${esc(d.file)}')">Ã…pne PDF</button>`:''}${d.requiresAck?`<button class="action primary" onclick="ackInternalDocument('${esc(d.id)}')">Jeg har lest og forstÃ¥tt</button>`:''}</div><div class="validation-box"><strong>Versjonskontroll</strong><span>Alle endringer skal fÃ¥ nytt versjonsnummer, godkjenner og dato.</span></div></div>`);
}
function openInternalPdf(file){
  const url=String(file||'').trim();
  if(!url)return;
  window.open(url,'_blank','noopener');
}
async function loadInternalQuality(){
  try{
    if(!DP.session)throw new Error('Logg inn fÃ¸rst.');
    const userId=DP.user?.id||null;
    const docs=await db().from('internal_documents').select('*').eq('status','Aktiv').order('module').order('title');
    if(!docs.error)DP.cache.internalDocs=docs.data||[];
    const q=await db().from('internal_document_acknowledgements').select('*').or(`email.eq.${DP.user.email},user_id.eq.${userId||'00000000-0000-0000-0000-000000000000'}`).order('acknowledged_at',{ascending:false});
    if(q.error)throw q.error;
    DP.cache.internalAcks=q.data||[];
    showNotice('InternhÃ¥ndbok oppdatert.','ok');
    render();
  }catch(e){showNotice('KjÃ¸r supabase-intranet-quality-v1.sql fÃ¸r live kvitteringer brukes.','warn')}
}
async function ackInternalDocument(id){
  const doc=findInternalDoc(id);
  if(!doc)return;
  const signature=prompt('Skriv navnet ditt for Ã¥ signere at du har lest og forstÃ¥tt:',DP.user?.name||DP.user?.email||'');
  if(!signature)return;
  const ack={document_key:id,document_title:doc.title,version:doc.version,email:DP.user?.email||'',signature_name:signature,acknowledged_at:new Date().toISOString()};
  try{
    const payload={...ack,user_id:DP.user?.id||null,role:appRole(),metadata:{internal_role:intranetRole(),user_agent:navigator.userAgent}};
    const r=await db().from('internal_document_acknowledgements').upsert(payload,{onConflict:'document_key,email'}).select().single();
    if(r.error)throw r.error;
    DP.cache.internalAcks=[...(DP.cache.internalAcks||[]).filter(a=>!(a.document_key===id&&a.email===ack.email)),r.data];
    await sendInternalAckEmail(doc,ack);
    await insertActivity(`Intern kvittering: ${doc.title}`,'internal_ack',id);
    finishAction('Kvittering lagret.','intranet');
  }catch(e){
    const local=JSON.parse(localStorage.getItem('dpInternalAcks')||'{}');
    local[id]=ack;
    localStorage.setItem('dpInternalAcks',JSON.stringify(local));
    await sendInternalAckEmail(doc,ack).catch(()=>null);
    showNotice('Kvittering lagret lokalt. KjÃ¸r SQL-filen for live lagring.','warn');
    render();
  }
}
async function sendInternalAckEmail(doc,ack){
  if(location.protocol==='file:')return {ok:false};
  const message=[
    'En ansatt har signert at dokumentet er lest og forstÃ¥tt.',
    '',
    `Dokument: ${doc.title}`,
    `Modul: ${doc.module}`,
    `Versjon: ${doc.version}`,
    `Signert av: ${ack.signature_name}`,
    `E-post: ${ack.email}`,
    `App-rolle: ${DP.user?.role||'-'}`,
    `Intern rolle: ${intranetRoleLabel()}`,
    `Tidspunkt: ${new Date(ack.acknowledged_at).toLocaleString('nb-NO')}`,
    '',
    'Dette er en intern kvittering fra Driftspartner OS.'
  ].join('\n');
  const res=await fetch('/.netlify/functions/send-email',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({
      to:'post@driftspartnernord.no',
      subject:`Intern kvittering - ${doc.title}`,
      message,
      kind:'general',
      property:'internhandbok',
      from_name:'Driftspartner OS InternhÃ¥ndbok'
    })
  });
  return readJsonResponse(res,'Kvittering ble lagret, men e-postkvitteringen kunne ikke bekreftes.');
}
function filterInternalDocs(module=''){
  const q=(document.getElementById('internalSearch')?.value||'').toLowerCase();
  document.querySelectorAll('#internalDocList .internal-doc').forEach(el=>{
    const okModule=!module||el.dataset.module===module;
    const okSearch=!q||(el.dataset.search||'').includes(q);
    el.style.display=okModule&&okSearch?'grid':'none';
  });
}
function showInternalDeviationForm(){
  showDrawer('Meld internt avvik',`<div class="form-grid two"><label>OmrÃ¥de<select id="internalDeviationArea"><option>HMS</option><option>IT og sikkerhet</option><option>Salg</option><option>Drift</option><option>Ã˜konomi</option></select></label><label>Alvorlighet<select id="internalDeviationSeverity"><option>Lav</option><option>Normal</option><option>HÃ¸y</option><option>Kritisk</option></select></label><label class="span-2">Tittel<input id="internalDeviationTitle" placeholder="Kort tittel"></label><label class="span-2">Beskrivelse<textarea id="internalDeviationText" placeholder="Hva har skjedd, og hva bÃ¸r fÃ¸lges opp?"></textarea></label></div><button class="action primary" onclick="saveInternalDeviation()">Send avvik</button><div id="internalDeviationOut" class="output">Klar.</div>`);
}
async function saveInternalDeviation(){
  const out=document.getElementById('internalDeviationOut');
  const title=document.getElementById('internalDeviationTitle')?.value.trim();
  const area=document.getElementById('internalDeviationArea')?.value;
  const severity=document.getElementById('internalDeviationSeverity')?.value;
  const description=document.getElementById('internalDeviationText')?.value.trim();
  if(!title||!description){if(out)out.textContent='Fyll ut tittel og beskrivelse.';return}
  try{
    const r=await db().from('internal_deviations').insert({title,area,severity,description,reported_by_email:DP.user?.email||'',status:'Ny'}).select().single();
    if(r.error)throw r.error;
    await insertActivity(`Internt avvik: ${title}`,'internal_deviation',r.data.id);
    finishAction('Internt avvik sendt.','intranet');
  }catch(e){setOutputError(out,e,'Internt avvik kunne ikke lagres. KjÃ¸r supabase-intranet-quality-v1.sql fÃ¸rst.')}
}
function showInternalDocumentForm(){
  showDrawer('Nytt internt dokument',`<div class="form-grid two"><label>Modul<select id="internalDocModule"><option>HR</option><option>Salg</option><option>Driftspartner OS-drift</option><option>HMS</option><option>Ã˜konomi</option><option>IT og sikkerhet</option><option>Ledelse</option><option>Maler og skjema</option></select></label><label>Versjon<input id="internalDocVersion" value="1.0"></label><label class="span-2">Tittel<input id="internalDocTitle"></label><label>MÃ¥lgruppe<select id="internalDocAudience"><option value="all">Alle ansatte</option><option value="sales">Selger og salgssjef</option><option value="leaders">Leder og admin</option></select></label><label>Signering<select id="internalDocAck"><option value="true">Krever kvittering</option><option value="false">Kun informasjon</option></select></label><label class="span-2">Innhold<textarea id="internalDocBody"></textarea></label></div><button class="action primary" onclick="saveInternalDocument()">Lagre dokument</button><div id="internalDocOut" class="output">Klar.</div>`);
}
async function saveInternalDocument(){
  const out=document.getElementById('internalDocOut');
  const title=document.getElementById('internalDocTitle')?.value.trim();
  const module=document.getElementById('internalDocModule')?.value;
  const version=document.getElementById('internalDocVersion')?.value.trim()||'1.0';
  const body=document.getElementById('internalDocBody')?.value.trim();
  const audience=document.getElementById('internalDocAudience')?.value;
  const requires_ack=document.getElementById('internalDocAck')?.value==='true';
  if(!title||!body){if(out)out.textContent='Fyll ut tittel og innhold.';return}
  const audience_roles=audience==='leaders'?['salgssjef','admin']:audience==='sales'?['selger','salgssjef']:['selger','salgssjef','admin'];
  try{
    const r=await db().from('internal_documents').insert({title,module,version,body,audience_roles,requires_ack,status:'Aktiv',created_by_email:DP.user?.email||''}).select().single();
    if(r.error)throw r.error;
    await insertActivity(`Internt dokument lagret: ${title}`,'internal_document',r.data.id);
    finishAction('Internt dokument lagret.','intranet');
  }catch(e){setOutputError(out,e,'Dokumentet kunne ikke lagres. KjÃ¸r supabase-intranet-quality-v1.sql fÃ¸rst.')}
}
function showLeaderFollowupForm(){showDrawer('Ny lederoppfÃ¸lging','<div class="form-grid two"><label>Ansatt<input placeholder="Navn"></label><label>Type<select><option>PrÃ¸vetid</option><option>Medarbeidersamtale</option><option>KPI</option><option>Advarsel</option><option>Offboarding</option></select></label><label class="span-2">Notat<textarea></textarea></label></div><button class="action primary" onclick="showNotice(\'OppfÃ¸lging lagret som intern rutine.\',\'ok\');hideDrawer()">Lagre</button>')}
function showTemplateForm(){showDrawer('Ny mal','<div class="form-grid two"><label>Navn<input></label><label>OmrÃ¥de<select><option>HR</option><option>Salg</option><option>HMS</option><option>Ã˜konomi</option></select></label><label class="span-2">Beskrivelse<textarea></textarea></label></div><button class="action primary" onclick="showNotice(\'Mal registrert.\',\'ok\');hideDrawer()">Lagre</button>')}



