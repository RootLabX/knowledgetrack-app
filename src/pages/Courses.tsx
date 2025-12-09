import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Clock, Plus, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  duration_hours: number | null;
  difficulty: string | null;
  objectives: string[] | null;
  is_active: boolean;
}

const CATEGORIES = [
  "Git y Control de Versiones",
  "SQL y Bases de Datos",
  "Patrones de Diseño",
  "Inteligencia Artificial",
  "Infraestructura y DevOps",
  "Internet y Redes",
  "Frontend y Navegadores",
  "Protocolos y Seguridad",
  "Trabajo en Equipo y Calidad",
];

const DIFFICULTIES = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
];

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category: "",
    duration_hours: "",
    difficulty: "",
    objectives: "",
  });

  useEffect(() => {
    fetchCourses();
    checkAdminRole();
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    setIsAdmin(!!data);
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Error al cargar los cursos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.title || !newCourse.category) {
      toast.error("El título y la categoría son requeridos");
      return;
    }

    try {
      const objectives = newCourse.objectives
        .split("\n")
        .map((o) => o.trim())
        .filter((o) => o.length > 0);

      const { error } = await supabase.from("courses").insert({
        title: newCourse.title,
        description: newCourse.description || null,
        category: newCourse.category,
        duration_hours: newCourse.duration_hours ? parseInt(newCourse.duration_hours) : null,
        difficulty: newCourse.difficulty || null,
        objectives: objectives.length > 0 ? objectives : null,
      });

      if (error) throw error;

      toast.success("Curso creado correctamente");
      setDialogOpen(false);
      setNewCourse({
        title: "",
        description: "",
        category: "",
        duration_hours: "",
        difficulty: "",
        objectives: "",
      });
      fetchCourses();
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error("Error al crear el curso");
    }
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case "beginner":
        return "bg-accent/10 text-accent";
      case "intermediate":
        return "bg-warning/10 text-warning";
      case "advanced":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getDifficultyLabel = (difficulty: string | null) => {
    return DIFFICULTIES.find((d) => d.value === difficulty)?.label || "Sin definir";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cursos</h1>
          <p className="text-muted-foreground">Catálogo de cursos disponibles para capacitación</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Curso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Curso</DialogTitle>
                <DialogDescription>
                  Agrega un nuevo curso al catálogo de capacitación
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    placeholder="Ej: Git Avanzado"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría *</Label>
                  <Select
                    value={newCourse.category}
                    onValueChange={(value) => setNewCourse({ ...newCourse, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración (horas)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newCourse.duration_hours}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, duration_hours: e.target.value })
                      }
                      placeholder="Ej: 8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Dificultad</Label>
                    <Select
                      value={newCourse.difficulty}
                      onValueChange={(value) => setNewCourse({ ...newCourse, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map((diff) => (
                          <SelectItem key={diff.value} value={diff.value}>
                            {diff.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    placeholder="Describe el contenido del curso"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objectives">Objetivos (uno por línea)</Label>
                  <Textarea
                    id="objectives"
                    value={newCourse.objectives}
                    onChange={(e) => setNewCourse({ ...newCourse, objectives: e.target.value })}
                    placeholder="Dominar comandos avanzados de Git&#10;Entender flujos de trabajo&#10;Resolver conflictos eficientemente"
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateCourse}>Crear Curso</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">No hay cursos disponibles</p>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Crea el primer curso para comenzar"
                : "Los cursos aparecerán aquí cuando sean creados"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="mb-2">
                    {course.category}
                  </Badge>
                  {!course.is_active && (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                {course.description && (
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <div className="flex flex-wrap gap-2">
                  {course.duration_hours && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration_hours}h</span>
                    </div>
                  )}
                  <Badge className={getDifficultyColor(course.difficulty)} variant="secondary">
                    {getDifficultyLabel(course.difficulty)}
                  </Badge>
                </div>
                {course.objectives && course.objectives.length > 0 && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1 text-sm font-medium text-foreground">
                      <Target className="h-4 w-4" />
                      Objetivos
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {course.objectives.slice(0, 3).map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                          <span className="line-clamp-1">{obj}</span>
                        </li>
                      ))}
                      {course.objectives.length > 3 && (
                        <li className="text-xs text-muted-foreground">
                          +{course.objectives.length - 3} más
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;
