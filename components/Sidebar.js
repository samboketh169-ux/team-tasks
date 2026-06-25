"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

const TABS = [
  { href: "/dashboard", label: "\u1791\u17c6\u1796\u17d0\u179a\u178a\u17be\u1798", icon: "\u{1F3E0}" },
  { href: "/dashboard/todo", label: "\u1780\u17b6\u179a\u1784\u17b6\u179a\u178f\u17d2\u179a\u17bc\u179c\u1792\u17d2\u179c\u17be", icon: "\u2705" },
  { href: "/dashboard/tracker", label: "\u1780\u178f\u17cb\u178f\u17d2\u179a\u17b6\u1780\u17b6\u179a\u1784\u17b6\u179a", icon: "\u{1F4CB}" },
];

export default function Sidebar({ role, email }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const tabs = role === "admin"
    ? [...TABS, { href: "/dashboard/admin", label: "Admin", icon: "\u2699\uFE0F" }]
    : TABS;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-60 bg-[#15201c] border-r border-[#22332b] z-40">
        <div className="px-5 py-6 border-b border-[#22332b]">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"\u{1F4D2}"}</span>
            <h1 className="font-display text-lg text-ink leading-tight">
              {"\u1794\u1789\u17d2\u1787\u17b8\u1780\u17b7\u1785\u17d2\u1785\u1780\u17b6\u179a\u1784\u17b6\u179a"}
              <br />
              {"\u1794\u17d2\u179a\u1785\u17b6\u17c6\u1790\u17d2\u1784\u17c3"}
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? "bg-emerald-600 text-white font-semibold shadow-sm"
                    : "text-[#a8bdb2] hover:bg-[#1d2b25] hover:text-ink"
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <span>{t.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-[#22332b]">
          <div className="text-xs text-[#7c9286] truncate mb-2">{email}</div>
          <button
            onClick={handleLogout}
            className="w-full text-xs py-2 rounded-lg bg-[#1d2b25] text-[#a8bdb2] hover:bg-[#26392f]"
          >
            {"\u1785\u17b6\u1780\u1785\u17c1\u1789"}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{"\u{1F4D2}"}</span>
            <h1 className="font-display text-lg text-ink">
              {"\u1794\u1789\u17d2\u1787\u17b8\u1780\u17b7\u1785\u17d2\u1785\u1780\u17b6\u179a\u1784\u17b6\u179a\u1794\u17d2\u179a\u1785\u17b6\u17c6\u1790\u17d2\u1784\u17c3"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="btn-secondary text-xs py-2 px-3">
              {"\u1785\u17b6\u1780\u1785\u17c1\u1789"}
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 mb-2">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`whitespace-nowrap flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl border ${
                  active
                    ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                    : "bg-bgCard text-inkDim border-line"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
