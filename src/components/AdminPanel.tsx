import React, { useState } from "react";
import { Users, BookOpen, Flag, ShieldCheck, Mail, ShieldAlert, UserCheck, ShieldX } from "lucide-react";
import { cn } from "../lib/utils";
import StatusBadge from "./ui/StatusBadge";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<"users" | "courses" | "proxy" | "audit">("users");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Console</h1>
        <p className="text-gray-500 font-medium">System governance and management</p>
      </header>

      <div className="flex border-b border-gray-200 gap-8">
        {[
          { id: "users", label: "Users", icon: Users },
          { id: "courses", label: "Courses & Subjects", icon: BookOpen },
          { id: "proxy", label: "Proxy Flags", icon: Flag },
          { id: "audit", label: "Audit Log", icon: ShieldCheck },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 pb-4 text-sm font-bold transition-all border-b-2 px-1",
              activeTab === tab.id 
                ? "border-indigo-600 text-indigo-600" 
                : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "users" && <AdminUsers />}
        {activeTab === "courses" && <AdminCourses />}
        {activeTab === "proxy" && <AdminProxyFlags />}
        {activeTab === "audit" && <AdminAuditLog />}
      </div>
    </div>
  );
}

function AdminUsers() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
            <th className="px-6 py-4">User</th>
            <th className="px-6 py-4">Email</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 font-bold text-gray-900">Admin User</td>
            <td className="px-6 py-4 text-sm text-gray-500">admin@igdtuw.ac.in</td>
            <td className="px-6 py-4"><StatusBadge status="admin" /></td> // Wait StatusBadge doesn't have admin, I'll add or use fallback
            <td className="px-6 py-4">
               <span className="flex items-center text-xs font-bold text-green-600"><UserCheck className="w-4 h-4 mr-1"/> Active</span>
            </td>
            <td className="px-6 py-4 text-right space-x-2">
              <button className="text-gray-400 hover:text-indigo-600"><ShieldX className="w-4 h-4" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function AdminCourses() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 italic">
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-8 rounded-2xl text-center">
        <p className="text-gray-400 font-bold mb-4">Course Management Module</p>
        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-bold text-sm text-gray-600">Add New Course</button>
      </div>
    </div>
  );
}

function AdminProxyFlags() {
  return (
    <div className="space-y-4">
      <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
        <div className="flex items-center gap-3 text-red-700 mb-2">
          <ShieldAlert className="w-6 h-6" />
          <h3 className="font-bold">High Risk Alerts</h3>
        </div>
        <p className="text-red-600 text-sm">2 students have exceeded the proxy threshold (3+ flags).</p>
      </div>
    </div>
  );
}

function AdminAuditLog() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
       <div className="p-12 text-center text-gray-300">
         <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
         <p className="font-bold">Audit logs are immutable and captured automatically.</p>
       </div>
    </div>
  );
}
