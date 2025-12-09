import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Award,
  Rocket,
  BookOpen,
  GraduationCap,
  Code,
  Brain,
  Target,
  GitBranch,
  Database,
  Layers,
  Users,
  Trophy,
  Star,
  Zap,
} from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned?: boolean;
  earned_at?: string;
}

interface Props {
  achievement: Achievement;
  size?: "sm" | "md" | "lg";
}

const iconMap: { [key: string]: React.ElementType } = {
  award: Award,
  rocket: Rocket,
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
  code: Code,
  brain: Brain,
  target: Target,
  "git-branch": GitBranch,
  database: Database,
  layers: Layers,
  users: Users,
  trophy: Trophy,
  star: Star,
  zap: Zap,
};

const categoryColors: { [key: string]: string } = {
  assessment: "from-purple-500 to-pink-500",
  courses: "from-blue-500 to-cyan-500",
  skills: "from-green-500 to-emerald-500",
  general: "from-orange-500 to-yellow-500",
};

export const AchievementCard = ({ achievement, size = "md" }: Props) => {
  const IconComponent = iconMap[achievement.icon] || Award;
  const gradientClass = categoryColors[achievement.category] || categoryColors.general;
  
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const iconSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        achievement.earned 
          ? "border-primary/50 shadow-lg hover:shadow-xl" 
          : "opacity-50 grayscale hover:opacity-70"
      )}
    >
      {achievement.earned && (
        <div className={cn(
          "absolute top-0 right-0 w-16 h-16 bg-gradient-to-br opacity-20",
          gradientClass
        )} style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
      )}
      <CardContent className={cn("flex items-center gap-4", sizeClasses[size])}>
        <div className={cn(
          "rounded-full p-3 bg-gradient-to-br",
          achievement.earned ? gradientClass : "from-muted to-muted-foreground/20"
        )}>
          <IconComponent className={cn(iconSizes[size], "text-white")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "font-semibold truncate",
              size === "lg" ? "text-lg" : "text-sm"
            )}>
              {achievement.name}
            </h4>
            <Badge variant="outline" className="shrink-0 text-xs">
              +{achievement.points} pts
            </Badge>
          </div>
          <p className={cn(
            "text-muted-foreground line-clamp-2",
            size === "lg" ? "text-sm" : "text-xs"
          )}>
            {achievement.description}
          </p>
          {achievement.earned && achievement.earned_at && (
            <p className="text-xs text-primary mt-1">
              Obtenido: {new Date(achievement.earned_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
