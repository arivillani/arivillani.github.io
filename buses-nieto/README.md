# Buses Nieto — sitio web (MVP, entorno dev)

Sitio de **Buses Nieto**, venta de buses, minibuses y combis usados. Reproduce la estructura
funcional de un sitio de concesionaria de ómnibus usados con la identidad del flyer de la
empresa: verde bosque, verde brillante, precio en naranja y tipografía condensada itálica.

> **Solo dev.** El sitio vive en `buses-nieto/` y no reemplaza la raíz de
> `arivillani.github.io`. Las páginas llevan `noindex` y las unidades marcadas
> "Unidad de ejemplo" son datos de muestra que hay que reemplazar antes de producción.

## Correrlo

```bash
cd buses-nieto
npm ci --ignore-scripts
npm run dev          # http://127.0.0.1:4173 (mismos headers de seguridad que en CI)
```

| Comando | Qué hace |
| --- | --- |
| `npm run lint` | ESLint (con reglas que prohíben sinks de HTML) + html-validate (a11y) |
| `npm test` | Tests unitarios + gate de seguridad estático (`node --test`) |
| `npm run test:coverage` | Unitarios con piso de 90 % de líneas sobre los módulos que cargan (lógica pura y tooling; la UI la cubre e2e) |
| `npm run test:security` | Solo el gate de seguridad estático |
| `npm run test:e2e` | Playwright + axe en desktop y mobile (360 px) |
| `npm run audit` | `npm audit --audit-level=high` |
| `npm run rdd:assess -- <base> <head>` | Nivel de riesgo RDD de un rango de commits |

## Estructura

```
site/                 lo que se publica (HTML + CSS + ES modules, sin dependencias de runtime)
  index.html          home: hero, categorías, destacada, catálogo, servicios, vender, vendidas…
  terminos.html       términos (texto modelo para dev)
  data/units.json     catálogo; se valida contra un esquema antes de pintarse
  js/                 format, catalog, whatsapp, sell-form (lógica pura) + dom, render, main (UI)
scripts/              servidor de dev, política CSP compartida, evaluador de riesgo RDD
tests/                unit/ · security/ · e2e/
sdd/                  documento de feature (specs S1–S11, tareas, log)
rdd/receipts/         recibos de revisión por candidato
```

## Cómo se trabajó (SDD + TDD + RDD)

Inspirado en el flujo de [gentle-ai](https://github.com/Gentleman-Programming/gentle-ai):

1. **SDD**: `sdd/buses-nieto-mvp.md` es la especificación. Cada regla es un `S#` con
   criterio de aceptación; el pedido original queda literal en el log (`L1`).
2. **TDD**: por cada regla, un test en RED antes de implementar, después GREEN y refactor.
   Los gates de seguridad se probaron por mutación: contra una copia del sitio con
   violaciones inyectadas, las 6 fallan.
3. **RDD**: cada commit de unidad de trabajo recibe un nivel de riesgo determinístico
   (`scripts/rdd-assess.mjs`): `passive` → lectura estructural, `medium` → un lente,
   `high` → revisión 4R (Risk, Resilience, Readability, Reliability) por un revisor
   independiente sobre el candidato congelado. El resultado queda en `rdd/receipts/`.

Las tareas mecánicas (recorte de fotos del flyer, fuentes self-hosted, términos, Dependabot,
SECURITY.md) se delegaron a agentes de menor costo; el resto se hizo y verificó en línea.

## Entorno dev en GitHub Pages

`https://arivillani.github.io/buses-nieto-dev/` se publica desde el repo público
`arivillani/buses-nieto-dev` (plan gratuito). Ese repo es un **espejo** de `buses-nieto/`:

```bash
buses-nieto/scripts/sync-dev-repo.sh   # git subtree split + push a main del repo dev
```

Ahí, `.github/workflows/dev-pages.yml` (este proyecto lo guarda en `buses-nieto/.github/`,
donde el repo fuente no lo ejecuta) corre los mismos gates y recién entonces despliega Pages.
Los cambios se hacen siempre en el repo fuente, nunca en el espejo.

## DevSecOps

Pipeline en `.github/workflows/buses-nieto.yml`: secretos (gitleaks, binario verificado por
checksum), lint + unitarios + gate de seguridad, `npm audit` + firmas del registry, CodeQL
`security-extended`, dependency review en PRs, E2E + axe, y `deploy-dev` (paquete del sitio con
`SHA256SUMS` en el environment `dev`). Ningún job despliega desde `main`. Detalle de controles y
limitaciones en [SECURITY.md](SECURITY.md).
