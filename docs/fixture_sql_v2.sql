-- ============================================================
-- FIXTURE COMPLETO MUNDIAL 2026 + campo entered_by en predictions
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Agregar campo entered_by a predictions
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS entered_by text DEFAULT 'player';

-- Limpiar partidos existentes
DELETE FROM matches;

-- ── GRUPO A ──
INSERT INTO matches (phase, group_name, week_number, team_home, team_away, kickoff_time, venue) VALUES
('groups','A',1,'México','Sudáfrica','2026-06-11 19:00:00-03','Estadio Ciudad de México'),
('groups','A',1,'Corea del Sur','República Checa','2026-06-11 22:00:00-03','Estadio Guadalajara'),
('groups','A',2,'República Checa','Sudáfrica','2026-06-18 19:00:00-03','Estadio Atlanta'),
('groups','A',2,'México','Corea del Sur','2026-06-18 22:00:00-03','Estadio Guadalajara'),
('groups','A',3,'República Checa','México','2026-06-24 19:00:00-03','Estadio Ciudad de México'),
('groups','A',3,'Sudáfrica','Corea del Sur','2026-06-24 22:00:00-03','Estadio Monterrey'),
-- ── GRUPO B ──
('groups','B',1,'Canadá','Bosnia y Herzegovina','2026-06-12 19:00:00-03','Estadio Toronto'),
('groups','B',1,'Catar','Suiza','2026-06-13 19:00:00-03','Estadio San Francisco'),
('groups','B',2,'Suiza','Bosnia y Herzegovina','2026-06-18 19:00:00-03','Estadio Los Ángeles'),
('groups','B',2,'Canadá','Catar','2026-06-18 22:00:00-03','BC Place Vancouver'),
('groups','B',3,'Suiza','Canadá','2026-06-24 19:00:00-03','BC Place Vancouver'),
('groups','B',3,'Bosnia y Herzegovina','Catar','2026-06-24 22:00:00-03','Estadio Seattle'),
-- ── GRUPO C ──
('groups','C',1,'Haití','Escocia','2026-06-13 19:00:00-03','Estadio Boston'),
('groups','C',1,'Brasil','Marruecos','2026-06-13 22:00:00-03','Estadio Nueva York / Nueva Jersey'),
('groups','C',2,'Escocia','Marruecos','2026-06-19 19:00:00-03','Estadio Boston'),
('groups','C',2,'Brasil','Haití','2026-06-19 22:00:00-03','Estadio Filadelfia'),
('groups','C',3,'Escocia','Brasil','2026-06-24 19:00:00-03','Estadio Miami'),
('groups','C',3,'Marruecos','Haití','2026-06-24 22:00:00-03','Estadio Atlanta'),
-- ── GRUPO D ──
('groups','D',1,'Estados Unidos','Paraguay','2026-06-12 22:00:00-03','Estadio Los Ángeles'),
('groups','D',1,'Australia','Turquía','2026-06-13 22:00:00-03','BC Place Vancouver'),
('groups','D',2,'Turquía','Paraguay','2026-06-19 19:00:00-03','Estadio San Francisco'),
('groups','D',2,'Estados Unidos','Australia','2026-06-19 22:00:00-03','Estadio Seattle'),
('groups','D',3,'Turquía','Estados Unidos','2026-06-25 19:00:00-03','Estadio Los Ángeles'),
('groups','D',3,'Paraguay','Australia','2026-06-25 22:00:00-03','Estadio San Francisco'),
-- ── GRUPO E ──
('groups','E',1,'Costa de Marfil','Ecuador','2026-06-14 19:00:00-03','Estadio Filadelfia'),
('groups','E',1,'Alemania','Curazao','2026-06-14 22:00:00-03','Estadio Houston'),
('groups','E',2,'Alemania','Costa de Marfil','2026-06-20 19:00:00-03','Estadio Toronto'),
('groups','E',2,'Ecuador','Curazao','2026-06-20 22:00:00-03','Estadio Kansas City'),
('groups','E',3,'Curazao','Costa de Marfil','2026-06-25 19:00:00-03','Estadio Filadelfia'),
('groups','E',3,'Ecuador','Alemania','2026-06-25 22:00:00-03','Estadio Nueva York / Nueva Jersey'),
-- ── GRUPO F ──
('groups','F',1,'Países Bajos','Japón','2026-06-14 19:00:00-03','Estadio Dallas'),
('groups','F',1,'Suecia','Túnez','2026-06-14 22:00:00-03','Estadio Monterrey'),
('groups','F',2,'Países Bajos','Suecia','2026-06-20 19:00:00-03','Estadio Houston'),
('groups','F',2,'Túnez','Japón','2026-06-20 22:00:00-03','Estadio Monterrey'),
('groups','F',3,'Japón','Suecia','2026-06-25 19:00:00-03','Estadio Dallas'),
('groups','F',3,'Túnez','Países Bajos','2026-06-25 22:00:00-03','Estadio Kansas City'),
-- ── GRUPO G ──
('groups','G',1,'Irán','Nueva Zelanda','2026-06-15 19:00:00-03','Estadio Los Ángeles'),
('groups','G',1,'Bélgica','Egipto','2026-06-15 22:00:00-03','Estadio Seattle'),
('groups','G',2,'Bélgica','Irán','2026-06-21 19:00:00-03','Estadio Los Ángeles'),
('groups','G',2,'Nueva Zelanda','Egipto','2026-06-21 22:00:00-03','BC Place Vancouver'),
('groups','G',3,'Egipto','Irán','2026-06-26 19:00:00-03','Estadio Seattle'),
('groups','G',3,'Nueva Zelanda','Bélgica','2026-06-26 22:00:00-03','BC Place Vancouver'),
-- ── GRUPO H ──
('groups','H',1,'España','Cabo Verde','2026-06-15 19:00:00-03','Estadio Atlanta'),
('groups','H',1,'Arabia Saudita','Uruguay','2026-06-15 22:00:00-03','Estadio Miami'),
('groups','H',2,'España','Arabia Saudita','2026-06-21 19:00:00-03','Estadio Atlanta'),
('groups','H',2,'Uruguay','Cabo Verde','2026-06-21 22:00:00-03','Estadio Miami'),
('groups','H',3,'Cabo Verde','Arabia Saudita','2026-06-26 19:00:00-03','Estadio Houston'),
('groups','H',3,'Uruguay','España','2026-06-26 22:00:00-03','Estadio Guadalajara'),
-- ── GRUPO I ──
('groups','I',1,'Francia','Senegal','2026-06-16 19:00:00-03','Estadio Nueva York / Nueva Jersey'),
('groups','I',1,'Irak','Noruega','2026-06-16 22:00:00-03','Estadio Boston'),
('groups','I',2,'Francia','Irak','2026-06-22 19:00:00-03','Estadio Filadelfia'),
('groups','I',2,'Noruega','Senegal','2026-06-22 22:00:00-03','Estadio Nueva York / Nueva Jersey'),
('groups','I',3,'Noruega','Francia','2026-06-26 19:00:00-03','Estadio Boston'),
('groups','I',3,'Senegal','Irak','2026-06-26 22:00:00-03','Estadio Toronto'),
-- ── GRUPO J ──
('groups','J',1,'Argentina','Argelia','2026-06-16 19:00:00-03','Estadio Kansas City'),
('groups','J',1,'Austria','Jordania','2026-06-16 22:00:00-03','Estadio San Francisco'),
('groups','J',2,'Argentina','Austria','2026-06-22 19:00:00-03','Estadio Dallas'),
('groups','J',2,'Jordania','Argelia','2026-06-22 22:00:00-03','Estadio San Francisco'),
('groups','J',3,'Argelia','Austria','2026-06-27 19:00:00-03','Estadio Kansas City'),
('groups','J',3,'Jordania','Argentina','2026-06-27 22:00:00-03','Estadio Dallas'),
-- ── GRUPO K ──
('groups','K',1,'Portugal','RD Congo','2026-06-17 19:00:00-03','Estadio Houston'),
('groups','K',1,'Uzbekistán','Colombia','2026-06-17 22:00:00-03','Estadio Ciudad de México'),
('groups','K',2,'Portugal','Uzbekistán','2026-06-23 19:00:00-03','Estadio Houston'),
('groups','K',2,'Colombia','RD Congo','2026-06-23 22:00:00-03','Estadio Guadalajara'),
('groups','K',3,'Colombia','Portugal','2026-06-27 19:00:00-03','Estadio Miami'),
('groups','K',3,'RD Congo','Uzbekistán','2026-06-27 22:00:00-03','Estadio Atlanta'),
-- ── GRUPO L ──
('groups','L',1,'Inglaterra','Croacia','2026-06-17 19:00:00-03','Estadio Dallas'),
('groups','L',1,'Ghana','Panamá','2026-06-17 22:00:00-03','Estadio Toronto'),
('groups','L',2,'Inglaterra','Ghana','2026-06-23 19:00:00-03','Estadio Boston'),
('groups','L',2,'Panamá','Croacia','2026-06-23 22:00:00-03','Estadio Toronto'),
('groups','L',3,'Panamá','Inglaterra','2026-06-27 19:00:00-03','Estadio Nueva York / Nueva Jersey'),
('groups','L',3,'Croacia','Ghana','2026-06-27 22:00:00-03','Estadio Filadelfia'),
-- ── DIECISEISAVOS ──
('r32',NULL,4,'2°A','2°B','2026-06-28 19:00:00-03','Estadio Los Ángeles'),
('r32',NULL,4,'1°E','3°','2026-06-29 19:00:00-03','Estadio Boston'),
('r32',NULL,4,'1°F','2°C','2026-06-29 22:00:00-03','Estadio Monterrey'),
('r32',NULL,4,'1°C','2°F','2026-06-29 22:00:00-03','Estadio Houston'),
('r32',NULL,4,'1°I','3°','2026-06-30 19:00:00-03','Estadio Nueva York / Nueva Jersey'),
('r32',NULL,4,'2°E','2°I','2026-06-30 22:00:00-03','Estadio Dallas'),
('r32',NULL,4,'1°A','3°','2026-07-01 19:00:00-03','Estadio Ciudad de México'),
('r32',NULL,4,'1°L','3°','2026-07-01 22:00:00-03','Estadio Atlanta'),
('r32',NULL,4,'1°G','3°','2026-07-01 22:00:00-03','Estadio Seattle'),
('r32',NULL,4,'1°D','3°','2026-07-02 19:00:00-03','Estadio San Francisco'),
('r32',NULL,4,'1°H','2°J','2026-07-02 19:00:00-03','Estadio Los Ángeles'),
('r32',NULL,4,'2°K','2°L','2026-07-02 22:00:00-03','Estadio Toronto'),
('r32',NULL,4,'1°B','3°','2026-07-03 19:00:00-03','BC Place Vancouver'),
('r32',NULL,4,'1°J','2°H','2026-07-03 19:00:00-03','Estadio Miami'),
('r32',NULL,4,'1°K','3°','2026-07-03 22:00:00-03','Estadio Kansas City'),
('r32',NULL,4,'2°D','2°G','2026-07-03 22:00:00-03','Estadio Dallas'),
-- ── OCTAVOS ──
('r16',NULL,5,'W74','W77','2026-07-04 19:00:00-03','Estadio Filadelfia'),
('r16',NULL,5,'W73','W75','2026-07-04 22:00:00-03','Estadio Houston'),
('r16',NULL,5,'W76','W78','2026-07-05 19:00:00-03','Estadio Nueva York / Nueva Jersey'),
('r16',NULL,5,'W79','W80','2026-07-06 19:00:00-03','Estadio Ciudad de México'),
('r16',NULL,5,'W83','W84','2026-07-06 22:00:00-03','Estadio Dallas'),
('r16',NULL,5,'W81','W82','2026-07-07 19:00:00-03','Estadio Seattle'),
('r16',NULL,5,'W86','W88','2026-07-07 22:00:00-03','Estadio Atlanta'),
('r16',NULL,5,'W85','W87','2026-07-07 22:00:00-03','BC Place Vancouver'),
-- ── CUARTOS ──
('qf',NULL,6,'W89','W90','2026-07-09 19:00:00-03','Estadio Boston'),
('qf',NULL,6,'W93','W94','2026-07-10 19:00:00-03','Estadio Los Ángeles'),
('qf',NULL,6,'W91','W92','2026-07-11 19:00:00-03','Estadio Miami'),
('qf',NULL,6,'W95','W96','2026-07-11 22:00:00-03','Estadio Kansas City'),
-- ── SEMIFINALES ──
('sf',NULL,7,'W97','W98','2026-07-14 19:00:00-03','Estadio Dallas'),
('sf',NULL,7,'W99','W100','2026-07-15 19:00:00-03','Estadio Atlanta'),
-- ── TERCER PUESTO ──
('3rd',NULL,8,'Perdedor SF1','Perdedor SF2','2026-07-18 19:00:00-03','Estadio Miami'),
-- ── FINAL ──
('final',NULL,8,'Ganador SF1','Ganador SF2','2026-07-19 19:00:00-03','MetLife Stadium');
