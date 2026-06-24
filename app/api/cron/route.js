import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram";

// មុខងារសម្រាប់បំប្លែងម៉ោងជាអក្សរ (ដូចជា "09:00", "9:05", "10:19") ទៅជានាទីសរុប
function timeToMinutes(timeStr) {
  if (!timeStr) return -1;
  // ដកឃ្លា និងសម្អាតអក្សរ បើមាន
  const cleanTime = timeStr.trim().replace(/[^0-9:]/g, "");
  const parts = cleanTime.split(":");
  if (parts.length < 2) return -1;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return (hours * 60) + minutes;
}

export async function GET(request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret") || request.headers.get("x-cron-secret");

  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // ១. ចាប់យកកាលបរិច្ឆេទ និងម៉ោងបច្ចុប្បន្ននៅកម្ពុជា (GMT+7)
    const now = new Date();
    const cambodiaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Phnom_Penh" }));
    
    // ទម្រង់ថ្ងៃខែ៖ YYYY-MM-DD
    const currentDateStr = cambodiaTime.toISOString().split('T')[0];
    
    // គណនានាទីសរុបនៃម៉ោងបច្ចុប្បន្ននៅកម្ពុជា
    const currentMinutes = (cambodiaTime.getHours() * 60) + cambodiaTime.getMinutes();

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
        const dbMinutes = timeToMinutes(task.time);

        // ៣. ផ្ទៀងផ្ទាត់៖ ប្រសិនបើម៉ោងបច្ចុប្បន្ន ត្រូវគ្នានឹងម៉ោងក្នុង Database (ខុសគ្នាមិនលើសពី ១ នាទី)
        if (dbMinutes !== -1 && Math.abs(currentMinutes - dbMinutes) <= 1) {
          
          const message = 🔔 **ការរំលឹកកិច្ចការងារ!**\n\n📌 **កិច្ចការ៖** ${task.title}\n⏰ **ម៉ោង៖** ${task.time}\n📅 **កាលបរិច្ឆេទ៖** ${task.date};
          
          // ផ្ញើសារទៅកាន់ Telegram លក្ខណៈស្វ័យប្រវត្តតាមម៉ោងកំណត់
          await sendTelegramMessage(message);

          // ៤. កត់ត្រាក្នុង Database ថាបានផ្ញើរួចរាល់ ដើម្បីកុំឱ្យផ្ញើជាន់គ្នាទៀត
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
      cambodia_time: cambodiaTime.toLocaleTimeString('en-US', { hour12: false })
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
