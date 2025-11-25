import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  Target,
  Award,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SkillGap {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  priority: "high" | "medium" | "low";
}

interface Recommendation {
  id: number;
  title: string;
  reason: string;
  duration: string;
}

const skillGaps: SkillGap[] = [
  { skill: "Git Avanzado", currentLevel: 65, targetLevel: 90, priority: "high" },
  { skill: "Patrones de Diseño", currentLevel: 45, targetLevel: 85, priority: "high" },
  { skill: "SQL Optimización", currentLevel: 30, targetLevel: 80, priority: "medium" },
  { skill: "Testing", currentLevel: 40, targetLevel: 75, priority: "medium" },
  { skill: "Arquitectura", currentLevel: 55, targetLevel: 85, priority: "low" },
];

const recommendations: Recommendation[] = [
  {
    id: 1,
    title: "Git Avanzado",
    reason: "Brecha detectada de 25 puntos. Alta prioridad.",
    duration: "4 semanas",
  },
  {
    id: 2,
    title: "Patrones de Diseño",
    reason: "Conocimiento base sólido, expandir con casos prácticos.",
    duration: "6 semanas",
  },
  {
    id: 3,
    title: "SQL Profesional",
    reason: "Optimización crítica para el rendimiento de proyectos.",
    duration: "5 semanas",
  },
];

const LearningPath = () => {
  const navigate = useNavigate();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      default:
        return "Baja";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mi Path de Aprendizaje</h1>
              <p className="mt-2 text-muted-foreground">
                Plan personalizado basado en tu evaluación inicial
              </p>
            </div>
            <Button onClick={() => navigate("/assessment")}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Nueva Evaluación
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Skills Gap Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Análisis de Brechas de Conocimiento
                </CardTitle>
                <CardDescription>
                  Identificación de áreas que requieren desarrollo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {skillGaps.map((gap, index) => {
                  const gapPercentage = gap.targetLevel - gap.currentLevel;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{gap.skill}</span>
                          <Badge className={getPriorityColor(gap.priority)}>
                            {getPriorityLabel(gap.priority)}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {gap.currentLevel}% → {gap.targetLevel}%
                        </span>
                      </div>
                      <div className="relative">
                        <Progress value={gap.currentLevel} className="h-3" />
                        <div
                          className="absolute top-0 h-3 rounded-full bg-destructive/20"
                          style={{
                            left: `${gap.currentLevel}%`,
                            width: `${gapPercentage}%`,
                          }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Brecha: {gapPercentage} puntos
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recommended Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Cursos Recomendados
                </CardTitle>
                <CardDescription>
                  Selección personalizada para cerrar tus brechas de conocimiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={rec.id}
                    className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{rec.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{rec.reason}</p>
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span>{rec.duration}</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => navigate("/courses")}>
                      Ver Curso
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-primary" />
                  Resumen de Progreso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">47%</div>
                  <p className="mt-1 text-sm text-muted-foreground">Progreso global</p>
                </div>
                <Progress value={47} className="h-2" />
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cursos activos</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Objetivos completados</span>
                    <span className="font-semibold">12/28</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Horas estudiadas</span>
                    <span className="font-semibold">45h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximos Pasos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                  <div className="text-sm">
                    <p className="font-medium">Completar módulo de Git</p>
                    <p className="text-muted-foreground">2 lecciones restantes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 border-muted-foreground/30" />
                  <div className="text-sm">
                    <p className="font-medium">Iniciar Patrones de Diseño</p>
                    <p className="text-muted-foreground">Módulo creacional</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 border-muted-foreground/30" />
                  <div className="text-sm">
                    <p className="font-medium">Revisar SQL básico</p>
                    <p className="text-muted-foreground">Preparación para módulo avanzado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPath;
