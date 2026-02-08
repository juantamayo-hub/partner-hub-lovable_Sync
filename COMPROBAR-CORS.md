# Cómo comprobar que CORS funciona

## 1. Con el navegador (la prueba real)

1. **Despliega el backend** en Vercel (o donde tengas la API) y anota la URL, por ejemplo:  
   `https://partner-hub-lovable.vercel.app`

2. **Abre la app de Lovable** (preview o publicada) donde tengas configurado  
   `VITE_API_BASE_URL` = esa URL.

3. **Abre las DevTools** (F12 o clic derecho → Inspeccionar) → pestaña **Red** (Network).

4. **Recarga la página** o haz algo que llame a la API (login, ver dashboard, etc.).

5. En la lista de peticiones:
   - Busca una a tu API, por ejemplo:  
     `https://partner-hub-lovable.vercel.app/api/users/partners`  
     o `/api/metrics`, `/api/leads`, etc.
   - Clic en esa petición → pestaña **Encabezados** (Headers).
   - En **Encabezados de respuesta** (Response Headers) deberías ver algo como:
     - `Access-Control-Allow-Origin: *`
     - `Access-Control-Allow-Methods: GET, POST, ...`
   - La petición debe aparecer en **verde** (status 200 o 204), no en rojo.

6. **Si CORS fallara**: en la pestaña **Consola** (Console) verías un error del tipo  
   `"blocked by CORS policy"` o `"No 'Access-Control-Allow-Origin' header"`.  
   Si no aparece ese error y los datos cargan (dropdown con partners, métricas, etc.), **CORS está funcionando**.

---

## 2. Con curl (preflight OPTIONS)

Sustituye `TU_URL` por la URL base de tu API (sin barra final).

```bash
# Preflight OPTIONS (debe devolver 204 y cabeceras CORS)
curl -i -X OPTIONS "https://TU_URL/api/users/partners" \
  -H "Origin: https://id-preview--algo.lovable.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type"
```

**Correcto:** status `204 No Content` y en la respuesta algo como:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

**Luego prueba un GET:**

```bash
curl -i "https://TU_URL/api/users/partners" \
  -H "Origin: https://id-preview--algo.lovable.app"
```

Debe devolver **200** y el JSON de `partners`, y en los headers la misma `Access-Control-Allow-Origin: *`.

---

## 3. Resumen rápido

| Prueba | Qué hacer | Éxito si… |
|--------|-----------|------------|
| **En Lovable** | Abrir la app, login o dashboard | Dropdown de partners tiene datos, métricas se ven, sin errores en Consola. |
| **Red (Network)** | Ver una petición a `/api/...` | Status 200/204 y en Response Headers está `Access-Control-Allow-Origin`. |
| **curl OPTIONS** | Ejecutar el `curl -X OPTIONS` de arriba | Status 204 y cabeceras CORS en la respuesta. |

Si todo eso se cumple, CORS está funcionando correctamente.
