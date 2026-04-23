import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { LogOut, Shield, User, BookOpen, Clock, ClipboardList } from "lucide-react";
import { cn } from "../../lib/utils";

export function Sidebar() {
  const { profile, logout, adminViewMode, setAdminViewMode } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const menuItems = {
    admin: [
      { label: "Admin Space", path: "/", icon: Shield, mode: "admin" },
      { label: "Teacher View", path: "/", icon: Clock, mode: "teacher" },
      { label: "Student View", path: "/", icon: BookOpen, mode: "student" },
      { label: "Users Registry", path: "/admin/users", icon: User },
      { label: "Subject Control", path: "/admin/subjects", icon: BookOpen },
    ],
    teacher: [
      { label: "Console", path: "/", icon: Clock },
      { label: "Classes", path: "/teacher/classes", icon: BookOpen },
      { label: "Assignments", path: "/teacher/assignments", icon: ClipboardList },
    ],
    student: [
      { label: "Portal", path: "/", icon: BookOpen },
      { label: "Attendance", path: "/student/attendance", icon: Clock },
      { label: "Marks", path: "/student/marks", icon: ClipboardList },
    ],
  };

  const nav = profile?.role ? (menuItems as any)[profile.role] : [];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col p-6">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">P</div>
        <span className="font-extrabold text-xl tracking-tight text-gray-900 leading-none">IGDTUW <span className="text-indigo-600">Portal</span></span>
      </div>

      <nav className="flex-1 space-y-2">
        {nav.map((item: any) => {
           const isActive = item.mode ? adminViewMode === item.mode : false;
           return (
            <button
              key={item.label}
              onClick={() => {
                if (item.mode) setAdminViewMode(item.mode);
                navigate(item.path);
              }}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all border",
                isActive 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 border-indigo-500" 
                  : "text-gray-600 hover:bg-gray-50 border-transparent"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-indigo-600")} />
              {item.label}
            </button>
           )
        })}
      </nav>

      <div className="pt-6 border-t border-gray-100 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
