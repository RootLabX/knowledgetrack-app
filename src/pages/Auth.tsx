import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signInWithMicrosoft } = useAuth();
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

  const handleMicrosoftLogin = async () => {
    setSubmitting(true);
    try {
      await signInWithMicrosoft();
    } catch (error: any) {
      toast.error(error.message || "Error al iniciar sesión con Microsoft");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F1F5F9] p-4">
      <Card className="w-full max-w-md border-none shadow-lg">
        <CardContent className="flex flex-col items-center pt-10 pb-10 px-8 text-center">
          <div className="mb-8 w-full max-w-[280px]">
            <img
              src="/images/pandatech-logo-BxiF7NRv.png"
              alt="PandaTech Logo"
              className="h-auto w-full object-contain"
            />
          </div>

          <div className="space-y-2 mb-8">
            <h1 className="text-[#0ea5e9] text-2xl font-bold tracking-tight">
              PANDATECH SkillsPath
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Sistema de Gestión Capacitación
            </p>
          </div>

          <Button
            onClick={handleMicrosoftLogin}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] hover:opacity-90 text-white shadow-md border-0 h-12 text-base font-medium rounded-full gap-3"
          >
            <MicrosoftIcon />
            {submitting ? "Redirigiendo..." : "Iniciar sesión con Microsoft"}
          </Button>

          <p className="mt-6 text-xs text-muted-foreground text-center px-4 leading-relaxed">
            Usa tu cuenta corporativa de Microsoft para acceder.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
