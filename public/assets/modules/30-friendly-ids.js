/* Driftspartner OS module: 30-friendly-ids.js
   Friendly AV/WO/RFQ labels and technical ID helpers.
   Source: 25-mail-friendly-ids-production.js:25-50
*/
function dpYear(){return new Date().getFullYear()}
function dpCollectionForPrefix(prefix,p=ensureCaseCollections()){
  if(prefix==='AV')return p.deviations||[];
  if(prefix==='WO')return p.workOrders||[];
  if(prefix==='RFQ')return p.quoteRequests||[];
  if(prefix==='ST')return p.boardCases||[];
  if(prefix==='KON')return p.contracts||[];
  return [];
}
function dpFriendlyId(itemOrId,prefix,collection){
  let id=typeof itemOrId==='object'?(itemOrId.display_id||itemOrId.reference_no||itemOrId.id):itemOrId;
  if(!id)return `${prefix}-${dpYear()}-001`;
  if(String(id).startsWith(prefix+'-')&&!isUuid(String(id)))return String(id);
  let list=collection||dpCollectionForPrefix(prefix),idx=list.findIndex(x=>String(x.id)===String(id)||String(x.display_id)===String(id));
  return `${prefix}-${dpYear()}-${String(idx>=0?idx+1:list.length+1).padStart(3,'0')}`;
}
function dpTechnicalRow(id){return isUuid(String(id))?`<tr><td>Teknisk ID</td><td><small class="muted">${esc(id)}</small></td></tr>`:''}
function dpDbId(itemOrId){return typeof itemOrId==='object'?(itemOrId.technical_id||itemOrId.db_id||itemOrId.id):itemOrId}
function dpCaseLabel(caseId){
  let p=ensureCaseCollections();
  for(let [prefix,list] of [['AV',p.deviations],['WO',p.workOrders],['RFQ',p.quoteRequests],['ST',p.boardCases],['KON',p.contracts]]){
    let item=(list||[]).find(x=>String(x.id)===String(caseId)||String(x.technical_id)===String(caseId)||String(x.display_id)===String(caseId));
    if(item)return dpFriendlyId(item,prefix,list);
  }
  return isUuid(String(caseId))?`SAK-${String(caseId).slice(0,8).toUpperCase()}`:String(caseId);
}
