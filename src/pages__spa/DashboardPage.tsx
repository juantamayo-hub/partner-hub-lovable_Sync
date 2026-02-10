"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from '@/router-adapter';
import { Users, TrendingUp, Copy, Target, Euro, CheckCircle, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { LeadsChart } from '@/components/dashboard/LeadsChart';
import { LossReasonsChart } from '@/components/dashboard/LossReasonsChart';
import { LeadStageOverview } from '@/components/leads/LeadStageOverview';
import { LeadsTable, type LeadItem } from '@/components/leads/LeadsTable';
import { apiUrl } from '@/lib/api-base';
import { TimeFilter, type TimePeriod } from '@/components/dashboard/TimeFilter';
import { DuplicatesChart } from '@/components/dashboard/DuplicatesChart';

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
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('mensual');
  const searchParams = useSearchParams();

  const partnerName = searchParams.get('partner_name');

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      const url = new URL(apiUrl('/api/metrics'));
      if (partnerName) {
        url.searchParams.set('partner_name', partnerName);
      }
      url.searchParams.set('period', timePeriod);
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = (await response.json()) as MetricsResponse;
        setMetrics(data);
      }
      setLoading(false);
    };

    void fetchMetrics();
  }, [partnerName, timePeriod]);

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

  // Filtrado de datos basado en el timePeriod y "createdAt" (Deal created)
  const filteredData = useMemo(() => {
    if (!leads) return { leads: [], metrics: metrics?.summary, chartData: [] };

    const now = new Date();
    const filteredLeads = leads.filter((lead) => {
      const created = new Date(lead.createdAt);
      if (timePeriod === 'diario') {
        return created.toDateString() === now.toDateString();
      }
      if (timePeriod === 'semanal') {
        const lastWeek = new Date();
        lastWeek.setDate(now.getDate() - 7);
        return created >= lastWeek;
      }
      if (timePeriod === 'mensual') {
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }
      if (timePeriod === 'anual') {
        return created.getFullYear() === now.getFullYear();
      }
      return true;
    });

    // Recalcular métricas básicas para la vista filtrada si los datos locales lo permiten
    // Nota: El backend ya devuelve métricas, pero aquí las ajustamos al periodo seleccionado
    // si estamos filtrando localmente sobre la lista completa de leads.
    const totalLeads = filteredLeads.length;
    const activeLeads = filteredLeads.filter(l => !l.lossReason).length;
    const lostLeads = filteredLeads.filter(l => !!l.lossReason).length;
    const duplicatesSame = filteredLeads.filter(l => l.duplicateType === 'same_partner').length;
    const duplicatesOther = filteredLeads.filter(l => l.duplicateType === 'other_partners').length;

    // Chart data agregation (daily for the selected period)
    const dailyMap: Record<string, { leads: number, converted: number }> = {};
    filteredLeads.forEach(lead => {
      const dateKey = lead.createdAt.slice(0, 10); // YYYY-MM-DD
      if (!dailyMap[dateKey]) dailyMap[dateKey] = { leads: 0, converted: 0 };
      dailyMap[dateKey].leads++;
      if (lead.stage === 'Won' || lead.stage === 'Ganado') dailyMap[dateKey].converted++;
    });

    const chartData = Object.entries(dailyMap)
      .map(([date, counts]) => ({ date: date.slice(5), ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      leads: filteredLeads,
      summary: {
        totalLeads,
        activeLeads,
        lostLeads,
        duplicatesSame,
        duplicatesOther,
        conversionRate: totalLeads > 0 ? (filteredLeads.filter(l => l.stage === 'Won').length / totalLeads) * 100 : 0
      },
      chartData
    };
  }, [leads, timePeriod, metrics]);

  // Rest of the component uses filteredData.summary and filteredData.chartData

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
    <DashboardLayout
      title="Página principal"
      description="Resumen de métricas y actividad"
      actions={<TimeFilter value={timePeriod} onChange={setTimePeriod} />}
    >
      <div className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Total leads enviados"
            value={filteredData.summary?.totalLeads ?? 0}
            icon={<Users className="h-6 w-6" />}
            variant="primary"
          />
          <MetricCard
            title="Activos"
            value={filteredData.summary?.activeLeads ?? 0}
            icon={<CheckCircle className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Perdidos"
            value={filteredData.summary?.lostLeads ?? 0}
            icon={<XCircle className="h-6 w-6" />}
            variant="destructive"
          />
          <MetricCard
            title="Conversión (Periodo)"
            value={`${(filteredData.summary?.conversionRate ?? 0).toFixed(1)}%`}
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

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-full min-h-[340px]">
            <LeadsChart data={filteredData.chartData} />
          </div>
          <div className="h-full min-h-[340px]">
            <DuplicatesChart
              samePartner={filteredData.summary?.duplicatesSame ?? 0}
              crossPartner={filteredData.summary?.duplicatesOther ?? 0}
            />
          </div>
        </div>

        <LossReasonsChart data={metrics?.lossReasons ?? []} />

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
