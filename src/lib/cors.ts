export function corsHeaders(origin: string | null) {
  const o = origin ?? "";

  const isLovablePreview =
    o.startsWith("https://id-preview--") && o.endsWith(".lovable.app");

  const isYourVercel =
    o === "https://partner-hub-lovable-csih.vercel.app";

  const isLocalhost =
    o === "http://localhost:3000" || o === "http://localhost:5173";

  const allowed = isLovablePreview || isYourVercel || isLocalhost;

  if (!allowed) return {};

  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}
