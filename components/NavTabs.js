"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

const TABS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/todo", label: "ការងារត្រូវធ្វើ" },
  { href: "/dashboard/tracker", label: "កត់ត្រាការងារ" },
];

export default function NavTabs({ role, email }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const tabs = role === "admin" ? [...TABS, { href: "/dashboard/admin", label: "Admin" }] : TABS;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-display text-xl">កិច្ចការក្រុម</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-inkFaint hidden sm:inline">{email}</span>
          <button onClick={handleLogout} className="btn-secondary text-xs py-2 px-3">
            ចាកចេញ
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`whitespace-nowrap text-sm px-4 py-2 rounded-xl border ${
                active
                  ? "bg-ember text-[#1a0d06] border-ember font-semibold"
                  : "bg-bgCard text-inkDim border-line"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
