-- ============================================================================
--  PATCH · Votos del público — correr DESPUÉS de sql_votos_sorteo.sql
--  Arregla: (1) ip NOT NULL rompía cast_vote, (2) policy permisiva vieja
--  dejaba pasar inserts directos a public_votes.
-- ============================================================================

-- 1. La IP ya no es identidad: permitir nulo (cast_vote inserta ip = null)
alter table public_votes alter column ip drop not null;

-- 2. Borrar TODAS las policies de public_votes (incluida la permisiva vieja)
--    y dejar solo lectura pública. Sin policy de INSERT/UPDATE/DELETE para anon
--    → la única vía de voto pasa a ser la función cast_vote (SECURITY DEFINER).
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'public_votes'
  loop
    execute format('drop policy if exists %I on public_votes', r.policyname);
  end loop;
end $$;

alter table public_votes enable row level security;

create policy public_votes_read on public_votes
  for select using (true);

-- ============================================================================
--  Listo. Avisame y re-verifico que el insert directo quede bloqueado
--  y que cast_vote funcione de punta a punta.
-- ============================================================================
