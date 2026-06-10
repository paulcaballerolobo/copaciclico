-- ============================================================
-- PATCH: Grupos C, E, F, G, H, I, J, K, L
-- Horarios corregidos + equipos placeholder reemplazados
-- ============================================================

-- ── GRUPO C ────────────────────────────────────────────────
-- SCO vs BRA (match 51): tiempo OK, corregir matchday
UPDATE matches SET matchday = 3 WHERE match_number = 51;
-- MAR vs HAI (match 52): 26 jun 19:00 ART (era 24 jun)
UPDATE matches SET kickoff_time = '2026-06-26T22:00:00Z',
                   matchday = 3
WHERE match_number = 52;

-- ── GRUPO E ────────────────────────────────────────────────
-- GER vs CUR (match 9): 14 jun 14:00 ART (era 15:00)
UPDATE matches SET kickoff_time = '2026-06-14T17:00:00Z' WHERE match_number = 9;
-- CUR vs ECU (match 35): 20 jun 21:00 ART (era 22:00)
UPDATE matches SET kickoff_time = '2026-06-21T00:00:00Z' WHERE match_number = 35;

-- ── GRUPO F ────────────────────────────────────────────────
-- 1. Agregar Suecia
INSERT INTO teams (code, name, flag, group_letter, is_placeholder)
VALUES ('SWE', 'Suecia', '🇸🇪', 'F', false)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name, flag = EXCLUDED.flag,
      group_letter = EXCLUDED.group_letter, is_placeholder = EXCLUDED.is_placeholder;

-- 2. Reemplazar UEPB por SWE en partidos
UPDATE matches SET team_home = 'SWE' WHERE team_home = 'UEPB';
UPDATE matches SET team_away = 'SWE' WHERE team_away = 'UEPB';

-- 3. Eliminar placeholder UEPB
DELETE FROM teams WHERE code = 'UEPB';

-- NED vs JPN (match 10): 14 jun 17:00 ART (era 18:00)
UPDATE matches SET kickoff_time = '2026-06-14T20:00:00Z' WHERE match_number = 10;
-- SWE vs TUN (match 12): 14 jun 23:00 ART (era 15 jun 01:00)
UPDATE matches SET kickoff_time = '2026-06-15T02:00:00Z' WHERE match_number = 12;
-- NED vs SWE (match 33): 20 jun 14:00 ART (era 15:00)
UPDATE matches SET kickoff_time = '2026-06-20T17:00:00Z' WHERE match_number = 33;
-- TUN vs JPN (match 36): 21 jun 01:00 ART (era 03:00)
UPDATE matches SET kickoff_time = '2026-06-21T04:00:00Z' WHERE match_number = 36;
-- JPN vs SWE (match 57): 25 jun 20:00 ART (era 26 jun 00:00)
UPDATE matches SET kickoff_time = '2026-06-25T23:00:00Z' WHERE match_number = 57;
-- TUN vs NED (match 58): 25 jun 20:00 ART (era 26 jun 00:00)
UPDATE matches SET kickoff_time = '2026-06-25T23:00:00Z' WHERE match_number = 58;

-- ── GRUPO G ────────────────────────────────────────────────
-- BEL vs EGY (match 14): 15 jun 16:00 ART (era 19:00)
UPDATE matches SET kickoff_time = '2026-06-15T19:00:00Z' WHERE match_number = 14;
-- IRN vs NZL (match 16): 15 jun 22:00 ART (era 16 jun 04:00)
UPDATE matches SET kickoff_time = '2026-06-16T01:00:00Z' WHERE match_number = 16;
-- BEL vs IRN (match 38): 21 jun 16:00 ART (era 19:00)
UPDATE matches SET kickoff_time = '2026-06-21T19:00:00Z' WHERE match_number = 38;
-- NZL vs EGY (match 40): 21 jun 22:00 ART (era 22 jun 04:00)
UPDATE matches SET kickoff_time = '2026-06-22T01:00:00Z' WHERE match_number = 40;
-- EGY vs IRN (match 65): 27 jun 00:00 ART (era 06:00)
UPDATE matches SET kickoff_time = '2026-06-27T03:00:00Z' WHERE match_number = 65;
-- NZL vs BEL (match 66): 27 jun 00:00 ART (era 06:00)
UPDATE matches SET kickoff_time = '2026-06-27T03:00:00Z' WHERE match_number = 66;

-- ── GRUPO H ────────────────────────────────────────────────
-- CPV vs KSA (match 63): 26 jun 21:00 ART (era 22:00 = 27 jun 01:00 UTC)
UPDATE matches SET kickoff_time = '2026-06-27T00:00:00Z' WHERE match_number = 63;
-- URU vs ESP (match 64): 26 jun 21:00 ART (era 23:00 = 27 jun 02:00 UTC)
UPDATE matches SET kickoff_time = '2026-06-27T00:00:00Z' WHERE match_number = 64;

-- ── GRUPO I ────────────────────────────────────────────────
-- 1. Agregar Irak
INSERT INTO teams (code, name, flag, group_letter, is_placeholder)
VALUES ('IRQ', 'Irak', '🇮🇶', 'I', false)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name, flag = EXCLUDED.flag,
      group_letter = EXCLUDED.group_letter, is_placeholder = EXCLUDED.is_placeholder;

-- 2. Reemplazar FP02 por IRQ
UPDATE matches SET team_home = 'IRQ' WHERE team_home = 'FP02';
UPDATE matches SET team_away = 'IRQ' WHERE team_away = 'FP02';

-- 3. Eliminar placeholder FP02
DELETE FROM teams WHERE code = 'FP02';

-- IRQ vs NOR (match 18): 16 jun 16:00 ART (era 19:00)
UPDATE matches SET kickoff_time = '2026-06-16T19:00:00Z' WHERE match_number = 18;

-- ── GRUPO J ────────────────────────────────────────────────
-- ARG vs ALG (match 19): 16 jun 22:00 ART (era 17 jun 02:00 UTC)
UPDATE matches SET kickoff_time = '2026-06-17T01:00:00Z' WHERE match_number = 19;
-- AUT vs JOR (match 20): 16 jun 02:00 ART (era 17 jun 07:00 UTC — fecha completamente incorrecta)
UPDATE matches SET kickoff_time = '2026-06-16T05:00:00Z',
                   venue = 'Levi''s Stadium, San Francisco'
WHERE match_number = 20;
-- ARG vs AUT (match 41): 22 jun 14:00 ART (era 15:00)
UPDATE matches SET kickoff_time = '2026-06-22T17:00:00Z' WHERE match_number = 41;
-- JOR vs ALG (match 44): 23 jun 01:00 ART (era 03:00)
UPDATE matches SET kickoff_time = '2026-06-23T04:00:00Z' WHERE match_number = 44;
-- ALG vs AUT (match 71): 27 jun 23:00 ART (era 28 jun 03:00 UTC)
UPDATE matches SET kickoff_time = '2026-06-28T02:00:00Z' WHERE match_number = 71;
-- JOR vs ARG (match 72): 27 jun 23:00 ART (era 28 jun 03:00 UTC)
UPDATE matches SET kickoff_time = '2026-06-28T02:00:00Z' WHERE match_number = 72;

-- ── GRUPO K ────────────────────────────────────────────────
-- 1. Agregar República Democrática del Congo
INSERT INTO teams (code, name, flag, group_letter, is_placeholder)
VALUES ('COD', 'R.D. Congo', '🇨🇩', 'K', false)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name, flag = EXCLUDED.flag,
      group_letter = EXCLUDED.group_letter, is_placeholder = EXCLUDED.is_placeholder;

-- 2. Reemplazar FP01 por COD
UPDATE matches SET team_home = 'COD' WHERE team_home = 'FP01';
UPDATE matches SET team_away = 'COD' WHERE team_away = 'FP01';

-- 3. Eliminar placeholder FP01
DELETE FROM teams WHERE code = 'FP01';

-- POR vs COD (match 21): 17 jun 14:00 ART (era 15:00)
UPDATE matches SET kickoff_time = '2026-06-17T17:00:00Z' WHERE match_number = 21;
-- UZB vs COL (match 24): 17 jun 23:00 ART (era 18 jun 01:00 ART)
UPDATE matches SET kickoff_time = '2026-06-18T02:00:00Z' WHERE match_number = 24;
-- POR vs UZB (match 45): 23 jun 14:00 ART (era 15:00)
UPDATE matches SET kickoff_time = '2026-06-23T17:00:00Z' WHERE match_number = 45;
-- COD vs COL (match 48): 23 jun 23:00 ART (era 24 jun 01:00 ART)
UPDATE matches SET kickoff_time = '2026-06-24T02:00:00Z' WHERE match_number = 48;
-- COL vs POR (match 69) y COD vs UZB (match 70): 27 jun 20:30 ART ✓ ya correctos

-- ── GRUPO L ────────────────────────────────────────────────
-- ENG vs CRO (match 22): 17 jun 17:00 ART (era 18:00)
UPDATE matches SET kickoff_time = '2026-06-17T20:00:00Z' WHERE match_number = 22;
-- Resto de partidos del Grupo L: ✓ ya correctos
