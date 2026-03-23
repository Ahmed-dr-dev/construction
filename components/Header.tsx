"use client";

import { User } from "lucide-react";
import { type UserRole, ROLE_LABELS, ROLE_BADGE_CLASSES } from "@/lib/rbac";

interface HeaderProps {
  title: string;
  userName?: string;
  userRole?: UserRole | string;
}

export default function Header({ title, userName, userRole }: HeaderProps) {
  const role       = (userRole ?? "personnel") as UserRole;
  const roleLabel  = ROLE_LABELS[role]        ?? role;
  const badgeClass = ROLE_BADGE_CLASSES[role] ?? "bg-gray-100 text-gray-700";

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{userName || "Utilisateur"}</p>
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
                {roleLabel}
              </span>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
