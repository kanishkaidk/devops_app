import React, { useState } from "react";
import { Search, Download, Edit3, Filter, MoreVertical } from "lucide-react";
import StatusBadge from "./ui/StatusBadge";
import { cn } from "../lib/utils";

interface StudentStats {
  id: string;
  name: string;
  enrollment: string;
  present: number;
  absent: number;
  late: number;
  flagged: number;
  percentage: number;
}

export default function TeacherAttendanceDashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  const students: StudentStats[] = [
    { id: "1", name: "Kanishka Banswal", enrollment: "06201032024", present: 24, absent: 2, late: 1, flagged: 0, percentage: 89 },
    { id: "2", name: "Rahul Sharma", enrollment: "06301032024", present: 18, absent: 8, late: 0, flagged: 1, percentage: 69 },
    { id: "3", name: "Priya Singh", enrollment: "06401032024", present: 22, absent: 4, late: 2, flagged: 0, percentage: 82 },
  ];

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.enrollment.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subject Attendance</h1>
          <p className="text-sm text-gray-500 font-medium italic">Data Structures (IT-1, 2024)</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or enrollment..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
          <button className="p-2 bg-gray-50 text-gray-500 rounded-lg border border-gray-200 hover:bg-gray-100">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Enrollment</th>
                <th className="px-6 py-4 text-center">P</th>
                <th className="px-6 py-4 text-center">A</th>
                <th className="px-6 py-4 text-center">L</th>
                <th className="px-6 py-4 text-center">F</th>
                <th className="px-6 py-4">Attendance</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">{student.enrollment}</td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-green-600">{student.present}</td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-red-600">{student.absent}</td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-amber-600">{student.late}</td>
                  <td className="px-6 py-4 text-center">
                    {student.flagged > 0 ? (
                      <StatusBadge status="proxy_flagged" />
                    ) : (
                      <span className="text-gray-300 font-bold">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden min-w-[60px]">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            student.percentage >= 75 ? "bg-green-500" : "bg-red-500"
                          )}
                          style={{ width: `${student.percentage}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-xs font-bold",
                        student.percentage >= 75 ? "text-green-600" : "text-red-600"
                      )}>
                        {student.percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
