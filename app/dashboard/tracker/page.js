"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function TrackerPage() {
  const supabase = createClient();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | pending | done
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [time, setTime] = useState("09:00");
  const [endDate, setEndDate] = useState(todayISO());
  const [status, setStatus] = useState("pending");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("tracker_jobs").select("*").order("created_at", { ascending: false });
    setJobs(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setName("");
    setStartDate(todayISO());
    setTime("09:00");
    setEndDate(todayISO());
    setStatus("pending");
    setNote("");
    setEditingId(null);
  }

  function openNew() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(job) {
    setEditingId(job.id);
    setName(job.name);
    setStartDate(job.start_date);
    setTime(job.time || "09:00");
    setEndDate(job.end_date || job.start_date);
    setStatus(job.status);
    setNote(job.note || "");
    setShowForm(true);
  }

  async function save() {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      start_date: startDate,
      time,
      end_date: endDate,
      status,
      note,
    };
    if (editingId) {
      await supabase.from("tracker_jobs").update(payload).eq("id", editingId);
    } else {
      await supabase.from("tracker_jobs").insert(payload);
    }
    setShowForm(false);
    resetForm();
    load();
  }

  async function toggleStatus(job) {
    const newStatus = job.status === "done" ? "pending" : "done";
    await supabase.from("tracker_jobs").update({ status: newStatus }).eq("id", job.id);
    load();
  }

  async function remove(id) {
    await supabase.from("tracker_jobs").delete().eq("id", id);
    load();
  }

  const filtered = jobs.filter((j) => {
    if (filter !== "all" && j.status !== filter) return false;
    if (search && !j.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const total = jobs.length;
  const done = jobs.filter((j) => j.status === "done").length;
  const pending = total - done;

  return (
    <div>
      <div className="card p-4 mb-4">
        <h2 className="font-display text-lg mb-1">បញ្ជីកត់ត្រាការងារ</h2>
        <p className="text-xs text-inkFaint mb-3">តាមដានការងារ ថ្ងៃចាប់ផ្តើម និងថ្ងៃកំណត់ចប់</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-bg/40 rounded-xl p-3 text-center">
            <div className="text-xl font-bold">{total}</div>
            <div className="text-xs text-inkFaint">សរុប</div>
          </div>
          <div className="bg-bg/40 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-moss">{done}</div>
            <div className="text-xs text-inkFaint">បានបញ្ចប់</div>
          </div>
          <div className="bg-ember/20 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-ember">{pending}</div>
            <div className="text-xs text-inkFaint">មិនទាន់ចប់</div>
          </div>
        </div>
      </div>

      <input
        className="input-box mb-3"
        placeholder="ស្វែងរកការងារ..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex gap-2 mb-4">
        {[
          { v: "all", l: "ទាំងអស់" },
          { v: "pending", l: "មិនទាន់ចប់" },
          { v: "done", l: "បានបញ្ចប់" },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`text-xs px-3 py-2 rounded-full border ${
              filter === f.v ? "bg-moss border-moss text-white" : "bg-bgCard border-line text-inkDim"
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {loading && <p className="text-inkFaint text-sm">កំពុងផ្ទុក...</p>}

      <div className="flex flex-col gap-2 mb-6">
        {filtered.map((j) => (
          <div key={j.id} className="card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className={`text-sm font-medium ${j.status === "done" ? "line-through text-inkFaint" : ""}`}>
                {j.name}
              </div>
              <button
                onClick={() => toggleStatus(j)}
                className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                  j.status === "done" ? "bg-moss/20 text-moss" : "bg-sky/20 text-sky"
                }`}
              >
                {j.status === "done" ? "✓ បានបញ្ចប់" : "មិនទាន់ចប់"}
              </button>
            </div>
            <div className="text-xs text-inkFaint mt-1 font-mono">
              {j.start_date} {j.time} → {j.end_date}
            </div>
            {j.note && <div className="text-xs text-inkDim mt-1">{j.note}</div>}
            <div className="flex gap-3 mt-2 text-xs">
              <button onClick={() => openEdit(j)} className="text-sky">
                កែប្រែ
              </button>
              <button onClick={() => remove(j.id)} className="text-ember">
                លុប
              </button>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="text-center text-inkFaint py-12 text-sm">មិនទាន់មានការងារនៅឡើយទេ</div>
        )}
      </div>

      <button
        onClick={openNew}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-moss text-white text-2xl shadow-lg flex items-center justify-center"
      >
        +
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="card w-full max-w-lg rounded-b-none p-5 max-h-[85vh] overflow-y-auto">
            <h3 className="font-display text-lg mb-3">{editingId ? "កែប្រែការងារ" : "បន្ថែមការងារថ្មី"}</h3>
            <input
              className="input-box mb-3"
              placeholder="ឧ. រៀបចំរបាយការណ៍ខែ"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-xs text-inkFaint">ថ្ងៃចាប់ផ្តើម</label>
                <input
                  type="date"
                  className="input-box mt-1"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-inkFaint">ម៉ោង</label>
                <input type="time" className="input-box mt-1" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <label className="text-xs text-inkFaint">ថ្ងៃកំណត់ចប់</label>
            <input
              type="date"
              className="input-box mt-1 mb-3"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setStatus("pending")}
                className={`flex-1 py-2 rounded-xl text-sm ${
                  status === "pending" ? "bg-sky text-white" : "bg-bg border border-line text-inkDim"
                }`}
              >
                មិនទាន់ចប់
              </button>
              <button
                onClick={() => setStatus("done")}
                className={`flex-1 py-2 rounded-xl text-sm ${
                  status === "done" ? "bg-moss text-white" : "bg-bg border border-line text-inkDim"
                }`}
              >
                បានបញ្ចប់
              </button>
            </div>
            <textarea
              className="input-box mb-4"
              rows={3}
              placeholder="ឧ. កំពុងរង់ចាំឯកសារពីផ្នែកគណនេយ្យ"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button className="btn-primary w-full mb-2" onClick={save}>
              {editingId ? "រក្សាទុក" : "បន្ថែមការងារ"}
            </button>
            <button className="btn-secondary w-full" onClick={() => setShowForm(false)}>
              បិទ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
