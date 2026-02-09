"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Users, TrendingUp, ArrowRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Types matching the server-side stage normalization
 */
type StageCount = {
  stage: string;
  rawStage: string;
  count: number;
  percentage: number;
  shortLabel: string;
  color: string;
};

type StageOverviewData = {
  total: number;
  countsByStage: StageCount[];
};

interface LeadStageOverviewProps {
  data: StageOverviewData | null;
  loading?: boolean;
  error?: string | null;
  selectedStage?: string | null;
  onStageSelect?: (stage: string | null) => void;
}

/**
 * LeadStageOverview - Visual pipeline/funnel representation of leads by stage
 * 
 * Displays:
 * - Total leads count
 * - Pipeline strip with stage cards
 * - Funnel visualization
 * - Interactive stage filtering
 */
export function LeadStageOverview({
  data,
  loading = false,
  error = null,
  selectedStage = null,
  onStageSelect,
}: LeadStageOverviewProps) {
  // Show all stages, including empty ones
  const activeStages = useMemo(() => {
    if (!data) return [];
    return data.countsByStage;
  }, [data]);

  // Calculate max count for proportional bar sizing
  const maxCount = useMemo(() => {
    if (!activeStages.length) return 1;
    return Math.max(...activeStages.map((s) => s.count));
  }, [activeStages]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <span className="font-medium">Error al cargar etapas:</span>
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
            <Users className="h-12 w-12 opacity-50" />
            <p className="font-medium">No hay datos disponibles</p>
            <p className="text-sm">Vuelve a intentar cuando la hoja esté disponible.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Header with total */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Pipeline de Leads</h3>
            <p className="text-sm text-muted-foreground">
              {data.total} leads en {activeStages.length} etapas
            </p>
          </div>
        </div>
        {selectedStage && (
          <Badge
            variant="secondary"
            className="cursor-pointer gap-1"
            onClick={() => onStageSelect?.(null)}
          >
            <Filter className="h-3 w-3" />
            {selectedStage}
            <span className="ml-1 text-xs">×</span>
          </Badge>
        )}
      </div>

      {/* Pipeline Strip - Horizontal kanban-style view */}
      <Card className="overflow-hidden shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Leads activos
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-wrap items-stretch gap-2">
            {activeStages.map((stage, index) => (
              <StageCard
                key={stage.stage}
                stage={stage}
                maxCount={maxCount}
                isLast={index === activeStages.length - 1}
                isSelected={selectedStage === stage.stage}
                onSelect={() =>
                  onStageSelect?.(selectedStage === stage.stage ? null : stage.stage)
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Individual stage card in the pipeline strip
 */
function StageCard({
  stage,
  maxCount,
  isLast,
  isSelected,
  onSelect,
}: {
  stage: StageCount;
  maxCount: number;
  isLast: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const barWidth = (stage.count / maxCount) * 100;

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={onSelect}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative flex min-w-[90px] flex-1 basis-[120px] flex-col items-center rounded-lg border p-3 text-center transition-all",
              "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border bg-card hover:border-primary/30"
            )}
          >
            <span className="text-2xl font-bold" style={{ color: stage.color }}>
              {stage.count}
            </span>
            <span className="mt-1 text-xs font-medium text-muted-foreground line-clamp-2">
              {stage.shortLabel}
            </span>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="h-full rounded-full"
                style={{ backgroundColor: stage.color }}
              />
            </div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">{stage.stage}</p>
            <p className="text-muted-foreground">
              {stage.count} leads ({stage.percentage.toFixed(1)}%)
            </p>
            {stage.rawStage !== stage.stage && (
              <p className="mt-1 text-xs text-muted-foreground/70">
                Campo original: {stage.rawStage}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
      {!isLast && (
        <ArrowRight className="hidden h-4 w-4 flex-shrink-0 text-muted-foreground/40 sm:block" />
      )}
    </div>
  );
}

/**
 * Loading skeleton for the stage overview
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 flex-1 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
