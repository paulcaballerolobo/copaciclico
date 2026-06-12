# Sistema de Puntajes — Mundial Cíclico
> ⚠️ INAMOVIBLE. Esta tabla debe respetarse sin excepciones en toda implementación presente y futura.

---

## Base de puntos por fase

| Fase | Puntos base |
|---|---|
| Grupos | 100 |
| R32 | 200 |
| Octavos | 400 |
| Cuartos | 800 |
| Semis | 1.500 |
| 3er puesto | 800 |
| Final | 2.000 |

---

## Fórmula

- **Ganador correcto:** `+base`
- **Bonus marcador exacto:** `+base × 0.7` (redondeado)
- **Penalidad marcador errado** (solo si intentó): `−base × 0.4` (redondeado)
- **Penalidad ganador incorrecto:** `−base × 0.4` (redondeado)
- **Sin pronosticar:** `−30` (fijo, todas las fases)

---

## Tabla de escenarios completa

| Escenario | Grupos | R32 | Octavos | Cuartos | Semis | 3er puesto | Final |
|---|---|---|---|---|---|---|---|
| ✅ Ganador + marcador exacto | +170 | +340 | +680 | +1.360 | +2.550 | +1.360 | +3.400 |
| ✅ Ganador correcto, sin marcador | +100 | +200 | +400 | +800 | +1.500 | +800 | +2.000 |
| ✅ Ganador correcto, marcador errado | +60 | +120 | +240 | +480 | +900 | +480 | +1.200 |
| ❌ Ganador incorrecto | −40 | −80 | −160 | −320 | −600 | −320 | −800 |
| ⬜ Sin pronosticar | −30 | −30 | −30 | −30 | −30 | −30 | −30 |

---

## Bonus adicionales (todas las fases)

| Bonus | Puntos |
|---|---|
| Votos recibidos del público | +5 por voto |
| Ser el más votado del partido | +50 |
| Ser el más votado + marcador exacto | +100 (+50 base +50 extra) |

---

## Reglas del pozo

- Los puntos negativos (penalidades) van al **pozo**, no desaparecen del sistema.
- El `points_total` de un jugador nunca puede ser menor a **0**.
- El pozo tiene un monto inicial configurable desde el panel de árbitro.

---

## Notas de implementación — Pronósticos

- La fórmula vive en `processMatchResult()` en `/src/routes/mundial/arbitro/+page.svelte`.
- El campo `is_rehearsal_mode` en la tabla `config` bloquea la acreditación de puntos: si está en `true`, los puntos se calculan y se muestran pero **no se suman al `points_total` del usuario**.
- Los puntos exactos se calculan con `Math.round()` para evitar decimales.

---

## Trivia — Sistema de puntajes
> ⚠️ INAMOVIBLE. Esta tabla debe respetarse sin excepciones en toda implementación presente y futura.

### Fórmula

- **Respuesta correcta:** `+POINTS[nivel]` por pregunta
- **Respuesta incorrecta:** `−25 pts` (fijo, configurable en tabla `config` → `trivia_penalty_points`)
- **Total mínimo:** `0` — nunca puede ser negativo
- **Tiempo por pregunta:** 20 segundos
- **Modo ensayo:** calcula y muestra los puntos pero **no los acredita**

### Puntos por nivel

| Nivel | Acierto por pregunta | Error por pregunta |
|---|---|---|
| 1 — Fácil | **+50** | −25 |
| 2 — Intermedio | **+100** | −25 |
| 3 — Difícil | **+200** | −25 |

### Ejemplos con 10 preguntas

| Resultado | Fácil | Intermedio | Difícil |
|---|---|---|---|
| 10/10 | +500 | +1.000 | +2.000 |
| 8/10 aciertos | +275 | +550 | +1.100 |
| 5/10 aciertos | +125 | +250 | +500 |
| 3/10 aciertos | +25 | +50 | +100 |
| 0/10 aciertos | 0 | 0 | 0 |

### Notas de implementación — Trivia

- La fórmula vive en `finishGame()` en `/src/routes/mundial/trivia/+page.svelte`.
- La penalidad por error es configurable desde el panel de árbitro (`config.trivia_penalty_points`), actualmente en **25 pts**.
- Solo el dueño de la sesión puede jugar (`isOwner`); los demás ven en tiempo real.
- Los puntos se acreditan al `points_total` del usuario solo si `is_rehearsal_mode = false` **y** el jugador que termina es el mismo que inició sesión.
