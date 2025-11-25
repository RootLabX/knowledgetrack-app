import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-6 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm shadow-sm">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span>Plataforma de Capacitación Técnica</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              Desarrolla el Talento de tu{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Equipo
              </span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Evalúa conocimientos, identifica brechas y capacita de forma personalizada. Todo en
              una plataforma intuitiva diseñada para equipos de desarrollo.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" onClick={() => navigate("/assessment")} className="text-lg">
                <Brain className="mr-2 h-5 w-5" />
                Comenzar Evaluación
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/courses")}
                className="text-lg"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Explorar Cursos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">¿Cómo Funciona?</h2>
          <p className="text-lg text-muted-foreground">
            Tres pasos simples para transformar el conocimiento de tu equipo
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>1. Evalúa Conocimientos</CardTitle>
              <CardDescription>
                Crea evaluaciones técnicas personalizadas sobre Git, patrones de diseño, SQL y
                más. Identifica fortalezas y áreas de mejora.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>2. Identifica Brechas</CardTitle>
              <CardDescription>
                Analiza automáticamente los resultados y recibe un diagnóstico detallado de las
                brechas de conocimiento de cada miembro del equipo.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <BookOpen className="h-6 w-6 text-warning" />
              </div>
              <CardTitle>3. Capacita Personalizado</CardTitle>
              <CardDescription>
                Genera paths de aprendizaje adaptados. Cada consultor actualiza su progreso y
                alcanza objetivos específicos de cada curso.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-6 py-16">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">100%</div>
              <p className="text-sm text-muted-foreground">Personalizado</p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-accent">15+</div>
              <p className="text-sm text-muted-foreground">Áreas Técnicas</p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-warning">24/7</div>
              <p className="text-sm text-muted-foreground">Acceso Total</p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">∞</div>
              <p className="text-sm text-muted-foreground">Cursos Disponibles</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Progress Dashboard */}
      <section className="container mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">Dashboard de Progreso</h2>
          <p className="text-lg text-muted-foreground">
            Visualiza el avance de tu equipo en tiempo real
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Progreso del Equipo</CardTitle>
              <CardDescription>Vista general del conocimiento técnico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Git & Control de Versiones</span>
                  <span className="font-medium">75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Patrones de Diseño</span>
                  <span className="font-medium">60%</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>SQL & Bases de Datos</span>
                  <span className="font-medium">45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Testing & QA</span>
                  <span className="font-medium">50%</span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimos logros del equipo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                <div className="text-sm">
                  <p className="font-medium">María completó "Git Avanzado"</p>
                  <p className="text-muted-foreground">Hace 2 horas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                <div className="text-sm">
                  <p className="font-medium">5 miembros iniciaron evaluación</p>
                  <p className="text-muted-foreground">Hace 1 día</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                <div className="text-sm">
                  <p className="font-medium">Carlos alcanzó 80% en SQL</p>
                  <p className="text-muted-foreground">Hace 2 días</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BookOpen className="mt-1 h-5 w-5 flex-shrink-0 text-warning" />
                <div className="text-sm">
                  <p className="font-medium">Nuevo curso "Testing Avanzado" disponible</p>
                  <p className="text-muted-foreground">Hace 3 días</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-card">
        <div className="container mx-auto px-6 py-16 text-center">
          <h2 className="mb-4 text-3xl font-bold">¿Listo para empezar?</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Comienza evaluando el conocimiento de tu equipo hoy mismo
          </p>
          <Button size="lg" onClick={() => navigate("/assessment")}>
            <Brain className="mr-2 h-5 w-5" />
            Iniciar Evaluación Gratuita
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
