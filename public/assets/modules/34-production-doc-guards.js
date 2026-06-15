/* Driftspartner OS module: 34-production-doc-guards.js
   Document category normalization and production failure helper.
   Source: 25-mail-friendly-ids-production.js:185-203
*/
const dpAllowedDocumentCategories=['FDV','HMS','Tilbud','Kontrakt','Styrepapir','Bilde','Tegning','Annet'];
function isRealSession(){return !!state.currentUserRecord&&isUuid(user()?.id)&&isSupabaseProperty()}
function dpNormalizeDocumentCategory(category){
  let c=String(category||'Annet'),l=c.toLowerCase();
  if(dpAllowedDocumentCategories.includes(c))return c;
  if(l.includes('tilbud'))return 'Tilbud';
  if(l.includes('kontrakt'))return 'Kontrakt';
  if(l.includes('styre'))return 'Styrepapir';
  if(l.includes('hms'))return 'HMS';
  if(l.includes('tegning')||l.includes('bim')||l.includes('ifc'))return 'Tegning';
  if(l.includes('bilde')||l.includes('foto'))return 'Bilde';
  return 'Annet';
}
function dpProductionFail(message){
  if(isRealSession())throw new Error(message);
  return 'Supabase-feil: '+message;
}


