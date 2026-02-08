"use client";

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Building2, 
  Bell, 
  Shield, 
  Key,
  Save,
  Upload
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Demo audit events
const auditEvents = [
  { id: '1', event_type: 'login', description: 'Inicio de sesión exitoso', created_at: '2024-02-12T10:30:00Z' },
  { id: '2', event_type: 'sync', description: 'Sincronización de Google Sheets completada', created_at: '2024-02-11T14:22:00Z' },
  { id: '3', event_type: 'settings', description: 'Configuración de notificaciones actualizada', created_at: '2024-02-10T09:15:00Z' },
  { id: '4', event_type: 'login', description: 'Inicio de sesión exitoso', created_at: '2024-02-09T16:45:00Z' },
  { id: '5', event_type: 'sync', description: 'Error en sincronización', created_at: '2024-02-08T11:00:00Z' },
];

const getEventBadge = (type: string) => {
  switch (type) {
    case 'login':
      return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Login</Badge>;
    case 'sync':
      return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">Sync</Badge>;
    case 'settings':
      return <Badge variant="outline" className="bg-info/10 text-info border-info/20">Ajustes</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

export default function SettingsPage() {
  const { profile, user, roles } = useAuth();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <DashboardLayout 
      title="Ajustes"
      description="Configura tu cuenta y preferencias"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Partner</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificaciones</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Seguridad</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Actualiza tu información de perfil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {getInitials(profile?.full_name || user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Cambiar foto
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      JPG, PNG o GIF. Máximo 2MB.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input id="name" defaultValue={profile?.full_name || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Información del Partner</CardTitle>
                <CardDescription>Datos de tu organización partner</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nombre del Partner</Label>
                    <Input id="company-name" defaultValue="Partner Alpha" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-id">ID del Partner</Label>
                    <Input id="company-id" defaultValue="partner_alpha_001" disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Roles asignados</Label>
                  <div className="flex gap-2">
                    {roles.map((role) => (
                      <Badge key={role} variant="secondary" className="capitalize">
                        {role === 'admin' ? 'Administrador' : role === 'partner_manager' ? 'Gestor' : 'Visor'}
                      </Badge>
                    ))}
                    {roles.length === 0 && (
                      <Badge variant="outline">Sin roles</Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Preferencias de Notificaciones</CardTitle>
                <CardDescription>Configura cómo quieres recibir notificaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Nuevos leads</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe notificaciones cuando lleguen nuevos leads
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Duplicados detectados</Label>
                      <p className="text-sm text-muted-foreground">
                        Alerta cuando se detecten leads duplicados
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Sincronizaciones</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificaciones sobre el estado de las sincronizaciones
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Resumen semanal</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe un resumen semanal por email
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Seguridad de la Cuenta</CardTitle>
                  <CardDescription>Gestiona tu contraseña y seguridad</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Key className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Cambiar contraseña</p>
                        <p className="text-sm text-muted-foreground">
                          Actualiza tu contraseña regularmente
                        </p>
                      </div>
                    </div>
                    <Button variant="outline">Cambiar</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Registro de Actividad</CardTitle>
                  <CardDescription>Historial de eventos de tu cuenta</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auditEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          {getEventBadge(event.event_type)}
                          <span className="text-sm">{event.description}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(event.created_at), 'dd MMM, HH:mm', { locale: es })}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
}
