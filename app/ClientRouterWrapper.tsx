"use client";

import dynamic from "next/dynamic";

const BrowserRouterWrapper = dynamic(
  () => import("./BrowserRouterWrapper").then((mod) => ({ default: mod.BrowserRouterWrapper })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    ),
  }
);

export function ClientRouterWrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouterWrapper>{children}</BrowserRouterWrapper>;
}
