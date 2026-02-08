"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "@/router-adapter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LeadStageOverview } from "@/components/leads/LeadStageOverview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Filter, MoreHorizontal, Mail, Phone, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Lead type from the API response.
 * Contains raw values from Google Sheets plus computed fields.
 */
type LeadItem = {
  id: string;
  firstName?: string;
  lastName?: string;
  emailRaw?: string;
  phoneRaw?: string;
  status?: string;
  stage?: string;
  source?: string;
  createdAt: string;
  duplicateType?: "same_partner" | "other_partners" | null;
  lossReason?: string;
};

/**
 * Stage overview data from /api/leads/stages
 */
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

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
> = {
  active: {
    label: "Activo",
    variant: "outline",
    className: "bg-success/10 text-success border-success/20",
  },
  inactive: { label: "Inactivo", variant: "destructive" },
};

export default function LeadsPage() {
  const searchParams = useSearchParams();
  const partnerName = searchParams.get("partner_name");
  const viewMode = searchParams.get("view") ?? "partner";

  // Leads state
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  // Stage overview state
  const [stageData, setStageData] = useState<StageOverviewData | null>(null);
  const [stageLoading, setStageLoading] = useState(true);
  const [stageError, setStageError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [onlyDuplicates, setOnlyDuplicates] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Detail dialog
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);

  /**
   * Fetch leads from API
   */
  const fetchLeads = async () => {
    setLeadsLoading(true);
    setLeadsError(null);
    try {
      const url = new URL("/api/leads", window.location.origin);
      if (partnerName) {
        url.searchParams.set("partner_name", partnerName);
      }
      const response = await fetch(url.toString());
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch leads");
      }
      const data = await response.json();
      setLeads(data.leads ?? []);
    } catch (error) {
      setLeadsError(error instanceof Error ? error.message : "Unknown error");
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  };

  /**
   * Fetch stage overview data from API
   */
  const fetchStageData = async () => {
    setStageLoading(true);
    setStageError(null);
    try {
      const url = new URL("/api/leads/stages", window.location.origin);
      if (partnerName) {
        url.searchParams.set("partner_name", partnerName);
      }
      url.searchParams.set("active_only", "1");
      const response = await fetch(url.toString());
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch stages");
      }
      const data = await response.json();
      setStageData(data);
    } catch (error) {
      setStageError(error instanceof Error ? error.message : "Unknown error");
      setStageData(null);
    } finally {
      setStageLoading(false);
    }
  };

  // Fetch data on mount and when partner changes
  useEffect(() => {
    void fetchLeads();
    void fetchStageData();
  }, [partnerName]);

  /**
   * Filter leads based on all active filters
   */
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ");

      // Text search
      const matchesSearch =
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.emailRaw ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.phoneRaw ?? "").toLowerCase().includes(searchQuery.toLowerCase());

      const derivedStatus = lead.lossReason?.toString().trim() ? "inactive" : "active";

      // Status filter
      const matchesStatus = statusFilter === "all" || derivedStatus === statusFilter;

      // Duplicates filter
      const matchesDuplicates = !onlyDuplicates || !!lead.duplicateType;

      // Date filters
      const created = new Date(lead.createdAt).getTime();
      const fromOk = fromDate ? created >= new Date(fromDate).getTime() : true;
      const toOk = toDate ? created <= new Date(toDate).getTime() : true;

      return matchesSearch && matchesStatus && matchesDuplicates && fromOk && toOk;
    });
  }, [leads, searchQuery, statusFilter, onlyDuplicates, fromDate, toDate]);

  const recentClosed = useMemo(() => {
    return [...leads]
      .filter((lead) => lead.lossReason?.toString().trim())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [leads]);

  /**
   * Refresh all data
   */
  const handleRefresh = () => {
    void fetchLeads();
    void fetchStageData();
  };

  return (
    <DashboardLayout
      title="Leads"
      description={partnerName ? `Leads de ${partnerName}` : "Gestiona todos tus leads"}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="accent">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Lead
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Active cases by funnel step */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LeadStageOverview
            data={stageData}
            loading={stageLoading}
            error={stageError}
            selectedStage={null}
          />
        </motion.div>

        {/* Recently closed cases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Casos cerrados recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentClosed.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay casos cerrados.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="text-right">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentClosed.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          {[lead.firstName, lead.lastName].filter(Boolean).join(" ") ||
                            "Sin nombre"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {lead.stage ?? "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {lead.lossReason ?? "-"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {format(new Date(lead.createdAt), "dd MMM yyyy", { locale: es })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Leads Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-lg font-semibold">
                  Lista de Leads
                </CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar leads..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 sm:w-[250px]"
                    />
                  </div>
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Sólo duplicados</span>
                    <Switch checked={onlyDuplicates} onCheckedChange={setOnlyDuplicates} />
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholder="Desde"
                />
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholder="Hasta"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {leadsError ? (
                <div className="py-8 text-center">
                  <p className="text-destructive">{leadsError}</p>
                  <Button variant="outline" className="mt-4" onClick={handleRefresh}>
                    Reintentar
                  </Button>
                </div>
              ) : (
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[18%]">Nombre</TableHead>
                      <TableHead className="w-[20%]">Contacto</TableHead>
                      <TableHead className="w-[14%]">Fuente</TableHead>
                      <TableHead className="w-[10%]">Estado</TableHead>
                      <TableHead className="w-[12%]">Etapa</TableHead>
                      <TableHead className="w-[10%]">Duplicado</TableHead>
                      <TableHead className="w-[12%] text-right">Fecha</TableHead>
                      <TableHead className="w-[4%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => {
                      const derivedStatus = lead.lossReason?.toString().trim() ? "inactive" : "active";
                      const status = statusConfig[derivedStatus] || statusConfig.active;
                      const fullName =
                        [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Sin nombre";
                      const duplicateLabel =
                        lead.duplicateType === "other_partners"
                          ? "Otro partner"
                          : lead.duplicateType === "same_partner"
                            ? "Mismo partner"
                            : null;
                      return (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div className="truncate font-medium">{fullName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Mail className="h-3.5 w-3.5" />
                              <span className="truncate">{lead.emailRaw ?? "-"}</span>
                            </div>
                              {lead.phoneRaw && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              <span className="truncate">{lead.phoneRaw}</span>
                            </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <span className="truncate">{lead.source || "-"}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className={status.className}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="space-y-1">
                              <div>{lead.stage ?? "-"}</div>
                              {lead.lossReason && (
                                <div className="text-xs text-muted-foreground/70">
                                  Motivo: {lead.lossReason}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {duplicateLabel ? (
                              <Badge variant="outline">{duplicateLabel}</Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {format(new Date(lead.createdAt), "dd MMM yyyy", { locale: es })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedLead(lead)}>
                                  Ver detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredLeads.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          {leadsLoading
                            ? "Cargando leads desde Sheets..."
                            : "No se encontraron leads"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del lead</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold">Nombre:</span>{" "}
                {[selectedLead.firstName, selectedLead.lastName].filter(Boolean).join(" ") ||
                  "Sin nombre"}
              </div>
              <div>
                <span className="font-semibold">Email:</span> {selectedLead.emailRaw ?? "-"}
              </div>
              <div>
                <span className="font-semibold">Teléfono:</span> {selectedLead.phoneRaw ?? "-"}
              </div>
              <div>
                <span className="font-semibold">Estado:</span>{" "}
                {selectedLead.lossReason?.toString().trim() ? "Inactivo" : "Activo"}
              </div>
              <div>
                <span className="font-semibold">Etapa:</span> {selectedLead.stage ?? "-"}
              </div>
              <div>
                <span className="font-semibold">Motivo:</span>{" "}
                {selectedLead.lossReason ?? "-"}
              </div>
              <div>
                <span className="font-semibold">Duplicado:</span>{" "}
                {selectedLead.duplicateType === "other_partners"
                  ? "Con otros partners"
                  : selectedLead.duplicateType === "same_partner"
                    ? "Mismo partner"
                    : "No"}
              </div>
              <div className="rounded-md border bg-muted/30 p-3 text-muted-foreground">
                Historial de eventos y matches de duplicados se habilitará al sincronizar con la
                base de datos.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
