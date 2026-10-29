import { Suspense } from "react";
import { DataBankCenter } from "@/features/admin/components/data-bank-center";

export default function AdminExamsPage() {
  return (
    <Suspense
      fallback={
        <div
          aria-busy="true"
          className="h-72 animate-pulse rounded-2xl bg-[var(--admin-skeleton)]"
        />
      }
    >
      <DataBankCenter />
    </Suspense>
  );
}
