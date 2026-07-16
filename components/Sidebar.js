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
      <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-60 z-40"
        style={{ background: "linear-gradient(180deg,#fffbea 0%,#fef3c7 60%,#fde68a 100%)", borderRight: "1px solid #f9d94e" }}>

        <div className="px-5 py-6" style={{ borderBottom: "1px solid #f9d94e" }}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"\u{1F4D2}"}</span>
            <h1 className="font-display text-lg leading-tight" style={{ color: "#78350f" }}>
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={active
                  ? { background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", boxShadow: "0 4px 12px -2px rgba(217,119,6,0.45)" }
                  : { color: "#92400e" }
                }
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(251,191,36,0.25)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span className="text-lg">{t.icon}</span>
                <span>{t.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4" style={{ borderTop: "1px solid #f9d94e" }}>
          <div className="text-xs truncate mb-2" style={{ color: "#b45309" }}>{email}</div>
          <button
            onClick={handleLogout}
            className="w-full text-xs py-2 rounded-lg transition-colors"
            style={{ background: "#fde68a", color: "#78350f", border: "1px solid #f9d94e" }}
          >
            {"\u1785\u17b6\u1780\u1785\u17c1\u1789"}
          </button>
          <div className="text-center mt-3" style={{ fontSize: "10px", color: "#b45309" }}>
            {"\u00a9 \u179a\u1780\u17d2\u179f\u17b6\u179f\u17b7\u1791\u17d2\u1792\u17b7\u178a\u17c4\u1799 \u1780\u17c1\u178f \u179f\u17c6\u1794\u17bc\u179a"}
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{"\u{1F4D2}"}</span>
            <h1 className="font-display text-lg" style={{ color: "#78350f" }}>
              {"\u1794\u1789\u17d2\u1787\u17b8\u1780\u17b7\u1785\u17d2\u1785\u1780\u17b6\u179a\u1784\u17b6\u179a\u1794\u17d2\u179a\u1785\u17b6\u17c6\u1790\u17d2\u1784\u17c3"}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs py-2 px-3 rounded-xl"
            style={{ background: "#fde68a", color: "#78350f", border: "1px solid #f9d94e" }}
          >
            {"\u1785\u17b6\u1780\u1785\u17c1\u1789"}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 mb-2">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className="whitespace-nowrap flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl border transition-all"
                style={active
                  ? { background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", borderColor: "#d97706" }
                  : { background: "#fef3c7", color: "#92400e", borderColor: "#f9d94e" }
                }
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="text-center mb-2" style={{ fontSize: "11px", color: "#b45309" }}>
          {"\u00a9 \u179a\u1780\u17d2\u179f\u17b6\u179f\u17b7\u1791\u17d2\u1792\u17b7\u178a\u17c4\u1799 \u1780\u17c1\u178f \u179f\u17c6\u1794\u17bc\u179a"}
        </div>
      </div>
    </>
  );
}
