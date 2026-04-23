import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { Trophy, Play, Clock, HelpCircle, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import StatusBadge from "./ui/StatusBadge";
import { cn } from "../lib/utils";

export default function Quiz() {
  const { profile } = useAuth();
  if (!profile) return null;

  return profile.role === "teacher" ? <TeacherQuiz /> : <StudentQuiz />;
}

function TeacherQuiz() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Faculty Quiz Console</h1>
      {/* Quiz Creation and Stats */}
      <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 p-12 rounded-2xl text-center">
        <Trophy className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-indigo-900">Create Immersive Quizzes</h3>
        <p className="text-indigo-600 text-sm max-w-sm mx-auto mb-6">Design MCQ assessments with real-time feedback and server-side validation.</p>
        <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Create New Quiz</button>
      </div>
    </div>
  );
}

function StudentQuiz() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Available Quizzes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-4">
               <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold">
                 Q{i}
               </div>
               <StatusBadge status={i === 1 ? "open" : "closed"} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Weekly Quiz: Discrete Structures</h3>
            <p className="text-xs text-gray-400 mb-4">Unit 1 & 2 • 20 Questions</p>
            
            <div className="mt-auto space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> 30 Mins</span>
                <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3"/> MCQ Only</span>
              </div>
              <button 
                disabled={i === 2}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all disabled:grayscale disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> Start Attempt
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
