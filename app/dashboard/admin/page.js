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
  const [currentUserId, setCurrentUserId] = useState(null);

  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [tgMsg, setTgMsg] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("member");
  const [editBusy, setEditBusy] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

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

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  }

  useEffect(() => {
    loadMembers();
    loadTelegram();
    loadCurrentUser();
  }, []);

  async function createUser(e) {
    e.preventDefault();
    setMsg("\u1780\u17c6\u1796\u17bb\u1784\u1794\u1784\u17d2\u1780\u17be\u178f...");
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName, role }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg("\u1798\u17b6\u1793\u1794\u1789\u17d2\u17a0\u17b6\u17d6 " + (json.error || "unknown"));
      return;
    }
    setMsg("\u1794\u17b6\u1793\u1794\u1784\u17d2\u1780\u17be\u178f\u1782\u178e\u1793\u17b8\u178a\u17c4\u1799\u1787\u17c4\u1782\u1787\u17d0\u1799 \u2713");
    setEmail("");
    setPassword("");
    setFullName("");
    loadMembers();
  }

  async function saveTelegram(e) {
    e.preventDefault();
    setTgMsg("\u1780\u17c6\u1796\u17bb\u1784\u179a\u1780\u17d2\u179f\u17b6\u1791\u17bb\u1780...");
    const { error } = await supabase
      .from("telegram_settings")
      .upsert({ id: 1, bot_token: botToken, chat_id: chatId });
    setTgMsg(error ? "\u1798\u17b6\u1793\u1794\u1789\u17d2\u17a0\u17b6\u17d6 " + error.message : "\u1794\u17b6\u1793\u179a\u1780\u17d2\u179f\u17b6\u1791\u17bb\u1780 \u2713");
  }

  async function testTelegram() {
    setTgMsg("\u1780\u17c6\u1796\u17bb\u1784\u1795\u17d2\u1789\u17be\u179f\u17b6\u179a\u179f\u17b6\u1780\u179b\u17d2\u1794\u1784...");
    const res = await fetch("/api/telegram-test", { method: "POST" });
    const json = await res.json();
    setTgMsg(res.ok ? "\u1794\u17b6\u1793\u1795\u17d2\u1789\u17be\u179f\u17b6\u179a\u179f\u17b6\u1780\u179b\u17d2\u1794\u1784\u178a\u17c4\u1799 Telegram \u2713" : "\u1794\u179a\u17b6\u1787\u17d0\u1799\u17d6 " + json.error);
  }

  function openEdit(m) {
    setEditingId(m.id);
    setEditName(m.full_name);
    setEditRole(m.role);
  }

  function closeEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editName.trim()) return;
    setEditBusy(true);
    const res = await fetch("/api/admin/update-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: editingId, fullName: editName.trim(), role: editRole }),
    });
    const json = await res.json();
    setEditBusy(false);
    if (!res.ok) {
      setMsg("\u1798\u17b6\u1793\u1794\u1789\u17d2\u17a0\u17b6\u17d6 " + (json.error || "unknown"));
      return;
    }
    setMsg("\u1794\u17b6\u1793\u1780\u17c2\u1794\u17d2\u179a\u17c2\u1782\u178e\u1793\u17b8\u178a\u17c4\u1799\u1787\u17c4\u1782\u1787\u17d0\u1799 \u2713");
    setEditingId(null);
    loadMembers();
  }

  function askDelete(m) {
    setDeleteTarget(m);
  }

  function cancelDelete() {
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    const res = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: deleteTarget.id }),
    });
    const json = await res.json();
    setDeleteBusy(false);
    setDeleteTarget(null);
    if (!res.ok) {
      setMsg("\u1798\u17b6\u1793\u1794\u1789\u17d2\u17a0\u17b6\u17d6 " + (json.error || "unknown"));
      return;
    }
    setMsg("\u1794\u17b6\u1793\u179b\u17bb\u1794\u1782\u178e\u1793\u17b8\u178a\u17c4\u1799\u1787\u17c4\u1782\u1787\u17d0\u1799 \u2713");
    loadMembers();
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <h2 className="font-display text-lg mb-1">{"\u1794\u1784\u17d2\u1780\u17be\u178f\u1782\u178e\u1793\u17b8\u179f\u1798\u17d2\u179a\u17b6\u1794\u17cb\u179f\u1798\u17b6\u1787\u17b7\u1780\u1780\u17d2\u179a\u17bb\u1798"}</h2>
        <p className="text-xs text-inkFaint mb-4">{"\u1798\u17b7\u1793\u1798\u17b6\u1793 public signup \u1791\u17c1 \u2014 admin \u1787\u17b6\u17a2\u17d2\u1793\u1780\u1794\u1784\u17d2\u1780\u17be\u178f\u1782\u178e\u1793\u17b8\u17b1\u17d2\u1799"}</p>
        <form onSubmit={createUser} className="space-y-3">
          <input
            className="input-box"
            placeholder={"\u1788\u17d2\u1798\u17c4\u17c7\u1796\u17c1\u1789"}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            className="input-box"
            type="email"
            placeholder={"\u17a2\u17ca\u17b8\u1798\u17c2\u179b"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input-box"
            type="password"
            placeholder={"\u1796\u17b6\u179f\u179c\u1785\u1793\u17cd\u178a\u17c6\u1794\u17bc\u1784 (\u1799\u17c9\u17b6\u1784\u178f\u17b7\u1785 \u17e6 \u178f\u17bd)"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <select className="input-box" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="member">{"\u179f\u1798\u17b6\u1787\u17b7\u1780\u1780\u17d2\u179a\u17bb\u1798 (member)"}</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn-primary w-full">{"\u1794\u1784\u17d2\u1780\u17be\u178f\u1782\u178e\u1793\u17b8"}</button>
          {msg && <p className="text-sm text-sky">{msg}</p>}
        </form>
      </div>

      <div className="card p-4">
        <h2 className="font-display text-lg mb-3">{"\u179f\u1798\u17b6\u1787\u17b7\u1780\u1780\u17d2\u179a\u17bb\u1798\u1791\u17b6\u17c6\u1784\u17a2\u179f\u17cb"}</h2>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-sm border-b border-lineSoft pb-2 gap-2">
              <div className="min-w-0">
                <div className="truncate">{m.full_name}</div>
                <div className="text-inkFaint text-xs">{m.role}</div>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <button onClick={() => openEdit(m)} className="text-sky text-xs">
                  {"\u1780\u17c2\u179f\u1798\u17d2\u179a\u17bd\u179b"}
                </button>
                {m.id !== currentUserId && (
                  <button onClick={() => askDelete(m)} className="text-ember text-xs">
                    {"\u179b\u17bb\u1794"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="font-display text-lg mb-1">{"\u1780\u17b6\u179a\u1780\u17c6\u178e\u178f\u17cb Telegram"}</h2>
        <p className="text-xs text-inkFaint mb-4">
          {"\u179f\u17b6\u179a\u1791\u17b6\u17c6\u1784\u17a2\u179f\u17cb\u1795\u17d2\u1789\u17be\u1796\u17b8 Vercel Cron \u2014 \u178a\u17c6\u178e\u17be\u179a\u1780\u17b6\u179a\u178a\u17c4\u1799\u179f\u17d2\u179c\u17d0\u1799\u1794\u17d2\u179a\u179c\u178f\u17d2\u178f\u17b7"}
        </p>
        <form onSubmit={saveTelegram} className="space-y-3">
          <div>
            <label className="text-xs text-inkFaint">Bot Token</label>
            <input className="input-box mt-1" value={botToken} onChange={(e) => setBotToken(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-inkFaint">Chat ID</label>
            <input className="input-box mt-1" value={chatId} onChange={(e) => setChatId(e.target.value)} />
          </div>
          <button className="btn-primary w-full">{"\u179a\u1780\u17d2\u179f\u17b6\u1791\u17bb\u1780"}</button>
        </form>
        <button onClick={testTelegram} className="btn-secondary w-full mt-2">
          {"\u1795\u17d2\u1789\u17be\u179f\u17b6\u179a\u179f\u17b6\u1780\u179b\u17d2\u1794\u1784"}
        </button>
        {tgMsg && <p className="text-sm text-sky mt-2">{tgMsg}</p>}
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="card w-full max-w-lg rounded-b-none p-5">
            <h3 className="font-display text-lg mb-3">{"\u1780\u17c2\u179f\u1798\u17d2\u179a\u17bd\u179b\u1782\u178e\u1793\u17b8"}</h3>
            <input
              className="input-box mb-3"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <select className="input-box mb-4" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
              <option value="member">{"\u179f\u1798\u17b6\u1787\u17b7\u1780\u1780\u17d2\u179a\u17bb\u1798 (member)"}</option>
              <option value="admin">Admin</option>
            </select>
            <button className="btn-primary w-full mb-2" onClick={saveEdit} disabled={editBusy}>
              {editBusy ? "\u1780\u17c6\u1796\u17bb\u1784\u1780\u17c2\u1794\u17d2\u179a\u17c2..." : "\u179a\u1780\u17d2\u179f\u17b6\u1791\u17bb\u1780"}
            </button>
            <button className="btn-secondary w-full" onClick={closeEdit} disabled={editBusy}>
              {"\u1794\u17b7\u1791"}
            </button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="card w-full max-w-sm p-5">
            <h3 className="font-display text-lg mb-2">{"\u179b\u17bb\u1794\u1782\u178e\u1793\u17b8"}</h3>
            <p className="text-sm text-inkDim mb-4">
              {"\u178f\u17be\u17a2\u17d2\u1793\u1780\u1794\u17d2\u179a\u17b6\u1780\u178a\u1790\u17b6\u1785\u1784\u17cb\u179b\u17bb\u1794\u1782\u178e\u1793\u17b8 \"" + deleteTarget.full_name + "\" \u1793\u17c1\u17c7\u1798\u17c2\u1793\u1791\u17c1?"}
            </p>
            <button className="btn-primary w-full mb-2 bg-ember" onClick={confirmDelete} disabled={deleteBusy}>
              {deleteBusy ? "\u1780\u17c6\u1796\u17bb\u1784\u179b\u17bb\u1794..." : "\u179b\u17bb\u1794"}
            </button>
            <button className="btn-secondary w-full" onClick={cancelDelete} disabled={deleteBusy}>
              {"\u1794\u17b7\u1791"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
