import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import ProjectCreationWizard from "@/components/ProjectCreationWizard";

export default function Create() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/api/login");
    }
  }, [isLoading, isAuthenticated, navigate]);
  
  // If still loading or not authenticated, show loading state
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-indigo-400 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Crea Nuovo Progetto</h1>
          <p className="mt-2 text-sm text-gray-600">
            Segui i passaggi per configurare il tuo nuovo progetto video.
          </p>
        </div>
        
        <ProjectCreationWizard 
          userId={user?.id || ""}
          onSuccess={(project) => {
            navigate(`/editor/${project.id}`);
          }}
        />
      </div>
    </div>
  );
}