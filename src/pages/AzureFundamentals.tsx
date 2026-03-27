import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  CheckCircle2,
  ChevronDown,
  Cloud,
  Clock,
  Server,
  Shield,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Question {
  id: number;
  category: string;
  section: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

const SECTIONS = [
  { id: "cloud-concepts", name: "Conceptos de la Nube", icon: Cloud, questionCount: 8 },
  { id: "azure-services", name: "Arquitectura y Servicios de Azure", icon: Server, questionCount: 10 },
  { id: "management-governance", name: "Administración y Gobernanza", icon: Shield, questionCount: 7 },
];

const EXAM_TIME_MINUTES = 40;
const EXAM_TIME_SECONDS = EXAM_TIME_MINUTES * 60;

const allQuestions: Question[] = [
  // CONCEPTOS DE LA NUBE (9 preguntas)
  { id: 1, category: "Cloud Concepts", section: "cloud-concepts", question: "¿Cuál es una característica del modelo de nube pública?", options: ["Los recursos son propiedad exclusiva de una organización", "Los servicios se ofrecen a través de Internet y están disponibles para cualquiera que desee comprarlos", "Requiere que la organización mantenga su propio hardware", "No permite escalar recursos bajo demanda"], correctAnswer: 1 },
  { id: 2, category: "Cloud Concepts", section: "cloud-concepts", question: "¿Qué modelo de servicio en la nube proporciona la mayor responsabilidad al proveedor de la nube?", options: ["Infrastructure as a Service (IaaS)", "Platform as a Service (PaaS)", "Software as a Service (SaaS)", "On-premises"], correctAnswer: 2 },
  { id: 3, category: "Cloud Concepts", section: "cloud-concepts", question: "¿Qué concepto de la nube describe la capacidad de aumentar o disminuir recursos según la demanda?", options: ["Tolerancia a fallos", "Elasticidad", "Agilidad", "Alta disponibilidad"], correctAnswer: 1 },
  { id: 4, category: "Cloud Concepts", section: "cloud-concepts", question: "¿Cuál es un beneficio del modelo de gastos operativos (OpEx) en la nube?", options: ["Requiere una gran inversión inicial", "Solo pagas por lo que usas", "Los costos son fijos independientemente del uso", "No se puede predecir el gasto mensual"], correctAnswer: 1 },
  { id: 5, category: "Cloud Concepts", section: "cloud-concepts", question: "¿Qué describe mejor el modelo de responsabilidad compartida en la nube?", options: ["El proveedor de la nube es responsable de toda la seguridad", "El cliente es responsable de toda la seguridad", "La responsabilidad de seguridad se divide entre el proveedor y el cliente según el modelo de servicio", "No existe responsabilidad de seguridad en la nube"], correctAnswer: 2 },
  { id: 6, category: "Cloud Concepts", section: "cloud-concepts", question: "¿Cuál de los siguientes es un ejemplo de nube híbrida?", options: ["Usar solo Azure para todos los servicios", "Combinar un centro de datos local con servicios en la nube pública", "Usar dos proveedores de nube pública diferentes", "Ejecutar aplicaciones solo en servidores locales"], correctAnswer: 1 },
  { id: 7, category: "Cloud Concepts", section: "cloud-concepts", question: "En el modelo IaaS, ¿qué gestiona el cliente?", options: ["Solo los datos", "El sistema operativo, middleware, aplicaciones y datos", "Solo el hardware físico", "Nada, todo lo gestiona el proveedor"], correctAnswer: 1 },
  { id: 8, category: "Cloud Concepts", section: "cloud-concepts", question: "¿Qué acuerdo define el tiempo de actividad garantizado de un servicio en Azure?", options: ["NDA (Non-Disclosure Agreement)", "SLA (Service Level Agreement)", "TOS (Terms of Service)", "MOU (Memorandum of Understanding)"], correctAnswer: 1 },

  // ARQUITECTURA Y SERVICIOS DE AZURE (10 preguntas)
  { id: 10, category: "Azure Services", section: "azure-services", question: "¿Qué es una región de Azure?", options: ["Un único centro de datos de Azure", "Un conjunto de centros de datos conectados por una red de baja latencia dentro de un área geográfica", "El nombre comercial de un servicio de Azure", "Una suscripción de Azure"], correctAnswer: 1 },
  { id: 11, category: "Azure Services", section: "azure-services", question: "¿Qué servicio de Azure se utiliza para ejecutar máquinas virtuales?", options: ["Azure App Service", "Azure Functions", "Azure Virtual Machines", "Azure Logic Apps"], correctAnswer: 2 },
  { id: 12, category: "Azure Services", section: "azure-services", question: "¿Cuál es el propósito de Azure Blob Storage?", options: ["Almacenar bases de datos relacionales", "Almacenar grandes cantidades de datos no estructurados como texto o binarios", "Ejecutar contenedores Docker", "Gestionar redes virtuales"], correctAnswer: 1 },
  { id: 13, category: "Azure Services", section: "azure-services", question: "¿Qué servicio de Azure es una solución serverless para ejecutar código basado en eventos?", options: ["Azure Virtual Machines", "Azure Kubernetes Service", "Azure Functions", "Azure Virtual Desktop"], correctAnswer: 2 },
  { id: 14, category: "Azure Services", section: "azure-services", question: "¿Qué es Azure Virtual Network (VNet)?", options: ["Un servicio de almacenamiento en la nube", "Una representación de tu propia red en la nube que permite la comunicación entre recursos de Azure", "Un servicio de base de datos", "Una herramienta de monitoreo"], correctAnswer: 1 },
  { id: 15, category: "Azure Services", section: "azure-services", question: "¿Qué servicio de base de datos de Azure es compatible con PostgreSQL, MySQL y MariaDB?", options: ["Azure Cosmos DB", "Azure SQL Database", "Azure Database for PostgreSQL/MySQL/MariaDB", "Azure Table Storage"], correctAnswer: 2 },
  { id: 16, category: "Azure Services", section: "azure-services", question: "¿Qué son las Availability Zones en Azure?", options: ["Regiones geográficas separadas", "Ubicaciones físicamente separadas dentro de una región de Azure, cada una con alimentación, refrigeración y redes independientes", "Diferentes suscripciones de Azure", "Tipos de máquinas virtuales"], correctAnswer: 1 },
  { id: 18, category: "Azure Services", section: "azure-services", question: "¿Para qué se utiliza Azure ExpressRoute?", options: ["Enviar correos electrónicos", "Crear una conexión privada dedicada entre tu infraestructura local y Azure (sin pasar por Internet)", "Almacenar archivos en la nube", "Monitorear aplicaciones"], correctAnswer: 1 },
  { id: 19, category: "Azure Services", section: "azure-services", question: "¿Qué es Azure Cosmos DB?", options: ["Una base de datos relacional", "Una base de datos NoSQL distribuida globalmente con múltiples modelos de consistencia", "Un servicio de almacenamiento de archivos", "Una herramienta de DevOps"], correctAnswer: 1 },
  { id: 20, category: "Azure Services", section: "azure-services", question: "¿Cuál es la función de Azure App Service?", options: ["Gestionar máquinas virtuales", "Hospedar aplicaciones web, APIs REST y back-ends móviles sin gestionar infraestructura", "Almacenar datos en blobs", "Crear redes virtuales"], correctAnswer: 1 },

  // ADMINISTRACIÓN Y GOBERNANZA (7 preguntas)
  { id: 22, category: "Management & Governance", section: "management-governance", question: "¿Qué herramienta de Azure permite gestionar recursos mediante una interfaz de línea de comandos?", options: ["Azure Portal", "Azure CLI", "Azure Advisor", "Azure Monitor"], correctAnswer: 1 },
  { id: 23, category: "Management & Governance", section: "management-governance", question: "¿Cuál es el propósito de Azure Resource Manager (ARM)?", options: ["Monitorear el rendimiento de las aplicaciones", "Proporcionar una capa de administración para crear, actualizar y eliminar recursos en Azure", "Almacenar secretos y claves", "Balancear la carga de tráfico"], correctAnswer: 1 },
  { id: 24, category: "Management & Governance", section: "management-governance", question: "¿Qué herramienta de Azure proporciona recomendaciones personalizadas para optimizar costos, seguridad y rendimiento?", options: ["Azure Monitor", "Azure Advisor", "Azure Policy", "Azure Blueprints"], correctAnswer: 1 },
  { id: 25, category: "Management & Governance", section: "management-governance", question: "¿Qué servicio se utiliza para controlar qué acciones pueden realizar los usuarios en los recursos de Azure?", options: ["Azure Active Directory", "Role-Based Access Control (RBAC)", "Azure Key Vault", "Azure Firewall"], correctAnswer: 1 },
  { id: 26, category: "Management & Governance", section: "management-governance", question: "¿Qué es Azure Policy?", options: ["Un servicio de base de datos", "Un servicio que permite crear, asignar y gestionar directivas que aplican reglas y efectos sobre los recursos", "Una herramienta para desplegar máquinas virtuales", "Un servicio de mensajería"], correctAnswer: 1 },
  { id: 27, category: "Management & Governance", section: "management-governance", question: "¿Cuál es la función principal de la Calculadora de Precios de Azure?", options: ["Facturar automáticamente los servicios usados", "Estimar el costo de los servicios de Azure antes de implementarlos", "Monitorear el uso de recursos en tiempo real", "Crear presupuestos automáticos"], correctAnswer: 1 },
  { id: 28, category: "Management & Governance", section: "management-governance", question: "¿Qué servicio de Azure permite almacenar y gestionar de forma segura secretos, claves y certificados?", options: ["Azure Active Directory", "Azure Information Protection", "Azure Key Vault", "Azure Security Center"], correctAnswer: 2 },
];

const AzureFundamentals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingExam, setExistingExam] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(EXAM_TIME_SECONDS);
  const [loadingData, setLoadingData] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const STORAGE_KEY = `azure_exam_progress_${user?.id}`;

  const saveProgress = (questionIdx: number, currentAnswers: Record<number, number>, time: number) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentQuestion: questionIdx, answers: currentAnswers, timeRemaining: time }));
  };

  const clearProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const loadSavedProgress = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as { currentQuestion: number; answers: Record<number, number>; timeRemaining: number };
    } catch { return null; }
  };

  useEffect(() => {
    const fetchExistingExam = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .schema("mapper")
          .from("assessments")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .like("results->>examType", "azure-fundamentals")
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) setExistingExam(data);
      } catch (error) {
        console.error("Error fetching exam:", error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchExistingExam();
  }, [user]);

  const finishExam = useCallback(async (finalAnswers: Record<number, number>, wasTimeout = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSaving(true);

    const results = calculateResultsFrom(finalAnswers);
    try {
      const { error } = await supabase
        .schema("mapper")
        .from("assessments")
        .insert([{
          user_id: user?.id,
          total_questions: results.total,
          correct_answers: results.correct,
          status: "completed",
          results: { examType: "azure-fundamentals", bySection: results.bySection, answers: finalAnswers },
          completed_at: new Date().toISOString(),
        }]);

      if (error) throw error;
      clearProgress();
      setIsCompleted(true);
      toast.success(wasTimeout ? "Tiempo agotado. Evaluación guardada." : "Examen guardado exitosamente");
    } catch (error) {
      console.error("Error saving exam:", error);
      toast.error("Error al guardar el examen");
    } finally {
      setSaving(false);
    }
  }, [user]);

  useEffect(() => {
    if (!examStarted || isCompleted) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          finishExam(answers, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examStarted, isCompleted, finishExam, answers]);

  const startExam = () => {
    clearProgress();
    setCurrentQuestion(0);
    setAnswers({});
    setIsCompleted(false);
    setTimeRemaining(EXAM_TIME_SECONDS);
    setExamStarted(true);
    setExistingExam(null);
  };

  const resumeExam = () => {
    const saved = loadSavedProgress();
    if (!saved) return;
    setCurrentQuestion(saved.currentQuestion);
    setAnswers(saved.answers);
    setTimeRemaining(saved.timeRemaining);
    setIsCompleted(false);
    setExamStarted(true);
    setExistingExam(null);
  };

  const handleAnswer = (value: string) => {
    const updated = { ...answers, [currentQuestion]: parseInt(value) };
    setAnswers(updated);
    saveProgress(currentQuestion, updated, timeRemaining);
  };

  const handleNext = () => {
    if (currentQuestion < allQuestions.length - 1) {
      const next = currentQuestion + 1;
      setCurrentQuestion(next);
      saveProgress(next, answers, timeRemaining);
    } else {
      finishExam(answers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      const prev = currentQuestion - 1;
      setCurrentQuestion(prev);
      saveProgress(prev, answers, timeRemaining);
    }
  };

  const calculateResultsFrom = (ans: Record<number, number>) => {
    let correct = 0;
    const bySection: Record<string, { correct: number; total: number; percentage: number }> = {};

    allQuestions.forEach((q, idx) => {
      if (!bySection[q.section]) bySection[q.section] = { correct: 0, total: 0, percentage: 0 };
      bySection[q.section].total++;
      if (ans[idx] === q.correctAnswer) {
        correct++;
        bySection[q.section].correct++;
      }
    });

    Object.keys(bySection).forEach((s) => {
      bySection[s].percentage = Math.round((bySection[s].correct / bySection[s].total) * 100);
    });

    return { correct, total: allQuestions.length, percentage: Math.round((correct / allQuestions.length) * 100), bySection };
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timeRemaining <= 120) return "text-red-500";
    if (timeRemaining <= 300) return "text-yellow-500";
    return "text-foreground";
  };

  // --- START SCREEN ---
  if (!examStarted && !isCompleted) {
    const saved = loadSavedProgress();
    const hasSaved = !!saved;

    if (loadingData) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Examen de Práctica - Azure Fundamentals (AZ-900)</h1>
          <p className="text-muted-foreground">
            Prepárate para la certificación Microsoft Azure Fundamentals
          </p>
        </div>

        {existingExam && (() => {
          const globalPct = Math.round((existingExam.correct_answers / existingExam.total_questions) * 100);
          const passed = globalPct >= 70;
          const sectionResults = existingExam.results?.bySection as { [key: string]: { correct: number; total: number; percentage?: number } } | undefined;
          const savedAnswers = existingExam.results?.answers as Record<string, number> | undefined;

          return (
            <>
              <Card className={passed ? "border-green-300" : "border-red-300"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {passed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                    Último Intento
                  </CardTitle>
                  <CardDescription>
                    Completado el {new Date(existingExam.completed_at).toLocaleDateString("es-ES")}
                    {" — "}
                    <span className={passed ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                      {passed ? "APROBADO" : "NO APROBADO"} (se requiere 70%)
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`text-3xl font-bold ${passed ? "text-green-500" : "text-red-500"}`}>{globalPct}%</div>
                    <div className="text-sm text-muted-foreground">
                      {existingExam.correct_answers} de {existingExam.total_questions} respuestas correctas
                    </div>
                  </div>
                  <Progress value={globalPct} className="h-3" />
                </CardContent>
              </Card>

              {sectionResults && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resultados por Dominio</CardTitle>
                    <CardDescription>
                      {savedAnswers ? "Haz clic en cada dominio para ver el detalle" : "Resumen por área"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {SECTIONS.map((section) => {
                        const data = sectionResults[section.id];
                        if (!data) return null;
                        const pct = data.percentage ?? Math.round((data.correct / data.total) * 100);
                        const incorrect = data.total - data.correct;
                        const sectionQuestions = allQuestions.map((q, idx) => ({ ...q, globalIndex: idx })).filter((q) => q.section === section.id);

                        return (
                          <Collapsible key={section.id}>
                            <div className="rounded-lg border p-4 space-y-3">
                              <CollapsibleTrigger className="w-full" asChild>
                                <button className="w-full text-left space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <section.icon className="h-5 w-5 text-primary" />
                                      <span className="font-medium text-foreground">{section.name}</span>
                                      {savedAnswers && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                    </div>
                                    <Badge variant={pct >= 70 ? "default" : pct >= 50 ? "secondary" : "destructive"}>{pct}%</Badge>
                                  </div>
                                  <Progress value={pct} className="h-2" />
                                  <div className="flex gap-4 text-sm">
                                    <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />{data.correct} correctas</span>
                                    <span className="flex items-center gap-1 text-red-500"><XCircle className="h-3.5 w-3.5" />{incorrect} incorrectas</span>
                                    <span className="text-muted-foreground ml-auto">{data.correct}/{data.total}</span>
                                  </div>
                                </button>
                              </CollapsibleTrigger>
                              {savedAnswers && (
                                <CollapsibleContent>
                                  <div className="mt-3 border-t pt-3 space-y-3">
                                    {sectionQuestions.map((q) => {
                                      const userAnswer = savedAnswers[String(q.globalIndex)];
                                      const isCorrect = userAnswer === q.correctAnswer;
                                      return (
                                        <div key={q.id} className={`rounded-md p-3 text-sm ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                                          <div className="flex items-start gap-2">
                                            {isCorrect ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                                            <div className="flex-1 space-y-1">
                                              <p className="font-medium text-foreground">{q.question}</p>
                                              {!isCorrect && (
                                                <>
                                                  <p className="text-red-600">Tu respuesta: {userAnswer !== undefined ? q.options[userAnswer] : "Sin responder"}</p>
                                                  <p className="text-green-700">Correcta: {q.options[q.correctAnswer]}</p>
                                                </>
                                              )}
                                              {isCorrect && <p className="text-green-700">{q.options[q.correctAnswer]}</p>}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </CollapsibleContent>
                              )}
                            </div>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          );
        })()}

        <Card>
          <CardHeader>
            <CardTitle>Dominios del Examen AZ-900</CardTitle>
            <CardDescription>25 preguntas • 40 minutos • Se requiere 70% para aprobar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {SECTIONS.map((section) => (
                <div key={section.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <section.icon className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{section.name}</p>
                    <p className="text-xs text-muted-foreground">{section.questionCount} preguntas</p>
                  </div>
                </div>
              ))}
            </div>

            {hasSaved && (() => {
              const answeredCount = Object.keys(saved!.answers).length;
              const timeLeft = formatTime(saved!.timeRemaining);
              return (
                <div className="mt-6 rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Examen en progreso</p>
                      <p className="text-sm text-muted-foreground">{answeredCount} de {allQuestions.length} preguntas • {timeLeft} restantes</p>
                    </div>
                    <Badge variant="outline" className="border-primary text-primary">{Math.round((answeredCount / allQuestions.length) * 100)}%</Badge>
                  </div>
                  <Progress value={(answeredCount / allQuestions.length) * 100} className="h-2" />
                  <div className="flex gap-2">
                    <Button onClick={resumeExam} className="flex-1">Continuar Examen</Button>
                    <Button variant="outline" onClick={clearProgress} className="flex-1">Descartar</Button>
                  </div>
                </div>
              );
            })()}

            <Button onClick={startExam} className="mt-4 w-full">
              {hasSaved ? "Comenzar de Nuevo" : (existingExam ? "Reintentar Examen" : "Iniciar Examen")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- RESULTS SCREEN ---
  if (isCompleted) {
    const results = calculateResultsFrom(answers);
    const passed = results.percentage >= 70;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${passed ? "bg-green-100" : "bg-red-100"}`}>
              {passed ? <CheckCircle2 className="h-8 w-8 text-green-600" /> : <XCircle className="h-8 w-8 text-red-500" />}
            </div>
            <CardTitle className="text-2xl">
              {passed ? "¡Examen Aprobado!" : "Examen No Aprobado"}
            </CardTitle>
            <CardDescription>
              {passed ? "Estás listo para presentar el AZ-900" : "Necesitas 70% para aprobar. ¡Sigue practicando!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className={`text-5xl font-bold ${passed ? "text-green-500" : "text-red-500"}`}>{results.percentage}%</div>
              <p className="mt-2 text-muted-foreground">{results.correct} de {results.total} respuestas correctas</p>
            </div>
            <Progress value={results.percentage} className="h-3" />

            <div className="space-y-4">
              <h3 className="font-semibold">Resultados por Dominio</h3>
              {SECTIONS.map((section) => {
                const sr = results.bySection[section.id];
                return (
                  <div key={section.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <section.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{section.name}</span>
                      </div>
                      <Badge variant={sr?.percentage >= 70 ? "default" : sr?.percentage >= 50 ? "secondary" : "destructive"}>
                        {sr?.percentage || 0}%
                      </Badge>
                    </div>
                    <Progress value={sr?.percentage || 0} className="h-2" />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => { setExamStarted(false); setIsCompleted(false); window.location.reload(); }} className="flex-1">
                Ver Detalle Completo
              </Button>
              <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                Volver al Inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- QUESTION SCREEN ---
  const question = allQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / allQuestions.length) * 100;
  const currentSection = SECTIONS.find((s) => s.id === question.section);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">AZ-900 Practice Exam</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Pregunta {currentQuestion + 1} de {allQuestions.length}
            </span>
            <div className={`flex items-center gap-1.5 font-mono text-lg font-bold ${getTimerColor()}`}>
              <Clock className="h-5 w-5" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          {currentSection && <currentSection.icon className="h-4 w-4" />}
          <span>{currentSection?.name}</span>
        </div>
        {timeRemaining <= 120 && (
          <div className="mt-2 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-1.5 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            ¡Quedan menos de 2 minutos!
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Cloud className="h-4 w-4" />
            <span>{question.category}</span>
          </div>
          <CardTitle className="text-xl">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup key={currentQuestion} value={answers[currentQuestion]?.toString() ?? ""} onValueChange={handleAnswer}>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                  <RadioGroupItem value={index.toString()} id={`q${question.id}-opt-${index}`} />
                  <Label htmlFor={`q${question.id}-opt-${index}`} className="flex-1 cursor-pointer">{option}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          <div className="flex gap-3 pt-4">
            <Button onClick={handlePrevious} variant="outline" disabled={currentQuestion === 0} className="flex-1">Anterior</Button>
            <Button onClick={handleNext} disabled={answers[currentQuestion] === undefined || saving} className="flex-1">
              {saving ? "Guardando..." : currentQuestion === allQuestions.length - 1 ? "Finalizar Examen" : "Siguiente"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AzureFundamentals;
