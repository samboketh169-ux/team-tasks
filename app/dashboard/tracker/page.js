"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabaseClient";
import DateRangeFilter from "@/components/DateRangeFilter";
import RangeBarChart from "@/components/RangeBarChart";
import { exportExcel, exportPDF, exportWord } from "@/lib/exportUtils";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function statusLabel(s) {
  return s === "done" ? "\u1794\u17b6\u1793\u1794\u1789\u17d2\u1785\u1794\u17cb" : "\u1798\u17b7\u1793\u1791\u17b6\u1793\u17cb\u1785\u1794\u17cb";
}

export default function TrackerPage() {
  const supabase = createClient();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [time, setTime] = useState("09:00");
  const [endDate, setEndDate] = useState(todayISO());
  const [status, setStatus] = useState("pending");
  const [note, setNote] = useState("");

  const [from, setFrom] = useState(daysAgoISO(13));
  const [to, setTo] = useState(todayISO());

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

  const rangeJobs = useMemo(
    () => jobs.filter((j) => j.start_date >= from && j.start_date <= to),
    [jobs, from, to]
  );
  const rangeTotal = rangeJobs.length;
  const rangeDone = rangeJobs.filter((j) => j.status === "done").length;
  const rangePending = rangeTotal - rangeDone;

  const chartData = useMemo(() => {
    const map = {};
    rangeJobs.forEach((j) => {
      if (!map[j.start_date]) map[j.start_date] = { date: j.start_date, done: 0, pending: 0 };
      if (j.status === "done") map[j.start_date].done++;
      else map[j.start_date].pending++;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [rangeJobs]);

  const exportHeaders = [
    "\u1788\u17d2\u1798\u17c4\u17c7",
    "\u1790\u17d2\u1784\u17c3\u1785\u17b6\u1794\u17cb\u1795\u17d2\u178f\u17be\u1798",
    "\u1798\u17c9\u17c4\u1784",
    "\u1790\u17d2\u1784\u17c3\u1780\u17c6\u178e\u178f\u17cb\u1785\u1794\u17cb",
    "\u179f\u17d2\u178f\u17b6\u1793\u1797\u17b6\u1796",
    "\u1780\u17c6\u178e\u178f\u17cb\u1785\u17c6\u178e\u17b6\u17c6",
  ];

  function buildExportRows() {
    return rangeJobs.map((j) => [j.name, j.start_date, j.time, j.end_date, statusLabel(j.status), j.note || ""]);
  }

  function handleExportExcel() {
    exportExcel("tracker_report_" + from + "_to_" + to, exportHeaders, buildExportRows());
  }
  function handleExportPDF() {
    exportPDF(
      "tracker_report_" + from + "_to_" + to,
      "\u179a\u1794\u17b6\u1799\u1780\u17b6\u179a\u178e\u17ca\u1780\u17cb\u178f\u17d2\u179a\u17b6\u1780\u17b6\u179a\u1784\u17b6\u179a",
      exportHeaders,
      buildExportRows()
    );
  }
  function handleExportWord() {
    exportWord(
      "tracker_report_" + from + "_to_" + to,
      "\u179a\u1794\u17b6\u1799\u1780\u17b6\u179a\u178e\u17ca\u1780\u17cb\u178f\u17d2\u179a\u17b6\u1780\u17b6\u179a\u1784\u17b6\u179a",
      exportHeaders,
      buildExportRows()
    );
  }

  return (
    <div>
      <div className="card p-4 mb-4">
        <h2 className="font-display text-lg mb-1">{"\u1794\u1789\u17d2\u1787\u17b8\u1780\u178f\u17cb\u178f\u17d2\u179a\u17b6\u1780\u17b6\u179a\u1784\u17b6\u179a"}</h2>
        <p className="text-xs text-inkFaint mb-3">{"\u178f\u17b6\u1798\u178a\u17b6\u1793\u1780\u17b6\u179a\u1784\u17b6\u179a \u1790\u17d2\u1784\u17c3\u1785\u17b6\u1794\u17cb\u1795\u17d2\u178f\u17be\u1798 \u1793\u17b7\u1784\u1790\u17d2\u1784\u17c3\u1780\u17c6\u178e\u178f\u17cb\u1785\u1794\u17cb"}</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-bg/40 rounded-xl p-3 text-center">
            <div className="text-xl mb-1">{"📋"}</div>
            <div className="text-xl font-bold">{total}</div>
            <div className="text-xs text-inkFaint">{"\u179f\u179a\u17bb\u1794"}</div>
          </div>
          <div className="bg-bg/40 rounded-xl p-3 text-center">
            <div className="text-xl mb-1">{"✅"}</div>
            <div className="text-xl font-bold text-emerald-400">{done}</div>
            <div className="text-xs text-inkFaint">{"\u1794\u17b6\u1793\u1794\u1789\u17d2\u1785\u1794\u17cb"}</div>
          </div>
          <div className="bg-orange-500/20 rounded-xl p-3 text-center">
            <div className="text-xl mb-1">{"⏳"}</div>
            <div className="text-xl font-bold text-orange-400">{pending}</div>
            <div className="text-xs text-inkFaint">{"\u1798\u17b7\u1793\u1791\u17b6\u1793\u17cb\u1785\u1794\u17cb"}</div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="card p-3 text-center">
          <div className="text-lg mb-0.5">{"📊"}</div>
          <div className="text-lg font-bold">{rangeTotal}</div>
          <div className="text-xs text-inkFaint">{"\u179f\u179a\u17bb\u1794\u1780\u17d2\u1793\u17bb\u1784\u179a\u1799\u17c8\u1796\u17c1\u179b"}</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-lg mb-0.5">{"✅"}</div>
          <div className="text-lg font-bold text-emerald-400">{rangeDone}</div>
          <div className="text-xs text-inkFaint">{"\u1794\u17b6\u1793\u1794\u1789\u17d2\u1785\u1794\u17cb"}</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-lg mb-0.5">{"⏳"}</div>
          <div className="text-lg font-bold text-orange-400">{rangePending}</div>
          <div className="text-xs text-inkFaint">{"\u1798\u17b7\u1793\u1791\u17b6\u1793\u17cb\u1785\u1794\u17cb"}</div>
        </div>
      </div>

      <RangeBarChart
        data={chartData}
        seriesA="pending"
        seriesAName={"\u1798\u17b7\u1793\u1791\u17b6\u1793\u17cb\u1785\u1794\u17cb"}
        seriesAColor="#f59e0b"
        seriesB="done"
        seriesBName={"\u1794\u17b6\u1793\u1794\u1789\u17d2\u1785\u1794\u17cb"}
        seriesBColor="#10b981"
        title={"\u1793\u17b7\u1793\u17d2\u1793\u17b6\u1780\u17b6\u179a\u178f\u17b6\u1798\u1790\u17d2\u1784\u17c3"}
      />

      <div className="card p-4 mt-4 mb-6">
        <h3 className="font-display text-base mb-3">{"\u178a\u17b6\u1789\u1799\u1780\u179a\u1794\u17b6\u1799\u1780\u17b6\u179a\u178e\u17ca"}</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportExcel} className="btn-secondary text-sm">
            {"\u{1F4CA} Excel"}
          </button>
          <button onClick={handleExportWord} className="btn-secondary text-sm">
            {"\u{1F4C4} Word"}
          </button>
          <button onClick={handleExportPDF} className="btn-secondary text-sm">
            {"\u{1F4D1} PDF"}
          </button>
        </div>
        <p className="text-xs text-inkFaint mt-2">
          {"* PDF \u1798\u17b7\u1793\u179a\u17c6\u179b\u17be\u1794\u179a\u17b6\u1793\u17c2\u1780\u1782\u17b6\u17c6\u1791\u17a2\u1780\u17d2\u179f\u179a\u1781\u17d2\u1798\u17c2\u179a\u179b\u17ca\u1798\u17cb\u178f\u17c2\u178f\u17b6\u179a\u17b6\u1784\u178a\u179f\u17bd\u1792\u17b6\u179f\u17b6\u179a \u179f\u17bc\u1798\u1794\u17d2\u179a\u17be Word \u17ac Excel \u1791\u17be\u1794\u1791\u17b6\u179f\u179a\u179f\u17be"}
        </p>
      </div>

      <input
        className="input-box mb-3"
        placeholder={"\u179f\u17d2\u179c\u17c2\u1784\u179a\u1780\u1780\u17b6\u179a\u1784\u17b6\u179a..."}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex gap-2 mb-4">
        {[
          { v: "all", l: "\u1791\u17b6\u17c6\u1784\u17a2\u179f\u17cb" },
          { v: "pending", l: "\u1798\u17b7\u1793\u1791\u17b6\u1793\u17cb\u1785\u1794\u17cb" },
          { v: "done", l: "\u1794\u17b6\u1793\u1794\u1789\u17d2\u1785\u1794\u17cb" },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`text-xs px-3 py-2 rounded-full border ${
              filter === f.v ? "bg-emerald-600 border-emerald-600 text-white" : "bg-bgCard border-line text-inkDim"
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {loading && <p className="text-inkFaint text-sm">{"\u1780\u17c6\u1796\u17bb\u1784\u1795\u17d2\u1791\u17bb\u1780..."}</p>}

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
                  j.status === "done" ? "bg-emerald-500/20 text-emerald-400" : "bg-sky-500/20 text-sky-400"
                }`}
              >
                {j.status === "done" ? "\u2713 \u1794\u17b6\u1793\u1794\u1789\u17d2\u1785\u1794\u17cb" : "\u1798\u17b7\u1793\u1791\u17b6\u1793\u17cb\u1785\u1794\u17cb"}
              </button>
            </div>
            <div className="text-xs text-inkFaint mt-1 font-mono">
              {j.start_date} {j.time} {"\u2192"} {j.end_date}
            </div>
            {j.note && <div className="text-xs text-inkDim mt-1">{j.note}</div>}
            <div className="flex gap-3 mt-2 text-xs">
              <button onClick={() => openEdit(j)} className="text-sky-400">
                {"\u1780\u17c2\u179f\u1798\u17d2\u179a\u17bd\u179b"}
              </button>
              <button onClick={() => remove(j.id)} className="text-orange-400">
                {"\u179b\u17bb\u1794"}
              </button>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="text-center text-inkFaint py-12 text-sm">{"\u1798\u17b7\u1793\u1791\u17b6\u1793\u17cb\u1798\u17b6\u1793\u1780\u17b6\u179a\u1784\u17b6\u179a\u1793\u17c5\u17a1\u17bd\u1799\u1791\u17c1"}</div>
        )}
      </div>

      <button
        onClick={openNew}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-600 text-white text-2xl shadow-lg flex items-center justify-center"
      >
        +
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="card w-full max-w-lg rounded-b-none p-5 max-h-[85vh] overflow-y-auto">
            <h3 className="font-display text-lg mb-3">
              {editingId ? "\u1780\u17c2\u179f\u1794\u17d2\u179a\u17c2\u1780\u17b6\u179a\u1784\u17b6\u179a" : "\u1794\u1793\u17d2\u1790\u17c2\u1798\u1780\u17b6\u179a\u1784\u17b6\u179a\u1790\u17d2\u1798\u17b8"}
            </h3>
            <input
              className="input-box mb-3"
              placeholder={"\u17e7. \u179a\u17be\u1794\u1785\u17c6\u179a\u1794\u17b6\u1799\u1780\u17b6\u179a\u178e\u17ca\u1781\u17c2"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-xs text-inkFaint">{"\u1790\u17d2\u1784\u17c3\u1785\u17b6\u1794\u17cb\u1795\u17d2\u178f\u17be\u1798"}</label>
                <input
                  type="date"
                  className="input-box mt-1"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-inkFaint">{"\u1798\u17c9\u17c4\u1784"}</label>
                <input type="time" className="input-box mt-1" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <label className="text-xs text-inkFaint">{"\u1790\u17d2\u1784\u17c3\u1780\u17c6\u178e\u178f\u17cb\u1785\u1794\u17cb"}</label>
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
                  status === "pending" ? "bg-sky-600 text-white" : "bg-bg border border-line text-inkDim"
                }`}
              >
                {"\u1798\u17b7\u1793\u1791\u17b6\u1793\u17cb\u1785\u1794\u17cb"}
              </button>
              <button
                onClick={() => setStatus("done")}
                className={`flex-1 py-2 rounded-xl text-sm ${
                  status === "done" ? "bg-emerald-600 text-white" : "bg-bg border border-line text-inkDim"
                }`}
              >
                {"\u1794\u17b6\u1793\u1794\u1789\u17d2\u1785\u1794\u17cb"}
              </button>
            </div>
            <textarea
              className="input-box mb-4"
              rows={3}
              placeholder={"\u17e7. \u1780\u17c6\u1796\u17bb\u1784\u179a\u1784\u17cb\u1785\u17b6\u17c6\u17a2\u17c6\u178e\u17b6\u1785\u17a1\u1794\u17be\u1795\u17d2\u1793\u17c2\u1780\u1782\u178e\u1793\u17c1\u1799\u17d2\u1799"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button className="btn-primary w-full mb-2" onClick={save}>
              {editingId ? "\u179a\u1780\u17d2\u179f\u17b6\u1791\u17bb\u1780" : "\u1794\u1793\u17d2\u1790\u17c2\u1798\u1780\u17b6\u179a\u1784\u17b6\u179a"}
            </button>
            <button className="btn-secondary w-full" onClick={() => setShowForm(false)}>
              {"\u1794\u17b7\u178a"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
