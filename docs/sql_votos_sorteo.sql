-- ============================================================================
--  VOTOS DEL PÚBLICO + SORTEO  ·  Mundial Cíclico
--  Correr en Supabase → SQL Editor. Es idempotente (se puede correr de nuevo).
--
--  Qué hace:
--   1. Tabla `spectators` (sorteo): nombre, email, contador de votos (chances).
--   2. `public_votes`: agrega voter_token + spectator_id, único (match, token).
--   3. Cierra `public_votes` con RLS (anon NO puede insertar directo).
--   4. RPC `cast_vote(...)`: única vía de voto, valida todo server-side.
--   5. RPC `raffle_stats()`: conteos para el admin SIN exponer emails.
--   6. Bucket de Storage `raffle` para la gráfica del modal.
--   7. Claves de `config` para el switch y la gráfica/textos del modal.
-- ============================================================================

-- ─── 1. SPECTATORS (entradas del sorteo) ────────────────────────────────────
create table if not exists spectators (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  email         text not null,            -- siempre guardado en minúsculas
  votes_count   int  not null default 0,  -- 1 chance por partido votado
  consent       boolean not null default false,
  persist_pref  boolean not null default true,
  created_at    timestamptz not null default now(),
  last_vote_at  timestamptz
);
-- email único (case-insensitive porque lo normalizamos a minúsculas)
create unique index if not exists spectators_email_key on spectators (email);

-- ─── 2. PUBLIC_VOTES: token de dispositivo + dedup ──────────────────────────
alter table public_votes add column if not exists voter_token text;
alter table public_votes add column if not exists spectator_id uuid references spectators(id);

-- Backfill de filas existentes: usar la IP como token legacy
update public_votes set voter_token = 'legacy:' || coalesce(ip, id::text)
where voter_token is null;

alter table public_votes alter column voter_token set not null;

-- 1 voto por dispositivo por partido (lo garantiza la base, no el navegador)
create unique index if not exists public_votes_match_token_key
  on public_votes (match_id, voter_token);

-- ─── 3. RLS: nadie inserta directo en public_votes (solo la RPC) ────────────
alter table public_votes enable row level security;

-- Lectura pública (la home muestra conteos, el árbitro puntúa)
drop policy if exists public_votes_read on public_votes;
create policy public_votes_read on public_votes for select using (true);
-- (No creamos política de INSERT/UPDATE/DELETE para anon → quedan bloqueados.
--  La función cast_vote es SECURITY DEFINER y escribe como dueña.)

-- spectators: sin políticas para anon. Nadie lee/escribe directo (protege emails).
-- Todo acceso pasa por las funciones SECURITY DEFINER de abajo.
alter table spectators enable row level security;

-- ─── 4. RPC cast_vote: única vía de voto ────────────────────────────────────
create or replace function cast_vote(
  p_match_id     uuid,
  p_vote         uuid,
  p_token        text,
  p_spectator_id uuid    default null,
  p_nombre       text    default null,
  p_email        text    default null,
  p_consent      boolean default false,
  p_persist      boolean default true
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match       matches%rowtype;
  v_spectator   uuid;
  v_inserted    boolean := false;
  v_nombre      text;
  v_count       int := 0;
begin
  -- 4.1 partido válido, habilitado y antes del kickoff
  select * into v_match from matches where id = p_match_id;
  if not found then
    return jsonb_build_object('status','invalid','reason','match_not_found');
  end if;
  if not coalesce(v_match.predictions_open, false) then
    return jsonb_build_object('status','closed','reason','not_open');
  end if;
  if v_match.kickoff_time is not null and now() >= v_match.kickoff_time then
    return jsonb_build_object('status','closed','reason','kickoff');
  end if;

  -- 4.2 el voto debe ser un jugador con pronóstico real en este partido
  if not exists (
    select 1 from predictions where match_id = p_match_id and user_id = p_vote
  ) then
    return jsonb_build_object('status','invalid','reason','no_prediction');
  end if;

  -- 4.3 resolver spectator (sorteo) si corresponde
  if p_spectator_id is not null then
    select id into v_spectator from spectators where id = p_spectator_id;
  end if;
  if v_spectator is null and p_email is not null and length(trim(p_email)) > 0 then
    insert into spectators (nombre, email, consent, persist_pref)
    values (
      coalesce(nullif(trim(p_nombre), ''), 'Anónimo'),
      lower(trim(p_email)),
      p_consent,
      p_persist
    )
    on conflict (email) do update set
      nombre       = coalesce(nullif(trim(excluded.nombre), ''), spectators.nombre),
      consent      = spectators.consent or excluded.consent,
      persist_pref = excluded.persist_pref
    returning id into v_spectator;
  end if;

  -- 4.4 insertar el voto con dedup por (partido, token)
  with ins as (
    insert into public_votes (match_id, vote, voter_token, spectator_id, ip)
    values (p_match_id, p_vote::text, p_token, v_spectator, null)
    on conflict (match_id, voter_token) do nothing
    returning 1
  )
  select exists (select 1 from ins) into v_inserted;

  -- 4.5 chances del sorteo: +1 solo si fue un voto nuevo y dejó datos
  if v_spectator is not null then
    if v_inserted then
      update spectators
         set votes_count = votes_count + 1, last_vote_at = now()
       where id = v_spectator
       returning votes_count, nombre into v_count, v_nombre;
    else
      select votes_count, nombre into v_count, v_nombre
        from spectators where id = v_spectator;
    end if;
  end if;

  return jsonb_build_object(
    'status',       case when v_inserted then 'voted' else 'already_voted' end,
    'spectator_id', v_spectator,
    'nombre',       v_nombre,
    'votes_count',  coalesce(v_count, 0)
  );
end;
$$;

grant execute on function cast_vote(uuid,uuid,text,uuid,text,text,boolean,boolean) to anon;

-- ─── 5. RPC raffle_stats: conteos para el admin SIN exponer emails ──────────
create or replace function raffle_stats() returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'entrants',      (select count(*) from spectators),
    'total_chances', (select coalesce(sum(votes_count), 0) from spectators)
  );
$$;
grant execute on function raffle_stats() to anon;

-- ─── 6. STORAGE: bucket público para la gráfica del modal ───────────────────
insert into storage.buckets (id, name, public)
values ('raffle', 'raffle', true)
on conflict (id) do nothing;

drop policy if exists raffle_read on storage.objects;
create policy raffle_read on storage.objects
  for select using (bucket_id = 'raffle');

drop policy if exists raffle_write on storage.objects;
create policy raffle_write on storage.objects
  for insert with check (bucket_id = 'raffle');

drop policy if exists raffle_update on storage.objects;
create policy raffle_update on storage.objects
  for update using (bucket_id = 'raffle');
-- Nota: sin auth real, cualquiera con la anon key podría subir al bucket 'raffle'.
-- Riesgo bajo (solo es la imagen del modal). Si querés endurecerlo después, se
-- restringe por nombre de archivo o se mueve la subida a un script privilegiado.

-- ─── 7. CONFIG: switch + gráfica + textos del modal (editables en el admin) ─
insert into config (key, value) values
  ('raffle_enabled',   'false'),
  ('raffle_image_url', ''),
  ('raffle_title',     '¡Participá del sorteo!'),
  ('raffle_text',      'Dejanos tu nombre y email para entrar al sorteo. Tu voto cuenta igual si no querés participar.')
on conflict (key) do nothing;

-- ============================================================================
--  FIN. Tras correr esto, avisame y sigo con el frontend + scoring + admin.
-- ============================================================================
