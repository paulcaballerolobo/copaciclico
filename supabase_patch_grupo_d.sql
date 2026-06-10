-- ============================================================
-- PATCH: Grupo D — Turquía reemplaza UEPC, horarios corregidos
-- ============================================================

-- 1. Agregar Turquía a teams
INSERT INTO teams (code, name, flag, group_letter, is_placeholder)
VALUES ('TUR', 'Turquía', '🇹🇷', 'D', false)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      flag = EXCLUDED.flag,
      group_letter = EXCLUDED.group_letter,
      is_placeholder = EXCLUDED.is_placeholder;

-- 2. Reemplazar UEPC por TUR en los partidos
UPDATE matches SET team_home = 'TUR' WHERE team_home = 'UEPC';
UPDATE matches SET team_away = 'TUR' WHERE team_away = 'UEPC';

-- 3. Eliminar el placeholder UEPC
DELETE FROM teams WHERE code = 'UEPC';

-- 4. Corregir horarios del Grupo D (UTC = hora ART + 3h)
-- USA vs PAR: 12 jun 22:00 ART
UPDATE matches SET kickoff_time = '2026-06-13T01:00:00Z' WHERE match_number = 4;
-- AUS vs TUR: 14 jun 01:00 ART
UPDATE matches SET kickoff_time = '2026-06-14T04:00:00Z' WHERE match_number = 8;
-- USA vs AUS: 19 jun 16:00 ART
UPDATE matches SET kickoff_time = '2026-06-19T19:00:00Z' WHERE match_number = 29;
-- TUR vs PAR: 20 jun 00:00 ART
UPDATE matches SET kickoff_time = '2026-06-20T03:00:00Z' WHERE match_number = 32;
-- TUR vs USA: 25 jun 22:00 ART
UPDATE matches SET kickoff_time = '2026-06-26T01:00:00Z' WHERE match_number = 59;
-- PAR vs AUS: 25 jun 22:00 ART
UPDATE matches SET kickoff_time = '2026-06-26T01:00:00Z' WHERE match_number = 60;
