-- LINK ID identity integrity v2: one real person = one LINK ID.

-- Remove unresolved pseudo-persons while preserving their sales_leads / lead identities.
delete from public.link_qr_registry
where entity_type='person'
  and entity_id in (
    '90679c65-df7c-45a4-8ab8-a4542f3ffb63'::uuid,
    'a1fe3792-91af-4ee4-9c1c-b534688f01fe'::uuid
  );

delete from public.link_persons
where id in (
  '90679c65-df7c-45a4-8ab8-a4542f3ffb63'::uuid,
  'a1fe3792-91af-4ee4-9c1c-b534688f01fe'::uuid
);

create unique index if not exists link_persons_email_norm_unique
on public.link_persons (lower(trim(email)))
where status <> 'merged' and email is not null and trim(email) <> '';

create unique index if not exists link_persons_phone_norm_unique
on public.link_persons (regexp_replace(phone,'[^0-9]','','g'))
where status <> 'merged'
  and phone is not null
  and length(regexp_replace(phone,'[^0-9]','','g')) >= 8;

create table if not exists public.link_person_identifiers (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.link_persons(id) on delete cascade,
  identifier_type text not null check (identifier_type in ('social','external')),
  provider text not null,
  identifier_value text not null,
  normalized_value text not null,
  source_lead_id uuid references public.sales_leads(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(identifier_type,provider,normalized_value)
);

alter table public.link_person_identifiers enable row level security;
grant select,insert,update,delete on public.link_person_identifiers to authenticated;
revoke all on public.link_person_identifiers from anon;

drop policy if exists "link members read person identifiers" on public.link_person_identifiers;
create policy "link members read person identifiers" on public.link_person_identifiers
for select to authenticated using ((select public.link_world_is_member()));

drop policy if exists "link members insert person identifiers" on public.link_person_identifiers;
create policy "link members insert person identifiers" on public.link_person_identifiers
for insert to authenticated with check ((select public.link_world_is_member()));

drop policy if exists "link members update person identifiers" on public.link_person_identifiers;
create policy "link members update person identifiers" on public.link_person_identifiers
for update to authenticated
using ((select public.link_world_is_member()))
with check ((select public.link_world_is_member()));

drop policy if exists "link members delete person identifiers" on public.link_person_identifiers;
create policy "link members delete person identifiers" on public.link_person_identifiers
for delete to authenticated using ((select public.link_world_is_member()));

insert into public.link_person_identifiers(
  person_id,identifier_type,provider,identifier_value,normalized_value,source_lead_id
)
select pl.person_id,'social',lower(l.source),l.external_ref,lower(trim(l.external_ref)),l.id
from public.sales_leads l
join public.link_person_leads pl on pl.lead_id=l.id
where lower(l.source) in ('instagram_dm','whatsapp','facebook_messenger')
  and nullif(trim(l.external_ref),'') is not null
on conflict(identifier_type,provider,normalized_value) do nothing;

create or replace function private.link_phone_identity_key(p_phone text)
returns text
language sql
immutable
set search_path=public,private,pg_temp
as $$
  with x as (
    select nullif(regexp_replace(coalesce(p_phone,''),'[^0-9]','','g'),'') as d
  )
  select case
    when d is null then null
    when length(d)=9 and left(d,1)='9' then '56'||d
    else d
  end
  from x;
$$;

-- Merge same Chilean mobile stored with and without country code.
update public.link_person_leads
set person_id='285c4d7c-01a6-4afc-aaa5-c28f3ce2a0b2'::uuid
where person_id='8047f8a2-44ee-418a-9dd9-ebb92feaf5fa'::uuid;

update public.link_interactions
set person_id='285c4d7c-01a6-4afc-aaa5-c28f3ce2a0b2'::uuid
where person_id='8047f8a2-44ee-418a-9dd9-ebb92feaf5fa'::uuid;

update public.link_behavior_signals
set person_id='285c4d7c-01a6-4afc-aaa5-c28f3ce2a0b2'::uuid
where person_id='8047f8a2-44ee-418a-9dd9-ebb92feaf5fa'::uuid;

update public.link_person_identifiers
set person_id='285c4d7c-01a6-4afc-aaa5-c28f3ce2a0b2'::uuid
where person_id='8047f8a2-44ee-418a-9dd9-ebb92feaf5fa'::uuid;

delete from public.link_qr_registry
where entity_type='person'
  and entity_id='8047f8a2-44ee-418a-9dd9-ebb92feaf5fa'::uuid;

delete from public.link_persons
where id='8047f8a2-44ee-418a-9dd9-ebb92feaf5fa'::uuid;

update public.link_persons
set display_name='+56967885621',
    phone='+56967885621',
    status='verified',
    metadata=metadata || jsonb_build_object(
      'identity_merge','phone_country_normalization',
      'merged_duplicate_code','LNK-P-F993F48D082C',
      'identity_rule','unique-person-v2'
    ),
    updated_at=now()
where id='285c4d7c-01a6-4afc-aaa5-c28f3ce2a0b2'::uuid;

update public.link_qr_registry
set label='+56967885621',
    metadata=metadata || jsonb_build_object('identity_rule','unique-person-v2'),
    updated_at=now()
where entity_type='person'
  and entity_id='285c4d7c-01a6-4afc-aaa5-c28f3ce2a0b2'::uuid;

create unique index if not exists link_persons_phone_identity_unique
on public.link_persons (private.link_phone_identity_key(phone))
where status<>'merged'
  and private.link_phone_identity_key(phone) is not null
  and length(private.link_phone_identity_key(phone))>=8;

create or replace function private.ensure_link_person_for_lead(p_lead_id uuid)
returns uuid
language plpgsql
security definer
set search_path to public, private, pg_temp
as $function$
declare
  v_lead public.sales_leads%rowtype;
  v_person_id uuid;
  v_email text;
  v_phone text;
  v_human_name text;
  v_social_provider text;
  v_social_value text;
  v_name_norm text;
begin
  select * into v_lead from public.sales_leads where id=p_lead_id;
  if not found then raise exception 'Lead not found: %',p_lead_id; end if;

  select person_id into v_person_id
  from public.link_person_leads
  where lead_id=p_lead_id
  limit 1;
  if v_person_id is not null then return v_person_id; end if;

  v_email:=nullif(lower(trim(v_lead.email)),'');
  v_phone:=private.link_phone_identity_key(v_lead.phone);
  if v_phone is not null and length(v_phone)<8 then v_phone:=null; end if;

  v_human_name:=case
    when nullif(trim(v_lead.full_name),'') is not null
         and not private.link_operational_name(v_lead.full_name) then trim(v_lead.full_name)
    when nullif(trim(v_lead.company),'') is not null
         and not private.link_operational_name(v_lead.company) then trim(v_lead.company)
    else null
  end;

  if lower(coalesce(v_lead.source,'')) in ('instagram_dm','whatsapp','facebook_messenger')
     and nullif(trim(v_lead.external_ref),'') is not null then
    v_social_provider:=lower(v_lead.source);
    v_social_value:=lower(trim(v_lead.external_ref));
  end if;

  if v_email is not null then
    perform pg_advisory_xact_lock(hashtextextended('email:'||v_email,0));
  elsif v_phone is not null then
    perform pg_advisory_xact_lock(hashtextextended('phone:'||v_phone,0));
  elsif v_social_value is not null then
    perform pg_advisory_xact_lock(hashtextextended('social:'||v_social_provider||':'||v_social_value,0));
  elsif v_human_name is not null then
    v_name_norm:=lower(regexp_replace(v_human_name,'[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+','','g'));
    perform pg_advisory_xact_lock(hashtextextended('name:'||v_name_norm,0));
  end if;

  if v_email is not null then
    select id into v_person_id from public.link_persons
    where lower(trim(email))=v_email and status<>'merged'
    order by created_at limit 1;
  end if;

  if v_person_id is null and v_phone is not null then
    select id into v_person_id from public.link_persons
    where private.link_phone_identity_key(phone)=v_phone and status<>'merged'
    order by created_at limit 1;
  end if;

  if v_person_id is null and v_social_value is not null then
    select person_id into v_person_id from public.link_person_identifiers
    where identifier_type='social'
      and provider=v_social_provider
      and normalized_value=v_social_value
    limit 1;
  end if;

  if v_person_id is null
     and v_email is null and v_phone is null and v_social_value is null
     and v_human_name is not null then
    v_name_norm:=lower(regexp_replace(v_human_name,'[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+','','g'));
    if exists (
      select 1 from public.link_persons p
      where p.status<>'merged'
        and lower(regexp_replace(coalesce(p.display_name,''),'[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+','','g'))=v_name_norm
    ) then
      return null;
    end if;
  end if;

  if v_person_id is null and v_human_name is null then return null; end if;

  if v_person_id is null then
    begin
      insert into public.link_persons(display_name,email,phone,primary_business_id,status,metadata)
      values(
        v_human_name,
        nullif(trim(v_lead.email),''),
        nullif(trim(v_lead.phone),''),
        v_lead.business_id,
        case when v_email is not null or v_phone is not null or v_social_value is not null
             then 'verified' else 'provisional' end,
        jsonb_build_object('first_lead_id',v_lead.id,'first_source',v_lead.source,'identity_resolution','deduplicated_v2')
      )
      returning id into v_person_id;
    exception
      when unique_violation then
        if v_email is not null then
          select id into v_person_id from public.link_persons
          where lower(trim(email))=v_email and status<>'merged'
          order by created_at limit 1;
        end if;
        if v_person_id is null and v_phone is not null then
          select id into v_person_id from public.link_persons
          where private.link_phone_identity_key(phone)=v_phone and status<>'merged'
          order by created_at limit 1;
        end if;
        if v_person_id is null then raise; end if;
    end;
  else
    update public.link_persons
    set display_name=case
          when private.link_operational_name(display_name) or nullif(trim(display_name),'') is null
            then coalesce(v_human_name,display_name)
          else display_name end,
        email=coalesce(nullif(email,''),nullif(trim(v_lead.email),'')),
        phone=coalesce(nullif(phone,''),nullif(trim(v_lead.phone),'')),
        primary_business_id=coalesce(primary_business_id,v_lead.business_id),
        updated_at=now()
    where id=v_person_id;
  end if;

  insert into public.link_person_leads(person_id,lead_id,business_id)
  values(v_person_id,v_lead.id,v_lead.business_id)
  on conflict(lead_id) do update
  set person_id=excluded.person_id,business_id=excluded.business_id;

  if v_social_value is not null then
    insert into public.link_person_identifiers(
      person_id,identifier_type,provider,identifier_value,normalized_value,source_lead_id
    )
    values(v_person_id,'social',v_social_provider,v_lead.external_ref,v_social_value,v_lead.id)
    on conflict(identifier_type,provider,normalized_value) do nothing;
  end if;

  insert into public.link_qr_registry(
    entity_type,entity_id,business_id,universal_code,qr_token,label,status,metadata
  )
  select 'person',p.id,p.primary_business_id,p.universal_code,p.qr_token,
         private.link_human_identity_label(p.display_name,null,p.email,p.phone),
         case when p.status in ('inactive','merged') then 'paused' else 'active' end,
         jsonb_build_object('person_status',p.status,'identity_rule','unique-person-v2')
  from public.link_persons p
  where p.id=v_person_id
  on conflict(entity_type,entity_id) do update
  set business_id=excluded.business_id,
      universal_code=excluded.universal_code,
      qr_token=excluded.qr_token,
      label=excluded.label,
      status=excluded.status,
      metadata=public.link_qr_registry.metadata || excluded.metadata,
      updated_at=now();

  return v_person_id;
end;
$function$;

create or replace function private.sync_link_person_from_sales_lead()
returns trigger
language plpgsql
security definer
set search_path to public, private, pg_temp
as $function$
declare v_person_id uuid;
begin
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
      and (display_name is null or private.link_operational_name(display_name))
      and nullif(trim(email),'') is null
      and (
        private.link_phone_identity_key(phone) is null
        or length(private.link_phone_identity_key(phone))<8
      )
  ) as unresolved_person_rows;

revoke all on public.link_identity_integrity_v from anon;
grant select on public.link_identity_integrity_v to authenticated;
