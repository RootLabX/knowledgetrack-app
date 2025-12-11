import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { LayoutGrid } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

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

          {/* Login Button */}
          <Button
            type="button"
            className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] hover:opacity-90 text-white shadow-md border-0 h-11 text-base font-medium rounded-full mb-6"
            onClick={async () => {
              try {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'azure',
                  options: {
                    scopes: 'email',
                    redirectTo: `${window.location.origin}/`,
                  },
                });
                if (error) throw error;
              } catch (error: any) {
                toast.error(error.message);
              }
            }}
          >
            <LayoutGrid className="mr-2 h-5 w-5" />
            Iniciar sesión con Microsoft
          </Button>

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
