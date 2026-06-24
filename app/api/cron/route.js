import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram";

export async function GET(request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret") || request.headers.get("x-cron-secret");

  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // ១. ចាប់យកម៉ោងបច្ចុប្បន្ននៅកម្ពុជា (GMT+7)
    const now = new Date();
    const cambodiaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Phnom_Penh" }));
    
    const currentDateStr = cambodiaTime.toISOString().split('T')[0]; // លទ្ធផល៖ "2026-06-24"
    
    // ចាប់យកម៉ោងជា ២ ទម្រង់ដើម្បីកុំឱ្យខុស
    const time24 = cambodiaTime.toTimeString().split(' ')[0].substring(0, 5); // ឧទាហរណ៍៖ "09:00" ឬ "21:30"
    
    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
    const time12 = cambodiaTime.toLocaleTimeString('en-US', options); // ឧទាហរណ៍៖ "09:00 AM" ឬ "09:30 PM"

    // ២. ទាញយក Task ថ្ងៃនេះទាំងអស់ដែលមិនទាន់បានរំលឹក
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("date", currentDateStr)
      .eq("reminded_same_day", false);

    if (error) throw error;

    let sentCount = 0;

    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        // លុបចន្លោះទំនេរ និងបំប្លែងជាអក្សរតូចដើម្បីងាយស្រួលផ្ទៀងផ្ទាត់
        const dbTime = task.time.trim().toLowerCase();
        const check24 = time24.toLowerCase();
        const check12 = time12.toLowerCase();

        // ៣. បើម៉ោងក្នុង Database ត្រូវនឹងម៉ោងបច្ចុប្បន្ន (ទោះជាទម្រង់ ១២ម៉ោង ឬ ២៤ម៉ោង)
        if (dbTime === check24 || dbTime === check12) {
          const message = 🔔 **ការរំលឹកកិច្ចការងារ!**\n\n📌 **កិច្ចការ៖** ${task.title}\n⏰ **ម៉ោង៖** ${task.time}\n📅 **កាលបរិច្ឆេទ៖** ${task.date};
          
          await sendTelegramMessage(message);

          // ៤. កត់ត្រាថាបានផ្ញើរួច
          await supabase
            .from("tasks")
            .update({ reminded_same_day: true })
            .eq("id", task.id);

          sentCount++;
        }
      }
    }

    return NextResponse.json({ 
      ok: true, 
      checked: tasks?.length || 0, 
      sent: sentCount,
      cambodia_time: time12
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
