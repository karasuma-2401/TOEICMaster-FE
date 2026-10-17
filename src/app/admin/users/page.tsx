import { Suspense } from "react";
import {
  UsersPage,
  UsersPageSkeleton,
} from "@/features/admin/components/users-page";

export default function AdminUsersRoute() {
  return (
    <Suspense fallback={<UsersPageSkeleton />}>
      <UsersPage />
    </Suspense>
  );
}
