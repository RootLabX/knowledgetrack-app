import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Code,
  Database,
  GitBranch,
  Brain,
  Server,
  Globe,
  Layout,
  Shield,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useAchievements } from "@/hooks/useAchievements";
import { AchievementNotification } from "@/components/gamification/AchievementNotification";

interface Question {
  id: number;
  category: string;
  section: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

const SECTIONS = [
  { id: "git", name: "Git y Control de Versiones", icon: GitBranch, questionCount: 12 },
  { id: "sql", name: "SQL y Bases de Datos", icon: Database, questionCount: 13 },
  { id: "patterns", name: "Patrones de Diseño y Arquitectura", icon: Code, questionCount: 11 },
  { id: "ai", name: "Inteligencia Artificial", icon: Brain, questionCount: 8 },
  { id: "devops", name: "Infraestructura y DevOps", icon: Server, questionCount: 6 },
  { id: "networks", name: "Internet y Redes", icon: Globe, questionCount: 5 },
  { id: "frontend", name: "Frontend y Navegadores", icon: Layout, questionCount: 6 },
  { id: "security", name: "Protocolos y Seguridad", icon: Shield, questionCount: 9 },
  { id: "teamwork", name: "Trabajo en Equipo y Calidad", icon: Users, questionCount: 5 },
];

// All 75 questions organized by section
const allQuestions: Question[] = [
  // GIT Y CONTROL DE VERSIONES (12 preguntas)
  { id: 1, category: "Git", section: "git", question: "¿Cuál es el propósito del comando git init?", options: ["Descargar un repositorio existente desde un servidor remoto", "Crear un nuevo repositorio de Git vacío en el directorio actual", "Añadir los cambios actuales al área de preparación (staging area)", "Confirmar los cambios en el historial del repositorio"], correctAnswer: 1 },
  { id: 2, category: "Git", section: "git", question: "En Git, ¿cuál es la diferencia principal entre git pull y git fetch?", options: ["git pull solo descarga cambios, mientras que git fetch descarga y fusiona", "git fetch descarga los cambios del remoto sin fusionarlos; git pull hace un fetch seguido de un merge", "No hay diferencia, son alias para el mismo comando", "git fetch se usa para subir cambios y git pull para bajarlos"], correctAnswer: 1 },
  { id: 3, category: "Git", section: "git", question: "¿Qué comando de Git se utiliza para guardar los cambios temporalmente sin hacer un commit?", options: ["git hide", "git stash", "git ignore", "git cache"], correctAnswer: 1 },
  { id: 4, category: "Git", section: "git", question: "¿Qué representa HEAD en Git?", options: ["El primer commit del repositorio", "La rama principal (master/main) del repositorio", "Un puntero al commit/rama actual en el que estás trabajando", "El último commit subido al servidor remoto"], correctAnswer: 2 },
  { id: 5, category: "Git", section: "git", question: "¿Cuál es el propósito del archivo .gitignore?", options: ["Evitar que Git elimine archivos importantes", "Especificar archivos y directorios que Git debe ignorar intencionalmente y no rastrear", "Listar los archivos que se deben borrar al hacer un merge", "Guardar contraseñas de forma segura"], correctAnswer: 1 },
  { id: 6, category: "Git", section: "git", question: "¿Qué hace el comando git cherry-pick <commit-hash>?", options: ["Elimina un commit específico del historial", "Aplica los cambios introducidos por un commit específico de otra rama en la rama actual", "Busca un commit perdido en el reflog", "Fusiona toda la rama donde se encuentra ese commit"], correctAnswer: 1 },
  { id: 7, category: "Git", section: "git", question: "¿Cuál es la diferencia entre git merge y git rebase al integrar cambios?", options: ["merge reescribe la historia, rebase crea un commit de fusión", "merge conserva la historia tal cual ocurrió (commit de unión), rebase reescribe la historia para que sea lineal", "rebase es solo para ramas locales y merge para remotas", "No hay diferencia funcional, es solo preferencia estética"], correctAnswer: 1 },
  { id: 8, category: "Git", section: "git", question: "¿Qué comando usarías para deshacer el último commit (sin borrar los cambios del directorio de trabajo)?", options: ["git checkout .", "git commit --amend", "git reset --soft HEAD~1", "git reset --hard HEAD~1"], correctAnswer: 2 },
  { id: 9, category: "Git", section: "git", question: "En el contexto de Git Flow, ¿para qué se utiliza normalmente la rama develop?", options: ["Para código listo para producción", "Como rama de integración principal para las características (features) en desarrollo", "Solo para corregir errores urgentes (hotfixes)", "Para almacenar configuraciones del entorno local"], correctAnswer: 1 },
  { id: 10, category: "Git", section: "git", question: "¿Qué significa que Git es un sistema de control de versiones 'distribuido'?", options: ["Que el código se ejecuta en varios servidores a la vez", "Que cada desarrollador tiene una copia completa del historial del repositorio en su máquina", "Que los archivos se guardan en diferentes carpetas del disco duro", "Que requiere conexión a internet permanente para funcionar"], correctAnswer: 1 },
  { id: 11, category: "Git", section: "git", question: "¿Para qué sirve git blame <archivo>?", options: ["Para borrar un archivo y culpar a otro usuario", "Para ver qué revisión y autor modificó por última vez cada línea de un archivo", "Para encontrar errores de sintaxis en el código", "Para revertir los cambios de un usuario específico"], correctAnswer: 1 },
  { id: 12, category: "Git", section: "git", question: "¿Qué es un 'Fork' en plataformas como GitHub/GitLab?", options: ["Una nueva rama dentro del mismo repositorio", "Una copia personal de un repositorio de otro usuario que vive en tu cuenta", "Una herramienta para resolver conflictos de fusión", "Un tipo de etiqueta (tag) para versiones"], correctAnswer: 1 },

  // SQL Y BASES DE DATOS (13 preguntas)
  { id: 13, category: "SQL", section: "sql", question: "En SQL, ¿cuál comando se usa para recuperar datos de una base de datos?", options: ["GET", "EXTRACT", "SELECT", "PULL"], correctAnswer: 2 },
  { id: 14, category: "SQL", section: "sql", question: "¿Cuál es la función de la cláusula WHERE en una consulta SQL?", options: ["Ordenar los resultados", "Agrupar filas con valores idénticos", "Filtrar los registros que cumplen una condición específica", "Especificar qué columnas mostrar"], correctAnswer: 2 },
  { id: 15, category: "SQL", section: "sql", question: "¿Qué diferencia hay entre INNER JOIN y LEFT JOIN?", options: ["INNER JOIN devuelve todas las filas; LEFT JOIN solo las de la izquierda", "INNER JOIN devuelve solo filas con coincidencias en ambas tablas; LEFT JOIN devuelve todas las de la izquierda y las coincidentes de la derecha", "LEFT JOIN es más rápido que INNER JOIN", "INNER JOIN no permite valores nulos, LEFT JOIN sí"], correctAnswer: 1 },
  { id: 16, category: "SQL", section: "sql", question: "¿Para qué se utiliza la cláusula GROUP BY?", options: ["Para ordenar los resultados alfabéticamente", "Para agrupar filas con los mismos valores, usualmente con funciones de agregación (SUM, COUNT)", "Para unir dos tablas", "Para filtrar grupos de datos después de agregarlos"], correctAnswer: 1 },
  { id: 17, category: "SQL", section: "sql", question: "¿Qué es una Clave Primaria (Primary Key)?", options: ["Una columna que contiene solo texto", "Un campo que identifica de forma única cada registro en una tabla y no puede ser NULL", "Una clave para encriptar la base de datos", "Una columna que referencia a otra tabla"], correctAnswer: 1 },
  { id: 18, category: "SQL", section: "sql", question: "¿Qué propiedad ACID asegura que una transacción se realiza por completo o no se realiza en absoluto?", options: ["Atomicidad (Atomicity)", "Consistencia (Consistency)", "Aislamiento (Isolation)", "Durabilidad (Durability)"], correctAnswer: 0 },
  { id: 19, category: "SQL", section: "sql", question: "¿Cuál es la función de HAVING y en qué se diferencia de WHERE?", options: ["Son intercambiables", "WHERE filtra filas antes de agrupar; HAVING filtra grupos después de agrupar", "HAVING es más rápido que WHERE", "HAVING se usa solo con JOIN"], correctAnswer: 1 },
  { id: 20, category: "SQL", section: "sql", question: "¿Qué es la Normalización en bases de datos?", options: ["El proceso de hacer copias de seguridad", "Técnica para organizar datos para reducir la redundancia y mejorar la integridad", "Convertir todos los textos a mayúsculas", "Crear índices para todas las columnas"], correctAnswer: 1 },
  { id: 21, category: "SQL", section: "sql", question: "¿Qué hace un índice (INDEX) en una tabla SQL?", options: ["Organiza físicamente los datos en el disco para ahorrar espacio", "Mejora la velocidad de recuperación de datos a costa de ralentizar la escritura", "Encripta los datos para mayor seguridad", "Garantiza que no haya duplicados (si no es UNIQUE)"], correctAnswer: 1 },
  { id: 22, category: "SQL", section: "sql", question: "¿Cómo previenes la Inyección SQL en tu código?", options: ["Usando consultas parametrizadas (Prepared Statements)", "Validando que el usuario no escriba espacios", "Usando solo procedimientos almacenados", "Ocultando los mensajes de error de la base de datos"], correctAnswer: 0 },
  { id: 23, category: "SQL", section: "sql", question: "¿Qué resultado da SELECT count(*) FROM tabla si la tabla tiene filas con valores NULL?", options: ["Cuenta solo las filas que no tienen NULLs", "Da error", "Cuenta el número total de filas, independientemente de los valores NULL", "Devuelve NULL"], correctAnswer: 2 },
  { id: 24, category: "SQL", section: "sql", question: "¿Qué es una Clave Foránea (Foreign Key)?", options: ["Una clave que viene de una base de datos externa", "Un campo que establece una relación con la Clave Primaria de otra tabla", "Una contraseña para usuarios extranjeros", "Un tipo de índice especial para búsquedas de texto"], correctAnswer: 1 },
  { id: 25, category: "SQL", section: "sql", question: "¿Qué significa que una base de datos sea relacional (RDBMS)?", options: ["Que almacena datos en documentos JSON", "Que organiza los datos en tablas con filas y columnas relacionadas entre sí", "Que solo permite relaciones de amistad entre usuarios", "Que usa grafos para conectar datos"], correctAnswer: 1 },

  // PATRONES DE DISEÑO Y ARQUITECTURA (11 preguntas)
  { id: 26, category: "Patrones de Diseño", section: "patterns", question: "¿Cuál es la idea principal del patrón de diseño Singleton?", options: ["Crear familias de objetos relacionados", "Asegurar que una clase tenga una única instancia y proporcionar un punto de acceso global a ella", "Permitir que un objeto cambie su comportamiento cuando cambia su estado", "Separar la construcción de un objeto complejo de su representación"], correctAnswer: 1 },
  { id: 27, category: "Patrones de Diseño", section: "patterns", question: "¿Qué problema resuelve el patrón Factory Method?", options: ["La incompatibilidad de interfaces", "La creación de objetos sin especificar la clase exacta del objeto que se creará", "La notificación a múltiples objetos sobre cambios", "La complejidad de un subsistema grande"], correctAnswer: 1 },
  { id: 28, category: "Patrones de Diseño", section: "patterns", question: "En el patrón Observer, ¿qué sucede cuando el sujeto (Subject) cambia de estado?", options: ["Se crea una nueva instancia del sujeto", "Notifica automáticamente a todos sus observadores registrados", "Los observadores deben consultar periódicamente al sujeto", "El sujeto se bloquea hasta que alguien lo lea"], correctAnswer: 1 },
  { id: 29, category: "Patrones de Diseño", section: "patterns", question: "¿Cuál es el objetivo del patrón Strategy?", options: ["Definir una familia de algoritmos, encapsularlos y hacerlos intercambiables", "Restringir el acceso a un objeto", "Añadir responsabilidades a objetos dinámicamente", "Coordinar el flujo de control entre objetos"], correctAnswer: 0 },
  { id: 30, category: "Patrones de Diseño", section: "patterns", question: "¿Qué diferencia principal hay entre el patrón Decorator y la Herencia tradicional?", options: ["El Decorator es estático, la herencia es dinámica", "El Decorator permite añadir comportamiento a un objeto individual dinámicamente; la herencia afecta a toda la clase", "La herencia usa composición, el Decorator usa extensión", "No hay diferencia"], correctAnswer: 1 },
  { id: 31, category: "Patrones de Diseño", section: "patterns", question: "¿Qué hace el patrón Adapter?", options: ["Adapta una clase para que tenga una sola instancia", "Permite que clases con interfaces incompatibles trabajen juntas", "Adapta el rendimiento del sistema", "Crea una interfaz simplificada para un sistema complejo"], correctAnswer: 1 },
  { id: 32, category: "Arquitectura", section: "patterns", question: "En MVC (Modelo-Vista-Controlador), ¿cuál es la responsabilidad del Controlador?", options: ["Mostrar los datos al usuario", "Manejar la lógica de negocio y los datos", "Recibir las entradas del usuario y coordinar entre el Modelo y la Vista", "Guardar los datos en la base de datos"], correctAnswer: 2 },
  { id: 33, category: "Arquitectura", section: "patterns", question: "¿Qué principio SOLID establece que 'Una clase debe tener una sola razón para cambiar'?", options: ["Single Responsibility Principle (SRP)", "Open/Closed Principle", "Liskov Substitution Principle", "Interface Segregation Principle"], correctAnswer: 0 },
  { id: 34, category: "Arquitectura", section: "patterns", question: "¿Qué es la Inyección de Dependencias (Dependency Injection)?", options: ["Una vulnerabilidad de seguridad", "Un patrón donde los objetos reciben sus dependencias desde fuera en lugar de crearlas ellos mismos", "Instalar librerías con npm o pip", "Heredar de muchas clases a la vez"], correctAnswer: 1 },
  { id: 35, category: "Patrones de Diseño", section: "patterns", question: "¿Qué patrón estructural proporciona una interfaz unificada y simplificada para un subsistema complejo?", options: ["Facade", "Proxy", "Composite", "Flyweight"], correctAnswer: 0 },
  { id: 36, category: "Arquitectura", section: "patterns", question: "¿Qué significa el principio Open/Closed (O en SOLID)?", options: ["El código debe ser de código abierto", "Las entidades de software deben estar abiertas para su extensión, pero cerradas para su modificación", "Las conexiones a BD deben abrirse y cerrarse rápido", "El código debe estar cerrado a extraños"], correctAnswer: 1 },

  // INTELIGENCIA ARTIFICIAL (8 preguntas)
  { id: 37, category: "Inteligencia Artificial", section: "ai", question: "¿Cuál es la diferencia entre IA Débil (Narrow) e IA Fuerte (General)?", options: ["La IA débil no usa electricidad", "La IA débil es específica para una tarea; la IA fuerte tiene capacidad cognitiva general similar a la humana", "La IA fuerte es la que usa redes neuronales, la débil usa if-else", "No hay diferencia"], correctAnswer: 1 },
  { id: 38, category: "Inteligencia Artificial", section: "ai", question: "En Machine Learning, ¿qué es el 'Aprendizaje Supervisado'?", options: ["Cuando un humano vigila a la máquina mientras aprende", "Entrenar un modelo usando datos que ya tienen la respuesta correcta (etiquetas)", "Dejar que la máquina encuentre patrones en datos sin etiquetas", "Aprendizaje basado en recompensas y castigos"], correctAnswer: 1 },
  { id: 39, category: "Inteligencia Artificial", section: "ai", question: "¿Qué es el 'Overfitting' (Sobreajuste)?", options: ["Cuando el modelo es demasiado simple y no aprende nada", "Cuando el modelo memoriza los datos de entrenamiento (ruido incluido) y falla en datos nuevos", "Cuando el entrenamiento toma demasiado tiempo", "Cuando usas demasiados datos"], correctAnswer: 1 },
  { id: 40, category: "Inteligencia Artificial", section: "ai", question: "¿Qué diferencia hay entre parámetros y hiperparámetros en una red neuronal?", options: ["Los parámetros se aprenden durante el entrenamiento; los hiperparámetros se configuran antes", "Son lo mismo", "Los parámetros los pone el usuario, los hiperparámetros la máquina", "Los hiperparámetros son más rápidos"], correctAnswer: 0 },
  { id: 41, category: "Inteligencia Artificial", section: "ai", question: "¿Qué es una 'Alucinación' en el contexto de Modelos de Lenguaje (LLMs)?", options: ["Cuando el modelo se vuelve consciente", "Cuando el modelo genera información incorrecta o inventada pero con gran confianza", "Cuando el modelo se bloquea", "Cuando el modelo ve imágenes"], correctAnswer: 1 },
  { id: 42, category: "Inteligencia Artificial", section: "ai", question: "¿Para qué se divide el dataset en Entrenamiento (Train) y Prueba (Test)?", options: ["Para entrenar dos veces y ser más seguro", "Para evaluar el rendimiento del modelo en datos que nunca ha visto", "Porque la memoria RAM no aguanta todos los datos", "Para hacer el proceso más rápido"], correctAnswer: 1 },
  { id: 43, category: "Inteligencia Artificial", section: "ai", question: "¿Qué es la 'Tokenización' en el procesamiento de lenguaje natural (NLP)?", options: ["Pagar con criptomonedas", "Dividir el texto en unidades más pequeñas (tokens) para que el modelo las procese", "Traducir el texto a otro idioma", "Eliminar las palabras ofensivas"], correctAnswer: 1 },
  { id: 44, category: "Inteligencia Artificial", section: "ai", question: "¿Qué es el sesgo (Bias) en los datos de entrenamiento de IA?", options: ["Un error de programación", "Cuando los datos no representan fielmente la realidad o contienen prejuicios, llevando a decisiones injustas", "La velocidad de aprendizaje", "El peso de la red neuronal"], correctAnswer: 1 },

  // INFRAESTRUCTURA Y DEVOPS (6 preguntas)
  { id: 45, category: "DevOps", section: "devops", question: "En el contexto de APIs REST, ¿qué código de estado HTTP indica que un recurso fue creado exitosamente?", options: ["200 OK", "201 Created", "404 Not Found", "500 Internal Server Error"], correctAnswer: 1 },
  { id: 46, category: "DevOps", section: "devops", question: "¿Qué es un Contenedor (ej. Docker) y en qué se diferencia de una Máquina Virtual (VM)?", options: ["Los contenedores virtualizan el hardware; las VMs el sistema operativo", "Los contenedores comparten el kernel del host (son ligeros); las VMs cargan un OS completo (son pesadas)", "Los contenedores solo funcionan en Linux", "No hay diferencia"], correctAnswer: 1 },
  { id: 47, category: "DevOps", section: "devops", question: "¿Qué significa CI/CD?", options: ["Code Integration / Code Destruction", "Continuous Integration / Continuous Delivery (or Deployment)", "Computer Interface / Computer Design", "Compiler Internal / Compiler Debugger"], correctAnswer: 1 },
  { id: 48, category: "Arquitectura", section: "devops", question: "En el principio 'Composition over Inheritance', ¿qué se sugiere?", options: ["Usar siempre herencia porque es más fácil", "Es preferible construir objetos complejos combinando objetos más simples ('tiene-un') en lugar de herencia rígida", "Nunca usar clases", "Que la herencia está prohibida"], correctAnswer: 1 },
  { id: 49, category: "DevOps", section: "devops", question: "¿Qué es un microservicio?", options: ["Un servicio que atiende a un solo usuario", "Una aplicación monolítica pequeña", "Una arquitectura donde una aplicación es una colección de servicios pequeños, autónomos y desplegables independientemente", "Un servicio web lento"], correctAnswer: 2 },
  { id: 50, category: "DevOps", section: "devops", question: "¿Qué es 'Technical Debt' (Deuda Técnica)?", options: ["Dinero que debe la empresa de software", "El costo implícito de retrabajo futuro causado por elegir una solución rápida ahora en lugar de una mejor", "Errores que no se pueden arreglar", "Hardware obsoleto"], correctAnswer: 1 },

  // INTERNET Y REDES (5 preguntas)
  { id: 51, category: "Redes", section: "networks", question: "¿Qué función principal cumple un servidor DNS?", options: ["Encriptar la conexión entre el usuario y el servidor", "Traducir nombres de dominio a direcciones IP numéricas", "Almacenar el historial de navegación del usuario", "Comprimir los archivos para que la web cargue rápido"], correctAnswer: 1 },
  { id: 52, category: "Redes", section: "networks", question: "¿Cuál es la diferencia fundamental entre el protocolo TCP y UDP?", options: ["TCP es más rápido pero pierde datos; UDP es lento pero seguro", "TCP garantiza la entrega y el orden de los paquetes (fiabilidad); UDP no garantiza entrega (velocidad)", "UDP se usa solo para enviar correos electrónicos", "Son protocolos idénticos, solo cambia el nombre"], correctAnswer: 1 },
  { id: 53, category: "Redes", section: "networks", question: "En una URL, ¿cuál es el puerto estándar para HTTPS?", options: ["80", "21", "443", "8080"], correctAnswer: 2 },
  { id: 54, category: "Redes", section: "networks", question: "¿Qué es una CDN (Content Delivery Network)?", options: ["Un sistema de base de datos distribuido", "Una red de servidores geográficamente distribuidos para servir contenido estático con menor latencia", "Un protocolo para transferir archivos grandes", "Una red social para desarrolladores"], correctAnswer: 1 },
  { id: 55, category: "Redes", section: "networks", question: "¿Qué ocurre durante el 'Handshake' en SSL/TLS?", options: ["El servidor le pide la contraseña al usuario", "Cliente y servidor negocian la encriptación y validan la identidad mediante certificados", "Se descarga todo el contenido de la página web", "Se borran las cookies del navegador"], correctAnswer: 1 },

  // FRONTEND Y NAVEGADORES (6 preguntas)
  { id: 56, category: "Frontend", section: "frontend", question: "¿Qué es el DOM (Document Object Model)?", options: ["Un lenguaje de programación similar a Java", "Una representación en árbol de la estructura del documento HTML que el navegador crea en memoria", "El estilo visual de la página web (CSS)", "Una base de datos local del navegador"], correctAnswer: 1 },
  { id: 57, category: "Frontend", section: "frontend", question: "Según el 'CSS Box Model', ¿cuál es el orden de las capas desde adentro hacia afuera?", options: ["Margin, Border, Padding, Content", "Content, Padding, Border, Margin", "Border, Content, Margin, Padding", "Padding, Margin, Content, Border"], correctAnswer: 1 },
  { id: 58, category: "Frontend", section: "frontend", question: "¿Cuál es la diferencia principal entre localStorage y sessionStorage?", options: ["localStorage tiene más capacidad que sessionStorage", "localStorage persiste indefinidamente; sessionStorage se borra al cerrar la pestaña", "sessionStorage se guarda en el servidor; localStorage en el navegador", "No hay diferencia"], correctAnswer: 1 },
  { id: 59, category: "Frontend", section: "frontend", question: "¿Qué permite hacer el 'Event Loop' en JavaScript?", options: ["Ejecutar código Java dentro del navegador", "Realizar operaciones no bloqueantes (asíncronas) a pesar de que JS es single-threaded", "Crear bucles infinitos sin colgar el navegador", "Conectar con bases de datos SQL directamente"], correctAnswer: 1 },
  { id: 60, category: "Frontend", section: "frontend", question: "¿Qué significa que un diseño web sea 'Responsive'?", options: ["Que responde muy rápido a los clics", "Que el diseño se adapta fluidamente a diferentes tamaños de pantalla (móvil, tablet, escritorio)", "Que usa inteligencia artificial para mostrar contenido", "Que está programado en React"], correctAnswer: 1 },
  { id: 61, category: "Frontend", section: "frontend", question: "¿Qué es el 'Critical Rendering Path'?", options: ["La ruta más corta entre el servidor y el cliente", "La secuencia de pasos que el navegador realiza para convertir HTML, CSS y JS en píxeles en pantalla", "Un error crítico que impide ver la página", "El camino que sigue el mouse del usuario"], correctAnswer: 1 },

  // PROTOCOLOS Y SEGURIDAD (9 preguntas)
  { id: 62, category: "Seguridad", section: "security", question: "¿Qué es CORS y por qué suele causar errores en desarrollo?", options: ["Un virus informático", "Una medida de seguridad del navegador que bloquea peticiones a dominios diferentes al de origen", "Un error de sintaxis en JavaScript", "Un protocolo de correo electrónico"], correctAnswer: 1 },
  { id: 63, category: "Seguridad", section: "security", question: "¿Cuál es la diferencia entre Autenticación y Autorización?", options: ["Autenticación es verificar permisos; Autorización es verificar identidad", "Autenticación es verificar identidad (Login); Autorización es verificar permisos (Roles)", "Son sinónimos", "La autorización ocurre antes que la autenticación"], correctAnswer: 1 },
  { id: 64, category: "Protocolos", section: "security", question: "¿Cuándo es preferible usar WebSockets en lugar de HTTP?", options: ["Para cargar imágenes estáticas", "Para aplicaciones en tiempo real (chats, juegos) que requieren comunicación bidireccional persistente", "Cuando el servidor es lento", "Para enviar formularios simples"], correctAnswer: 1 },
  { id: 65, category: "Protocolos", section: "security", question: "¿Por qué JSON es más popular que XML en las APIs modernas?", options: ["Porque JSON es más seguro", "Porque JSON es más ligero, menos verboso y se mapea nativamente a objetos JavaScript", "Porque XML ya no es compatible con los navegadores", "Porque JSON permite guardar imágenes binarias fácilmente"], correctAnswer: 1 },
  { id: 66, category: "Protocolos", section: "security", question: "¿Qué indica la cabecera HTTP Cache-Control?", options: ["Cuánto tiempo el navegador debe recordar la contraseña", "Por cuánto tiempo se puede guardar una copia local de un recurso para no volver a pedirlo al servidor", "El control de versiones de la API", "El tamaño de la memoria caché del servidor"], correctAnswer: 1 },
  { id: 67, category: "Seguridad", section: "security", question: "¿En qué consiste una vulnerabilidad XSS (Cross-Site Scripting)?", options: ["En adivinar la contraseña del administrador", "En inyectar scripts maliciosos en una web que luego se ejecutan en el navegador de otros usuarios", "En saturar el servidor con muchas peticiones (DDoS)", "En robar la base de datos completa mediante SQL"], correctAnswer: 1 },
  { id: 68, category: "Seguridad", section: "security", question: "¿Qué ataque previene el uso de tokens Anti-CSRF?", options: ["Que un atacante lea las contraseñas de la base de datos", "Que se engañe a un usuario autenticado para ejecutar acciones no deseadas sin su consentimiento", "Que se inyecte código SQL en el login", "Que el servidor se caiga por exceso de tráfico"], correctAnswer: 1 },
  { id: 69, category: "Seguridad", section: "security", question: "¿Cómo se deben almacenar las contraseñas en la base de datos?", options: ["En texto plano para poder recordarlas si el usuario la olvida", "Encriptadas con una clave reversible", "Hasheadas (con salt) usando algoritmos robustos como bcrypt o Argon2", "Codificadas en Base64"], correctAnswer: 2 },
  { id: 70, category: "Seguridad", section: "security", question: "¿Qué significa 'Sanitizar' una entrada de usuario?", options: ["Borrar los datos después de usarlos", "Limpiar o validar los datos recibidos para asegurar que no contengan código malicioso", "Convertir todos los datos a formato JSON", "Enviar los datos a un antivirus"], correctAnswer: 1 },

  // TRABAJO EN EQUIPO Y CALIDAD (5 preguntas)
  { id: 71, category: "Buenas Prácticas", section: "teamwork", question: "En un Pull Request, además de unir código, ¿cuál es el objetivo principal?", options: ["Comprobar quién escribe código más rápido", "Realizar una Code Review (revisión) para asegurar calidad y compartir conocimiento", "Generar documentación automática", "Desplegar a producción inmediatamente"], correctAnswer: 1 },
  { id: 72, category: "Buenas Prácticas", section: "teamwork", question: "En Semantic Versioning (ej: 1.0.0), ¿qué indica el primer número (MAJOR)?", options: ["Correcciones de errores pequeños", "Nuevas funcionalidades compatibles con lo anterior", "Cambios incompatibles con la versión anterior (Breaking Changes)", "El número de años del proyecto"], correctAnswer: 2 },
  { id: 73, category: "Buenas Prácticas", section: "teamwork", question: "¿Por qué NO se debe subir el archivo .env al repositorio?", options: ["Porque es un archivo muy pesado", "Porque contiene variables de entorno y secretos (claves, credenciales) que no deben ser públicos", "Porque Git no soporta archivos que empiezan con punto", "Porque provoca conflictos con el código fuente"], correctAnswer: 1 },
  { id: 74, category: "Buenas Prácticas", section: "teamwork", question: "¿Para qué sirven los 'Git Hooks' (ej: pre-commit)?", options: ["Para enganchar el repositorio a la nube", "Para ejecutar scripts automáticos (como tests o linters) antes o después de eventos de Git", "Para recuperar commits borrados", "Para visualizar el historial de ramas gráficamente"], correctAnswer: 1 },
  { id: 75, category: "Buenas Prácticas", section: "teamwork", question: "¿Qué diferencia hay entre CI (Continuous Integration) y CD (Continuous Deployment)?", options: ["CI es para backend, CD es para frontend", "CI integra y prueba el código automáticamente; CD automatiza el lanzamiento a producción", "CI es manual, CD es automático", "No hay diferencia, son lo mismo"], correctAnswer: 1 },
];

const Assessment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkAndUnlockAchievements } = useAchievements();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [existingAssessment, setExistingAssessment] = useState<any>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);
  const [showAchievementNotification, setShowAchievementNotification] = useState(false);

  const [canTakeAssessment, setCanTakeAssessment] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Fetch permissions
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("is_assessment_enabled")
          .eq("id", user.id)
          .single();

        if (!profileError && profileData) {
          setCanTakeAssessment(profileData.is_assessment_enabled || false);
        }

        // Fetch existing assessment
        const { data, error } = await supabase
          .schema("mapper")
          .from("assessments")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (data) setExistingAssessment(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchData();
  }, [user]);

  const startNewAssessment = () => {
    setExistingAssessment(null);
    setCurrentQuestion(0);
    setAnswers({});
    setIsCompleted(false);
    setAssessmentId(crypto.randomUUID());
  };

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion]: parseInt(value) });
  };

  const handleNext = () => {
    if (currentQuestion < allQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const finishAssessment = async () => {
    setSaving(true);
    const results = calculateResults();

    try {
      // Save to Supabase
      const { error } = await supabase
        .schema("mapper")
        .from("assessments")
        .insert([{
          user_id: user?.id,
          total_questions: results.total,
          correct_answers: results.correct,
          status: "completed",
          results: results.bySection,
          completed_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Check achievements
      const unlocked = await checkAndUnlockAchievements({
        assessmentCompleted: true,
        assessmentScore: results.percentage,
        sectionScores: Object.fromEntries(
          Object.entries(results.bySection).map(([k, v]) => [k, v.percentage])
        )
      });

      if (unlocked && unlocked.length > 0) {
        setUnlockedAchievements(unlocked);
        setShowAchievementNotification(true);
      }

      setIsCompleted(true);
      toast.success("Evaluación guardada exitosamente");
    } catch (error) {
      console.error("Error saving assessment:", error);
      toast.error("Error al guardar la evaluación");
    } finally {
      setSaving(false);
    }
  };

  const calculateResults = () => {
    let correct = 0;
    const bySection: Record<string, { correct: number; total: number; percentage: number }> = {};

    allQuestions.forEach((q, idx) => {
      if (!bySection[q.section]) {
        bySection[q.section] = { correct: 0, total: 0, percentage: 0 };
      }
      bySection[q.section].total++;

      if (answers[idx] === q.correctAnswer) {
        correct++;
        bySection[q.section].correct++;
      }
    });

    Object.keys(bySection).forEach((section) => {
      bySection[section].percentage = Math.round(
        (bySection[section].correct / bySection[section].total) * 100
      );
    });

    return {
      correct,
      total: allQuestions.length,
      percentage: Math.round((correct / allQuestions.length) * 100),
      bySection,
    };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Git": return <GitBranch className="h-5 w-5" />;
      case "SQL": return <Database className="h-5 w-5" />;
      case "Inteligencia Artificial": return <Brain className="h-5 w-5" />;
      case "DevOps": return <Server className="h-5 w-5" />;
      case "Redes": return <Globe className="h-5 w-5" />;
      case "Frontend": return <Layout className="h-5 w-5" />;
      case "Seguridad":
      case "Protocolos": return <Shield className="h-5 w-5" />;
      case "Buenas Prácticas": return <Users className="h-5 w-5" />;
      default: return <Code className="h-5 w-5" />;
    }
  };

  // Show start screen
  if (!assessmentId && !isCompleted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Evaluación Técnica</h1>
          <p className="text-muted-foreground">
            Evalúa tus conocimientos en 9 áreas técnicas fundamentales
          </p>
        </div>

        {existingAssessment && (
          <Card className="border-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-accent" />
                Evaluación Anterior
              </CardTitle>
              <CardDescription>
                Completada el{" "}
                {new Date(existingAssessment.completed_at).toLocaleDateString("es-ES")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-primary">
                  {Math.round(
                    (existingAssessment.correct_answers / existingAssessment.total_questions) * 100
                  )}
                  %
                </div>
                <div className="text-sm text-muted-foreground">
                  {existingAssessment.correct_answers} de {existingAssessment.total_questions}{" "}
                  respuestas correctas
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Secciones de la Evaluación</CardTitle>
            <CardDescription>75 preguntas en total, organizada en 9 secciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {SECTIONS.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <section.icon className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{section.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {section.questionCount} preguntas
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={startNewAssessment}
              className="mt-6 w-full"
              disabled={!canTakeAssessment || loadingPermissions}
            >
              {loadingPermissions ? "Cargando..." : (
                existingAssessment ? "Realizar Nueva Evaluación" : "Comenzar Evaluación"
              )}
            </Button>
            {!canTakeAssessment && !loadingPermissions && (
              <p className="mt-3 text-center text-sm text-muted-foreground bg-secondary/50 p-2 rounded-md">
                Esta evaluación solo está habilitada por el administrador.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show results
  if (isCompleted) {
    const results = calculateResults();
    return (
      <>
        {showAchievementNotification && unlockedAchievements.length > 0 && (
          <AchievementNotification
            achievements={unlockedAchievements}
            onClose={() => setShowAchievementNotification(false)}
          />
        )}
        <div className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                <CheckCircle2 className="h-8 w-8 text-accent-foreground" />
              </div>
              <CardTitle className="text-2xl">¡Evaluación Completada!</CardTitle>
              <CardDescription>Aquí están tus resultados detallados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">{results.percentage}%</div>
                <p className="mt-2 text-muted-foreground">
                  {results.correct} de {results.total} respuestas correctas
                </p>
              </div>

              <Progress value={results.percentage} className="h-3" />

              <div className="space-y-4">
                <h3 className="font-semibold">Resultados por Sección</h3>
                {SECTIONS.map((section) => {
                  const sectionResult = results.bySection[section.id];
                  return (
                    <div key={section.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <section.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{section.name}</span>
                        </div>
                        <Badge
                          variant={
                            sectionResult?.percentage >= 70
                              ? "default"
                              : sectionResult?.percentage >= 50
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {sectionResult?.percentage || 0}%
                        </Badge>
                      </div>
                      <Progress value={sectionResult?.percentage || 0} className="h-2" />
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={() => navigate("/learning-path")} className="flex-1">
                  Ver Ruta de Aprendizaje
                </Button>
                <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                  Volver al Inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Show question
  const question = allQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / allQuestions.length) * 100;
  const currentSection = SECTIONS.find((s) => s.id === question.section);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Evaluación Técnica</h1>
          <span className="text-sm text-muted-foreground">
            Pregunta {currentQuestion + 1} de {allQuestions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          {currentSection && <currentSection.icon className="h-4 w-4" />}
          <span>{currentSection?.name}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            {getCategoryIcon(question.category)}
            <span>{question.category}</span>
          </div>
          <CardTitle className="text-xl">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            key={currentQuestion}
            value={answers[currentQuestion]?.toString() ?? ""}
            onValueChange={handleAnswer}
          >
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <RadioGroupItem
                    value={index.toString()}
                    id={`q${question.id}-option-${index}`}
                  />
                  <Label
                    htmlFor={`q${question.id}-option-${index}`}
                    className="flex-1 cursor-pointer"
                  >
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
              disabled={answers[currentQuestion] === undefined || saving}
              className="flex-1"
            >
              {saving
                ? "Guardando..."
                : currentQuestion === allQuestions.length - 1
                  ? "Finalizar"
                  : "Siguiente"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Assessment;
