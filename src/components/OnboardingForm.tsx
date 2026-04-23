import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { ClipboardList, Send, GraduationCap } from "lucide-react";

export function OnboardingForm() {
  const { profile } = useAuth();
  const [enrollment, setEnrollment] = useState("");
  const [course, setCourse] = useState("B.Tech");
  const [batch, setBatch] = useState("2024");
  const [section, setSection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "users", profile.uid), {
        enrollment_no: enrollment,
        course,
        batch,
        section,
        onboarding_status: "submitted",
        updated_at: new Date().toISOString()
      });
      setDone(true);
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bento-card text-center space-y-6">
           <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
             <Send className="w-8 h-8" />
           </div>
           <div>
             <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Request Submitted</h2>
             <p className="text-gray-500 text-sm">Your details have been sent to the administrator. You will receive access once your enrollment is verified.</p>
           </div>
           <button 
             onClick={() => window.location.reload()}
             className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl"
           >
             Close Portal
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-xl w-full bento-card space-y-8">
        <header className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Manual Verification</h2>
            <p className="text-gray-500 text-sm font-medium">We couldn't auto-parse your email. Please provide details.</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2 md:col-span-2">
             <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest px-2">Enrollment Number</label>
             <input 
               required
               value={enrollment}
               onChange={e => setEnrollment(e.target.value)}
               placeholder="e.g. 06201032024"
               className="w-full p-4 bg-gray-100 rounded-2xl border-none font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500 transition-all"
             />
           </div>

           <div className="space-y-2">
             <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest px-2">Course</label>
             <select 
               value={course}
               onChange={e => setCourse(e.target.value)}
               className="w-full p-4 bg-gray-100 rounded-2xl border-none font-bold outline-none"
             >
               <option>B.Tech</option>
               <option>M.Tech</option>
               <option>PhD</option>
               <option>MBA</option>
             </select>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest px-2">Batch (Join Year)</label>
             <input 
               required
               type="number"
               value={batch}
               onChange={e => setBatch(e.target.value)}
               className="w-full p-4 bg-gray-100 rounded-2xl border-none font-bold outline-none"
             />
           </div>

           <div className="space-y-2 md:col-span-2">
             <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest px-2">Section / Group</label>
             <input 
               required
               value={section}
               onChange={e => setSection(e.target.value)}
               placeholder="e.g. IT-1"
               className="w-full p-4 bg-gray-100 rounded-2xl border-none font-bold outline-none"
             />
           </div>

           <button 
             disabled={submitting}
             type="submit"
             className="md:col-span-2 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
           >
             {submitting ? "Processing..." : (
               <>
                 <GraduationCap className="w-5 h-5" />
                 Submit Verification Request
               </>
             )}
           </button>
        </form>
      </div>
    </div>
  );
}
