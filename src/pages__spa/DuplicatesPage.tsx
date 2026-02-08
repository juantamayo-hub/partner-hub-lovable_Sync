"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from '@/router-adapter';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, ExternalLink, CheckCircle, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { DuplicatesChart } from '@/components/dashboard/DuplicatesChart';
import { useAuth } from '@/lib/auth';

type DuplicateItem = {
  id: string;
  rule: string;
  type: 'same_partner' | 'other_partners';
  createdAt: string;
  original: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    partner?: string;
  };
  matched: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    partner?: string;
  };
};

export default function DuplicatesPage() {
  const { isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const partnerName = searchParams.get('partner_name');
  const [duplicates, setDuplicates] = useState<DuplicateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'same_partner' | 'other_partners'>('same_partner');

  useEffect(() => {
    const fetchDuplicates = async () => {
      setLoading(true);
      const url = new URL('/api/duplicates', window.location.origin);
      if (partnerName) {
        url.searchParams.set('partner_name', partnerName);
      }
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setDuplicates(data.duplicates ?? []);
      }
      setLoading(false);
    };

    void fetchDuplicates();
  }, [partnerName]);

  const samePartner = useMemo(
    () => duplicates.filter((dup) => dup.type === 'same_partner'),
    [duplicates]
  );
  const otherPartners = useMemo(
    () => duplicates.filter((dup) => dup.type === 'other_partners'),
    [duplicates]
  );

  const handleReview = (dupId: string) => {
    setReviewedIds((prev) => new Set(prev).add(dupId));
  };

  const exportCsv = (data: DuplicateItem[]) => {
    const header = ['lead_email', 'matched_email', 'rule', 'type', 'created_at'];
    const rows = data.map((dup) => [
      dup.original.email ?? '',
      dup.matched.email ?? '',
      dup.rule,
      dup.type,
      dup.createdAt,
    ]);
    const content = [header, ...rows].map((row) => row.map((value) => `"${value}"`).join(',')).join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'duplicates.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderPartnerName = (partner?: string) => {
    if (!partner) return '-';
    return isAdmin ? partner : 'Otro partner';
  };

  const DuplicatesTable = ({ data }: { data: DuplicateItem[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lead Original</TableHead>
          <TableHead>Lead Duplicado</TableHead>
          <TableHead>Regla</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Fecha</TableHead>
          <TableHead className="w-[120px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((dup) => {
          const reviewed = reviewedIds.has(dup.id);
          return (
            <TableRow key={dup.id}>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {[dup.original.firstName, dup.original.lastName].filter(Boolean).join(' ') || 'Sin nombre'}
                  </div>
                  <div className="text-sm text-muted-foreground">{dup.original.email}</div>
                  <div className="text-xs text-muted-foreground/60">{dup.original.partner}</div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {[dup.matched.firstName, dup.matched.lastName].filter(Boolean).join(' ') || 'Sin nombre'}
                  </div>
                  <div className="text-sm text-muted-foreground">{dup.matched.email}</div>
                  <div className="text-xs text-muted-foreground/60">
                    {dup.type === 'other_partners' ? renderPartnerName(dup.matched.partner) : dup.matched.partner}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{dup.rule}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={dup.type === 'other_partners' ? 'destructive' : 'secondary'}
                  className={dup.type === 'same_partner' ? 'bg-warning/10 text-warning border-warning/20' : ''}
                >
                  {dup.type === 'same_partner' ? (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      Mismo Partner
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Otro Partner
                    </>
                  )}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {format(new Date(dup.createdAt), 'dd MMM yyyy', { locale: es })}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleReview(dup.id)} disabled={reviewed}>
                    {reviewed ? 'Revisado' : 'Marcar'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
        {data.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
              {loading ? 'Cargando duplicados desde Sheets...' : 'No hay duplicados'}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <DashboardLayout
      title="Duplicados"
      description="Detecta y gestiona leads duplicados"
      actions={
        <Button
          variant="outline"
          onClick={() => exportCsv(activeTab === 'same_partner' ? samePartner : otherPartners)}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                    <Copy className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mismo partner</p>
                    <p className="text-2xl font-bold">{samePartner.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Con otros partners</p>
                    <p className="text-2xl font-bold">{otherPartners.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <DuplicatesChart
            samePartner={samePartner.length}
            crossPartner={otherPartners.length}
            sameLabel={partnerName ?? undefined}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Gestión de Duplicados</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="same_partner"
                className="w-full"
                onValueChange={(value) =>
                  setActiveTab(value === 'other_partners' ? 'other_partners' : 'same_partner')
                }
              >
                <TabsList className="mb-4">
                  <TabsTrigger value="same_partner">
                    Dentro del partner ({samePartner.length})
                  </TabsTrigger>
                  <TabsTrigger value="other_partners">
                    Con otros partners ({otherPartners.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="same_partner">
                  <DuplicatesTable data={samePartner} />
                </TabsContent>
                <TabsContent value="other_partners">
                  <DuplicatesTable data={otherPartners} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

