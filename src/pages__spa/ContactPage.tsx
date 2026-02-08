"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { useSearchParams } from "@/router-adapter";

export default function ContactPage() {
  const searchParams = useSearchParams();
  const partnerName = searchParams.get("partner_name") ?? "";
  const defaultSubject = `Consulta Partner Site${partnerName ? ` - ${partnerName}` : ""}`;
  const [subject, setSubject] = useState(defaultSubject);
  useEffect(() => {
    setSubject(defaultSubject);
  }, [defaultSubject]);
  const [message, setMessage] = useState("");

  const mailTo = useMemo(() => {
    const accountManager =
      (typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string> }).env?.VITE_ACCOUNT_MANAGER_EMAIL) ||
      process.env.NEXT_PUBLIC_ACCOUNT_MANAGER_EMAIL ||
      "account@bayteca.com";
    const body = [
      `Partner: ${partnerName || "-"}`,
      "",
      message,
    ].join("\n");
    const params = new URLSearchParams({
      subject,
      body,
    });
    return `mailto:${accountManager}?${params.toString()}`;
  }, [partnerName, subject, message]);

  return (
    <DashboardLayout title="Contáctanos" description="Escribe a tu Account Manager">
      <div className="max-w-2xl">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Contacto con Account Manager</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del correo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                rows={6}
              />
            </div>
            <Button asChild variant="accent">
              <a href={mailTo}>
                <Mail className="mr-2 h-4 w-4" />
                Enviar correo
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

