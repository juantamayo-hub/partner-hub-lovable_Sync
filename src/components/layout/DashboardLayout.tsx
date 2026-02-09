import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from '@/router-adapter';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Menu, Shield, Building2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiUrl } from '@/lib/api-base';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function DashboardLayout({ children, title, description, actions }: DashboardLayoutProps) {
  const { profile, user, isAdmin, signOut, loading } = useAuth();
  const [partners, setPartners] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // For admins: track if viewing all data or specific partner
  const viewMode = useMemo(() => {
    if (!isAdmin) return 'partner';
    return searchParams.get('view') ?? 'all';
  }, [isAdmin, searchParams]);

  const activePartnerId = useMemo(() => {
    if (!isAdmin) return profile?.partner_id ?? undefined;
    if (viewMode === 'all') return undefined;
    return searchParams.get('partner') ?? searchParams.get('partner_name') ?? undefined;
  }, [isAdmin, profile?.partner_id, searchParams, viewMode]);

  const partnerNameFromUrl = searchParams.get('partner_name');

  // Load partners list for admin (desde API / Google Sheets; funciona con skip auth)
  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;

    const loadPartners = async () => {
      setLoadingPartners(true);
      try {
        const response = await fetch(apiUrl('/api/users/partners'));
        if (!response.ok) throw new Error('Partners no disponibles');
        const data = await response.json();
        const names = (data.partners ?? []) as string[];
        if (mounted) {
          setPartners(names.map((name) => ({ id: name, name })));
        }
      } catch {
        if (mounted) setPartners([]);
      } finally {
        if (mounted) setLoadingPartners(false);
      }
    };

    void loadPartners();
    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  // Load partner name for non-admins
  useEffect(() => {
    if (isAdmin || !profile?.partner_id) return;
    let mounted = true;

    const loadPartnerName = async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('name')
        .eq('id', profile.partner_id)
        .maybeSingle();

      if (!error && mounted) {
        setPartnerName(data?.name ?? null);
        if (data?.name) {
          const params = new URLSearchParams(searchParams.toString());
          if (!params.get('partner_name')) {
            params.set('partner_name', data.name);
            router.replace(`${pathname}?${params.toString()}`);
          }
        }
      }
    };

    void loadPartnerName();
    return () => {
      mounted = false;
    };
  }, [isAdmin, profile?.partner_id, searchParams, pathname, router]);

  const userEmail = user?.email;

  // Load partner from sheet for non-admins
  useEffect(() => {
    if (isAdmin || partnerName || !userEmail) return;
    let mounted = true;

    const loadPartnerFromSheet = async () => {
      const response = await fetch(apiUrl(`/api/users/allowed?email=${encodeURIComponent(userEmail)}`));
      if (!response.ok) return;
      const data = await response.json();
      if (!mounted || !data.partner) return;
      setPartnerName(data.partner);
      const params = new URLSearchParams(searchParams.toString());
      if (!params.get('partner_name')) {
        params.set('partner_name', data.partner);
        router.replace(`${pathname}?${params.toString()}`);
      }
    };

    void loadPartnerFromSheet();
    return () => {
      mounted = false;
    };
  }, [isAdmin, partnerName, userEmail, searchParams, pathname, router]);

  // Handle view mode change for admins
  const handleViewModeChange = (mode: 'all' | 'partner') => {
    const params = new URLSearchParams(searchParams.toString());
    if (mode === 'all') {
      params.set('view', 'all');
      params.delete('partner');
      params.delete('partner_name');
    } else {
      params.set('view', 'partner');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Handle partner selection for admins
  const handlePartnerChange = (partnerId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', 'partner');
    params.set('partner', partnerId);
    const partner = partners.find((item) => item.id === partnerId);
    if (partner?.name) {
      params.set('partner_name', partner.name);
    } else {
      params.delete('partner_name');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Redirect if not logged in
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login");
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
              <SidebarTrigger>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SidebarTrigger>
              {title && (
                <div>
                  <h1 className="text-xl font-bold text-foreground">{title}</h1>
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Admin Controls */}
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                  
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 rounded-lg border p-1">
                    <Button
                      variant={viewMode === 'all' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleViewModeChange('all')}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Todos
                    </Button>
                    <Button
                      variant={viewMode === 'partner' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleViewModeChange('partner')}
                    >
                      <Building2 className="mr-1 h-3 w-3" />
                      Partner
                    </Button>
                  </div>

                  {/* Partner Selector (only when viewing by partner) */}
                  {viewMode === 'partner' && (
                    <Select
                      value={activePartnerId}
                      onValueChange={handlePartnerChange}
                      disabled={loadingPartners || partners.length === 0}
                    >
                      <SelectTrigger className="h-9 w-[200px]">
                        <SelectValue placeholder="Selecciona partner" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              
              {actions && <div className="flex items-center gap-2">{actions}</div>}
              
              <div className="flex items-center gap-3">
                <div className="hidden text-right text-sm md:block">
                  <p className="font-medium text-foreground">
                    {isAdmin && viewMode === 'all' 
                      ? 'Vista Global'
                      : partnerNameFromUrl ??
                        partnerName ??
                        (profile?.partner_id ? "Partner asignado" : "Sin partner")}
                  </p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
                <Button variant="outline" size="sm">
                  Referir ahora
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await signOut();
                    router.replace("/auth/login");
                  }}
                >
                  Cerrar sesión
                </Button>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
