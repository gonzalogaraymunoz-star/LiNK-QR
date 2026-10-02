-- LINK ID data-quality gate.
-- A usable lead requires BOTH a natural name and an actionable contact point.

create or replace function private.link_natural_person_name(p_value text)
returns boolean
language sql
immutable
set search_path = public, private, pg_temp
as $$
  select case
    when nullif(btrim(p_value),'') is null then false
    when private.link_operational_name(p_value) then false
    when btrim(p_value) ~* '^(sin contacto|no enviado|sin nombre|unknown|desconocid[oa]|n/?a|null|none|pendiente)$' then false
    when btrim(p_value) ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then false
    when btrim(p_value) ~ '^[+0-9() .|/\-]+$' then false
    when position('_' in btrim(p_value)) > 0 then false
    when btrim(p_value) !~* '[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]' then false
    when position(' ' in btrim(p_value)) = 0 and btrim(p_value) = lower(btrim(p_value)) then false
    else true
  end;
$$;

create or replace function private.link_person_name_key(p_value text)
returns text
language sql
immutable
set search_path = public, private, pg_temp
as $$
  select nullif(
    lower(regexp_replace(coalesce(btrim(p_value),''),'[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ]+','','g')),
    ''
  );
$$;

create or replace function private.link_contact_channel(
  p_email text,
  p_phone text,
  p_source text,
  p_external_ref text
)
returns text
language sql
immutable
set search_path = public, private, pg_temp
as $$
  select case
    when coalesce(btrim(p_email),'') ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then 'email'
    when nullif(btrim(p_phone),'') is not null
         and btrim(p_phone) !~* '^(sin contacto|no enviado|unknown|n/?a|null|none)$'
         and length(regexp_replace(p_phone,'[^0-9]','','g')) >= 8 then 'phone'
    when lower(coalesce(p_source,'')) in ('instagram_dm','instagram')
         and nullif(btrim(p_external_ref),'') is not null then 'instagram'
    when lower(coalesce(p_source,'')) = 'whatsapp'
         and nullif(btrim(p_external_ref),'') is not null then 'whatsapp'
    when lower(coalesce(p_source,'')) in ('facebook_messenger','messenger')
         and nullif(btrim(p_external_ref),'') is not null then 'facebook'
    else null
  end;
$$;

create or replace function private.link_contact_point(
  p_email text,
  p_phone text,
  p_source text,
  p_external_ref text
)
returns text
language sql
immutable
set search_path = public, private, pg_temp
as $$
  select case private.link_contact_channel(p_email,p_phone,p_source,p_external_ref)
    when 'email' then btrim(p_email)
    when 'phone' then btrim(p_phone)
    when 'instagram' then btrim(p_external_ref)
    when 'whatsapp' then btrim(p_external_ref)
    when 'facebook' then btrim(p_external_ref)
    else null
  end;
$$;

create or replace view public.link_lead_contactability_v
with (security_invoker = true)
as
select
  l.id as lead_id,
  case when private.link_natural_person_name(l.full_name) then btrim(l.full_name) end as natural_name,
  private.link_contact_point(l.email,l.phone,l.source,l.external_ref) as contact_point,
  private.link_contact_channel(l.email,l.phone,l.source,l.external_ref) as contact_channel,
  private.link_natural_person_name(l.full_name) as has_natural_name,
  private.link_contact_channel(l.email,l.phone,l.source,l.external_ref) is not null as has_contact_point,
  (
    private.link_natural_person_name(l.full_name)
    and private.link_contact_channel(l.email,l.phone,l.source,l.external_ref) is not null
  ) as usable_lead,
  case
    when private.link_natural_person_name(l.full_name)
         and private.link_contact_channel(l.email,l.phone,l.source,l.external_ref) is not null
      then 'usable'
    when not private.link_natural_person_name(l.full_name)
         and private.link_contact_channel(l.email,l.phone,l.source,l.external_ref) is null
      then 'missing_name_and_contact'
    when not private.link_natural_person_name(l.full_name)
      then 'missing_natural_name'
    else 'missing_contact'
  end as quality_state
from public.sales_leads l;

revoke all on public.link_lead_contactability_v from anon;
grant select on public.link_lead_contactability_v to authenticated;

create or replace view public.link_lead_data_quality_summary_v
with (security_invoker = true)
as
select
  count(*)::int as total_records,
  count(*) filter (where usable_lead)::int as usable_leads,
  count(*) filter (where quality_state='missing_natural_name')::int as missing_natural_name,
  count(*) filter (where quality_state='missing_contact')::int as missing_contact,
  count(*) filter (where quality_state='missing_name_and_contact')::int as missing_name_and_contact
from public.link_lead_contactability_v;

revoke all on public.link_lead_data_quality_summary_v from anon;
grant select on public.link_lead_data_quality_summary_v to authenticated;

create or replace view public.link_contactable_lead_identity_v
with (security_invoker = true)
as
select
  i.*,
  q.natural_name,
  q.contact_point,
  q.contact_channel,
  q.quality_state
from public.link_lead_identity_v i
join public.link_lead_contactability_v q on q.lead_id=i.lead_id
where q.usable_lead;

revoke all on public.link_contactable_lead_identity_v from anon;
grant select on public.link_contactable_lead_identity_v to authenticated;

create or replace view public.link_contactable_lead_workboard_v
with (security_invoker = true)
as
select
  w.*,
  q.natural_name,
  q.contact_point,
  q.contact_channel,
  q.quality_state
from public.link_lead_workboard_v w
join public.link_lead_contactability_v q on q.lead_id=w.lead_id
where q.usable_lead;

revoke all on public.link_contactable_lead_workboard_v from anon;
grant select on public.link_contactable_lead_workboard_v to authenticated;

create or replace view public.link_contactable_person_profile_v
with (security_invoker = true)
as
select
  p.*,
  coalesce(
    private.link_contact_point(p.email,p.phone,null,null),
    social.identifier_value
  ) as contact_point,
  coalesce(
    private.link_contact_channel(p.email,p.phone,null,null),
    social.provider
  ) as contact_channel
from public.link_person_profile_v p
left join lateral (
  select pi.provider, pi.identifier_value
  from public.link_person_identifiers pi
  where pi.person_id=p.person_id
    and pi.identifier_type='social'
  order by pi.created_at
  limit 1
) social on true
where private.link_natural_person_name(p.display_name)
  and coalesce(
    private.link_contact_channel(p.email,p.phone,null,null),
    social.provider
  ) is not null
  and exists (
    select 1
    from public.link_person_leads pl
    join public.link_lead_contactability_v q on q.lead_id=pl.lead_id
    where pl.person_id=p.person_id
      and q.usable_lead
      and private.link_person_name_key(q.natural_name)=private.link_person_name_key(p.display_name)
  );

revoke all on public.link_contactable_person_profile_v from anon;
grant select on public.link_contactable_person_profile_v to authenticated;

create or replace view public.link_qr_registry_usable_v
with (security_invoker = true)
as
select
  r.id,
  r.entity_type,
  r.entity_id,
  r.business_id,
  r.universal_code,
  r.qr_token,
  case
    when r.entity_type='prospect' then q.natural_name
    when r.entity_type='person' then cp.display_name
    else r.label
  end as label,
  r.status,
  case
    when r.entity_type='prospect' then
      r.metadata || jsonb_strip_nulls(jsonb_build_object(
        'natural_name',q.natural_name,
        'contact_point',q.contact_point,
        'contact_channel',q.contact_channel,
        'data_quality','usable'
      ))
    when r.entity_type='person' then
      r.metadata || jsonb_strip_nulls(jsonb_build_object(
        'natural_name',cp.display_name,
        'contact_point',cp.contact_point,
        'contact_channel',cp.contact_channel,
        'data_quality','usable'
      ))
    else r.metadata
  end as metadata,
  r.created_at,
  r.updated_at
from public.link_qr_registry r
left join public.link_lead_identities li
  on r.entity_type='prospect' and li.id=r.entity_id
left join public.link_lead_contactability_v q
  on q.lead_id=li.lead_id
left join public.link_contactable_person_profile_v cp
  on r.entity_type='person' and cp.person_id=r.entity_id
where r.entity_type in ('business','product')
   or (r.entity_type='prospect' and q.usable_lead)
   or (r.entity_type='person' and cp.person_id is not null);

revoke all on public.link_qr_registry_usable_v from anon;
grant select on public.link_qr_registry_usable_v to authenticated;

create or replace function private.link_lead_identity_conflict(p_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  with lead as (
    select
      id,
      private.link_person_name_key(full_name) as name_key,
      nullif(lower(btrim(email)),'') as email_key,
      private.link_phone_identity_key(phone) as phone_key,
      case
        when lower(coalesce(source,'')) in ('instagram_dm','instagram','whatsapp','facebook_messenger','messenger')
          then nullif(lower(btrim(external_ref)),'')
      end as social_key,
      lower(coalesce(source,'')) as social_provider
    from public.sales_leads
    where id=p_lead_id
  )
  select coalesce((
    select
      exists (
        select 1
        from public.link_persons p
        where p.status<>'merged'
          and private.link_natural_person_name(p.display_name)
          and private.link_person_name_key(p.display_name)<>l.name_key
          and (
            (l.email_key is not null and lower(btrim(p.email))=l.email_key)
            or
            (l.phone_key is not null and private.link_phone_identity_key(p.phone)=l.phone_key)
          )
      )
      or exists (
        select 1
        from public.link_person_identifiers pi
        join public.link_persons p on p.id=pi.person_id
        where l.social_key is not null
          and pi.identifier_type='social'
          and pi.provider=l.social_provider
          and pi.normalized_value=l.social_key
          and private.link_natural_person_name(p.display_name)
          and private.link_person_name_key(p.display_name)<>l.name_key
      )
    from lead l
  ),false);
$$;

revoke all on function private.link_lead_identity_conflict(uuid) from public;

create or replace function private.sync_link_person_from_sales_lead()
returns trigger
language plpgsql
security definer
set search_path to public, private, pg_temp
as $function$
declare
  v_person_id uuid;
begin
  if not exists (
    select 1
    from public.link_lead_contactability_v q
    where q.lead_id=NEW.id and q.usable_lead
  ) then
    return NEW;
  end if;

  if private.link_lead_identity_conflict(NEW.id) then
    return NEW;
  end if;

  v_person_id:=private.ensure_link_person_for_lead(NEW.id);
  if v_person_id is null then return NEW; end if;

  if TG_OP='INSERT' then
    insert into public.link_interactions(
      person_id,business_id,lead_id,action_type,channel,source,confidence,metadata,occurred_at
    )
    values(
      v_person_id,NEW.business_id,NEW.id,'lead_captured',NEW.source,NEW.source,'observed',
      jsonb_build_object(
        'stage',NEW.stage,'source_page',NEW.source_page,'source_cta',NEW.source_cta,
        'external_ref',NEW.external_ref,'interested_product',NEW.interested_product
      ),
      NEW.created_at
    );
  end if;
  return NEW;
end;
$function$;

create or replace view public.link_identity_integrity_v
with (security_invoker=true)
as
select
  (select count(*) from public.link_persons where status<>'merged') as active_persons,
  (
    select count(*) from (
      select lower(trim(email))
      from public.link_persons
      where status<>'merged' and nullif(trim(email),'') is not null
      group by lower(trim(email))
      having count(*)>1
    ) x
  ) as duplicate_email_groups,
  (
    select count(*) from (
      select private.link_phone_identity_key(phone)
      from public.link_persons
      where status<>'merged'
        and private.link_phone_identity_key(phone) is not null
        and length(private.link_phone_identity_key(phone))>=8
      group by private.link_phone_identity_key(phone)
      having count(*)>1
    ) x
  ) as duplicate_phone_groups,
  (
    select count(*) from public.link_persons
    where status<>'merged'
      and not private.link_natural_person_name(display_name)
  ) as unresolved_person_rows,
  (
    select count(*) from public.link_persons p
    where p.status<>'merged'
      and private.link_natural_person_name(p.display_name)
      and private.link_contact_channel(p.email,p.phone,null,null) is null
      and not exists (
        select 1 from public.link_person_identifiers pi
        where pi.person_id=p.id and pi.identifier_type='social'
      )
  ) as missing_contact_person_rows;

revoke all on public.link_identity_integrity_v from anon;
grant select on public.link_identity_integrity_v to authenticated;
