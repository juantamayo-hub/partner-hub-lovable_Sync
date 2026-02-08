"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, HelpCircle, BarChart3 } from "lucide-react";

const sections = [
  {
    title: "Promotional material",
    description: "Logos, pitch decks y plantillas de campaña.",
    icon: FileText,
  },
  {
    title: "FAQs",
    description: "Respuestas rápidas para partners y clientes.",
    icon: HelpCircle,
  },
  {
    title: "NPS",
    description: "Resultados y guías para seguimiento de NPS.",
    icon: BarChart3,
  },
];

export default function ResourceHubPage() {
  return (
    <DashboardLayout title="Resource Hub" description="Materiales y recursos para partners">
      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.title} className="shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <section.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    Próximamente
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {section.description}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

