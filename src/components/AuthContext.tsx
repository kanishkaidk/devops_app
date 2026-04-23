import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, query, where, collection, getDocs, deleteDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: "student" | "teacher" | "admin" | "pending";
  enrollment_no?: string;
  course?: string;
  batch?: string;
  section?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  onboarding_status?: string;
}

export type AdminViewMode = "admin" | "teacher" | "student";

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  adminViewMode: AdminViewMode;
  setAdminViewMode: (mode: AdminViewMode) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminViewMode, setAdminViewMode] = useState<AdminViewMode>("admin");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setError(null);
      setUser(user);
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const existingData = docSnap.data() as UserProfile;
            const parsed = parseIgdtuwEmail(user.email || "");
            
            // Override role for whitelisted users if they are already in DB with wrong role
            if (parsed.isValid && parsed.details?.role && existingData.role !== parsed.details.role) {
                const refreshedProfile = { ...existingData, role: parsed.details.role as any };
                await updateDoc(docRef, { role: parsed.details.role });
                setProfile(refreshedProfile);
            } else {
                setProfile(existingData);
            }
          } else {
            // CHECK FOR INVITED PROFILE BY EMAIL
            const q = query(collection(db, "users"), where("email", "==", user.email));
            const invitedSnap = await getDocs(q);
            
            if (!invitedSnap.empty) {
                // Link the invited profile to this UID
                const invitedDoc = invitedSnap.docs[0];
                const invitedData = invitedDoc.data();
                
                const initialProfile: UserProfile = {
                  uid: user.uid,
                  email: user.email || "",
                  name: user.displayName || invitedData.name || "User",
                  role: invitedData.role || "pending",
                  is_active: true,
                  onboarding_status: "approved",
                  created_at: invitedData.created_at || new Date().toISOString()
                } as UserProfile;
                
                await setDoc(docRef, initialProfile);
                // Delete the old "skeleton" doc if it had a different ID
                if (invitedDoc.id !== user.uid) {
                    await deleteDoc(doc(db, "users", invitedDoc.id));
                }
                setProfile(initialProfile);
            } else {
                const parsed = parseIgdtuwEmail(user.email || "");
                const initialProfile: UserProfile = {
                  uid: user.uid,
                  email: user.email || "",
                  name: user.displayName || parsed.name || "User",
                  role: (parsed.details?.role || (parsed.isValid ? "student" : "pending")) as any,
                  is_active: true,
                  ...parsed.details,
                  created_at: new Date().toISOString()
                } as UserProfile;
                await setDoc(docRef, initialProfile);
                setProfile(initialProfile);
            }
          }
        } catch (err: any) {
          console.error("AuthContext Error:", err);
          if (err.code === "permission-denied") {
            setError("Database access denied. This account might not be authorized.");
          } else {
            setError(err.message);
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

function parseIgdtuwEmail(email: string) {
  const [prefix, domain] = email.split("@");
  
  // Specific Whitelisted Roles
  if (email === "kanishkabanswalsgs@gmail.com") {
    return {
      isValid: true,
      name: "Kanishka (Lead)",
      details: { role: "admin", is_active: true }
    };
  }
  if (email === "jiya14102006@gmail.com") {
    return {
      isValid: true,
      name: "Jiya Staff",
      details: { role: "teacher", is_active: true }
    };
  }

  // Auto-parsing for IGDTUW domain students
  if (domain === "igdtuw.ac.in") {
    const match = prefix.match(/^([a-z]+)(\d{3})(bt|mtech)([a-z]+)(\d{2})$/);
    if (match) {
      const [, name, roll, type, branch, year] = match;
      let branchCode = "0101"; 
      if (branch === "it") branchCode = "0103";
      if (branch === "cs") branchCode = "0102";
      
      const enrollmentNo = `${roll}${branchCode}20${year}`;
      
      return {
        isValid: true,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        details: {
          role: "student",
          enrollment_no: enrollmentNo,
          course: type === "bt" ? "B.Tech" : "M.Tech",
          batch: `20${year}`,
          section: `${branch.toUpperCase()}-${parseInt(roll) <= 60 ? 1 : 2}`
        }
      };
    }
  }

  // Fallback for non-patten emails (Manual Onboarding Needed)
  return { 
    isValid: false, 
    name: prefix.charAt(0).toUpperCase() + prefix.slice(1),
    details: { role: "pending" } 
  };
}

  const logout = () => auth.signOut();

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, adminViewMode, setAdminViewMode, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
