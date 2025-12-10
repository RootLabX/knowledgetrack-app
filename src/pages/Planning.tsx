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
import { Calendar as CalendarIcon, CheckCircle, Clock, Plus, Target, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";

interface PlanningObjective {
    id: string;
    title: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    created_by: string;
}

interface PlanningSprint {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    status: string;
}

interface PlanningTask {
    id: string;
    objective_id: string;
    sprint_id: string | null;
    title: string;
    assigned_to: string | null;
    start_date: string | null;
    due_date: string | null;
    progress: number;
    status: string;
}

interface Profile {
    id: string;
    user_id: string;
    full_name: string | null;
}

const Planning = () => {
    const { user } = useAuth();
    const [objectives, setObjectives] = useState<PlanningObjective[]>([]);
    const [sprints, setSprints] = useState<PlanningSprint[]>([]);
    const [tasks, setTasks] = useState<{ [key: string]: PlanningTask[] }>({});
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [createSprintDialogOpen, setCreateSprintDialogOpen] = useState(false);
    const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
    const [selectedObjective, setSelectedObjective] = useState<PlanningObjective | null>(null);
    const [expandedObjectives, setExpandedObjectives] = useState<string[]>([]);

    // Forms
    const [objectiveForm, setObjectiveForm] = useState({
        title: "",
        description: "",
        start_date: undefined as Date | undefined,
        end_date: undefined as Date | undefined,
    });

    const [sprintForm, setSprintForm] = useState({
        title: "",
        start_date: undefined as Date | undefined,
    });

    const [taskForm, setTaskForm] = useState({
        title: "",
        assigned_to: "",
        start_date: undefined as Date | undefined,
        due_date: undefined as Date | undefined,
        progress: 0,
        sprint_id: "none",
    });

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            await Promise.all([fetchObjectives(), fetchSprints(), fetchProfiles()]);
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    };

    const fetchObjectives = async () => {
        const { data, error } = await supabase
            .schema("mapper")
            .from("planning_objectives")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        setObjectives(data || []);

        // Fetch tasks for all objectives
        if (data) {
            const objectiveIds = data.map(o => o.id);
            const { data: tasksData, error: tasksError } = await supabase
                .schema("mapper")
                .from("planning_tasks")
                .select("*")
                .in("objective_id", objectiveIds)
                .order("due_date", { ascending: true });

            if (tasksError) throw tasksError;

            const tasksByObjective: { [key: string]: PlanningTask[] } = {};
            tasksData?.forEach(task => {
                if (!tasksByObjective[task.objective_id]) {
                    tasksByObjective[task.objective_id] = [];
                }
                tasksByObjective[task.objective_id].push(task);
            });
            setTasks(tasksByObjective);
        }
    };

    const fetchSprints = async () => {
        const { data, error } = await supabase
            .schema("mapper")
            .from("planning_sprints")
            .select("*")
            .order("start_date", { ascending: false });

        if (error) throw error;
        setSprints(data || []);
    };

    const fetchProfiles = async () => {
        const { data, error } = await supabase
            .from("profiles")
            .select("id, user_id, full_name");

        if (error) throw error;
        setProfiles(data || []);
    };

    const handleCreateObjective = async () => {
        if (!objectiveForm.title) {
            toast.error("El título es requerido");
            return;
        }

        try {
            const { error } = await supabase.schema("mapper").from("planning_objectives").insert({
                title: objectiveForm.title,
                description: objectiveForm.description || null,
                start_date: objectiveForm.start_date ? format(objectiveForm.start_date, "yyyy-MM-dd") : null,
                end_date: objectiveForm.end_date ? format(objectiveForm.end_date, "yyyy-MM-dd") : null,
                created_by: user?.id,
            });

            if (error) throw error;

            toast.success("Objetivo creado correctamente");
            setCreateDialogOpen(false);
            setObjectiveForm({ title: "", description: "", start_date: undefined, end_date: undefined });
            fetchObjectives();
        } catch (error) {
            console.error("Error creating objective:", error);
            toast.error("Error al crear el objetivo");
        }
    };

    const handleCreateSprint = async () => {
        if (!sprintForm.title || !sprintForm.start_date) {
            toast.error("El título y la fecha de inicio son requeridos");
            return;
        }

        try {
            // Calculate end date (start date + 14 days)
            const endDate = new Date(sprintForm.start_date);
            endDate.setDate(endDate.getDate() + 14);

            const { error } = await supabase.schema("mapper").from("planning_sprints").insert({
                title: sprintForm.title,
                start_date: format(sprintForm.start_date, "yyyy-MM-dd"),
                end_date: format(endDate, "yyyy-MM-dd"),
                created_by: user?.id,
            });

            if (error) throw error;

            toast.success("Sprint creado correctamente");
            setCreateSprintDialogOpen(false);
            setSprintForm({ title: "", start_date: undefined });
            fetchSprints();
        } catch (error) {
            console.error("Error creating sprint:", error);
            toast.error("Error al crear el sprint");
        }
    };

    const handleCreateTask = async () => {
        if (!selectedObjective || !taskForm.title) {
            toast.error("El título es requerido");
            return;
        }

        try {
            const { error } = await supabase.schema("mapper").from("planning_tasks").insert({
                objective_id: selectedObjective.id,
                title: taskForm.title,
                assigned_to: taskForm.assigned_to || null,
                start_date: taskForm.start_date ? format(taskForm.start_date, "yyyy-MM-dd") : null,
                due_date: taskForm.due_date ? format(taskForm.due_date, "yyyy-MM-dd") : null,
                progress: taskForm.progress,
                status: taskForm.progress === 100 ? "completed" : "pending",
                sprint_id: taskForm.sprint_id && taskForm.sprint_id !== "none" ? taskForm.sprint_id : null,
            });

            if (error) throw error;

            toast.success("Tarea agregada correctamente");
            setCreateTaskDialogOpen(false);
            setTaskForm({ title: "", assigned_to: "", start_date: undefined, due_date: undefined, progress: 0, sprint_id: "none" });
            fetchObjectives(); // Refresh to update tasks
        } catch (error) {
            console.error("Error creating task:", error);
            toast.error("Error al crear la tarea");
        }
    };

    const handleUpdateTaskProgress = async (task: PlanningTask, newProgress: number) => {
        try {
            const { error } = await supabase
                .schema("mapper")
                .from("planning_tasks")
                .update({
                    progress: newProgress,
                    status: newProgress === 100 ? "completed" : "pending"
                })
                .eq("id", task.id);

            if (error) throw error;

            // Optimistic update
            setTasks(prev => ({
                ...prev,
                [task.objective_id]: prev[task.objective_id].map(t =>
                    t.id === task.id ? { ...t, progress: newProgress, status: newProgress === 100 ? "completed" : "pending" } : t
                )
            }));
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("Error al actualizar la tarea");
        }
    };

    const toggleObjective = (id: string) => {
        setExpandedObjectives(prev =>
            prev.includes(id) ? prev.filter(objId => objId !== id) : [...prev, id]
        );
    };

    const calculateObjectiveProgress = (objectiveId: string) => {
        const objectiveTasks = tasks[objectiveId] || [];
        if (objectiveTasks.length === 0) return 0;
        const totalProgress = objectiveTasks.reduce((acc, task) => acc + task.progress, 0);
        return Math.round(totalProgress / objectiveTasks.length);
    };

    const getAssigneeName = (userId: string | null) => {
        if (!userId) return "Sin asignar";
        const profile = profiles.find(p => p.user_id === userId);
        return profile?.full_name || "Usuario desconocido";
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
                    <h1 className="text-2xl font-bold text-foreground">Planificación</h1>
                    <p className="text-muted-foreground">Gestión de objetivos, tareas y seguimiento</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={createSprintDialogOpen} onOpenChange={setCreateSprintDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                Nuevo Sprint
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Crear Nuevo Sprint</DialogTitle>
                                <DialogDescription>Crea un ciclo de trabajo de 2 semanas</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sprint-title">Título *</Label>
                                    <Input
                                        id="sprint-title"
                                        value={sprintForm.title}
                                        onChange={(e) => setSprintForm({ ...sprintForm, title: e.target.value })}
                                        placeholder="Ej: Sprint 24"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fecha Inicio *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !sprintForm.start_date && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {sprintForm.start_date ? format(sprintForm.start_date, "PPP", { locale: es }) : "Seleccionar"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={sprintForm.start_date}
                                                onSelect={(date) => setSprintForm({ ...sprintForm, start_date: date })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <p className="text-xs text-muted-foreground">La fecha de fin se calculará automáticamente (+14 días)</p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCreateSprintDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleCreateSprint}>Crear Sprint</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="gradient">
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Objetivo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Crear Nuevo Objetivo</DialogTitle>
                                <DialogDescription>Define un nuevo objetivo para planificar</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Título *</Label>
                                    <Input
                                        id="title"
                                        value={objectiveForm.title}
                                        onChange={(e) => setObjectiveForm({ ...objectiveForm, title: e.target.value })}
                                        placeholder="Ej: Lanzamiento Q4"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Descripción</Label>
                                    <Textarea
                                        id="description"
                                        value={objectiveForm.description}
                                        onChange={(e) => setObjectiveForm({ ...objectiveForm, description: e.target.value })}
                                        placeholder="Detalles del objetivo..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Fecha Inicio</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !objectiveForm.start_date && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {objectiveForm.start_date ? format(objectiveForm.start_date, "PPP", { locale: es }) : "Seleccionar"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={objectiveForm.start_date}
                                                    onSelect={(date) => setObjectiveForm({ ...objectiveForm, start_date: date })}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fecha Fin</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !objectiveForm.end_date && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {objectiveForm.end_date ? format(objectiveForm.end_date, "PPP", { locale: es }) : "Seleccionar"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={objectiveForm.end_date}
                                                    onSelect={(date) => setObjectiveForm({ ...objectiveForm, end_date: date })}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleCreateObjective}>Crear Objetivo</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6">
                {objectives.map((objective) => (
                    <Card key={objective.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Target className="h-5 w-5 text-primary" />
                                        {objective.title}
                                    </CardTitle>
                                    <CardDescription>{objective.description}</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                        {calculateObjectiveProgress(objective.id)}% Completado
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleObjective(objective.id)}
                                    >
                                        {expandedObjectives.includes(objective.id) ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                {objective.start_date && (
                                    <span className="flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        Inicio: {format(new Date(objective.start_date), "dd/MM/yyyy")}
                                    </span>
                                )}
                                {objective.end_date && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Fin: {format(new Date(objective.end_date), "dd/MM/yyyy")}
                                    </span>
                                )}
                            </div>
                            <div className="mt-4">
                                <Progress value={calculateObjectiveProgress(objective.id)} className="h-2" />
                            </div>
                        </CardHeader>

                        <Collapsible open={expandedObjectives.includes(objective.id)}>
                            <CollapsibleContent>
                                <CardContent className="pt-0 pb-6">
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <h3 className="text-sm font-semibold text-muted-foreground">Tareas ({tasks[objective.id]?.length || 0})</h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedObjective(objective);
                                                setCreateTaskDialogOpen(true);
                                            }}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Agregar Tarea
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {tasks[objective.id]?.map((task) => (
                                            <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-accent/5 transition-colors">
                                                <div className="flex-1 mr-4">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm">{task.title}</span>
                                                            {task.sprint_id && (
                                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                                                    {sprints.find(s => s.id === task.sprint_id)?.title || "Sprint"}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                            {getAssigneeName(task.assigned_to)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                                                        {task.due_date && (
                                                            <span className="flex items-center gap-1">
                                                                <CalendarIcon className="h-3 w-3" />
                                                                Vence: {format(new Date(task.due_date), "dd/MM/yyyy")}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Slider
                                                            value={[task.progress]}
                                                            max={100}
                                                            step={10}
                                                            className="flex-1"
                                                            onValueChange={(vals) => handleUpdateTaskProgress(task, vals[0])}
                                                        />
                                                        <span className="text-xs font-medium w-8 text-right">{task.progress}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(!tasks[objective.id] || tasks[objective.id].length === 0) && (
                                            <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                                No hay tareas asignadas a este objetivo
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </CollapsibleContent>
                        </Collapsible>
                    </Card>
                ))}

                {objectives.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No hay objetivos planificados</p>
                        <p className="text-sm">Crea tu primer objetivo para comenzar a planificar</p>
                    </div>
                )}
            </div>

            {/* Create Task Dialog */}
            <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Agregar Tarea</DialogTitle>
                        <DialogDescription>
                            Agregando tarea a: {selectedObjective?.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="task-title">Título *</Label>
                            <Input
                                id="task-title"
                                value={taskForm.title}
                                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                placeholder="Ej: Definir alcance"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assignee">Asignar a</Label>
                            <Select
                                value={taskForm.assigned_to}
                                onValueChange={(value) => setTaskForm({ ...taskForm, assigned_to: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar usuario" />
                                </SelectTrigger>
                                <SelectContent>
                                    {profiles.map((profile) => (
                                        <SelectItem key={profile.user_id} value={profile.user_id}>
                                            {profile.full_name || "Usuario"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sprint">Sprint</Label>
                            <Select
                                value={taskForm.sprint_id}
                                onValueChange={(value) => setTaskForm({ ...taskForm, sprint_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar Sprint (Opcional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin Sprint</SelectItem>
                                    {sprints.map((sprint) => (
                                        <SelectItem key={sprint.id} value={sprint.id}>
                                            {sprint.title} ({format(new Date(sprint.start_date), "dd/MM")})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Fecha Inicio</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !taskForm.start_date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {taskForm.start_date ? format(taskForm.start_date, "PPP", { locale: es }) : "Seleccionar"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={taskForm.start_date}
                                            onSelect={(date) => setTaskForm({ ...taskForm, start_date: date })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label>Fecha Vencimiento</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !taskForm.due_date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {taskForm.due_date ? format(taskForm.due_date, "PPP", { locale: es }) : "Seleccionar"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={taskForm.due_date}
                                            onSelect={(date) => setTaskForm({ ...taskForm, due_date: date })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Progreso Inicial: {taskForm.progress}%</Label>
                            <Slider
                                value={[taskForm.progress]}
                                max={100}
                                step={10}
                                onValueChange={(vals) => setTaskForm({ ...taskForm, progress: vals[0] })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateTaskDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateTask}>Guardar Tarea</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Planning;
