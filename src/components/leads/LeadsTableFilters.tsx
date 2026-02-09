"use client";

import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export type OpenClosedFilter = "open" | "closed" | "all";

export interface LeadsTableFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  openClosed: OpenClosedFilter;
  onOpenClosedChange: (value: OpenClosedFilter) => void;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  className?: string;
}

export function LeadsTableFilters({
  searchQuery,
  onSearchChange,
  openClosed,
  onOpenClosedChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  className,
}: LeadsTableFiltersProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-[250px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {(
            [
              { value: "open" as const, label: "Abiertos" },
              { value: "closed" as const, label: "Cerrados" },
              { value: "all" as const, label: "Todos" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onOpenClosedChange(value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                openClosed === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          placeholder="Desde"
        />
        <Input
          type="date"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          placeholder="Hasta"
        />
        <div className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
          <Filter className="h-4 w-4 shrink-0" />
          <span>Rango de fechas (creación)</span>
        </div>
      </div>
    </div>
  );
}
