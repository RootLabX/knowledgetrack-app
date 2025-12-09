import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Target, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Objective {
  id: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  objective_type: string;
  status: string;
  due_date: string | null;
}

interface Props {
  objective: Objective;
  onDelete?: (id: string) => void;
  onComplete?: (id: string) => void;
}

const typeLabels: { [key: string]: string } = {
  courses: "Cursos",
  assessment_score: "Puntaje de Evaluación",
  daily_streak: "Racha Diaria",
};

export const ObjectiveCard = ({ objective, onDelete, onComplete }: Props) => {
  const progress = Math.min((objective.current_value / objective.target_value) * 100, 100);
  const isCompleted = objective.status === "completed" || progress >= 100;
  const isOverdue = objective.due_date && new Date(objective.due_date) < new Date() && !isCompleted;

  return (
    <Card className={cn(
      "transition-all duration-300",
      isCompleted && "border-green-500/50 bg-green-500/5",
      isOverdue && "border-destructive/50 bg-destructive/5"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            ) : (
              <Target className="h-5 w-5 text-primary shrink-0" />
            )}
            <CardTitle className="text-base">{objective.title}</CardTitle>
          </div>
          <Badge variant={isCompleted ? "default" : "secondary"}>
            {typeLabels[objective.objective_type] || objective.objective_type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {objective.description && (
          <p className="text-sm text-muted-foreground">{objective.description}</p>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">
              {objective.current_value} / {objective.target_value}
            </span>
          </div>
          <Progress 
            value={progress} 
            className={cn(
              "h-2",
              isCompleted && "[&>div]:bg-green-500"
            )} 
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          {objective.due_date && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              isOverdue ? "text-destructive" : "text-muted-foreground"
            )}>
              <Clock className="h-3 w-3" />
              <span>
                {isOverdue ? "Vencido: " : "Fecha límite: "}
                {new Date(objective.due_date).toLocaleDateString()}
              </span>
            </div>
          )}
          
          <div className="flex gap-2 ml-auto">
            {onDelete && !isCompleted && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onDelete(objective.id)}
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
