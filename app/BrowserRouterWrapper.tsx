"use client";

import { BrowserRouter } from "react-router-dom";

export function BrowserRouterWrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}
