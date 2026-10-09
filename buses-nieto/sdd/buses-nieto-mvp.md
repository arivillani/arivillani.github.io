# Feature: buses-nieto-mvp

Sitio web de **Buses Nieto** (venta de buses, minibuses y combis usados) que replica la
estructura funcional de solobuses.com.ar con la identidad visual del flyer del cliente.

- **Flujo:** SDD (este documento es la especificación) → TDD (RED → GREEN → REFACTOR por regla)
  → RDD (recibo de revisión por cada commit de unidad de trabajo, en `../rdd/receipts/`).
  Formato inspirado en el documento de feature de gentle-ai (`## Specs` / `## Tasks` / `## Log`).
- **Runner de tests:** `node --test` (unit + security), `@playwright/test` (e2e + a11y con axe).
- **Entrega:** solo entorno `dev` (rama `claude/solobuses-custom-styling-bm6daw`). Producción
  (`main`, raíz de arivillani.github.io) no se toca.
- **Estrategia de entrega:** `single-branch` sin PR hasta que el usuario lo pida.

## Specs

### S1 — Estructura (réplica funcional, contenido original)
El sitio reproduce las secciones típicas de solobuses.com.ar, en este orden, con textos e
imágenes propios de Buses Nieto (no se copia texto ni imágenes del sitio de referencia):
barra de contacto → header (logo, navegación, CTA WhatsApp) → hero con buscador →
accesos por categoría (Buses, Minibuses, Combis) → unidad destacada → catálogo con filtros →
detalle de unidad (galería + ficha + CTA) → servicios (Financiación, Permutas, Gestoría,
Búsqueda a pedido) → "Vendé tu unidad" → unidades vendidas → nosotros → contacto → footer
con legales; además una página `terminos.html`.
- **Aceptación:** cada sección existe con `id` y encabezado; todos los anchors de la nav
  resuelven a una sección existente; hay exactamente un `h1`.

### S2 — Marca (del flyer)
Nombre "BUSES NIETO". Paleta: verde bosque oscuro (fondo), verde brillante (acento),
naranja/rojo (precio), blanco. Tipografía condensada, itálica y en negrita; formas diagonales.
WhatsApp: "3549 442500" y "11 2511 3132".
- **Aceptación:** los dos números aparecen visibles y enlazan a `https://wa.me/5493549442500`
  y `https://wa.me/5491125113132`. Las fuentes se sirven desde el propio sitio.

### S3 — Unidad destacada (textos literales del flyer)
"SCANIA METALSUR", "MODELO 2014", "CAMA SUITE", "GOMAS 70%", "EXCELENTE ESTADO",
"LISTO PARA TRABAJAR", "U$S 90.000", "DÓLARES ESTADOUNIDENSES",
"POSIBILIDAD DE FINANCIACIÓN – TOMAMOS PERMUTAS", "AÑO 2014", "ASIENTOS 43",
"GOMAS 70%", "COMBUSTIBLE DIÉSEL", "LISTO PARA TRABAJAR"; fotos recortadas del flyer.
- **Aceptación:** la unidad destacada se ve sin JavaScript (HTML estático) y figura en el
  catálogo con precio `U$S 90.000`.

### S4 — Catálogo con filtros
Filtrar por tipo, marca, año mínimo, precio máximo (USD) y texto libre; ordenar por
"Más recientes", "Menor precio", "Mayor precio". Contador "N unidades". Estado vacío:
"No encontramos unidades con esos filtros". El buscador del hero aplica sus filtros al catálogo.
- **Aceptación:** tests unitarios de `filterUnits`/`sortUnits`; e2e que filtra y ve el conteo.

### S5 — Consulta por WhatsApp
Cada unidad tiene "Consultar por WhatsApp" → `https://wa.me/5493549442500?text=…` con el
mensaje "Hola Buses Nieto, me interesa la unidad <título> (<id>)." Links externos con
`target="_blank"` y `rel="noopener noreferrer"`.

### S6 — Vendé tu unidad
Formulario: nombre, teléfono, marca y modelo, año, asientos, mensaje (opcional).
Errores por campo en español. Al enviar abre WhatsApp con el resumen. No se guarda ni se envía
nada a terceros salvo lo que el usuario manda por WhatsApp.
- **Aceptación:** tests de `validateSellForm` y `buildSellMessage`; e2e de errores visibles.

### S7 — Seguridad (DevSecOps)
- CSP por `<meta>` sin `unsafe-inline` ni `unsafe-eval`; `default-src 'none'`; sin orígenes
  de terceros; `base-uri 'none'`; `object-src 'none'`; `form-action 'none'`.
- Sin `<script>` inline ni atributos `style=`/`on*=` en HTML. Sin `innerHTML`/`outerHTML`/
  `insertAdjacentHTML`/`document.write`/`eval` en el JS del sitio: los datos se pintan con
  `textContent`.
- Los datos de unidades se validan (esquema + rutas de imagen relativas en `img/`); una
  entrada inválida se descarta y no rompe el catálogo.
- `<meta name="referrer" content="strict-origin-when-cross-origin">`.
- CI: escaneo de secretos (gitleaks), SAST (CodeQL), `npm audit --audit-level=high`,
  dependency review en PR, actions fijadas por SHA, `permissions: contents: read`,
  `npm ci --ignore-scripts`.

### S8 — Accesibilidad y responsive
`lang="es-AR"`, skip link, landmarks, `alt` en imágenes, `label` en campos, foco visible,
modal de detalle accesible (Esc cierra, foco vuelve al disparador), sin scroll horizontal a
360 px, `prefers-reduced-motion` respetado.
- **Aceptación:** axe sin violaciones `serious`/`critical`; e2e mobile 360 px sin overflow.

### S9 — Despliegue solo dev
Pipeline en la rama de feature con gates (calidad + seguridad) y job `deploy-dev` sobre el
environment `dev`. Ningún job despliega desde `main`; `index.html` de la raíz no cambia.

### S10 — Datos de ejemplo honestos
Las unidades que no provienen del cliente se marcan `demo: true` y muestran la etiqueta
"Unidad de ejemplo" para reemplazarlas antes de producción.

### S11 — Proceso
Cada tarea se cierra con un commit de unidad de trabajo (Conventional Commits) con tests y
docs, y un recibo RDD con el nivel de riesgo (`passive`/`medium`/`high`) calculado por
`scripts/rdd-assess.mjs`; `high` recibe revisión 4R (Risk, Resilience, Readability,
Reliability).

## Tasks

| ID | Specs | Ruta | Estado | Commit |
| --- | --- | --- | --- | --- |
| T1 | S7, S11 | inline | pending | — |
| T2 | S3 | delegada (sonnet): recorte de fotos del flyer | pending | — |
| T3 | S2, S7 | delegada (sonnet): fuentes self-hosted | pending | — |
| T4 | S4, S5, S6, S7, S10 | inline, test-first | pending | — |
| T5 | S1, S2, S3, S8 | inline | pending | — |
| T6 | S1, S7 | delegada (sonnet): términos, SECURITY.md, dependabot | pending | — |
| T7 | S7 | inline, test-first | pending | — |
| T8 | S1, S4, S5, S6, S8 | inline | pending | — |
| T9 | S7, S9 | inline | pending | — |
| T10 | S11 | revisor independiente (4R) | pending | — |

- T1 Scaffold: `package.json`, servidor estático sin dependencias, `rdd-assess`, lint.
- T2 Fotos: recortes WebP del flyer en `site/img/units/scania-metalsur-2014/`.
- T3 Fuentes: Barlow / Barlow Condensed (OFL) en `site/fonts/` + `site/css/fonts.css`.
- T4 Dominio: `format`, `catalog` (validar/filtrar/ordenar), `whatsapp`, `sell-form`.
- T5 UI: `index.html`, CSS de marca, render del catálogo, modal y formulario.
- T6 Legales/seguridad del repo.
- T7 Tests de seguridad estáticos (CSP, inline, sinks peligrosos, rel externos).
- T8 E2E + a11y (desktop y mobile).
- T9 Workflow DevSecOps + `deploy-dev`.
- T10 Revisión 4R independiente del candidato completo.

## Log

- **L1** (pedido original, literal): "Copia esta página: https://solobuses.com.ar/
  Pero con el estilo, y para la empresa, de la imagen que te adjunto.
  Dale enfoque sdd+rdd+tdd usa agentes sonnet para las tareas que requieran operaciones de
  menor esfuerzo. Fíjate como hace gentle-ai de gentleman
  Desplegala solo dev, dale enfoque devsecops avísame cuando tengas un MVP para revisar"
- **L2** Exploración: solobuses.com.ar está bloqueado por la política de red del entorno
  (proxy 403). La estructura se reconstruyó a partir de resultados de búsqueda (concesionaria
  de ómnibus, minibuses y combis usados; financiación; gestoría; búsqueda de unidades a
  pedido; "Unidades vendidas"; "Términos y condiciones"). gentle-ai: se adopta el documento de
  feature (Specs/Tasks/Log), test-first y RDD por niveles de riesgo con 4R.
- **L3** Decisión: sitio estático sin dependencias de runtime (HTML + CSS + ES modules) dentro
  de `buses-nieto/` para no tocar la raíz de producción; dependencias solo de desarrollo.
