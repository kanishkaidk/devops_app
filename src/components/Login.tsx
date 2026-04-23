import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";
import { motion } from "motion/react";
import { LogIn, UserPlus, Mail, Lock, AlertCircle, GraduationCap } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (isForgot) {
        await sendPasswordResetEmail(auth, email);
        setMessage("Password reset email sent!");
      } else if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
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
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex justify-center items-center gap-3 py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-4 text-gray-300 font-black tracking-widest leading-none">Or Institutional ID</span>
            </div>
          </div>

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

