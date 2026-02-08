# Cómo usar VITE_API_BASE_URL

La app ya está preparada para usar una **URL base del backend**. Así puedes definirla y usarla.

---

## 1. Dónde definirla (cómo “sacar” el valor)

Tienes que **darle un valor** a la variable; la app solo la **lee**.

### En tu máquina (desarrollo con Vite)

1. En la raíz del proyecto crea o edita el archivo **`.env`** (no se sube a Git).
2. Añade una línea como esta (sustituye por la URL real de tu backend):

   ```env
   VITE_API_BASE_URL=https://tu-app-next.vercel.app
   ```

   Sin barra al final. Ejemplo si tu Next está en Vercel:  
   `VITE_API_BASE_URL=https://partner-hub-lovable.vercel.app`

3. Reinicia el servidor de Vite (`npm run dev:vite`) para que cargue la variable.

### En Lovable

1. Entra en la **configuración del proyecto** en Lovable (Settings / Variables de entorno).
2. Crea una variable:
   - **Nombre:** `VITE_API_BASE_URL`
   - **Valor:** la URL base de tu backend (ej. `https://partner-hub-lovable.vercel.app`).
3. Guarda. Lovable usará esa variable al construir y al ejecutar la app.

### Si no la defines

- Si **no** pones `VITE_API_BASE_URL`, la app usa el **mismo origen** (`window.location.origin`). Eso sirve cuando el front y el API están en el mismo dominio (por ejemplo todo en Next o mismo servidor).
- Cuando el front (Vite/Lovable) está en un dominio y el API en otro (p. ej. Next en Vercel), **sí** debes definir `VITE_API_BASE_URL` con la URL del backend.

---

## 2. Cómo la usa la app

El código usa la utilidad **`apiUrl()`** en `src/lib/api-base.ts`:

- **`apiUrl('/api/users/partners')`** → si existe `VITE_API_BASE_URL`, devuelve `https://tu-backend.com/api/users/partners`; si no, usa el origen actual + `/api/users/partners`.
- Todas las llamadas a `/api/metrics`, `/api/leads`, `/api/leads/stages`, `/api/duplicates`, `/api/users/allowed`, `/api/users/partners` y `/api/users/log` ya usan `apiUrl()`, así que respetarán la URL base que configures.

No tienes que tocar código para “sacar” la URL: solo defines la variable en `.env` o en Lovable y la app la usa automáticamente.

---

## 3. Resumen

| Dónde              | Cómo “sacar” / definir VITE_API_BASE_URL |
|--------------------|-------------------------------------------|
| **Local (Vite)**   | Archivo `.env` en la raíz: `VITE_API_BASE_URL=https://...` |
| **Lovable**        | Settings del proyecto → Variable de entorno `VITE_API_BASE_URL` = URL de tu backend |
| **Valor**          | URL base del backend **sin** barra final (ej. `https://partner-hub.vercel.app`) |

La app ya lee esa variable; solo falta que tú le des el valor en el entorno que uses (local o Lovable).
