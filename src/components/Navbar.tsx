import React from "react";
import { Link, useLocation } from "react-router-dom";
import { House, CalendarCheck, GraduationCap, ClipboardList, BookOpen, User, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "./AuthContext";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

const NAV_ITEMS = [
  { label: "Home", path: "/", icon: House },
  { label: "Attendance", path: "/attendance", icon: CalendarCheck },
  { label: "Marks", path: "/marks", icon: ClipboardList },
  { label: "Assignments", path: "/assignments", icon: BookOpen },
  { label: "Quiz", path: "/quiz", icon: GraduationCap },
];

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!user) return null;

  const items = profile?.role === "teacher" ? [
    { label: "Console", path: "/", icon: House },
    { label: "History", path: "/history", icon: ClipboardList },
  ] : NAV_ITEMS;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">I</div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900 leading-none">IGDTUW <span className="text-indigo-600">Portal</span></span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "border-indigo-600 text-gray-900" 
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    )}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
              {profile?.role === "admin" && (
                <Link
                  to="/admin"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                    location.pathname.startsWith("/admin")
                      ? "border-indigo-600 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  )}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <div className="flex items-center text-sm font-medium text-gray-700">
              <User className="w-4 h-4 mr-2" />
              <span className="max-w-[120px] truncate">{profile?.name || user.email}</span>
            </div>
            <button
              onClick={() => logout()}
              className="text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden bg-white border-b border-gray-200 overflow-hidden"
          >
            <div className="pt-2 pb-3 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                    location.pathname === item.path
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  )}
                >
                   <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200 px-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <User className="h-8 w-8 text-gray-400 bg-gray-100 p-1 rounded-full" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{profile?.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                >
                  Sign out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
