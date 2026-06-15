/* Driftspartner OS module: 91-rfq-delete.js
   Delete quote requests from the RFQ overview. */
async function deleteQuoteRequest(id){
  const p=ensureCaseCollections(),rfq=(p.quoteRequests||[]).find(q=>String(q.id)===String(id)||String(q.technical_id)===String(id));
  if(!rfq){showDrawer('Fant ikke forespørsel','<div class="output">Forespørselen finnes ikke i listen som er lastet inn.</div>');return}
  try{
    dpRequireLiveWrite('slette tilbudsforespørsel');
    const db=supabaseClient(),dbId=dpDbId(rfq);
    if(!isUuid(dbId))throw new Error('Forespørselen mangler Supabase UUID. Hent live data på nytt.');
    const offers=await db.from('offers').select('id').eq('quote_request_id',dbId);
    if(offers.error)throw offers.error;
    const offerIds=(offers.data||[]).map(o=>o.id);
    if(offerIds.length){
      const files=await db.from('offer_files').delete().in('offer_id',offerIds);
      if(files.error)throw files.error;
      const delOffers=await db.from('offers').delete().in('id',offerIds);
      if(delOffers.error)throw delOffers.error;
    }
    const delLinks=await db.from('quote_request_suppliers').delete().eq('quote_request_id',dbId);
    if(delLinks.error)throw delLinks.error;
    const delRfq=await db.from('quote_requests').delete().eq('id',dbId);
    if(delRfq.error)throw delRfq.error;
    p.quoteRequests=(p.quoteRequests||[]).filter(q=>String(q.id)!==String(id)&&String(q.technical_id)!==String(id));
    p.offers=(p.offers||[]).filter(o=>String(o.quote_request_id)!==String(dbId)&&String(o.quoteRequestId)!==String(dbId));
    logActivity('Tilbudsforespørsel slettet',dpFriendlyId(rfq,'RFQ',p.quoteRequests));
    await hydrateCurrentPropertyData(db);
    showDashboardQuotes();
  }catch(e){dpShowSupabaseError('Tilbudsforespørsel ble ikke slettet',e,'quote_requests / offers / quote_request_suppliers')}
}
function confirmDeleteQuoteRequest(id){
  const p=ensureCaseCollections(),rfq=(p.quoteRequests||[]).find(q=>String(q.id)===String(id)||String(q.technical_id)===String(id));
  showDrawer('Slett tilbudsforespørsel',`<div class="output">Dette sletter forespørselen${rfq?.title?' "'+esc(rfq.title)+'"':''} og koblede leverandørkoblinger/tilbud i Supabase.</div><button class="action red" onclick="deleteQuoteRequest('${esc(id)}')">Slett forespørsel</button><button class="action" onclick="showDashboardQuotes()">Avbryt</button>`);
}
showDashboardQuotes=function(){
  const s=dpLiveDashboardStats();
  const rfqRows=s.rfqs.map(q=>`<tr><td>${esc(dpFriendlyId(q,'RFQ',s.rfqs))}</td><td>${esc(q.title||'-')}</td><td>${esc(q.deadline||'-')}</td><td>${esc(q.status||'-')}</td><td><button class="action red" onclick="confirmDeleteQuoteRequest('${esc(q.id)}')">Slett</button></td></tr>`);
  const offerRows=s.offers.map(o=>`<tr><td>${esc(o.supplier||'-')}</td><td>${money(+o.price||0)}</td><td>${esc(o.deadline||'-')}</td><td>${esc(o.score||'Ikke vurdert')}</td></tr>`);
  showDrawer('Tilbud og forespørsler',`<h3>Forespørsler</h3>${dpLiveTable(['RFQ','Oppdrag','Frist','Status','Handling'],rfqRows,'Ingen forespørsler.')}<h3>Tilbud</h3>${dpLiveTable(['Leverandør','Pris','Frist','Score'],offerRows,'Ingen tilbud lastet opp.')}<button class="action primary" onclick="showQuoteRequest()">Lag tilbudsforespørsel</button><button class="action" onclick="showUploadOffer()">Last opp tilbud</button>`);
};
