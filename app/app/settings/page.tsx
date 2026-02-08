"use client";

import { Suspense } from "react";
import SettingsPage from "../../../src/pages__spa/SettingsPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      }
    >
      <SettingsPage />
    </Suspense>
  );
}
