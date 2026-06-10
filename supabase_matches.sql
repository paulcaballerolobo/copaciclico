-- ============================================================
-- SUPABASE: schema + datos — FIFA Mundial 2026
-- Ejecutar completo en Supabase SQL Editor.
-- ============================================================

-- ── PASO 1: Nuevos campos en matches ─────────────────────────
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS match_number  INTEGER,
  ADD COLUMN IF NOT EXISTS match_label   TEXT;

-- Knockouts tienen team_home/team_away nulos hasta que se definan
ALTER TABLE matches
  ALTER COLUMN team_home DROP NOT NULL,
  ALTER COLUMN team_away DROP NOT NULL;

-- ── PASO 2: Tabla teams ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  code          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  flag          TEXT,
  group_letter  TEXT,
  is_placeholder BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='teams' AND policyname='teams_public_read') THEN
    CREATE POLICY teams_public_read ON teams FOR SELECT USING (true);
  END IF;
END $$;

-- ── PASO 3: Salir del modo ensayo temporalmente ───────────────
UPDATE config SET value = 'false', updated_at = now() WHERE key = 'is_rehearsal_mode';

-- ── PASO 4: Limpiar partidos viejos en cascada ────────────────
TRUNCATE TABLE matches RESTART IDENTITY CASCADE;

-- ── PASO 5: Insertar los 104 partidos ────────────────────────
INSERT INTO matches (match_number, match_label, phase, group_name, week_number, team_home, team_away, kickoff_time, venue, status, predictions_open, predictions_status, confirmed_by_admin)
VALUES
  (1, 'Group A', 'groups', 'A', 1, 'MEX', 'RSA', '2026-06-11T21:00:00Z', 'Estadio Azteca, Mexico City', 'upcoming', false, 'waiting', false),
  (2, 'Group A', 'groups', 'A', 1, 'KOR', 'CZE', '2026-06-12T04:00:00Z', 'Estadio Akron, Guadalajara', 'upcoming', false, 'waiting', false),
  (3, 'Group B', 'groups', 'B', 1, 'CAN', 'BIH', '2026-06-12T19:00:00Z', 'BMO Field, Toronto', 'upcoming', false, 'waiting', false),
  (4, 'Group D', 'groups', 'D', 1, 'USA', 'PAR', '2026-06-13T04:00:00Z', 'SoFi Stadium, Los Angeles', 'upcoming', false, 'waiting', false),
  (5, 'Group B', 'groups', 'B', 1, 'QAT', 'SUI', '2026-06-13T22:00:00Z', 'Levi''s Stadium, San Francisco Bay Area', 'upcoming', false, 'waiting', false),
  (6, 'Group C', 'groups', 'C', 1, 'BRA', 'MAR', '2026-06-13T22:00:00Z', 'MetLife Stadium, New York/New Jersey', 'upcoming', false, 'waiting', false),
  (7, 'Group C', 'groups', 'C', 1, 'HAI', 'SCO', '2026-06-14T01:00:00Z', 'Gillette Stadium, Boston', 'upcoming', false, 'waiting', false),
  (8, 'Group D', 'groups', 'D', 1, 'AUS', 'UEPC', '2026-06-14T07:00:00Z', 'BC Place, Vancouver', 'upcoming', false, 'waiting', false),
  (9, 'Group E', 'groups', 'E', 1, 'GER', 'CUR', '2026-06-14T18:00:00Z', 'NRG Stadium, Houston', 'upcoming', false, 'waiting', false),
  (10, 'Group F', 'groups', 'F', 1, 'NED', 'JPN', '2026-06-14T21:00:00Z', 'AT&T Stadium, Dallas', 'upcoming', false, 'waiting', false),
  (11, 'Group E', 'groups', 'E', 1, 'CIV', 'ECU', '2026-06-14T23:00:00Z', 'Lincoln Financial Field, Philadelphia', 'upcoming', false, 'waiting', false),
  (12, 'Group F', 'groups', 'F', 1, 'UEPB', 'TUN', '2026-06-15T04:00:00Z', 'Estadio BBVA, Monterrey', 'upcoming', false, 'waiting', false),
  (13, 'Group H', 'groups', 'H', 1, 'ESP', 'CPV', '2026-06-15T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta', 'upcoming', false, 'waiting', false),
  (14, 'Group G', 'groups', 'G', 1, 'BEL', 'EGY', '2026-06-15T22:00:00Z', 'Lumen Field, Seattle', 'upcoming', false, 'waiting', false),
  (15, 'Group H', 'groups', 'H', 1, 'KSA', 'URU', '2026-06-15T22:00:00Z', 'Hard Rock Stadium, Miami', 'upcoming', false, 'waiting', false),
  (16, 'Group G', 'groups', 'G', 1, 'IRN', 'NZL', '2026-06-16T04:00:00Z', 'SoFi Stadium, Los Angeles', 'upcoming', false, 'waiting', false),
  (17, 'Group I', 'groups', 'I', 1, 'FRA', 'SEN', '2026-06-16T19:00:00Z', 'MetLife Stadium, New York/New Jersey', 'upcoming', false, 'waiting', false),
  (18, 'Group I', 'groups', 'I', 1, 'FP02', 'NOR', '2026-06-16T22:00:00Z', 'Gillette Stadium, Boston', 'upcoming', false, 'waiting', false),
  (19, 'Group J', 'groups', 'J', 1, 'ARG', 'ALG', '2026-06-17T02:00:00Z', 'Arrowhead Stadium, Kansas City', 'upcoming', false, 'waiting', false),
  (20, 'Group J', 'groups', 'J', 1, 'AUT', 'JOR', '2026-06-17T07:00:00Z', 'Levi''s Stadium, San Francisco Bay Area', 'upcoming', false, 'waiting', false),
  (21, 'Group K', 'groups', 'K', 1, 'POR', 'FP01', '2026-06-17T18:00:00Z', 'NRG Stadium, Houston', 'upcoming', false, 'waiting', false),
  (22, 'Group L', 'groups', 'L', 1, 'ENG', 'CRO', '2026-06-17T21:00:00Z', 'AT&T Stadium, Dallas', 'upcoming', false, 'waiting', false),
  (23, 'Group L', 'groups', 'L', 1, 'GHA', 'PAN', '2026-06-17T23:00:00Z', 'BMO Field, Toronto', 'upcoming', false, 'waiting', false),
  (24, 'Group K', 'groups', 'K', 1, 'UZB', 'COL', '2026-06-18T04:00:00Z', 'Estadio Azteca, Mexico City', 'upcoming', false, 'waiting', false),
  (25, 'Group A', 'groups', 'A', 2, 'CZE', 'RSA', '2026-06-18T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta', 'upcoming', false, 'waiting', false),
  (26, 'Group B', 'groups', 'B', 2, 'SUI', 'BIH', '2026-06-18T22:00:00Z', 'SoFi Stadium, Los Angeles', 'upcoming', false, 'waiting', false),
  (27, 'Group B', 'groups', 'B', 2, 'CAN', 'QAT', '2026-06-19T01:00:00Z', 'BC Place, Vancouver', 'upcoming', false, 'waiting', false),
  (28, 'Group A', 'groups', 'A', 2, 'MEX', 'KOR', '2026-06-19T03:00:00Z', 'Estadio Akron, Guadalajara', 'upcoming', false, 'waiting', false),
  (29, 'Group D', 'groups', 'D', 2, 'USA', 'AUS', '2026-06-19T22:00:00Z', 'Lumen Field, Seattle', 'upcoming', false, 'waiting', false),
  (30, 'Group C', 'groups', 'C', 2, 'SCO', 'MAR', '2026-06-19T22:00:00Z', 'Gillette Stadium, Boston', 'upcoming', false, 'waiting', false),
  (31, 'Group C', 'groups', 'C', 2, 'BRA', 'HAI', '2026-06-20T01:00:00Z', 'Lincoln Financial Field, Philadelphia', 'upcoming', false, 'waiting', false),
  (32, 'Group D', 'groups', 'D', 2, 'UEPC', 'PAR', '2026-06-20T07:00:00Z', 'Levi''s Stadium, San Francisco Bay Area', 'upcoming', false, 'waiting', false),
  (33, 'Group F', 'groups', 'F', 2, 'NED', 'UEPB', '2026-06-20T18:00:00Z', 'NRG Stadium, Houston', 'upcoming', false, 'waiting', false),
  (34, 'Group E', 'groups', 'E', 2, 'GER', 'CIV', '2026-06-20T20:00:00Z', 'BMO Field, Toronto', 'upcoming', false, 'waiting', false),
  (35, 'Group E', 'groups', 'E', 2, 'ECU', 'CUR', '2026-06-21T01:00:00Z', 'Arrowhead Stadium, Kansas City', 'upcoming', false, 'waiting', false),
  (36, 'Group F', 'groups', 'F', 2, 'TUN', 'JPN', '2026-06-21T06:00:00Z', 'Estadio BBVA, Monterrey', 'upcoming', false, 'waiting', false),
  (37, 'Group H', 'groups', 'H', 2, 'ESP', 'KSA', '2026-06-21T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta', 'upcoming', false, 'waiting', false),
  (38, 'Group G', 'groups', 'G', 2, 'BEL', 'IRN', '2026-06-21T22:00:00Z', 'SoFi Stadium, Los Angeles', 'upcoming', false, 'waiting', false),
  (39, 'Group H', 'groups', 'H', 2, 'URU', 'CPV', '2026-06-21T22:00:00Z', 'Hard Rock Stadium, Miami', 'upcoming', false, 'waiting', false),
  (40, 'Group G', 'groups', 'G', 2, 'NZL', 'EGY', '2026-06-22T04:00:00Z', 'BC Place, Vancouver', 'upcoming', false, 'waiting', false),
  (41, 'Group J', 'groups', 'J', 2, 'ARG', 'AUT', '2026-06-22T18:00:00Z', 'AT&T Stadium, Dallas', 'upcoming', false, 'waiting', false),
  (42, 'Group I', 'groups', 'I', 2, 'FRA', 'FP02', '2026-06-22T21:00:00Z', 'Lincoln Financial Field, Philadelphia', 'upcoming', false, 'waiting', false),
  (43, 'Group I', 'groups', 'I', 2, 'NOR', 'SEN', '2026-06-23T00:00:00Z', 'MetLife Stadium, New York/New Jersey', 'upcoming', false, 'waiting', false),
  (44, 'Group J', 'groups', 'J', 2, 'JOR', 'ALG', '2026-06-23T06:00:00Z', 'Levi''s Stadium, San Francisco Bay Area', 'upcoming', false, 'waiting', false),
  (45, 'Group K', 'groups', 'K', 2, 'POR', 'UZB', '2026-06-23T18:00:00Z', 'NRG Stadium, Houston', 'upcoming', false, 'waiting', false),
  (46, 'Group L', 'groups', 'L', 2, 'ENG', 'GHA', '2026-06-23T20:00:00Z', 'Gillette Stadium, Boston', 'upcoming', false, 'waiting', false),
  (47, 'Group L', 'groups', 'L', 2, 'PAN', 'CRO', '2026-06-23T23:00:00Z', 'BMO Field, Toronto', 'upcoming', false, 'waiting', false),
  (48, 'Group K', 'groups', 'K', 2, 'COL', 'FP01', '2026-06-24T04:00:00Z', 'Estadio Akron, Guadalajara', 'upcoming', false, 'waiting', false),
  (49, 'Group B', 'groups', 'B', 2, 'SUI', 'CAN', '2026-06-24T22:00:00Z', 'BC Place, Vancouver', 'upcoming', false, 'waiting', false),
  (50, 'Group B', 'groups', 'B', 2, 'BIH', 'QAT', '2026-06-24T22:00:00Z', 'Lumen Field, Seattle', 'upcoming', false, 'waiting', false),
  (51, 'Group C', 'groups', 'C', 2, 'SCO', 'BRA', '2026-06-24T22:00:00Z', 'Hard Rock Stadium, Miami', 'upcoming', false, 'waiting', false),
  (52, 'Group C', 'groups', 'C', 2, 'MAR', 'HAI', '2026-06-24T22:00:00Z', 'Mercedes-Benz Stadium, Atlanta', 'upcoming', false, 'waiting', false),
  (53, 'Group A', 'groups', 'A', 2, 'CZE', 'MEX', '2026-06-25T03:00:00Z', 'Estadio Azteca, Mexico City', 'upcoming', false, 'waiting', false),
  (54, 'Group A', 'groups', 'A', 2, 'RSA', 'KOR', '2026-06-25T03:00:00Z', 'Estadio BBVA, Monterrey', 'upcoming', false, 'waiting', false),
  (55, 'Group E', 'groups', 'E', 3, 'CUR', 'CIV', '2026-06-25T20:00:00Z', 'Lincoln Financial Field, Philadelphia', 'upcoming', false, 'waiting', false),
  (56, 'Group E', 'groups', 'E', 3, 'ECU', 'GER', '2026-06-25T20:00:00Z', 'MetLife Stadium, New York/New Jersey', 'upcoming', false, 'waiting', false),
  (57, 'Group F', 'groups', 'F', 3, 'JPN', 'UEPB', '2026-06-26T00:00:00Z', 'AT&T Stadium, Dallas', 'upcoming', false, 'waiting', false),
  (58, 'Group F', 'groups', 'F', 3, 'TUN', 'NED', '2026-06-26T00:00:00Z', 'Arrowhead Stadium, Kansas City', 'upcoming', false, 'waiting', false),
  (59, 'Group D', 'groups', 'D', 3, 'UEPC', 'USA', '2026-06-26T05:00:00Z', 'SoFi Stadium, Los Angeles', 'upcoming', false, 'waiting', false),
  (60, 'Group D', 'groups', 'D', 3, 'PAR', 'AUS', '2026-06-26T05:00:00Z', 'Levi''s Stadium, San Francisco Bay Area', 'upcoming', false, 'waiting', false),
  (61, 'Group I', 'groups', 'I', 3, 'NOR', 'FRA', '2026-06-26T19:00:00Z', 'Gillette Stadium, Boston', 'upcoming', false, 'waiting', false),
  (62, 'Group I', 'groups', 'I', 3, 'SEN', 'FP02', '2026-06-26T19:00:00Z', 'BMO Field, Toronto', 'upcoming', false, 'waiting', false),
  (63, 'Group H', 'groups', 'H', 3, 'CPV', 'KSA', '2026-06-27T01:00:00Z', 'NRG Stadium, Houston', 'upcoming', false, 'waiting', false),
  (64, 'Group H', 'groups', 'H', 3, 'URU', 'ESP', '2026-06-27T02:00:00Z', 'Estadio Akron, Guadalajara', 'upcoming', false, 'waiting', false),
  (65, 'Group G', 'groups', 'G', 3, 'EGY', 'IRN', '2026-06-27T06:00:00Z', 'Lumen Field, Seattle', 'upcoming', false, 'waiting', false),
  (66, 'Group G', 'groups', 'G', 3, 'NZL', 'BEL', '2026-06-27T06:00:00Z', 'BC Place, Vancouver', 'upcoming', false, 'waiting', false),
  (67, 'Group L', 'groups', 'L', 3, 'PAN', 'ENG', '2026-06-27T21:00:00Z', 'MetLife Stadium, New York/New Jersey', 'upcoming', false, 'waiting', false),
  (68, 'Group L', 'groups', 'L', 3, 'CRO', 'GHA', '2026-06-27T21:00:00Z', 'Lincoln Financial Field, Philadelphia', 'upcoming', false, 'waiting', false),
  (69, 'Group K', 'groups', 'K', 3, 'COL', 'POR', '2026-06-27T23:30:00Z', 'Hard Rock Stadium, Miami', 'upcoming', false, 'waiting', false),
  (70, 'Group K', 'groups', 'K', 3, 'FP01', 'UZB', '2026-06-27T23:30:00Z', 'Mercedes-Benz Stadium, Atlanta', 'upcoming', false, 'waiting', false),
  (71, 'Group J', 'groups', 'J', 3, 'ALG', 'AUT', '2026-06-28T03:00:00Z', 'Arrowhead Stadium, Kansas City', 'upcoming', false, 'waiting', false),
  (72, 'Group J', 'groups', 'J', 3, 'JOR', 'ARG', '2026-06-28T03:00:00Z', 'AT&T Stadium, Dallas', 'upcoming', false, 'waiting', false),
  (73, 'Round of 32: 2A vs 2B', 'r32', NULL, 4, NULL, NULL, '2026-06-28T22:00:00Z', 'SoFi Stadium, Los Angeles', 'upcoming', false, 'waiting', false),
  (74, 'Round of 32: 1C vs 2F', 'r32', NULL, 4, NULL, NULL, '2026-06-29T18:00:00Z', 'NRG Stadium, Houston', 'upcoming', false, 'waiting', false),
  (75, 'Round of 32: 1E vs 3ABCDF', 'r32', NULL, 4, NULL, NULL, '2026-06-29T20:30:00Z', 'Gillette Stadium, Boston', 'upcoming', false, 'waiting', false),
  (76, 'Round of 32: 1F vs 2C', 'r32', NULL, 4, NULL, NULL, '2026-06-30T03:00:00Z', 'Estadio BBVA, Monterrey', 'upcoming', false, 'waiting', false),
  (77, 'Round of 32: 2E vs 2I', 'r32', NULL, 4, NULL, NULL, '2026-06-30T18:00:00Z', 'AT&T Stadium, Dallas', 'upcoming', false, 'waiting', false),
  (78, 'Round of 32: 1I vs 3CDFGH', 'r32', NULL, 4, NULL, NULL, '2026-06-30T21:00:00Z', 'MetLife Stadium, New York/New Jersey', 'upcoming', false, 'waiting', false),
  (79, 'Round of 32: 1A vs 3CEFHI', 'r32', NULL, 4, NULL, NULL, '2026-07-01T03:00:00Z', 'Estadio Azteca, Mexico City', 'upcoming', false, 'waiting', false),
  (80, 'Round of 32: 1L vs 3EHIJK', 'r32', NULL, 4, NULL, NULL, '2026-07-01T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta', 'upcoming', false, 'waiting', false),
  (81, 'Round of 32: 1G vs 3AEHIJ', 'r32', NULL, 4, NULL, NULL, '2026-07-01T23:00:00Z', 'Lumen Field, Seattle', 'upcoming', false, 'waiting', false),
  (82, 'Round of 32: 1D vs 3BEFIJ', 'r32', NULL, 4, NULL, NULL, '2026-07-02T03:00:00Z', 'Levi''s Stadium, San Francisco Bay Area', 'upcoming', false, 'waiting', false),
  (83, 'Round of 32: 1H vs 2J', 'r32', NULL, 4, NULL, NULL, '2026-07-02T22:00:00Z', 'SoFi Stadium, Los Angeles', 'upcoming', false, 'waiting', false),
  (84, 'Round of 32: 2K vs 2L', 'r32', NULL, 4, NULL, NULL, '2026-07-02T23:00:00Z', 'BMO Field, Toronto', 'upcoming', false, 'waiting', false),
  (85, 'Round of 32: 1B vs 3EFGIJ', 'r32', NULL, 4, NULL, NULL, '2026-07-03T06:00:00Z', 'BC Place, Vancouver', 'upcoming', false, 'waiting', false),
  (86, 'Round of 32: 2D vs 2G', 'r32', NULL, 4, NULL, NULL, '2026-07-03T19:00:00Z', 'AT&T Stadium, Dallas', 'upcoming', false, 'waiting', false),
  (87, 'Round of 32: 1J vs 2H', 'r32', NULL, 4, NULL, NULL, '2026-07-03T22:00:00Z', 'Hard Rock Stadium, Miami', 'upcoming', false, 'waiting', false),
  (88, 'Round of 32: 1K vs 3DEIJL', 'r32', NULL, 4, NULL, NULL, '2026-07-04T02:30:00Z', 'Arrowhead Stadium, Kansas City', 'upcoming', false, 'waiting', false),
  (89, 'Round of 16: W73 vs W75', 'r16', NULL, 5, NULL, NULL, '2026-07-04T18:00:00Z', 'NRG Stadium, Houston', 'upcoming', false, 'waiting', false),
  (90, 'Round of 16: W74 vs W77', 'r16', NULL, 5, NULL, NULL, '2026-07-04T21:00:00Z', 'Lincoln Financial Field, Philadelphia', 'upcoming', false, 'waiting', false),
  (91, 'Round of 16: W76 vs W78', 'r16', NULL, 5, NULL, NULL, '2026-07-05T20:00:00Z', 'MetLife Stadium, New York/New Jersey', 'upcoming', false, 'waiting', false),
  (92, 'Round of 16: W79 vs W80', 'r16', NULL, 5, NULL, NULL, '2026-07-06T02:00:00Z', 'Estadio Azteca, Mexico City', 'upcoming', false, 'waiting', false),
  (93, 'Round of 16: W83 vs W84', 'r16', NULL, 5, NULL, NULL, '2026-07-06T20:00:00Z', 'AT&T Stadium, Dallas', 'upcoming', false, 'waiting', false),
  (94, 'Round of 16: W81 vs W82', 'r16', NULL, 5, NULL, NULL, '2026-07-07T03:00:00Z', 'Lumen Field, Seattle', 'upcoming', false, 'waiting', false),
  (95, 'Round of 16: W86 vs W88', 'r16', NULL, 5, NULL, NULL, '2026-07-07T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta', 'upcoming', false, 'waiting', false),
  (96, 'Round of 16: W85 vs W87', 'r16', NULL, 5, NULL, NULL, '2026-07-07T23:00:00Z', 'BC Place, Vancouver', 'upcoming', false, 'waiting', false),
  (97, 'Quarterfinals: W89 vs W90', 'qf', NULL, 6, NULL, NULL, '2026-07-09T20:00:00Z', 'Gillette Stadium, Boston', 'upcoming', false, 'waiting', false),
  (98, 'Quarterfinals: W93 vs W94', 'qf', NULL, 6, NULL, NULL, '2026-07-10T22:00:00Z', 'SoFi Stadium, Los Angeles', 'upcoming', false, 'waiting', false),
  (99, 'Quarterfinals: W91 vs W92', 'qf', NULL, 6, NULL, NULL, '2026-07-11T21:00:00Z', 'Hard Rock Stadium, Miami', 'upcoming', false, 'waiting', false),
  (100, 'Quarterfinals: W95 vs W100', 'qf', NULL, 6, NULL, NULL, '2026-07-12T02:00:00Z', 'Arrowhead Stadium, Kansas City', 'upcoming', false, 'waiting', false),
  (101, 'Semifinals: W97 vs W98', 'sf', NULL, 7, NULL, NULL, '2026-07-14T20:00:00Z', 'AT&T Stadium, Dallas', 'upcoming', false, 'waiting', false),
  (102, 'Semifinals: W99 vs W100', 'sf', NULL, 7, NULL, NULL, '2026-07-15T19:00:00Z', 'Mercedes-Benz Stadium, Atlanta', 'upcoming', false, 'waiting', false),
  (103, 'Third Place Playoff: RU101 vs RU102', '3rd', NULL, 8, NULL, NULL, '2026-07-18T21:00:00Z', 'Hard Rock Stadium, Miami', 'upcoming', false, 'waiting', false),
  (104, 'Final: W101 vs W102', 'final', NULL, 8, NULL, NULL, '2026-07-19T19:00:00Z', 'MetLife Stadium, New York/New Jersey', 'upcoming', false, 'waiting', false)
;

-- ── PASO 6: Insertar los 48 equipos ──────────────────────────
INSERT INTO teams (code, name, flag, group_letter, is_placeholder) VALUES
  ('MEX', 'México', '🇲🇽', 'A', false),
  ('RSA', 'Sudáfrica', '🇿🇦', 'A', false),
  ('KOR', 'Corea del Sur', '🇰🇷', 'A', false),
  ('CZE', 'Rep. Checa', '🇨🇿', 'A', false),
  ('CAN', 'Canadá', '🇨🇦', 'B', false),
  ('BIH', 'Bosnia Herz.', '🇧🇦', 'B', false),
  ('QAT', 'Qatar', '🇶🇦', 'B', false),
  ('SUI', 'Suiza', '🇨🇭', 'B', false),
  ('BRA', 'Brasil', '🇧🇷', 'C', false),
  ('MAR', 'Marruecos', '🇲🇦', 'C', false),
  ('HAI', 'Haití', '🇭🇹', 'C', false),
  ('SCO', 'Escocia', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'C', false),
  ('USA', 'Estados Unidos', '🇺🇸', 'D', false),
  ('PAR', 'Paraguay', '🇵🇾', 'D', false),
  ('AUS', 'Australia', '🇦🇺', 'D', false),
  ('UEPC', 'Repechaje C', '❓', 'D', true),
  ('GER', 'Alemania', '🇩🇪', 'E', false),
  ('CUR', 'Curazao', '🇨🇼', 'E', false),
  ('CIV', 'Costa de Marfil', '🇨🇮', 'E', false),
  ('ECU', 'Ecuador', '🇪🇨', 'E', false),
  ('NED', 'Países Bajos', '🇳🇱', 'F', false),
  ('JPN', 'Japón', '🇯🇵', 'F', false),
  ('UEPB', 'Repechaje B', '❓', 'F', true),
  ('TUN', 'Túnez', '🇹🇳', 'F', false),
  ('BEL', 'Bélgica', '🇧🇪', 'G', false),
  ('EGY', 'Egipto', '🇪🇬', 'G', false),
  ('IRN', 'Irán', '🇮🇷', 'G', false),
  ('NZL', 'Nueva Zelanda', '🇳🇿', 'G', false),
  ('ESP', 'España', '🇪🇸', 'H', false),
  ('CPV', 'Cabo Verde', '🇨🇻', 'H', false),
  ('KSA', 'Arabia Saudita', '🇸🇦', 'H', false),
  ('URU', 'Uruguay', '🇺🇾', 'H', false),
  ('FRA', 'Francia', '🇫🇷', 'I', false),
  ('SEN', 'Senegal', '🇸🇳', 'I', false),
  ('FP02', 'Repechaje FIFA 2', '❓', 'I', true),
  ('NOR', 'Noruega', '🇳🇴', 'I', false),
  ('ARG', 'Argentina', '🇦🇷', 'J', false),
  ('ALG', 'Argelia', '🇩🇿', 'J', false),
  ('AUT', 'Austria', '🇦🇹', 'J', false),
  ('JOR', 'Jordania', '🇯🇴', 'J', false),
  ('POR', 'Portugal', '🇵🇹', 'K', false),
  ('FP01', 'Repechaje FIFA 1', '❓', 'K', true),
  ('UZB', 'Uzbekistán', '🇺🇿', 'K', false),
  ('COL', 'Colombia', '🇨🇴', 'K', false),
  ('ENG', 'Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'L', false),
  ('CRO', 'Croacia', '🇭🇷', 'L', false),
  ('GHA', 'Ghana', '🇬🇭', 'L', false),
  ('PAN', 'Panamá', '🇵🇦', 'L', false)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, flag=EXCLUDED.flag, group_letter=EXCLUDED.group_letter, is_placeholder=EXCLUDED.is_placeholder;

-- ── PASO 7: Resetear puntos y ranking de usuarios ────────────
UPDATE users SET points_total = 0, ranking_position = NULL;

-- ── PASO 8: Volver a modo ensayo ─────────────────────────────
UPDATE config SET value = 'true', updated_at = now() WHERE key = 'is_rehearsal_mode';

-- ✅ Listo. Schema actualizado, 104 partidos, 48 equipos, puntos reseteados, modo ensayo activo.
