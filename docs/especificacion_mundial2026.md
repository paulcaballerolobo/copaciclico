# ESPECIFICACIÓN TÉCNICA — Mundial 2026 · Cíclico
## Instrucciones para Claude Code

---

## CONTEXTO GENERAL

Estás construyendo una sección dentro de un micrositio existente (`mundial.esciclico.com`). Es un juego de pronósticos del Mundial 2026 para un programa de televisión en vivo con ~20 participantes fijos. El sistema tiene tres actores: el **superadmin** (produce el programa), los **jugadores** (participantes del programa), y el **público** (visitantes del micrositio y audiencia del programa).

**El sistema NO tiene diseño propio.** El CSS y la identidad visual ya existen en el micrositio. Tu trabajo es construir la lógica, las pantallas y la base de datos. No inventes estilos, no uses frameworks de UI. HTML/CSS/JS vanilla. Consultá el sistema de diseño existente antes de escribir cualquier clase CSS.

**Stack obligatorio:**
- Frontend: HTML / CSS / JS vanilla. Un archivo por pantalla.
- Base de datos: Supabase (Postgres + Realtime + Storage)
- Edge Functions: Supabase Edge Functions (Deno)
- Hosting: Vercel o Netlify (frontend estático)
- Dominio: `mundial.esciclico.com`

---

## MODOS DEL SISTEMA

El sistema tiene dos modos que el superadmin puede alternar:

### Modo Ensayo
- Activo antes del inicio oficial del torneo
- Todos los jugadores pueden explorar el sistema, cargar pronósticos de prueba y jugar trivias de prueba
- Los puntos no cuentan
- El ranking muestra "(ENSAYO)" en el título
- La pantalla TV muestra un badge visible "MODO ENSAYO"
- Al pasar a Modo Real, todos los datos de ensayo se borran automáticamente (predicciones, trivias, puntos)
- Los usuarios, códigos y configuración se conservan
- Controlado por `config.is_rehearsal_mode = true/false`

### Modo Real
- Activo durante el torneo oficial
- Todo cuenta. Nada se puede borrar ni modificar una vez enviado.

---

## ESTRUCTURA DE ARCHIVOS

```
/mundial
├── index.html                    → /mundial (home pública)
├── tv.html                       → /mundial/tv (pantalla TV pública)
├── jugador.html                  → /mundial/jugador/[username]
├── admin.html                    → /mundial/admin (panel admin)
├── admin-tv.html                 → /mundial/admin/tv (control TV)
└── /js
    ├── supabase.js               → cliente Supabase inicializado
    ├── auth.js                   → login con username + access_code
    ├── realtime.js               → suscripciones Realtime compartidas
    └── utils.js                  → helpers compartidos
```

---

## BASE DE DATOS

### Tabla `users`
```sql
CREATE TABLE users (
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
```

### Tabla `matches`
```sql
CREATE TABLE matches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase               text NOT NULL,         -- 'groups'|'r32'|'r16'|'qf'|'sf'|'3rd'|'final'
  group_name          text,                  -- 'A'...'L' solo en grupos
  week_number         integer,               -- jornada/semana
  team_home           text NOT NULL,
  team_away           text NOT NULL,
  kickoff_time        timestamptz NOT NULL,
  venue               text,
  status              text DEFAULT 'upcoming', -- 'upcoming'|'live'|'finished'
  result_home         integer,
  result_away         integer,
  winner              text,                  -- 'home'|'away'|'draw'
  went_to_penalties   boolean DEFAULT false,
  predictions_open    boolean DEFAULT false, -- admin lo abre manualmente
  confirmed_by_admin  boolean DEFAULT false,
  created_at          timestamptz DEFAULT now()
);
```

### Tabla `predictions`
```sql
CREATE TABLE predictions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  match_id            uuid NOT NULL REFERENCES matches ON DELETE CASCADE,
  predicted_winner    text NOT NULL,         -- 'home'|'draw'|'away'
  predicted_home      integer,
  predicted_away      integer,
  has_exact_score     boolean DEFAULT false,
  is_correct          boolean,
  exact_score_correct boolean,
  exact_score_wrong   boolean,
  points_earned       integer,
  is_rehearsal        boolean DEFAULT false, -- si fue cargado en modo ensayo
  created_at          timestamptz DEFAULT now(),
  UNIQUE (user_id, match_id)
);
```

### Tabla `trivia_questions`
```sql
CREATE TABLE trivia_questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text   text NOT NULL,
  option_a        text NOT NULL,
  option_b        text NOT NULL,
  option_c        text NOT NULL,
  option_d        text NOT NULL,
  correct_answer  text NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
  difficulty      integer NOT NULL CHECK (difficulty IN (1,2,3)), -- 1=fácil 2=intermedio 3=difícil
  category        text,
  is_active       boolean DEFAULT true,      -- false = bloqueada por admin, no vuelve a salir
  block_reason    text,                      -- nota interna del admin al bloquear
  created_at      timestamptz DEFAULT now()
);
```

### Tabla `trivia_sessions`
```sql
CREATE TABLE trivia_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  phase           text NOT NULL,
  level_chosen    integer NOT NULL CHECK (level_chosen IN (1,2,3)),
  question_ids    uuid[],                    -- 5 preguntas asignadas
  answers         jsonb DEFAULT '[]',        -- [{question_id, selected, correct, time_taken_ms}]
  score           integer DEFAULT 0,         -- correctas
  points_earned   integer DEFAULT 0,
  status          text DEFAULT 'pending',    -- 'pending'|'ready'|'in_progress'|'completed'
  enabled_by_admin boolean DEFAULT false,    -- el admin la habilitó
  enabled_at      timestamptz,
  started_at      timestamptz,               -- cuando el jugador presionó VAMOS
  completed_at    timestamptz,
  is_rehearsal    boolean DEFAULT false,
  UNIQUE (user_id, phase)
);
```

### Tabla `pozo_log`
```sql
CREATE TABLE pozo_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount        integer NOT NULL,
  source_type   text NOT NULL,               -- 'admin_seed'|'player_lost'
  source_id     uuid,                        -- user_id si player_lost
  running_total integer,
  created_at    timestamptz DEFAULT now()
);
```

### Tabla `pozo_attempts`
```sql
CREATE TABLE pozo_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users ON DELETE CASCADE UNIQUE,
  points_bet      integer NOT NULL,
  status          text DEFAULT 'enabled',    -- 'enabled'|'in_progress'|'won'|'lost'
  question_ids    uuid[],                    -- 10 preguntas asignadas
  answers         jsonb DEFAULT '[]',
  score           integer,
  points_received integer,
  enabled_at      timestamptz,
  started_at      timestamptz,
  completed_at    timestamptz
);
```

### Tabla `tv_state`
```sql
CREATE TABLE tv_state (
  id            integer PRIMARY KEY DEFAULT 1,    -- siempre una sola fila
  current_view  text DEFAULT 'ranking',           -- 'pronosticos'|'resultado'|'ranking'|'pozo'|'trivia'
  active_match_id   uuid REFERENCES matches,      -- para vista 'resultado'
  active_user_id    uuid REFERENCES users,        -- para vista 'trivia'
  orientation   text DEFAULT 'horizontal',        -- 'horizontal'|'vertical'
  trigger_animation boolean DEFAULT false,        -- pulso para disparar animación scoreboard
  updated_at    timestamptz DEFAULT now()
);

-- Insertar la fila única al inicio
INSERT INTO tv_state (id) VALUES (1);
```

### Tabla `config`
```sql
CREATE TABLE config (
  key        text PRIMARY KEY,
  value      text,
  type       text,                           -- 'text'|'boolean'|'number'|'json'
  label      text,
  updated_at timestamptz DEFAULT now()
);

-- Valores iniciales
INSERT INTO config (key, value, type, label) VALUES
('is_rehearsal_mode',       'true',    'boolean', 'Modo ensayo activo'),
('current_phase',           'groups',  'text',    'Fase actual del torneo'),
('tournament_started',      'false',   'boolean', 'Torneo iniciado'),
('current_week',            '1',       'number',  'Jornada/semana actual'),
('pozo_status',             'closed',  'text',    'Estado del Pozo: closed|open|revealed'),
('pozo_initial_amount',     '500',     'number',  'Monto inicial del Pozo'),
('trivia_penalty_points',   '2',       'number',  'Puntos que se restan por respuesta incorrecta en trivia');
```

---

## SEED DE USUARIOS

```sql
-- Superadmin
INSERT INTO users (full_name, username, access_code, is_admin) VALUES
('Ian Grandon Soporsky', 'igrandon', 'BCAMSJST', true);

-- Jugadores
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
('Sofi Sevastianuk',         'ssevastianuk', 'GMVHGC');
```

---

## AUTENTICACIÓN

No usar Supabase Auth nativo. El login es así:

```javascript
// auth.js
async function login(username, access_code) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username.toLowerCase().trim())
    .eq('access_code', access_code.toUpperCase().trim())
    .eq('is_active', true)
    .single()

  if (error || !data) return { success: false }

  localStorage.setItem('mundial_user', JSON.stringify({
    id: data.id,
    username: data.username,
    full_name: data.full_name,
    is_admin: data.is_admin,
    avatar_url: data.avatar_url
  }))

  return { success: true, user: data }
}

function getSession() {
  const raw = localStorage.getItem('mundial_user')
  return raw ? JSON.parse(raw) : null
}

function logout() {
  localStorage.removeItem('mundial_user')
  window.location.href = '/mundial'
}
```

---

## PANTALLAS — ESPECIFICACIÓN DETALLADA

---

### `/mundial` — Home pública

**Quién la ve:** cualquier visitante del micrositio.
**Propósito:** estado actual del torneo de un vistazo.

**Secciones (de arriba hacia abajo):**

1. **Badge de modo** — si `is_rehearsal_mode = true`, mostrar banner "⚠️ MODO ENSAYO — Los puntos no cuentan"

2. **El Pozo** — siempre visible. Muestra el total acumulado en tiempo real (`SUM(pozo_log.amount)`). Si `pozo_status = 'closed'`: "El Pozo se abre después de la final". Si `pozo_status = 'open'`: contador animado del total con label "EN JUEGO". Si `pozo_status = 'revealed'`: ganador y monto.

3. **Ranking actual** — top 5 con nombre, avatar y puntos. Link "Ver ranking completo" que muestra todos en un modal o expande.

4. **Próximos partidos** — partidos de `current_week` con `status = 'upcoming'`. Para cada partido: equipos, fecha/hora, y barra de pronósticos agregados (% que eligió cada opción) solo si `predictions_open = true`.

5. **Últimos resultados** — últimos 3 partidos con `status = 'finished'`. Marcador y quién acertó.

**Datos en tiempo real:** el ranking y el pozo escuchan cambios via Supabase Realtime.

---

### `/mundial/tv` — Pantalla TV pública

**Quién la ve:** el público del programa, proyectada en estudio.
**Propósito:** pantalla de visualización controlada remotamente por el admin.

**Comportamiento general:**
- Escucha cambios en la tabla `tv_state` via Supabase Realtime
- Cuando `tv_state` cambia, la pantalla cambia de vista automáticamente
- Switch horizontal/vertical: cambia el layout según `tv_state.orientation`
- Si `is_rehearsal_mode = true`: badge permanente "MODO ENSAYO" en esquina

**Vista: `pronosticos`**
Muestra todos los partidos de `current_week`. Para cada partido, la grilla de jugadores con su pronóstico. Los que no pronosticaron aparecen en gris con "—". Las respuestas que llegan en tiempo real aparecen con una animación de entrada (fade + slide).

**Vista: `resultado`**
Muestra el partido indicado en `tv_state.active_match_id`:
- Marcador final grande y centrado
- Grilla de jugadores: ✅ acertó ganador / ✅✅ acertó marcador exacto / ❌ erró / — no pronosticó
- Puntos ganados/perdidos por cada uno con color (verde/rojo)

**Vista: `ranking`**
Tabla completa de todos los jugadores ordenada por puntos.
Cuando `tv_state.trigger_animation` cambia a `true`:
- Los jugadores se animan a sus nuevas posiciones (transición CSS de 1.5 segundos)
- Las posiciones que suben brillan en verde con flecha ↑
- Las que bajan en rojo con flecha ↓
- Los puntos nuevos aparecen con contador animado (count-up)
- Después de la animación, la Edge Function resetea `trigger_animation = false`

**Vista: `trivia`**
Muestra la trivia del jugador indicado en `tv_state.active_user_id`:
- Nombre y avatar del jugador grande arriba
- Pregunta actual centrada
- Las 4 opciones visibles
- Contador de 20 segundos (círculo animado que se vacía)
- Cuando el jugador responde: la opción seleccionada se destaca + se revela cuál era la correcta
- Puntuación acumulada de la sesión en tiempo real
- Cuando termina: resumen de las 5 preguntas con resultado final

**Vista: `pozo`**
- Total del pozo grande y animado
- Si hay un intento en curso (`pozo_attempts.status = 'in_progress'`): muestra la trivia del jugador igual que la vista `trivia` pero con contexto del pozo
- Historial de intentos: quién perdió y cuánto sumó al pozo

**Layout horizontal vs vertical:**
- Horizontal (16:9): diseño en columnas, texto grande, pensado para pantalla de estudio
- Vertical (9:16): diseño en filas, fuente más grande, pensado para transmisión móvil o story

---

### `/mundial/jugador/[username]` — Panel del jugador

**Quién la ve:** cada jugador desde su celular, autenticado con su código.
**Propósito:** cargar pronósticos, jugar trivia, ver su estado.

**Login:**
Formulario simple: campo username (pre-cargado desde la URL `[username]`) + campo código. Al autenticar, la sesión se guarda en `localStorage`. Si ya hay sesión activa, salta el login.

**Secciones:**

1. **Header personal** — avatar (con botón para cambiar foto), nombre, puntos totales, posición en el ranking. Si `is_rehearsal_mode`: badge "ENSAYO".

2. **Trivia activa** — solo visible si `trivia_sessions` tiene un registro para este usuario con `status = 'ready'` (el admin la habilitó). Muestra un botón grande **"VAMOS"**. Al presionar:
   - `trivia_sessions.status` cambia a `'in_progress'`
   - `trivia_sessions.started_at` = now()
   - La vista `trivia` en `/mundial/tv` se activa automáticamente via `tv_state`
   - Arranca la secuencia de 5 preguntas

   **Secuencia de preguntas:**
   - Una pregunta a la vez, pantalla completa
   - Opciones A / B / C / D como botones grandes (pensados para dedo gordo en celular)
   - Contador visual de 20 segundos
   - Al seleccionar: la respuesta se guarda inmediatamente en `trivia_sessions.answers` (jsonb append)
   - Se revela si fue correcta o incorrecta
   - 2 segundos de pausa y avanza a la siguiente
   - Sin opción de volver atrás
   - Al terminar las 5: pantalla de resumen con puntos ganados

3. **Mis pronósticos — partidos abiertos** — lista de partidos de `current_week` con `predictions_open = true` y sin pronóstico registrado. Para cada partido:
   - Equipos + fecha/hora + countdown al cierre (1 hora antes del kickoff)
   - Selector de ganador (grupos: 3 opciones / eliminatorias: 2 opciones)
   - Campo opcional de marcador exacto (se habilita al elegir ganador)
   - Validación: el marcador debe ser coherente con el ganador elegido
   - Botón "Confirmar pronóstico" — una vez enviado no se puede modificar
   - Feedback inmediato de confirmación

4. **Mis pronósticos — enviados** — lista de pronósticos ya enviados para la jornada. Solo lectura. Muestra el marcador predicho y, si el partido terminó, el resultado y los puntos.

5. **El Pozo** — si `pozo_status = 'open'` y `ranking_position > 3` y no intentó antes: botón "Quiero intentar el Pozo" (esto le avisa al admin que el jugador está interesado — no lo habilita, solo manda señal). Si el admin lo habilitó (`pozo_attempts.status = 'enabled'`): botón grande "JUGAR EL POZO" con el total acumulado visible.

**Upload de foto:**
Botón "Cambiar foto" abre selector de archivo. La imagen se sube a Supabase Storage en `/avatars/[user_id].[ext]`. Se actualiza `users.avatar_url`. Límite: 2MB, solo JPG/PNG/WEBP.

---

### `/mundial/admin/tv` — Control de pantalla TV

**Quién la ve:** solo el superadmin.
**Propósito:** controlar en tiempo real lo que se proyecta en el estudio.

**Layout:** dos columnas. Izquierda: controles. Derecha: preview en miniatura de `/mundial/tv`.

**Controles:**

1. **Switch de orientación** — toggle Horizontal / Vertical. Actualiza `tv_state.orientation`.

2. **Selector de vista** — 5 botones grandes:
   - PRONÓSTICOS
   - RESULTADO (despliega selector de partido)
   - RANKING
   - TRIVIA (despliega selector de jugador)
   - POZO

   Al hacer click: UPDATE en `tv_state.current_view` → la pantalla TV cambia instantáneamente.

3. **Botón ANIMAR SCOREBOARD** — solo visible en vista RANKING. Al presionar: UPDATE `tv_state.trigger_animation = true` → dispara la animación en la pantalla TV.

4. **Panel de Trivia** — visible al seleccionar vista TRIVIA:
   - Lista de jugadores con estado de trivia por fase actual
   - Botón "Activar trivia" por jugador → INSERT/UPDATE en `trivia_sessions` con `status = 'ready'`, `enabled_by_admin = true`
   - Indicador en tiempo real: "Esperando que presione VAMOS" / "En progreso" / "Completada"
   - Botón "Bloquear pregunta" (visible post-sesión): seleccioná qué pregunta bloquear, ingresá motivo, UPDATE `trivia_questions.is_active = false`

5. **Panel del Pozo** — visible al seleccionar vista POZO:
   - Total acumulado actual
   - Campo para cargar monto inicial (INSERT en `pozo_log` con `source_type = 'admin_seed'`)
   - Lista de jugadores elegibles (ranking > 3, no intentaron)
   - Botón "Habilitar para el Pozo" por jugador → INSERT en `pozo_attempts` con `status = 'enabled'`
   - Estado de intentos en curso en tiempo real

---

### `/mundial/admin` — Panel de administración

**Quién la ve:** solo el superadmin.

**Secciones:**

1. **Modo del sistema** — toggle grande: ENSAYO / REAL. Advertencia al pasar a Real: "Esto borrará todos los datos de ensayo. ¿Estás seguro?". Al confirmar: llama a Edge Function `clear-rehearsal-data`.

2. **Partidos** — lista de todos los partidos organizados por semana/jornada. Para cada partido:
   - Estado (upcoming / live / finished)
   - Switch "Abrir pronósticos" (actualiza `matches.predictions_open`)
   - Switch "En vivo" (actualiza `matches.status = 'live'`)
   - Formulario de resultado (inputs de goles + checkbox "fue a penales" + selector ganador en eliminatorias)
   - Botón "Confirmar resultado" → llama a Edge Function `process-match-result`
   - Botón "Agregar partido" (formulario inline)

3. **Jugadores** — tabla de todos los jugadores con:
   - Nombre, username, código, puntos, ranking, estado (activo/inactivo)
   - Botón "Resetear código" → genera nuevo código alfanumérico y lo actualiza
   - Botón "Activar/desactivar"
   - Botón "Agregar jugador" (formulario inline)

4. **Trivia — banco de preguntas** — lista de preguntas con:
   - Texto, opciones, respuesta correcta, dificultad, estado (activa/bloqueada)
   - Botón "Bloquear" con campo de motivo
   - Formulario "Agregar pregunta"
   - Importar preguntas en bloque (CSV: pregunta, a, b, c, d, correcta, dificultad)

5. **Pozo** — historial completo de `pozo_log` + estado de intentos.

---

## EDGE FUNCTIONS

### `process-match-result`
**Trigger:** admin confirma resultado desde el panel.
**Lógica:**
```javascript
const BASE_POINTS = {
  groups: 10, r32: 20, r16: 40,
  qf: 80, sf: 150, '3rd': 80, final: 200
}

for (const prediction of match_predictions) {
  let points = 0
  const base = BASE_POINTS[match.phase]

  const is_correct = prediction.predicted_winner === match.winner
  const exact_score_correct = prediction.has_exact_score
    && prediction.predicted_home === match.result_home
    && prediction.predicted_away === match.result_away
  const exact_score_wrong = prediction.has_exact_score && !exact_score_correct

  if (is_correct) points += base
  if (exact_score_correct) points += Math.round(base * 0.5)
  if (exact_score_wrong) points -= Math.round(base * 0.5)

  // Si es modo ensayo, no acreditar puntos reales
  if (!is_rehearsal_mode) {
    await increment_user_points(prediction.user_id, points)
  }

  await update_prediction({ is_correct, exact_score_correct, exact_score_wrong, points_earned: points })
}

await calculate_rankings()
```

### `close-trivia-session`
**Trigger:** al completarse la pregunta 5 de una sesión.
**Lógica:**
```javascript
const POINTS = { 1: 5, 2: 10, 3: 20 }      // por nivel
const PENALTY = config.trivia_penalty_points  // default: 2

let points = 0
for (const answer of session.answers) {
  if (answer.correct) points += POINTS[session.level_chosen]
  else points -= PENALTY
}

points = Math.max(0, points)  // no puede quedar negativo por trivia

await update_trivia_session({ points_earned: points, status: 'completed' })
if (!is_rehearsal_mode) {
  await increment_user_points(session.user_id, points)
}
await calculate_rankings()
```

### `place-pozo-attempt`
**Trigger:** jugador confirma que quiere jugar el Pozo.
**Lógica (transacción atómica):**
```javascript
const user_points = users.points_total

// 1. Transferir puntos al pozo
await insert_pozo_log({ amount: user_points, source_type: 'player_lost', source_id: user_id })

// 2. Resetear puntos del jugador
await update_user({ points_total: 0 })

// 3. Actualizar intento
await update_pozo_attempt({ status: 'in_progress', points_bet: user_points, started_at: now() })

// 4. Asignar 10 preguntas aleatorias de nivel intermedio
const questions = await get_random_questions({ difficulty: 2, count: 10, exclude_used_by: user_id })
await update_pozo_attempt({ question_ids: questions.map(q => q.id) })
```

### `resolve-pozo-attempt`
**Trigger:** al completarse la pregunta 10 del pozo.
```javascript
const score = count_correct_answers(attempt.answers)

if (score >= 6) {
  // Gana
  const pozo_total = await get_pozo_total()
  await update_user({ points_total: pozo_total })
  await update_pozo_attempt({ status: 'won', score, points_received: pozo_total })
  await update_config({ pozo_status: 'revealed' })
} else {
  // Pierde — sus puntos ya están en el pozo desde place-pozo-attempt
  await update_pozo_attempt({ status: 'lost', score })
}
await calculate_rankings()
```

### `calculate-rankings`
```javascript
const users = await get_all_users_ordered_by_points()
for (let i = 0; i < users.length; i++) {
  await update_user(users[i].id, { ranking_position: i + 1 })
}
// Disparar animación en TV
await update_tv_state({ trigger_animation: true })
```

### `clear-rehearsal-data`
**Trigger:** admin pasa de Modo Ensayo a Modo Real.
```javascript
await supabase.from('predictions').delete().eq('is_rehearsal', true)
await supabase.from('trivia_sessions').delete().eq('is_rehearsal', true)
await supabase.from('pozo_log').delete().neq('id', null)  // vaciar el pozo
await supabase.from('pozo_attempts').delete().neq('id', null)
await supabase.rpc('reset_all_points')  // users.points_total = 0, ranking_position = null
await update_config({ is_rehearsal_mode: 'false', tournament_started: 'false' })
```

---

## REALTIME — SUSCRIPCIONES

```javascript
// realtime.js

// Pantalla TV escucha cambios en tv_state
supabase.channel('tv-control')
  .on('postgres_changes', {
    event: 'UPDATE', schema: 'public', table: 'tv_state'
  }, handleTvStateChange)
  .subscribe()

// Ranking en tiempo real
supabase.channel('ranking-live')
  .on('postgres_changes', {
    event: 'UPDATE', schema: 'public', table: 'users'
  }, handleRankingUpdate)
  .subscribe()

// Pozo en tiempo real
supabase.channel('pozo-live')
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'pozo_log'
  }, handlePozoUpdate)
  .subscribe()

// Trivia en tiempo real (para pantalla TV)
supabase.channel('trivia-live')
  .on('postgres_changes', {
    event: 'UPDATE', schema: 'public', table: 'trivia_sessions'
  }, handleTriviaUpdate)
  .subscribe()

// Pronósticos en tiempo real (para vista pronosticos en TV)
supabase.channel('predictions-live')
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'predictions'
  }, handleNewPrediction)
  .subscribe()
```

---

## ANIMACIÓN DEL SCOREBOARD

La animación del ranking es el momento más dramático del programa. Debe implementarse así:

```javascript
// ranking-animation.js

async function animateRanking(old_ranking, new_ranking) {
  const container = document.getElementById('ranking-list')
  const items = container.querySelectorAll('.ranking-item')

  // 1. Calcular movimientos
  const movements = new_ranking.map(user => {
    const old_pos = old_ranking.findIndex(u => u.id === user.id)
    const new_pos = new_ranking.findIndex(u => u.id === user.id)
    return { user, old_pos, new_pos, delta: old_pos - new_pos }
  })

  // 2. Fase 1: resaltar puntos nuevos (0.5s)
  movements.forEach(({ user, delta }) => {
    const el = document.querySelector(`[data-user-id="${user.id}"] .points`)
    if (delta !== 0) {
      el.classList.add(delta > 0 ? 'points-up' : 'points-down')
      animateCountUp(el, user.old_points, user.points_total, 800)
    }
  })

  await sleep(800)

  // 3. Fase 2: mover posiciones con FLIP animation (1.5s)
  // Usar técnica FLIP (First, Last, Invert, Play)
  const first = {}
  items.forEach(item => {
    first[item.dataset.userId] = item.getBoundingClientRect()
  })

  // Reordenar el DOM
  new_ranking.forEach((user, index) => {
    const el = document.querySelector(`[data-user-id="${user.id}"]`)
    container.appendChild(el)
    el.querySelector('.position').textContent = index + 1
  })

  // Animar con FLIP
  items.forEach(item => {
    const userId = item.dataset.userId
    const last = item.getBoundingClientRect()
    const deltaY = first[userId].top - last.top

    if (deltaY !== 0) {
      item.style.transform = `translateY(${deltaY}px)`
      item.style.transition = 'none'

      requestAnimationFrame(() => {
        item.style.transition = 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        item.style.transform = 'translateY(0)'

        // Agregar flecha y color
        const arrow = item.querySelector('.rank-arrow')
        if (deltaY > 0) {
          arrow.textContent = '↑'
          arrow.className = 'rank-arrow up'
        } else {
          arrow.textContent = '↓'
          arrow.className = 'rank-arrow down'
        }
      })
    }
  })

  await sleep(1500)

  // 4. Limpiar clases de animación
  items.forEach(item => {
    item.style.transform = ''
    item.style.transition = ''
    item.querySelector('.rank-arrow').textContent = ''
  })

  // 5. Avisar a Supabase que terminó la animación
  await supabase.from('tv_state').update({ trigger_animation: false }).eq('id', 1)
}

function animateCountUp(el, from, to, duration) {
  const start = performance.now()
  const diff = to - from
  function update(time) {
    const elapsed = time - start
    const progress = Math.min(elapsed / duration, 1)
    el.textContent = Math.round(from + diff * easeOut(progress))
    if (progress < 1) requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3) }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
```

---

## ROW-LEVEL SECURITY

```sql
-- Users: lectura pública de campos no sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_public_read" ON users FOR SELECT USING (true);
CREATE POLICY "users_admin_write" ON users FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Predictions: cada jugador ve las suyas; admin ve todas; público ve agregados via RPC
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "predictions_own" ON predictions FOR ALL
  USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Trivia sessions: mismo patrón
ALTER TABLE trivia_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trivia_own" ON trivia_sessions FOR ALL
  USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- tv_state: lectura pública, escritura solo admin
ALTER TABLE tv_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tv_state_read" ON tv_state FOR SELECT USING (true);
CREATE POLICY "tv_state_admin_write" ON tv_state FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Config: lectura pública, escritura solo admin
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config_read" ON config FOR SELECT USING (true);
CREATE POLICY "config_admin_write" ON config FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Pozo: lectura pública
ALTER TABLE pozo_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pozo_read" ON pozo_log FOR SELECT USING (true);

-- Pozo attempts: jugador ve el suyo, admin ve todos
ALTER TABLE pozo_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pozo_attempts_own" ON pozo_attempts FOR SELECT
  USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
```

---

## FUNCIONES RPC

```sql
-- Estadísticas agregadas de pronósticos para un partido (sin revelar quién eligió qué antes del cierre)
CREATE OR REPLACE FUNCTION get_match_prediction_stats(p_match_id uuid)
RETURNS json AS $$
  SELECT json_build_object(
    'total', COUNT(*),
    'pct_home', ROUND(100.0 * SUM(CASE WHEN predicted_winner = 'home' THEN 1 ELSE 0 END) / COUNT(*), 1),
    'pct_draw', ROUND(100.0 * SUM(CASE WHEN predicted_winner = 'draw' THEN 1 ELSE 0 END) / COUNT(*), 1),
    'pct_away', ROUND(100.0 * SUM(CASE WHEN predicted_winner = 'away' THEN 1 ELSE 0 END) / COUNT(*), 1)
  )
  FROM predictions
  WHERE match_id = p_match_id
$$ LANGUAGE sql SECURITY DEFINER;

-- Resetear puntos de todos los usuarios (usado al limpiar ensayo)
CREATE OR REPLACE FUNCTION reset_all_points()
RETURNS void AS $$
  UPDATE users SET points_total = 0, ranking_position = NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- Total del pozo
CREATE OR REPLACE FUNCTION get_pozo_total()
RETURNS integer AS $$
  SELECT COALESCE(SUM(amount), 0)::integer FROM pozo_log;
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## VARIABLES DE ENTORNO

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Solo en Edge Functions
```

---

## ORDEN DE CONSTRUCCIÓN RECOMENDADO

Construir en este orden para tener algo funcional lo antes posible:

1. **Base de datos** — crear todas las tablas, índices, RLS y funciones RPC. Correr el seed de usuarios.
2. **`supabase.js` + `auth.js`** — cliente inicializado y login básico.
3. **`/mundial/jugador/[username]`** — panel del jugador: login, pronósticos, trivia básica.
4. **`/mundial/admin`** — panel admin: cargar partidos, cargar resultados, gestionar jugadores.
5. **Edge Function `process-match-result`** — cálculo de puntos y rankings.
6. **`/mundial`** — home pública: ranking, pozo, pronósticos de la jornada.
7. **`/mundial/tv`** — pantalla TV con las 5 vistas y el realtime.
8. **`/mundial/admin/tv`** — control de la pantalla TV.
9. **Animación del scoreboard** — último porque es puramente visual.
10. **Modo Ensayo** — verificar que el flag `is_rehearsal` funciona en todas las capas.

---

## CHECKLIST DE CALIDAD

Antes de dar por terminado el desarrollo, verificar:

- [ ] Un jugador puede entrar con su username y código desde el celular
- [ ] Un jugador puede cargar un pronóstico y no puede modificarlo después
- [ ] El cierre automático de pronósticos funciona 1 hora antes del kickoff
- [ ] El admin puede cargar un resultado y los puntos se calculan correctamente
- [ ] El ranking se actualiza en tiempo real en `/mundial`
- [ ] La pantalla `/mundial/tv` cambia de vista cuando el admin clickea en `/mundial/admin/tv`
- [ ] La animación del scoreboard se dispara con el botón y se ve fluida
- [ ] Un pronóstico cargado desde el celular aparece en la vista "Pronósticos" de la pantalla TV en tiempo real
- [ ] La trivia se activa para un jugador específico y se ve en la pantalla TV mientras el jugador responde
- [ ] El bloqueo de pregunta de trivia funciona y no afecta los puntos del jugador
- [ ] El Pozo transfiere puntos atómicamente (no puede quedar en estado intermedio)
- [ ] El switch horizontal/vertical de la pantalla TV funciona
- [ ] El modo ensayo no acredita puntos reales
- [ ] Al pasar a modo real, los datos de ensayo se borran y los usuarios conservan sus códigos
- [ ] Un jugador puede subir su foto de perfil
- [ ] El admin puede resetear el código de un jugador
- [ ] Todo funciona en celular (pantalla del jugador es mobile-first)
