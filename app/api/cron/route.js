import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// មុខងារបំប្លែងម៉ោង (12:00, 12:00:00, 01:00 PM) ទៅជានាទី
function timeToMinutes(timeStr) {
  if (!timeStr) return -1;
  let str = timeStr.trim().toUpperCase();
  let isPM = str.includes("PM");
  let isAM = str.includes("AM");
  
  str = str.replace(/(AM|PM)/g, "").trim();
  const parts = str.split(":");
  if (parts.length < 2) return -1;
  
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  
  return (hours * 60) + minutes;
}

export async function GET(request) {
  // ផ្ទៀងផ្ទាត់ Token សុវត្ថិភាពរបស់ Cron
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret") || request.headers.get("x-cron-secret");

  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // បង្កើត Supabase Client ផ្ទាល់នៅក្នុងនេះតែម្តង ដើម្បីការពារកុំឱ្យទាស់ទែងការ Import
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // ប្រើ Service Role ដើម្បីមានសិទ្ធិ Update ទិន្នន័យ
    );

    // គណនាម៉ោងកម្ពុជា (UTC + 7)
    const utcNow = new Date();
    const cambodiaTime = new Date(utcNow.getTime() + (7 * 60 * 60 * 1000));
    
    const currentDateStr = cambodiaTime.toISOString().split('T')[0];
    const hoursNum = cambodiaTime.getUTCHours();
    const minutesNum = cambodiaTime.getUTCMinutes();
    
    const currentMinutes = (hoursNum * 60) + minutesNum;
    const displayHours = String(hoursNum).padStart(2, '0');
    const displayMinutes = String(minutesNum).padStart(2, '0');
    const cambodiaTimeLog = ${displayHours}:${displayMinutes};

    // ទាញយក Task ថ្ងៃនេះដែលមិនទាន់បានរំលឹក
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

        // ប្រសិនបើម៉ោងត្រូវគ្នា (លំអៀងមិនលើសពី ២ នាទី)
        if (dbMinutes !== -1 && Math.abs(currentMinutes - dbMinutes) <= 2) {
          
          const message = 🔔 **ការរំលឹកកិច្ចការងារ!**\n\n📌 **កិច្ចការ៖** ${task.title}\n⏰ **ម៉ោង៖** ${task.time}\n📅 **កាលបរិច្ឆេទ៖** ${task.date};
          
          // ហៅទៅកាន់ Telegram API ដោយផ្ទាល់
          const telegramUrl = https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage;
          await fetch(telegramUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: process.env.TELEGRAM_CHAT_ID,
              text: message,
              parse_mode: "Markdown"
            })
          });

          // ធ្វើបច្ចុប្បន្នភាពទៅ Supabase ថាបានផ្ញើរួច
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
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
