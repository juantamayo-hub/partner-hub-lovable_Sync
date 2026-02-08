# Cómo crear un perfil administrador (ver todos los partners y elegir cuál ver)

Esta guía explica cómo configurar un usuario **administrador** en el Partner Hub para que pueda ver datos de **todos los partners** y elegir **qué partner ver** en cada momento.

---

## 1. Dónde se define quién es admin

Los usuarios autorizados y su rol vienen de la **hoja "Users" en Google Sheets** (o la pestaña configurada en `GOOGLE_USERS_SHEET_TAB`).

El backend lee esa hoja y expone:
- **GET /api/users/allowed?email=...** → devuelve `{ allowed, role, partner }`.
- **GET /api/users/partners** → devuelve la lista de nombres de partners (para el selector del admin).

La app considera **admin** a cualquier usuario cuyo `role` devuelto por `/api/users/allowed` sea **"admin"** (insensible a mayúsculas).

---

## 2. Estructura de la hoja Users (Google Sheets)

La hoja debe tener al menos estas columnas (los nombres pueden variar; el backend busca por alias):

| Columna (ejemplo) | Uso |
|-------------------|-----|
| **Email** (o "User", "Correo") | Email del usuario. Debe coincidir con el que usa para login. |
| **Role** (o "Rol") | Valor que define el tipo de usuario. Para administrador usar: **`admin`**. Para usuario normal (solo ve su partner): **`partner`** o dejar vacío. |
| **Partner** (o "Org", "Company", "Empresa") | Para usuarios no admin: nombre del partner al que pertenece (solo verá datos de ese partner). Para admin puede ir vacío o un valor por defecto; lo importante es que **Role = admin**. |

**Ejemplo de filas:**

| Email | Role | Partner |
|-------|------|---------|
| admin@empresa.com | admin | |
| juan@partner-a.com | partner | Partner A |
| maria@partner-b.com | partner | Partner B |

- **admin@empresa.com** → la API devuelve `role: "admin"`. La app muestra los controles de administrador (ver todos / elegir partner).
- **juan@partner-a.com** → solo verá datos del partner "Partner A".
- **maria@partner-b.com** → solo verá datos del partner "Partner B".

---

## 3. Cómo se comporta el admin en la app

1. **Login:** El admin inicia sesión con Supabase (email/contraseña). La app llama a `/api/users/allowed?email=...` y recibe `allowed: true, role: "admin"`.
2. **Vista por defecto:** Tras entrar, puede ir a Dashboard (o cualquier módulo). En el **header** verá:
   - Un badge **"Admin"**.
   - Un toggle **"Todos"** / **"Partner"**.
   - Si elige **"Partner"**, un **dropdown** con la lista de partners (que viene de **GET /api/users/partners**).
3. **Modo "Todos":** No se envía filtro de partner a las APIs (`partner_name` vacío). Las APIs devuelven datos agregados de **todos los partners** (métricas, leads, duplicados, etapas).
4. **Modo "Partner" + selección:** El usuario elige un partner en el dropdown. La app pone en la URL algo como `?view=partner&partner_name=NombreDelPartner` y en todas las llamadas a **/api/metrics**, **/api/leads**, **/api/leads/stages**, **/api/duplicates** añade **?partner_name=NombreDelPartner**. Así solo se muestran datos de ese partner.
5. **Persistencia:** La elección (Todos vs Partner y qué partner) se refleja en la URL, así que se mantiene al navegar entre Dashboard, Leads, Duplicados, etc., hasta que el admin cambie el toggle o el selector.

---

## 4. Resumen para implementar o explicar a Lovable

- **Crear perfil administrador:** En la hoja Users de Google Sheets, añadir una fila con el **email** del usuario y en la columna **Role** (o "Rol") el valor **`admin`**. La columna Partner puede estar vacía para ese usuario.
- **Lista de partners para el selector:** La misma hoja Users tiene una columna **Partner** (o "Org", "Company", "Empresa"). El backend usa los valores únicos de esa columna (por ejemplo desde la fila 4 en adelante) para construir la lista que devuelve **GET /api/users/partners**. Esa lista es la que ve el admin en el dropdown.
- **Comportamiento en la app:** Si `role === "admin"`, el layout muestra el toggle "Todos" / "Partner" y el selector de partner; las APIs se llaman con o sin `partner_name` según la elección, y el admin puede ver todos los datos o los de un solo partner.

Con esto, el perfil administrador queda creado en datos (Sheets) y la app ya está preparada para mostrar los datos de todos los partners y permitir elegir qué partner ver.
