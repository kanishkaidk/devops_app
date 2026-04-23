import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import crypto from "crypto";
import { db } from "./src/lib/firebase"; // Using relative path for server

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });
  const PORT = 3000;

  app.use(express.json());

  // Socket rooms
  io.on("connection", (socket) => {
    socket.on("join_subject", (subjectId) => {
      socket.join(`subject_${subjectId}`);
    });
    socket.on("join_session", (sessionId) => {
      socket.join(`session_${sessionId}`);
    });
    socket.on("join_user", (userId) => {
      socket.join(`user_${userId}`);
    });
  });

  // API Route for Domain Validation
  app.post("/api/auth/validate-domain", (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    const whitelist = ["kanishkabanswalsgs@gmail.com", "jiya14102006@gmail.com"];
    const isWhitelisted = whitelist.includes(email);
    const isIgdtuw = email.endsWith("@igdtuw.ac.in");
    if (!isWhitelisted && !isIgdtuw) return res.status(403).json({ allowed: false });
    res.json({ allowed: true });
  });

  // --- ATTENDANCE SYSTEM APIS ---

  app.post("/api/attendance/mark", async (req, res) => {
    const { sessionId, studentId, studentName, windowNo, fingerprint } = req.body;

    try {
      // 1. Verify session is still open
      const sessionSnap = await getDoc(doc(db, "attendance_sessions", sessionId));
      if (!sessionSnap.exists() || sessionSnap.data()?.status !== "open") {
        return res.status(410).json({ error: "Session window is closed." });
      }

      // 2. Rate limit: check if student already marked for this session
      const qExisting = query(
        collection(db, "attendance_records"),
        where("session_id", "==", sessionId),
        where("student_id", "==", studentId)
      );
      const existingSnap = await getDocs(qExisting);
      if (!existingSnap.empty) {
        return res.status(409).json({ error: "Attendance already marked for this session." });
      }

      // 3. Fingerprint hashing
      const { userAgent, screenWidth, screenHeight, timezone } = fingerprint;
      const fingerString = `${userAgent}|${screenWidth}|${screenHeight}|${timezone}`;
      const fingerprintHash = crypto.createHash("sha256").update(fingerString).digest("hex");

      // 4. Proxy Detection: check if this fingerprint has already been used in this session
      const qProxy = query(
        collection(db, "attendance_records"),
        where("session_id", "==", sessionId),
        where("device_fingerprint_hash", "==", fingerprintHash)
      );
      const proxySnap = await getDocs(qProxy);
      const isPotentialProxy = !proxySnap.empty;

      // 5. Save record
      const recordData = {
        session_id: sessionId,
        student_id: studentId,
        student_name: studentName,
        status: isPotentialProxy ? "proxy_flagged" : (windowNo === 2 ? "late" : "present"),
        marked_at: serverTimestamp(),
        window_no: windowNo,
        device_fingerprint_hash: fingerprintHash,
        flag_reason: isPotentialProxy ? "Duplicate device fingerprint detected." : null
      };

      await addDoc(collection(db, "attendance_records"), recordData);

      // Notify teacher room of new attendance for live counter
      io.to(`session_${sessionId}`).emit("attendance_updated", { count_increment: 1 });

      res.json({ success: true, status: recordData.status });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/attendance/open", async (req, res) => {
    const { subjectId, teacherId, lectureNo, isConsecutive, duration, gap, subjectName } = req.body;
    
    try {
      const sessionRef = await addDoc(collection(db, "attendance_sessions"), {
        subject_id: subjectId,
        teacher_id: teacherId,
        lecture_no: lectureNo,
        is_consecutive: isConsecutive,
        status: "open",
        window_duration_mins: duration,
        gap_mins: gap || 0,
        opened_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + duration * 60000).toISOString(),
        created_at: serverTimestamp()
      });

      const windowClosesAt = new Date(Date.now() + duration * 60000).toISOString();

      io.to(`subject_${subjectId}`).emit("attendance_open", {
        session_id: sessionRef.id,
        subject_name: subjectName,
        window_closes_at: windowClosesAt,
        window_no: 1
      });

      // Auto-close Window 1
      setTimeout(async () => {
        await updateDoc(doc(db, "attendance_sessions", sessionRef.id), { status: "closed", closed_at: new Date().toISOString() });
        io.to(`session_${sessionRef.id}`).emit("attendance_closed", { session_id: sessionRef.id });
        
        // Handle consecutive logic if needed
        if (isConsecutive) {
           setTimeout(() => {
             io.to(`subject_${subjectId}`).emit("attendance_open_window_2", {
               session_id: sessionRef.id,
               window_closes_at: new Date(Date.now() + duration * 60000).toISOString(),
               window_no: 2
             });
           }, (gap || 0) * 60000);
        }
      }, duration * 60000);

      res.json({ sessionId: sessionRef.id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/attendance/manual-mark", async (req, res) => {
    const { recordId, sessionId, studentId, status, teacherId, reason } = req.body;
    try {
      if (recordId) {
        await updateDoc(doc(db, "attendance_records", recordId), { status });
      } else {
        await addDoc(collection(db, "attendance_records"), {
          session_id: sessionId,
          student_id: studentId,
          status,
          marked_at: serverTimestamp(),
          is_manual: true
        });
      }

      await addDoc(collection(db, "audit_log"), {
        action: "manual_attendance_mark",
        performed_by: teacherId,
        target_id: studentId,
        target_type: "student",
        reason,
        timestamp: serverTimestamp()
      });

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/attendance/reopen-for-student", async (req, res) => {
    const { sessionId, studentId, teacherId, duration = 2 } = req.body;
    try {
      const expiresAt = new Date(Date.now() + duration * 60000).toISOString();
      
      // We don't update the global session, we just notify the individual student
      // The student's client will show the mark button if they receive this targeted event
      io.to(`user_${studentId}`).emit("attendance_reopen_targeted", {
         session_id: sessionId,
         expires_at: expiresAt
      });

      await addDoc(collection(db, "audit_log"), {
        action: "targeted_attendance_reopen",
        performed_by: teacherId,
        target_id: studentId,
        target_type: "student",
        reason: "Teacher manually extended window",
        timestamp: serverTimestamp()
      });

      res.json({ success: true, expiresAt });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- ASSIGNMENTS API ---
  app.post("/api/assignments", async (req, res) => {
    try {
      const docRef = await addDoc(collection(db, "assignments"), {
        ...req.body,
        created_at: serverTimestamp()
      });
      res.json({ id: docRef.id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/assignments/:id/mark-offline", async (req, res) => {
    const { studentId, submitted } = req.body;
    try {
      const q = query(collection(db, "assignment_submissions"), 
                      where("assignment_id", "==", req.params.id), 
                      where("student_id", "==", studentId));
      const snap = await getDocs(q);
      if (snap.empty) {
        await addDoc(collection(db, "assignment_submissions"), {
          assignment_id: req.params.id,
          student_id: studentId,
          status: submitted ? "submitted" : "pending",
          submitted_at: submitted ? new Date().toISOString() : null,
          offline_marked_submitted: submitted
        });
      } else {
        await updateDoc(doc(db, "assignment_submissions", snap.docs[0].id), {
          status: submitted ? "submitted" : "pending",
          offline_marked_submitted: submitted
        });
      }
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // --- QUIZZES API ---
  app.post("/api/quizzes", async (req, res) => {
    try {
      const docRef = await addDoc(collection(db, "quizzes"), { ...req.body, created_at: serverTimestamp() });
      res.json({ id: docRef.id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/quizzes/:id/questions", async (req, res) => {
    try {
      const qCol = collection(db, "quizzes", req.params.id, "questions");
      await addDoc(qCol, req.body);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/quizzes/:id/attempt", async (req, res) => {
    const { studentId, answers, score, total } = req.body;
    try {
      await addDoc(collection(db, "quiz_attempts"), {
        quiz_id: req.params.id,
        student_id: studentId,
        answers,
        score,
        total,
        attempted_at: serverTimestamp()
      });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/seed", async (req, res) => {
    try {
      const { seedDevelopmentData } = await import("./src/lib/seed");
      await seedDevelopmentData();
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
