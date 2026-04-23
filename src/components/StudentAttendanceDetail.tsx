import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, Download } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { cn } from "../lib/utils";
import StatusBadge from "./ui/StatusBadge";

interface AttendanceRecord {
  date: string;
  status: "present" | "absent" | "late" | "proxy_flagged";
  subject: string;
}

export default function StudentAttendanceDetail() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  // Mock Data
  const records: AttendanceRecord[] = [
    { date: "2026-04-01", status: "present", subject: "Math" },
    { date: "2026-04-02", status: "absent", subject: "Math" },
    { date: "2026-04-05", status: "present", subject: "Math" },
    { date: "2026-04-07", status: "late", subject: "Math" },
    { date: "2026-04-10", status: "present", subject: "Math" },
  ];

  const presentCount = records.filter(r => r.status === "present").length;
  const absentCount = records.filter(r => r.status === "absent").length;
  const lateCount = records.filter(r => r.status === "late").length;
  const total = records.length || 1;

  const data = [
    { name: "Present", value: presentCount, color: "#22c55e" },
    { name: "Absent", value: absentCount, color: "#ef4444" },
    { name: "Late", value: lateCount, color: "#f59e0b" },
  ];

  const percentage = Math.round(((presentCount + lateCount) / total) * 100);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 underline decoration-indigo-200 decoration-4 underline-offset-4">Attendance Summary</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4">
            <p className="text-4xl font-black text-indigo-600">{percentage}%</p>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Overall Attendance</p>
          </div>
        </div>

        {percentage < 75 && (
          <div className="md:w-1/3 bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl flex flex-col justify-center">
            <div className="flex items-center gap-3 text-red-700 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold">Shortage Warning</h3>
            </div>
            <p className="text-red-600 text-sm leading-relaxed">
              Your attendance is currently {percentage}%. You need at least 75% to be eligible for examinations. 
              You need to attend approximately <strong>8 more classes</strong> without missing any to hit the target.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-900">Attendance Calendar</h2>
          <div className="flex items-center gap-4">
             <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-gray-100 rounded-lg">
               <ChevronLeft />
             </button>
             <span className="font-bold text-gray-700">{format(currentDate, "MMMM yyyy")}</span>
             <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-gray-100 rounded-lg">
               <ChevronRight />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{day}</div>
          ))}
          {eachDayOfInterval({
            start: startOfMonth(currentDate),
            end: endOfMonth(currentDate)
          }).map(day => {
            const record = records.find(r => isSameDay(new Date(r.date), day));
            return (
              <div 
                key={day.toString()} 
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center border border-gray-50 transition-all hover:scale-105 cursor-pointer relative",
                  record?.status === "present" && "bg-green-100 text-green-700",
                  record?.status === "absent" && "bg-red-100 text-red-700",
                  record?.status === "late" && "bg-amber-100 text-amber-700",
                  !record && "bg-gray-50 text-gray-400"
                )}
              >
                <span className="text-sm font-bold">{format(day, "d")}</span>
                {record && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-current opacity-50" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
