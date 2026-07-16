"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("\u17a2\u17ca\u17b8\u1798\u17c2\u179b \u17ac \u1796\u17b6\u179f\u179c\u1785\u1793\u17cd \u1798\u17b7\u1793\u178f\u17d2\u179a\u17b9\u1798\u178f\u17d2\u179a\u17bc\u179c");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: "linear-gradient(160deg,#fffbea 0%,#fef3c7 50%,#fde68a 100%)",
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-7 mb-4"
        style={{
          background: "rgba(255,255,255,0.65)",
          border: "1px solid #f9d94e",
          boxShadow: "0 8px 32px -8px rgba(180,130,0,0.18), 0 1px 3px rgba(0,0,0,0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2 mb-5">
          <span className="text-3xl">{"\u{1F4D2}"}</span>
          <div>
            <h1
              className="font-display text-2xl"
              style={{ color: "#78350f" }}
            >
              {"\u1785\u17bc\u179b\u1794\u17d2\u179a\u17be\u1794\u17d2\u179a\u17b6\u179f\u17cb"}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#b45309" }}>
              {"\u1782\u178e\u1793\u17b8\u178f\u17d2\u179a\u17bc\u179c\u1794\u1784\u17d2\u1780\u17be\u178f\u178a\u17c4\u1799 Admin \u1794\u17c9\u17bb\u178e\u17d2\u178e\u17c4\u17c7"}
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <label
            className="text-xs uppercase font-semibold tracking-wide"
            style={{ color: "#b45309" }}
          >
            {"\u17a2\u17ca\u17b8\u1798\u17c2\u179b"}
          </label>
          <input
            className="w-full rounded-xl px-3 py-2.5 mt-1 mb-4 text-sm outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1px solid #f9d94e",
              color: "#1c1400",
            }}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <label
            className="text-xs uppercase font-semibold tracking-wide"
            style={{ color: "#b45309" }}
          >
            {"\u1796\u17b6\u179f\u179c\u1785\u1793\u17cd"}
          </label>
          <input
            className="w-full rounded-xl px-3 py-2.5 mt-1 mb-4 text-sm outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1px solid #f9d94e",
              color: "#1c1400",
            }}
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
          />

          {error && (
            <p className="text-sm mb-3" style={{ color: "#dc2626" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: loading
                ? "#d97706"
                : "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
              color: "#fff",
              border: "none",
              boxShadow: "0 4px 14px -4px rgba(217,119,6,0.5)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading
              ? "\u1780\u17c6\u1796\u17bb\u1784\u1785\u17bc\u179b..."
              : "\u1785\u17bc\u179b\u1794\u17d2\u179a\u17be\u1794\u17d2\u179a\u17b6\u179f\u17cb"}
          </button>
        </form>
      </div>

      <p className="text-xs" style={{ color: "#b45309" }}>
        {"\u00a9 \u179a\u1780\u17d2\u179f\u17b6\u179f\u17b7\u1791\u17d2\u1792\u17b7\u178a\u17c4\u1799 \u1780\u17c1\u178f \u179f\u17c6\u1794\u17bc\u179a"}
      </p>
    </div>
  );
}
