"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function AdminPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("member");
  const [msg, setMsg] = useState("");
  const [members, setMembers] = useState([]);

  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [tgMsg, setTgMsg] = useState("");

  async function loadMembers() {
    const { data } = await supabase.from("profiles").select("id, full_name, role, created_at").order("created_at");
    setMembers(data || []);
  }

  async function loadTelegram() {
    const { data } = await supabase.from("telegram_settings").select("*").eq("id", 1).maybeSingle();
    if (data) {
      setBotToken(data.bot_token || "");
      setChatId(data.chat_id || "");
    }
  }

  useEffect(() => {
    loadMembers();
    loadTelegram();
  }, []);

  async function createUser(e) {
    e.preventDefault();
    setMsg("កំពុងបង្កើត...");
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName, role }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg("មានបញ្ហា៖ " + (json.error || "unknown"));
      return;
    }
    setMsg("បានបង្កើតគណនីដោយជោគជ័យ ✓");
    setEmail("");
    setPassword("");
    setFullName("");
    loadMembers();
  }

  async function saveTelegram(e) {
    e.preventDefault();
    setTgMsg("កំពុងរក្សាទុក...");
    const { error } = await supabase
      .from("telegram_settings")
      .upsert({ id: 1, bot_token: botToken, chat_id: chatId });
    setTgMsg(error ? "មានបញ្ហា៖ " + error.message : "បានរក្សាទុក ✓");
  }

  async function testTelegram() {
    setTgMsg("កំពុងផ្ញើសារសាកល្បង...");
    const res = await fetch("/api/telegram-test", { method: "POST" });
    const json = await res.json();
    setTgMsg(res.ok ? "បានផ្ញើសារសាកល្បងទៅ Telegram ✓" : "បរាជ័យ៖ " + json.error);
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <h2 className="font-display text-lg mb-1">បង្កើតគណនីសម្រាប់សមាជិកក្រុម</h2>
        <p className="text-xs text-inkFaint mb-4">មិនមាន public signup ទេ — admin ជាអ្នកបង្កើតគណនីឱ្យ</p>
        <form onSubmit={createUser} className="space-y-3">
          <input
            className="input-box"
            placeholder="ឈ្មោះពេញ"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            className="input-box"
            type="email"
            placeholder="អ៊ីមែល"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input-box"
            type="password"
            placeholder="ពាសវចន៍ដំបូង (យ៉ាងតិច ៦ តួ)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <select className="input-box" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="member">សមាជិកក្រុម (member)</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn-primary w-full">បង្កើតគណនី</button>
          {msg && <p className="text-sm text-sky">{msg}</p>}
        </form>
      </div>

      <div className="card p-4">
        <h2 className="font-display text-lg mb-3">សមាជិកក្រុមទាំងអស់</h2>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex justify-between text-sm border-b border-lineSoft pb-2">
              <span>{m.full_name}</span>
              <span className="text-inkFaint text-xs">{m.role}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="font-display text-lg mb-1">ការកំណត់ Telegram</h2>
        <p className="text-xs text-inkFaint mb-4">
          សារទាំងអស់ត្រូវផ្ញើជា Server-side ដោយ Vercel Cron — ដំណើរការទោះបើទូរស័ព្ទបិទ
        </p>
        <form onSubmit={saveTelegram} className="space-y-3">
          <div>
            <label className="text-xs text-inkFaint">Bot Token (ពី @BotFather)</label>
            <input className="input-box mt-1" value={botToken} onChange={(e) => setBotToken(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-inkFaint">Chat ID (ឧ. -1004378631845)</label>
            <input className="input-box mt-1" value={chatId} onChange={(e) => setChatId(e.target.value)} />
          </div>
          <button className="btn-primary w-full">រក្សាទុក</button>
        </form>
        <button onClick={testTelegram} className="btn-secondary w-full mt-2">
          ផ្ញើសារសាកល្បង
        </button>
        {tgMsg && <p className="text-sm text-sky mt-2">{tgMsg}</p>}
      </div>
    </div>
  );
}
