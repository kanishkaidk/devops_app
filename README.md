# IGDTUW Academic Management System

A comprehensive portal for Students, Teachers, and Admins.

## Features
- **3 Roles**: Dedicated Dashboards and access controls for Students, Faculty, and Admin.
- **Attendance System**: Live sessions with time-window restrictions and proxy flagging.
- **Marks Management**: Grade entry and student tracking.
- **Quizzes & Assignments**: Deploy assessments with integrated submission tracking.
- **Bento Design**: Modern grid-based interface with high precision typography.

## Setup Instructions

### 1. Firebase Configuration
Ensure your `firebase-applet-config.json` is correctly populated.
- Enable **Google Auth** and **Email/Password** in the Firebase Console.
- Add your app's domain to **Authorized Domains**.

### 2. Firestore Security Rules
The rules in `firestore.rules` must be deployed to secure your data.
- Standard users are restricted to `@igdtuw.ac.in`.
- Data invariants prevent students from tampering with attendance or grades.

### 3. Roles and Permissions
Users are created with `role: "pending"` by default.
- **Admin**: The email `kanishkabanswalsgs@gmail.com` is bootstrapped as the system administrator.
- **Promotions**: Admins can promote users to `teacher` or `student` from the Admin Panel.

### 4. Database Schema
- **users**: Master profile table.
- **subjects**: Course definitions.
- **attendance_sessions & records**: High-performance attendance tracking.
- **marks, assignments, quizzes**: Academic content tables.
- **audit_log**: Tracks sensitive system actions.

## Development
```bash
# Run the full-stack server (Express + Vite)
npm run dev
```
