import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const stats = [
    { label: "Evaluaciones Completadas", value: "0", icon: Brain, color: "text-primary" },
    { label: "Cursos en Progreso", value: "0", icon: BookOpen, color: "text-accent" },
    { label: "Horas de Capacitación", value: "0", icon: Clock, color: "text-warning" },
    { label: "Miembros del Equipo", value: "1", icon: Users, color: "text-primary" },
  ];

  const quickActions = [
    {
      title: "Iniciar Evaluación",
      description: "Evalúa tus conocimientos técnicos",
      icon: Brain,
      onClick: () => navigate("/assessment"),
      variant: "default" as const,
    },
    {
      title: "Ver Cursos",
      description: "Explora el catálogo de cursos",
      icon: BookOpen,
      onClick: () => navigate("/courses"),
      variant: "outline" as const,
    },
    {
      title: "Mi Ruta de Aprendizaje",
      description: "Ver tu plan personalizado",
      icon: TrendingUp,
      onClick: () => navigate("/learning-path"),
      variant: "outline" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenido{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Aquí tienes un resumen de tu progreso y actividades recientes.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg bg-muted p-3 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Comienza tu jornada de aprendizaje</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant={action.variant}
                className="h-auto flex-col items-start gap-2 p-4 text-left"
                onClick={action.onClick}
              >
                <action.icon className="h-5 w-5" />
                <div>
                  <p className="font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Progreso por Área
            </CardTitle>
            <CardDescription>Tu avance en cada área técnica</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">Git & Control de Versiones</span>
                <span className="font-medium text-muted-foreground">Sin evaluar</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">Patrones de Diseño</span>
                <span className="font-medium text-muted-foreground">Sin evaluar</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">SQL & Bases de Datos</span>
                <span className="font-medium text-muted-foreground">Sin evaluar</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">Inteligencia Artificial</span>
                <span className="font-medium text-muted-foreground">Sin evaluar</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
            <Button
              variant="link"
              className="mt-2 h-auto p-0 text-primary"
              onClick={() => navigate("/assessment")}
            >
              Iniciar evaluación para ver tu progreso →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Tus últimas acciones en la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No hay actividad reciente</p>
              <p className="text-sm text-muted-foreground">
                Comienza una evaluación para ver tu actividad aquí
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
