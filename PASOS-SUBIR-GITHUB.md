# Pasos para subir el proyecto a GitHub

## 1. Inicializar Git (si aún no está)

Abre la terminal en la carpeta del proyecto (`partner-hub-lovable`) y ejecuta:

```bash
cd "/Users/juanjosetamayo/Documents/Partners Site/partner-hub-lovable"
git init
```

## 2. Revisar qué se va a subir

El `.gitignore` ya excluye cosas que no deben ir al repo (node_modules, .env, .next, dist, etc.). Para ver qué archivos se incluirán:

```bash
git status
```

## 3. Crear el repositorio en GitHub

1. Entra en [github.com](https://github.com) e inicia sesión.
2. Clic en **"+"** (arriba a la derecha) → **"New repository"**.
3. **Repository name:** por ejemplo `partner-hub-lovable`.
4. Elige **Public** o **Private**.
5. **No** marques "Add a README" (ya tienes código local).
6. Clic en **"Create repository"**.

## 4. Conectar tu carpeta local con GitHub

GitHub te mostrará comandos; si ya tienes commits, suele mostrar algo como:

```bash
git remote add origin https://github.com/TU_USUARIO/partner-hub-lovable.git
git branch -M main
git push -u origin main
```

Sustituye `TU_USUARIO` por tu usuario de GitHub. Si tu repo tiene otra URL (por ejemplo con SSH), usa esa.

## 5. Hacer el primer commit (si no hay ninguno)

Si es la primera vez que usas Git en esta carpeta:

```bash
git add .
git commit -m "Initial commit: Partner Hub (Next.js + Vite/Lovable)"
```

## 6. Subir el código

```bash
git branch -M main
git remote add origin https://github.com/TU_USUARIO/partner-hub-lovable.git
git push -u origin main
```

Si ya habías puesto `origin` antes, y da error, quita el remote y vuelve a añadirlo:

```bash
git remote remove origin
git remote add origin https://github.com/TU_USUARIO/partner-hub-lovable.git
git push -u origin main
```

---

## Resumen rápido (copiar y pegar)

Sustituye `TU_USUARIO` por tu usuario de GitHub:

```bash
cd "/Users/juanjosetamayo/Documents/Partners Site/partner-hub-lovable"
git init
git add .
git commit -m "Initial commit: Partner Hub (Next.js + Vite/Lovable)"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/partner-hub-lovable.git
git push -u origin main
```

**Importante:** crea antes el repositorio vacío en GitHub (paso 3) con el mismo nombre (`partner-hub-lovable` o el que elijas).

---

## Si pide usuario y contraseña

- **HTTPS:** GitHub ya no acepta contraseña normal; usa un **Personal Access Token** como contraseña, o configura **Git Credential Manager**.
- **SSH:** genera una llave SSH y añádela a tu cuenta de GitHub; luego usa la URL del repo en formato `git@github.com:TU_USUARIO/partner-hub-lovable.git` en lugar de `https://...`.
