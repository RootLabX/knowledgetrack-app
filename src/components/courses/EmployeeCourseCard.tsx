import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, Circle, PlayCircle, ExternalLink, BookOpen, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DIFFICULTIES } from "../../pages/Courses";
import { cn } from "@/lib/utils";

interface EmployeeCourseCardProps {
    course: any;
    userProgress?: any;
    onUpdateProgress: (courseId: string, newProgress: number) => Promise<void>;
}

export const EmployeeCourseCard = ({ course, userProgress, onUpdateProgress }: EmployeeCourseCardProps) => {
    const [consumedHours, setConsumedHours] = useState<string>("");
    const [isUpdating, setIsUpdating] = useState(false);

    const progress = userProgress?.progress || 0;
    const status = userProgress?.status || "available";

    // Calculate consumed hours from progress on init or when progress changes
    useEffect(() => {
        if (course.duration_hours) {
            if (!userProgress) {
                setConsumedHours("");
                return;
            }
            const hours = (progress / 100) * course.duration_hours;
            setConsumedHours(hours > 0 ? hours.toFixed(1) : "");
        }
    }, [progress, course.duration_hours, userProgress]);

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConsumedHours(e.target.value);
    };

    const handleBlur = async () => {
        if (!course.duration_hours || isUpdating) return;

        if (consumedHours === "" && progress === 0) return;

        const hours = parseFloat(consumedHours);
        // If invalid input, reset to current progress
        if (isNaN(hours) && consumedHours !== "") {
            const currentHours = (progress / 100) * course.duration_hours;
            setConsumedHours(currentHours > 0 ? currentHours.toFixed(1) : "");
            return;
        }

        // Default to 0 if empty
        const validHours = isNaN(hours) ? 0 : hours;

        const clampedHours = Math.max(0, Math.min(validHours, course.duration_hours));
        const newProgress = Math.round((clampedHours / course.duration_hours) * 100);

        if (newProgress !== progress) {
            setIsUpdating(true);
            await onUpdateProgress(course.id, newProgress);
            setIsUpdating(false);
        }
    };

    const statusConfig = {
        available: { label: "Disponible", color: "bg-muted text-muted-foreground", icon: Circle },
        assigned: { label: "Pendiente", color: "bg-secondary text-secondary-foreground", icon: Clock },
        in_progress: { label: "En Proceso", color: "bg-primary text-primary-foreground", icon: PlayCircle },
        completed: { label: "Completado", color: "bg-green-500 text-white", icon: CheckCircle },
    };

    const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
    const StatusIcon = currentStatus.icon;

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "d MMM, yyyy", { locale: es });
    };

    // Helper to get localized difficulty
    const getDifficultyLabel = (value: string | null) => {
        if (!value) return null;
        const found = DIFFICULTIES.find((d) => d.value === value);
        return found ? found.label : value;
    };

    const topics = course.objectives
        ? course.objectives.join(", ")
        : course.description || "Sin descripción";

    const truncatedTopics = topics.split(" ").slice(0, 70).join(" ") + (topics.split(" ").length > 70 ? "..." : "");

    return (
        <Card className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <CardContent className="p-6 pb-4">
                <div className="space-y-4">
                    {/* Header Section: Title, Difficulty, Status */}
                    <div className="flex flex-col space-y-2">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xl font-bold text-foreground">{course.title}</h3>
                                {course.difficulty && (
                                    <Badge variant="outline" className="text-xs font-normal bg-background">
                                        {getDifficultyLabel(course.difficulty)}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={cn("gap-1 font-medium whitespace-nowrap", currentStatus.color)}>
                                    <StatusIcon className="h-3 w-3" />
                                    {currentStatus.label}
                                </Badge>
                                {course.link && (
                                    <a
                                        href={course.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-primary/80"
                                        title="Ir al curso"
                                    >
                                        <ExternalLink className="h-5 w-5" />
                                    </a>
                                )}
                            </div>
                        </div>
                        <div>
                            <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-transparent">
                                {course.category}
                            </Badge>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div>
                        <p className="text-sm text-muted-foreground line-clamp-3 md:line-clamp-2">
                            {truncatedTopics}
                        </p>
                    </div>

                    {/* Dates Section */}
                    {(course.start_date || course.end_date) && (
                        <div className="flex flex-wrap items-center gap-4 pt-4">
                            {course.start_date && (
                                <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-secondary/50 border border-secondary">
                                    <Calendar className="h-4 w-4 text-foreground/70" />
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Inicio</span>
                                        <span className="text-sm font-semibold text-foreground leading-tight">{formatDate(course.start_date)}</span>
                                    </div>
                                </div>
                            )}
                            {course.end_date && (
                                <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-secondary/50 border border-secondary">
                                    <Calendar className="h-4 w-4 text-foreground/70" />
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Fin</span>
                                        <span className="text-sm font-semibold text-foreground leading-tight">{formatDate(course.end_date)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Controls Section: Hours & Progress Label */}
                    <div className="pt-2 flex flex-col gap-3">
                        <div className="flex flex-wrap items-end gap-6">

                            {/* Consumed Hours Input */}
                            <div className="flex flex-col space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Horas Consumidas
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        max={course.duration_hours || 100}
                                        step="0.5"
                                        value={consumedHours}
                                        onChange={handleHoursChange}
                                        onBlur={handleBlur}
                                        disabled={!course.duration_hours || status === "completed"}
                                        placeholder="0"
                                        className="h-8 w-24 text-right"
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        / {course.duration_hours || "-"} h
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Percentage Display */}
                        <div className="flex justify-start">
                            <span className="text-xs font-medium text-muted-foreground">{progress}% completado</span>
                        </div>
                    </div>

                </div>
            </CardContent>

            {/* Progress Bar Flush at Bottom */}
            <div className="w-full bg-secondary/30">
                <Progress
                    value={progress}
                    className="h-4 rounded-none w-full bg-transparent"
                    indicatorClassName="bg-blue-600"
                />
            </div>
        </Card>
    );
};
