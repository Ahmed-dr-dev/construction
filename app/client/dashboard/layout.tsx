import ClientDashboardShell from "@/components/client/ClientDashboardShell";

export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientDashboardShell>{children}</ClientDashboardShell>;
}
