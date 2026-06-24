import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram";

export async function GET(request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret") || request.headers.get("x-cron-secret");

  // ១. ពិនិត្យសុវត្ថិភាព Cron Secret
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // ២. ចាប់យកកាលបរិច្ឆេទ និងម៉ោងបច្ចុប្បន្ននៅកម្ពុជា (GMT+7)
    const now = new Date();
    const cambodiaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Phnom_Penh" }));
    
    // បំប្លែងទៅជាទម្រង់ YYYY-MM-DD និង HH:mm (ឧទាហរណ៍៖ "2026-06-24" និង "09:00")
    const currentDateStr = cambodiaTime.toISOString().split('T')[0];
    const currentTimeStr = cambodiaTime.toTimeString().split(' ')[0].substring(0, 5);

    console.log(Running cron check for Cambodia Time: ${currentDateStr} ${currentTimeStr});

    // ៣. ទាញយក Task ណាដែលត្រូវនឹង៖ ថ្ងៃនេះ + ម៉ោងនេះ + មិនទាន់បានរំលឹក (reminded_same_day = false)
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("date", currentDateStr)
      .eq("time", currentTimeStr)
      .eq("reminded_same_day", false);

    if (error) throw error;

    let sentCount = 0;

    // ៤. ប្រសិនបើឃើញមាន Task ដល់ម៉ោង ត្រូវផ្ញើសារទៅ Telegram
    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        const message = 🔔 **ការរំលឹកកិច្ចការងារ!**\n\n📌 **កិច្ចការ៖** ${task.title}\n⏰ **ម៉ោង៖** ${task.time}\n📅 **កាលបរិច្ឆេទ៖** ${task.date};
        
        // ហៅទៅមុខងារផ្ញើសារដែលមានស្រាប់ក្នុងប្រព័ន្ធរបស់អ្នក
        await sendTelegramMessage(message);

        // ៥. បច្ចុប្បន្នភាព狀況ទៅជា true ដើម្បីកុំឱ្យផ្ញើជាន់គ្នានៅនាទីបន្ទាប់
        await supabase
          .from("tasks")
          .update({ reminded_same_day: true })
          .eq("id", task.id);

        sentCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: ពិនិត្យរួចរាល់។ បានផ្ញើសាររំលឹកចំនួន ${sentCount} កិច្ចការ។,
      time_checked: ${currentDateStr} ${currentTimeStr}
    }, { status: 200 });

  } catch (error) {
    console.error("Cron Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
