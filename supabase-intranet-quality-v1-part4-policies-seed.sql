-- Driftspartner OS - Intranett V1 del 4
-- Kjor til slutt: lager tilgangsregler og standard onboarding-oppgaver.

drop policy if exists internal_documents_internal_select on internal_documents;
create policy internal_documents_internal_select on internal_documents
for select to authenticated using (dp_is_internal_staff());
drop policy if exists internal_documents_internal_write on internal_documents;
create policy internal_documents_internal_write on internal_documents
for all to authenticated using (dp_is_internal_staff()) with check (dp_is_internal_staff());

drop policy if exists internal_document_versions_internal_select on internal_document_versions;
create policy internal_document_versions_internal_select on internal_document_versions
for select to authenticated using (dp_is_internal_staff());
drop policy if exists internal_document_versions_internal_write on internal_document_versions;
create policy internal_document_versions_internal_write on internal_document_versions
for all to authenticated using (dp_is_internal_staff()) with check (dp_is_internal_staff());

drop policy if exists internal_document_acknowledgements_internal_select on internal_document_acknowledgements;
create policy internal_document_acknowledgements_internal_select on internal_document_acknowledgements
for select to authenticated using (dp_is_internal_staff());
drop policy if exists internal_document_acknowledgements_internal_write on internal_document_acknowledgements;
create policy internal_document_acknowledgements_internal_write on internal_document_acknowledgements
for all to authenticated using (dp_is_internal_staff()) with check (dp_is_internal_staff());

drop policy if exists internal_employees_internal_select on internal_employees;
create policy internal_employees_internal_select on internal_employees
for select to authenticated using (dp_is_internal_staff());
drop policy if exists internal_employees_internal_write on internal_employees;
create policy internal_employees_internal_write on internal_employees
for all to authenticated using (dp_is_internal_staff()) with check (dp_is_internal_staff());

drop policy if exists internal_onboarding_tasks_internal_select on internal_onboarding_tasks;
create policy internal_onboarding_tasks_internal_select on internal_onboarding_tasks
for select to authenticated using (dp_is_internal_staff());
drop policy if exists internal_onboarding_tasks_internal_write on internal_onboarding_tasks;
create policy internal_onboarding_tasks_internal_write on internal_onboarding_tasks
for all to authenticated using (dp_is_internal_staff()) with check (dp_is_internal_staff());

drop policy if exists internal_employee_tasks_internal_select on internal_employee_tasks;
create policy internal_employee_tasks_internal_select on internal_employee_tasks
for select to authenticated using (dp_is_internal_staff());
drop policy if exists internal_employee_tasks_internal_write on internal_employee_tasks;
create policy internal_employee_tasks_internal_write on internal_employee_tasks
for all to authenticated using (dp_is_internal_staff()) with check (dp_is_internal_staff());

drop policy if exists internal_deviations_internal_select on internal_deviations;
create policy internal_deviations_internal_select on internal_deviations
for select to authenticated using (dp_is_internal_staff());
drop policy if exists internal_deviations_internal_write on internal_deviations;
create policy internal_deviations_internal_write on internal_deviations
for all to authenticated using (dp_is_internal_staff()) with check (dp_is_internal_staff());

drop policy if exists internal_templates_internal_select on internal_templates;
create policy internal_templates_internal_select on internal_templates
for select to authenticated using (dp_is_internal_staff());
drop policy if exists internal_templates_internal_write on internal_templates;
create policy internal_templates_internal_write on internal_templates
for all to authenticated using (dp_is_internal_staff()) with check (dp_is_internal_staff());

drop policy if exists internal_approvals_internal_select on internal_approvals;
create policy internal_approvals_internal_select on internal_approvals
for select to authenticated using (dp_is_internal_staff());
drop policy if exists internal_approvals_internal_write on internal_approvals;
create policy internal_approvals_internal_write on internal_approvals
for all to authenticated using (dp_is_internal_staff()) with check (dp_is_internal_staff());

insert into internal_onboarding_tasks (title, description, sort_order)
values
  ('Les ansatthandbok', 'Signeres for oppstart.', 1),
  ('Les IT- og sikkerhetsregler', 'Signeres for tilgang gis.', 2),
  ('Gjennomfor produktdemo', 'Start, Pro og Premium.', 3),
  ('Les salgshandbok', 'Gjelder selger og salgssjef.', 4),
  ('Sett opp e-post og kalender', 'Intern rutine.', 5),
  ('Gjennomga CRM-rutine', 'Lead og oppfolging.', 6),
  ('Avklar provisjon/bonus', 'Dokumenteres av leder.', 7)
on conflict (title) do nothing;

insert into internal_documents (module, title, version, body, audience_roles, requires_ack, status)
values
  ('HR', 'Ansatthandbok', '1.0', 'Retningslinjer for arbeidsforhold, opptreden, taushet, ferie, fravar, utstyr og intern kommunikasjon.', array['selger','salgssjef','admin'], true, 'Aktiv'),
  ('Salg', 'Salgshandbok', '1.0', 'Slik selges Driftspartner OS: malgruppe, behovsavklaring, demo, tilbud, oppfolging og kundestart.', array['selger','salgssjef','admin'], true, 'Aktiv'),
  ('Salg', 'Telefonmanus', '1.0', 'Kort manus for forste kontakt, behovskartlegging og booking av demo.', array['selger','salgssjef'], true, 'Aktiv'),
  ('Salg', 'Demoregler', '1.0', 'Demo skal vises med ryddig testkunde. Ikke vis interne nokler, tekniske feil eller kundedata fra andre.', array['selger','salgssjef','admin'], true, 'Aktiv'),
  ('Salg', 'Provisjonsavtale', '1.0', 'Prinsipper for provisjon, godkjent salg, fakturering, utbetaling og tilbakeforing.', array['selger','salgssjef','admin'], true, 'Aktiv'),
  ('Salg', 'CRM-rutiner', '1.0', 'Alle leads skal logges med status, neste aktivitet, kontaktperson, pakkeinteresse og oppfolging.', array['selger','salgssjef'], true, 'Aktiv'),
  ('Ledelse', 'Lederhandbok', '1.0', 'Rutiner for personaloppfolging, mal, provetid, avvik, godkjenninger og lederansvar.', array['salgssjef','admin'], true, 'Aktiv'),
  ('Ledelse', 'KPI-rapport', '1.0', 'Ukentlig oppfolging av leads, bookede demoer, sendte tilbud, signerte avtaler, churn-risiko og support.', array['salgssjef','admin'], false, 'Aktiv'),
  ('HR', 'Provetidsoppfolging', '1.0', 'Plan for 30/60/90 dager, opplaring, mal, evaluering og dokumentert oppfolging.', array['salgssjef','admin'], false, 'Aktiv'),
  ('HR', 'Intervjuguide', '1.0', 'Sporsmal, vurderingspunkter og sjekkliste for intervju av selger, support og forvalter.', array['salgssjef','admin'], false, 'Aktiv'),
  ('Selskapsstyring', 'Fullmakter', '1.0', 'Hvem kan innga avtaler, gi rabatter, godkjenne kostnader og signere pa vegne av selskapet.', array['admin'], true, 'Aktiv'),
  ('Arbeidsavtaler', 'Arbeidsavtaler', '1.0', 'Mal og rutine for arbeidsavtale, endringsavtale, taushet og utstyr.', array['admin'], true, 'Aktiv'),
  ('HMS', 'HMS-rutine', '1.0', 'Rutine for sikkerhet, psykososialt arbeidsmiljo, avvik, varsling og oppfolging.', array['selger','salgssjef','admin'], true, 'Aktiv'),
  ('IT og sikkerhet', 'IT- og sikkerhetsregler', '1.0', 'Passord, MFA, kundedata, API-nokler, enheter, tilgang, deling og hendelser.', array['selger','salgssjef','admin'], true, 'Aktiv'),
  ('Okonomi', 'Utlegg og innkjop', '1.0', 'Hvordan utlegg, reisekostnader og innkjop meldes inn og godkjennes.', array['selger','salgssjef','admin'], false, 'Aktiv'),
  ('Driftspartner OS-drift', 'Driftsrutiner for Driftspartner OS', '1.0', 'Rutiner for kundeopprettelse, roller, abonnement, support, backup, eksport og produksjonskontroll.', array['salgssjef','admin'], true, 'Aktiv')
on conflict do nothing;

insert into internal_templates (title, module, description, body, status)
values
  ('Arbeidsavtale', 'HR', 'Mal for ansettelse og vilkar.', 'Mal fylles ut per ansatt.', 'Aktiv'),
  ('Referansesjekk', 'HR', 'Skjema for referanser med samtykke.', 'Navn, rolle, relasjon, sporsmal og vurdering.', 'Aktiv'),
  ('Demomanus', 'Salg', 'Kort demo-oppsett for Start, Pro og Premium.', 'Start: FDV, avvik og styre. Pro: arshjul, arbeid, okonomi og rapport. Premium: Property Brain, RFQ og AI-vurdering.', 'Aktiv'),
  ('Tilbudsmal', 'Salg', 'Standard tilbudstekst med pakke og arspris.', 'Tilpasses kunde og valgt pakke.', 'Aktiv'),
  ('Avvik internt', 'HMS', 'Skjema for intern avviksmelding.', 'Hva skjedde, risiko, tiltak og ansvarlig.', 'Aktiv'),
  ('Utlegg', 'Okonomi', 'Skjema for utlegg og refusjon.', 'Dato, belop, formal, kvittering og godkjenner.', 'Aktiv')
on conflict do nothing;
