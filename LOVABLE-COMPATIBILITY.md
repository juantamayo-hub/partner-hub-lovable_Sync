# Compatibilidad partner-hub-lovable con Lovable

## Estructura Lovable (Vite) disponible

El proyecto incluye **estructura compatible con Lovable**: React + Tailwind + **Vite** (SPA).

- **Desarrollo con Vite (Lovable):** `npm run dev:vite` — sirve en http://127.0.0.1:3000
- **Build para producción (Vite):** `npm run build:vite` — salida en `dist/`
- **Preview del build:** `npm run preview`

Estructura tipo Lovable:

- `index.html` — entrada HTML
- `vite.config.ts` — configuración Vite (alias `@/` → `src/`, proxy `/api`)
- `src/main.tsx` — entrada de la app
- `src/App.tsx` — rutas (React Router)
- `src/` — componentes, páginas, lib, hooks, integraciones (Supabase)

**API en modo Vite:** las llamadas a `/api/*` se redirigen por defecto a `http://127.0.0.1:3001`. Para usar otro backend, define `VITE_API_PROXY_TARGET` antes de `npm run dev:vite`. Si necesitas las API routes de Next (Google Sheets, etc.), arranca además el servidor Next en el puerto 3001: `npm run dev -- -p 3001`.

---

## Conclusión sobre importación directa en Lovable

**La importación directa de un repo en Lovable sigue sin estar soportada.**  
Pero el código del proyecto **sí sigue la estructura** que Lovable usa (Vite, `src/`, `index.html`), así que puedes copiar/pegar o conectar el repo y desarrollar con la misma stack.

---

## Stack de Lovable (oficial)

Según la [FAQ de Lovable](https://docs.lovable.dev/introduction/faq):

- **Frontend:** React, Tailwind CSS, **Vite**
- **Datos y auth:** Lovable Cloud o **Supabase**
- **Estructura:** SPA con `src/`, `index.html`, `vite.config.js` — **no Next.js**

---

## Este proyecto (partner-hub-lovable)

| Aspecto        | Lovable        | Este proyecto              |
|----------------|----------------|----------------------------|
| Framework      | Vite           | **Next.js 16** (App Router)|
| Build          | Vite           | `next build` / Turbopack   |
| Rutas          | React Router   | File-based (`app/`)        |
| API backend    | No (o externo) | **Next.js API Routes**     |
| Entrada        | `index.html`   | `app/layout.tsx`           |

---

## Paquetes: compatibles vs problemáticos

### Compatibles o fáciles de usar en Lovable

- React, React DOM  
- Tailwind CSS  
- **Supabase** (`@supabase/supabase-js`) — integración nativa  
- Radix UI (@radix-ui/*) — Lovable puede usar componentes similares  
- lucide-react, clsx, tailwind-merge  
- react-hook-form, zod, @hookform/resolvers  
- recharts, framer-motion, date-fns, etc. — Lovable permite npm packages (por prompt)

### No compatibles con el modelo de Lovable

- **next** — Lovable no usa Next.js  
- **next-themes** — específico de Next.js  
- **googleapis** — pensado para Node/backend; en Lovable el backend es Lovable Cloud o Supabase (Edge Functions), no un servidor Next.js  
- Cualquier uso de App Router, Server Components, `getServerSideProps`, API routes en `app/api/` — no existen en un SPA Vite

---

## Importación en Lovable

De la documentación:

> **"Can I start a project by importing code from an external source such as GitHub?"**  
> **No, currently there is no way to start a Lovable project from already existing code on for example GitHub.**

Por tanto:

- **No** puedes “empezar” un proyecto Lovable importando este repo tal cual.
- Si conectas un repo a un proyecto Lovable, lo habitual es que sea un repo **creado por Lovable** (Vite). Si reemplazas su contenido con este código Next.js:
  - La estructura (app/, next.config, etc.) no coincide con lo que Lovable espera.
  - El editor y el flujo de Lovable no están pensados para Next.js.
- **No es 100% segura** la importación directa de este proyecto en Lovable sin adaptar primero a Vite/SPA.

---

## Opciones si quieres usar Lovable

1. **Migrar este proyecto a Vite/SPA**  
   - Por ejemplo con [nextlovable](https://nextlovable.com/) (herramienta para pasar de Lovable/SPA a Next.js); en tu caso sería el camino inverso: reescribir o exportar la lógica a un proyecto Vite/React y luego subir ese código (o crear un proyecto nuevo en Lovable y replicar la UI/lógica).

2. **Mantener Next.js y no usar Lovable para este repo**  
   - Seguir desarrollando en VS Code/Cursor y desplegar como Next.js (Vercel, etc.). Es la opción más segura para este código tal como está.

3. **Usar Lovable para partes nuevas**  
   - Crear en Lovable solo **nuevas** funcionalidades o pantallas (Vite + React + Supabase) y luego integrar manualmente en este repo (copiando componentes o lógica), en lugar de importar todo el proyecto.

---

## Resumen

- **Compatibilidad directa:** No. El proyecto es Next.js; Lovable es Vite.  
- **Importación segura en Lovable:** No. No existe “importar código existente desde GitHub” y la estructura no es la que Lovable genera.  
- **Paquetes:** Muchos (React, Tailwind, Supabase, Radix, etc.) son compatibles con el ecosistema; los que dependen de Next.js o de backend Node (next, next-themes, googleapis, API routes) no tienen equivalente directo en el modelo Lovable.

Para usar Lovable con esta app, hace falta una migración a Vite/SPA o usar Lovable solo para partes nuevas e integrarlas a mano en este repo.
