import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  badge?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "orange" | "red";
  size?: "default" | "featured";
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  badge,
  trend,
  color = "blue",
  size = "default",
  className = "",
}: StatCardProps) {
  const colorClasses = {
    blue: {
      card: "border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-white",
      icon: "bg-blue-100 text-blue-600",
      accent: "from-blue-500 to-cyan-500",
      badge: "bg-blue-100 text-blue-700",
    },
    green: {
      card: "border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-white",
      icon: "bg-emerald-100 text-emerald-600",
      accent: "from-emerald-500 to-green-500",
      badge: "bg-emerald-100 text-emerald-700",
    },
    orange: {
      card: "border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-white",
      icon: "bg-orange-100 text-orange-600",
      accent: "from-orange-500 to-amber-500",
      badge: "bg-orange-100 text-orange-700",
    },
    red: {
      card: "border-red-200/70 bg-gradient-to-br from-red-50 via-white to-white",
      icon: "bg-red-100 text-red-600",
      accent: "from-red-500 to-rose-500",
      badge: "bg-red-100 text-red-700",
    },
  };

  const theme = colorClasses[color];
  const isFeatured = size === "featured";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.card} ${className}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {badge && (
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${theme.badge}`}>
                {badge}
              </span>
            )}
          </div>
          <p className={`${isFeatured ? "text-4xl md:text-5xl" : "text-3xl"} font-bold tracking-tight text-gray-900`}>
            {value}
          </p>
          {description && (
            <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p>
          )}
          {trend && (
            <p
              className={`mt-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className={`rounded-2xl ${isFeatured ? "p-4" : "p-3.5"} ${theme.icon}`}>
          <Icon className={`${isFeatured ? "h-9 w-9" : "h-7 w-7"}`} />
        </div>
      </div>
    </div>
  );
}



