import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { GraduationCap, Users, CalendarCheck, AlertCircle, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export default function Home() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ totalPresent: 0, totalClasses: 0, gpa: 8.5 }); // Mock GPA for now

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 font-medium">Hello, {profile.name}. Welcome back.</p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
             <p className="text-sm font-bold text-gray-900">{profile.enrollment_no}</p>
             <p className="text-xs text-gray-500">{profile.course} • {profile.batch}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-indigo-600 font-bold">
            {profile.name.charAt(0)}
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Attendance Main Card - Large Bento Box */}
        <div className="md:col-span-8 bento-card flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-black text-green-600 uppercase tracking-wider">Attendance Status</span>
              </div>
              <h2 className="text-2xl font-bold">Academic Overview</h2>
              <p className="text-gray-500">Subject: Data Structures • Lecture 03</p>
            </div>
            <div className="bg-indigo-50 px-4 py-2 rounded-xl text-center">
              <p className="text-xs text-indigo-600 font-bold uppercase">Overall</p>
              <p className="text-xl font-mono font-bold text-indigo-700">82%</p>
            </div>
          </div>

          <div className="flex-grow flex flex-col md:flex-row items-center justify-around gap-8 md:py-8">
            <div className="relative w-40 h-40">
               <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                 <circle cx="18" cy="18" r="16" fill="none" stroke="#F3F4F6" stroke-width="4"></circle>
                 <circle cx="18" cy="18" r="16" fill="none" stroke="#4F46E5" stroke-width="4" stroke-dasharray="82, 100"></circle>
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-3xl font-bold">82%</span>
               </div>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-64">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Status Report</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Good Standing</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-bold uppercase">Safe</span>
                </div>
              </div>
              <Link to="/attendance" className="w-full py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-lg text-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                Mark New Attendance
              </Link>
            </div>
          </div>
        </div>

        {/* Alerts & Notifications - Vertical Side Box */}
        <div className="md:col-span-4 bento-card flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase">3 New</span>
          </div>
          <div className="space-y-3">
             <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
               <div className="flex justify-between items-start mb-1">
                 <p className="text-xs font-bold text-gray-900">Quiz Release</p>
                 <span className="text-[10px] font-bold bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded">NEW</span>
               </div>
               <p className="text-[10px] text-indigo-700 line-clamp-1">Unit 2 Quiz results are now available for review.</p>
             </div>
             <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl">
               <div className="flex justify-between items-start mb-1">
                 <p className="text-xs font-bold text-gray-900">Assignment Final</p>
                 <span className="text-[10px] font-bold bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded">DUE</span>
               </div>
               <p className="text-[10px] text-orange-700 line-clamp-1">Operating Systems Lab 3 due in 24 hours.</p>
             </div>
          </div>
          <button className="mt-auto pt-4 text-xs text-indigo-600 font-bold text-center border-t border-gray-100 hover:text-indigo-800">
            Clear All
          </button>
        </div>

        {/* Quick Stats - Smaller Boxes */}
        <div className="md:col-span-4 bento-card flex flex-col justify-between">
           <div className="flex justify-between items-start">
             <div className="p-3 bg-green-50 text-green-600 rounded-xl">
               <GraduationCap className="w-5 h-5" />
             </div>
             <span className="text-[10px] font-bold text-green-600 uppercase">Current CGPA</span>
           </div>
           <div className="mt-4">
             <h3 className="text-3xl font-black text-gray-900">8.92</h3>
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Semester 2 Average</p>
           </div>
        </div>

        <div className="md:col-span-4 bento-card-dark">
           <div className="flex justify-between items-start mb-4">
             <h3 className="font-bold text-sm">Active Quiz</h3>
             <span className="px-2 py-0.5 bg-indigo-500 text-[10px] rounded font-black uppercase">Live</span>
           </div>
           <div className="bg-white/10 rounded-xl p-3 border border-white/10">
             <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1 underline">OS Concepts</p>
             <h4 className="text-xs font-bold">Process Sync Quiz</h4>
             <div className="flex justify-between mt-3 text-[10px] text-white/50">
               <span>15 Ques</span>
               <span>20 mins</span>
             </div>
           </div>
        </div>

        {/* Domain Info - Wide Bottom Box */}
        <div className="md:col-span-4 bento-card-primary flex items-center justify-between">
          <div className="max-w-[70%]">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Domain Guard</p>
            <p className="text-xs font-medium">Restricted to @igdtuw.ac.in emails. System is reporting 100% security coverage.</p>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
             <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Academic Calendar / Upcoming - Bottom Large Box */}
        <div className="md:col-span-12 bento-card">
           <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
             <CalendarCheck className="w-5 h-5 text-indigo-600" />
             Weekly Schedule
           </h3>
           <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                <div key={day} className={cn(
                  "flex-shrink-0 w-48 p-4 rounded-2xl border transition-all",
                  i === 0 ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-100"
                )}>
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-3">{day}</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                       <div>
                         <p className="text-xs font-bold">Math III</p>
                         <p className="text-[10px] text-gray-400">09:00 - 10:00</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                       <div>
                         <p className="text-xs font-bold">C++ Lab</p>
                         <p className="text-[10px] text-gray-400">11:00 - 01:00</p>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </main>
    </div>
  );
}
