"use client";

import { Suspense } from "react";
import LeadsPage from "../../../src/pages__spa/LeadsPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      }
    >
      <LeadsPage />
    </Suspense>
  );
}
