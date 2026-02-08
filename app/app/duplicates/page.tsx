"use client";

import { Suspense } from "react";
import DuplicatesPage from "../../../src/pages__spa/DuplicatesPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      }
    >
      <DuplicatesPage />
    </Suspense>
  );
}
