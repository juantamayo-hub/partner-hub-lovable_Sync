"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Mail, Phone, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LeadsTableFilters, type OpenClosedFilter } from "./LeadsTableFilters";

export type LeadItem = {
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

export interface LeadsTableProps {
  leads: LeadItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  title?: string;
}

export function LeadsTable({
  leads,
  loading = false,
  error = null,
  onRetry,
  title = "Lista de Leads",
}: LeadsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openClosed, setOpenClosed] = useState<OpenClosedFilter>("open");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);

  const filteredLeads = useMemo(() => {
    const list = Array.isArray(leads) ? leads : [];
    return list.filter((lead) => {
      const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
      const matchesSearch =
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.emailRaw ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.phoneRaw ?? "").toLowerCase().includes(searchQuery.toLowerCase());

      // Caso cerrado = tiene loss reason (motivo de cierre)
      const hasLossReason = !!lead.lossReason?.toString().trim();
      const matchesOpenClosed =
        openClosed === "all" ||
        (openClosed === "open" && !hasLossReason) ||
        (openClosed === "closed" && hasLossReason);

      const created = new Date(lead.createdAt).getTime();
      const fromOk = fromDate ? created >= new Date(fromDate).getTime() : true;
      const toOk = toDate ? created <= new Date(toDate + "T23:59:59").getTime() : true;

      return matchesSearch && matchesOpenClosed && fromOk && toOk;
    });
  }, [leads, searchQuery, openClosed, fromDate, toDate]);

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <LeadsTableFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          openClosed={openClosed}
          onOpenClosedChange={setOpenClosed}
          fromDate={fromDate}
          onFromDateChange={setFromDate}
          toDate={toDate}
          onToDateChange={setToDate}
          className="mt-4"
        />
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="py-8 text-center">
            <p className="text-destructive">{error}</p>
            {onRetry && (
              <Button variant="outline" className="mt-4" onClick={onRetry}>
                Reintentar
              </Button>
            )}
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
                {openClosed === "closed" && (
                  <TableHead className="w-[14%]">Motivo cierre</TableHead>
                )}
                <TableHead className="w-[10%]">Duplicado</TableHead>
                <TableHead className="w-[12%] text-right">Fecha</TableHead>
                <TableHead className="w-[4%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => {
                const hasLossReason = !!lead.lossReason?.toString().trim();
                const derivedStatus = hasLossReason ? "inactive" : "active";
                const status = statusConfig[derivedStatus] ?? statusConfig.active;
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
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{lead.emailRaw ?? "-"}</span>
                        </div>
                        {lead.phoneRaw && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{lead.phoneRaw}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="truncate">{lead.source ?? "-"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="space-y-1">
                        <div>{lead.stage ?? "-"}</div>
                        {openClosed !== "closed" && lead.lossReason && (
                          <div className="text-xs text-muted-foreground/70">
                            Motivo: {lead.lossReason}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {openClosed === "closed" && (
                      <TableCell className="text-muted-foreground">
                        <span className="text-sm">{lead.lossReason ?? "-"}</span>
                      </TableCell>
                    )}
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
                  <TableCell
                    colSpan={openClosed === "closed" ? 9 : 8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {loading ? "Cargando leads..." : "No se encontraron leads"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

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
                <span className="font-semibold">Motivo:</span> {selectedLead.lossReason ?? "-"}
              </div>
              <div>
                <span className="font-semibold">Duplicado:</span>{" "}
                {selectedLead.duplicateType === "other_partners"
                  ? "Con otros partners"
                  : selectedLead.duplicateType === "same_partner"
                    ? "Mismo partner"
                    : "No"}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
