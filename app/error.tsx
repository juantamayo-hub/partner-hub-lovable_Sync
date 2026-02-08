"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
        Algo salió mal
      </h2>
      <p style={{ color: "#666", fontSize: "0.875rem" }}>
        {error?.message || "Error inesperado"}
      </p>
      <button
        onClick={reset}
        style={{
          padding: "0.5rem 1.5rem",
          borderRadius: "0.5rem",
          border: "1px solid #ccc",
          background: "#fff",
          cursor: "pointer",
          fontSize: "0.875rem",
        }}
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
