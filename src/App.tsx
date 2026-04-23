import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import Login from "./components/Login";
import { AppLayout } from "./components/common/AppLayout";

// Console Components
import StudentDashboard from "./components/student/StudentDashboard";
import TeacherConsole from "./components/teacher/TeacherConsole";
import AdminDashboard from "./components/admin/AdminDashboard";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Main Dashboard Router */}
          <Route element={<AppLayout />}>
            <Route index element={<DashboardRouter />} />
          </Route>

          {/* Admin Specific Routes */}
          <Route path="/admin" element={<AppLayout requiredRole="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminDashboard />} />
            <Route path="subjects" element={<AdminDashboard />} />
          </Route>

          {/* Teacher Specific Routes */}
          <Route path="/teacher" element={<AppLayout requiredRole="teacher" />}>
            <Route index element={<TeacherConsole />} />
            <Route path="classes" element={<TeacherConsole />} />
            <Route path="assignments" element={<TeacherConsole />} />
          </Route>

          {/* Student Specific Routes */}
          <Route path="/student" element={<AppLayout requiredRole="student" />}>
            <Route index element={<StudentDashboard />} />
            <Route path="attendance" element={<StudentDashboard />} />
            <Route path="marks" element={<StudentDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Simple router to land on the correct role dashboard from root "/"
import { useAuth, AdminViewMode } from "./components/AuthContext";

function DashboardRouter() {
  const { profile, adminViewMode } = useAuth();
  
  const activeRole = profile?.role === "admin" ? (adminViewMode || "admin") : profile?.role;

  if (activeRole === "admin") return <AdminDashboard />;
  if (activeRole === "teacher") return <TeacherConsole />;
  if (activeRole === "student") return <StudentDashboard />;
  
  if (profile?.role === "pending") return null; // Handled by AppLayout

  return (
    <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 italic text-gray-400">
      Account configuration pending...
    </div>
  );
}
