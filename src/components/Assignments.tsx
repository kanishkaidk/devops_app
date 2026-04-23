import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { FileText, Plus, Upload, Clock, CheckCircle, AlertCircle, ExternalLink, Users } from "lucide-react";
import { motion } from "motion/react";
import StatusBadge from "./ui/StatusBadge";
import { cn } from "../lib/utils";

export default function Assignments() {
  const { profile } = useAuth();
  if (!profile) return null;

  return profile.role === "teacher" ? <TeacherAssignments /> : <StudentAssignments />;
}

function TeacherAssignments() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, "assignments"), orderBy("due_date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center text-indigo-600">
        <h1 className="text-2xl font-bold text-gray-900">Course Assignments</h1>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold"
        >
          <Plus className="w-5 h-5" /> New Assignment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map(a => (
          <div key={a.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between mb-4">
               <div>
                 <h3 className="font-bold text-gray-900">{a.title}</h3>
                 <p className="text-xs text-gray-400">Subject: {a.subject_id}</p>
               </div>
               <StatusBadge status={a.submission_type} />
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">{a.description}</p>
            <div className="flex items-center text-xs text-gray-400 gap-4">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(a.due_date).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3"/> 12 Submissions</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentAssignments() {
  const [assignments, setAssignments] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
      
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-start gap-4">
               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                 <FileText className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="font-bold text-gray-900">Data Structures Assignment {i}</h3>
                  <p className="text-sm text-gray-500">Stacks, Queues and Linked Lists implementation</p>
                  <div className="flex items-center gap-4 mt-2 text-xs font-bold">
                    <span className="text-red-500 flex items-center gap-1"><Clock className="w-4 h-4"/> Due in 2 days</span>
                    <span className="text-gray-400">10MB Max (PDF)</span>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status="pending" />
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2">
                <Upload className="w-4 h-4" /> Submit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { orderBy } from "firebase/firestore";
