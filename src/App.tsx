import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { LoginPage } from "@/auth-pages/LoginPage";
import { ForgotPasswordPage } from "@/auth-pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/auth-pages/ResetPasswordPage";
import DashboardPage from "@/pages__spa/DashboardPage";
import LeadsPage from "@/pages__spa/LeadsPage";
import DuplicatesPage from "@/pages__spa/DuplicatesPage";
import ContactPage from "@/pages__spa/ContactPage";
import IntegrationsPage from "@/pages__spa/IntegrationsPage";
import ResourceHubPage from "@/pages__spa/ResourceHubPage";
import SettingsPage from "@/pages__spa/SettingsPage";

function HomeRedirect() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate("/app", { replace: true });
    } else {
      navigate("/auth/login", { replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset" element={<ResetPasswordPage />} />
      <Route path="/app" element={<DashboardPage />} />
      <Route path="/app/leads" element={<LeadsPage />} />
      <Route path="/app/duplicates" element={<DuplicatesPage />} />
      <Route path="/app/contact" element={<ContactPage />} />
      <Route path="/app/integrations" element={<IntegrationsPage />} />
      <Route path="/app/resource-hub" element={<ResourceHubPage />} />
      <Route path="/app/settings" element={<SettingsPage />} />
    </Routes>
  );
}
