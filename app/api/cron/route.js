import { NextResponse } from "next/server";
import createAdminClient from "@/lib/supabaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram";

// មុខងារបំប្លែងម៉ោងគ្រប់ទម្រង់ (12:00, 12:00:00, 01:00 PM) ទៅជានាទីសរុប
function timeToMinutes(timeStr) {
  if (!timeStr) return -1;
  
  let str = timeStr.trim().toUpperCase();
  let isPM = str.includes("PM");
  let isAM = str.includes("AM");
  
  // លុបអក្សរ AM/PM ចេញបើមាន
  str = str.replace(/(AM|PM)/g, "").trim();
  
  const parts = str.split(":");
  if (parts.length < 2) return -1;
  
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  // សម្រួលទម្រង់ ១២ ម៉ោង (AM/PM)
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  
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

    // ១. គណនាម៉ោងកម្ពុជា (UTC + 7 ម៉ោង)
    const utcNow = new Date();
    const cambodiaTime = new Date(utcNow.getTime() + (7 * 60 * 60 * 1000));
    
    const currentDateStr = cambodiaTime.toISOString().split('T')[0];
    const hoursNum = cambodiaTime.getUTCHours();
    const minutesNum = cambodiaTime.getUTCMinutes();
    
    const currentMinutes = (hoursNum * 60) + minutesNum;
    const displayHours = String(hoursNum).padStart(2, '0');
    const displayMinutes = String(minutesNum).padStart(2, '0');
    const cambodiaTimeLog = ${displayHours}:${displayMinutes};

    console.log([CRON] Checking Database for Date: ${currentDateStr}, Time: ${cambodiaTimeLog});

    // ២. ទាញយកកិច្ចការថ្ងៃនេះ ដែលមិនទាន់បានរំលឹក
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("date", currentDateStr)
      .eq("reminded_same_day", false);

    if (error) throw error;

    let sentCount = 0;
    let taskLogs = [];

    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        const dbMinutes = timeToMinutes(task.time);
        
        taskLogs.push({
          title: task.title,
          db_time: task.time,
          db_minutes: dbMinutes,
          current_minutes: currentMinutes,
          diff: dbMinutes !== -1 ? Math.abs(currentMinutes - dbMinutes) : "N/A"
        });

        // ៣. ផ្ទៀងផ្ទាត់៖ បើនាទីក្នុង DB ត្រូវគ្នានឹងម៉ោងបច្ចុប្បន្ន (លំអៀងមិនលើសពី ២ នាទីដើម្បីកុំឱ្យធ្លាយ)
        if (dbMinutes !== -1 && Math.abs(currentMinutes - dbMinutes) <= 2) {
          
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
      cambodia_time: ${currentDateStr} ${cambodiaTimeLog},
      debug_tasks: taskLogs
    }, { status: 200 });

  } catch (error) {
    console.error("Cron Error:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
