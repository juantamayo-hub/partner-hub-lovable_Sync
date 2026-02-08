"use client";

import { Suspense } from "react";
import DashboardPage from "../../src/pages__spa/DashboardPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      }
    >
      <DashboardPage />
    </Suspense>
  );
}
