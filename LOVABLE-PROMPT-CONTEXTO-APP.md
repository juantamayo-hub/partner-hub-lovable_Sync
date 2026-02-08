# Prompt para Lovable: contexto completo de la app (ya creada)

Copia y pega este texto en Lovable para que entienda cómo funciona y se ve la app, qué módulos hay, y cómo se conecta a APIs y Google Sheets. **La app ya está creada en el repositorio;** Lovable debe respetar y mantener esta estructura y comportamiento.

---

## Objetivo

Este documento describe el **Partner Hub Portal** tal como está implementado. La aplicación **ya existe** en el repo: flujo de login, layout, módulos, llamadas a API y conexión a Google Sheets. Usa esta descripción para entender el producto y para cualquier cambio o evolución sin romper lo que ya funciona.

---

## 1. Después de iniciar sesión

- **Redirección:** Tras login exitoso el usuario va a `/app` (Dashboard). Si no hay sesión, se redirige a `/auth/login`.
- **Layout:** Todas las rutas bajo `/app` comparten el mismo shell:
  - **Sidebar izquierda** (colapsable): logo “Partner Site / Portal de Partners”, navegación, avatar y email del usuario, botón cerrar sesión.
  - **Header superior:** botón para expandir/colapsar sidebar, título y descripción de la página actual, controles de admin (si aplica), nombre del partner o “Vista Global”, botón “Referir ahora”, “Cerrar sesión”.
  - **Área principal:** contenido de la página con scroll (`main` con `p-6`).

---

## 2. Módulos y rutas (sidebar)

| Ruta | Módulo | Quién lo ve | Descripción |
|------|--------|-------------|-------------|
| `/app` | **Dashboard** | Todos | Resumen de métricas de leads, gráficos y tabla de últimos leads. |
| `/app/leads` | **Leads** | Todos | Listado y gestión de leads (tabla, filtros, etapas). |
| `/app/duplicates` | **Duplicados** | Todos | Vista de duplicados (mismo partner / otros partners). |
| `/app/resource-hub` | **Recursos** | Todos | Centro de recursos para partners. |
| `/app/contact` | **Contáctanos** | Todos | Formulario o enlace de contacto (p. ej. mailto al account manager). |
| `/app/integrations` | **Integraciones** | Todos | Página de integraciones (Google Sheets, Supabase, etc.). |
| `/app/settings` | **Panel de control** | Solo **admin** | Configuración o panel de control (visible solo si el usuario es admin). |

La sidebar usa íconos (LayoutDashboard, Users, Library, Mail, Settings) y oculta “Panel de control” si el usuario no es admin.

---

## 3. Roles y filtrado por partner

- **Usuarios permitidos:** Solo pueden registrarse o iniciar sesión los usuarios autorizados (lista definida en backend; ver APIs más abajo).
- **Partner (rol partner):** Ve únicamente los datos de su partner. El `partner_name` (o partner asignado) se usa en las llamadas a API para filtrar.
- **Admin:** Puede ver “Todos” (todos los partners) o “Partner” (un partner concreto). En el header hay:
  - Badge “Admin”.
  - Toggle “Todos” / “Partner”.
  - Si elige “Partner”, un selector (dropdown) con la lista de partners.
  La URL lleva `?partner_name=...` o `?view=all` / `?view=partner` y parámetros que las APIs usan para filtrar.

---

## 4. Dashboard (`/app`) – contenido y datos

- **Tarjetas de métricas (MetricCard):**  
  Total leads enviados, Activos, Perdidos, Duplicados mismo partner, Duplicados otros partners, Conversión (30d), Envío a banco (count + %), Ingresos (ej. 0 EUR). Valores numéricos o porcentajes según el caso.
- **LeadStageOverview:** Vista por etapas de lead (barras/porcentajes por etapa, con colores).
- **Gráficos (Recharts):**  
  - Leads por día (serie temporal).  
  - Duplicados (mismo vs otros partners).  
  - Tendencia de duplicados (semanal).  
  - Razones de pérdida (loss reasons).
- **Tabla:** Últimos leads (RecentLeadsTable): columnas como nombre, email, fuente, estado, fecha.

**Origen de datos:** Todo esto se alimenta de las APIs indicadas más abajo (métricas, leads, etapas), que a su vez leen de Google Sheets (y/o Supabase si aplica).

---

## 5. APIs que usa la app (ya implementadas en el backend)

La app **solo consume** estas rutas; no implementa lógica de Sheets en el front. El backend (Next.js API routes o equivalente) ya está creado.

| API | Método | Uso | Respuesta / Comportamiento |
|-----|--------|-----|----------------------------|
| `/api/metrics` | GET | Dashboard | Query: `partner_name` (opcional). Devuelve resumen (totales, activos, perdidos, duplicados mismo/otros, conversión, envío a banco), series `daily`, `weekly`, y `lossReasons`. Los datos se calculan a partir de leads y duplicados leídos de Google Sheets. |
| `/api/leads` | GET | Dashboard, Leads | Query: `partner_name` (opcional). Devuelve lista de leads (id, nombre, email, fuente, estado, fecha, etc.) filtrada por partner cuando aplica. |
| `/api/leads/stages` | GET | Dashboard (LeadStageOverview) | Query: `partner_name`, `active_only` (opcional). Devuelve agregados por etapa (total, countsByStage con stage, count, percentage, shortLabel, color). |
| `/api/duplicates` | GET | Página Duplicados | Datos de duplicados (mismo partner / otros partners); origen en Sheets o en la misma lógica que alimenta `/api/metrics`. |
| `/api/users/allowed` | GET | Login / registro | Query: `email`. Devuelve `{ allowed, role, partner }`. Define si el email puede entrar, si es admin o partner, y el partner asignado. Origen: hoja “Users” en Google Sheets. |
| `/api/users/partners` | GET | Admin (selector de partners) | Lista de nombres de partners únicos (para el dropdown del header). Origen: columna partner/org en la hoja “Users”. |
| `/api/users/log` | POST | Opcional (log de login) | Body: `{ email }`. Para registrar inicios de sesión (fire-and-forget). |

Todas las llamadas desde el front usan `window.location.origin` (o base URL del app) + ruta; en desarrollo con Vite puede existir proxy hacia el backend que expone estas rutas.

---

## 6. Conexión con Google Sheets (backend)

- **Configuración:** El backend usa variables de entorno para conectar a Google Sheets (por ejemplo `GOOGLE_SHEETS_ID`, `GOOGLE_LEADS_SHEET_TAB`, `GOOGLE_DUPES_SHEET_TAB`, `GOOGLE_USERS_SHEET_TAB`, y credenciales de cuenta de servicio o API key según implementación).
- **Hojas / pestañas usadas:**  
  - **Leads:** p. ej. `Bayteca_leads_2026` (configurable). Filas mapeadas a leads (email, teléfono, nombre, estado, etapa, org/partner, duplicado mismo/otros, razón de pérdida, etc.).  
  - **Duplicados / B2B:** p. ej. `B2B Copy` para datos de duplicados.  
  - **Users:** pestaña “Users” (o configurable). Columnas para email, rol (admin/partner), partner/empresa asignado. Sirve para `/api/users/allowed` y `/api/users/partners`.
- La app en el front **no** lee Sheets directamente; todo pasa por las APIs anteriores.

---

## 7. Supabase

- **Auth:** Login, registro, recuperar/restablecer contraseña con Supabase Auth. El cliente Supabase está configurado en el repo (URL y clave anón/public).
- **Autorización:** La lista de quienes pueden entrar y su rol/partner viene de la API `/api/users/allowed` (alimentada por Sheets), no solo de Supabase.
- **Datos de negocio:** Leads, métricas y duplicados vienen de las APIs (y Sheets). Supabase puede usarse para perfiles, preferencias o tablas auxiliares si ya está en el repo; la fuente principal de “negocio” son las APIs + Sheets.

---

## 8. Diseño y UI

- **Estilo:** Dashboard profesional, marca “Bayteca” (verdes: primary, accent, sidebar oscura con gradiente). Variables CSS en `:root` y `.dark` (background, foreground, primary, accent, sidebar, chart, success, warning, etc.).
- **Componentes:** shadcn/ui (cards, tables, badges, dialogs, select, buttons, sidebar, etc.). Tablas con bordes, badges por estado/etapa, cards con sombra suave.
- **Layout:** Responsive; sidebar colapsable; header fijo; contenido con padding.
- **Tema:** Soporte claro/oscuro (clase `dark` en el DOM).
- **Gráficos:** Recharts (áreas, barras, tooltips, colores alineados al design system).

---

## 9. Resumen para Lovable

- **La app ya está creada:** flujo de login, layout con sidebar y header, módulos (Dashboard, Leads, Duplicados, Recursos, Contáctanos, Integraciones, Settings para admin), roles (admin/partner) y filtrado por partner.
- **APIs:** Métricas, leads, stages, duplicates, users/allowed, users/partners (y opcionalmente users/log). Todas deben seguir existiendo en el backend; el front solo las consume.
- **Datos:** Google Sheets como fuente principal vía backend (hojas de leads, duplicados, users); Supabase para auth y lo que ya use el repo (perfiles, etc.).
- **Diseño:** Mantener paleta Bayteca, shadcn, Recharts y la estructura de layout descrita.

Al hacer cambios o sugerir mejoras, mantener esta estructura, estas rutas de API y este comportamiento de roles y filtrado para no romper la app existente.
