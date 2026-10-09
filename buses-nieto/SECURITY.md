# Política de seguridad

El sitio de Buses Nieto es **estático**: no tiene backend propio, no usa cookies y no
tiene formularios que envíen datos a servidores nuestros. El formulario "Vendé tu unidad"
solo arma un mensaje con los datos que cargás y lo abre en WhatsApp; el envío lo hacés
vos, y no se guarda ni se transmite nada a terceros salvo lo que vos mandes por ese medio.

## Reportar una vulnerabilidad

Si encontraste un problema de seguridad, **no abras un issue público**. Usá el reporte
privado de vulnerabilidades de GitHub: entrá al repositorio, andá a **Security → Report a
vulnerability** y completá el formulario con los pasos para reproducirlo, el impacto que
creés que tiene y, si podés, una sugerencia de arreglo.

Nuestro objetivo es dar acuse de recibo en 72 h hábiles. Es una meta de trabajo, no una
garantía: los tiempos reales pueden variar. Te pedimos que nos des un plazo razonable para
corregir el problema antes de divulgarlo.

## Controles implementados

| Control | Dónde | Qué protege |
| --- | --- | --- |
| CSP estricta por `<meta>`: `default-src 'none'`, sin `unsafe-inline` ni `unsafe-eval`, sin orígenes de terceros | `site/*.html`, `scripts/security-policy.mjs` | Inyección de scripts (XSS) y carga de recursos no previstos |
| Prohibición de sinks HTML (`innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`) | `eslint.config.js` | XSS por inserción de HTML no confiable; los datos se pintan con `textContent` |
| Validación por esquema de `data/units.json`, con rutas de imagen relativas | `site/js/catalog.js` | Datos malformados o rutas externas; una entrada inválida se descarta sin romper el catálogo |
| Links externos con `rel="noopener noreferrer"` | `site/*.html`, `site/js/` | `window.opener` y filtrado del referrer hacia otros sitios |
| Fuentes self-hosted | `site/fonts/`, `site/css/fonts.css` | Requests a terceros y fuga de IP o referrer a CDNs de fuentes |
| Servidor de desarrollo con protección contra path traversal y headers de seguridad | `scripts/serve.mjs` | Lectura de archivos fuera de `site/` y diferencias entre dev y producción |
| Tests de seguridad estáticos | `tests/security/` | Regresiones en CSP, scripts y estilos inline, sinks peligrosos y `rel` de links externos |
| CI: escaneo de secretos (gitleaks), SAST (CodeQL), `npm audit --audit-level=high`, dependency review en PR, actions fijadas por SHA, `permissions: contents: read`, `npm ci --ignore-scripts` | `.github/workflows/` | Secretos filtrados, vulnerabilidades en el código y en dependencias, ataques a la cadena de suministro |
| Dependabot semanal | `.github/dependabot.yml` | Dependencias y actions desactualizadas |

## Limitaciones conocidas

- **GitHub Pages no permite headers HTTP propios.** Por eso `frame-ancestors`, HSTS y
  `X-Content-Type-Options` no se pueden enviar en producción a través de Pages. La CSP va
  por `<meta>`, que no soporta `frame-ancestors`, así que el sitio no tiene protección
  propia contra ser embebido en un `<iframe>` ajeno. El servidor de desarrollo sí envía
  estos headers, pero eso no se traslada a producción mientras se use Pages.
- El entorno `dev` lleva `noindex` para que los buscadores no lo indexen.
- Las unidades marcadas como "Unidad de ejemplo" son datos de muestra y deben reemplazarse
  antes de publicar el sitio.

## Despliegue

El pipeline despliega **solo al entorno `dev`**, desde ramas de feature, después de pasar
los controles de calidad y de seguridad. Producción no se despliega desde este pipeline.
