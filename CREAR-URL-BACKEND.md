# Cómo crear la URL del backend y conectar todo

Tu backend **ya está** en este repo (las rutas `/api/*` y la conexión a Google Sheets). Solo falta **desplegarlo** para que tenga una URL pública. Esa URL es la que usarás en Lovable.

---

## Paso 1: Subir el proyecto a GitHub (si no está)

```bash
cd "/Users/juanjosetamayo/Documents/Partners Site/partner-hub-lovable"
git add .
git commit -m "Deploy backend"
git push origin main
```

(Si ya está subido, pasa al paso 2.)

---

## Paso 2: Desplegar en Vercel (así obtienes la URL)

1. Entra en **[vercel.com](https://vercel.com)** e inicia sesión (con GitHub si quieres).
2. Clic en **"Add New..."** → **"Project"**.
3. **Import** el repositorio **partner-hub-lovable** desde tu GitHub.
4. Vercel detectará que es Next.js. No cambies el framework.
5. **Environment Variables (Variables de entorno):** añade las que usa tu backend para Google Sheets y Supabase, por ejemplo:
   - `GOOGLE_SHEETS_ID` = (ID de tu hoja de Google)
   - `GOOGLE_LEADS_SHEET_TAB` = `Bayteca_leads_2026` (o el nombre de tu pestaña)
   - `GOOGLE_DUPES_SHEET_TAB` = `B2B Copy`
   - `GOOGLE_USERS_SHEET_TAB` = `Users`
   - Y las de **credenciales** de Google (cuenta de servicio o API key), por ejemplo:
     - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
     - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (o la variable que uses en tu código)
   - Si usas Supabase por env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (o las que tengas en el repo).
6. Clic en **Deploy**.
7. Cuando termine, Vercel te mostrará la **URL del proyecto**, por ejemplo:
   - `https://partner-hub-lovable.vercel.app`  
   - o `https://partner-hub-lovable-abc123.vercel.app`

**Esa URL es tu URL del backend.** Sin barra al final.

---

## Paso 3: Conectar Lovable a esa URL

1. En **Lovable**, en tu proyecto, ve a **Settings** → **Environment Variables** (o donde se configuren variables).
2. Crea una variable:
   - **Nombre:** `VITE_API_BASE_URL`
   - **Valor:** la URL que te dio Vercel, por ejemplo `https://partner-hub-lovable.vercel.app`
3. Guarda y **vuelve a desplegar / hacer rebuild** de la app en Lovable.

A partir de ahí, el frontend de Lovable llamará a esa URL para `/api/users/partners`, `/api/metrics`, etc., y el dropdown, las métricas y el resto de datos se conectarán a lo que ya tienes (Google Sheets, etc.).

---

## Resumen

| Qué quieres | Dónde se hace |
|-------------|----------------|
| **Crear la URL** | Desplegar este repo (Next.js) en Vercel → Vercel te da la URL. |
| **Que esté conectado** | Poner esa URL en `VITE_API_BASE_URL` en Lovable y volver a desplegar el front. |

El backend (APIs + Google Sheets) ya está en este proyecto; solo necesitas desplegarlo en Vercel para tener la URL y luego configurarla en Lovable.
