# Dónde se usan y dónde consultar las credenciales de Google

## En este proyecto

### 1. Dónde se leen (código)

Las variables se usan en:

- **`src/lib/server/google-sheets.ts`** (líneas 7-9):
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
  - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_B64`

El código acepta **o bien** la clave en texto (PRIVATE_KEY) **o bien** en base64 (PRIVATE_KEY_B64). Con una de las dos basta.

### 2. Dónde las tienes definidas (local)

En tu máquina están en el archivo **`.env`** en la **raíz del proyecto** (y también en `partner-hub/.env` si usas esa carpeta).

Ese archivo **no se sube a Git** (está en `.gitignore`). Para ver los valores:

- Abre el archivo **`.env`** en la raíz del repo.
- Ahí verás líneas como:
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL=...`
  - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=...`  
  - o `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_B64=...`

Eso es **donde consultas** en el proyecto actual: en tu **`.env`** local.

### 3. Para Vercel / Cloud Run / otro servidor

En el panel del servicio (Vercel, Cloud Run, etc.):

- **Environment Variables** / **Variables de entorno**
- Crea las mismas variables con los **mismos valores** que en tu `.env` (copia el email y la clave desde tu `.env`).

No hace falta tocar código; solo configurar esas variables en el entorno donde corre el backend.

---

## Si no tienes las credenciales o quieres generarlas de nuevo

1. Entra en [Google Cloud Console](https://console.cloud.google.com/) y selecciona tu proyecto (ej. `partners-site-486219`).
2. **IAM y administración** → **Cuentas de servicio** (o busca "Service Accounts").
3. Elige la cuenta que usas para Sheets (ej. `partner-hub-sheets@...`) o crea una nueva.
4. Pestaña **Claves** → **Agregar clave** → **Crear clave nueva** → **JSON**.
5. Se descarga un JSON con:
   - **`client_email`** → ese valor es **`GOOGLE_SERVICE_ACCOUNT_EMAIL`**.
   - **`private_key`** → ese valor (incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`, con los `\n` literales) es **`GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`**.
6. Para **`GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_B64`** (opcional): codifica en base64 el contenido de `private_key` o todo el JSON y pon ese string en la variable.

**Resumen:** En el proyecto actual **consultas** estos valores en tu archivo **`.env`** (raíz del repo). Para desplegar, copias esos mismos valores a las variables de entorno del servicio (Vercel, Cloud Run, etc.).
