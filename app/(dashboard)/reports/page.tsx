import { ReportsClient } from "@/components/reports/reports-client";

export default function ReportsPage() {
  const now = new Date();
  return <ReportsClient year={now.getFullYear()} month={now.getMonth() + 1} />;
}
