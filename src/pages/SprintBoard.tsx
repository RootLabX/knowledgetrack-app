import React, { useEffect, useState, useRef } from "react";
// 1. Importamos useNavigate
import { useNavigate, useParams } from "react-router-dom";
// 2. Importamos ArrowLeft
import {
    Plus, MoreHorizontal, CircleDashed, CheckCircle2, Circle,
    Calendar, AlertCircle, Loader2, Trash2, Pencil, X, User, Zap, ArrowLeft, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Swal from "sweetalert2";

import {
    getSprintTasks,
    updateTaskStatus,
    createTask,
    updateTask,
    deleteTask,
    getSprintById,
    getSubtasks,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    type Task,
    type Subtask
} from "@/lib/planningApi";

// --- TIPOS ---
interface SprintBoardProps {
    sprintId?: string;
}

// --- COMPONENTE PRINCIPAL ---
export default function SprintBoard({ sprintId: propSprintId }: SprintBoardProps = {}) {
    // 3. Inicializamos el hook de navegación
    const navigate = useNavigate();
    const { sprintId: paramSprintId } = useParams();
    const sprintId = propSprintId || paramSprintId;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [sprintInfo, setSprintInfo] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Estado para el Modal de Edición
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    useEffect(() => {
        if (sprintId) loadData();
    }, [sprintId]);

    const loadData = async () => {
        if (!sprintId) return;
        try {
            setLoading(true);
            const [sprintData, tasksData] = await Promise.all([
                getSprintById(sprintId),
                getSprintTasks(sprintId)
            ]);
            setSprintInfo(sprintData);
            setTasks(tasksData);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar el tablero");
        } finally {
            setLoading(false);
        }
    };

    // --- LOGICA DE NEGOCIO ---

    const handleDrop = async (e: React.DragEvent, newStatus: "todo" | "in_progress" | "done") => {
        const taskId = e.dataTransfer.getData("taskId");
        if (!taskId) return;

        const taskToMove = tasks.find((t) => t.id === taskId);
        if (!taskToMove || taskToMove.status === newStatus) return;

        const originalTasks = [...tasks];
        // Optimistic UI update
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

        try {
            await updateTaskStatus(taskId, newStatus);
            toast.success("Estado actualizado");
        } catch (error) {
            setTasks(originalTasks);
            toast.error("Error al mover la tarea");
        }
    };

    const handleCreateTask = async (title: string, status: string) => {
        if (!title.trim() || !sprintId) return;
        setIsCreating(true);
        try {
            const newTask = await createTask({
                sprint_id: sprintId,
                title: title,
                status: status,
            });
            setTasks((prev) => [...prev, (newTask as unknown) as Task]);
            toast.success("Tarea creada");
        } catch (error) {
            toast.error("Error al crear la tarea");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;
        try {
            await deleteTask(taskId);
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
            toast.success("Tarea eliminada");
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const handleUpdateTask = async (updatedTask: Task) => {
        try {
            // 1. Actualizar UI
            setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
            setEditingTask(null); // Cerrar modal

            // 2. Actualizar BD
            await updateTask(updatedTask.id, {
                title: updatedTask.title,
                description: updatedTask.description,
                priority: updatedTask.priority,
                points: updatedTask.points
            });
            toast.success("Tarea actualizada");
        } catch (error) {
            toast.error("Error al actualizar");
            loadData(); // Revertir cambios recargando
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white text-slate-900 font-sans p-6 relative">

            {/* 4. Botón de Volver */}
            <div className="mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium px-2 py-1 -ml-2 rounded-md hover:bg-gray-100"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a la planificación
                </button>
            </div>

            {/* Header del Sprint */}
            <div className="mb-6 border-b border-gray-100 pb-4">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                    {sprintInfo?.title}
                    {!sprintInfo?.goal && (
                        <span className="px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium border border-yellow-100 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Sin objetivo
                        </span>
                    )}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p>
                        {sprintInfo?.start_date ? format(new Date(sprintInfo.start_date), "dd MMM", { locale: es }) : "Inicio"} -
                        {sprintInfo?.end_date ? format(new Date(sprintInfo.end_date), "dd MMM yyyy", { locale: es }) : "Fin"}
                    </p>
                </div>
            </div>

            {/* Grid de Columnas */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0 pb-2 overflow-x-auto">
                <BoardColumn
                    title="Por hacer"
                    status="todo"
                    tasks={tasks.filter((t) => t.status === "todo")}
                    onTaskCreate={handleCreateTask}
                    onDropTask={handleDrop}
                    onDeleteTask={handleDeleteTask}
                    onEditTask={setEditingTask}
                    isCreating={isCreating}
                />
                <BoardColumn
                    title="En curso"
                    status="in_progress"
                    tasks={tasks.filter((t) => t.status === "in_progress")}
                    onTaskCreate={handleCreateTask}
                    onDropTask={handleDrop}
                    onDeleteTask={handleDeleteTask}
                    onEditTask={setEditingTask}
                    isCreating={isCreating}
                />
                <BoardColumn
                    title="Terminado"
                    status="done"
                    tasks={tasks.filter((t) => t.status === "done")}
                    onTaskCreate={handleCreateTask}
                    onDropTask={handleDrop}
                    onDeleteTask={handleDeleteTask}
                    onEditTask={setEditingTask}
                    isCreating={isCreating}
                />
            </div>

            {/* Modal de Edición */}
            {editingTask && (
                <EditTaskModal
                    task={editingTask}
                    onClose={() => { setEditingTask(null); loadData(); }}
                    onSave={async (t) => {
                        await handleUpdateTask(t);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}

// --- SUB-COMPONENTES ---

const BoardColumn = ({
    title, status, tasks, onTaskCreate, onDropTask, onDeleteTask, onEditTask, isCreating,
}: {
    title: string;
    status: "todo" | "in_progress" | "done";
    tasks: Task[];
    onTaskCreate: (title: string, status: string) => void;
    onDropTask: (e: React.DragEvent, status: any) => void;
    onDeleteTask: (id: string) => void;
    onEditTask: (task: Task) => void;
    isCreating: boolean;
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");

    const config = {
        todo: { bg: "bg-gray-100", border: "border-gray-200", icon: <Circle className="w-4 h-4 text-gray-500" /> },
        in_progress: { bg: "bg-blue-50", border: "border-blue-100", icon: <CircleDashed className="w-4 h-4 text-blue-500" /> },
        done: { bg: "bg-emerald-50", border: "border-emerald-100", icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
    }[status];

    const submitCreate = () => {
        if (newTaskTitle.trim()) {
            onTaskCreate(newTaskTitle, status);
            setNewTaskTitle("");
            setIsAdding(false);
        }
    };

    return (
        <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDropTask(e, status)}
            className="flex flex-col h-full min-w-[300px] rounded-xl bg-gray-50/80 border border-gray-200"
        >
            {/* Header Columna */}
            <div className="p-3 flex items-center justify-between border-b border-gray-100 bg-white/50 rounded-t-xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${config.bg} ${config.border} border`}>{config.icon}</div>
                    <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
                    <span className="text-xs font-medium text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                        {tasks.length}
                    </span>
                </div>
                <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
            </div>

            {/* Lista de Tareas */}
            <div className="flex-1 p-2 overflow-y-auto space-y-2.5 custom-scrollbar">
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onDelete={() => onDeleteTask(task.id)}
                        onEdit={() => onEditTask(task)}
                    />
                ))}

                {/* Input de Creación Rápida */}
                {isAdding ? (
                    <div className="bg-white p-3 rounded-lg border border-indigo-200 shadow-md ring-2 ring-indigo-50 animate-in fade-in zoom-in-95 duration-200">
                        <input
                            autoFocus
                            className="w-full text-sm font-medium outline-none placeholder:text-gray-400"
                            placeholder="¿Qué hay que hacer?"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && submitCreate()}
                        />
                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-50">
                            <button onClick={() => setIsAdding(false)} className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 rounded">Cancelar</button>
                            <button onClick={submitCreate} className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium">Guardar</button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full py-2 flex items-center gap-2 px-2 text-gray-500 hover:text-gray-800 hover:bg-white/80 rounded-lg transition-all text-sm font-medium group"
                    >
                        <div className="p-1 rounded bg-gray-200 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                        </div>
                        Añadir tarea
                    </button>
                )}
            </div>
        </div>
    );
};

const TaskCard = ({ task, onDelete, onEdit }: { task: Task; onDelete: () => void; onEdit: () => void }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showSubtasks, setShowSubtasks] = useState(false);
    const [subtasks, setSubtasksPreview] = useState<Subtask[]>([]);
    const [loadingSubtasks, setLoadingSubtasks] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync subtasks from prop
    useEffect(() => {
        if (task.planning_subtasks) {
            setSubtasksPreview(task.planning_subtasks);
        }
    }, [task.planning_subtasks]);

    const completedSubtasks = subtasks.filter(s => s.status === 'done').length;
    const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

    const handleToggleSubtasks = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!showSubtasks && subtasks.length === 0) {
            setLoadingSubtasks(true);
            try {
                const data = await getSubtasks(task.id);
                setSubtasksPreview(data);
            } catch (error) {
                console.error("Error loading subtasks preview", error);
            } finally {
                setLoadingSubtasks(false);
            }
        }
        setShowSubtasks(!showSubtasks);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "done": return "bg-emerald-500";
            case "in_progress": return "bg-blue-500";
            default: return "bg-slate-300";
        }
    };

    const priorityConfig = {
        high: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200", label: "Alta" },
        medium: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "Media" },
        low: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Baja" },
    }[task.priority || "medium"];

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData("taskId", task.id);
                e.currentTarget.classList.add("opacity-50");
            }}
            onDragEnd={(e) => e.currentTarget.classList.remove("opacity-50")}
            onClick={() => onEdit()}
            className="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-300/50 transition-all cursor-grab active:cursor-grabbing relative flex flex-col gap-3"
        >
            {/* Cabecera Tarjeta: Prioridad y Puntos */}
            <div className="flex justify-between items-start">
                <div className="flex gap-2 flex-wrap items-center">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${priorityConfig.bg} ${priorityConfig.color} ${priorityConfig.border}`}>
                        {priorityConfig.label}
                    </span>
                    {task.points !== undefined && task.points > 0 && (
                        <span className="text-[10px] font-semibold bg-gray-50 text-gray-500 border border-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-yellow-400 text-yellow-500" />
                            {task.points} pts
                        </span>
                    )}
                </div>

                {/* Menú Dropdown */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        className="text-gray-300 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-200/50 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <button
                                onClick={() => { setShowMenu(false); onEdit(); }}
                                className="w-full px-4 py-2.5 text-xs text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors font-medium"
                            >
                                <Pencil className="w-3.5 h-3.5 text-gray-400" /> Editar
                            </button>
                            <button
                                onClick={() => { setShowMenu(false); onDelete(); }}
                                className="w-full px-4 py-2.5 text-xs text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium border-t border-gray-50"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Eliminar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Contenido Principal */}
            <div>
                <h4 className="text-sm font-semibold text-gray-800 leading-snug mb-1.5 group-hover:text-indigo-700 transition-colors">
                    {task.title}
                </h4>
                {task.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {task.description}
                    </p>
                )}

                {/* Barra de Progreso eliminada del card */}
            </div>

            {/* Footer Tarjeta: Fecha, Toggle Subtareas y Asignado */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium bg-gray-50 px-2.5 py-1 rounded-md">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{format(new Date(task.created_at), "d MMM", { locale: es })}</span>
                    </div>

                    {/* Boton preview subtareas */}
                    <button
                        onClick={handleToggleSubtasks}
                        className={`text-gray-400 hover:text-indigo-600 p-1 rounded-md hover:bg-indigo-50 transition-all ${showSubtasks ? 'bg-indigo-50 text-indigo-600' : ''}`}
                        title="Ver subtareas"
                    >
                        {showSubtasks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                </div>

                {/* Avatar Placeholder */}
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-white shadow-sm flex items-center justify-center text-[10px] font-bold text-white tracking-tight">
                    US
                </div>
            </div>

            {/* Preview de Subtareas */}
            {showSubtasks && (
                <div className="pt-2 border-t border-gray-50 animate-in fade-in slide-in-from-top-1 duration-200">
                    {loadingSubtasks ? (
                        <div className="py-2 text-center text-xs text-gray-400">Cargando...</div>
                    ) : subtasks.length === 0 ? (
                        <div className="py-2 text-center text-[10px] text-gray-400 italic">No hay subtareas</div>
                    ) : (
                        <div className="space-y-1.5">
                            {subtasks.map(sub => (
                                <div key={sub.id} className="flex items-center gap-2 text-xs text-gray-600">
                                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(sub.status)} flex-shrink-0`} />
                                    <span className={`truncate ${sub.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                                        {sub.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- MODAL DE EDICIÓN ---
const EditTaskModal = ({ task, onClose, onSave }: { task: Task, onClose: () => void, onSave: (t: Task) => void }) => {
    const [formData, setFormData] = useState({ ...task });

    // Subtask States
    const [subtasks, setSubtasks] = useState<any[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [loadingSubtasks, setLoadingSubtasks] = useState(false);

    useEffect(() => {
        loadSubtasks();
    }, []);

    const loadSubtasks = async () => {
        setLoadingSubtasks(true);
        try {
            const data = await getSubtasks(task.id);
            setSubtasks(data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando subtareas");
        } finally {
            setLoadingSubtasks(false);
        }
    };

    const handleAddSubtask = async () => {
        if (!newSubtaskTitle.trim()) return;
        try {
            const newSub = await createSubtask(task.id, newSubtaskTitle);
            setSubtasks([...subtasks, newSub]);
            setNewSubtaskTitle("");
        } catch (error) {
            toast.error("Error añadiendo subtarea");
        }
    };

    const handleUpdateSubtaskStatus = async (subtask: any, newStatus: string) => {
        const original = [...subtasks];

        // Optimistic
        setSubtasks(prev => prev.map(s => s.id === subtask.id ? { ...s, status: newStatus } : s));

        try {
            await updateSubtask(subtask.id, { status: newStatus as any });
        } catch (error) {
            setSubtasks(original);
            toast.error("Error actualizando subtarea");
        }
    };

    const handleDeleteSubtask = async (id: string) => {
        try {
            await deleteSubtask(id);
            setSubtasks(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            toast.error("Error eliminando subtarea");
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "done": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "in_progress": return "bg-blue-100 text-blue-700 border-blue-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                    <h3 className="font-semibold text-gray-800">Editar Tarea</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                    {/* Campos Principales */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título</label>
                        <input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prioridad</label>
                            <select
                                value={formData.priority || 'medium'}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Puntos (Esfuerzo)</label>
                            <input
                                type="number"
                                value={formData.points || 0}
                                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descripción</label>
                        <textarea
                            rows={3}
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                        />
                    </div>

                    {/* Sección Subtareas */}
                    <div className="border-t border-gray-100 pt-4 mt-2">
                        <div className="flex flex-col gap-2 mb-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold text-gray-500 uppercase">Subtareas</label>
                                {subtasks.length > 0 && (
                                    <span className="text-xs font-bold text-indigo-600">
                                        {Math.round((subtasks.filter(s => s.status === 'done').length / subtasks.length) * 100)}% Completado
                                    </span>
                                )}
                            </div>

                            {/* Barra de Progreso en Modal */}
                            {subtasks.length > 0 && (
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 transition-all duration-500 ease-out rounded-full"
                                        style={{ width: `${(subtasks.filter(s => s.status === 'done').length / subtasks.length) * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 mb-3">
                            {loadingSubtasks ? (
                                <div className="text-center py-2 text-xs text-gray-400">Cargando subtareas...</div>
                            ) : subtasks.length === 0 ? (
                                <div className="text-center py-3 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                                    <p className="text-xs text-gray-400">No hay subtareas</p>
                                </div>
                            ) : (
                                subtasks.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-2 group bg-white border border-gray-100 p-2 rounded-lg hover:border-gray-200 transition-colors">

                                        <span className={`text-sm font-medium flex-1 truncate ${sub.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                            {sub.title}
                                        </span>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <select
                                                value={sub.status || "todo"}
                                                onChange={(e) => handleUpdateSubtaskStatus(sub, e.target.value)}
                                                className={`text-[11px] font-semibold px-2 py-1 rounded-md border focus:outline-none cursor-pointer appearance-none transition-colors ${getStatusStyle(sub.status || 'todo')}`}
                                            >
                                                <option value="todo">Por hacer</option>
                                                <option value="in_progress">En curso</option>
                                                <option value="done">Completado</option>
                                            </select>

                                            <button
                                                onClick={() => handleDeleteSubtask(sub.id)}
                                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex gap-2">
                            <input
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                                placeholder="Añadir subtarea..."
                                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                            <button
                                onClick={handleAddSubtask}
                                disabled={!newSubtaskTitle.trim()}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium hover:bg-gray-200 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 flex-shrink-0 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
                    <button onClick={() => onSave(formData)} className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-lg shadow-slate-200">
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};