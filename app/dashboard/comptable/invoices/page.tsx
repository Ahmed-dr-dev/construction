import { redirect } from "next/navigation";

export default function ComptableInvoicesRedirect() {
  redirect("/dashboard/invoices");
}
