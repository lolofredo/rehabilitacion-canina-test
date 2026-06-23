# Rehabilitación Canina Chile

Landing de orientación online de movilidad canina para tutores de todo Chile.

## Qué cambió

- Una sola oferta principal: valoración inicial online de movilidad canina.
- CTA principal dirigido al formulario, no a agenda ni a múltiples planes.
- Mensaje enfocado en claridad y siguiente paso, sin prometer recuperación.
- Secciones de funcionamiento, alcance, perfil del creador, seguridad y FAQ.
- Intake v0 con datos del tutor, perro, antecedentes, función, videos y objetivo.
- Las señales de alerta se guardan junto al caso y muestran una recomendación urgente de atención veterinaria, sin bloquear el registro.
- Los casos con señales de alerta quedan marcados mediante `alerta_veterinaria` y la advertencia se muestra aunque falle la API.
- El consentimiento del tutor se registra con versión y fecha de aceptación.
- Resumen estructurado que se abre en WhatsApp para revisión y envío del tutor.
- Google Analytics 4 y Microsoft Clarity cargados solo tras consentimiento.
- Eventos de conversión, progreso, abandono, scroll y Core Web Vitals sin datos personales ni clínicos.
- SEO técnico para Chile con metadatos, datos estructurados, sitemap y robots.
- Diseño responsive, navegación accesible y soporte para movimiento reducido.
- Textos legales actualizados al nuevo flujo.

## Arquitectura

- Producción: landing → `/api/intakes` → Netlify Function → Supabase → `caseId` → WhatsApp.
- Desarrollo clásico: `localhost:4173` → Express en `localhost:3000`.
- Desarrollo Netlify: `netlify dev` sirve landing y funciones en un único origen.

Las claves de Supabase solo se leen en el backend. Nunca deben añadirse a `main.js`.

## Condiciones actuales del piloto

- Valoración inicial gratuita.
- Plazo máximo de respuesta: 3 días hábiles.
- No existe monitoreo inmediato ni atención de urgencias.
- Los casos se conservan durante un máximo de 12 meses desde la última interacción.

## Columnas adicionales de Supabase

La tabla `public.intakes` debe incluir:

```sql
alter table public.intakes
  add column if not exists consent_accepted boolean not null default false,
  add column if not exists consent_version text,
  add column if not exists consent_accepted_at timestamptz,
  add column if not exists alerta_veterinaria boolean not null default false,
  add column if not exists urgent_notice_shown_at timestamptz;
```

El backend conserva `raw_payload` como respaldo estructurado del intake completo, además de guardar los campos normalizados en sus columnas correspondientes.

## Variables privadas

Copia `.env.example` como `.env` para desarrollo local:

```env
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
```

En Netlify añade las mismas variables desde:

`Project configuration → Environment variables`

No subas `.env` a GitHub.

## Cómo probar

### Opción recomendada: entorno Netlify

```bash
npm run dev
```

Luego abre la URL local indicada por Netlify CLI. El endpoint estará disponible en:

```text
/api/health
/api/intakes
```

### Opción clásica: frontend y Express separados

Terminal 1:

```bash
python3 -m http.server 4173
```

Terminal 2:

```bash
npm run dev:api
```

Luego abre `http://localhost:4173`. `main.js` detecta ese puerto y utiliza
`http://localhost:3000/api/intakes`.

## Pruebas automatizadas

```bash
npm test
```

Las pruebas verifican health, validación, inserción, generación de `caseId` y errores de
Supabase sin escribir datos reales.

## Configuración

- WhatsApp: cambia `WHATSAPP_NUMBER` al inicio de `main.js` si cambia el número.
- Analytics: los ID de Google Analytics y Microsoft Clarity se encuentran al inicio de `main.js`.
- Email de contacto: aparece en el footer y en la política de privacidad.

## Publicación en Netlify

### Despliegue conectado a Git

1. Sube el proyecto sin `.env`, `node_modules`, `.netlify` ni `dist`.
2. Netlify detectará `netlify.toml`, ejecutará `npm run build`, publicará `dist/` y
   desplegará `netlify/functions/`.
3. Añade `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` como variables privadas.
4. Envía un único commit a la rama conectada cuando todos los cambios estén revisados.
5. Comprueba `https://rehabilitacioncanina.cl/api/health`.
6. Envía un intake de prueba y confirma la fila en `public.intakes`.

### Despliegue manual

No arrastres la carpeta raíz a Netlify, porque contiene código de servidor. Ejecuta:

```bash
npm run build
```

La carpeta `dist/` contiene exclusivamente los archivos públicos de la landing. Para
desplegar también las funciones, usa Netlify CLI o conecta el proyecto a Git; arrastrar
solo `dist/` no despliega funciones serverless.
