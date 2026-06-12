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

## Notas de implementación

- La fórmula vive en `processMatchResult()` en `/src/routes/mundial/arbitro/+page.svelte`.
- El campo `is_rehearsal_mode` en la tabla `config` bloquea la acreditación de puntos: si está en `true`, los puntos se calculan y se muestran pero **no se suman al `points_total` del usuario**.
- Los puntos exactos se calculan con `Math.round()` para evitar decimales.
