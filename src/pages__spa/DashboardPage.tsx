"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from '@/router-adapter';
import { Users, TrendingUp, Copy, Target, Euro, CheckCircle, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { LeadsChart } from '@/components/dashboard/LeadsChart';
import { DuplicatesChart } from '@/components/dashboard/DuplicatesChart';
import { DuplicatesTrendChart } from '@/components/dashboard/DuplicatesTrendChart';
import { LossReasonsChart } from '@/components/dashboard/LossReasonsChart';
import { LeadStageOverview } from '@/components/leads/LeadStageOverview';
import { LeadsTable, type LeadItem } from '@/components/leads/LeadsTable';
import { apiUrl } from '@/lib/api-base';

type StageOverviewData = {
  total: number;
  countsByStage: Array<{
    stage: string;
    rawStage: string;
    count: number;
    percentage: number;
    shortLabel: string;
    color: string;
  }>;
};

type MetricsResponse = {
  summary: {
    totalLeads: number;
    activeLeads: number;
    lostLeads: number;
    leadsCreated: number;
    leadsContacted: number;
    leadsWon: number;
    duplicatesSame: number;
    duplicatesOther: number;
    conversionRate: number;
    bankSubmissionCount: number;
    bankSubmissionRate: number;
  };
  daily: Array<{ day: string; leads: number; converted: number }>;
  weekly: Array<{ week: string; same: number; other: number }>;
  lossReasons?: Array<{ reason: string; count: number }>;
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageData, setStageData] = useState<StageOverviewData | null>(null);
  const [stageLoading, setStageLoading] = useState(true);
  const [stageError, setStageError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const partnerName = searchParams.get('partner_name');

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      const url = new URL(apiUrl('/api/metrics'));
      if (partnerName) {
        url.searchParams.set('partner_name', partnerName);
      }
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = (await response.json()) as MetricsResponse;
        setMetrics(data);
      }
      setLoading(false);
    };

    void fetchMetrics();
  }, [partnerName]);

  useEffect(() => {
    const fetchLeads = async () => {
      setLeadsLoading(true);
      setLeadsError(null);
      try {
        const url = new URL(apiUrl('/api/leads'));
        if (partnerName) {
          url.searchParams.set('partner_name', partnerName);
        }
        const response = await fetch(url.toString());
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al cargar leads');
        }
        const data = await response.json();
        const raw = data?.leads;
        setLeads(Array.isArray(raw) ? raw : []);
      } catch (e) {
        setLeadsError(e instanceof Error ? e.message : 'Error al cargar leads');
        setLeads([]);
      } finally {
        setLeadsLoading(false);
      }
    };

    void fetchLeads();
  }, [partnerName]);

  useEffect(() => {
    const fetchStages = async () => {
      setStageLoading(true);
      setStageError(null);
      const url = new URL(apiUrl('/api/leads/stages'));
      if (partnerName) url.searchParams.set('partner_name', partnerName);
      url.searchParams.set('active_only', '1');
      const response = await fetch(url.toString());
      if (!response.ok) {
        const data = await response.json();
        setStageError(data.error || 'No se pudieron cargar las etapas');
        setStageData(null);
      } else {
        const data = await response.json();
        setStageData(data);
      }
      setStageLoading(false);
    };
    void fetchStages();
  }, [partnerName]);

  const chartData = useMemo(() => {
    if (!metrics) return [];
    return metrics.daily.map((item) => ({
      date: item.day.slice(5),
      leads: item.leads,
      converted: item.converted,
    }));
  }, [metrics]);

  const handleLeadsRetry = () => {
    setLeadsError(null);
    setLeadsLoading(true);
    const url = new URL(apiUrl('/api/leads'));
    if (partnerName) url.searchParams.set('partner_name', partnerName);
    fetch(url.toString())
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar'))))
      .then((data) => setLeads(Array.isArray(data?.leads) ? data.leads : []))
      .catch((e) => setLeadsError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLeadsLoading(false));
  };

  return (
    <DashboardLayout title="Dashboard" description="Resumen de métricas y actividad">
      <div className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total leads enviados"
            value={metrics?.summary.totalLeads ?? 0}
            icon={<Users className="h-6 w-6" />}
            variant="primary"
          />
          <MetricCard
            title="Activos"
            value={metrics?.summary.activeLeads ?? 0}
            icon={<CheckCircle className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Perdidos"
            value={metrics?.summary.lostLeads ?? 0}
            icon={<XCircle className="h-6 w-6" />}
            variant="destructive"
          />
          <MetricCard
            title="Duplicados mismo partner"
            value={metrics?.summary.duplicatesSame ?? 0}
            icon={<Copy className="h-6 w-6" />}
            variant="warning"
          />
          <MetricCard
            title="Duplicados otros partners"
            value={metrics?.summary.duplicatesOther ?? 0}
            icon={<Copy className="h-6 w-6" />}
            variant="accent"
          />
          <MetricCard
            title="Conversión (30d)"
            value={`${(metrics?.summary.conversionRate ?? 0).toFixed(1)}%`}
            icon={<Target className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Envío a banco"
            value={`${metrics?.summary.bankSubmissionCount ?? 0} (${(metrics?.summary.bankSubmissionRate ?? 0).toFixed(1)}%)`}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="default"
          />
          <MetricCard
            title="Ingresos"
            value="0 EUR"
            icon={<Euro className="h-6 w-6" />}
            variant="default"
          />
        </div>

        {/* Pipeline de Leads (funnel) */}
        <LeadStageOverview
          data={stageData}
          loading={stageLoading}
          error={stageError}
          selectedStage={null}
        />

        {/* Charts Row: misma altura para ambos boxes */}
        <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
          <div className="lg:col-span-2 h-full min-h-[340px]">
            <LeadsChart data={chartData} />
          </div>
          <div className="h-full min-h-[340px]">
            <DuplicatesChart
              samePartner={metrics?.summary.duplicatesSame ?? 0}
              crossPartner={metrics?.summary.duplicatesOther ?? 0}
              sameLabel={partnerName ?? undefined}
            />
          </div>
        </div>

        <LossReasonsChart data={metrics?.lossReasons ?? []} />

        <DuplicatesTrendChart data={metrics?.weekly ?? []} sameLabel={partnerName ?? undefined} />

        <LeadsTable
          leads={leads}
          loading={leadsLoading}
          error={leadsError}
          onRetry={handleLeadsRetry}
          title="Lista de Leads"
        />
        {loading && (
          <p className="text-sm text-muted-foreground">Cargando métricas desde Sheets...</p>
        )}
      </div>
    </DashboardLayout>
  );
}
