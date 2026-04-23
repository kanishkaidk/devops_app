# Security Specification

## Data Invariants
1. A student can only mark attendance if a session is currently `open`.
2. A teacher can only manage subjects assigned to them in `teacher_subjects`.
3. Attendance records are unique per `(session_id, student_id)`.
4. Role changes (setting `role` to `admin` or `teacher`) can ONLY be done by existing admins.
5. `created_at` and `uid` fields on User objects are immutable.

## The Dirty Dozen (Attacker Payloads)
1. **The Ghost Admin**: Unauthenticated user tries `CREATE /users/hacker {role: 'admin'}`. (Expected: DENIED)
2. **Identity Theft**: Auth'd user `A` tries `UPDATE /users/B {name: 'New Name'}`. (Expected: DENIED)
3. **The Forever Window**: Student tries `UPDATE /attendance_sessions/XYZ {status: 'open'}` to reopen sign-ins. (Expected: DENIED)
4. **Proxy Injection**: Student tries `CREATE /attendance_records/123 {student_id: 'target_friend_uid'}`. (Expected: DENIED)
5. **Mark Inflation**: Student tries `UPDATE /marks/123 {obtained_marks: 100}`. (Expected: DENIED)
6. **Privilege Escalation**: Student `S` tries `UPDATE /users/S {role: 'teacher'}`. (Expected: DENIED)
7. **Session Hijack**: Teacher `T1` tries `DELETE /attendance_sessions/T2_SESSION`. (Expected: DENIED)
8. **Shadow Field**: User tries adding `is_verified: true` to a profile update that only allows `name`. (Expected: DENIED)
9. **Junk ID Poisoning**: Long string/malicious ID injection on `attendance_records`. (Expected: DENIED)
10. **Query Scrape**: Authenticated user tries `LIST /audit_log`. (Expected: DENIED)
11. **Time Travel**: Student sends `marked_at: "2020-01-01"` in the future or past. (Expected: DENIED)
12. **Relationship Bypass**: Student marks attendance for a subject they aren't enrolled in (if enforced). (Expected: DENIED)
