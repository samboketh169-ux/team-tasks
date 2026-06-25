import { createClient } from "@/lib/supabaseServer";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let role = "member";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();
    if (profile?.role) role = profile.role;
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar role={role} email={user?.email} />
      <main className="flex-1 md:ml-60 px-4 md:px-8 pb-24 pt-6 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
