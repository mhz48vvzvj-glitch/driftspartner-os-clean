-- Driftspartner OS - Intranett V1 del 5
-- Kjor etter del 1-4: legger PDF-lenker pa interne dokumenter.

alter table internal_documents add column if not exists file_url text;

update internal_documents set file_url='assets/internal-docs/ansatthandbok.pdf' where lower(title)=lower('Ansatthandbok');
update internal_documents set file_url='assets/internal-docs/salgshandbok.pdf' where lower(title)=lower('Salgshandbok');
update internal_documents set file_url='assets/internal-docs/referansesjekk.pdf' where lower(title)=lower('Referansesjekk');
update internal_documents set file_url='assets/internal-docs/intervjuguide.pdf' where lower(title)=lower('Intervjuguide');
update internal_documents set file_url='assets/internal-docs/provisjonsavtale.pdf' where lower(title)=lower('Provisjonsavtale');
update internal_documents set file_url='assets/internal-docs/provetidsoppfolging.pdf' where lower(title)=lower('Provetidsoppfolging');
update internal_documents set file_url='assets/internal-docs/lederhandbok.pdf' where lower(title)=lower('Lederhandbok');
update internal_documents set file_url='assets/internal-docs/arbeidsavtale.pdf' where lower(title)=lower('Arbeidsavtaler');
update internal_documents set file_url='assets/internal-docs/it-og-sikkerhetspolicy.pdf' where lower(title)=lower('IT- og sikkerhetsregler');
update internal_documents set file_url='assets/internal-docs/utleggspolicy.pdf' where lower(title)=lower('Utlegg og innkjop');
update internal_documents set file_url='assets/internal-docs/fullmaktsmatrise.pdf' where lower(title)=lower('Fullmakter');

insert into internal_documents (module,title,version,body,audience_roles,requires_ack,status,file_url)
values
  ('Arbeidsavtaler','Arbeidsavtale - provisjonsbasert selger','1.0','Arbeidsavtale for provisjonsbasert selger.',array['selger','salgssjef','admin'],true,'Aktiv','assets/internal-docs/arbeidsavtale-provisjonsbasert-selger.pdf'),
  ('Arbeidsavtaler','Taushetserklaering','1.0','Taushetserklaering for ansatte og innleide.',array['selger','salgssjef','admin'],true,'Aktiv','assets/internal-docs/taushetserklaering.pdf'),
  ('IT og sikkerhet','IT- og utstyrserklaering','1.0','Bekreftelse pa mottatt utstyr og ansvar for bruk.',array['selger','salgssjef','admin'],true,'Aktiv','assets/internal-docs/it-og-utstyrserklaering.pdf'),
  ('HR','Hjemmekontoravtale','1.0','Avtale for arbeid fra hjemmekontor.',array['selger','salgssjef','admin'],true,'Aktiv','assets/internal-docs/hjemmekontoravtale.pdf'),
  ('HR','Rekrutteringspolicy','1.0','Rutine og prinsipper for rekruttering.',array['salgssjef','admin'],true,'Aktiv','assets/internal-docs/rekrutteringspolicy.pdf'),
  ('Selskapsstyring','Delegasjonsreglement','1.0','Hvem har myndighet til a beslutte hva.',array['admin'],true,'Aktiv','assets/internal-docs/delegasjonsreglement.pdf'),
  ('Selskapsstyring','Fullmaktsmatrise','1.0','Fullmakter og belopsgrenser.',array['admin'],true,'Aktiv','assets/internal-docs/fullmaktsmatrise.pdf'),
  ('Ledelse','Stillingsbeskrivelser','1.0','Roller og stillingsbeskrivelser i Driftspartner Nord.',array['salgssjef','admin'],false,'Aktiv','assets/internal-docs/stillingsbeskrivelser.pdf'),
  ('Ledelse','Organisasjonskart','1.0','Organisasjonskart for Driftspartner Nord.',array['selger','salgssjef','admin'],false,'Aktiv','assets/internal-docs/organisasjonskart.pdf'),
  ('Retningslinjer','Etiske retningslinjer','1.0','Etiske regler for ansatte.',array['selger','salgssjef','admin'],true,'Aktiv','assets/internal-docs/etiske-retningslinjer.pdf'),
  ('IT og sikkerhet','AI-policy','1.0','Regler for bruk av AI i arbeid og kundebehandling.',array['selger','salgssjef','admin'],true,'Aktiv','assets/internal-docs/ai-policy.pdf'),
  ('IT og sikkerhet','Passord- og MFA-policy','1.0','Krav til passord, tofaktor og kontoer.',array['selger','salgssjef','admin'],true,'Aktiv','assets/internal-docs/passord-og-mfa-policy.pdf'),
  ('Retningslinjer','Sosiale medier-policy','1.0','Retningslinjer for sosiale medier.',array['selger','salgssjef','admin'],true,'Aktiv','assets/internal-docs/sosiale-medier-policy.pdf'),
  ('Okonomi','Reisepolicy','1.0','Regler for reise, transport og dokumentasjon.',array['selger','salgssjef','admin'],false,'Aktiv','assets/internal-docs/reisepolicy.pdf'),
  ('Okonomi','Gave- og representasjonspolicy','1.0','Regler for gaver, representasjon og habilitet.',array['selger','salgssjef','admin'],true,'Aktiv','assets/internal-docs/gave-og-representasjonspolicy.pdf'),
  ('HR','Onboarding-program','1.0','Program for nyansatte.',array['selger','salgssjef','admin'],true,'Aktiv','assets/internal-docs/onboarding-program.pdf')
on conflict do nothing;
