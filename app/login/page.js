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
      setError("អ៊ីមែល ឬ ពាសវចន៍ មិនត្រឹមត្រូវ");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="card w-full max-w-sm p-6">
        <h1 className="font-display text-2xl mb-1">ចូលប្រើប្រាស់</h1>
        <p className="text-inkFaint text-sm mb-6">
          គណនីត្រូវបង្កើតដោយ Admin ប៉ុណ្ណោះ
        </p>

        <label className="text-xs uppercase text-inkFaint">អ៊ីមែល</label>
        <input
          className="input-box mt-1 mb-4"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <label className="text-xs uppercase text-inkFaint">ពាសវចន៍</label>
        <input
          className="input-box mt-1 mb-4"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {error && <p className="text-ember text-sm mb-3">{error}</p>}

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "កំពុងចូល..." : "ចូលប្រើប្រាស់"}
        </button>
      </form>
    </div>
  );
}
