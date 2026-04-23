import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, sendPasswordResetEmail } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { motion } from "motion/react";
import { LogIn, UserPlus, Mail, Lock, AlertCircle, GraduationCap } from "lucide-react";

function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return "Authentication failed. Please try again.";
  }

  switch (error.code) {
    case "auth/invalid-credential":
      return "Invalid email or password. If this account was previously Google-only, use Sign up to create a password account or reset your password.";
    case "auth/user-not-found":
      return "No account found for this email. Use Sign up to create one.";
    case "auth/wrong-password":
      return "Incorrect password. Try again or use Forgot your password.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/operation-not-allowed":
      return "Email/password authentication is not enabled for this Firebase project.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    default:
      return error.message || "Authentication failed. Please try again.";
  }
}

async function hasInvitedProfile(email: string) {
  const userQuery = query(collection(db, "users"), where("email", "==", email), limit(1));
  const snap = await getDocs(userQuery);
  return !snap.empty;
}

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();
    try {
      if (isForgot) {
        await sendPasswordResetEmail(auth, normalizedEmail);
        setMessage("Password reset email sent!");
      } else if (isLogin) {
        await signInWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
      } else {
        await createUserWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
      }
    } catch (err) {
      if (isLogin && err instanceof FirebaseError && err.code === "auth/invalid-credential") {
        try {
          const invited = await hasInvitedProfile(normalizedEmail);
          if (invited) {
            const signInMethods = await fetchSignInMethodsForEmail(auth, normalizedEmail);

            // Existing auth account: this is a real credential mismatch, do not try account creation.
            if (signInMethods.length > 0) {
              setError("Invalid email or password. Try again or use Forgot your password.");
              return;
            }

            await createUserWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
            setMessage("Account activated successfully. You are now signed in.");
            return;
          }
        } catch (activationErr) {
          if (activationErr instanceof FirebaseError && activationErr.code === "auth/email-already-in-use") {
            setError("This email already has an account. Please sign in with the correct password or use Forgot your password.");
            return;
          }
          setError(getAuthErrorMessage(activationErr));
          return;
        }
      }
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-8">
      <div className="bg-white p-4 rounded-[2rem] shadow-2xl border border-gray-100 flex flex-col md:flex-row w-full max-w-4xl overflow-hidden min-h-[550px]">
        {/* Left Side: Art/Info */}
        <div className="hidden md:flex md:w-5/12 bg-indigo-600 p-8 rounded-[1.5rem] flex-col justify-between text-white relative h-full">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <GraduationCap className="w-64 h-64 -mr-20 -mt-20" />
          </div>
          <div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-black leading-tight tracking-tight">Academic <br/>Portal</h2>
          </div>
          <p className="text-indigo-100 text-sm font-medium leading-relaxed">
            Welcome to the IGDTUW system. Log in with your institutional credentials.
          </p>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center bg-white h-full relative">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {isForgot ? "Reset Password" : isLogin ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-sm text-gray-400 mt-1 font-medium">Student / Staff / Admin Entrance</p>
            </div>

            <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
               <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Role Guidance</p>
               <p className="text-[11px] text-indigo-900/60 leading-relaxed">
                 Institutional ID (igdtuw.ac.in) for students. Registered external emails for faculty/admin.
               </p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start mb-6">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                <p className="text-xs text-red-700 font-bold">{error}</p>
              </div>
            )}

        {message && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <p className="text-sm text-green-700">{message}</p>
          </div>
        )}

        <div className="space-y-4">
          <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-10 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Email address (@igdtuw.ac.in)"
              />
            </div>
            {!isForgot && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-10 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            {!isForgot && (
              <button
                type="button"
                onClick={() => setIsForgot(true)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot your password?
              </button>
            )}
            {isForgot && (
              <button
                type="button"
                onClick={() => setIsForgot(false)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Back to login
              </button>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Processing..." : isForgot ? "Send Link" : isLogin ? "Sign in" : "Sign up"}
            </button>
          </div>
        </form>
      </div>

        <div className="text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setIsForgot(false);
            }}
            className="text-sm text-gray-600 hover:text-indigo-600 font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
        </div>
      </div>
    </div>
  );
}

