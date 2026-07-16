"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import DateRangeFilter from "@/components/DateRangeFilter";
import DailyBarChart from "@/components/DailyBarChart";

const LABEL_TASK_SECTION = "\u1780\u17b6\u179a\u1784\u17b6\u179a\u178f\u17d2\u179a\u17bc\u179c\u1792\u17d2\u179c\u17be \u2014 \u179f\u1784\u17d2\u1781\u17c1\u1794";
const LABEL_JOB_SECTION = "\u1780\u178f\u17cb\u178f\u17d2\u179a\u17b6\u1780\u17b6\u179a\u1784\u17b6\u179a \u2014 \u179f\u1784\u17d2\u1781\u17c1\u1794";
const LABEL_TOTAL = "\u179f\u179a\u17bb\u1794";
const LABEL_TODAY = "\u1790\u17d2\u1784\u17c3\u1793\u17c1\u17c7";
const LABEL_OVERDUE = "\u17a0\u17bd\u179f\u1780\u17c6\u178e\u178f\u17cb";
const LABEL_DONE = "\u1794\u17b6\u1793\u1792\u17d2\u179c\u17be";
const LABEL_JOB_DONE = "\u1794\u17b6\u1793\u1794\u1789\u17d2\u1785\u1794\u17cb";
const LABEL_JOB_PENDING = "\u1798\u17b7\u1793\u1791\u17b6\u1793\u17cb\u1785\u1794\u17cb";
const LABEL_GO_TASKS = "\u1791\u17c5\u1780\u17b6\u1793\u17cb\u1780\u17b6\u179a\u1784\u17b6\u179a\u178f\u17d2\u179a\u17bc\u179c\u1792\u17d2\u179c\u17be";
const LABEL_GO_JOBS = "\u1791\u17c5\u1780\u17b6\u1793\u17cb\u1780\u178f\u17cb\u178f\u17d2\u179a\u17b6\u1780\u17b6\u179a\u1784\u17b6\u179a";

const LABEL_DOWNLOAD_REPORT = "\u1791\u17b6\u1789\u1799\u1780\u179a\u1794\u17b6\u1799\u1780\u17b6\u179a\u178e\u17cd";
const LABEL_EXCEL = "\u1791\u17b6\u1789\u1799\u1780\u1787\u17b6 Excel";

const REPORT_TITLE_JOBS = "\u179a\u1794\u17b6\u1799\u1780\u17b6\u179a\u178e\u17cd\u1780\u178f\u17cb\u178f\u17d2\u179a\u17b6\u1780\u17b6\u179a\u1784\u17b6\u179a";
const COL_NAME = "\u1788\u17d2\u1798\u17c4\u17c7\u1780\u17b6\u179a\u1784\u17b6\u179a";
const COL_START = "\u1790\u17d2\u1784\u17c3\u1785\u17b6\u1794\u17cb\u1795\u17d2\u178f\u17be\u1798";
const COL_END = "\u1790\u17d2\u1784\u17c3\u1780\u17c6\u178e\u178f\u17cb\u1785\u1794\u17cb";
const COL_STATUS = "\u179f\u17d2\u1790\u17b6\u1793\u1797\u17b6\u1796";
const COL_NOTE = "\u1780\u17c6\u178e\u178f\u17cb\u1785\u17c6\u178e\u17b6\u17c6";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysAheadISO(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function buildDateList(from, to) {
  const list = [];
  let cur = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  let guard = 0;
  while (cur <= end && guard < 400) {
    list.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
  return list;
}
function shortLabel(dateStr) {
  const parts = dateStr.split("-");
  return parts[2] + "/" + parts[1];
}

export default function DashboardPage() {
  const supabase = createClient();

  const [taskFrom, setTaskFrom] = useState(daysAgoISO(29));
  const [taskTo, setTaskTo] = useState(daysAheadISO(30));
  const [jobFrom, setJobFrom] = useState(daysAgoISO(29));
  const [jobTo, setJobTo] = useState(daysAheadISO(30));

  const [tasks, setTasks] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    const { data } = await supabase
      .from("tasks")
      .select("id, done, date")
      .gte("date", taskFrom)
      .lte("date", taskTo);
    setTasks(data || []);
    setLoadingTasks(false);
  }, [supabase, taskFrom, taskTo]);

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    const { data } = await supabase
      .from("tracker_jobs")
      .select("*")
      .gte("start_date", jobFrom)
      .lte("start_date", jobTo)
      .order("start_date", { ascending: true });
    setJobs(data || []);
    setLoadingJobs(false);
  }, [supabase, jobFrom, jobTo]);

  useEffect(() => { loadTasks(); }, [loadTasks]);
  useEffect(() => { loadJobs(); }, [loadJobs]);

  const today = todayISO();
  const taskTotal = tasks.length;
  const taskToday = tasks.filter((t) => t.date === today && !t.done).length;
  const taskOverdue = tasks.filter((t) => !t.done && t.date < today).length;
  const taskDone = tasks.filter((t) => t.done).length;

  const jobTotal = jobs.length;
  const jobDone = jobs.filter((j) => j.status === "done").length;
  const jobPending = jobTotal - jobDone;

  const taskDateList = buildDateList(taskFrom, taskTo);
  const taskChartData = taskDateList.map((d) => {
    const dayTasks = tasks.filter((t) => t.date === d);
    return {
      label: shortLabel(d),
      done: dayTasks.filter((t) => t.done).length,
      pending: dayTasks.filter((t) => !t.done).length,
    };
  });

  const jobDateList = buildDateList(jobFrom, jobTo);
  const jobChartData = jobDateList.map((d) => {
    const dayJobs = jobs.filter((j) => j.start_date === d);
    return {
      label: shortLabel(d),
      done: dayJobs.filter((j) => j.status === "done").length,
      pending: dayJobs.filter((j) => j.status !== "done").length,
    };
  });

  const StatCard = ({ label, value, color, icon }) => (
    <div className="card p-4 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className={`text-2xl font-bold ${color || "text-ink"}`}>{value}</div>
      <div className="text-xs text-inkFaint mt-1">{label}</div>
    </div>
  );

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const rows = jobs.map((j) => ({
      [COL_NAME]: j.name,
      [COL_START]: j.start_date,
      [COL_END]: j.end_date,
      [COL_STATUS]: j.status === "done" ? LABEL_JOB_DONE : LABEL_JOB_PENDING,
      [COL_NOTE]: j.note || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "tracker-report-" + jobFrom + "_to_" + jobTo + ".xlsx");
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-lg mb-3">{LABEL_TASK_SECTION}</h2>
        <DateRangeFilter
          fromDate={taskFrom}
          toDate={taskTo}
          onChange={(f, t) => { setTaskFrom(f); setTaskTo(t); }}
        />
        <div className="grid grid-cols-4 gap-2 mb-4">
          <StatCard label={LABEL_TOTAL} value={taskTotal} icon={"\u{1F4CB}"} />
          <StatCard label={LABEL_TODAY} value={taskToday} color="text-sky" icon={"\u{1F4C5}"} />
          <StatCard label={LABEL_OVERDUE} value={taskOverdue} color="text-ember" icon={"\u26A0\uFE0F"} />
          <StatCard label={LABEL_DONE} value={taskDone} color="text-moss" icon={"\u2705"} />
        </div>
        {loadingTasks ? (
          <p className="text-inkFaint text-sm">...</p>
        ) : (
          <DailyBarChart data={taskChartData} />
        )}
        <Link href="/dashboard/todo" className="inline-block mt-3 text-sm text-ember">
          {LABEL_GO_TASKS} {"\u2192"}
        </Link>
      </div>

      <div>
        <h2 className="font-display text-lg mb-3">{LABEL_JOB_SECTION}</h2>
        <DateRangeFilter
          fromDate={jobFrom}
          toDate={jobTo}
          onChange={(f, t) => { setJobFrom(f); setJobTo(t); }}
        />
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatCard label={LABEL_TOTAL} value={jobTotal} icon={"\u{1F4CB}"} />
          <StatCard label={LABEL_JOB_DONE} value={jobDone} color="text-moss" icon={"\u2705"} />
          <StatCard label={LABEL_JOB_PENDING} value={jobPending} color="text-ember" icon={"\u23F3"} />
        </div>
        {loadingJobs ? (
          <p className="text-inkFaint text-sm">...</p>
        ) : (
          <DailyBarChart data={jobChartData} />
        )}

        <div className="card p-4 mt-4">
          <h3 className="font-display text-base mb-3">{LABEL_DOWNLOAD_REPORT}</h3>
          <div className="flex">
            <button onClick={exportExcel} className="btn-secondary text-sm w-full">
              {"\u{1F4CA} " + LABEL_EXCEL}
            </button>
          </div>
        </div>

        <Link href="/dashboard/tracker" className="inline-block mt-3 text-sm text-ember">
          {LABEL_GO_JOBS} {"\u2192"}
        </Link>
      </div>
    </div>
  );
}
