"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";

const REMIND_DAY_OPTIONS = [
  { value: "none", label: "\u1798\u17b7\u1793\u179a\u17c6\u179b\u17b9\u1780" },
  { value: "1", label: "1 \u1790\u17d2\u1784\u17c3\u1798\u17bb\u1793" },
  { value: "2", label: "2 \u1790\u17d2\u1784\u17c3\u1798\u17bb\u1793" },
  { value: "3", label: "3 \u1790\u17d2\u1784\u17c3\u1798\u17bb\u1793" },
  { value: "4", label: "4 \u1790\u17d2\u1784\u17c3\u1798\u17bb\u1793" },
  { value: "5", label: "5 \u1790\u17d2\u1784\u17c3\u1798\u17bb\u1793" },
];

const REMIND_SAME_DAY_OPTIONS = [0, 5, 10, 15, 30, 60, 120, 180, 360, 720];

const LABEL_NEW_TASK = "\u1794\u1793\u17d2\u1790\u17c2\u1798\u1780\u17b7\u1785\u17d2\u1785\u1780\u17b6\u179a\u1790\u17d2\u1798\u17b8...";
const LABEL_WORK_TIME = "\u1798\u17c9\u17c4\u1784\u1780\u17b6\u179a\u1784\u17b6\u179a";
const LABEL_DATE = "\u1790\u17d2\u1784\u17c3";
const LABEL_TODAY = "\u1790\u17d2\u1784\u17c3\u1793\u17c1\u17c7";
const LABEL_TOMORROW = "\u179f\u17d2\u17a2\u17c2\u1780";
const LABEL_CHOOSE = "\u1787\u17d2\u179a\u17be\u179f\u2026";
const LABEL_REMIND_BEFORE = "\u179a\u17c6\u179b\u17b9\u1780\u1798\u17bb\u1793\u1790\u17d2\u1784\u17c3";
const LABEL_REMIND_SAME = "\u179a\u17c6\u179b\u17b9\u1780\u178a\u179b\u17cb\u1790\u17d2\u1784\u17c3";
const LABEL_AT_WORK_TIME = "\u1793\u17c5\u1798\u17c9\u17c4\u1784\u1780\u17b6\u179a\u1784\u17b6\u179a";
const LABEL_MIN_BEFORE = "\u1793\u17b6\u1791\u17b8\u1798\u17bb\u1793";
const LABEL_ADD_TASK = "+ \u1794\u1793\u17d2\u1790\u17c2\u1798\u1780\u17b7\u1785\u17d2\u1785\u1780\u17b6\u179a";
const LABEL_LIST_TITLE = "\u1794\u1789\u17d2\u1787\u17b8\u1780\u17b7\u1785\u17d2\u1785\u1780\u17b6\u179a";
const LABEL_REMAINING = "\u179f\u179b\u17cb";
const LABEL_LOADING = "\u1780\u17c6\u1796\u17bb\u1784\u1795\u17d2\u1791\u17bb\u1780...";
const LABEL_EMPTY = "\u1798\u17b7\u1793\u1791\u17b6\u1793\u17cb\u1798\u17b6\u1793\u1780\u17b7\u1785\u17d2\u1785\u1780\u17b6\u179a\u1791\u17c1\u17d4 \u1794\u1793\u17d2\u1790\u17c2\u1798\u1780\u17b7\u1785\u17d2\u1785\u1780\u17b6\u179a \u1780\u17c6\u178e\u178f\u17cb\u1798\u17c9\u17c4\u1784 \u17ac\u1790\u17d2\u1784\u17c3 \u1793\u17b7\u1784\u17a2\u17b6\u1785\u1787\u17d2\u179a\u17be\u179f\u1798\u17c9\u17c4\u1784\u179a\u17c6\u179b\u17b9\u1780\u17d4";
const LABEL_EDIT = "\u1780\u17c2\u179f\u1798\u17d2\u179a\u17bd\u179b";
const LABEL_EDIT_TITLE = "\u1780\u17c2\u179f\u1798\u17d2\u179a\u17bd\u179b\u1780\u17b7\u1785\u17d2\u1785\u1780\u17b6\u179a";
const LABEL_SAVE = "\u179a\u1780\u17d2\u179f\u17b6\u1791\u17bb\u1780";
const LABEL_CANCEL = "\u1794\u17b7\u1791";
const LABEL_CUSTOM_DATE = "\u1787\u17d2\u179a\u17be\u179f\u1780\u17b6\u179b\u1794\u179a\u17b7\u1785\u17d2\u1786\u17c1\u1791";

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
  const [remindDayBefore, setRemindDayBefore] = useState("1");
  const [remindSameDay, setRemindSameDay] = useState("30");
  const [toast, setToast] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState(todayISO());
  const [editTime, setEditTime] = useState("09:00");
  const [editRemindDayBefore, setEditRemindDayBefore] = useState("1");
  const [editRemindSameDay, setEditRemindSameDay] = useState("30");

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
      showToast("\u1798\u17b6\u1793\u1794\u1789\u17d2\u17a0\u17b6\u17d6 " + error.message);
      return;
    }
    setTitle("");
    showToast("\u1794\u17b6\u1793\u1794\u1793\u17d2\u1790\u17c2\u1798\u1780\u17b7\u1785\u17d2\u1785\u1780\u17b6\u179a");
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

  function openEdit(t) {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditDate(t.date);
    setEditTime(t.time);
    setEditRemindDayBefore(t.remind_day_before || "none");
    setEditRemindSameDay(String(t.remind_same_day || 0));
  }

  function closeEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editTitle.trim()) return;
    const { error } = await supabase
      .from("tasks")
      .update({
        title: editTitle.trim(),
        date: editDate,
        time: editTime,
        remind_day_before: editRemindDayBefore,
        remind_same_day: parseInt(editRemindSameDay, 10),
        reminded_day_before: false,
        reminded_same_day: false,
      })
      .eq("id", editingId);
    if (error) {
      showToast("\u1798\u17b6\u1793\u1794\u1789\u17d2\u17a0\u17b6\u17d6 " + error.message);
      return;
    }
    showToast("\u1794\u17b6\u1793\u179a\u1780\u17d2\u179f\u17b6\u1791\u17bb\u1780\u1780\u17b6\u179a\u1780\u17c2\u179f\u1798\u17d2\u179a\u17bd\u179b");
    setEditingId(null);
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
          placeholder={LABEL_NEW_TASK}
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-xs text-inkFaint">{"\u23f0 " + LABEL_WORK_TIME}</label>
            <input
              type="time"
              className="input-box mt-1"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-inkFaint">{"\u{1F4C5} " + LABEL_DATE}</label>
            <select className="input-box mt-1" value={day} onChange={(e) => setDay(e.target.value)}>
              <option value="today">{LABEL_TODAY}</option>
              <option value="tomorrow">{LABEL_TOMORROW}</option>
              <option value="custom">{LABEL_CHOOSE}</option>
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
          <label className="text-xs text-inkFaint">{"\u{1F514} " + LABEL_REMIND_BEFORE}</label>
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
          <label className="text-xs text-inkFaint">{"\u23f1 " + LABEL_REMIND_SAME}</label>
          <select
            className="input-box mt-1"
            value={remindSameDay}
            onChange={(e) => setRemindSameDay(e.target.value)}
          >
            {REMIND_SAME_DAY_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m === 0 ? LABEL_AT_WORK_TIME : m + " " + LABEL_MIN_BEFORE}
              </option>
            ))}
          </select>
        </div>

        <button className="btn-primary w-full" onClick={addTask}>
          {LABEL_ADD_TASK}
        </button>
      </div>

      <div className="flex justify-between text-xs text-inkFaint font-mono mb-3 px-1">
        <span>{LABEL_LIST_TITLE}</span>
        <span>{pending + " " + LABEL_REMAINING}</span>
      </div>

      {loading && <p className="text-inkFaint text-sm">{LABEL_LOADING}</p>}

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
                {t.done && <span className="text-bg text-xs">{"\u2713"}</span>}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${t.done ? "line-through text-inkFaint" : ""}`}>{t.title}</div>
                <div className="flex items-center gap-2 mt-1 text-xs font-mono text-inkFaint flex-wrap">
                  <span className={overdue ? "text-ember" : ""}>{"\u23f0 " + t.time}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5">{t.date}</span>
                </div>
                <div className="flex gap-3 mt-1.5 text-xs">
                  <button onClick={() => openEdit(t)} className="text-sky">
                    {LABEL_EDIT}
                  </button>
                </div>
              </div>
              <button onClick={() => removeTask(t.id)} className="text-inkFaint hover:text-ember text-lg leading-none">
                {"\u00d7"}
              </button>
            </div>
          );
        })}
        {!loading && tasks.length === 0 && (
          <div className="text-center text-inkFaint py-12 text-sm">
            {LABEL_EMPTY}
          </div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="card w-full max-w-lg rounded-b-none p-5 max-h-[85vh] overflow-y-auto">
            <h3 className="font-display text-lg mb-3">{LABEL_EDIT_TITLE}</h3>

            <input
              className="input-box mb-3"
              maxLength={200}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-xs text-inkFaint">{LABEL_WORK_TIME}</label>
                <input
                  type="time"
                  className="input-box mt-1"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-inkFaint">{LABEL_CUSTOM_DATE}</label>
                <input
                  type="date"
                  className="input-box mt-1"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="text-xs text-inkFaint">{LABEL_REMIND_BEFORE}</label>
              <select
                className="input-box mt-1"
                value={editRemindDayBefore}
                onChange={(e) => setEditRemindDayBefore(e.target.value)}
              >
                {REMIND_DAY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="text-xs text-inkFaint">{LABEL_REMIND_SAME}</label>
              <select
                className="input-box mt-1"
                value={editRemindSameDay}
                onChange={(e) => setEditRemindSameDay(e.target.value)}
              >
                {REMIND_SAME_DAY_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m === 0 ? LABEL_AT_WORK_TIME : m + " " + LABEL_MIN_BEFORE}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn-primary w-full mb-2" onClick={saveEdit}>
              {LABEL_SAVE}
            </button>
            <button className="btn-secondary w-full" onClick={closeEdit}>
              {LABEL_CANCEL}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
