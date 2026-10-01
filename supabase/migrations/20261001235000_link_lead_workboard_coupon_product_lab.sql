-- LINK ID · lead attention + coupon product lab
create table if not exists public.link_lead_attention (
  lead_id uuid primary key references public.sales_leads(id) on delete cascade,
  manual_priority integer check (manual_priority between 0 and 100),
  pinned boolean not null default false,
  note text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.link_lead_attention enable row level security;
grant select,insert,update,delete on public.link_lead_attention to authenticated;
revoke all on public.link_lead_attention from anon;
drop policy if exists "link members read lead attention" on public.link_lead_attention;
create policy "link members read lead attention" on public.link_lead_attention for select to authenticated using ((select public.link_world_is_member()));
drop policy if exists "link members insert lead attention" on public.link_lead_attention;
create policy "link members insert lead attention" on public.link_lead_attention for insert to authenticated with check ((select public.link_world_is_member()));
drop policy if exists "link members update lead attention" on public.link_lead_attention;
create policy "link members update lead attention" on public.link_lead_attention for update to authenticated using ((select public.link_world_is_member())) with check ((select public.link_world_is_member()));
drop policy if exists "link members delete lead attention" on public.link_lead_attention;
create policy "link members delete lead attention" on public.link_lead_attention for delete to authenticated using ((select public.link_world_is_member()));
drop trigger if exists link_lead_attention_touch on public.link_lead_attention;
create trigger link_lead_attention_touch before update on public.link_lead_attention for each row execute function public.set_updated_at();

create table if not exists public.link_coupon_offer_profiles (
  offer_id uuid primary key references public.link_coupon_offers(id) on delete cascade,
  product_id uuid references public.link_world_products(id) on delete set null,
  headline text,
  ad_copy text,
  cta text,
  audience text,
  creative_path text,
  creative_name text,
  campaign_notes text,
  learnings text,
  next_improvement text,
  version integer not null default 1 check (version >= 1),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.link_coupon_offer_profiles enable row level security;
grant select,insert,update,delete on public.link_coupon_offer_profiles to authenticated;
revoke all on public.link_coupon_offer_profiles from anon;
drop policy if exists "link members read coupon profiles" on public.link_coupon_offer_profiles;
create policy "link members read coupon profiles" on public.link_coupon_offer_profiles for select to authenticated using ((select public.link_world_is_member()));
drop policy if exists "link members insert coupon profiles" on public.link_coupon_offer_profiles;
create policy "link members insert coupon profiles" on public.link_coupon_offer_profiles for insert to authenticated with check ((select public.link_world_is_member()));
drop policy if exists "link members update coupon profiles" on public.link_coupon_offer_profiles;
create policy "link members update coupon profiles" on public.link_coupon_offer_profiles for update to authenticated using ((select public.link_world_is_member())) with check ((select public.link_world_is_member()));
drop policy if exists "link members delete coupon profiles" on public.link_coupon_offer_profiles;
create policy "link members delete coupon profiles" on public.link_coupon_offer_profiles for delete to authenticated using ((select public.link_world_is_member()));
drop trigger if exists link_coupon_offer_profiles_touch on public.link_coupon_offer_profiles;
create trigger link_coupon_offer_profiles_touch before update on public.link_coupon_offer_profiles for each row execute function public.set_updated_at();

create table if not exists public.link_coupon_offer_profile_history (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.link_coupon_offers(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  unique(offer_id,version)
);
alter table public.link_coupon_offer_profile_history enable row level security;
grant select on public.link_coupon_offer_profile_history to authenticated;
revoke all on public.link_coupon_offer_profile_history from anon;
drop policy if exists "link members read coupon profile history" on public.link_coupon_offer_profile_history;
create policy "link members read coupon profile history" on public.link_coupon_offer_profile_history for select to authenticated using ((select public.link_world_is_member()));

create or replace function private.link_coupon_profile_history_capture()
returns trigger language plpgsql security definer set search_path=public,private,pg_temp as $$
begin
  if tg_op='UPDATE' then
    insert into public.link_coupon_offer_profile_history(offer_id,version,snapshot,changed_by,changed_at)
    values(old.offer_id,old.version,to_jsonb(old),old.updated_by,old.updated_at)
    on conflict(offer_id,version) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists link_coupon_profile_history_trigger on public.link_coupon_offer_profiles;
create trigger link_coupon_profile_history_trigger before update on public.link_coupon_offer_profiles for each row execute function private.link_coupon_profile_history_capture();

create or replace view public.link_lead_workboard_v with (security_invoker = true) as
with last_touch as (
  select l.id as lead_id,max(i.occurred_at) as last_interaction_at,count(i.id) as interaction_count,
         count(i.id) filter (where i.action_type='social_conversation') as social_interactions
  from public.sales_leads l left join public.link_interactions i on i.lead_id=l.id group by l.id
), assessment as (
  select distinct on (c.source_id) c.source_id::uuid as lead_id,c.priority_score,c.conversion_level,c.conversion_label,c.recommended_action,c.assessed_at
  from public.link_conversion_assessments c
  where c.source_type='sales_lead' and coalesce(c.active,true)
  order by c.source_id,c.assessed_at desc nulls last,c.created_at desc
), coupon_stats as (
  select lead_id,count(*) filter (where status='confirmed') as coupon_consumptions,
         sum(total_link_due) filter (where status='confirmed') as link_value_generated
  from public.link_coupon_redemptions group by lead_id
)
select i.identity_id,i.lead_id,i.universal_code,i.person_id,i.person_universal_code,i.identity_label,i.identity_basis,i.internal_reference,
       i.business_id,i.business_name,i.source,i.source_page,i.source_cta,i.stage,i.score,i.interested_pack,i.interested_product,
       i.lead_created_at,i.lead_updated_at,
       coalesce(lt.last_interaction_at,i.lead_updated_at,i.lead_created_at) as last_activity_at,
       coalesce(lt.interaction_count,0)::int as interaction_count,
       coalesce(lt.social_interactions,0)::int as social_interactions,
       greatest(0,floor(extract(epoch from (now()-coalesce(lt.last_interaction_at,i.lead_updated_at,i.lead_created_at)))/86400))::int as days_idle,
       a.priority_score as engine_priority,a.conversion_level,a.conversion_label,a.recommended_action,a.assessed_at,
       att.manual_priority,coalesce(att.pinned,false) as pinned,att.note as priority_note,
       case when lower(i.stage) in ('won','lost') then 0 else greatest(0,least(100,round(
         coalesce(att.manual_priority::numeric,a.priority_score,i.score::numeric,50)
         -(greatest(0,extract(epoch from (now()-coalesce(lt.last_interaction_at,i.lead_updated_at,i.lead_created_at)))/86400)
         / case lower(i.stage) when 'proposal' then 10.0 when 'qualified' then 7.0 when 'contacted' then 5.0 else 4.0 end)*18
       ))) end::int as effective_priority,
       case
         when lower(i.stage) in ('won','lost') then 'historical'
         when greatest(0,extract(epoch from (now()-coalesce(lt.last_interaction_at,i.lead_updated_at,i.lead_created_at)))/86400)
              <= case lower(i.stage) when 'proposal' then 4 when 'qualified' then 3 when 'contacted' then 2 else 2 end then 'hot'
         when greatest(0,extract(epoch from (now()-coalesce(lt.last_interaction_at,i.lead_updated_at,i.lead_created_at)))/86400)
              <= case lower(i.stage) when 'proposal' then 8 when 'qualified' then 6 when 'contacted' then 4 else 4 end then 'warm'
         when greatest(0,extract(epoch from (now()-coalesce(lt.last_interaction_at,i.lead_updated_at,i.lead_created_at)))/86400)
              <= case lower(i.stage) when 'proposal' then 14 when 'qualified' then 10 when 'contacted' then 7 else 7 end then 'cooling'
         else 'cold'
       end as relevance_state,
       date_trunc('month',i.lead_created_at)::date as lead_month,
       coalesce(cs.coupon_consumptions,0)::int as coupon_consumptions,
       coalesce(cs.link_value_generated,0)::numeric as link_value_generated
from public.link_lead_identity_v i
left join last_touch lt on lt.lead_id=i.lead_id
left join assessment a on a.lead_id=i.lead_id
left join public.link_lead_attention att on att.lead_id=i.lead_id
left join coupon_stats cs on cs.lead_id=i.lead_id;
revoke all on public.link_lead_workboard_v from anon;
grant select on public.link_lead_workboard_v to authenticated;

create or replace function public.link_set_lead_priority_v1(p_lead_id uuid,p_manual_priority integer,p_pinned boolean,p_note text)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  if not public.link_world_is_member() then raise exception 'Not authorized'; end if;
  insert into public.link_lead_attention(lead_id,manual_priority,pinned,note,updated_by)
  values(p_lead_id,p_manual_priority,coalesce(p_pinned,false),nullif(trim(p_note),''),auth.uid())
  on conflict(lead_id) do update set manual_priority=excluded.manual_priority,pinned=excluded.pinned,note=excluded.note,updated_by=excluded.updated_by,updated_at=now();
end;
$$;
revoke all on function public.link_set_lead_priority_v1(uuid,integer,boolean,text) from public,anon;
grant execute on function public.link_set_lead_priority_v1(uuid,integer,boolean,text) to authenticated;

create or replace function public.link_update_coupon_profile_v1(
  p_offer_id uuid,p_product_id uuid,p_headline text,p_ad_copy text,p_cta text,p_audience text,
  p_creative_path text,p_creative_name text,p_campaign_notes text,p_learnings text,p_next_improvement text
)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  if not public.link_world_is_member() then raise exception 'Not authorized'; end if;
  insert into public.link_coupon_offer_profiles(offer_id,product_id,headline,ad_copy,cta,audience,creative_path,creative_name,campaign_notes,learnings,next_improvement,updated_by)
  values(p_offer_id,p_product_id,nullif(trim(p_headline),''),nullif(trim(p_ad_copy),''),nullif(trim(p_cta),''),nullif(trim(p_audience),''),nullif(trim(p_creative_path),''),nullif(trim(p_creative_name),''),nullif(trim(p_campaign_notes),''),nullif(trim(p_learnings),''),nullif(trim(p_next_improvement),''),auth.uid())
  on conflict(offer_id) do update set
    product_id=excluded.product_id,headline=excluded.headline,ad_copy=excluded.ad_copy,cta=excluded.cta,audience=excluded.audience,
    creative_path=coalesce(excluded.creative_path,public.link_coupon_offer_profiles.creative_path),
    creative_name=coalesce(excluded.creative_name,public.link_coupon_offer_profiles.creative_name),
    campaign_notes=excluded.campaign_notes,learnings=excluded.learnings,next_improvement=excluded.next_improvement,
    version=public.link_coupon_offer_profiles.version+1,updated_by=excluded.updated_by,updated_at=now();
end;
$$;
revoke all on function public.link_update_coupon_profile_v1(uuid,uuid,text,text,text,text,text,text,text,text,text) from public,anon;
grant execute on function public.link_update_coupon_profile_v1(uuid,uuid,text,text,text,text,text,text,text,text,text) to authenticated;

create or replace function public.link_ingest_lead_interaction_v1(
  p_lead_id uuid,p_action_type text,p_channel text default null,p_source text default 'link-id',
  p_margin_estimated numeric default null,p_currency text default 'CLP',p_confidence text default 'observed',
  p_metadata jsonb default '{}'::jsonb,p_occurred_at timestamptz default now()
)
returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_person_id uuid; v_business_id uuid; v_id uuid;
begin
  if not public.link_world_is_member() then raise exception 'Not authorized'; end if;
  select pl.person_id,l.business_id into v_person_id,v_business_id
  from public.sales_leads l left join public.link_person_leads pl on pl.lead_id=l.id
  where l.id=p_lead_id limit 1;
  if v_person_id is null then raise exception 'Lead has no LINK person'; end if;
  insert into public.link_interactions(person_id,business_id,lead_id,action_type,channel,source,margin_estimated,currency,confidence,metadata,occurred_at)
  values(v_person_id,v_business_id,p_lead_id,p_action_type,p_channel,p_source,p_margin_estimated,coalesce(nullif(p_currency,''),'CLP'),coalesce(nullif(p_confidence,''),'observed'),coalesce(p_metadata,'{}'::jsonb),coalesce(p_occurred_at,now()))
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.link_ingest_lead_interaction_v1(uuid,text,text,text,numeric,text,text,jsonb,timestamptz) from public,anon;
grant execute on function public.link_ingest_lead_interaction_v1(uuid,text,text,text,numeric,text,text,jsonb,timestamptz) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('link-coupon-creatives','link-coupon-creatives',false,26214400,array['image/jpeg','image/png','image/webp','application/pdf','video/mp4','video/quicktime']::text[])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "link members read coupon creatives" on storage.objects;
create policy "link members read coupon creatives" on storage.objects for select to authenticated using(bucket_id='link-coupon-creatives' and (select public.link_world_is_member()));
drop policy if exists "link members insert coupon creatives" on storage.objects;
create policy "link members insert coupon creatives" on storage.objects for insert to authenticated with check(bucket_id='link-coupon-creatives' and (select public.link_world_is_member()));
drop policy if exists "link members update coupon creatives" on storage.objects;
create policy "link members update coupon creatives" on storage.objects for update to authenticated using(bucket_id='link-coupon-creatives' and (select public.link_world_is_member())) with check(bucket_id='link-coupon-creatives' and (select public.link_world_is_member()));
drop policy if exists "link members delete coupon creatives" on storage.objects;
create policy "link members delete coupon creatives" on storage.objects for delete to authenticated using(bucket_id='link-coupon-creatives' and (select public.link_world_is_member()));
