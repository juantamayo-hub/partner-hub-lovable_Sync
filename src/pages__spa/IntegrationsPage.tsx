"use client";

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Sheet, 
  FileSpreadsheet, 
  Database, 
  Plus, 
  RefreshCcw, 
  Settings2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

// Demo data
const integrations = [
  {
    id: '1',
    name: 'Google Sheets - Leads Q1',
    type: 'google_sheets',
    status: 'active',
    last_sync_at: '2024-02-12T10:30:00Z',
    config: { spreadsheet_id: '1abc...xyz', sheet_name: 'Leads' },
  },
  {
    id: '2',
    name: 'Google Sheets - Campañas',
    type: 'google_sheets',
    status: 'active',
    last_sync_at: '2024-02-11T14:22:00Z',
    config: { spreadsheet_id: '2def...uvw', sheet_name: 'Campañas 2024' },
  },
  {
    id: '3',
    name: 'CRM Export',
    type: 'google_sheets',
    status: 'inactive',
    last_sync_at: '2024-01-15T09:15:00Z',
    config: { spreadsheet_id: '3ghi...rst', sheet_name: 'Export' },
  },
];

const syncHistory = [
  { id: '1', integration: 'Google Sheets - Leads Q1', status: 'success', records: 45, created_at: '2024-02-12T10:30:00Z' },
  { id: '2', integration: 'Google Sheets - Campañas', status: 'success', records: 23, created_at: '2024-02-11T14:22:00Z' },
  { id: '3', integration: 'Google Sheets - Leads Q1', status: 'error', records: 0, created_at: '2024-02-10T08:00:00Z' },
  { id: '4', integration: 'CRM Export', status: 'success', records: 128, created_at: '2024-01-15T09:15:00Z' },
];

const getIntegrationIcon = (type: string) => {
  switch (type) {
    case 'google_sheets':
      return <FileSpreadsheet className="h-5 w-5" />;
    default:
      return <Database className="h-5 w-5" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-success/10 text-success border-success/20">Activo</Badge>;
    case 'inactive':
      return <Badge variant="secondary">Inactivo</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getSyncStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function IntegrationsPage() {
  return (
    <DashboardLayout 
      title="Integraciones"
      description="Conecta fuentes de datos externas"
      actions={
        <Button variant="accent">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Integración
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Integrations Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="shadow-soft transition-all hover:shadow-soft-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {getIntegrationIcon(integration.type)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {integration.type === 'google_sheets' ? 'Google Sheets' : integration.type}
                        </CardDescription>
                      </div>
                    </div>
                    <Switch checked={integration.status === 'active'} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {integration.last_sync_at ? (
                        <>
                          Última sync: {format(new Date(integration.last_sync_at), 'dd MMM, HH:mm', { locale: es })}
                        </>
                      ) : (
                        'Sin sincronizar'
                      )}
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                      Sincronizar
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Add New Integration Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: integrations.length * 0.1 }}
          >
            <Card className="flex h-full min-h-[200px] cursor-pointer items-center justify-center border-2 border-dashed shadow-none transition-all hover:border-primary/50 hover:bg-primary/5">
              <CardContent className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">Añadir integración</p>
                <p className="text-sm text-muted-foreground/60">Google Sheets, CSV...</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sync History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Historial de Sincronización</CardTitle>
              <CardDescription>Últimas sincronizaciones realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {syncHistory.map((sync) => (
                  <div
                    key={sync.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      {getSyncStatusIcon(sync.status)}
                      <div>
                        <p className="font-medium">{sync.integration}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(sync.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {sync.status === 'success' ? `${sync.records} registros` : 'Error'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sync.status === 'success' ? 'Sincronizado' : 'Fallido'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
