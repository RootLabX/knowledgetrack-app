import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Assessment from "./pages/Assessment";
import Courses from "./pages/Courses";
import Planning from "./pages/Planning";
import Objectives from "./pages/Objectives";
import PlanningDetail from "./pages/PlanningDetail";
import LearningPath from "./pages/LearningPath";
import Team from "./pages/Team";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import Achievements from "./pages/Achievements";
import Analytics from "./pages/Analytics";
import AzureFundamentals from "./pages/AzureFundamentals";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import SprintBoard from "./pages/SprintBoard";
import SprintPage from "./pages/SprintPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment"
              element={
                <ProtectedRoute>
                  <Assessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <Courses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/planning"
              element={
                <ProtectedRoute>
                  <Planning />
                </ProtectedRoute>
              }
            />
            <Route
              path="/objectives"
              element={
                <ProtectedRoute>
                  <Objectives />
                </ProtectedRoute>
              }
            />
            <Route
              path="/planning/:planId"
              element={
                <ProtectedRoute>
                  <PlanningDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/planning/board/:sprintId" element={
              <ProtectedRoute>
                <SprintBoard />
              </ProtectedRoute>
            } />
            <Route path="/planning/sprint/:sprintId" element={
              <ProtectedRoute>
                <SprintPage />
              </ProtectedRoute>
            } />
            <Route
              path="/learning-path"
              element={
                <ProtectedRoute>
                  <LearningPath />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  <Team />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/azure-fundamentals"
              element={
                <ProtectedRoute>
                  <AzureFundamentals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/achievements"
              element={
                <ProtectedRoute>
                  <Achievements />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
