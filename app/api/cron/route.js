import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram";

function timeToMinutes(timeStr) {
  if (!timeStr) return -1;
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

    // ១. ចាប់យកម៉ោង UTC របស់ Server រួចបូកថែម ៧ ម៉ោងដើម្បីឱ្យទៅជាម៉ោងកម្ពុជា
    const utcNow = new Date();
    const cambodiaTime = new Date(utcNow.getTime() + (7 * 60 * 60 * 1000));
    
    // បង្កើត String ថ្ងៃខែទម្រង់ YYYY-MM-DD
    const currentDateStr = cambodiaTime.toISOString().split('T')[0];
    
    // ចាប់យកម៉ោង និងនាទីជាលេខដាច់ដោយឡែក
    const hoursNum = cambodiaTime.getUTCHours();
    const minutesNum = cambodiaTime.getUTCMinutes();
    
    // គណនានាទីសរុប និងបង្កើត String សម្រាប់បង្ហាញក្នុង Log
    const currentMinutes = (hoursNum * 60) + minutesNum;
    const displayHours = String(hoursNum).padStart(2, '0');
    const displayMinutes = String(minutesNum).padStart(2, '0');
    const cambodiaTimeLog = ${displayHours}:${displayMinutes};

    console.log([FIXED] Checking for Cambodia Date: ${currentDateStr}, Time: ${cambodiaTimeLog});

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

        // ៣. ផ្ទៀងផ្ទាត់៖ បើនាទីក្នុង DB ត្រូវគ្នានឹងម៉ោងបច្ចុប្បន្ន (លំអៀងមិនលើសពី ១ នាទី)
        if (dbMinutes !== -1 && Math.abs(currentMinutes - dbMinutes) <= 1) {
          
          const message = 🔔 **ការរំលឹកកិច្ចការងារ!**\n\n📌 **កិច្ចការ៖** ${task.title}\n⏰ **ម៉ោង៖** ${task.time}\n📅 **កាលបរិច្ឆេទ៖** ${task.date};
          
          // ផ្ញើសារទៅកាន់ Telegram
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
      cambodia_time: ${currentDateStr} ${cambodiaTimeLog}
    }, { status: 200 });

  } catch (error) {
    console.error("Cron Error:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
