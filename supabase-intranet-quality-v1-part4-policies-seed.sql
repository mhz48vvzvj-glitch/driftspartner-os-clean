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
