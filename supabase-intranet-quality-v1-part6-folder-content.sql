-- Driftspartner OS - Intranett V1 del 6
-- Kjor etter del 1-5: legger inn mappeinnhold og rutiner tilpasset Driftspartner Nord.

alter table internal_documents add column if not exists folder text;

insert into internal_documents (folder,module,title,version,body,audience_roles,requires_ack,status)
values
  ('HR og rekruttering','HR','Mappeguide - HR og rekruttering','1.0',
   'Bruk denne mappen for ansettelse, onboarding, provetid og oppfolging. Flyt: tilbud om ansettelse, arbeidsavtale, taushetserklaering, onboarding-program og 30/60/90-dagers provetidsoppfolging. Salgssjef dokumenterer vurderinger, referansesjekk og oppfolging.',
   array['salgssjef','admin'],true,'Aktiv'),
  ('Arbeidsavtaler','Arbeidsavtaler','Mappeguide - Arbeidsavtaler','1.0',
   'Alle arbeidsavtaler, provisjonsavtaler, hjemmekontoravtaler, taushetserklaeringer og utstyrserklaeringer skal signeres og arkiveres. Ingen ansatte skal ha kundetilgang for riktige dokumenter er kvittert.',
   array['admin'],true,'Aktiv'),
  ('Salgshandbok','Salg','Mappeguide - Salgshandbok','1.0',
   'Selger skal bruke fast salgsflyt: finn kundeemne, book demo, vis riktig pakke, avklar behov, send tilbud/bestilling og overlever kunden til onboarding. Demo skal alltid vises med demo/test-eiendom og riktig pakkevisning.',
   array['selger','salgssjef','admin'],true,'Aktiv'),
  ('Driftspartner OS-rutiner','Driftspartner OS-drift','Mappeguide - Driftspartner OS-rutiner','1.0',
   'Denne mappen beskriver hvordan Driftspartner OS driftes: opprett kunde, legg inn eiendom, velg abonnement, legg inn styre/beboere, last opp FDV, test e-post, kjor lanseringskontroll og folg opp support.',
   array['salgssjef','admin'],true,'Aktiv'),
  ('HMS og avvik','HMS','Mappeguide - HMS og avvik','1.0',
   'Interne avvik meldes i Internhandbok. Avvik skal ha omrade, alvorlighet, beskrivelse, ansvarlig og status. Kritiske sikkerhets- eller personvernavvik skal varsles daglig leder samme dag.',
   array['selger','salgssjef','admin'],true,'Aktiv'),
  ('Okonomi og utlegg','Okonomi','Mappeguide - Okonomi og utlegg','1.0',
   'Utlegg, reise, gaver og representasjon skal dokumenteres med formal, dato, belop og kvittering. Leder eller admin godkjenner for refusjon. Belop uten dokumentasjon skal ikke refunderes.',
   array['selger','salgssjef','admin'],true,'Aktiv'),
  ('IT og sikkerhet','IT og sikkerhet','Mappeguide - IT og sikkerhet','1.0',
   'Alle ansatte skal bruke MFA, sterke passord og sikker behandling av kundedata. API-nokler, kundedata og innlogginger skal aldri deles i chat, e-post eller demo. AI skal bare brukes med data som er tillatt etter AI-policy.',
   array['selger','salgssjef','admin'],true,'Aktiv'),
  ('Ledelse','Ledelse','Mappeguide - Ledelse','1.0',
   'Leder bruker denne mappen til KPI, provetid, medarbeidersamtaler, fullmakter, organisasjonskart og offboarding. Oppfolging skal dokumenteres og kunne spores.',
   array['salgssjef','admin'],true,'Aktiv'),
  ('Maler og skjema','Maler og skjema','Mappeguide - Maler og skjema','1.0',
   'Bruk malene for tilbud, referansesjekk, arbeidsavtale, utlegg, avvik og offboarding. Ferdige skjema skal arkiveres i riktig mappe og signeres nar det kreves.',
   array['selger','salgssjef','admin'],false,'Aktiv')
on conflict do nothing;

update internal_documents set folder='HR og rekruttering' where module='HR' and folder is null;
update internal_documents set folder='Arbeidsavtaler' where module='Arbeidsavtaler' and folder is null;
update internal_documents set folder='Salgshandbok' where module='Salg' and folder is null;
update internal_documents set folder='Driftspartner OS-rutiner' where module='Driftspartner OS-drift' and folder is null;
update internal_documents set folder='HMS og avvik' where module='HMS' and folder is null;
update internal_documents set folder='Okonomi og utlegg' where module in ('Okonomi','Økonomi') and folder is null;
update internal_documents set folder='IT og sikkerhet' where module='IT og sikkerhet' and folder is null;
update internal_documents set folder='Ledelse' where module='Ledelse' and folder is null;
update internal_documents set folder='Maler og skjema' where module='Maler og skjema' and folder is null;
