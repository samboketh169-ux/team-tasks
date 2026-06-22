"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";

const REMIND_DAY_OPTIONS = [
  { value: "none", label: "មិនរំលឹក" },
  { value: "0", label: "ព្រឹកថ្ងៃមុន (07:00)" },
  { value: "-180", label: "3 ម៉ោងមុនកំណត់ (ថ្ងៃមុន)" },
  { value: "-360", label: "6 ម៉ោងមុនកំណត់ (ថ្ងៃមុន)" },
  { value: "-720", label: "12 ម៉ោងមុនកំណត់ (ថ្ងៃមុន)" },
  { value: "-1440", label: "24 ម៉ោងពិតប្រាកដមុនកំណត់" },
];

const REMIND_SAME_DAY_OPTIONS = [0, 5, 10, 15, 30, 60, 120, 180, 360, 720];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function TodoPage() {
  const supabase = createClient();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [day, setDay] = useState("today");
  const [customDate, setCustomDate] = useState(todayISO());
  const [remindDayBefore, setRemindDayBefore] = useState("-360");
  const [remindSameDay, setRemindSameDay] = useState("30");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true });
    setTasks(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  function resolvedDate() {
    if (day === "today") return todayISO();
    if (day === "tomorrow") return tomorrowISO();
    return customDate;
  }

  async function addTask() {
    if (!title.trim()) return;
    const { error } = await supabase.from("tasks").insert({
      title: title.trim(),
      date: resolvedDate(),
      time,
      remind_day_before: remindDayBefore,
      remind_same_day: parseInt(remindSameDay, 10),
      done: false,
      reminded_day_before: false,
      reminded_same_day: false,
    });
    if (error) {
      showToast("មានបញ្ហា៖ " + error.message);
      return;
    }
    setTitle("");
    showToast("បានបន្ថែមកិច្ចការ");
    load();
  }

  async function toggleDone(t) {
    await supabase.from("tasks").update({ done: !t.done }).eq("id", t.id);
    load();
  }

  async function removeTask(id) {
    await supabase.from("tasks").delete().eq("id", id);
    load();
  }

  const today = todayISO();
  const pending = tasks.filter((t) => !t.done).length;

  return (
    <div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-bgElevated border border-line text-ink px-5 py-3 rounded-full text-sm z-50">
          {toast}
        </div>
      )}

      <div className="card p-4 mb-5">
        <input
          className="input-box mb-3"
          placeholder="បន្ថែមកិច្ចការថ្មី…"
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-xs text-inkFaint">⏰ ម៉ោងការងារ</label>
            <input
              type="time"
              className="input-box mt-1"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-inkFaint">📅 ថ្ងៃ</label>
            <select className="input-box mt-1" value={day} onChange={(e) => setDay(e.target.value)}>
              <option value="today">ថ្ងៃនេះ</option>
              <option value="tomorrow">ស្អែក</option>
              <option value="custom">ជ្រើស…</option>
            </select>
          </div>
        </div>

        {day === "custom" && (
          <input
            type="date"
            className="input-box mb-3"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
          />
        )}

        <div className="mb-2">
          <label className="text-xs text-inkFaint">🔔 រំលឹកមុនថ្ងៃ</label>
          <select
            className="input-box mt-1"
            value={remindDayBefore}
            onChange={(e) => setRemindDayBefore(e.target.value)}
          >
            {REMIND_DAY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="text-xs text-inkFaint">⏱ រំលឹកដល់ថ្ងៃ</label>
          <select
            className="input-box mt-1"
            value={remindSameDay}
            onChange={(e) => setRemindSameDay(e.target.value)}
          >
            {REMIND_SAME_DAY_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m === 0 ? "នៅម៉ោងការងារ" : `${m} នាទីមុន`}
              </option>
            ))}
          </select>
        </div>

        <button className="btn-primary w-full" onClick={addTask}>
          + បន្ថែមកិច្ចការ
        </button>
      </div>

      <div className="flex justify-between text-xs text-inkFaint font-mono mb-3 px-1">
        <span>បញ្ជីកិច្ចការ</span>
        <span>{pending} សល់</span>
      </div>

      {loading && <p className="text-inkFaint text-sm">កំពុងផ្ទុក...</p>}

      <div className="flex flex-col gap-2">
        {tasks.map((t) => {
          const overdue = !t.done && t.date < today;
          return (
            <div
              key={t.id}
              className={`card p-3 flex items-start gap-3 ${overdue ? "border-ember/50" : ""} ${
                t.done ? "opacity-45" : ""
              }`}
            >
              <button
                onClick={() => toggleDone(t)}
                className={`w-6 h-6 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center ${
                  t.done ? "bg-moss border-moss" : "border-inkFaint"
                }`}
              >
                {t.done && <span className="text-bg text-xs">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${t.done ? "line-through text-inkFaint" : ""}`}>{t.title}</div>
                <div className="flex items-center gap-2 mt-1 text-xs font-mono text-inkFaint flex-wrap">
                  <span className={overdue ? "text-ember" : ""}>⏰ {t.time}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5">{t.date}</span>
                </div>
              </div>
              <button onClick={() => removeTask(t.id)} className="text-inkFaint hover:text-ember text-lg leading-none">
                ×
              </button>
            </div>
          );
        })}
        {!loading && tasks.length === 0 && (
          <div className="text-center text-inkFaint py-12 text-sm">
            មិនទាន់មានកិច្ចការទេ។ បន្ថែមកិច្ចការ កំណត់ម៉ោង និងជ្រើសម៉ោងរំលឹក។
          </div>
        )}
      </div>
    </div>
  );
}
