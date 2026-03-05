import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Error al iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F1F5F9] p-4">
      <Card className="w-full max-w-md border-none shadow-lg">
        <CardContent className="flex flex-col items-center pt-10 pb-10 px-8 text-center">
          {/* Logo */}
          <div className="mb-8 w-full max-w-[280px]">
            <img
              src="/images/pandatech-logo-BxiF7NRv.png"
              alt="PandaTech Logo"
              className="h-auto w-full object-contain"
            />
          </div>

          {/* Titles */}
          <div className="space-y-2 mb-8">
            <h1 className="text-[#0ea5e9] text-2xl font-bold tracking-tight">
              PANDATECH SkillsPath
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Sistema de Gestión Capacitación
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="w-full space-y-4 mb-6">
            <div className="space-y-2 text-left">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] hover:opacity-90 text-white shadow-md border-0 h-11 text-base font-medium rounded-full"
            >
              <LogIn className="mr-2 h-5 w-5" />
              {submitting ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>

          {/* Footer Text */}
          <p className="text-xs text-muted-foreground text-center px-4 leading-relaxed">
            El registro de nuevos usuarios solo puede ser realizado por un administrador.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
