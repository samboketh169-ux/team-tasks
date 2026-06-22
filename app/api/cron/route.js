import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram";

// Call this endpoint every few minutes from Vercel Cron (vercel.json) OR
// an external scheduler like https://cron-job.org (recommended on the
// Vercel Hobby plan, since Hobby cron only runs once per day).
// Protect with: ?secret=CRON_SECRET or header  x-cron-secret: CRON_SECRET

const TOLERANCE_MIN = 3; // minutes of tolerance around the run interval

function parseTimeToMinutes(t) {
  const [h, m] = (t || "00:00").split(":").map(Number);
  return h * 60 + m;
}

export async function GET(request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret") || request.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: settings } = await admin.from("telegram_settings").select("*").eq("id", 1).maybeSingle();

  if (!settings?.bot_token || !settings?.chat_id) {
    return NextResponse.json({ skipped: "no telegram settings configured" });
  }

  const { data: tasks } = await admin.from("tasks").select("*").eq("done", false);

  const now = new Date();
  let sent = 0;

  for (const t of tasks || []) {
    const taskDateTimeMin = parseTimeToMinutes(t.time);
    const taskDate = new Date(t.date + "T00:00:00");

    // ---- Same-day reminder ----
    if (!t.reminded_same_day) {
      const triggerDate = new Date(taskDate);
      const triggerMin = taskDateTimeMin - (t.remind_same_day || 0);
      triggerDate.setMinutes(triggerDate.getMinutes() + triggerMin);

      const diffMin = Math.abs((now - triggerDate) / 60000);
      if (diffMin <= TOLERANCE_MIN && now >= new Date(triggerDate.getTime() - TOLERANCE_MIN * 60000)) {
        try {
          await sendTelegramMessage(
            settings.bot_token,
            settings.chat_id,
            `🔔 <b>ការរំលឹកកិច្ចការ</b>\n${t.title}\n⏰ ម៉ោង ${t.time} | 📅 ${t.date}`
          );
          await admin.from("tasks").update({ reminded_same_day: true }).eq("id", t.id);
          sent++;
        } catch (e) {
          console.error("telegram send failed", e.message);
        }
      }
    }

    // ---- Day-before reminder ----
    if (t.remind_day_before && t.remind_day_before !== "none" && !t.reminded_day_before) {
      let triggerDate;
      if (t.remind_day_before === "0") {
        triggerDate = new Date(taskDate);
        triggerDate.setDate(triggerDate.getDate() - 1);
        triggerDate.setHours(7, 0, 0, 0);
      } else {
        const offsetMin = parseInt(t.remind_day_before, 10); // negative
        triggerDate = new Date(taskDate);
        triggerDate.setMinutes(triggerDate.getMinutes() + taskDateTimeMin + offsetMin);
      }

      const diffMin = Math.abs((now - triggerDate) / 60000);
      if (diffMin <= TOLERANCE_MIN && now >= new Date(triggerDate.getTime() - TOLERANCE_MIN * 60000)) {
        try {
          await sendTelegramMessage(
            settings.bot_token,
            settings.chat_id,
            `📌 <b>រំលឹកមុនថ្ងៃ</b>\n${t.title}\nមានកំណត់ម៉ោង ${t.time} | 📅 ${t.date}`
          );
          await admin.from("tasks").update({ reminded_day_before: true }).eq("id", t.id);
          sent++;
        } catch (e) {
          console.error("telegram send failed", e.message);
        }
      }
    }
  }

  return NextResponse.json({ ok: true, checked: tasks?.length || 0, sent });
}
