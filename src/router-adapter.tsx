/**
 * Router adapter: misma API que next/navigation + next/link
 * para que los componentes funcionen con Vite (react-router-dom) y con Next (si se envuelve en BrowserRouter).
 */
import { Link as RouterLink, useLocation, useNavigate, useSearchParams as useSearchParamsRR } from "react-router-dom";
import type { ReactNode } from "react";

/** Compatible con Next: devuelve solo el primer elemento (URLSearchParams). */
export function useSearchParams() {
  const [searchParams] = useSearchParamsRR();
  return searchParams;
}

export function usePathname() {
  return useLocation().pathname;
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url, { replace: true }),
  };
}

interface LinkProps {
  href: string;
  children?: ReactNode;
  className?: string;
}

export function Link({ href, children, className }: LinkProps) {
  return (
    <RouterLink to={href} className={className}>
      {children}
    </RouterLink>
  );
}
