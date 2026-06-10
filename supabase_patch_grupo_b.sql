-- ============================================================
-- PATCH: Grupo B — horarios corregidos + week_number Fecha 3
-- ============================================================

-- CAN vs BIH: 12 jun 16:00 ART → ya era correcto (2026-06-12T19:00:00Z)

-- QAT vs SUI: 13 jun 16:00 ART
UPDATE matches SET kickoff_time = '2026-06-13T19:00:00Z',
                   venue = 'Levi''s Stadium, San Francisco'
WHERE match_number = 5;

-- SUI vs BIH: 18 jun 16:00 ART
UPDATE matches SET kickoff_time = '2026-06-18T19:00:00Z' WHERE match_number = 26;

-- CAN vs QAT: 18 jun 19:00 ART
UPDATE matches SET kickoff_time = '2026-06-18T22:00:00Z' WHERE match_number = 27;

-- SUI vs CAN: 24 jun 16:00 ART (también corregir week_number a 3)
UPDATE matches SET kickoff_time = '2026-06-24T19:00:00Z',
                   week_number = 3, matchday = 3
WHERE match_number = 49;

-- BIH vs QAT: 24 jun 16:00 ART (también corregir week_number a 3)
UPDATE matches SET kickoff_time = '2026-06-24T19:00:00Z',
                   week_number = 3, matchday = 3
WHERE match_number = 50;
