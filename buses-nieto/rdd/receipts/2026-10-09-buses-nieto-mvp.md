# Recibo RDD — buses-nieto-mvp

- **Candidato congelado:** `4d125e4..d016b64` (T1–T9). Revisado como `4d125e4..dba7d00`
  antes de reescribir el autor de los commits; el árbol de cada commit es idéntico.
- **Riesgo (determinístico, `scripts/rdd-assess.mjs`):** `high` → revisión 4R
  (Risk, Resilience, Readability, Reliability) por un revisor independiente de solo lectura.
- **Corrección acotada:** `bed5319` (una sola, validada por el mismo revisor).
- **Resultado:** `approved`.

## Riesgo por commit de unidad de trabajo

| Commit | Tarea | Nivel | Lentes |
| --- | --- | --- | --- |
| e189b44 | T1 scaffold, dev server, rdd-assess | high | 4R |
| d47ab01 | T2 fotos del flyer | passive | — |
| 3e8035f | T3 fuentes self-hosted | medium | Reliability |
| 2f96b55 | T4 lógica de dominio | high | 4R |
| 5e4c153 | T5 UI | high | 4R |
| f2e3176 | T6 términos, SECURITY.md, Dependabot | high | 4R |
| 9b9d9c9 | T7 gate de seguridad estático | medium¹ | Reliability |
| bccc3d1 | T8 e2e + a11y | medium | Reliability |
| d016b64 | T9 pipeline DevSecOps | high | 4R |
| de45bef | docs (README, evidencia SDD) | passive | — |
| bed5319 | corrección RDD | high | validación del revisor |
| aae796c | estilo de la etiqueta en la ficha | medium | Reliability (lectura visual) |

¹ Con la regla corregida en `bed5319`, `tests/security/` hoy se clasifica `high`.

## Hallazgos de la revisión 4R y estado tras la corrección

| # | Lente | Severidad | Hallazgo | Estado |
| --- | --- | --- | --- | --- |
| 1 | Risk | minor | `rdd-assess` subclasificaba gates de seguridad, configs de lint y SVG | resuelto |
| 2 | Risk | minor | Dependabot solo corre desde la rama por defecto; la doc decía lo contrario | resuelto (documentado) |
| 3 | Resilience | **major** | Un apóstrofo en datos o en el formulario rompía el catálogo y la confirmación | resuelto |
| 4 | Resilience | minor | El aviso de fallo de carga se pisaba al filtrar | resuelto |
| 5 | Resilience | minor | Sin JS el formulario de venta no hacía nada | resuelto |
| 6 | Readability | minor | El gate de cobertura no medía la barrera anti-XSS | resuelto (`dom.js` 100 %) |
| 7 | Reliability | **major** | El test de overflow a 360 px no podía fallar | resuelto (probado por mutación) |
| 8 | Reliability | minor | Las unidades reservadas no aparecían | resuelto |
| 9 | Reliability | minor | Un id repetido abría otra unidad | resuelto |
| 10 | Reliability | minor | El orden "Destacadas" no tenía test | resuelto |

Evidencia del validador sobre la corrección: lint 0, `npm test` 71/71, cobertura 44/44
(91,60 %; con piso 95 % sale 1), Playwright 29/29 + 1 skip con servidor propio; cada
hallazgo reproducido antes y verificado después, y los tests nuevos fallan con sus mutantes.

## Seguimiento (no bloqueante, informado por el validador)

- El contador de cada categoría suma reservadas pero dice "N disponibles" (`site/js/main.js`).
- Una unidad de ejemplo y reservada muestra solo "Unidad de ejemplo" (`site/js/render.js`).
- La aserción de ids únicos del gate estático es redundante: el control efectivo es
  `rejected === 0` (`tests/security/static.test.mjs`).
- Si JS está activo pero `main.js` no carga, el formulario queda oculto sin `<noscript>`.

## Entrega

La revisión es evidencia, no autorización de entrega: push y deploy siguen la política del
repositorio. Estado: commits locales en `claude/solobuses-custom-styling-bm6daw`; el push está
bloqueado (403) hasta que la Claude GitHub App tenga acceso al repositorio.
