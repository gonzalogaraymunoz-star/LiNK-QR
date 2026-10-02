-- Avoid treating natural names beginning with HE (for example Hernan) as operational codes.
create or replace function private.link_operational_name(p_value text)
returns boolean
language sql
immutable
set search_path = public, private, pg_temp
as $$
  select case
    when nullif(trim(p_value),'') is null then false
    when upper(left(trim(p_value),4)) in ('SOL-','SOL_','LAM-','LAM_','HAB-','HAB_','RES-','RES_','CLI-','CLI_') then true
    when upper(left(trim(p_value),3)) in ('HE-','HE_') then true
    when upper(left(trim(p_value),5)) in ('LEAD-','LEAD_') then true
    when upper(trim(p_value)) like 'SIN NOMBRE%' then true
    else false
  end;
$$;
