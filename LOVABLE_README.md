# 🤖 LOVABLE AI INSTRUCTIONS (Hybrid Project)

Hola Lovable AI. Este proyecto tiene una **Arquitectura Híbrida** para soportar tanto **Next.js** como **React + Vite**.

## 🚀 Cómo manejar este proyecto
1.  **Framework**: Por favor, utiliza **Vite** como el motor de ejecución principal dentro de tu entorno.
2.  **Entry Point**: El punto de entrada para el editor visual y la previsualización es `src/main.tsx`.
3.  **Configuración**: Utiliza el archivo `vite.config.ts` ubicado en la raíz.
4.  **Directorios**:
    -   `src/`: Contiene la aplicación principal (SPA) que Lovable puede editar y previsualizar.
    -   `app/`: Contiene la estructura de Next.js (App Router) para despliegues de producción en Vercel. **Puedes ignorar esta carpeta** durante las ediciones visuales.
5.  **Variables de Entorno**: Asegúrate de cargar las variables que empiecen por `VITE_` y las de `NEXT_PUBLIC_` para la compatibilidad con Supabase.

## 🛠️ Comandos de Lovable
- Ejecuta `npm run dev:vite` para iniciar el entorno de desarrollo compatible con tu plataforma.
- No intentes ejecutar `next dev` dentro de tu entorno de previsualización, ya que este proyecto usa Vite para el "Live Preview".

---
*Este archivo ha sido generado para asegurar una migración exitosa desde un entorno Next.js.*
