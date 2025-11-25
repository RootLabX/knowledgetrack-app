import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, Clock, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CourseObjective {
  id: number;
  title: string;
  completed: boolean;
}

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  progress: number;
  duration: string;
  objectives: CourseObjective[];
}

const courses: Course[] = [
  {
    id: 1,
    title: "Git Avanzado",
    description: "Domina el control de versiones con Git y flujos de trabajo profesionales",
    category: "Git",
    progress: 65,
    duration: "4 semanas",
    objectives: [
      { id: 1, title: "Entender branching y merging", completed: true },
      { id: 2, title: "Resolver conflictos efectivamente", completed: true },
      { id: 3, title: "Usar Git Flow en proyectos", completed: false },
      { id: 4, title: "Dominar rebase y cherry-pick", completed: false },
    ],
  },
  {
    id: 2,
    title: "Patrones de Diseño",
    description: "Aprende los patrones de diseño más importantes y cuándo aplicarlos",
    category: "Arquitectura",
    progress: 30,
    duration: "6 semanas",
    objectives: [
      { id: 1, title: "Comprender patrones creacionales", completed: true },
      { id: 2, title: "Aplicar patrones estructurales", completed: false },
      { id: 3, title: "Implementar patrones de comportamiento", completed: false },
      { id: 4, title: "Proyecto final integrando patrones", completed: false },
    ],
  },
  {
    id: 3,
    title: "SQL Profesional",
    description: "Optimiza consultas y diseña bases de datos eficientes",
    category: "Bases de Datos",
    progress: 10,
    duration: "5 semanas",
    objectives: [
      { id: 1, title: "Dominar JOINs y subconsultas", completed: false },
      { id: 2, title: "Optimización de queries", completed: false },
      { id: 3, title: "Índices y performance", completed: false },
      { id: 4, title: "Transacciones y concurrencia", completed: false },
    ],
  },
];

const Courses = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold">Mis Cursos</h1>
          <p className="mt-2 text-muted-foreground">
            Gestiona tu progreso y actualiza objetivos completados
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const completedObjectives = course.objectives.filter((obj) => obj.completed).length;
            const totalObjectives = course.objectives.length;

            return (
              <Card key={course.id} className="flex flex-col transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="secondary">{course.category}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                  </div>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium">Progreso general</span>
                      <span className="text-muted-foreground">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                      <Target className="h-4 w-4 text-primary" />
                      <span>
                        Objetivos ({completedObjectives}/{totalObjectives})
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {course.objectives.map((objective) => (
                        <li key={objective.id} className="flex items-start gap-2 text-sm">
                          {objective.completed ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                          ) : (
                            <div className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 border-muted-foreground/30" />
                          )}
                          <span
                            className={
                              objective.completed
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }
                          >
                            {objective.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button className="w-full">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Actualizar Progreso
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">¿Necesitas más cursos?</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Explora el catálogo completo o solicita cursos personalizados
            </p>
            <Button>Explorar Catálogo</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Courses;
