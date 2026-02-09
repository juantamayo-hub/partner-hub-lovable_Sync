import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, Shield, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api-base";

const loginSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

const registerSchema = z
  .object({
    email: z.string().email("Email inválido").max(255),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[a-z]/, "Debe contener al menos una minúscula")
      .regex(/[0-9]/, "Debe contener al menos un número")
      .regex(/[^A-Za-z0-9]/, "Debe contener al menos un símbolo"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminEmail, setIsAdminEmail] = useState(false);
  const [adminMode, setAdminMode] = useState<"all" | "specific">("all");
  const [partnerInput, setPartnerInput] = useState("");
  const [partners, setPartners] = useState<string[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const emailValue = useMemo(
    () => loginForm.watch("email") || registerForm.watch("email"),
    [loginForm, registerForm]
  );

  const checkAdmin = async (email: string) => {
    try {
      const response = await fetch(apiUrl(`/api/users/allowed?email=${encodeURIComponent(email)}`));
      if (!response.ok) {
        setIsAdminEmail(false);
        return;
      }
      const data = await response.json();
      setIsAdminEmail(data?.role === "admin");
    } catch {
      setIsAdminEmail(false);
    }
  };

  useEffect(() => {
    const trimmed = emailValue?.trim();
    if (!trimmed) {
      setIsAdminEmail(false);
      return;
    }
    const timer = setTimeout(() => {
      void checkAdmin(trimmed);
    }, 300);
    return () => clearTimeout(timer);
  }, [emailValue]);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    let allowedData: { allowed?: boolean; role?: string } | null = null;
    try {
      const allowedResponse = await fetch(apiUrl(`/api/users/allowed?email=${encodeURIComponent(data.email)}`));
      allowedData = await allowedResponse.json();
    } catch (e) {
      setIsLoading(false);
      console.error("Error al comprobar autorización:", e);
      toast.error(
        "No se pudo conectar con el servidor. Comprueba que la URL del backend (VITE_API_BASE_URL) esté configurada en Lovable y que la API permita CORS."
      );
      return;
    }
    if (!allowedData?.allowed) {
      setIsLoading(false);
      toast.error("Tu email no está autorizado. Contacta al administrador.");
      return;
    }

    const isAdmin = allowedData.role === "admin";
    setIsAdminEmail(isAdmin);

    if (isAdmin && adminMode === "specific" && !partnerInput.trim()) {
      setIsLoading(false);
      toast.error("Selecciona un partner para filtrar.");
      return;
    }

    const baseUrl = `${window.location.origin}/app`;
    const redirectUrl =
      isAdmin && adminMode === "specific" && partnerInput.trim()
        ? `${baseUrl}?partner_name=${encodeURIComponent(partnerInput.trim())}`
        : baseUrl;

    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Credenciales inválidas. ¿Necesitas crear una contraseña?");
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Por favor, confirma tu email antes de iniciar sesión.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    void fetch(apiUrl("/api/users/log"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    }).catch(() => {});

    window.location.href = redirectUrl;
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    let allowedData: { allowed?: boolean; role?: string } | null = null;
    try {
      const allowedResponse = await fetch(apiUrl(`/api/users/allowed?email=${encodeURIComponent(data.email)}`));
      allowedData = await allowedResponse.json();
    } catch (e) {
      setIsLoading(false);
      console.error("Error al comprobar autorización:", e);
      toast.error(
        "No se pudo conectar con el servidor. Comprueba que la URL del backend (VITE_API_BASE_URL) esté configurada en Lovable y que la API permita CORS."
      );
      return;
    }
    if (!allowedData?.allowed) {
      setIsLoading(false);
      toast.error("Tu email no está autorizado. Contacta al administrador.");
      return;
    }

    const { error } = await signUp(data.email, data.password, data.email.split("@")[0]);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("Este email ya está registrado. Inicia sesión o recupera tu contraseña.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Cuenta creada. Revisa tu email para confirmar tu cuenta.");
  };

  useEffect(() => {
    if (!isAdminEmail || adminMode !== "specific") return;
    let mounted = true;

    const loadPartners = async () => {
      setPartnersLoading(true);
      try {
        const response = await fetch(apiUrl("/api/users/partners"));
        if (!response.ok) {
          if (mounted) setPartners([]);
          return;
        }
        const data = await response.json();
        if (mounted) {
          setPartners(data.partners ?? []);
        }
      } catch {
        if (mounted) setPartners([]);
      } finally {
        if (mounted) setPartnersLoading(false);
      }
    };

    void loadPartners();
    return () => {
      mounted = false;
    };
  }, [adminMode, isAdminEmail]);

  return (
    <div className="flex min-h-screen">
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "var(--gradient-dark)" }}
      >
        <div className="space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold leading-tight text-white"
          >
            Portal de Partners
            <br />
            <span className="text-sidebar-primary">unificado y seguro</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md text-lg text-white/70"
          >
            Gestiona tus leads, detecta duplicados y sincroniza datos con integraciones externas
            desde un solo lugar.
          </motion.p>
        </div>
        <p className="text-sm text-white/40">© 2026 Partner Site. Todos los derechos reservados.</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <div className="flex items-center justify-center">
          <img src="/logo-green.svg" alt="Bayteca" className="h-16 w-auto max-w-[220px] object-contain" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-soft-lg border-0">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Acceso</CardTitle>
              <CardDescription>Accede con contraseña o crea una nueva.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                  <TabsTrigger value="register">Crear contraseña</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Contraseña</Label>
                        <Link to="/auth/forgot" className="text-sm font-medium text-primary hover:underline">
                          ¿Olvidaste tu contraseña?
                        </Link>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...loginForm.register("password")}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    {isAdminEmail && (
                      <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-primary">Acceso Administrador</span>
                          <Badge variant="outline" className="ml-auto border-primary/30 text-primary text-xs">
                            Admin
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={adminMode === "all" ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setAdminMode("all")}
                          >
                            Ver todo
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={adminMode === "specific" ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setAdminMode("specific")}
                          >
                            Elegir partner
                          </Button>
                        </div>
                        {adminMode === "specific" && (
                          <div className="space-y-2">
                            <Label htmlFor="partner" className="text-xs">Partner</Label>
                            <Select
                              value={partnerInput}
                              onValueChange={(value) => setPartnerInput(value)}
                              disabled={partnersLoading}
                            >
                              <SelectTrigger id="partner" className="h-9">
                                <SelectValue placeholder="Selecciona un partner" />
                              </SelectTrigger>
                              <SelectContent>
                                {partners.map((partner) => (
                                  <SelectItem key={partner} value={partner}>
                                    {partner}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}
                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Iniciar sesión
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="tu@email.com"
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Contraseña</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        {...registerForm.register("password")}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm">Confirmar contraseña</Label>
                      <Input
                        id="register-confirm"
                        type="password"
                        placeholder="••••••••"
                        {...registerForm.register("confirmPassword")}
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Crear contraseña
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      Solo los emails autorizados en la hoja Users pueden registrarse.
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <Link to="/auth/forgot" className="font-medium text-primary hover:underline">
                    Recuperar contraseña
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
