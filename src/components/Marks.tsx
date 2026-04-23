import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Plus, Edit2, Save, X, Search, Filter } from "lucide-react";
import { cn } from "../lib/utils";

interface MarkRecord {
  id: string;
  student_name: string;
  enrollment_no: string;
  component: string;
  obtained_marks: number;
  max_marks: number;
}

export default function Marks() {
  const { profile } = useAuth();
  if (!profile) return null;

  return profile.role === "teacher" ? <TeacherMarks /> : <StudentMarks />;
}

function TeacherMarks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const mockMarks: MarkRecord[] = [
    { id: "1", student_name: "Kanishka Banswal", enrollment_no: "06201032024", component: "Mid-term", obtained_marks: 42, max_marks: 50 },
    { id: "2", student_name: "Rahul Sharma", enrollment_no: "06301032024", component: "Mid-term", obtained_marks: 38, max_marks: 50 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Marks Management</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">
          <Plus className="w-5 h-5" /> Add Component
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Component</th>
              <th className="px-6 py-4">Obtained</th>
              <th className="px-6 py-4">Max</th>
              <th className="px-6 py-4">Percentage</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {mockMarks.map(mark => (
              <tr key={mark.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold text-gray-900">{mark.student_name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{mark.component}</td>
                <td className="px-6 py-4">
                  {editingId === mark.id ? (
                    <input type="number" defaultValue={mark.obtained_marks} className="w-16 px-2 py-1 border rounded" />
                  ) : mark.obtained_marks}
                </td>
                <td className="px-6 py-4 text-sm font-medium">{mark.max_marks}</td>
                <td className="px-6 py-4 text-sm font-black text-indigo-600">
                  {Math.round((mark.obtained_marks / mark.max_marks) * 100)}%
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setEditingId(editingId === mark.id ? null : mark.id)} className="text-gray-400 hover:text-indigo-600">
                    {editingId === mark.id ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudentMarks() {
  const chartData = [
    { subject: "Math", percentage: 85 },
    { subject: "DS", percentage: 78 },
    { subject: "Web", percentage: 92 },
    { subject: "OS", percentage: 74 },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Academic Marks</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 italic">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Subject-wise Performance</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.percentage > 80 ? "#4f46e5" : "#6366f1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Component</th>
                <th className="px-6 py-4">Obtained</th>
                <th className="px-6 py-4">Max</th>
                <th className="px-6 py-4">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { name: "Mid-term (Math)", got: 42, max: 50 },
                { name: "Assignment 1 (DS)", got: 9, max: 10 },
                { name: "Quiz 1 (Web)", got: 18, max: 20 },
              ].map((m, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 font-bold text-gray-900">{m.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{m.got}</td>
                  <td className="px-6 py-4 text-sm font-medium">{m.max}</td>
                  <td className="px-6 py-4 font-black text-indigo-600">{Math.round((m.got/m.max)*100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
