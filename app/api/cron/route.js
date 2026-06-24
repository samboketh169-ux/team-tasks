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
    
    // បំលែងជាថ្ងៃខែ ទម្រង់ "YYYY-MM-DD"
    const currentDateStr = cambodiaTime.toISOString().split('T')[0];
    
    // ចាប់យកម៉ោង និងនាទីឱ្យចំទម្រង់ "HH:mm" (ឧទាហរណ៍៖ "10:19" ឬ "09:00")
    const hours = String(cambodiaTime.getHours()).padStart(2, '0');
    const minutes = String(cambodiaTime.getMinutes()).padStart(2, '0');
    const currentTimeStr = ${hours}:${minutes};

    console.log(Checking tasks for Cambodia Time: ${currentDateStr} ${currentTimeStr});

    // ២. ទាញយកកិច្ចការទាំងអស់របស់ថ្ងៃនេះ ដែលមិនទាន់បានរំលឹក
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("date", currentDateStr)
      .eq("reminded_same_day", false);

    if (error) throw error;

    let sentCount = 0;

    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        // លុបចន្លោះទំនេរ បើមាន (ឧទាហរណ៍៖ "10:19 " -> "10:19")
        const dbTime = task.time.trim();

        // ៣. ផ្ទៀងផ្ទាត់បើម៉ោងក្នុង Database ត្រូវគ្នានឹងម៉ោងបច្ចុប្បន្នពិតប្រាកដ
        if (dbTime === currentTimeStr) {
          const message = 🔔 **ការរំលឹកកិច្ចការងារ!**\n\n📌 **កិច្ចការ៖** ${task.title}\n⏰ **ម៉ោង៖** ${task.time}\n📅 **កាលបរិច្ឆេទ៖** ${task.date};
          
          // ផ្ញើសារទៅ Telegram
          await sendTelegramMessage(message);

          // ៤. កត់ត្រាក្នុង Database ថាបានផ្ញើរួចរាល់
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
      cambodia_time: ${currentDateStr} ${currentTimeStr}
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
