import { createClient } from "@/lib/supabaseServer";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const [{ data: tasks }, { data: jobs }] = await Promise.all([
    supabase.from("tasks").select("id, done, date"),
    supabase.from("tracker_jobs").select("id, status"),
  ]);

  const todayISO = new Date().toISOString().slice(0, 10);

  const taskTotal = tasks?.length || 0;
  const taskDone = tasks?.filter((t) => t.done).length || 0;
  const taskToday = tasks?.filter((t) => t.date === todayISO && !t.done).length || 0;
  const taskOverdue = tasks?.filter((t) => !t.done && t.date < todayISO).length || 0;

  const jobTotal = jobs?.length || 0;
  const jobDone = jobs?.filter((j) => j.status === "done").length || 0;
  const jobPending = jobTotal - jobDone;

  const StatCard = ({ label, value, color }) => (
    <div className="card p-4 text-center">
      <div className={`text-2xl font-bold ${color || "text-ink"}`}>{value}</div>
      <div className="text-xs text-inkFaint mt-1">{label}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg mb-3">ការងារត្រូវធ្វើ — សង្ខេប</h2>
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="សរុប" value={taskTotal} />
          <StatCard label="ថ្ងៃនេះ" value={taskToday} color="text-sky" />
          <StatCard label="ហួសកំណត់" value={taskOverdue} color="text-ember" />
          <StatCard label="បានធ្វើ" value={taskDone} color="text-moss" />
        </div>
        <Link href="/dashboard/todo" className="inline-block mt-3 text-sm text-ember">
          ទៅកាន់ការងារត្រូវធ្វើ →
        </Link>
      </div>

      <div>
        <h2 className="font-display text-lg mb-3">កត់ត្រាការងារ — សង្ខេប</h2>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="សរុប" value={jobTotal} />
          <StatCard label="បានបញ្ចប់" value={jobDone} color="text-moss" />
          <StatCard label="មិនទាន់ចប់" value={jobPending} color="text-ember" />
        </div>
        <Link href="/dashboard/tracker" className="inline-block mt-3 text-sm text-ember">
          ទៅកាន់កត់ត្រាការងារ →
        </Link>
      </div>
    </div>
  );
}
