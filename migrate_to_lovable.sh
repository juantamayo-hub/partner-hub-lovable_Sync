#!/bin/bash

# --- CONFIGURACIÓN ---
PROJECT_DIR="/Users/juanjosetamayo/Documents/Collabortor Site"
LOVABLE_README="LOVABLE_README.md"

echo "🚀 Iniciando Migración para Lovable..."

# 1. Navegar al directorio
cd "$PROJECT_DIR" || { echo "❌ Error: No se encontró el directorio del proyecto"; exit 1; }

# 2. Pedir la URL del nuevo repositorio
echo "Por favor, introduce la URL de tu NUEVO repositorio de GitHub (ej. https://github.com/TU_USUARIO/TU_REPO.git):"
read -r NEW_REPO_URL

if [[ -z "$NEW_REPO_URL" ]]; then
    echo "❌ Error: No se introdujo una URL válida."
    exit 1
fi

# 3. Renombrar remotos
echo "📦 Configurando remotos..."
if git remote | grep -q "^origin$"; then
    git remote rename origin old-origin
    echo "✅ Remote 'origin' renombrado a 'old-origin'."
fi

# 4. Añadir nuevo remoto
git remote add origin "$NEW_REPO_URL"
echo "✅ Nuevo remote 'origin' configurado: $NEW_REPO_URL"

# 5. Empujar cambios
echo "⬆️ Subiendo código a GitHub (esto puede tardar unos segundos)..."
CURRENT_BRANCH=$(git branch --show-current)
if git push -u origin "$CURRENT_BRANCH"; then
    echo "✅ ¡Código subido con éxito!"
else
    echo "❌ Error al subir el código. Verifica tus permisos o la URL del repositorio."
    exit 1
fi

# 6. Instrucción Final
echo ""
echo "----------------------------------------------------------------"
echo "🎉 ¡LISTO PARA LOVABLE!"
echo "----------------------------------------------------------------"
echo "Instrucciones finales:"
echo "1. Ve a Lovable.dev"
echo "2. Crea un proyecto nuevo o abre el que acabas de conectar."
echo "3. Lovable leerá el archivo '$LOVABLE_README' y entenderá"
echo "   que debe usar la arquitectura híbrida (Vite)."
echo "4. ¡Disfruta de tu Partner Hub en Lovable! 🚀"
echo "----------------------------------------------------------------"
