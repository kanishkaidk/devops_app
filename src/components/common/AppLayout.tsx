import React from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { OnboardingForm } from "../OnboardingForm";

export function AppLayout({ requiredRole }: { requiredRole?: string }) {
  const { user, profile, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bento-card text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Access Restricted</h2>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (profile?.role === "pending") {
    return <OnboardingForm />;
  }

  if (requiredRole && profile?.role !== requiredRole && profile?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <Sidebar />
      <main className="flex-1 p-8 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
