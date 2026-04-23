import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, setDoc, serverTimestamp, orderBy, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Users, Clock, AlertCircle, PlusCircle, CheckCircle, Database, BookOpen, ClipboardList, Send, ShieldAlert, GraduationCap, Timer, LayoutPanelLeft } from "lucide-react";
import { cn } from "../../lib/utils";
import StatusBadge from "../ui/StatusBadge";
import { seedDevelopmentData } from "../../lib/seed";
import socket from "../../lib/socket";

interface Subject {
  id: string;
  name: string;
  code: string;
  department?: string;
  course: string;
  batch: string;
  section: string;
}

interface Student {
  uid: string;
  name: string;
  enrollment_no: string;
  email: string;
  section: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name?: string;
  marked_at: any;
  status: "present" | "absent" | "late" | "proxy_flagged";
  is_verified?: boolean;
  proxy_flag?: boolean;
  device_fingerprint_hash?: string;
}

export default function TeacherConsole() {
  const { user, profile } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [activeTab, setActiveTab] = useState<"attendance" | "marks" | "assignments" | "quizzes">("attendance");
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // In a real app we'd filter by teacher_email field
    const q = query(collection(db, "subjects"), where("teacher_email", "==", user.email));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
      setSubjects(data);
      if (data.length > 0 && !selectedSubject) setSelectedSubject(data[0]);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedDevelopmentData();
      alert("Mock data initialized!");
    } catch (e: any) {
      alert("Seeding failed: " + e.message);
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading subjects...</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Faculty Console</h1>
          <p className="text-gray-500 font-medium">Manage your subjects and academic sessions.</p>
        </div>
        <div className="flex items-center gap-2">
          {profile?.role === "admin" && (
            <button 
              onClick={handleSeed}
              disabled={isSeeding}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors"
            >
              <Database className="w-4 h-4" />
              {isSeeding ? "Seeding..." : "Seed Mock Data"}
            </button>
          )}
        </div>
      </header>

      {/* Subject Selector Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {subjects.map(subject => (
          <button
            key={subject.id}
            onClick={() => setSelectedSubject(subject)}
            className={cn(
              "p-6 rounded-2xl border transition-all text-left",
              selectedSubject?.id === subject.id 
                ? "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-100" 
                : "bg-white border-gray-100 text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/30 shadow-sm"
            )}
          >
            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 opacity-70", selectedSubject?.id === subject.id ? "text-white" : "text-gray-400")}>
              {subject.code}
            </p>
            <h3 className="text-lg font-bold leading-tight">{subject.name}</h3>
          </button>
        ))}
        {subjects.length === 0 && (
          <div className="col-span-full bento-card text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-bold">No subjects assigned yet.</p>
            <p className="text-xs text-gray-400">Ask the administrator to assign subjects to your email.</p>
          </div>
        )}
      </div>

      {selectedSubject && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4">
          {/* Navigation Sidebar */}
          <div className="md:col-span-3 space-y-2">
             {[
               { id: "attendance", label: "Attendance", icon: Users, color: "indigo" },
               { id: "marks", label: "Marks Management", icon: ClipboardList, color: "amber" },
               { id: "assignments", label: "Assignments", icon: BookOpen, color: "green" },
               { id: "quizzes", label: "Quizzes", icon: GraduationCap, color: "violet" }
             ].map(tab => {
               const Icon = tab.icon;
               return (
                 <button 
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={cn(
                     "w-full p-4 rounded-2xl flex items-center gap-3 font-bold transition-all border",
                     activeTab === tab.id 
                      ? `bg-white border-gray-200 shadow-sm text-gray-900`
                      : "border-transparent text-gray-400 hover:bg-gray-100"
                   )}
                 >
                   <div className={cn("p-2 rounded-xl", activeTab === tab.id ? `bg-${tab.color}-100 text-${tab.color}-600` : "bg-gray-100 text-gray-400")}>
                     <Icon className="w-5 h-5" />
                   </div>
                   {tab.label}
                 </button>
               )
             })}
          </div>

          {/* Tab Content */}
          <div className="md:col-span-9 animate-in fade-in slide-in-from-right-4 duration-300">
             {activeTab === "attendance" && <AttendanceManager subject={selectedSubject} />}
             {activeTab === "marks" && <MarksManager subject={selectedSubject} />}
             {activeTab === "assignments" && <AssignmentManager subject={selectedSubject} />}
             {activeTab === "quizzes" && <QuizManager subject={selectedSubject} />}
          </div>
        </div>
      )}
    </div>
  );
}

// --- TAB COMPONENTS ---

function AttendanceManager({ subject }: { subject: Subject }) {
  const { user } = useAuth();
  const [ lectureNo, setLectureNo ] = useState(1);
  const [ duration, setDuration ] = useState(5);
  const [ gap, setGap ] = useState(10);
  const [ isConsecutive, setIsConsecutive ] = useState(false);
  const [ activeSessionId, setActiveSessionId ] = useState<string | null>(null);
  const [ attendances, setAttendances ] = useState<AttendanceRecord[]>([]);
  const [ studentsCount, setStudentsCount ] = useState(0);
  const [ loading, setLoading ] = useState(false);

  useEffect(() => {
    // Fetch total students (for X/Y counter) matching subject's group
    const q = query(
      collection(db, "users"), 
      where("role", "==", "student"),
      where("course", "==", subject.course),
      where("batch", "==", subject.batch),
      where("section", "==", subject.section)
    );
    getDocs(q).then((snap) => setStudentsCount(snap.size));
  }, []);

  useEffect(() => {
    // Join socket room for this subject notifications
    socket.emit("join_subject", subject.id);
    
    // Check for open session
    const qOpen = query(
      collection(db, "attendance_sessions"), 
      where("subject_id", "==", subject.id),
      where("status", "==", "open")
    );

    const unsubSession = onSnapshot(qOpen, (snapshot) => {
      if (!snapshot.empty) {
        const id = snapshot.docs[0].id;
        setActiveSessionId(id);
        socket.emit("join_session", id);
      } else {
        setActiveSessionId(null);
      }
    });

    return () => {
      unsubSession();
    };
  }, [subject]);

  useEffect(() => {
    if (!activeSessionId) {
      setAttendances([]);
      return;
    }

    const qRec = query(
      collection(db, "attendance_records"), 
      where("session_id", "==", activeSessionId),
      orderBy("marked_at", "desc")
    );

    const unsubRec = onSnapshot(qRec, (snapshot) => {
      setAttendances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
    });

    return () => unsubRec();
  }, [activeSessionId]);

  const openSession = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/attendance/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subject.id,
          subjectName: subject.name,
          teacherId: user?.uid,
          lectureNo,
          isConsecutive,
          duration,
          gap: isConsecutive ? gap : 0
        })
      });
      const data = await response.json();
      if (data.sessionId) {
        setActiveSessionId(data.sessionId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const manualMark = async (studentId: string, status: string, recordId?: string) => {
    const reason = prompt("Enter reason for manual override:");
    if (reason === null) return;

    try {
      await fetch("/api/attendance/manual-mark", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId,
          sessionId: activeSessionId,
          studentId,
          status,
          teacherId: user?.uid,
          reason
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bento-card">
         <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-bold text-gray-900">Attendance Controller</h3>
           {activeSessionId && <span className="flex items-center gap-2 text-xs font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase animate-pulse"><Clock className="w-3 h-3" /> Live Window</span>}
         </div>

         {!activeSessionId ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase mb-2 block">Lecture No.</label>
                  <input 
                    type="number" 
                    value={lectureNo} 
                    onChange={(e) => setLectureNo(parseInt(e.target.value))}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase mb-2 block">Type</label>
                  <div className="flex p-1 bg-gray-100 rounded-xl">
                    <button 
                      onClick={() => setIsConsecutive(false)}
                      className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all", !isConsecutive ? "bg-white shadow-sm text-indigo-600" : "text-gray-400")}
                    >Single</button>
                    <button 
                      onClick={() => setIsConsecutive(true)}
                      className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all", isConsecutive ? "bg-white shadow-sm text-indigo-600" : "text-gray-400")}
                    >Double</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase mb-2 block">Window Duration</label>
                  <select 
                    value={duration} 
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value={2}>2 min</option>
                    <option value={5}>5 min</option>
                    <option value={10}>10 min</option>
                  </select>
                </div>
                <button 
                  onClick={openSession}
                  disabled={loading}
                  className="p-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  <PlusCircle className="w-5 h-5" />
                  {loading ? "Starting..." : "Start Session"}
                </button>
              </div>

              {isConsecutive && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-4">
                  <Timer className="w-6 h-6 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-amber-900">Consecutive Lecture Gap</p>
                    <p className="text-[10px] text-amber-600">Window 2 will open automatically after the gap ends.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={gap} 
                      onChange={(e) => setGap(parseInt(e.target.value))}
                      className="w-20 p-2 bg-white border border-amber-200 rounded-lg text-sm font-bold text-center outline-none"
                    />
                    <span className="text-xs font-bold text-amber-700">Mins</span>
                  </div>
                </div>
              )}
            </div>
         ) : (
            <div className="flex items-center justify-between p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
               <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[10px] text-indigo-400 font-black uppercase mb-1">Live Count</p>
                    <p className="text-3xl font-black text-indigo-600 leading-none">
                      {attendances.length} / {studentsCount || "..."}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-indigo-200"></div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Lecture {lectureNo} Active</h4>
                    <p className="text-xs text-indigo-500 leading-relaxed font-medium">Automatic monitoring of student check-ins enabled.</p>
                  </div>
               </div>
               <div className="flex gap-2">
                 <button className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-xl text-xs font-bold shadow-sm">View Status</button>
                 <button 
                  onClick={async () => {
                    await updateDoc(doc(db, "attendance_sessions", activeSessionId), { status: "closed", closed_at: new Date().toISOString() });
                  }}
                  className="px-6 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
                 >
                   Force Close
                 </button>
               </div>
            </div>
         )}
      </div>

      <div className="bento-card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900 underline decoration-indigo-200 decoration-4 underline-offset-4 tracking-tight">Real-time Session Log</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{attendances.length} Responses Captured</p>
        </div>
        <div className="space-y-3">
           {attendances.map(record => (
             <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-indigo-200 transition-all">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                   <Users className="w-5 h-5 text-gray-400" />
                 </div>
                 <div>
                   <p className="text-sm font-bold text-gray-900">{record.student_name || "Student: " + record.student_id}</p>
                   <p className="text-[10px] text-gray-400 font-medium">{new Date(record.marked_at?.toDate()).toLocaleTimeString()}</p>
                 </div>
               </div>
               <div className="flex items-center gap-4">
                 <select 
                    value={record.status}
                    onChange={(e) => manualMark(record.student_id, e.target.value, record.id)}
                    className={cn(
                      "text-[10px] font-black uppercase px-2 py-1 rounded border-none outline-none cursor-pointer",
                      record.status === "present" ? "bg-green-100 text-green-700" :
                      record.status === "late" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    )}
                 >
                   <option value="present">Present</option>
                   <option value="late">Late</option>
                   <option value="absent">Absent</option>
                   <option value="proxy_flagged">Proxy</option>
                 </select>
                 
               </div>
             </div>
           ))}
           {attendances.length === 0 && (
             <p className="text-center py-12 text-gray-400 text-sm font-medium italic">Scanning for signals... Students can mark when window is open.</p>
           )}
        </div>
      </div>

      <AbsenteeList 
        subjectId={subject.id} 
        activeSessionId={activeSessionId} 
        markedStudentIds={attendances.map(a => a.student_id)}
        onReopen={(studentId) => {
           fetch("/api/attendance/reopen-for-student", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ sessionId: activeSessionId, studentId, teacherId: user?.uid })
           });
           alert("Extended window for student.");
        }}
        onManualMark={(studentId) => manualMark(studentId, "present")}
      />
    </div>
  )
}

function AbsenteeList({ subjectId, activeSessionId, markedStudentIds, onReopen, onManualMark }: { 
  subjectId: string, 
  activeSessionId: string | null, 
  markedStudentIds: string[],
  onReopen: (id: string) => void,
  onManualMark: (id: string) => void
}) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real system, we'd query students enrolled in this subjectId
    // For this demo, we'll just fetch all users with role 'student'
    const q = query(collection(db, "users"), where("role", "==", "student"));
    getDocs(q).then((snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
      setLoading(false);
    });
  }, [subjectId]);

  const absentStudents = students.filter(s => !markedStudentIds.includes(s.uid));

  if (loading) return null;

  return (
    <div className="bento-card">
       <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900 tracking-tight">Review Absentees</h3>
          <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-full uppercase">{absentStudents.length} Students Not Marked</span>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {absentStudents.map(student => (
            <div key={student.uid} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm transition-all hover:border-indigo-100">
               <div>
                 <p className="text-sm font-bold text-gray-900">{student.name}</p>
                 <p className="text-[10px] text-gray-400 font-medium">#{student.enrollment_no}</p>
               </div>
               <div className="flex gap-2">
                 {activeSessionId && (
                   <button 
                    onClick={() => onReopen(student.uid)}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                    title="Reopen for 2 mins"
                   >
                     <Clock className="w-4 h-4" />
                   </button>
                 )}
                 <button 
                  onClick={() => onManualMark(student.uid)}
                  className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                  title="Force Present"
                 >
                   <CheckCircle className="w-4 h-4" />
                 </button>
               </div>
            </div>
          ))}
          {absentStudents.length === 0 && (
             <p className="col-span-full py-8 text-center text-sm font-bold text-green-600">100% Attendance Achieved!</p>
          )}
       </div>
    </div>
  )
}

function MarksManager({ subject }: { subject: Subject }) {
  return (
    <div className="bento-card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold tracking-tight">Component Marks</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100">
          <PlusCircle className="w-4 h-4" /> New Entry
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
              <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Mid-Term</th>
              <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Assgn. I</th>
              <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Total</th>
              <th className="py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
             {[1, 2, 3].map(i => (
               <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                 <td className="py-4">
                   <p className="text-sm font-bold text-gray-900 leading-tight">Student-00{i}</p>
                   <p className="text-[10px] text-gray-400">Enrollment: 06201032024</p>
                 </td>
                 <td className="text-center text-sm font-medium">24/30</td>
                 <td className="text-center text-sm font-medium">8.5/10</td>
                 <td className="text-center font-black text-indigo-600">32.5</td>
                 <td className="text-right py-4">
                   <button className="p-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"><PlusCircle className="w-4 h-4" /></button>
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AssignmentManager({ subject }: { subject: Subject }) {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [type, setType] = useState<"online" | "offline">("online");

  useEffect(() => {
    const q = query(collection(db, "assignments"), where("subject_id", "==", subject.id));
    const unsub = onSnapshot(q, (snapshot) => {
      setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, [subject]);

  const createAssignment = async () => {
    if (!title || !dueDate) return;
    await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject_id: subject.id,
        teacher_id: user?.uid,
        title,
        description,
        due_date: dueDate,
        submission_type: type,
      })
    });
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-gray-900 leading-none mb-1">Academic Tasks</h3>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{assignments.length} Total Assignments</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-100"
        >
          <PlusCircle className="w-4 h-4" /> Create
        </button>
      </div>

      {showCreate && (
        <div className="bento-card border-indigo-200 bg-indigo-50/20">
          <h4 className="font-black text-indigo-900 mb-6 uppercase text-[10px] tracking-widest">New Deployment</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task Title" className="p-4 rounded-2xl bg-white border-none shadow-sm font-bold h-14 outline-none" />
            <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} className="p-4 rounded-2xl bg-white border-none shadow-sm font-bold h-14 outline-none" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Prompt / Instructions..." className="p-4 rounded-2xl bg-white border-none shadow-sm font-bold md:col-span-2 min-h-[120px] outline-none" />
            <div className="md:col-span-2 flex justify-between items-center bg-white p-2 rounded-2xl border border-indigo-50">
               <div className="flex gap-2">
                 {["online", "offline"].map(t => (
                   <button key={t} onClick={() => setType(t as any)} className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", type === t ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400")}>{t}</button>
                 ))}
               </div>
               <div className="flex gap-2">
                 <button onClick={() => setShowCreate(false)} className="px-6 py-2 text-[10px] font-black uppercase text-gray-400">Abort</button>
                 <button onClick={createAssignment} className="px-8 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100">Distribute</button>
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {assignments.map(a => (
          <div key={a.id} className="bento-card flex justify-between items-center group hover:border-indigo-100 transition-all cursor-pointer">
             <div>
               <h4 className="font-black text-gray-900 text-lg leading-tight">{a.title}</h4>
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-4 mt-1">
                 <span className="text-indigo-600">{a.submission_type}</span>
                 <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                 <span>Due {new Date(a.due_date).toLocaleString()}</span>
               </p>
             </div>
             <button className="px-6 py-2.5 bg-gray-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-all">Review Submissions</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizManager({ subject }: { subject: Subject }) {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [limit, setLimit] = useState(30);

  useEffect(() => {
    const q = query(collection(db, "quizzes"), where("subject_id", "==", subject.id));
    const unsub = onSnapshot(q, (snapshot) => {
      setQuizzes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, [subject]);

  const createQuiz = async () => {
    await fetch("/api/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject_id: subject.id,
        teacher_id: user?.uid,
        title,
        time_limit_mins: limit,
        results_released: false
      })
    });
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-900 p-6 rounded-3xl shadow-2xl">
         <div>
           <h3 className="text-xl font-black text-white leading-none mb-1">Assessment Lab</h3>
           <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">MCQ Deployment Console</p>
         </div>
         <button onClick={() => setShowCreate(true)} className="p-3 bg-indigo-500 text-white rounded-2xl hover:bg-indigo-400 transition-transform active:scale-95">
            <PlusCircle className="w-6 h-6" />
         </button>
      </div>

      {showCreate && (
        <div className="bento-card border-indigo-500 bg-gray-50 shadow-inner">
           <h4 className="font-black text-gray-900 mb-6 uppercase text-[10px] tracking-widest text-center">Configure Evaluation Instance</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Quiz Title (e.g. Midterm)" className="p-4 rounded-2xl bg-white shadow-sm border-none font-bold outline-none" />
              <input type="number" value={limit} onChange={e => setLimit(parseInt(e.target.value))} placeholder="Duration (Min)" className="p-4 rounded-2xl bg-white shadow-sm border-none font-bold outline-none" />
              <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-gray-200 mt-4">
                 <button onClick={() => setShowCreate(false)} className="px-6 py-2 text-[10px] font-black uppercase text-gray-400">Cancel</button>
                 <button onClick={createQuiz} className="px-10 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-xl shadow-indigo-100">Finalize</button>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {quizzes.map(q => (
          <div key={q.id} className="bento-card flex justify-between items-center group relative overflow-hidden transition-all hover:bg-gray-50">
             <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-600 transform scale-y-0 group-hover:scale-y-100 transition-transform"></div>
             <div>
               <h4 className="font-black text-gray-900 text-lg leading-tight">{q.title}</h4>
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                 <span>{q.time_limit_mins} MINS</span>
                 <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                 <span className={q.results_released ? "text-green-600" : "text-amber-600"}>{q.results_released ? "RESULTS OUT" : "DATA GATHERING"}</span>
               </p>
             </div>
             <div className="flex gap-2">
               <button className="px-4 py-2 bg-white text-indigo-500 rounded-xl text-[10px] font-black uppercase border border-indigo-100 shadow-sm">Audit Qs</button>
               <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100">Release</button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
