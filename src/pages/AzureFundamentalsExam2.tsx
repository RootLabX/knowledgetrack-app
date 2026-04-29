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
  { id: "cloud-concepts", name: "Conceptos de la Nube", icon: Cloud, questionCount: 10 },
  { id: "azure-services", name: "Arquitectura y Servicios de Azure", icon: Server, questionCount: 12 },
  { id: "management-governance", name: "Administración y Gobernanza", icon: Shield, questionCount: 8 },
];

const EXAM_TIME_MINUTES = 45;
const EXAM_TIME_SECONDS = EXAM_TIME_MINUTES * 60;

const allQuestions: Question[] = [
  // ─── CONCEPTOS DE LA NUBE (10 preguntas) ───
  {
    id: 1, category: "Cloud Concepts", section: "cloud-concepts",
    question: "Una empresa necesita garantizar que su aplicación web siga funcionando incluso si un centro de datos completo falla. ¿Qué concepto de nube debe implementar?",
    options: ["Escalabilidad horizontal", "Alta disponibilidad mediante zonas de disponibilidad", "Elasticidad automática", "Agilidad en el despliegue"],
    correctAnswer: 1,
  },
  {
    id: 2, category: "Cloud Concepts", section: "cloud-concepts",
    question: "Su organización quiere migrar a la nube pero mantener datos sensibles en sus propios servidores por regulación. ¿Qué modelo de implementación es más adecuado?",
    options: ["Nube pública exclusiva", "Nube privada exclusiva", "Nube híbrida", "Multi-nube"],
    correctAnswer: 2,
  },
  {
    id: 3, category: "Cloud Concepts", section: "cloud-concepts",
    question: "En el modelo de responsabilidad compartida, al usar una base de datos PaaS como Azure SQL Database, ¿quién es responsable de aplicar parches al sistema operativo del servidor?",
    options: ["El cliente", "Microsoft (proveedor de la nube)", "Ambos comparten la responsabilidad", "El ISP del cliente"],
    correctAnswer: 1,
  },
  {
    id: 4, category: "Cloud Concepts", section: "cloud-concepts",
    question: "Una startup necesita poder incrementar recursos de cómputo de 2 a 50 servidores durante una campaña de marketing y volver a 2 después. ¿Qué beneficio de la nube describe esto?",
    options: ["Tolerancia a fallos", "Alta disponibilidad", "Elasticidad", "Recuperación ante desastres"],
    correctAnswer: 2,
  },
  {
    id: 5, category: "Cloud Concepts", section: "cloud-concepts",
    question: "¿Cuál es la principal diferencia entre escalado vertical y escalado horizontal?",
    options: [
      "El escalado vertical añade más instancias; el horizontal aumenta la potencia de una instancia",
      "El escalado vertical aumenta CPU/RAM de una instancia existente; el horizontal añade más instancias",
      "Ambos son exactamente lo mismo pero con diferente nombre",
      "El escalado horizontal solo funciona en nubes privadas",
    ],
    correctAnswer: 1,
  },
  {
    id: 6, category: "Cloud Concepts", section: "cloud-concepts",
    question: "Una empresa paga $10,000/mes de tarifa fija por su centro de datos local. Si migra a la nube, pagará según el consumo real que varía mensualmente. ¿Qué transición de modelo de gasto describe esto?",
    options: ["OpEx a CapEx", "CapEx a OpEx", "OpEx a OpEx variable", "CapEx a CapEx reducido"],
    correctAnswer: 1,
  },
  {
    id: 7, category: "Cloud Concepts", section: "cloud-concepts",
    question: "Su equipo de desarrollo necesita un entorno donde pueda desplegar código sin preocuparse por la infraestructura subyacente, pero necesita controlar la configuración de la aplicación. ¿Qué modelo de servicio es más adecuado?",
    options: ["IaaS", "PaaS", "SaaS", "FaaS exclusivamente"],
    correctAnswer: 1,
  },
  {
    id: 8, category: "Cloud Concepts", section: "cloud-concepts",
    question: "¿Cuál de las siguientes afirmaciones sobre los SLA de Azure es CORRECTA?",
    options: [
      "Todos los servicios de Azure tienen un SLA del 100%",
      "Los SLA garantizan compensación financiera si no se cumple el nivel de servicio acordado",
      "Los servicios en versión preliminar (preview) tienen los mismos SLA que los servicios GA",
      "Un SLA de 99.9% equivale a cero tiempo de inactividad al año",
    ],
    correctAnswer: 1,
  },
  {
    id: 9, category: "Cloud Concepts", section: "cloud-concepts",
    question: "Al combinar dos servicios de Azure con SLA de 99.9% cada uno en una arquitectura compuesta, ¿cuál es el SLA compuesto resultante?",
    options: ["99.9%", "99.99%", "99.8% (menor que cada SLA individual)", "100% porque se complementan"],
    correctAnswer: 2,
  },
  {
    id: 10, category: "Cloud Concepts", section: "cloud-concepts",
    question: "¿Qué modelo de servicio en la nube ofrece el MAYOR control sobre el hardware y el sistema operativo al cliente?",
    options: ["SaaS", "PaaS", "IaaS", "Todos ofrecen el mismo nivel de control"],
    correctAnswer: 2,
  },

  // ─── ARQUITECTURA Y SERVICIOS DE AZURE (12 preguntas) ───
  {
    id: 11, category: "Azure Services", section: "azure-services",
    question: "Su empresa tiene una aplicación que necesita latencia mínima para usuarios en Europa y Asia simultáneamente. ¿Qué estrategia de Azure debe usar?",
    options: [
      "Desplegar todo en una sola región con CDN",
      "Usar Azure Traffic Manager con despliegue multi-región",
      "Aumentar el tamaño de la VM en una región",
      "Usar solo Azure ExpressRoute",
    ],
    correctAnswer: 1,
  },
  {
    id: 12, category: "Azure Services", section: "azure-services",
    question: "Necesita almacenar petabytes de datos no estructurados con diferentes niveles de acceso. Algunos datos se acceden frecuentemente y otros raramente. ¿Qué servicio y característica de Azure es más adecuado?",
    options: [
      "Azure SQL Database con particiones",
      "Azure Blob Storage con niveles de acceso (Hot, Cool, Archive)",
      "Azure Table Storage",
      "Azure Files con SMB",
    ],
    correctAnswer: 1,
  },
  {
    id: 13, category: "Azure Services", section: "azure-services",
    question: "¿Cuál es la diferencia principal entre Azure Availability Sets y Availability Zones?",
    options: [
      "Ambos son exactamente iguales",
      "Availability Sets protegen contra fallos de rack dentro de un datacenter; Availability Zones protegen contra fallos de un datacenter completo",
      "Availability Zones son más baratas que Availability Sets",
      "Availability Sets solo funcionan con contenedores",
    ],
    correctAnswer: 1,
  },
  {
    id: 14, category: "Azure Services", section: "azure-services",
    question: "Una organización necesita ejecutar contenedores Docker en producción con orquestación, auto-escalado y gestión del ciclo de vida. ¿Qué servicio de Azure es más adecuado?",
    options: [
      "Azure Virtual Machines con Docker instalado",
      "Azure Container Instances",
      "Azure Kubernetes Service (AKS)",
      "Azure App Service solo",
    ],
    correctAnswer: 2,
  },
  {
    id: 15, category: "Azure Services", section: "azure-services",
    question: "¿Qué servicio de Azure debe usar para conectar su red local a Azure mediante una conexión privada dedicada que NO pase por Internet público?",
    options: ["Azure VPN Gateway (Site-to-Site)", "Azure ExpressRoute", "Azure Bastion", "Azure Application Gateway"],
    correctAnswer: 1,
  },
  {
    id: 16, category: "Azure Services", section: "azure-services",
    question: "Necesita una base de datos globalmente distribuida con replicación multi-región, baja latencia de lectura (< 10ms) y soporte para múltiples APIs (SQL, MongoDB, Cassandra). ¿Qué servicio debe elegir?",
    options: ["Azure SQL Database", "Azure Database for PostgreSQL", "Azure Cosmos DB", "Azure Cache for Redis"],
    correctAnswer: 2,
  },
  {
    id: 17, category: "Azure Services", section: "azure-services",
    question: "¿Cuál es el propósito de un Network Security Group (NSG) en Azure?",
    options: [
      "Balancear la carga de tráfico entre VMs",
      "Filtrar el tráfico de red hacia y desde recursos de Azure mediante reglas de seguridad por puerto, protocolo y dirección IP",
      "Encriptar datos en tránsito entre regiones",
      "Gestionar certificados SSL",
    ],
    correctAnswer: 1,
  },
  {
    id: 18, category: "Azure Services", section: "azure-services",
    question: "Un desarrollador necesita ejecutar una función que se active automáticamente cada vez que se sube un archivo a Azure Blob Storage. ¿Qué servicio serverless debe usar?",
    options: ["Azure Virtual Machines", "Azure Functions con trigger de Blob Storage", "Azure Batch", "Azure DevOps Pipelines"],
    correctAnswer: 1,
  },
  {
    id: 19, category: "Azure Services", section: "azure-services",
    question: "¿Qué servicio de Azure permite crear un punto de entrada seguro a VMs sin exponer puertos RDP/SSH directamente a Internet?",
    options: ["Azure Firewall", "Azure Bastion", "Azure Front Door", "Azure DDoS Protection"],
    correctAnswer: 1,
  },
  {
    id: 20, category: "Azure Services", section: "azure-services",
    question: "Su organización necesita migrar 100 máquinas virtuales de VMware on-premises a Azure. ¿Qué herramienta de Azure debe usar para evaluar y planificar la migración?",
    options: ["Azure Monitor", "Azure Migrate", "Azure Site Recovery solamente", "Azure DevOps"],
    correctAnswer: 1,
  },
  {
    id: 21, category: "Azure Services", section: "azure-services",
    question: "¿Cuál es la diferencia entre Azure Load Balancer y Azure Application Gateway?",
    options: [
      "No hay diferencia, son el mismo servicio",
      "Load Balancer opera en capa 4 (TCP/UDP); Application Gateway opera en capa 7 (HTTP/HTTPS) con enrutamiento basado en URL",
      "Application Gateway solo funciona con contenedores",
      "Load Balancer es más caro que Application Gateway",
    ],
    correctAnswer: 1,
  },
  {
    id: 22, category: "Azure Services", section: "azure-services",
    question: "¿Qué servicio de Azure proporciona protección contra ataques DDoS con monitoreo en tiempo real y mitigación automática?",
    options: ["Azure Firewall", "Network Security Groups", "Azure DDoS Protection", "Azure Information Protection"],
    correctAnswer: 2,
  },

  // ─── ADMINISTRACIÓN Y GOBERNANZA (8 preguntas) ───
  {
    id: 23, category: "Management & Governance", section: "management-governance",
    question: "Su organización tiene múltiples suscripciones de Azure y necesita aplicar una política uniforme que impida crear recursos en ciertas regiones. ¿Qué debe usar?",
    options: ["Azure RBAC", "Azure Policy con una asignación a nivel de Management Group", "Azure Monitor Alerts", "Azure Resource Locks"],
    correctAnswer: 1,
  },
  {
    id: 24, category: "Management & Governance", section: "management-governance",
    question: "Un administrador necesita asegurarse de que nadie pueda eliminar accidentalmente una base de datos de producción en Azure. ¿Cuál es la mejor solución?",
    options: [
      "Quitar permisos de escritura a todos los usuarios",
      "Aplicar un Resource Lock de tipo 'Delete' al recurso",
      "Mover la base de datos a otra suscripción",
      "Usar Azure Advisor",
    ],
    correctAnswer: 1,
  },
  {
    id: 25, category: "Management & Governance", section: "management-governance",
    question: "¿Cuál es la jerarquía correcta de organización de recursos en Azure, de mayor a menor alcance?",
    options: [
      "Suscripción → Grupo de Recursos → Grupo de Administración → Recurso",
      "Grupo de Administración → Suscripción → Grupo de Recursos → Recurso",
      "Recurso → Grupo de Recursos → Suscripción → Grupo de Administración",
      "Grupo de Recursos → Suscripción → Recurso → Grupo de Administración",
    ],
    correctAnswer: 1,
  },
  {
    id: 26, category: "Management & Governance", section: "management-governance",
    question: "Necesita desplegar la misma infraestructura (VMs, redes, storage) de forma repetible y consistente en múltiples entornos (dev, staging, prod). ¿Qué debe usar?",
    options: [
      "Crear los recursos manualmente desde Azure Portal cada vez",
      "ARM Templates o Bicep (Infrastructure as Code)",
      "Azure Advisor",
      "Azure Service Health",
    ],
    correctAnswer: 1,
  },
  {
    id: 27, category: "Management & Governance", section: "management-governance",
    question: "Su empresa necesita estimar cuánto costará migrar sus cargas de trabajo locales a Azure ANTES de realizar la migración. ¿Qué herramientas debe usar?",
    options: [
      "Azure Monitor y Azure Advisor",
      "Azure Pricing Calculator y Total Cost of Ownership (TCO) Calculator",
      "Azure Cost Management solamente",
      "Azure Service Health",
    ],
    correctAnswer: 1,
  },
  {
    id: 28, category: "Management & Governance", section: "management-governance",
    question: "¿Qué servicio de Azure le permite establecer un presupuesto mensual y recibir alertas cuando el gasto se acerca al límite?",
    options: ["Azure Advisor", "Azure Cost Management + Billing", "Azure Policy", "Azure Security Center"],
    correctAnswer: 1,
  },
  {
    id: 29, category: "Management & Governance", section: "management-governance",
    question: "Un equipo de seguridad necesita almacenar de forma centralizada las cadenas de conexión, claves API y certificados SSL que usan sus aplicaciones. ¿Qué servicio deben usar?",
    options: ["Azure Active Directory", "Azure Key Vault", "Azure Information Protection", "Azure Storage Account"],
    correctAnswer: 1,
  },
  {
    id: 30, category: "Management & Governance", section: "management-governance",
    question: "¿Cuál es la diferencia entre Azure Policy y Azure RBAC?",
    options: [
      "Son el mismo servicio con diferente nombre",
      "Azure Policy controla QUÉ propiedades pueden tener los recursos; Azure RBAC controla QUIÉN puede realizar acciones sobre los recursos",
      "RBAC es solo para usuarios externos; Policy es solo para usuarios internos",
      "Azure Policy reemplaza completamente a RBAC",
    ],
    correctAnswer: 1,
  },
];

const AzureFundamentalsExam2 = () => {
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

  const STORAGE_KEY = `azure_exam2_progress_${user?.id}`;

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
          .like("results->>examType", "azure-fundamentals-exam2")
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
          results: { examType: "azure-fundamentals-exam2", bySection: results.bySection, answers: finalAnswers },
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Examen de Práctica #2 - Azure Fundamentals (AZ-900)</h1>
            <Badge variant="destructive" className="text-xs">Avanzado</Badge>
          </div>
          <p className="text-muted-foreground">
            Evaluación avanzada con preguntas basadas en escenarios de Microsoft Learn
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
            <CardTitle>Dominios del Examen AZ-900 - Nivel Avanzado</CardTitle>
            <CardDescription>30 preguntas basadas en escenarios • 45 minutos • Se requiere 70% para aprobar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
              <div className="flex items-start gap-2 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>Este examen es más difícil que el Examen #1. Las preguntas están basadas en escenarios reales y requieren comprensión profunda de los conceptos de Azure.</p>
              </div>
            </div>

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
              {passed ? "¡Excelente! Dominaste las preguntas avanzadas del AZ-900" : "Necesitas 70% para aprobar. Revisa los escenarios y vuelve a intentar."}
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">AZ-900 Examen #2</h1>
            <Badge variant="destructive" className="text-xs">Avanzado</Badge>
          </div>
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
          <CardTitle className="text-xl leading-relaxed">{question.question}</CardTitle>
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

export default AzureFundamentalsExam2;
