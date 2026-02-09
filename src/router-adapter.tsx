"use client";

/**
 * Router adapter: misma API que next/navigation + next/link
 * para que los componentes funcionen con Vite (react-router-dom) y con Next.
 */
import type { ReactNode } from "react";
import { Link as RouterLink, useLocation, useNavigate, useSearchParams as useSearchParamsRR } from "react-router-dom";
import NextLink from "next/link";
import { usePathname as useNextPathname, useRouter as useNextRouter, useSearchParams as useNextSearchParams } from "next/navigation";

// En SSR (window undefined) usamos Next; en cliente detectamos por __NEXT_DATA__ / __next_f
const isNext =
  typeof window === "undefined" ||
  (typeof window !== "undefined" &&
    (("__NEXT_DATA__" in window) || ("__next_f" in window)));


/** ---- Hooks separados (para no llamar hooks "del otro router") ---- */

function useSearchParamsNext() {
  return useNextSearchParams();
}
function useSearchParamsReactRouter() {
  const [params] = useSearchParamsRR();
  return params;
}
export const useSearchParams = isNext ? useSearchParamsNext : useSearchParamsReactRouter;

function usePathnameNext() {
  return useNextPathname();
}
function usePathnameReactRouter() {
  return useLocation().pathname;
}
export const usePathname = isNext ? usePathnameNext : usePathnameReactRouter;

function useRouterNext() {
  const r = useNextRouter();
  return { push: r.push, replace: r.replace };
}
function useRouterReactRouter() {
  const nav = useNavigate();
  return {
    push: (url: string) => nav(url),
    replace: (url: string) => nav(url, { replace: true }),
  };
}
export const useRouter = isNext ? useRouterNext : useRouterReactRouter;

/** ---- Link ---- */

interface LinkProps {
  href: string;
  children?: ReactNode;
  className?: string;
}

export function Link({ href, children, className }: LinkProps) {
  return isNext ? (
    <NextLink href={href} className={className}>
      {children}
    </NextLink>
  ) : (
    <RouterLink to={href} className={className}>
      {children}
    </RouterLink>
  );
}
