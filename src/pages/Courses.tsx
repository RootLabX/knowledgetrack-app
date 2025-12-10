import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { BookOpen, CheckCircle, Clock, Edit, Plus, Target, Trash2, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
}

interface CourseStats {
  [courseId: string]: {
    assignedCount: number;
    completedCount: number;
  };
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
  const [courseStats, setCourseStats] = useState<CourseStats>({});
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    category: "",
    duration_hours: "",
    difficulty: "",
    objectives: "",
  });

  useEffect(() => {
    fetchCourses();
    fetchProfiles();
    fetchCourseStats();
    checkAdminRole();
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .schema("mapper")
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

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name");

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  };

  const fetchCourseStats = async () => {
    try {
      const { data, error } = await supabase
        .schema("mapper")
        .from("user_courses")
        .select("course_id, status");

      if (error) throw error;

      const stats: CourseStats = {};
      data?.forEach((item) => {
        if (!stats[item.course_id]) {
          stats[item.course_id] = { assignedCount: 0, completedCount: 0 };
        }
        stats[item.course_id].assignedCount++;
        if (item.status === "completed") {
          stats[item.course_id].completedCount++;
        }
      });
      setCourseStats(stats);
    } catch (error) {
      console.error("Error fetching course stats:", error);
    }
  };

  const checkAdminRole = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!data);
    } catch (error) {
      console.error("Error checking admin role:", error);
    }
  };

  const handleCreateCourse = async () => {
    if (!courseForm.title || !courseForm.category) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    try {
      const { error } = await supabase
        .schema("mapper")
        .from("courses")
        .insert([{
          title: courseForm.title,
          description: courseForm.description,
          category: courseForm.category,
          duration_hours: courseForm.duration_hours ? parseFloat(courseForm.duration_hours) : null,
          difficulty: courseForm.difficulty,
          objectives: courseForm.objectives.split("\n").filter(o => o.trim() !== ""),
          is_active: true
        }]);

      if (error) throw error;

      toast.success("Curso creado exitosamente");
      setDialogOpen(false);
      resetCourseForm();
      fetchCourses();
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error("Error al crear el curso");
    }
  };

  const handleUpdateCourse = async () => {
    if (!selectedCourse) return;
    if (!courseForm.title || !courseForm.category) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    try {
      const { error } = await supabase
        .schema("mapper")
        .from("courses")
        .update({
          title: courseForm.title,
          description: courseForm.description,
          category: courseForm.category,
          duration_hours: courseForm.duration_hours ? parseFloat(courseForm.duration_hours) : null,
          difficulty: courseForm.difficulty,
          objectives: courseForm.objectives.split("\n").filter(o => o.trim() !== ""),
        })
        .eq("id", selectedCourse.id);

      if (error) throw error;

      toast.success("Curso actualizado exitosamente");
      setEditDialogOpen(false);
      resetCourseForm();
      setSelectedCourse(null);
      fetchCourses();
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Error al actualizar el curso");
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;

    try {
      const { error } = await supabase
        .schema("mapper")
        .from("courses")
        .delete()
        .eq("id", selectedCourse.id);

      if (error) throw error;

      toast.success("Curso eliminado exitosamente");
      setDeleteDialogOpen(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Error al eliminar el curso");
    }
  };

  const handleAssignCourse = async () => {
    if (!selectedCourse || selectedUsers.length === 0) return;

    try {
      const assignments = selectedUsers.map(userId => ({
        user_id: userId,
        course_id: selectedCourse.id,
        status: 'assigned',
        progress: 0,
        assigned_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .schema("mapper")
        .from("user_courses")
        .insert(assignments);

      if (error) throw error;

      toast.success(`Curso asignado a ${selectedUsers.length} usuarios`);
      setAssignDialogOpen(false);
      setSelectedUsers([]);
      fetchCourseStats();
    } catch (error) {
      console.error("Error assigning course:", error);
      toast.error("Error al asignar el curso");
    }
  };

  const handleToggleActive = async (course: Course) => {
    try {
      const { error } = await supabase
        .schema("mapper")
        .from("courses")
        .update({ is_active: !course.is_active })
        .eq("id", course.id);

      if (error) throw error;

      toast.success(`Curso ${course.is_active ? "desactivado" : "activado"} exitosamente`);
      fetchCourses();
    } catch (error) {
      console.error("Error toggling course status:", error);
      toast.error("Error al cambiar el estado del curso");
    }
  };

  const handleOpenAssignDialog = (course: Course) => {
    setSelectedCourse(course);
    setAssignDialogOpen(true);
  };

  const handleOpenEditDialog = (course: Course) => {
    setSelectedCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description || "",
      category: course.category,
      duration_hours: course.duration_hours?.toString() || "",
      difficulty: course.difficulty || "",
      objectives: course.objectives?.join("\n") || "",
    });
    setEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (course: Course) => {
    setSelectedCourse(course);
    setDeleteDialogOpen(true);
  };

  const resetCourseForm = () => {
    setCourseForm({
      title: "",
      description: "",
      category: "",
      duration_hours: "",
      difficulty: "",
      objectives: "",
    });
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient">
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
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="Ej: Git Avanzado"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select
                  value={courseForm.category}
                  onValueChange={(value) => setCourseForm({ ...courseForm, category: value })}
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
                    value={courseForm.duration_hours}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, duration_hours: e.target.value })
                    }
                    placeholder="Ej: 8"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Dificultad</Label>
                  <Select
                    value={courseForm.difficulty}
                    onValueChange={(value) => setCourseForm({ ...courseForm, difficulty: value })}
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
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="Describe el contenido del curso"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="objectives">Objetivos (uno por línea)</Label>
                <Textarea
                  id="objectives"
                  value={courseForm.objectives}
                  onChange={(e) => setCourseForm({ ...courseForm, objectives: e.target.value })}
                  placeholder="Dominar comandos avanzados de Git&#10;Entender flujos de trabajo&#10;Resolver conflictos eficientemente"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetCourseForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCourse}>Crear Curso</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                {/* Course Stats */}
                {isAdmin && (
                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Usuarios asignados
                      </span>
                      <span className="font-medium text-foreground">
                        {courseStats[course.id]?.assignedCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <CheckCircle className="h-4 w-4" />
                        Completados
                      </span>
                      <span className="font-medium text-foreground">
                        {courseStats[course.id]?.completedCount || 0}
                      </span>
                    </div>
                    {(courseStats[course.id]?.assignedCount || 0) > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Tasa de completado</span>
                          <span>
                            {Math.round(
                              ((courseStats[course.id]?.completedCount || 0) /
                                (courseStats[course.id]?.assignedCount || 1)) *
                              100
                            )}%
                          </span>
                        </div>
                        <Progress
                          value={
                            ((courseStats[course.id]?.completedCount || 0) /
                              (courseStats[course.id]?.assignedCount || 1)) *
                            100
                          }
                          className="h-1.5"
                        />
                      </div>
                    )}
                  </div>
                )}
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
                {isAdmin && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`active-${course.id}`} className="text-sm text-muted-foreground cursor-pointer">
                        {course.is_active ? "Activo" : "Inactivo"}
                      </Label>
                      <Switch
                        id={`active-${course.id}`}
                        checked={course.is_active}
                        onCheckedChange={() => handleToggleActive(course)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenAssignDialog(course)}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Asignar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditDialog(course)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleOpenDeleteDialog(course)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Course Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Curso</DialogTitle>
            <DialogDescription>
              Selecciona los usuarios a los que deseas asignar el curso "{selectedCourse?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-2 py-4">
            {profiles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay usuarios registrados
              </p>
            ) : (
              profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleUserSelection(profile.user_id)}
                >
                  <Checkbox
                    checked={selectedUsers.includes(profile.user_id)}
                    onCheckedChange={() => toggleUserSelection(profile.user_id)}
                  />
                  <span className="text-sm">
                    {profile.full_name || "Usuario sin nombre"}
                  </span>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignCourse} disabled={selectedUsers.length === 0}>
              Asignar ({selectedUsers.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
            <DialogDescription>
              Modifica los detalles del curso
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título *</Label>
              <Input
                id="edit-title"
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                placeholder="Ej: Git Avanzado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Categoría *</Label>
              <Select
                value={courseForm.category}
                onValueChange={(value) => setCourseForm({ ...courseForm, category: value })}
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
                <Label htmlFor="edit-duration">Duración (horas)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={courseForm.duration_hours}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, duration_hours: e.target.value })
                  }
                  placeholder="Ej: 8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-difficulty">Dificultad</Label>
                <Select
                  value={courseForm.difficulty}
                  onValueChange={(value) => setCourseForm({ ...courseForm, difficulty: value })}
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
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                placeholder="Describe el contenido del curso"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-objectives">Objetivos (uno por línea)</Label>
              <Textarea
                id="edit-objectives"
                value={courseForm.objectives}
                onChange={(e) => setCourseForm({ ...courseForm, objectives: e.target.value })}
                placeholder="Dominar comandos avanzados de Git&#10;Entender flujos de trabajo&#10;Resolver conflictos eficientemente"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); resetCourseForm(); setSelectedCourse(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateCourse}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Course Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El curso "{selectedCourse?.title}" será eliminado permanentemente junto con todas las asignaciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCourse(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteCourse}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Courses;
