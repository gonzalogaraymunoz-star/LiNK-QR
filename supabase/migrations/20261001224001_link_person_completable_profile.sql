grant select on public.projects to authenticated;
drop policy if exists "link members read projects" on public.projects;
create policy "link members read projects"
on public.projects for select
to authenticated
using ((select public.link_world_is_member()));

alter view public.link_person_graph_v set (security_invoker = true);
alter view public.link_person_study_v set (security_invoker = true);
alter view public.link_lead_identity_v set (security_invoker = true);

create table if not exists public.link_person_profile_details (
  person_id uuid primary key references public.link_persons(id) on delete cascade,
  country text,
  city text,
  preferred_language text,
  preferred_channel text,
  relationship_type text,
  interests jsonb not null default '[]'::jsonb,
  notes text,
  next_action text,
  next_action_at timestamptz,
  field_sources jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint link_person_profile_interests_array check (jsonb_typeof(interests)='array'),
  constraint link_person_profile_sources_object check (jsonb_typeof(field_sources)='object')
);

alter table public.link_person_profile_details enable row level security;
grant select,insert,update on public.link_person_profile_details to authenticated;
revoke all on public.link_person_profile_details from anon;

drop policy if exists "link members read person profile details" on public.link_person_profile_details;
create policy "link members read person profile details"
on public.link_person_profile_details for select
to authenticated
using ((select public.link_world_is_member()));

drop policy if exists "link members insert person profile details" on public.link_person_profile_details;
create policy "link members insert person profile details"
on public.link_person_profile_details for insert
to authenticated
with check ((select public.link_world_is_member()));

drop policy if exists "link members update person profile details" on public.link_person_profile_details;
create policy "link members update person profile details"
on public.link_person_profile_details for update
to authenticated
using ((select public.link_world_is_member()))
with check ((select public.link_world_is_member()));

drop trigger if exists link_person_profile_details_touch on public.link_person_profile_details;
create trigger link_person_profile_details_touch
before update on public.link_person_profile_details
for each row execute function public.set_updated_at();

create or replace view public.link_person_profile_v
with (security_invoker = true)
as
select
  g.person_id,
  g.universal_code,
  g.qr_token,
  g.display_name,
  g.email,
  g.phone,
  g.status,
  g.primary_business_id,
  pb.name as primary_business_name,
  g.person_created_at,
  g.lead_count,
  g.interaction_count,
  g.last_interaction_at,
  g.leads,
  d.country,
  d.city,
  d.preferred_language,
  d.preferred_channel,
  d.relationship_type,
  coalesce(d.interests,'[]'::jsonb) as interests,
  d.notes,
  d.next_action,
  d.next_action_at,
  coalesce(d.field_sources,'{}'::jsonb) as field_sources,
  d.updated_at as profile_updated_at,
  s.businesses_touched,
  s.products_touched,
  s.estimated_margin_total,
  s.interaction_sources,
  s.channels,
  s.signals,
  s.max_conversion_level,
  s.max_priority_score,
  s.conversion_assessments,
  coalesce((
    select array_agg(distinct x.channel order by x.channel)
    from (
      select i.channel
      from public.link_interactions i
      where i.person_id=g.person_id and i.channel is not null
      union
      select c.platform
      from public.link_rrss_identity_candidates_v c
      where c.matched_person_id=g.person_id
    ) x
  ),'{}'::text[]) as detected_channels,
  (
    (case when nullif(trim(g.display_name),'') is not null then 15 else 0 end) +
    (case when nullif(trim(g.phone),'') is not null or nullif(trim(g.email),'') is not null then 20 else 0 end) +
    (case when nullif(trim(d.country),'') is not null then 10 else 0 end) +
    (case when nullif(trim(d.preferred_language),'') is not null then 10 else 0 end) +
    (case when nullif(trim(d.preferred_channel),'') is not null then 10 else 0 end) +
    (case when nullif(trim(d.relationship_type),'') is not null then 10 else 0 end) +
    (case when jsonb_array_length(coalesce(d.interests,'[]'::jsonb)) > 0 then 10 else 0 end) +
    (case when g.lead_count > 0 then 5 else 0 end) +
    (case when g.interaction_count > 0 then 5 else 0 end) +
    (case when nullif(trim(d.next_action),'') is not null then 5 else 0 end)
  )::int as completeness_percent,
  case
    when (
      (case when nullif(trim(g.display_name),'') is not null then 15 else 0 end) +
      (case when nullif(trim(g.phone),'') is not null or nullif(trim(g.email),'') is not null then 20 else 0 end) +
      (case when nullif(trim(d.country),'') is not null then 10 else 0 end) +
      (case when nullif(trim(d.preferred_language),'') is not null then 10 else 0 end) +
      (case when nullif(trim(d.preferred_channel),'') is not null then 10 else 0 end) +
      (case when nullif(trim(d.relationship_type),'') is not null then 10 else 0 end) +
      (case when jsonb_array_length(coalesce(d.interests,'[]'::jsonb)) > 0 then 10 else 0 end) +
      (case when g.lead_count > 0 then 5 else 0 end) +
      (case when g.interaction_count > 0 then 5 else 0 end) +
      (case when nullif(trim(d.next_action),'') is not null then 5 else 0 end)
    ) >= 80 then 'conocida'
    when (
      (case when nullif(trim(g.display_name),'') is not null then 15 else 0 end) +
      (case when nullif(trim(g.phone),'') is not null or nullif(trim(g.email),'') is not null then 20 else 0 end) +
      (case when nullif(trim(d.country),'') is not null then 10 else 0 end) +
      (case when nullif(trim(d.preferred_language),'') is not null then 10 else 0 end) +
      (case when nullif(trim(d.preferred_channel),'') is not null then 10 else 0 end) +
      (case when nullif(trim(d.relationship_type),'') is not null then 10 else 0 end) +
      (case when jsonb_array_length(coalesce(d.interests,'[]'::jsonb)) > 0 then 10 else 0 end) +
      (case when g.lead_count > 0 then 5 else 0 end) +
      (case when g.interaction_count > 0 then 5 else 0 end) +
      (case when nullif(trim(d.next_action),'') is not null then 5 else 0 end)
    ) >= 55 then 'enriquecida'
    when (
      (case when nullif(trim(g.display_name),'') is not null then 15 else 0 end) +
      (case when nullif(trim(g.phone),'') is not null or nullif(trim(g.email),'') is not null then 20 else 0 end) +
      (case when nullif(trim(d.country),'') is not null then 10 else 0 end) +
      (case when nullif(trim(d.preferred_language),'') is not null then 10 else 0 end) +
      (case when nullif(trim(d.preferred_channel),'') is not null then 10 else 0 end) +
      (case when nullif(trim(d.relationship_type),'') is not null then 10 else 0 end) +
      (case when jsonb_array_length(coalesce(d.interests,'[]'::jsonb)) > 0 then 10 else 0 end) +
      (case when g.lead_count > 0 then 5 else 0 end) +
      (case when g.interaction_count > 0 then 5 else 0 end) +
      (case when nullif(trim(d.next_action),'') is not null then 5 else 0 end)
    ) >= 30 then 'identificada'
    else 'inicial'
  end as profile_stage
from public.link_person_graph_v g
left join public.link_person_profile_details d on d.person_id=g.person_id
left join public.link_person_study_v s on s.person_id=g.person_id
left join public.link_world_businesses pb on pb.id=g.primary_business_id
where g.status <> 'merged';

revoke all on public.link_person_profile_v from anon;
grant select on public.link_person_profile_v to authenticated;

create or replace function public.link_update_person_profile_v1(
  p_person_id uuid,
  p_display_name text,
  p_email text,
  p_phone text,
  p_country text,
  p_city text,
  p_preferred_language text,
  p_preferred_channel text,
  p_relationship_type text,
  p_interests jsonb,
  p_notes text,
  p_next_action text,
  p_next_action_at timestamptz
)
returns void
language plpgsql
security invoker
set search_path=public,pg_temp
as $$
declare
  v_now timestamptz:=now();
begin
  if not public.link_world_is_member() then
    raise exception 'Not authorized';
  end if;

  update public.link_persons
  set display_name=nullif(trim(p_display_name),''),
      email=nullif(trim(p_email),''),
      phone=nullif(trim(p_phone),''),
      updated_at=v_now
  where id=p_person_id;

  if not found then raise exception 'Person not found'; end if;

  insert into public.link_person_profile_details(
    person_id,country,city,preferred_language,preferred_channel,relationship_type,
    interests,notes,next_action,next_action_at,field_sources,updated_by
  )
  values(
    p_person_id,nullif(trim(p_country),''),nullif(trim(p_city),''),
    nullif(trim(p_preferred_language),''),nullif(trim(p_preferred_channel),''),
    nullif(trim(p_relationship_type),''),
    case when jsonb_typeof(coalesce(p_interests,'[]'::jsonb))='array' then coalesce(p_interests,'[]'::jsonb) else '[]'::jsonb end,
    nullif(trim(p_notes),''),nullif(trim(p_next_action),''),p_next_action_at,
    jsonb_build_object(
      'display_name',jsonb_build_object('source','manual','updated_at',v_now),
      'email',jsonb_build_object('source','manual','updated_at',v_now),
      'phone',jsonb_build_object('source','manual','updated_at',v_now),
      'country',jsonb_build_object('source','manual','updated_at',v_now),
      'city',jsonb_build_object('source','manual','updated_at',v_now),
      'preferred_language',jsonb_build_object('source','manual','updated_at',v_now),
      'preferred_channel',jsonb_build_object('source','manual','updated_at',v_now),
      'relationship_type',jsonb_build_object('source','manual','updated_at',v_now),
      'interests',jsonb_build_object('source','manual','updated_at',v_now),
      'notes',jsonb_build_object('source','manual','updated_at',v_now),
      'next_action',jsonb_build_object('source','manual','updated_at',v_now)
    ),auth.uid()
  )
  on conflict (person_id) do update set
    country=excluded.country,city=excluded.city,preferred_language=excluded.preferred_language,
    preferred_channel=excluded.preferred_channel,relationship_type=excluded.relationship_type,
    interests=excluded.interests,notes=excluded.notes,next_action=excluded.next_action,
    next_action_at=excluded.next_action_at,
    field_sources=public.link_person_profile_details.field_sources || excluded.field_sources,
    updated_by=excluded.updated_by,updated_at=v_now;
end;
$$;

revoke all on function public.link_update_person_profile_v1(uuid,text,text,text,text,text,text,text,text,jsonb,text,text,timestamptz) from public,anon;
grant execute on function public.link_update_person_profile_v1(uuid,text,text,text,text,text,text,text,text,jsonb,text,text,timestamptz) to authenticated;
