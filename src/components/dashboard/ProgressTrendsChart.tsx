import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from "recharts";
import { TrendingUp } from "lucide-react";

interface TrendData {
  date: string;
  assessments: number;
  coursesCompleted: number;
  avgScore: number;
}

interface Props {
  data: TrendData[];
}

const chartConfig = {
  assessments: {
    label: "Evaluaciones",
    color: "hsl(var(--primary))",
  },
  coursesCompleted: {
    label: "Cursos Completados",
    color: "hsl(var(--accent))",
  },
  avgScore: {
    label: "Puntaje Promedio",
    color: "hsl(var(--chart-3))",
  },
};

export const ProgressTrendsChart = ({ data }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Tendencias de Progreso del Equipo
        </CardTitle>
        <CardDescription>Evolución del rendimiento a lo largo del tiempo</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAssessments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCourses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="assessments"
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#colorAssessments)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="coursesCompleted"
              stroke="hsl(var(--accent))"
              fillOpacity={1}
              fill="url(#colorCourses)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

interface ScoreDistributionProps {
  data: { range: string; count: number }[];
}

export const ScoreDistributionChart = ({ data }: ScoreDistributionProps) => {
  const chartConfigScore = {
    count: {
      label: "Usuarios",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Puntajes</CardTitle>
        <CardDescription>Cantidad de usuarios por rango de puntaje</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfigScore} className="h-[250px] w-full">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="range" 
              tick={{ fontSize: 11 }} 
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

interface SectionPerformanceProps {
  data: { section: string; avgScore: number }[];
}

export const SectionPerformanceChart = ({ data }: SectionPerformanceProps) => {
  const chartConfigSection = {
    avgScore: {
      label: "Puntaje Promedio",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento por Sección</CardTitle>
        <CardDescription>Puntaje promedio del equipo en cada área</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfigSection} className="h-[300px] w-full">
          <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 10, right: 30, left: 100, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              type="number" 
              domain={[0, 100]}
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <YAxis 
              dataKey="section" 
              type="category"
              tick={{ fontSize: 11 }} 
              tickLine={false}
              axisLine={false}
              width={90}
              className="fill-muted-foreground"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar 
              dataKey="avgScore" 
              fill="hsl(var(--primary))" 
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
