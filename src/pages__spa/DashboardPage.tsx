"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from '@/router-adapter';
import { Users, TrendingUp, Copy, Target, Euro, CheckCircle, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { LeadsChart } from '@/components/dashboard/LeadsChart';
import { DuplicatesChart } from '@/components/dashboard/DuplicatesChart';
import { RecentLeadsTable } from '@/components/dashboard/RecentLeadsTable';
import { DuplicatesTrendChart } from '@/components/dashboard/DuplicatesTrendChart';
import { LossReasonsChart } from '@/components/dashboard/LossReasonsChart';
import { LeadStageOverview } from '@/components/leads/LeadStageOverview';
import { apiUrl } from '@/lib/api-base';

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

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [leads, setLeads] = useState<Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    emailRaw?: string;
    source?: string;
    status?: string;
    createdAt: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [stageData, setStageData] = useState<StageOverviewData | null>(null);
  const [stageLoading, setStageLoading] = useState(true);
  const [stageError, setStageError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const partnerName = searchParams.get('partner_name');
  const viewMode = searchParams.get('view') ?? 'partner';

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
      const url = new URL(apiUrl('/api/leads'));
      if (partnerName) {
        url.searchParams.set('partner_name', partnerName);
      }
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads ?? []);
      }
    };

    void fetchLeads();
  }, [partnerName]);

  useEffect(() => {
    const fetchStages = async () => {
      setStageLoading(true);
      setStageError(null);
      const url = new URL(apiUrl('/api/leads/stages'));
      if (partnerName) {
        url.searchParams.set('partner_name', partnerName);
      }
      url.searchParams.set('active_only', '1');
      const response = await fetch(url.toString());
      if (!response.ok) {
        const data = await response.json();
        setStageError(data.error || 'No se pudieron cargar las etapas');
        setStageData(null);
        setStageLoading(false);
        return;
      }
      const data = await response.json();
      setStageData(data);
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

  const recentLeads = useMemo(() => {
    return [...leads]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((lead) => ({
        id: lead.id,
        full_name: [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Sin nombre',
        email: lead.emailRaw ?? '-',
        source: lead.source ?? '-',
        status: lead.status ?? 'new',
        created_at: lead.createdAt,
      }));
  }, [leads]);

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

        <LeadStageOverview
          data={stageData}
          loading={stageLoading}
          error={stageError}
          selectedStage={null}
        />

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LeadsChart data={chartData} />
          </div>
          <DuplicatesChart
            samePartner={metrics?.summary.duplicatesSame ?? 0}
            crossPartner={metrics?.summary.duplicatesOther ?? 0}
            sameLabel={partnerName ?? undefined}
          />
        </div>

        <LossReasonsChart data={metrics?.lossReasons ?? []} />

        <DuplicatesTrendChart data={metrics?.weekly ?? []} sameLabel={partnerName ?? undefined} />

        {/* Recent Leads Table */}
        <RecentLeadsTable leads={recentLeads} />
        {loading && (
          <p className="text-sm text-muted-foreground">Cargando métricas desde Sheets...</p>
        )}
      </div>
    </DashboardLayout>
  );
}
