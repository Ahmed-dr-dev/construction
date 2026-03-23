"use client";

import { useEffect, useState } from "react";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { History, User, Calendar } from "lucide-react";

export default function ActivityLogsPage() {
  const { isAuthorized } = useRoleGuard(["admin"]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity-logs?limit=200")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs || []))
      .finally(() => setLoading(false));
  }, []);

  if (!isAuthorized) return null;
  if (loading) return <div className="text-center py-12 text-gray-600 dark:text-gray-400">Chargement...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <History className="w-7 h-7" />
        Historique des actions
      </h1>
      <div className="card dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Utilisateur</th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Action</th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Type</th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucune action enregistrée
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 flex items-center gap-2 text-gray-900 dark:text-white">
                      <User className="w-4 h-4 text-gray-500" />
                      {log.user?.full_name || "Système"}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{log.action}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs">
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(log.created_at).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
