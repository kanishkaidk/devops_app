import { collection, addDoc, getDocs, writeBatch, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const seedDevelopmentData = async () => {
  const batch = writeBatch(db);
  
  // 1. Subjects
  const subjects = [
    { id: "IT-301", name: "Operating Systems", code: "IT-301", course: "B.Tech", batch: "2024", section: "IT-1", teacher_email: "kanishkabanswalsgs@gmail.com" },
    { id: "IT-302", name: "Computer Networks", code: "IT-302", course: "B.Tech", batch: "2024", section: "IT-1", teacher_email: "jiya14102006@gmail.com" },
    { id: "IT-401", name: "Software Engineering", code: "IT-401", course: "B.Tech", batch: "2024", section: "IT-2", teacher_email: "jiya14102006@gmail.com" },
  ];

  try {
    for (const sub of subjects) {
      const subRef = doc(db, "subjects", sub.id);
      batch.set(subRef, sub);
    }

    // 2. Users (Admin, Teachers, Students)
    const specialUsers = [
      { uid: "kanishka-lead-admin", name: "Kanishka (Lead)", email: "kanishkabanswalsgs@gmail.com", role: "admin", is_active: true },
      { uid: "jiya-staff-teacher", name: "Jiya Staff", email: "jiya14102006@gmail.com", role: "teacher", is_active: true }
    ];
    for (const u of specialUsers) {
      const uRef = doc(db, "users", u.uid);
      batch.set(uRef, { ...u, created_at: serverTimestamp() });
    }

    const students = [
      { uid: "st-001", name: "Ananya Sharma", enrollment_no: "00101032024", batch: "2024", course: "B.Tech", section: "IT-1", role: "student", is_active: true, email: "ananya@igdtuw.ac.in" },
      { uid: "st-002", name: "Priya Verma", enrollment_no: "00201032024", batch: "2024", course: "B.Tech", section: "IT-1", role: "student", is_active: true, email: "priya@igdtuw.ac.in" },
      { uid: "st-003", name: "Sneha Gupta", enrollment_no: "00301032024", batch: "2024", course: "B.Tech", section: "IT-1", role: "student", is_active: true, email: "sneha@igdtuw.ac.in" },
    ];

    for (const s of students) {
      const sRef = doc(db, "users", s.uid);
      batch.set(sRef, s);
    }

    // 3. Courses metadata (for Admin list)
    const courses = [
      { id: "btech-it", name: "B.Tech IT", departments: ["IT"], batches: ["2023", "2024", "2025"] },
      { id: "btech-cs", name: "B.Tech CS", departments: ["CSE"], batches: ["2024", "2025"] }
    ];
    for (const c of courses) {
      const cRef = doc(db, "courses_meta", c.id);
      batch.set(cRef, c);
    }

    await batch.commit();

    // 4. Assignments & Quizzes (cannot be batched easily with sub-collections in this tool)
    for (const sub of subjects) {
      // Assignments
      await addDoc(collection(db, "assignments"), {
        subject_id: sub.id,
        teacher_id: "system",
        title: "Module 1 Review",
        description: "Submit PDF report on storage management.",
        due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
        submission_type: "online",
        max_size_mb: 10,
        allowed_formats: ["pdf"],
        created_at: new Date().toISOString()
      });

      // Quizzes
      const quizRef = await addDoc(collection(db, "quizzes"), {
        subject_id: sub.id,
        teacher_id: "system",
        title: "Class Test #1",
        time_limit_mins: 15,
        start_time: new Date(Date.now() - 600000).toISOString(), // started 10m ago
        end_time: new Date(Date.now() + 3600000).toISOString(),
        results_released: false,
        created_at: new Date().toISOString()
      });

      // Questions
      const qCol = collection(db, "quizzes", quizRef.id, "questions");
      await addDoc(qCol, {
        question_text: "Which scheduling algorithm avoids starvation?",
        options: ["SJF", "Round Robin", "FCFS", "Priority"],
        correct_option: 1
      });
    }

    return true;
  } catch (error) {
    console.error("Seeding failed:", error);
    throw error;
  }
};
