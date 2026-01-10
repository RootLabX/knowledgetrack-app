
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, getQuarter, getYear } from "date-fns";
import { es } from "date-fns/locale";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Target,
    Calendar,
    TrendingUp,
    CheckCircle2,
    MoreHorizontal,
    Pencil,
    Trash2,
    BarChart3,
    Eye
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface StrategicObjective {
    id: string;
    title: string;
    description: string;
    kpi_metric: string;
    kpi_target: number;
    kpi_current: number;
    kpi_unit: string;
    deadline: string;
    status: 'pending' | 'in_progress' | 'completed' | 'archived';
    department_id?: string;
}

interface Department {
    id: string;
    name: string;
}

const Objectives = () => {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // For deletion confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // View Details State
    const [viewObjective, setViewObjective] = useState<StrategicObjective | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    const [currentObj, setCurrentObj] = useState<Partial<StrategicObjective>>({
        title: "",
        description: "",
        kpi_metric: "",
        kpi_target: 100,
        kpi_current: 0,
        kpi_unit: "%",
        deadline: new Date().toISOString().split('T')[0],
        status: "in_progress",
        department_id: ""
    });

    // 1. Fetch Departments
    const { data: departments } = useQuery({
        queryKey: ["departments"],
        queryFn: async () => {
            // @ts-ignore - Table likely missing from types
            const { data, error } = await supabase.from("departments").select("id, name");
            if (error) throw error;
            return data as Department[];
        }
    });

    // 2. Fetch User Profile to get their department
    const { data: userProfile } = useQuery({
        queryKey: ["user-profile"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            // Select all to avoid single column errors if schema differs
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) return null;
            return data;
        }
    });

    const { data: objectives, isLoading } = useQuery({
        queryKey: ["strategic-objectives"],
        queryFn: async () => {
            const { data, error } = await supabase
                .schema("mapper")
                .from("strategic_objectives")
                .select("*")
                .order("deadline", { ascending: true });

            if (error) throw error;
            return data as StrategicObjective[];
        },
    });

    const upsertMutation = useMutation({
        mutationFn: async (vars: any) => {
            // Clean up fields that might cause issues (like the joined 'department' object)
            const { department, ...cleanVars } = vars;

            if (isEditing && vars.id) {
                const { error } = await supabase
                    .schema('mapper')
                    .from('strategic_objectives')
                    .update(cleanVars)
                    .eq('id', vars.id);
                if (error) throw error;
            } else {
                const { id, ...newRecord } = cleanVars; // Remove ID if present to avoid issues on Insert
                const { error } = await supabase.schema('mapper').from('strategic_objectives').insert(newRecord);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategic-objectives'] });
            setIsCreateOpen(false);
            setIsEditing(false);
            toast.success(isEditing ? "Objetivo actualizado" : "Objetivo creado correctamente");
            resetForm();
        },
        onError: (err) => {
            toast.error("Error al guardar: " + err.message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .schema('mapper')
                .from('strategic_objectives')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategic-objectives'] });
            setDeleteId(null);
            toast.success("Objetivo eliminado");
        },
        onError: (err) => {
            toast.error("Error al eliminar: " + err.message);
        }
    });

    const resetForm = () => {
        setCurrentObj({
            title: "",
            description: "",
            kpi_metric: "",
            kpi_target: 100,
            kpi_current: 0,
            kpi_unit: "%",
            deadline: new Date().toISOString().split('T')[0],
            status: "in_progress",
            department_id: ""
        });
        setIsEditing(false);
    };

    const openCreate = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    const openEdit = (obj: StrategicObjective) => {
        setCurrentObj({
            ...obj,
            department_id: obj.department_id || "" // Ensure it has a value for controlled input
        });
        setIsEditing(true);
        setIsCreateOpen(true);
    };

    const handleSubmit = () => {
        if (!currentObj.title || !currentObj.kpi_metric) {
            toast.error("Por favor completa los campos requeridos");
            return;
        }
        upsertMutation.mutate(currentObj);
    };

    const calculateProgress = (curr: number, target: number) => {
        if (!target || target === 0) return 0;
        return Math.min(100, Math.max(0, ((curr || 0) / target) * 100));
    };

    // Filter Logic
    const getFilteredObjectives = () => {
        if (!objectives) return [];
        if (!userProfile?.department) return objectives; // Show all if no dept in profile

        // Find department ID that matches profile name
        const userDept = departments?.find(d => d.name === userProfile.department);
        if (!userDept) return objectives; // Fallback

        return objectives.filter(o => o.department_id === userDept.id);
    };

    const filteredObjectives = getFilteredObjectives();

    const getQuarterlyData = () => {
        const data = filteredObjectives || [];

        const currentYear = new Date().getFullYear();
        const quarters = {
            1: { name: 'T1 (Ene-Mar)', total: 0, completed: 0, sumProgress: 0 },
            2: { name: 'T2 (Abr-Jun)', total: 0, completed: 0, sumProgress: 0 },
            3: { name: 'T3 (Jul-Sep)', total: 0, completed: 0, sumProgress: 0 },
            4: { name: 'T4 (Oct-Dic)', total: 0, completed: 0, sumProgress: 0 }
        };

        data.forEach(obj => {
            const date = new Date(obj.deadline);
            if (getYear(date) === currentYear) {
                const q = getQuarter(date) as 1 | 2 | 3 | 4;
                quarters[q].total += 1;
                const progress = calculateProgress(obj.kpi_current, obj.kpi_target);
                if (progress >= 100) quarters[q].completed += 1;
                quarters[q].sumProgress += progress;
            }
        });

        return Object.values(quarters).map(q => ({
            name: q.name,
            cumplimiento: q.total > 0 ? Math.round(q.sumProgress / q.total) : 0,
            objetivos: q.total
        }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const quarterlyData = getQuarterlyData();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Objetivos Estratégicos</h1>
                    <div className="text-muted-foreground mt-1">
                        Gestión de KPIs y Metas del Plan Anual de Capacitación
                        {userProfile?.department && <Badge variant="outline" className="ml-2">{userProfile.department}</Badge>}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Objetivo
                    </Button>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={(open) => {
                    if (!open) resetForm();
                    setIsCreateOpen(open);
                }}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{isEditing ? "Editar Objetivo" : "Crear Objetivo Estratégico"}</DialogTitle>
                            <DialogDescription>Define una meta medible para el plan anual.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Título del Objetivo</Label>
                                <Input id="title" value={currentObj.title} onChange={e => setCurrentObj({ ...currentObj, title: e.target.value })} placeholder="Ej: Mejorar cobertura de seguridad" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="department">Departamento</Label>
                                <Select
                                    value={currentObj.department_id || ""}
                                    onValueChange={v => setCurrentObj({ ...currentObj, department_id: v })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Seleccionar Departamento" /></SelectTrigger>
                                    <SelectContent>
                                        {departments?.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea id="description" value={currentObj.description || ''} onChange={e => setCurrentObj({ ...currentObj, description: e.target.value })} placeholder="Detalles de la estrategia..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="metric">Nombre del KPI</Label>
                                    <Input id="metric" value={currentObj.kpi_metric} onChange={e => setCurrentObj({ ...currentObj, kpi_metric: e.target.value })} placeholder="Ej: % Completado" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="unit">Unidad</Label>
                                    <Select value={currentObj.kpi_unit} onValueChange={v => setCurrentObj({ ...currentObj, kpi_unit: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="%">Porcentaje (%)</SelectItem>
                                            <SelectItem value="#">Numérico (#)</SelectItem>
                                            <SelectItem value="$">Moneda ($)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="current">Valor Actual</Label>
                                    <Input type="number" id="current" value={currentObj.kpi_current} onChange={e => setCurrentObj({ ...currentObj, kpi_current: parseFloat(e.target.value) })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="target">Valor Meta (Target)</Label>
                                    <Input type="number" id="target" value={currentObj.kpi_target} onChange={e => setCurrentObj({ ...currentObj, kpi_target: parseFloat(e.target.value) })} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="deadline">Fecha Límite</Label>
                                <Input type="date" id="deadline" value={currentObj.deadline} onChange={e => setCurrentObj({ ...currentObj, deadline: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSubmit} disabled={upsertMutation.isPending}>
                                {upsertMutation.isPending ? "Guardando..." : (isEditing ? "Actualizar" : "Crear Objetivo")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el objetivo estratégico.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* View Details Dialog */}
                <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl">{viewObjective?.title}</DialogTitle>
                            <DialogDescription>Detalles del objetivo estratégico</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-2">
                                <Label className="text-muted-foreground text-xs font-semibold uppercase">Descripción</Label>
                                <p className="text-sm bg-muted/30 p-3 rounded-md border">{viewObjective?.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs font-semibold uppercase">Departamento</Label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                            {departments?.find(d => d.id === viewObjective?.department_id)?.name || "Sin asignar"}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs font-semibold uppercase">Estado</Label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={viewObjective && calculateProgress(viewObjective.kpi_current, viewObjective.kpi_target) >= 100 ? "default" : "secondary"}>
                                            {viewObjective && calculateProgress(viewObjective.kpi_current, viewObjective.kpi_target) >= 100 ? "Completado" : "En Progreso"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted/20 p-4 rounded-lg border space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Target className="h-4 w-4 text-primary" /> Métricas del KPI
                                </h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Métrica</p>
                                        <p className="font-medium text-sm">{viewObjective?.kpi_metric}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Actual</p>
                                        <p className="font-bold text-lg text-primary">
                                            {viewObjective?.kpi_current} <span className="text-xs font-normal text-muted-foreground">{viewObjective?.kpi_unit}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Meta</p>
                                        <p className="font-bold text-lg">
                                            {viewObjective?.kpi_target} <span className="text-xs font-normal text-muted-foreground">{viewObjective?.kpi_unit}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1 pt-2">
                                    <div className="flex justify-between text-xs">
                                        <span>Progreso</span>
                                        <span className="font-medium">{viewObjective ? Math.round(calculateProgress(viewObjective.kpi_current, viewObjective.kpi_target)) : 0}%</span>
                                    </div>
                                    <Progress value={viewObjective ? calculateProgress(viewObjective.kpi_current, viewObjective.kpi_target) : 0} className="h-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs font-semibold uppercase">Fecha Límite</Label>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        {viewObjective?.deadline && format(new Date(viewObjective.deadline), "dd 'de' MMMM, yyyy", { locale: es })}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs font-semibold uppercase">ID Sistema</Label>
                                    <p className="text-xs font-mono text-muted-foreground">{viewObjective?.id}</p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsViewOpen(false)}>Cerrar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="management" className="w-full">
                <TabsList>
                    <TabsTrigger value="management">Gestión de Objetivos</TabsTrigger>
                    <TabsTrigger value="report">Reporte Trimestral</TabsTrigger>
                </TabsList>

                <TabsContent value="management" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredObjectives?.map((obj) => {
                            const progress = calculateProgress(obj.kpi_current, obj.kpi_target);
                            const isCompleted = progress >= 100;

                            return (
                                <Card key={obj.id} className="flex flex-col border-l-4 border-l-primary group relative">
                                    <div className="absolute top-2 right-2 z-10">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => {
                                                    setViewObjective(obj);
                                                    setIsViewOpen(true);
                                                }}>
                                                    <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEdit(obj)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={() => setDeleteId(obj.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start pr-8">
                                            <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-green-600 hover:bg-green-700" : ""}>
                                                {isCompleted ? "Completado" : "En Progreso"}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl pt-2 leading-tight">{obj.title}</CardTitle>
                                        <CardDescription className="line-clamp-2 min-h-[40px]">{obj.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-4">
                                        <div className="bg-muted/30 p-3 rounded-lg border border-muted">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{obj.kpi_metric}</span>
                                                <span className="text-lg font-bold text-primary">
                                                    {obj.kpi_current} <span className="text-sm font-normal text-muted-foreground">/ {obj.kpi_target} {obj.kpi_unit}</span>
                                                </span>
                                            </div>
                                            <Progress value={progress} className="h-2.5" indicatorClassName={isCompleted ? "bg-green-600" : ""} />
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>Vence: {format(new Date(obj.deadline), "dd 'de' MMMM, yyyy", { locale: es })}</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-2 border-t bg-muted/5 flex justify-between">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs text-muted-foreground hover:text-primary px-2 -ml-2"
                                            onClick={() => {
                                                setViewObjective(obj);
                                                setIsViewOpen(true);
                                            }}
                                        >
                                            <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver Detalle
                                        </Button>
                                        <div className="flex items-center gap-1 text-xs font-medium">
                                            {isCompleted ? (
                                                <><CheckCircle2 className="h-3 w-3 text-green-600" /> Meta Alcanzada</>
                                            ) : (
                                                <><TrendingUp className="h-3 w-3 text-primary" /> {Math.round(progress)}% Logrado</>
                                            )}
                                        </div>
                                    </CardFooter>
                                </Card>
                            )
                        })}

                        {filteredObjectives?.length === 0 && (
                            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                                <Target className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                                <h3 className="text-lg font-medium">No hay objetivos definidos</h3>
                                <p className="text-gray-500 mb-4">
                                    {userProfile?.department
                                        ? `No hay objetivos para el departamento ${userProfile.department}.`
                                        : "Comienza creando el primer KPI estratégico para este año."}
                                </p>
                                <Button variant="outline" onClick={openCreate}>Crear Objetivo</Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="report">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                Cumplimiento Trimestral de Objetivos ({new Date().getFullYear()})
                                {userProfile?.department && <span className="text-sm font-normal text-muted-foreground ml-2">({userProfile.department})</span>}
                            </CardTitle>
                            <CardDescription>
                                Promedio de avance de los KPIs agrupados por trimestre de vencimiento.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={quarterlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0, 100]} unit="%" />
                                    <Tooltip
                                        formatter={(value: number) => [`${value}% `, 'Cumplimiento Promedio']}
                                        labelStyle={{ color: 'black' }}
                                    />
                                    <Bar dataKey="cumplimiento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Cumplimiento %" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-4 mt-6">
                        {quarterlyData.map((q) => (
                            <Card key={q.name}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {q.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{q.cumplimiento}%</div>
                                    <p className="text-xs text-muted-foreground">
                                        {q.objetivos} objetivos programados
                                    </p>
                                    <Progress value={q.cumplimiento} className="h-2 mt-2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Objectives;
