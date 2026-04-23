import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../AuthContext";
import { Book, Clock, Star, TrendingUp, BellRing, CheckCircle2 } from "lucide-react";
import socket from "../../lib/socket";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "assignments" | "quizzes">("overview");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [showJoinSubject, setShowJoinSubject] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [activeSession, setActiveSession] = useState<{ id: string, subject_name: string, expires_at: string, window_no?: number } | null>(null);
  const [isMarked, setIsMarked] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;
    
    // Join student targeted room
    socket.emit("join_user", profile.uid);

    // Listen for attendance opening
    socket.on("attendance_open", (data) => {
      setActiveSession(data);
      setIsMarked(false);
    });

    socket.on("attendance_open_window_2", (data) => {
      setActiveSession({ ...data, subject_name: activeSession?.subject_name || "Lecture 2 Window" });
      setIsMarked(false);
    });

    socket.on("attendance_reopen_targeted", (data) => {
      setActiveSession({ ...data, subject_name: "Extended Window" });
      setIsMarked(false);
    });

    socket.on("attendance_closed", (data) => {
      if (activeSession?.id === data.session_id) {
        setActiveSession(null);
      }
    });

    const qAtt = query(collection(db, "attendance_records"), where("student_id", "==", profile.uid));
    const unsubAtt = onSnapshot(qAtt, (snapshot) => {
      const records = snapshot.docs.map(doc => doc.data());
      setAttendance(records);
      if (activeSession) {
        const marked = records.some(r => r.session_id === activeSession.id);
        setIsMarked(marked);
      }
    });

    // Fetch Auto-assigned Subjects
    const qSub = query(
      collection(db, "subjects"), 
      where("course", "==", profile.course || ""),
      where("batch", "==", profile.batch || "")
    );
    const unsubSub = onSnapshot(qSub, (snapshot) => {
      const s = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Further filter by section if present
      const filtered = s.filter((sub: any) => !sub.section || sub.section === profile.section);
      setSubjects(filtered);
    });

    // Fetch all for joinable
    const unsubAll = onSnapshot(collection(db, "subjects"), (snapshot) => {
      setAllSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      socket.off("attendance_open");
      socket.off("attendance_open_window_2");
      socket.off("attendance_reopen_targeted");
      socket.off("attendance_closed");
      unsubAtt();
      unsubSub();
      unsubAll();
    };
  }, [profile, activeSession]);

  useEffect(() => {
    if (!activeSession) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const end = new Date(activeSession.expires_at).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
      if (diff === 0) setActiveSession(null);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  const markAttendance = async () => {
    if (!activeSession || !profile || marking) return;
    
    setMarking(true);
    const fingerprint = {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    try {
      const resp = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          studentId: profile.uid,
          studentName: profile.name,
          windowNo: activeSession.window_no || 1,
          fingerprint
        })
      });

      const data = await resp.json();
      if (resp.ok) {
        setIsMarked(true);
        setTimeout(() => setActiveSession(null), 3000);
      } else {
        alert(data.error || "Failed to mark attendance.");
        if (resp.status === 409 || resp.status === 410) {
          setActiveSession(null);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Network error. Please try again.");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {activeSession && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-2xl shadow-indigo-200 border-4 border-white flex flex-col md:flex-row items-center justify-between gap-6 relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BellRing className="w-24 h-24 rotate-12" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                   <Clock className="w-6 h-6" />
                </div>
                <div>
                   <h2 className="text-xl font-black">Attendance Open: {activeSession.subject_name}</h2>
                   <p className="text-sm font-bold opacity-80">
                     {timeLeft !== null ? `${timeLeft}s remaining` : `Window closes at ${new Date(activeSession.expires_at).toLocaleTimeString()}`}
                   </p>
                </div>
              </div>
              
              {!isMarked ? (
                <button 
                  onClick={markAttendance}
                  className="px-10 py-4 bg-white text-indigo-600 font-extrabold rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-lg group overflow-hidden relative"
                >
                  <span className="relative z-10">Mark Present</span>
                  <div className="absolute inset-0 bg-indigo-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-8 py-4 bg-green-500 rounded-2xl font-black text-lg">
                  <CheckCircle2 className="w-6 h-6" />
                  Attendance Captured!
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Student Portal</h1>
          <p className="text-gray-500 font-medium">Welcome back, {profile?.name || "Academic Member"}</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
          {[
            { id: "overview", label: "Overview" },
            { id: "assignments", label: "Assignments" },
            { id: "quizzes", label: "Quizzes" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest",
                activeTab === tab.id ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bento-card bg-indigo-600 text-white border-none shadow-xl shadow-indigo-100">
              <Clock className="w-10 h-10 mb-4 opacity-50" />
              <h3 className="text-4xl font-black mb-1">{attendance.length}</h3>
              <p className="text-xs font-black uppercase tracking-widest opacity-80">Lectures Attended</p>
            </div>
            
            <div className="bento-card">
              <Book className="w-10 h-10 mb-4 text-indigo-600 opacity-20" />
              <h3 className="text-4xl font-black mb-1 text-gray-900">{subjects.length}</h3>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Subjects</p>
            </div>

            <div className="bento-card">
              <TrendingUp className="w-10 h-10 mb-4 text-green-600 opacity-20" />
              <h3 className="text-4xl font-black mb-1 text-gray-900">8.4</h3>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Aggregate GPA</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bento-card min-h-[300px]">
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                 <Star className="w-5 h-5 text-amber-500" />
                 Recent Activity
               </h3>
               <div className="space-y-4">
                  {attendance.slice(0, 3).map((a, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
                       <div>
                         <p className="text-sm font-bold text-gray-900">{a.subject_name || "Lecture Check-in"}</p>
                         <p className="text-[10px] text-gray-400 font-black uppercase">{new Date(a.marked_at?.toDate()).toLocaleString()}</p>
                       </div>
                       <span className="text-[10px] font-black text-green-600 uppercase border border-green-200 px-2 py-1 rounded bg-green-50">PRESENT</span>
                    </div>
                  ))}
               </div>
             </div>

             <div className="bento-card">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold">Current Subjects</h3>
                 <button 
                  onClick={() => setShowJoinSubject(true)}
                  className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg"
                 >
                   Join Elective
                 </button>
               </div>
               <div className="space-y-3">
                  {subjects.map(s => (
                    <div key={s.id} className="p-4 border border-gray-100 rounded-2xl hover:border-indigo-100 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-indigo-600 font-black group-hover:bg-indigo-50">{s.name[0]}</div>
                        <div>
                          <p className="font-bold text-gray-700">{s.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{s.code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instructor</p>
                         <p className="text-xs font-bold text-gray-900">{s.teacher_email || "N/A"}</p>
                      </div>
                    </div>
                  ))}
                  {subjects.length === 0 && (
                    <div className="text-center py-8">
                       <p className="text-xs text-gray-400 italic">No auto-assigned subjects found for your profile details.</p>
                    </div>
                  )}
               </div>
             </div>

             <AnimatePresence>
               {showJoinSubject && (
                 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                   <motion.div 
                     initial={{ scale: 0.9, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0.9, opacity: 0 }}
                     className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
                   >
                     <h3 className="text-2xl font-black text-gray-900 tracking-tight">Join Subject</h3>
                     <input 
                       type="text"
                       placeholder="Search subject by name or code..."
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                     />
                     <div className="space-y-2 max-h-60 overflow-y-auto">
                        {allSubjects
                          .filter(s => 
                            s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.code.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map(s => (
                            <div key={s.id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                               <div>
                                 <p className="text-sm font-bold">{s.name}</p>
                                 <p className="text-[10px] font-black text-gray-400 uppercase">{s.code}</p>
                               </div>
                               <button 
                                 className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg"
                                 onClick={() => {
                                   alert("Joined elective subject: " + s.name);
                                   setSubjects(prev => [...prev, s]);
                                   setShowJoinSubject(false);
                                 }}
                               >
                                 Join
                               </button>
                            </div>
                          ))
                        }
                     </div>
                     <button 
                       onClick={() => setShowJoinSubject(false)}
                       className="w-full py-3 bg-gray-100 text-gray-500 font-bold rounded-xl"
                     >
                       Close
                     </button>
                   </motion.div>
                 </div>
               )}
             </AnimatePresence>
          </div>
        </>
      )}

      {activeTab === "assignments" && <AssignmentPortal studentId={profile?.uid || ""} />}
      {activeTab === "quizzes" && <QuizPortal studentId={profile?.uid || ""} />}
    </div>
  );
}

function AssignmentPortal({ studentId }: { studentId: string }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const unsubAss = onSnapshot(collection(db, "assignments"), (snapshot) => {
      setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const qSub = query(collection(db, "assignment_submissions"), where("student_id", "==", studentId));
    const unsubSub = onSnapshot(qSub, (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubAss(); unsubSub(); };
  }, [studentId]);

  const getStatus = (assignment: any) => {
    const sub = submissions.find(s => s.assignment_id === assignment.id);
    if (sub?.status === "submitted") return "submitted";
    if (new Date(assignment.due_date) < new Date()) return "overdue";
    return "pending";
  };

  const sections = {
    pending: assignments.filter(a => getStatus(a) === "pending"),
    submitted: assignments.filter(a => getStatus(a) === "submitted"),
    overdue: assignments.filter(a => getStatus(a) === "overdue")
  };

  return (
    <div className="space-y-8">
      {Object.entries(sections).map(([key, list]) => (
        <div key={key}>
           <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
             <div className={cn("w-2 h-2 rounded-full", 
               key === "pending" ? "bg-indigo-500" : 
               key === "submitted" ? "bg-green-500" : "bg-red-500"
             )} />
             {key} ({list.length})
           </h4>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {list.map(a => (
                <div key={a.id} className="bento-card group hover:border-indigo-200 transition-all shadow-sm">
                   <h5 className="font-black text-gray-900 border-b border-gray-50 pb-2 mb-2">{a.title}</h5>
                   <p className="text-[10px] text-gray-400 font-black uppercase mb-6 tracking-widest">{a.submission_type} SUBMISSION</p>
                   <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-black text-indigo-600 uppercase italic">
                        {new Date(a.due_date).toLocaleDateString()}
                      </p>
                      {a.submission_type === "online" && getStatus(a) !== "submitted" && (
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase shadow-lg shadow-indigo-100 transform group-hover:-translate-y-1 transition-all">Upload</button>
                      )}
                   </div>
                </div>
              ))}
              {list.length === 0 && <p className="text-xs text-gray-300 italic opacity-50 px-4">No records found for this category</p>}
           </div>
        </div>
      ))}
    </div>
  );
}

function QuizPortal({ studentId }: { studentId: string }) {
  const [quizzes, setQuizzes] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "quizzes"), (snapshot) => {
      setQuizzes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map(q => {
            const isLive = new Date(q.start_time) < new Date() && new Date(q.end_time) > new Date();
            const isUpcoming = new Date(q.start_time) > new Date();
            
            return (
              <div key={q.id} className={cn(
                "bento-card relative overflow-hidden group transition-all",
                isLive ? "border-indigo-500 bg-indigo-50/20 shadow-2xl shadow-indigo-100 ring-2 ring-indigo-50" : "bg-white"
              )}>
                {isLive && (
                  <div className="absolute top-0 right-0 p-4">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Clock className="w-5 h-5" />
                   </div>
                   <h4 className="font-black text-gray-900 leading-tight">{q.title}</h4>
                </div>
                <div className="space-y-2 mb-8">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <span>Time Limit</span>
                      <span className="text-gray-900">{q.time_limit_mins} MINS</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <span>Status</span>
                      <span className={isLive ? "text-indigo-600" : ""}>{isLive ? "LIVE NOW" : isUpcoming ? "UPCOMING" : "CLOSED"}</span>
                   </div>
                </div>
                <button 
                  disabled={!isLive}
                  className={cn(
                    "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl",
                    isLive ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                  )}
                >
                  {isLive ? "Initiate Session" : "Access Locked"}
                </button>
              </div>
            );
          })}
       </div>
    </div>
  );
}
