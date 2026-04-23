import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot, updateDoc, doc, deleteDoc, getDocs, where, orderBy, setDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Users, BookOpen, Settings, ShieldAlert, CheckCircle, XCircle, Trash2, Edit3, Key, Plus, UserPlus } from "lucide-react";
import { cn } from "../../lib/utils";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"users" | "courses" | "proxies" | "audit">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [proxyFlags, setProxyFlags] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [coursesMeta, setCoursesMeta] = useState<any[]>([]);

  // Form states
  const [showInviteTeacher, setShowInviteTeacher] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherName, setTeacherName] = useState("");
  
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    course: "B.Tech",
    batch: "2024",
    semester: "1",
    section: "",
    teacher_email: ""
  });

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubSubjects = onSnapshot(collection(db, "subjects"), (snapshot) => {
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubProxies = onSnapshot(query(collection(db, "attendance_records"), where("status", "==", "proxy_flagged")), (snapshot) => {
      setProxyFlags(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubAudit = onSnapshot(query(collection(db, "audit_log"), orderBy("timestamp", "desc")), (snapshot) => {
      setAuditLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubCourses = onSnapshot(collection(db, "courses_meta"), (snapshot) => {
      setCoursesMeta(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { 
      unsubUsers(); unsubSubjects(); unsubProxies(); unsubAudit(); unsubCourses();
    };
  }, []);

  const updateUserRole = async (userId: string, role: string) => {
    await updateDoc(doc(db, "users", userId), { role });
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    await updateDoc(doc(db, "users", userId), { is_active: !currentStatus });
  };

  const inviteTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherEmail) return;
    try {
      const q = query(collection(db, "users"), where("email", "==", teacherEmail));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        // If user already exists, just upgrade them to teacher
        const userDoc = snap.docs[0];
        await updateDoc(doc(db, "users", userDoc.id), { role: "teacher" });
        alert(`User ${teacherEmail} roles updated to Teacher.`);
      } else {
        // Create invited record
        const userRef = doc(collection(db, "users"));
        await setDoc(userRef, {
          email: teacherEmail,
          name: teacherName || "Invited Teacher",
          role: "teacher",
          is_active: true,
          created_at: new Date().toISOString(),
          onboarding_status: "invited"
        });
        alert(`Teacher invitation sent to ${teacherEmail}`);
      }

      setTeacherEmail("");
      setTeacherName("");
      setShowInviteTeacher(false);
    } catch (e) {
      console.error(e);
      alert("Failed to invite teacher.");
    }
  };

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const subjectId = newSubject.code || `${newSubject.course}-${newSubject.name.toLowerCase().replace(/\s/g, '-')}`;
      await setDoc(doc(db, "subjects", subjectId), {
        ...newSubject,
        id: subjectId,
        created_at: serverTimestamp()
      });
      alert("Subject added successfully!");
      setShowAddSubject(false);
      setNewSubject({
        name: "",
        code: "",
        course: "B.Tech",
        batch: "2024",
        semester: "1",
        section: "",
        teacher_email: ""
      });
    } catch (e) {
      console.error(e);
      alert("Failed to add subject.");
    }
  };

  const seedDatabase = async () => {
    if (!confirm("Are you sure you want to seed the database with mock data?")) return;
    try {
      const resp = await fetch("/api/seed", { method: "POST" });
      if (resp.ok) alert("Database seeded successfully!");
      else throw new Error("Seed failed");
    } catch (e) { alert("Seeding failed"); }
  };

  const approveUser = async (userId: string, data: any) => {
    await updateDoc(doc(db, "users", userId), { 
      role: "student", 
      onboarding_status: "approved",
      is_active: true
    });
  };

  const pendingUsers = users.filter(u => u.onboarding_status === "submitted" || u.role === "pending");

  return (
    <div className="space-y-8">
      {/* Invite Teacher Modal */}
      <AnimatePresence>
        {showInviteTeacher && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Invite Teacher</h3>
              <form onSubmit={inviteTeacher} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 px-1">Email Address</label>
                  <input 
                    required
                    type="email"
                    value={teacherEmail}
                    onChange={e => setTeacherEmail(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                    placeholder="teacher@igdtuw.ac.in"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 px-1">Full Name (Optional)</label>
                  <input 
                    value={teacherName}
                    onChange={e => setTeacherName(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                    placeholder="Prof. Name"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                   <button 
                     type="button" 
                     onClick={() => setShowInviteTeacher(false)}
                     className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl"
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit" 
                     className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100"
                   >
                     Grant Access
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Add Subject Modal */}
        {showAddSubject && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Add New Subject</h3>
              <form onSubmit={addSubject} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 px-1">Subject Name</label>
                  <input 
                    required
                    value={newSubject.name}
                    onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                    placeholder="e.g. Data Structures"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 px-1">Subject Code</label>
                  <input 
                    required
                    value={newSubject.code}
                    onChange={e => setNewSubject({...newSubject, code: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                    placeholder="e.g. IT-301"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 px-1">Course</label>
                  <select 
                    value={newSubject.course}
                    onChange={e => setNewSubject({...newSubject, course: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm"
                  >
                    <option>B.Tech</option>
                    <option>M.Tech</option>
                    <option>PhD</option>
                    <option>MBA</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 px-1">Batch (Year)</label>
                  <input 
                    required
                    type="number"
                    value={newSubject.batch}
                    onChange={e => setNewSubject({...newSubject, batch: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 px-1">Semester</label>
                  <select 
                    value={newSubject.semester}
                    onChange={e => setNewSubject({...newSubject, semester: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm"
                  >
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 px-1">Section/Group</label>
                  <input 
                    required
                    value={newSubject.section}
                    onChange={e => setNewSubject({...newSubject, section: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                    placeholder="e.g. IT-1"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 px-1">Assign Teacher Email</label>
                  <select 
                    value={newSubject.teacher_email}
                    onChange={e => setNewSubject({...newSubject, teacher_email: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm"
                  >
                    <option value="">Select a teacher...</option>
                    {users.filter(u => u.role === "teacher").map(t => (
                      <option key={t.id} value={t.email}>{t.name} ({t.email})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 flex gap-2 pt-4">
                   <button 
                     type="button" 
                     onClick={() => setShowAddSubject(false)}
                     className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl"
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit" 
                     className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100"
                   >
                     Create Subject
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="flex justify-between items-center px-2">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Admin</h1>
          <p className="text-gray-500 font-medium">Global governance and university data management.</p>
        </div>
        <div className="flex gap-2 text-left">
          <button 
            onClick={() => setShowInviteTeacher(true)}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Invite Teacher
          </button>
          <button 
            onClick={seedDatabase}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-gray-800 transition-all"
          >
            <Edit3 className="w-4 h-4" /> Seed Mock Data
          </button>
        </div>
      </header>

      {/* Admin Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {[
          { id: "users", label: "Users", icon: Users },
          { id: "courses", label: "Courses & Subjects", icon: BookOpen },
          { id: "proxies", label: "Proxy Flags", icon: ShieldAlert },
          { id: "audit", label: "Audit Log", icon: Key }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all tracking-tighter",
              activeTab === tab.id ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bento-card">
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="border-b border-gray-100">
                     <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Details</th>
                     <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role Manager</th>
                     <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Security</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 text-sm font-medium">
                   {users.map(u => (
                     <tr key={u.id}>
                       <td className="py-4">
                         <p className="font-bold text-gray-900">{u.name || "Auto-Parsed ID"}</p>
                         <p className="text-[10px] text-gray-400">{u.email}</p>
                       </td>
                       <td className="py-4">
                         <select 
                           value={u.role} 
                           onChange={(e) => updateUserRole(u.id, e.target.value)}
                           className="text-[10px] font-black uppercase bg-gray-100 px-3 py-1 rounded border-none focus:ring-0"
                         >
                           <option value="student">Student</option>
                           <option value="teacher">Teacher</option>
                           <option value="admin">Admin</option>
                           <option value="pending">Pending Review</option>
                         </select>
                       </td>
                       <td className="py-4">
                         <button 
                           onClick={() => toggleUserStatus(u.id, u.is_active)}
                           className={cn(
                             "px-3 py-1 rounded text-[10px] font-black uppercase",
                             u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                           )}
                         >
                           {u.is_active ? "Account Active" : "Suspended"}
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
          <div className="lg:col-span-4 bento-card">
             <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                 <ShieldAlert className="w-6 h-6 text-indigo-600" />
               </div>
               <div>
                  <h4 className="font-black text-gray-900">User Summary</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{users.length} Registered Nodes</p>
               </div>
             </div>
             <div className="space-y-4">
               {["admin", "teacher", "student", "pending"].map(role => (
                 <div key={role} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs font-black uppercase tracking-tighter text-gray-700">{role}</p>
                    <p className="text-sm font-black text-indigo-600">{users.filter(u => u.role === role).length}</p>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {activeTab === "courses" && (
        <div className="grid grid-cols-1 gap-8">
          <div className="bento-card">
            <div className="flex justify-between items-center mb-8 px-2">
              <h3 className="text-xl font-bold tracking-tight">Active Subjects & Teachers</h3>
              <button 
                onClick={() => setShowAddSubject(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-100"
              >
                <Plus className="w-4 h-4" /> Add Subject
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left font-medium">
                <thead>
                  <tr className="border-b border-gray-100 italic text-gray-400 text-[10px] uppercase font-black tracking-widest">
                    <th className="py-4 px-2">Subject</th>
                    <th className="py-4">Code</th>
                    <th className="py-4">Group/Sem</th>
                    <th className="py-4">Instructor</th>
                    <th className="py-4 text-right px-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {subjects.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 group hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-2">
                        <p className="font-black text-gray-900 tracking-tight">{s.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{s.course}</p>
                      </td>
                      <td className="py-4">
                        <span className="bg-gray-100 px-2 py-1 rounded-lg text-[10px] font-black">{s.code}</span>
                      </td>
                      <td className="py-4">
                        <p className="text-xs font-bold text-gray-700">{s.section}</p>
                        <p className="text-[10px] text-gray-400">Sem {s.semester} • {s.batch} Batch</p>
                      </td>
                      <td className="py-4">
                         <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-[10px] font-black border border-indigo-100">
                             {s.teacher_email?.charAt(0).toUpperCase() || "?"}
                           </div>
                           <div>
                             <p className="font-bold text-gray-900">{users.find(u => u.email === s.teacher_email)?.name || "Unassigned"}</p>
                             <p className="text-[10px] text-gray-400">{s.teacher_email || "No email linked"}</p>
                           </div>
                         </div>
                      </td>
                      <td className="py-4 text-right px-2">
                        <button 
                          onClick={() => deleteDoc(doc(db, "subjects", s.id))}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm font-medium">
              {coursesMeta.map(c => (
                <div key={c.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                    <BookOpen className="w-20 h-20" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 mb-2">{c.name}</h4>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {c.batches?.map((b: string) => (
                      <span key={b} className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase text-gray-500">{b} Batch</span>
                    ))}
                  </div>
                  <button className="mt-6 w-full py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-xl hover:bg-indigo-100 transition-all">Manage Hierarchy</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "proxies" && (
        <div className="bento-card">
          <h3 className="text-xl font-bold mb-6">System Proxy Reports</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-medium">
              <thead>
                <tr className="border-b border-gray-100 italic text-gray-400 text-xs">
                  <th className="py-4">Flag ID</th>
                  <th className="py-4">Student</th>
                  <th className="py-4">Device Fingerprint Hash (Truncated)</th>
                  <th className="py-4">Session Date</th>
                  <th className="py-4 text-right">Reason</th>
                </tr>
              </thead>
              <tbody>
                {proxyFlags.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-red-50/50 transition-colors">
                    <td className="py-4 font-mono text-[10px] tracking-tight">{p.id.slice(0, 8)}</td>
                    <td className="py-4 text-sm font-bold">{p.student_name}</td>
                    <td className="py-4 font-mono text-[10px] text-gray-400">{p.device_fingerprint_hash?.slice(0, 16)}...</td>
                    <td className="py-4 text-[10px] uppercase font-black">{new Date(p.marked_at?.toDate()).toLocaleDateString()}</td>
                    <td className="py-4 text-right text-red-600 text-[10px] font-black uppercase">{p.flag_reason || "DUPLICATE DEVICE"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="bento-card">
          <h3 className="text-xl font-bold mb-6">System Audit Logs</h3>
          <div className="space-y-4">
            {auditLogs.map(log => (
              <div key={log.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    log.action.includes("reopen") ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                  )}>
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 capitalize">{log.action.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Target: {log.target_id || "Global"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-700">{new Date(log.timestamp?.toDate()).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-black">By: {log.performed_by}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
