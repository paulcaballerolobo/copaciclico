# sistema_mundial2026.md
## Mundial 2026 · Cíclico — Sistema completo

**Versión:** 2.0
**Formato:** Programa de televisión en vivo, grupo cerrado de ~20 jugadores.
**Stack:** Supabase (Postgres + Realtime + Storage + Edge Functions) · HTML/CSS/JS vanilla · Vercel/Netlify
**Dominio:** `mundial.esciclico.com`
**Contexto:** Sección dentro del micrositio esciclico.com. No tiene sistema de diseño propio — hereda el del micrositio existente.

---

## 1. Actores del sistema

| Actor | Descripción | Acceso |
|---|---|---|
| Público | Cualquier visitante del micrositio | `/mundial` y `/mundial/tv` sin login |
| Jugador | ~20 participantes fijos del programa | `/mundial/jugador/[username]` con código |
| Superadmin | Productor/conductor del programa | `/mundial/admin` y `/mundial/admin/tv` |

---

## 2. Modos del sistema

### Modo Ensayo (`is_rehearsal_mode = true`)
Activo antes del inicio oficial del torneo. Permite que todos los jugadores exploren el sistema, carguen pronósticos de prueba y jueguen trivias de prueba sin consecuencias reales.

- Los puntos no se acreditan
- El ranking muestra el badge "(ENSAYO)"
- La pantalla TV muestra badge permanente "MODO ENSAYO"
- Al pasar a Modo Real: todos los datos de ensayo se borran (predicciones, trivias, puntos, pozo)
- Los usuarios, códigos y configuración se conservan

### Modo Real (`is_rehearsal_mode = false`)
Activo durante el torneo oficial. Todo cuenta. Nada se puede borrar ni modificar una vez enviado.

---

## 3. Módulos del juego

| Módulo | Descripción | Disponibilidad |
|---|---|---|
| Pronóstico de partido | Predecir ganador y opcionalmente marcador exacto | Durante todo el torneo. Cierra 1 hora antes del kickoff |
| Trivia de puntos | 5 preguntas activadas por el admin en vivo | Una vez por fase, activada manualmente |
| El Pozo del Mundial | Fondo acumulado disputado en vivo post-final | Solo después de la final, habilitado por el admin |

---

## 4. Mecánica completa

### 4.1 Pronóstico de partido

Cada jugador predice el ganador antes del kickoff. Opcionalmente puede arriesgar un marcador exacto que suma o resta puntos.

**Puntos por acertar el ganador:**

| Fase | `matches.phase` | Puntos |
|---|---|---|
| Grupos | `groups` | 10 |
| Dieciseisavos | `r32` | 20 |
| Octavos | `r16` | 40 |
| Cuartos | `qf` | 80 |
| Semifinal | `sf` | 150 |
| Tercer puesto | `3rd` | 80 |
| Final | `final` | 200 |

**Bonus y penalidad por marcador exacto (opcional):**

| Resultado | Efecto |
|---|---|
| Marcador exacto correcto | +50% de los puntos base de esa fase |
| Marcador exacto incorrecto | -50% de los puntos base de esa fase |

**Tabla de casos posibles:**

| Ganador | Marcador | Puntos |
|---|---|---|
| ✅ | No ingresó | +base |
| ✅ | ✅ Exacto | +base +50% |
| ✅ | ❌ Incorrecto | +base -50% |
| ❌ | No ingresó | 0 |
| ❌ | Ingresó (cualquier resultado) | -50% del base |

**Reglas:**
- Deadline: 1 hora antes del kickoff. El sistema cierra automáticamente.
- Una vez enviado el pronóstico no se puede modificar.
- El marcador ingresado debe ser coherente con el ganador elegido.
- En fases eliminatorias: el marcador corresponde al resultado antes de los penales. El ganador es quien avanza.
- Quien no pronostica queda con 0 puntos en ese partido.

### 4.2 Trivia de puntos

5 preguntas activadas por el admin en vivo para un jugador específico. El jugador responde desde su celular y la pantalla TV lo muestra en tiempo real.

**Puntos por pregunta correcta:**

| Nivel | Puntos por correcta | Penalidad por incorrecta | Máximo |
|---|---|---|---|
| Fácil | 5 | -2 | 25 |
| Intermedia | 10 | -2 | 50 |
| Difícil | 20 | -2 | 100 |

La penalidad mínima (-2) aplica por cada respuesta incorrecta. El total nunca puede quedar negativo por la trivia (mínimo 0).

**Flujo completo:**
1. El jugador pide jugar la trivia en vivo
2. El admin la activa desde `/mundial/admin/tv` para ese jugador específico
3. Al jugador le aparece el botón **"VAMOS"** en su celular
4. Al presionar VAMOS: arranca simultáneamente en el celular del jugador y en la pantalla TV del estudio
5. Las preguntas aparecen de a una con contador de 20 segundos
6. Sin responder en 20 segundos: cuenta como incorrecta (-2 pts) y avanza automáticamente
7. Al seleccionar respuesta: se guarda inmediatamente, se revela si fue correcta o incorrecta, 2 segundos de pausa y avanza
8. Al terminar las 5 preguntas: pantalla de resumen con resultado final
9. Los puntos se acreditan al completar la sesión

**Reclamo post-trivia:**
Si el conductor considera que una pregunta tiene un error en la respuesta correcta:
- El admin puede bloquear la pregunta post-sesión desde el panel
- Al bloquear: esa pregunta queda anulada (ni suma ni resta), los puntos se recalculan
- La pregunta bloqueada se marca como `is_active = false` y no vuelve a aparecer nunca
- Este mecanismo no es visible para el jugador ni el público — es una herramienta interna del admin

**Reglas:**
- Disponible una vez por fase del torneo por jugador
- El jugador elige el nivel antes de comenzar, no puede cambiarlo una vez iniciada
- No se repiten preguntas entre sesiones del mismo jugador
- Sin opción de pausar ni reiniciar

### 4.3 El Pozo del Mundial

Fondo acumulado que se disputa en vivo después de la final. El admin habilita manualmente a cada jugador que quiera intentarlo durante el programa.

**Cómo crece el pozo:**
- El admin carga un monto inicial al abrir el Pozo (`admin_seed`)
- Cada jugador que intenta y pierde transfiere todos sus puntos actuales al pozo

**Mecánica del intento:**
1. El jugador solicita intentarlo en vivo durante el programa
2. El admin lo habilita desde `/mundial/admin/tv`
3. El jugador ve el total del pozo y confirma que quiere intentarlo
4. Al confirmar: sus puntos actuales se transfieren al pozo de forma atómica e irreversible (`users.points_total = 0`)
5. Juega una trivia de 10 preguntas a nivel intermedio, 20 segundos por pregunta
6. La pantalla TV muestra la trivia en vivo igual que la trivia de puntos
7. **6 o más correctas → gana:** recibe el total del pozo. El pozo se cierra
8. **5 o menos correctas → pierde:** sus puntos quedan en el pozo. El admin puede habilitar al siguiente jugador

**Cadena de intentos:**
```
Pozo inicial (admin):  500 pts
Jugador A pierde:     +340 pts → Pozo = 840 pts
Jugador B pierde:     +210 pts → Pozo = 1.050 pts
Jugador C gana:        se lleva 1.050 pts → Pozo cerrado
```

**Reglas:**
- Solo jugadores con `ranking_position > 3`
- Cada jugador puede intentarlo una sola vez en todo el torneo
- Solo disponible después de que la final haya sido jugada
- Si un jugador gana, el pozo se cierra — no hay más intentos
- Si ningún jugador elegible queda, el admin decide qué hacer con el pozo

---

## 5. Sistema de pantallas

### Mapa de URLs

| Ruta | Acceso | Descripción |
|---|---|---|
| `/mundial` | Pública | Home: ranking, pozo, próximos partidos y últimos resultados |
| `/mundial/tv` | Pública | Pantalla TV proyectada en el estudio, controlada por el admin en tiempo real |
| `/mundial/jugador/[username]` | Jugador (código) | Panel personal: pronósticos, trivia activa, pozo, perfil |
| `/mundial/admin` | Superadmin | Panel de administración completo |
| `/mundial/admin/tv` | Superadmin | Control en tiempo real de la pantalla TV |

### Control de la pantalla TV

El admin controla `/mundial/tv` desde `/mundial/admin/tv`. El mecanismo es una tabla `tv_state` de una sola fila que el admin actualiza y la pantalla TV escucha via Supabase Realtime. Cuando `tv_state` cambia, la pantalla cambia instantáneamente sin recargar.

**Vistas disponibles:**

| Vista | `tv_state.current_view` | Qué muestra |
|---|---|---|
| Pronósticos | `pronosticos` | Partidos de la jornada con pronósticos de cada jugador. Se actualiza en tiempo real cuando alguien carga |
| Resultado | `resultado` | Partido seleccionado: marcador, quién acertó, puntos ganados/perdidos |
| Ranking | `ranking` | Tabla completa con animación dinámica al presionar el botón |
| Trivia | `trivia` | Pregunta activa + opciones + contador + respuesta del jugador en tiempo real |
| Pozo | `pozo` | Total acumulado + trivia del intento en curso si aplica |

**Switch horizontal/vertical:** la pantalla TV tiene dos layouts según `tv_state.orientation`:
- `horizontal` (16:9): columnas, pensado para pantalla de estudio
- `vertical` (9:16): filas y fuente más grande, pensado para transmisión móvil

### Animación del scoreboard

Cuando el admin presiona "ANIMAR SCOREBOARD" desde `/mundial/admin/tv`:
- `tv_state.trigger_animation` cambia a `true`
- La pantalla TV detecta el cambio via Realtime
- Los jugadores se mueven a sus nuevas posiciones con transición FLIP de 1.2 segundos
- Los que suben brillan en verde con flecha ↑
- Los que bajan en rojo con flecha ↓
- Los puntos animan con contador count-up (easing easeOut)
- Al terminar: Edge Function resetea `trigger_animation = false`

---

## 6. Base de datos — tablas SQL

### `users`
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

### `matches`
```sql
CREATE TABLE matches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase               text NOT NULL,
  group_name          text,
  week_number         integer,
  team_home           text NOT NULL,
  team_away           text NOT NULL,
  kickoff_time        timestamptz NOT NULL,
  venue               text,
  status              text DEFAULT 'upcoming',
  result_home         integer,
  result_away         integer,
  winner              text,
  went_to_penalties   boolean DEFAULT false,
  predictions_open    boolean DEFAULT false,
  confirmed_by_admin  boolean DEFAULT false,
  created_at          timestamptz DEFAULT now()
);
```

**Valores de `phase`:** `'groups'` `'r32'` `'r16'` `'qf'` `'sf'` `'3rd'` `'final'`
**Valores de `status`:** `'upcoming'` `'live'` `'finished'`
**Valores de `winner`:** `'home'` `'away'` `'draw'` (draw solo en grupos)

**Nota de terminología:** `home` y `away` son referencias de orden interno (primer y segundo equipo en el marcador). El jugador siempre ve el nombre real del equipo, nunca las palabras "local" ni "visitante".

### `predictions`
```sql
CREATE TABLE predictions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  match_id            uuid NOT NULL REFERENCES matches ON DELETE CASCADE,
  predicted_winner    text NOT NULL,
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
```

**Regla crítica:** INSERT único. No hay UPDATE ni upsert. Una vez enviado, el pronóstico es definitivo.

### `trivia_questions`
```sql
CREATE TABLE trivia_questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text   text NOT NULL,
  option_a        text NOT NULL,
  option_b        text NOT NULL,
  option_c        text NOT NULL,
  option_d        text NOT NULL,
  correct_answer  text NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
  difficulty      integer NOT NULL CHECK (difficulty IN (1,2,3)),
  category        text,
  is_active       boolean DEFAULT true,
  block_reason    text,
  created_at      timestamptz DEFAULT now()
);
```

**Valores de `difficulty`:** `1` = fácil, `2` = intermedio, `3` = difícil

### `trivia_sessions`
```sql
CREATE TABLE trivia_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  phase            text NOT NULL,
  level_chosen     integer NOT NULL CHECK (level_chosen IN (1,2,3)),
  question_ids     uuid[],
  answers          jsonb DEFAULT '[]',
  score            integer DEFAULT 0,
  points_earned    integer DEFAULT 0,
  status           text DEFAULT 'pending',
  enabled_by_admin boolean DEFAULT false,
  enabled_at       timestamptz,
  started_at       timestamptz,
  completed_at     timestamptz,
  is_rehearsal     boolean DEFAULT false,
  UNIQUE (user_id, phase)
);
```

**Valores de `status`:** `'pending'` `'ready'` (admin activó) `'in_progress'` (jugador presionó VAMOS) `'completed'`

**Estructura de `answers` (jsonb array):**
```json
[
  {
    "question_id": "uuid",
    "selected": "a",
    "correct": true,
    "time_taken_ms": 8420,
    "blocked": false
  }
]
```

El campo `blocked` se actualiza a `true` cuando el admin bloquea esa pregunta post-sesión. Al recalcular puntos, las preguntas con `blocked = true` se ignoran (ni suman ni restan).

### `pozo_log`
```sql
CREATE TABLE pozo_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount        integer NOT NULL,
  source_type   text NOT NULL,
  source_id     uuid,
  running_total integer,
  created_at    timestamptz DEFAULT now()
);
```

**Valores de `source_type`:** `'admin_seed'` `'player_lost'`

### `pozo_attempts`
```sql
CREATE TABLE pozo_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users ON DELETE CASCADE UNIQUE,
  points_bet      integer NOT NULL,
  status          text DEFAULT 'enabled',
  question_ids    uuid[],
  answers         jsonb DEFAULT '[]',
  score           integer,
  points_received integer,
  enabled_at      timestamptz,
  started_at      timestamptz,
  completed_at    timestamptz
);
```

**Valores de `status`:** `'enabled'` `'in_progress'` `'won'` `'lost'`

### `tv_state`
```sql
CREATE TABLE tv_state (
  id                integer PRIMARY KEY DEFAULT 1,
  current_view      text DEFAULT 'ranking',
  active_match_id   uuid REFERENCES matches,
  active_user_id    uuid REFERENCES users,
  orientation       text DEFAULT 'horizontal',
  trigger_animation boolean DEFAULT false,
  updated_at        timestamptz DEFAULT now()
);

INSERT INTO tv_state (id) VALUES (1);
```

**Valores de `current_view`:** `'pronosticos'` `'resultado'` `'ranking'` `'trivia'` `'pozo'`
**Valores de `orientation`:** `'horizontal'` `'vertical'`

### `config`
```sql
CREATE TABLE config (
  key        text PRIMARY KEY,
  value      text,
  type       text,
  label      text,
  updated_at timestamptz DEFAULT now()
);
```

**Claves del sistema:**

| Clave | Tipo | Valor inicial | Descripción |
|---|---|---|---|
| `is_rehearsal_mode` | boolean | `true` | Modo ensayo activo |
| `current_phase` | text | `groups` | Fase actual del torneo |
| `tournament_started` | boolean | `false` | Si el torneo inició oficialmente |
| `current_week` | number | `1` | Jornada/semana actual |
| `pozo_status` | text | `closed` | `closed`\|`open`\|`revealed` |
| `pozo_initial_amount` | number | `500` | Monto inicial cargado por el admin |
| `trivia_penalty_points` | number | `2` | Puntos restados por respuesta incorrecta en trivia |

---

## 7. Seed SQL — usuarios iniciales

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

-- Config inicial
INSERT INTO config (key, value, type, label) VALUES
('is_rehearsal_mode',       'true',    'boolean', 'Modo ensayo activo'),
('current_phase',           'groups',  'text',    'Fase actual del torneo'),
('tournament_started',      'false',   'boolean', 'Torneo iniciado'),
('current_week',            '1',       'number',  'Jornada/semana actual'),
('pozo_status',             'closed',  'text',    'Estado del Pozo'),
('pozo_initial_amount',     '500',     'number',  'Monto inicial del Pozo'),
('trivia_penalty_points',   '2',       'number',  'Penalidad por respuesta incorrecta en trivia');
```

---

## 8. Credenciales de acceso

> **Uso interno — no publicar.** El admin puede resetear cualquier código desde el panel.
> Los códigos no contienen los caracteres O, 0, I, 1, L para evitar confusiones visuales.

### Superadmin

| Nombre | Username | Código | Rol |
|---|---|---|---|
| Ian Grandon Soporsky | `igrandon` | `BCAMSJST` | Superadmin |

### Jugadores

| Nombre completo | Username | Código |
|---|---|---|
| Marcela Feudale | `mfeudale` | `DZHEDZTV` |
| Alen Lodeiro | `alodeiro` | `AGSAGX` |
| Horacio Embon | `hembon` | `QQJ52EQJ` |
| Lean Illia | `lillia` | `8MCC5V` |
| Lu Iacono | `liacono` | `ZT9NU4` |
| Matías Canillán | `mcanillan` | `6NFCX295` |
| Lucas González Diez | `lgonzalez` | `NR4FNX` |
| Gallego Veloso | `gveloso` | `8XVFZFN9` |
| Leandro Renou | `lrenou` | `YGM2B43P` |
| Silvia Mercado | `smercado` | `G86KXP` |
| Marina Abiuso | `mabiuso` | `RJHUJV6P` |
| Sole Vallejos | `svallejos` | `9ES25E` |
| Claudio Villarruel | `cvillarruel` | `3QBN9T` |
| Analía Argento | `aargento` | `5AZYTJWD` |
| Daniel Santa Cruz | `dsanta` | `EAZZ92S` |
| Rodrigo Estevez Andrade | `restevez` | `5KWVE2` |
| Pablo Pampin | `ppampin` | `877VSDN9` |
| Seba Fernández | `sfernandez` | `HHUCZ49` |
| Sofa Nadal | `snadal` | `2DRUJ6QG` |
| Lucas Petronio | `lpetronio` | `2YZPXN6Q` |
| Sofi Sevastianuk | `ssevastianuk` | `GMVHGC` |

---

## 9. Autenticación

No se usa Supabase Auth nativo. El login es por `username` + `access_code`:

```javascript
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
```

La sesión vive en `localStorage`. Sin login → redirect a `/mundial/jugador/[username]` con formulario de código.

---

## 10. Edge Functions

| Función | Trigger | Descripción |
|---|---|---|
| `process-match-result` | Admin confirma resultado | Calcula puntos de todas las predicciones del partido. Actualiza `users.points_total`. Llama a `calculate-rankings`. Respeta `is_rehearsal_mode`. |
| `calculate-rankings` | Llamada por otras functions | Recalcula `ranking_position` por `points_total DESC`. Actualiza `tv_state.trigger_animation = true`. |
| `close-trivia-session` | Al completar pregunta 5 | Calcula `points_earned` con penalidad por incorrectas. Respeta preguntas bloqueadas en `answers[].blocked`. Acredita puntos si no es ensayo. |
| `block-trivia-question` | Admin bloquea pregunta post-sesión | Marca `trivia_questions.is_active = false`. Actualiza `answers[].blocked = true` en la sesión afectada. Recalcula y re-acredita puntos. |
| `place-pozo-attempt` | Jugador confirma intento al Pozo | Transacción atómica: transfiere `users.points_total` al `pozo_log`, setea `users.points_total = 0`, crea registro en `pozo_attempts`, asigna 10 preguntas. |
| `resolve-pozo-attempt` | Al completar pregunta 10 del Pozo | Si score ≥ 6: transfiere total del pozo al jugador, cierra el pozo. Si score < 6: actualiza status a `lost`. Llama a `calculate-rankings`. |
| `clear-rehearsal-data` | Admin pasa de Ensayo a Real | Borra predicciones, trivias y pozo con `is_rehearsal = true`. Resetea puntos y rankings de todos los usuarios. |

### Lógica de `process-match-result`

```javascript
const BASE_POINTS = {
  groups: 10, r32: 20, r16: 40,
  qf: 80, sf: 150, '3rd': 80, final: 200
}

const is_rehearsal = config.is_rehearsal_mode === 'true'

for (const prediction of match_predictions) {
  const base = BASE_POINTS[match.phase]
  let points = 0

  const is_correct = prediction.predicted_winner === match.winner
  const exact_score_correct = prediction.has_exact_score
    && prediction.predicted_home === match.result_home
    && prediction.predicted_away === match.result_away
  const exact_score_wrong = prediction.has_exact_score && !exact_score_correct

  if (is_correct)          points += base
  if (exact_score_correct) points += Math.round(base * 0.5)
  if (exact_score_wrong)   points -= Math.round(base * 0.5)

  await update_prediction({ is_correct, exact_score_correct, exact_score_wrong, points_earned: points })

  if (!is_rehearsal) {
    await increment_user_points(prediction.user_id, points)
  }
}

await calculate_rankings()
```

### Lógica de `close-trivia-session`

```javascript
const POINTS_BY_LEVEL = { 1: 5, 2: 10, 3: 20 }
const PENALTY = parseInt(config.trivia_penalty_points) // default: 2
const is_rehearsal = config.is_rehearsal_mode === 'true'

let points = 0
for (const answer of session.answers) {
  if (answer.blocked) continue          // pregunta anulada: no suma ni resta
  if (answer.correct) points += POINTS_BY_LEVEL[session.level_chosen]
  else                points -= PENALTY
}

points = Math.max(0, points)            // el total nunca queda negativo

await update_trivia_session({ points_earned: points, status: 'completed', completed_at: now() })

if (!is_rehearsal) {
  await increment_user_points(session.user_id, points)
  await calculate_rankings()
}
```

---

## 11. Índices recomendados

```sql
CREATE INDEX idx_users_ranking   ON users (ranking_position ASC);
CREATE INDEX idx_users_points    ON users (points_total DESC);
CREATE INDEX idx_predictions_match ON predictions (match_id);
CREATE UNIQUE INDEX idx_predictions_pair ON predictions (user_id, match_id);
CREATE INDEX idx_matches_status  ON matches (status, kickoff_time ASC);
CREATE INDEX idx_matches_phase   ON matches (phase);
CREATE INDEX idx_matches_week    ON matches (week_number);
CREATE INDEX idx_trivia_difficulty ON trivia_questions (difficulty) WHERE is_active = true;
CREATE UNIQUE INDEX idx_trivia_session_phase ON trivia_sessions (user_id, phase);
CREATE UNIQUE INDEX idx_pozo_attempt_user ON pozo_attempts (user_id);
```

---

## 12. Row-Level Security (RLS)

```sql
-- Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_public_read"  ON users FOR SELECT USING (true);
CREATE POLICY "users_admin_write"  ON users FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_public_read"  ON matches FOR SELECT USING (true);
CREATE POLICY "matches_admin_write"  ON matches FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Predictions
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "predictions_own" ON predictions FOR ALL
  USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Trivia questions
ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trivia_questions_public_read" ON trivia_questions FOR SELECT USING (true);
CREATE POLICY "trivia_questions_admin_write" ON trivia_questions FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Trivia sessions
ALTER TABLE trivia_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trivia_sessions_own" ON trivia_sessions FOR ALL
  USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Pozo log
ALTER TABLE pozo_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pozo_log_public_read" ON pozo_log FOR SELECT USING (true);

-- Pozo attempts
ALTER TABLE pozo_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pozo_attempts_own" ON pozo_attempts FOR SELECT
  USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- TV state
ALTER TABLE tv_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tv_state_public_read"  ON tv_state FOR SELECT USING (true);
CREATE POLICY "tv_state_admin_write"  ON tv_state FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Config
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config_public_read"  ON config FOR SELECT USING (true);
CREATE POLICY "config_admin_write"  ON config FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
```

---

## 13. Funciones RPC

```sql
-- Estadísticas agregadas de pronósticos para un partido
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

-- Total del pozo
CREATE OR REPLACE FUNCTION get_pozo_total()
RETURNS integer AS $$
  SELECT COALESCE(SUM(amount), 0)::integer FROM pozo_log;
$$ LANGUAGE sql SECURITY DEFINER;

-- Resetear puntos de todos los usuarios (limpieza de ensayo)
CREATE OR REPLACE FUNCTION reset_all_points()
RETURNS void AS $$
  UPDATE users SET points_total = 0, ranking_position = NULL;
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 14. Suscripciones Realtime

| Canal | Tabla / Evento | Usado en |
|---|---|---|
| `tv-control` | UPDATE en `tv_state` | `/mundial/tv` — cambia la vista activa |
| `ranking-live` | UPDATE en `users` | `/mundial` y `/mundial/tv` — actualiza ranking |
| `pozo-live` | INSERT en `pozo_log` | `/mundial` y `/mundial/tv` — actualiza contador del pozo |
| `trivia-live` | UPDATE en `trivia_sessions` | `/mundial/tv` — muestra respuestas en tiempo real |
| `predictions-live` | INSERT en `predictions` | Vista `pronosticos` en `/mundial/tv` — aparece el pronóstico al cargarse |

---

## 15. Estructura de archivos

```
/mundial
├── index.html              → /mundial
├── tv.html                 → /mundial/tv
├── jugador.html            → /mundial/jugador/[username]
├── admin.html              → /mundial/admin
├── admin-tv.html           → /mundial/admin/tv
└── /js
    ├── supabase.js         → cliente Supabase inicializado
    ├── auth.js             → login con username + access_code
    ├── realtime.js         → suscripciones Realtime compartidas
    ├── ranking-animation.js → animación FLIP del scoreboard
    └── utils.js            → helpers compartidos
```

---

## 16. Variables de entorno

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Solo en Edge Functions
```

---

## 17. Notas de implementación

- **Sin Supabase Auth nativo.** Login directo contra tabla `users` por `username` + `access_code`. Sesión en `localStorage`.
- **Pronóstico irrevocable.** INSERT con constraint `UNIQUE (user_id, match_id)`. El frontend nunca hace UPDATE. Si ya existe, muestra el pronóstico en modo solo lectura.
- **Puntos solo en servidor.** Los campos `points_earned`, `is_correct`, `exact_score_correct` los escribe exclusivamente la Edge Function `process-match-result`. El frontend nunca los toca.
- **Pozo atómico.** La Edge Function `place-pozo-attempt` transfiere puntos en una sola transacción. Si falla en cualquier punto, no se descuentan puntos ni se registra el intento.
- **Bloqueo de pregunta de trivia.** Mecanismo interno del admin, invisible para jugadores y público. Al bloquear: la pregunta se marca en `trivia_questions.is_active = false` y en el jsonb `answers[].blocked = true` de la sesión afectada. Los puntos se recalculan automáticamente.
- **Modo ensayo.** El flag `is_rehearsal` se guarda en `predictions` y `trivia_sessions`. Al limpiar, se borran solo los registros con ese flag. Los usuarios y códigos no se tocan.
- **Foto de perfil.** Upload a Supabase Storage en `/avatars/[user_id].[ext]`. Límite 2MB, solo JPG/PNG/WEBP. URL escrita en `users.avatar_url`.
- **Cierre automático de pronósticos.** Un cron job o la propia pantalla del jugador verifica `kickoff_time - 1 hora`. Si `now() >= kickoff_time - 3600s`, el formulario se bloquea en el cliente. La validación definitiva es en la Edge Function.
- **Animación del scoreboard.** Implementar con técnica FLIP (First, Last, Invert, Play) para que el reordenamiento del DOM sea performante. Ver `ranking-animation.js` en la especificación técnica.
- **tv_state es una fila única.** Siempre el registro con `id = 1`. Todos los UPDATEs son sobre esa fila. La pantalla TV escucha el canal Realtime de esa tabla.
