-- =====================================================================
-- SCRIPT DE MIGRACIÓN, ESTRUCTURA Y SEMILLA COMPLETA - MUNDIAL CÍCLICO 2026
-- =====================================================================
-- Ejecuta este script en el editor SQL de Supabase para asegurar que
-- la base de datos tenga la estructura, políticas, funciones e información inicial correctas.

-- ---------------------------------------------------------------------
-- 1. CREACIÓN DE TABLAS (Solo si no existen)
-- ---------------------------------------------------------------------

-- Tabla: users
CREATE TABLE IF NOT EXISTS users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         text NOT NULL,
  username          text UNIQUE NOT NULL,
  access_code       text NOT NULL,
  avatar_url        text,
  points_total      integer DEFAULT 0,
  ranking_position  integer,
  is_admin          boolean DEFAULT false,
  is_active         boolean DEFAULT true,
  last_active_at    timestamptz,
  created_at        timestamptz DEFAULT now()
);

-- Tabla: matches
CREATE TABLE IF NOT EXISTS matches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase               text NOT NULL, -- 'groups'|'r32'|'r16'|'qf'|'sf'|'3rd'|'final'
  group_name          text,
  week_number         integer,
  team_home           text NOT NULL,
  team_away           text NOT NULL,
  kickoff_time        timestamptz NOT NULL,
  venue               text,
  status              text DEFAULT 'upcoming', -- 'upcoming'|'live'|'finished'
  result_home         integer,
  result_away         integer,
  winner              text, -- 'home'|'away'|'draw'
  went_to_penalties   boolean DEFAULT false,
  predictions_open    boolean DEFAULT false,
  confirmed_by_admin  boolean DEFAULT false,
  created_at          timestamptz DEFAULT now()
);

-- Tabla: predictions
CREATE TABLE IF NOT EXISTS predictions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  match_id            uuid NOT NULL REFERENCES matches ON DELETE CASCADE,
  predicted_winner    text NOT NULL, -- 'home'|'draw'|'away'
  predicted_home      integer,
  predicted_away      integer,
  has_exact_score     boolean DEFAULT false,
  is_correct          boolean,
  exact_score_correct boolean,
  exact_score_wrong   boolean,
  points_earned       integer,
  is_rehearsal        boolean DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  UNIQUE (user_id, match_id)
);

-- Tabla: trivia_questions
CREATE TABLE IF NOT EXISTS trivia_questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text   text NOT NULL,
  option_a        text NOT NULL,
  option_b        text NOT NULL,
  option_c        text NOT NULL,
  option_d        text NOT NULL,
  correct_answer  text NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
  difficulty      integer NOT NULL CHECK (difficulty IN (1,2,3)), -- 1=fácil, 2=intermedio, 3=difícil
  category        text,
  is_active       boolean DEFAULT true,
  block_reason    text,
  created_at      timestamptz DEFAULT now()
);

-- Tabla: trivia_sessions
CREATE TABLE IF NOT EXISTS trivia_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  phase            text NOT NULL,
  level_chosen     integer NOT NULL CHECK (level_chosen IN (1,2,3)),
  question_ids     uuid[],
  answers          jsonb DEFAULT '[]', -- [{question_id, selected, correct, time_taken_ms, blocked}]
  score            integer DEFAULT 0,
  points_earned    integer DEFAULT 0,
  status           text DEFAULT 'pending', -- 'pending'|'ready'|'in_progress'|'completed'
  enabled_by_admin boolean DEFAULT false,
  enabled_at       timestamptz,
  started_at       timestamptz,
  completed_at     timestamptz,
  is_rehearsal     boolean DEFAULT false,
  UNIQUE (user_id, phase)
);

-- Tabla: pozo_log
CREATE TABLE IF NOT EXISTS pozo_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount        integer NOT NULL,
  source_type   text NOT NULL, -- 'admin_seed'|'player_lost'
  source_id     uuid,
  running_total integer,
  created_at    timestamptz DEFAULT now()
);

-- Tabla: pozo_attempts
CREATE TABLE IF NOT EXISTS pozo_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users ON DELETE CASCADE UNIQUE,
  points_bet      integer NOT NULL,
  status          text DEFAULT 'enabled', -- 'enabled'|'in_progress'|'won'|'lost'
  question_ids    uuid[],
  answers         jsonb DEFAULT '[]',
  score           integer,
  points_received integer,
  enabled_at      timestamptz,
  started_at      timestamptz,
  completed_at    timestamptz
);

-- Tabla: tv_state
CREATE TABLE IF NOT EXISTS tv_state (
  id                integer PRIMARY KEY DEFAULT 1,
  current_view      text DEFAULT 'ranking', -- 'pronosticos'|'resultado'|'ranking'|'trivia'|'pozo'
  active_match_id   uuid REFERENCES matches,
  active_user_id    uuid REFERENCES users,
  orientation       text DEFAULT 'horizontal', -- 'horizontal'|'vertical'
  trigger_animation boolean DEFAULT false,
  updated_at        timestamptz DEFAULT now()
);

-- Tabla: config
CREATE TABLE IF NOT EXISTS config (
  key        text PRIMARY KEY,
  value      text,
  type       text,
  label      text,
  updated_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2. CREACIÓN DE ÍNDICES RECOMENDADOS (Idempotente)
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_ranking   ON users (ranking_position ASC);
CREATE INDEX IF NOT EXISTS idx_users_points    ON users (points_total DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions (match_id);
CREATE INDEX IF NOT EXISTS idx_matches_status  ON matches (status, kickoff_time ASC);
CREATE INDEX IF NOT EXISTS idx_matches_phase   ON matches (phase);
CREATE INDEX IF NOT EXISTS idx_matches_week    ON matches (week_number);
CREATE INDEX IF NOT EXISTS idx_trivia_difficulty ON trivia_questions (difficulty) WHERE is_active = true;

-- ---------------------------------------------------------------------
-- 3. CREACIÓN DE FUNCIONES RPC (CREATE OR REPLACE)
-- ---------------------------------------------------------------------

-- Función: get_match_prediction_stats
CREATE OR REPLACE FUNCTION get_match_prediction_stats(p_match_id uuid)
RETURNS json AS $$
  SELECT json_build_object(
    'total',    COUNT(*),
    'pct_home', ROUND(100.0 * SUM(CASE WHEN predicted_winner = 'home' THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 1),
    'pct_draw', ROUND(100.0 * SUM(CASE WHEN predicted_winner = 'draw' THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 1),
    'pct_away', ROUND(100.0 * SUM(CASE WHEN predicted_winner = 'away' THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 1)
  )
  FROM predictions
  WHERE match_id = p_match_id
$$ LANGUAGE sql SECURITY DEFINER;

-- Función: get_pozo_total
CREATE OR REPLACE FUNCTION get_pozo_total()
RETURNS integer AS $$
  SELECT COALESCE(SUM(amount), 0)::integer FROM pozo_log;
$$ LANGUAGE sql SECURITY DEFINER;

-- Función: reset_all_points
CREATE OR REPLACE FUNCTION reset_all_points()
RETURNS void AS $$
  UPDATE users SET points_total = 0, ranking_position = NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 4. SEGURIDAD DE FILA (RLS) Y POLÍTICAS (Seguro si ya existen)
-- ---------------------------------------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pozo_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pozo_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Políticas: users
DROP POLICY IF EXISTS users_public_read ON users;
CREATE POLICY users_public_read ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS users_admin_write ON users;
CREATE POLICY users_admin_write ON users FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Políticas: matches
DROP POLICY IF EXISTS matches_public_read ON matches;
CREATE POLICY matches_public_read ON matches FOR SELECT USING (true);
DROP POLICY IF EXISTS matches_admin_write ON matches;
CREATE POLICY matches_admin_write ON matches FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Políticas: predictions
DROP POLICY IF EXISTS predictions_own ON predictions;
CREATE POLICY predictions_own ON predictions FOR ALL
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Políticas: trivia_questions
DROP POLICY IF EXISTS trivia_questions_public_read ON trivia_questions;
CREATE POLICY trivia_questions_public_read ON trivia_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS trivia_questions_admin_write ON trivia_questions;
CREATE POLICY trivia_questions_admin_write ON trivia_questions FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Políticas: trivia_sessions
DROP POLICY IF EXISTS trivia_sessions_own ON trivia_sessions;
CREATE POLICY trivia_sessions_own ON trivia_sessions FOR ALL
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Políticas: pozo_log
DROP POLICY IF EXISTS pozo_log_public_read ON pozo_log;
CREATE POLICY pozo_log_public_read ON pozo_log FOR SELECT USING (true);

-- Políticas: pozo_attempts
DROP POLICY IF EXISTS pozo_attempts_own ON pozo_attempts;
CREATE POLICY pozo_attempts_own ON pozo_attempts FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Políticas: tv_state
DROP POLICY IF EXISTS tv_state_public_read ON tv_state;
CREATE POLICY tv_state_public_read ON tv_state FOR SELECT USING (true);
DROP POLICY IF EXISTS tv_state_admin_write ON tv_state;
CREATE POLICY tv_state_admin_write ON tv_state FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Políticas: config
DROP POLICY IF EXISTS config_public_read ON config;
CREATE POLICY config_public_read ON config FOR SELECT USING (true);
DROP POLICY IF EXISTS config_admin_write ON config;
CREATE POLICY config_admin_write ON config FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- ---------------------------------------------------------------------
-- 5. VALORES DE SEMILLA (Seeds)
-- ---------------------------------------------------------------------

-- Fila inicial de tv_state (si no existe)
INSERT INTO tv_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Configuración Inicial
INSERT INTO config (key, value, type, label) VALUES
('is_rehearsal_mode',       'true',    'boolean', 'Modo ensayo activo'),
('current_phase',           'groups',  'text',    'Fase actual del torneo'),
('tournament_started',      'false',   'boolean', 'Torneo iniciado'),
('current_week',            '1',       'number',  'Jornada/semana actual'),
('pozo_status',             'closed',  'text',    'Estado del Pozo'),
('pozo_initial_amount',     '500',     'number',  'Monto inicial del Pozo'),
('trivia_penalty_points',   '2',       'number',  'Penalidad por respuesta incorrecta en trivia')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, type = EXCLUDED.type, label = EXCLUDED.label;

-- Semilla de Usuarios (Superadmin y Jugadores)
INSERT INTO users (full_name, username, access_code, is_admin) VALUES
('Ian Grandon Soporsky', 'igrandon', 'BCAMSJST', true)
ON CONFLICT (username) DO UPDATE
SET full_name = EXCLUDED.full_name, access_code = EXCLUDED.access_code, is_admin = EXCLUDED.is_admin;

INSERT INTO users (full_name, username, access_code) VALUES
('Marcela Feudale',          'mfeudale',     'DZHEDZTV'),
('Alen Lodeiro',             'alodeiro',     'AGSAGX'),
('Horacio Embon',            'hembon',       'QQJ52EQJ'),
('Lean Illia',               'lillia',       '8MCC5V'),
('Lu Iacono',                'liacono',      'ZT9NU4'),
('Matías Canillán',          'mcanillan',    '6NFCX295'),
('Lucas González Diez',      'lgonzalez',    'NR4FNX'),
('Gallego Veloso',           'gveloso',      '8XVFZFN9'),
('Leandro Renou',            'lrenou',       'YGM2B43P'),
('Silvia Mercado',           'smercado',     'G86KXP'),
('Marina Abiuso',            'mabiuso',      'RJHUJV6P'),
('Sole Vallejos',            'svallejos',    '9ES25E'),
('Claudio Villarruel',       'cvillarruel',  '3QBN9T'),
('Analía Argento',           'aargento',     '5AZYTJWD'),
('Daniel Santa Cruz',        'dsanta',       'EAZZ92S'),
('Rodrigo Estevez Andrade',  'restevez',     '5KWVE2'),
('Pablo Pampin',             'ppampin',      '877VSDN9'),
('Seba Fernández',           'sfernandez',   'HHUCZ49'),
('Sofa Nadal',               'snadal',       '2DRUJ6QG'),
('Lucas Petronio',           'lpetronio',    '2YZPXN6Q'),
('Sofi Sevastianuk',         'ssevastianuk', 'GMVHGC')
ON CONFLICT (username) DO UPDATE
SET full_name = EXCLUDED.full_name, access_code = EXCLUDED.access_code;

-- Semilla de Partidos (Fase de Grupos)
-- Limpiamos partidos de fase de grupos existentes para evitar duplicados al reejecutar
DELETE FROM matches WHERE phase = 'groups';

INSERT INTO matches (phase, group_name, week_number, team_home, team_away, kickoff_time, venue, status) VALUES
-- Grupo A
('groups', 'A', 1, 'MEX', 'CZE', '2026-06-11 21:00:00-03', 'AT&T Stadium, Dallas', 'upcoming'),
('groups', 'A', 1, 'KOR', 'ZAF', '2026-06-11 18:00:00-03', 'SoFi Stadium, Los Ángeles', 'upcoming'),
('groups', 'A', 2, 'MEX', 'ZAF', '2026-06-16 21:00:00-03', 'AT&T Stadium, Dallas', 'upcoming'),
('groups', 'A', 2, 'KOR', 'CZE', '2026-06-16 18:00:00-03', 'SoFi Stadium, Los Ángeles', 'upcoming'),
('groups', 'A', 3, 'MEX', 'KOR', '2026-06-20 21:00:00-03', 'SoFi Stadium, Los Ángeles', 'upcoming'),
('groups', 'A', 3, 'ZAF', 'CZE', '2026-06-20 21:00:00-03', 'AT&T Stadium, Dallas', 'upcoming'),
-- Grupo B
('groups', 'B', 1, 'CAN', 'QAT', '2026-06-12 18:00:00-03', 'SoFi Stadium, Los Ángeles', 'upcoming'),
('groups', 'B', 1, 'BIH', 'SUI', '2026-06-12 21:00:00-03', 'AT&T Stadium, Dallas', 'upcoming'),
('groups', 'B', 2, 'CAN', 'BIH', '2026-06-17 21:00:00-03', 'AT&T Stadium, Dallas', 'upcoming'),
('groups', 'B', 2, 'QAT', 'SUI', '2026-06-17 18:00:00-03', 'SoFi Stadium, Los Ángeles', 'upcoming'),
('groups', 'B', 3, 'CAN', 'SUI', '2026-06-21 21:00:00-03', 'SoFi Stadium, Los Ángeles', 'upcoming'),
('groups', 'B', 3, 'BIH', 'QAT', '2026-06-21 21:00:00-03', 'AT&T Stadium, Dallas', 'upcoming'),
-- Grupo C
('groups', 'C', 1, 'BRA', 'SCO', '2026-06-13 18:00:00-03', 'MetLife Stadium, Nueva York', 'upcoming'),
('groups', 'C', 1, 'MAR', 'HAI', '2026-06-13 21:00:00-03', 'MetLife Stadium, Nueva York', 'upcoming'),
('groups', 'C', 2, 'BRA', 'MAR', '2026-06-17 21:00:00-03', 'MetLife Stadium, Nueva York', 'upcoming'),
('groups', 'C', 2, 'SCO', 'HAI', '2026-06-18 18:00:00-03', 'MetLife Stadium, Nueva York', 'upcoming'),
('groups', 'C', 3, 'BRA', 'HAI', '2026-06-22 21:00:00-03', 'MetLife Stadium, Nueva York', 'upcoming'),
('groups', 'C', 3, 'SCO', 'MAR', '2026-06-22 21:00:00-03', 'MetLife Stadium, Nueva York', 'upcoming'),
-- Grupo J
('groups', 'J', 1, 'ARG', 'DZA', '2026-06-12 21:00:00-03', 'AT&T Stadium, Dallas', 'upcoming'),
('groups', 'J', 1, 'AUT', 'JOR', '2026-06-17 18:00:00-03', 'SoFi Stadium, Los Ángeles', 'upcoming'),
('groups', 'J', 2, 'ARG', 'AUT', '2026-06-21 21:00:00-03', 'AT&T Stadium, Dallas', 'upcoming'),
('groups', 'J', 2, 'DZA', 'JOR', '2026-06-21 21:00:00-03', 'SoFi Stadium, Los Ángeles', 'upcoming'),
('groups', 'J', 3, 'ARG', 'JOR', '2026-06-25 21:00:00-03', 'AT&T Stadium, Dallas', 'upcoming'),
('groups', 'J', 3, 'DZA', 'AUT', '2026-06-25 21:00:00-03', 'SoFi Stadium, Los Ángeles', 'upcoming');
