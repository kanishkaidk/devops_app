import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, orderBy, limit, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Timer, CheckCircle2, AlertCircle, Fingerprint, MapPin } from "lucide-react";
import StatusBadge from "./ui/StatusBadge";
import { cn } from "../lib/utils";

interface ActiveSession {
  id: string;
  subject_id: string;
  subject_name?: string;
  teacher_id: string;
  lecture_no: number;
  window_closes_at: string;
  opened_at: string;
}

export default function StudentAttendance() {
  const { user, profile } = useAuth();
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [marking, setMarking] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!profile) return;

    // In a real app, we'd find subjects matching student's course/batch/section
    // For now, we'll listen to all active sessions (Simplified for the foundation)
    const q = query(
      collection(db, "attendance_sessions"),
      where("status", "==", "open"),
      orderBy("opened_at", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActiveSession));
      setActiveSessions(sessions);
    });

    return unsubscribe;
  }, [profile]);

  const markAttendance = async (sessionId: string) => {
    if (!user || marking) return;
    setMarking(true);
    setMessage(null);

    try {
      // 1. Generate device fingerprint
      const fingerprint = await generateFingerprint();
      
      // 2. Check for duplicate session marking (Firestore rules should also handle this)
      // 3. Mark attendance
      await addDoc(collection(db, "attendance_records"), {
        session_id: sessionId,
        student_id: user.uid,
        status: "present",
        marked_at: serverTimestamp(),
        device_fingerprint_hash: fingerprint,
        created_at: new Date().toISOString()
      });

      setMessage({ text: "Attendance marked successfully!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to mark attendance", type: "error" });
    } finally {
      setMarking(false);
    }
  };

  const generateFingerprint = async () => {
    const data = `${navigator.userAgent}-${window.screen.width}-${window.screen.height}-${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Active Attendances</h1>
        <div className="flex items-center text-sm text-gray-500">
          <MapPin className="w-4 h-4 mr-1" /> IGDTUW Campus
        </div>
      </div>

      <AnimatePresence>
        {activeSessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200"
          >
            <Timer className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No active attendance sessions</p>
            <p className="text-sm text-gray-400">Please wait for your teacher to open a session.</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {activeSessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bento-card hover:border-indigo-300 group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Lecture {session.lecture_no}</h3>
                    <StatusBadge status="open" />
                  </div>
                  <p className="text-gray-600 font-bold text-sm">Subject: {session.subject_id}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">Started at: {new Date(session.opened_at).toLocaleTimeString()}</p>
                </div>

                <div className="flex flex-col items-center md:items-end gap-2">
                  <button
                    onClick={() => markAttendance(session.id)}
                    disabled={marking}
                    className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {marking ? "Processing..." : (
                      <>
                        <Fingerprint className="w-5 h-5" />
                        Mark Attendance
                      </>
                    )}
                  </button>
                  <div className="flex items-center text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                    <Timer className="w-4 h-4 mr-2" />
                    Window active
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50",
            message.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          )}
        >
          {message.type === "success" ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          <span className="font-bold">{message.text}</span>
        </motion.div>
      )}
    </div>
  );
}
