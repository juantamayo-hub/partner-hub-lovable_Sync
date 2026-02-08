# Prompt para Lovable: ajustar el plan al Partner Hub real

Copia y pega el siguiente texto en Lovable (donde puedas decirle qué hacer o ajustar el plan) para que el plan se alinee con la app que ya existe en el repositorio.

---

**Ajusta el Rebuild Plan según el Partner Hub que ya existe en este repo. No es un CRM de Partners y Deals; es un portal de partners con leads, métricas y duplicados. Cambios que necesito:**

**1. Autenticación (Phase 1)**  
- Mantener: Login, registro y recuperación de contraseña con Supabase Auth.  
- Añadir: Solo usuarios autorizados pueden registrarse/iniciar sesión (lista de emails permitidos, p. ej. desde Supabase o una tabla “allowed users”).  
- Roles: **admin** (puede ver todos los partners o filtrar por uno) y **partner** (solo ve sus propios datos).  
- Logout y redirección a login en rutas protegidas: mantener como en el plan.

**2. Esquema y datos (Phase 2)**  
- No usar solo “Partners table” y “Deals table” como en el plan.  
- El backend real obtiene datos de **APIs** (este repo tiene rutas `/api/metrics`, `/api/leads`, `/api/leads/stages`, `/api/duplicates`, `/api/users/allowed`, `/api/users/partners`). Las APIs pueden leer de Google Sheets o Supabase.  
- En Supabase: definir solo lo necesario para auth y, si aplica, tablas auxiliares (p. ej. usuarios permitidos, perfiles, o configuración). Si las métricas y leads vienen de APIs externas, no duplicar ese modelo en Supabase; solo documentar que la app consumirá esas APIs.  
- RLS: que cada usuario (o rol) solo acceda a los datos que le correspondan (por partner o por “admin”).

**3. Dashboard (Phase 3)**  
- No “Partners overview” y “Deal metrics” genéricos.  
- Sí: **Dashboard de métricas de leads**: total leads enviados, activos, perdidos, duplicados (mismo partner / otros partners), tasa de conversión, envío a banco, etc.  
- Gráficos con Recharts: leads por día, duplicados (mismo vs otros partners), tendencia de duplicados, razones de pérdida, y vista por **etapas de lead** (stage overview).  
- Bloque de “últimos leads” (tabla reciente).  
- Si el usuario es **admin**: selector para ver “todos” o “un partner” (dropdown de partners).  
- Diseño: tarjetas de métricas (MetricCard), charts en cards, layout con sidebar; estilo profesional y consistente con shadcn.

**4. Páginas principales (Phase 4 y 5)**  
- **Leads**: página de listado de leads (tabla con búsqueda/filtros si aplica), con etapa (stage), partner si aplica, y enlace a detalle o acciones. No “Partners Management” como página de CRUD de empresas.  
- **Duplicados**: página específica para duplicados (métricas y/o listado según el diseño actual del repo).  
- **Contacto**: página “Contáctanos” (formulario o mailto hacia account manager).  
- **Integraciones**: página de integraciones (p. ej. Google Sheets, Supabase); puede ser informativa o con configuración mínima.  
- **Resource Hub**: página de recursos para partners.  
- **Settings**: configuración o panel de control (por ejemplo para admins).  
- Opcional: si en el futuro quieres CRUD de “Partners” o “Deals” en Lovable, se puede añadir como fase posterior; no como núcleo del plan actual.

**5. Diseño y stack**  
- Mantener: shadcn/ui, diseño limpio, responsive, light/dark.  
- Mantener: sidebar con navegación a Dashboard, Leads, Duplicates, Recursos, Contáctanos, Settings (y lo que ya tenga el repo).  
- Colores/identidad: si el repo usa una paleta (p. ej. verdes “Bayteca”), respetarla en componentes y variables CSS.

**Resumen para el plan:**  
Que el plan describa un **portal de partners con Dashboard de leads y métricas, página de Leads, página de Duplicados, auth con roles admin/partner y datos vía APIs (y Supabase donde corresponda)**, no un CRM genérico de Partners + Deals. Las fases pueden reordenarse (Auth + Layout → Datos/APIs → Dashboard → Leads → Duplicados → Resto de páginas).

---

*Si Lovable tiene límite de caracteres, puedes pegar solo las secciones 1, 3 y 4 (Auth, Dashboard y Páginas principales) y decir: "Ajusta Phase 2 al backend por APIs y Supabase como arriba; Phase 5 sustituir por Leads y Duplicados, no Deals."*
