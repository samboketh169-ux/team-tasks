import { createClient } from "@/lib/supabaseServer";
import NavTabs from "@/components/NavTabs";

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
    <div className="max-w-3xl mx-auto px-4 pb-24 pt-6">
      <NavTabs role={role} email={user?.email} />
      <div className="mt-5">{children}</div>
    </div>
  );
}
