import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Code, Database, GitBranch } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Question {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

const sampleQuestions: Question[] = [
  {
    id: 1,
    category: "Git",
    question: "¿Qué comando se usa para crear una nueva rama en Git?",
    options: ["git branch <nombre>", "git new branch", "git create <nombre>", "git checkout -b"],
    correctAnswer: 0,
  },
  {
    id: 2,
    category: "Patrones de Diseño",
    question: "¿Cuál es el propósito del patrón Singleton?",
    options: [
      "Permitir múltiples instancias",
      "Garantizar una única instancia de una clase",
      "Crear objetos complejos",
      "Separar la interfaz de la implementación",
    ],
    correctAnswer: 1,
  },
  {
    id: 3,
    category: "SQL",
    question: "¿Qué cláusula SQL se usa para filtrar resultados?",
    options: ["FILTER", "WHERE", "SELECT", "HAVING"],
    correctAnswer: 1,
  },
  {
    id: 4,
    category: "Git",
    question: "¿Qué hace 'git merge'?",
    options: [
      "Elimina una rama",
      "Crea un commit",
      "Combina cambios de diferentes ramas",
      "Descarta cambios locales",
    ],
    correctAnswer: 2,
  },
  {
    id: 5,
    category: "Patrones de Diseño",
    question: "¿Qué patrón se usa para notificar cambios a múltiples objetos?",
    options: ["Factory", "Observer", "Strategy", "Adapter"],
    correctAnswer: 1,
  },
];

const Assessment = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion]: parseInt(value) });
  };

  const handleNext = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = () => {
    let correct = 0;
    Object.entries(answers).forEach(([questionId, answer]) => {
      if (sampleQuestions[parseInt(questionId)].correctAnswer === answer) {
        correct++;
      }
    });
    return {
      correct,
      total: sampleQuestions.length,
      percentage: Math.round((correct / sampleQuestions.length) * 100),
    };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Git":
        return <GitBranch className="h-5 w-5" />;
      case "SQL":
        return <Database className="h-5 w-5" />;
      default:
        return <Code className="h-5 w-5" />;
    }
  };

  if (isCompleted) {
    const results = calculateResults();
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-3xl">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                <CheckCircle2 className="h-8 w-8 text-accent-foreground" />
              </div>
              <CardTitle className="text-2xl">¡Evaluación Completada!</CardTitle>
              <CardDescription>Aquí están tus resultados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">{results.percentage}%</div>
                <p className="mt-2 text-muted-foreground">
                  {results.correct} de {results.total} respuestas correctas
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso general</span>
                  <span className="font-medium">{results.percentage}%</span>
                </div>
                <Progress value={results.percentage} className="h-3" />
              </div>

              <div className="rounded-lg border bg-muted/50 p-4">
                <h3 className="mb-2 font-semibold">Áreas evaluadas:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <GitBranch className="h-4 w-4 text-primary" />
                    <span>Git y Control de Versiones</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Code className="h-4 w-4 text-primary" />
                    <span>Patrones de Diseño</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Database className="h-4 w-4 text-primary" />
                    <span>SQL y Bases de Datos</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => navigate("/learning-path")} className="flex-1">
                  Ver Path de Aprendizaje
                </Button>
                <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                  Volver al Inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const question = sampleQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / sampleQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Evaluación Técnica</h1>
            <span className="text-sm text-muted-foreground">
              Pregunta {currentQuestion + 1} de {sampleQuestions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              {getCategoryIcon(question.category)}
              <span>{question.category}</span>
            </div>
            <CardTitle className="text-xl">{question.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={answers[currentQuestion]?.toString()} onValueChange={handleAnswer}>
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handlePrevious}
                variant="outline"
                disabled={currentQuestion === 0}
                className="flex-1"
              >
                Anterior
              </Button>
              <Button
                onClick={handleNext}
                disabled={answers[currentQuestion] === undefined}
                className="flex-1"
              >
                {currentQuestion === sampleQuestions.length - 1 ? "Finalizar" : "Siguiente"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Assessment;
