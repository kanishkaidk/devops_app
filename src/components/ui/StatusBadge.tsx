import React from "react";
import { cn } from "../../lib/utils";

type StatusType = "present" | "absent" | "late" | "proxy_flagged" | "pending" | "submitted" | "overdue" | "late_submitted" | "open" | "closed" | "admin" | "teacher" | "student";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const STATUS_CONFIG: Record<StatusType, { label: string; className: string }> = {
  present: { label: "Present", className: "bg-green-100 text-green-700" },
  absent: { label: "Absent", className: "bg-red-100 text-red-700" },
  late: { label: "Late", className: "bg-amber-100 text-amber-700" },
  proxy_flagged: { label: "Flagged", className: "bg-gray-100 text-gray-700" },
  pending: { label: "Pending", className: "bg-blue-100 text-blue-700" },
  submitted: { label: "Submitted", className: "bg-green-100 text-green-700" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700" },
  late_submitted: { label: "Late Submit", className: "bg-amber-100 text-amber-700" },
  open: { label: "Open", className: "bg-indigo-100 text-indigo-700" },
  closed: { label: "Closed", className: "bg-gray-100 text-gray-700" },
  admin: { label: "Admin", className: "bg-purple-100 text-purple-700" },
  teacher: { label: "Teacher", className: "bg-blue-100 text-blue-700" },
  student: { label: "Student", className: "bg-emerald-100 text-emerald-700" },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, className: "bg-gray-100 text-gray-600" };
  
  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
