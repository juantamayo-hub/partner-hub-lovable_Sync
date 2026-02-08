/**
 * URL base del backend de APIs.
 * En Vite/Lovable: definir VITE_API_BASE_URL en variables de entorno (ej. en .env o en la configuración del proyecto).
 * Ejemplo: VITE_API_BASE_URL=https://partner-hub.vercel.app
 * Si está vacía, se usan rutas relativas (mismo origen), útil cuando el front y el API están en el mismo servidor (Next).
 */
function getEnvApiBase(): string {
  if (typeof import.meta !== "undefined" && import.meta.env && typeof (import.meta.env as Record<string, string>).VITE_API_BASE_URL === "string") {
    return (import.meta.env as Record<string, string>).VITE_API_BASE_URL.replace(/\/$/, "");
  }
  return "";
}

export const API_BASE_URL = getEnvApiBase();

/** Devuelve la URL completa para una ruta de API (ej. /api/users/partners). */
export function apiUrl(path: string): string {
  const base = API_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
