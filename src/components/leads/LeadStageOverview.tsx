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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Estados del Pipeline</h3>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
            Vista Proporcional del Pipeline
          </p>
        </div>
      </div>

      {/* Horizontal Proportional Funnel List */}
      <div className="space-y-1 py-4 max-w-4xl mx-auto">
        {activeStages.map((stage, index) => {
          const isSelected = selectedStage === stage.stage;
          const percentageOfTotal = (stage.count / data.total) * 100;

          // Width of the "White Track" narrows gradually (funnel silhouette)
          const trackWidth = 100 - (index * 7);

          // Fill width is proportional to lead volume relative to max (usually first stage)
          const fillWidth = (stage.count / maxCount) * 100;

          return (
            <motion.div
              key={stage.stage}
              className={cn(
                "grid grid-cols-[140px_1fr_100px] items-center gap-6 py-2 px-4 rounded-xl transition-all duration-200 cursor-pointer group",
                isSelected ? "bg-emerald-50/50 shadow-sm border border-emerald-100/50" : "hover:bg-slate-50"
              )}
              onClick={() => onStageSelect?.(isSelected ? null : stage.stage)}
              whileHover={{ x: 4 }}
            >
              {/* Left: Stage Name & Icon */}
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: stage.color || '#064e3b' }} />
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-tight truncate",
                  isSelected ? "text-emerald-700" : "text-slate-500"
                )}>
                  {stage.stage}
                </span>
              </div>

              {/* Center: Proportional Bar with Narrowing Track */}
              <div className="flex justify-center h-2 w-full relative">
                <div
                  className="h-full bg-slate-100/80 rounded-full flex justify-center items-center relative transition-all duration-700 ease-out"
                  style={{ width: `${trackWidth}%` }}
                >
                  {/* The Green Fill */}
                  <div
                    className="h-full bg-[#064e3b] rounded-full shadow-sm absolute inset-y-0 left-1/2 -translate-x-1/2"
                    style={{ width: `${(stage.count / (maxCount || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Right: Metrics */}
              <div className="text-right flex items-baseline justify-end gap-2">
                <span className={cn(
                  "text-sm font-bold",
                  isSelected ? "text-emerald-700" : "text-slate-700"
                )}>
                  {stage.count}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  ({percentageOfTotal.toFixed(1)}%)
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

    </motion.div>
  );
}

/**
 * Loading skeleton for the new step-based overview
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b pb-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
