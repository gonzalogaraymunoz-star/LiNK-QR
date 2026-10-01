create or replace function private.link_operational_name(p_value text)
returns boolean
language sql
immutable
set search_path = public, private, pg_temp
as $$
  select coalesce(trim(p_value),'') ~* '^(SOL|LAM|HAB|HE|LEAD|RES|CLI)[-_]?[A-Z0-9]'
      or coalesce(trim(p_value),'') ~* '^SIN NOMBRE';
$$;

create or replace function private.link_human_identity_label(
  p_person_name text,
  p_lead_name text,
  p_email text,
  p_phone text
)
returns text
language sql
immutable
set search_path = public, private, pg_temp
as $$
  select coalesce(
    case when nullif(trim(p_person_name),'') is not null
              and not private.link_operational_name(p_person_name)
         then trim(p_person_name) end,
    case when nullif(trim(p_lead_name),'') is not null
              and not private.link_operational_name(p_lead_name)
         then trim(p_lead_name) end,
    nullif(trim(p_email),''),
    nullif(trim(p_phone),''),
    'Identidad por resolver'
  );
$$;

create or replace view public.link_lead_identity_v
with (security_invoker = true)
as
select
  i.id as identity_id,
  i.lead_id,
  i.universal_code,
  i.qr_token,
  i.status as qr_status,
  i.created_at as identity_created_at,
  i.updated_at as identity_updated_at,
  l.business_id,
  b.name as business_name,
  b.slug as business_slug,
  b.global_id as business_global_id,
  l.project_id,
  pr.name as project_name,
  pr.slug as project_slug,
  l.full_name,
  l.email,
  l.phone,
  l.company,
  l.source,
  l.source_page,
  l.source_cta,
  l.external_ref,
  l.stage,
  l.score,
  l.interested_pack,
  l.interested_product,
  l.created_at as lead_created_at,
  l.updated_at as lead_updated_at,
  jsonb_strip_nulls(jsonb_build_object(
    'stage', l.stage,
    'classification', l.metadata->>'classification',
    'classification_confidence', l.metadata->>'classification_confidence',
    'intent_type', l.metadata->>'intent_type',
    'source', l.source,
    'source_page', l.source_page,
    'source_cta', l.source_cta,
    'interested_pack', l.interested_pack,
    'interested_product', l.interested_product,
    'external_ref', l.external_ref
  )) as tags,
  pl.person_id,
  p.universal_code as person_universal_code,
  p.display_name as person_display_name,
  private.link_human_identity_label(p.display_name,l.full_name,l.email,l.phone) as identity_label,
  case
    when nullif(trim(p.display_name),'') is not null and not private.link_operational_name(p.display_name) then 'person_name'
    when nullif(trim(l.full_name),'') is not null and not private.link_operational_name(l.full_name) then 'lead_name'
    when nullif(trim(l.email),'') is not null then 'email'
    when nullif(trim(l.phone),'') is not null then 'phone'
    else 'unresolved'
  end as identity_basis,
  case
    when private.link_operational_name(l.full_name) then l.full_name
    when private.link_operational_name(p.display_name) then p.display_name
    else nullif(trim(l.external_ref),'')
  end as internal_reference
from public.link_lead_identities i
join public.sales_leads l on l.id=i.lead_id
left join public.link_world_businesses b on b.id=l.business_id
left join public.projects pr on pr.id=l.project_id
left join public.link_person_leads pl on pl.lead_id=l.id
left join public.link_persons p on p.id=pl.person_id;

revoke all on public.link_lead_identity_v from anon;
grant select on public.link_lead_identity_v to authenticated;

create or replace function private.sync_link_qr_registry_from_lead_identity()
returns trigger
language plpgsql
security definer
set search_path to public, private, pg_temp
as $function$
declare
  v_label text;
  v_person_id uuid;
  v_person_code text;
  v_person_name text;
  v_lead_name text;
  v_email text;
  v_phone text;
  v_external_ref text;
  v_basis text;
begin
  select pl.person_id,p.universal_code,p.display_name,l.full_name,l.email,l.phone,l.external_ref
  into v_person_id,v_person_code,v_person_name,v_lead_name,v_email,v_phone,v_external_ref
  from public.sales_leads l
  left join public.link_person_leads pl on pl.lead_id=l.id
  left join public.link_persons p on p.id=pl.person_id
  where l.id=NEW.lead_id
  limit 1;

  v_label := private.link_human_identity_label(v_person_name,v_lead_name,v_email,v_phone);
  v_basis := case
    when nullif(trim(v_person_name),'') is not null and not private.link_operational_name(v_person_name) then 'person_name'
    when nullif(trim(v_lead_name),'') is not null and not private.link_operational_name(v_lead_name) then 'lead_name'
    when nullif(trim(v_email),'') is not null then 'email'
    when nullif(trim(v_phone),'') is not null then 'phone'
    else 'unresolved'
  end;

  insert into public.link_qr_registry (
    entity_type, entity_id, business_id, universal_code, qr_token, label, status, metadata
  )
  values (
    'prospect',NEW.id,NEW.business_id,NEW.universal_code,NEW.qr_token,v_label,NEW.status,
    jsonb_strip_nulls(jsonb_build_object(
      'lead_id',NEW.lead_id,
      'project_id',NEW.project_id,
      'person_id',v_person_id,
      'person_universal_code',v_person_code,
      'identity_basis',v_basis,
      'internal_reference',
        case
          when private.link_operational_name(v_lead_name) then v_lead_name
          when private.link_operational_name(v_person_name) then v_person_name
          else nullif(trim(v_external_ref),'')
        end
    ))
  )
  on conflict (entity_type, entity_id) do update
  set business_id=excluded.business_id,
      universal_code=excluded.universal_code,
      qr_token=excluded.qr_token,
      label=excluded.label,
      status=excluded.status,
      metadata=public.link_qr_registry.metadata || excluded.metadata,
      updated_at=now();
  return NEW;
end;
$function$;

with resolved as (
  select i.id as identity_id,
         private.link_human_identity_label(p.display_name,l.full_name,l.email,l.phone) as label,
         pl.person_id,
         p.universal_code as person_universal_code,
         case
           when nullif(trim(p.display_name),'') is not null and not private.link_operational_name(p.display_name) then 'person_name'
           when nullif(trim(l.full_name),'') is not null and not private.link_operational_name(l.full_name) then 'lead_name'
           when nullif(trim(l.email),'') is not null then 'email'
           when nullif(trim(l.phone),'') is not null then 'phone'
           else 'unresolved'
         end as identity_basis,
         case
           when private.link_operational_name(l.full_name) then l.full_name
           when private.link_operational_name(p.display_name) then p.display_name
           else nullif(trim(l.external_ref),'')
         end as internal_reference
  from public.link_lead_identities i
  join public.sales_leads l on l.id=i.lead_id
  left join public.link_person_leads pl on pl.lead_id=l.id
  left join public.link_persons p on p.id=pl.person_id
)
update public.link_qr_registry r
set label=resolved.label,
    metadata=r.metadata || jsonb_strip_nulls(jsonb_build_object(
      'person_id',resolved.person_id,
      'person_universal_code',resolved.person_universal_code,
      'identity_basis',resolved.identity_basis,
      'internal_reference',resolved.internal_reference
    )),
    updated_at=now()
from resolved
where r.entity_type='prospect' and r.entity_id=resolved.identity_id;

with person_labels as (
  select p.id,
         private.link_human_identity_label(p.display_name,null,p.email,p.phone) as label,
         case
           when nullif(trim(p.display_name),'') is not null and not private.link_operational_name(p.display_name) then 'person_name'
           when nullif(trim(p.email),'') is not null then 'email'
           when nullif(trim(p.phone),'') is not null then 'phone'
           else 'unresolved'
         end as identity_basis
  from public.link_persons p
)
update public.link_qr_registry r
set label=person_labels.label,
    metadata=r.metadata || jsonb_build_object('identity_basis',person_labels.identity_basis),
    updated_at=now()
from person_labels
where r.entity_type='person' and r.entity_id=person_labels.id;
