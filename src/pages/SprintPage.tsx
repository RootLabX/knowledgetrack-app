import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import SprintBoard from "./SprintBoard";
export default function SprintPage() {
    // 1. EXTRAER EL ID DE LA URL
    // Buscamos 'id' o 'sprintId' para ser flexibles con tu configuración de rutas
    const params = useParams();
    const sprintId = params.id || params.sprintId;

    useEffect(() => {
        console.log("📍 SprintPage montada. Params:", params);
        console.log("🔑 ID detectado:", sprintId);
    }, [params, sprintId]);

    // 2. ESTADO DE ERROR: Si no hay ID en la URL
    if (!sprintId) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-slate-800">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md border border-red-100">
                    <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Error de Navegación</h2>
                    <p className="text-gray-500 mb-6">
                        No se encontró el ID del Sprint en la URL.
                    </p>
                    <Link
                        to="/planning"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Volver a Planificación
                    </Link>
                </div>
            </div>
        );
    }

    // 3. ÉXITO: Renderizamos el tablero pasando el ID
    return (
        <div className="h-full w-full bg-gray-50">
            <SprintBoard sprintId={sprintId} />
        </div>
    );
}