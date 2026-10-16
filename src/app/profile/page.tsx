import { ProfilePanel } from "@/features/user/components/profile-panel";

export default function ProfilePage() {
  return (
    <main className="min-h-dvh bg-[#fffdfc] px-6 py-12 sm:px-10 lg:flex lg:items-center lg:justify-center">
      <div className="w-full max-w-[426px]">
        <ProfilePanel />
      </div>
    </main>
  );
}
