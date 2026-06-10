-- ============================================================
-- PATCH: Agregar columna matchday + corregir Grupo A
-- ============================================================

-- 1. Agregar columna matchday (fecha dentro del grupo)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS matchday INTEGER;

-- 2. Poblar matchday desde week_number para fase de grupos
UPDATE matches SET matchday = week_number WHERE phase = 'groups';

-- 3. Corregir horarios Grupo A (UTC = hora ART + 3h)
-- MEX vs RSA: 11 jun 16:00 ART
UPDATE matches SET kickoff_time = '2026-06-11T19:00:00Z' WHERE match_number = 1;
-- KOR vs CZE: 11 jun 23:00 ART
UPDATE matches SET kickoff_time = '2026-06-12T02:00:00Z' WHERE match_number = 2;
-- CZE vs RSA: 18 jun 13:00 ART (ya era correcto, se deja igual)
-- MEX vs KOR: 18 jun 22:00 ART
UPDATE matches SET kickoff_time = '2026-06-19T01:00:00Z' WHERE match_number = 28;
-- CZE vs MEX: 24 jun 22:00 ART
UPDATE matches SET kickoff_time = '2026-06-25T01:00:00Z' WHERE match_number = 53;
-- RSA vs KOR: 24 jun 22:00 ART
UPDATE matches SET kickoff_time = '2026-06-25T01:00:00Z' WHERE match_number = 54;
