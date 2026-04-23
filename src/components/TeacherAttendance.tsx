import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { motion } from "motion/react";
import { PlusCircle, Clock, Users, XCircle, Share2, ClipboardList } from "lucide-react";
import StatusBadge from "./ui/StatusBadge";

interface Subject {
  id: string;
  name: string;
  code: string;
}

export default function TeacherAttendance() {
  const { user, profile } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  
  // Form State
  const [selectedSubject, setSelectedSubject] = useState("");
  const [lectureNo, setLectureNo] = useState(1);
  const [duration, setDuration] = useState(5);

  useEffect(() => {
    // In a real app, query subjects where teacher_ids includes user.uid
    const q = query(collection(db, "subjects"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const openSession = async () => {
    if (!selectedSubject || !user) return;
    setIsOpening(true);

    try {
      await addDoc(collection(db, "attendance_sessions"), {
        subject_id: selectedSubject,
        teacher_id: user.uid,
        lecture_no: lectureNo,
        window_duration_mins: duration,
        status: "open",
        opened_at: new Date().toISOString(),
        created_at: serverTimestamp()
      });
      
      // Reset form
      setSelectedSubject("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsOpening(false);
    }
  };

  const closeSession = async (sessionId: string) => {
    await updateDoc(doc(db, "attendance_sessions", sessionId), {
      status: "closed",
      closed_at: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Center</h1>
        <button className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors">
          <ClipboardList className="w-5 h-5" />
          History
        </button>
      </div>

      <div className="bento-card">
        <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
          <PlusCircle className="text-indigo-600 w-5 h-5" />
          Open New Session
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Select Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Lecture No.</label>
            <input
              type="number"
              value={lectureNo}
              onChange={(e) => setLectureNo(parseInt(e.target.value))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Window (Mins)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {[2, 5, 10, 15, 20].map(m => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={openSession}
            disabled={isOpening || !selectedSubject}
            className="w-full md:w-auto px-12 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
          >
            {isOpening ? "Opening..." : "Open Attendance Window"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Active Sessions</h2>
        {/* We would render recent/active sessions here similarly to the student view */}
      </div>
    </div>
  );
}
