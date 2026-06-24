import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram";

const TOLERANCE_MIN = 3;

function parseTimeToMinutes(t) {
  let timeStr = t;
  if (!timeStr) {
    timeStr = "00:00";
  }
  const parts = timeStr.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  return h * 60 + m;
}

export async function GET(request) {
  const url = new URL(request.url);
  let secret = url.searchParams.get("secret");
  if (!secret) {
    secret = request.headers.get("x-cron-secret");
  }
  if (process.env.CRON_SECRET) {
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const settingsRes = await admin.from("telegram_settings").select("*").eq("id", 1).maybeSingle();
  const settings = settingsRes.data;

  let hasSettings = false;
  if (settings) {
    if (settings.bot_token) {
      if (settings.chat_id) {
        hasSettings = true;
      }
    }
  }

  if (!hasSettings) {
    return NextResponse.json({ skipped: "no telegram settings configured" });
  }

  const tasksRes = await admin.from("tasks").select("*").eq("done", false);
  let tasks = tasksRes.data;
  if (!tasks) {
    tasks = [];
  }

  const now = new Date();
  let sent = 0;

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const taskDateTimeMin = parseTimeToMinutes(t.time);
    const taskDate = new Date(t.date + "T00:00:00");

    if (!t.reminded_same_day) {
      const triggerDate = new Date(taskDate);
      let remindSameDay = t.remind_same_day;
      if (!remindSameDay) {
        remindSameDay = 0;
      }
      const triggerMin = taskDateTimeMin - remindSameDay;
      triggerDate.setMinutes(triggerDate.getMinutes() + triggerMin);

      const diffMin = Math.abs((now - triggerDate) / 60000);
      const windowStart = new Date(triggerDate.getTime() - TOLERANCE_MIN * 60000);

      if (diffMin <= TOLERANCE_MIN) {
        if (now >= windowStart) {
          try {
            const msg = "Reminder: " + t.title + " | time " + t.time + " | " + t.date;
            await sendTelegramMessage(settings.bot_token, settings.chat_id, msg);
            await admin.from("tasks").update({ reminded_same_day: true }).eq("id", t.id);
            sent = sent + 1;
          } catch (e) {
            console.error("telegram send failed", e.message);
          }
        }
      }
    }

    const hasDayBefore = t.remind_day_before && t.remind_day_before !== "none";
    if (hasDayBefore) {
      if (!t.reminded_day_before) {
        let triggerDate;
        if (t.remind_day_before === "0") {
          triggerDate = new Date(taskDate);
          triggerDate.setDate(triggerDate.getDate() - 1);
          triggerDate.setHours(7, 0, 0, 0);
        } else {
          const offsetMin = parseInt(t.remind_day_before, 10);
          triggerDate = new Date(taskDate);
          triggerDate.setMinutes(triggerDate.getMinutes() + taskDateTimeMin + offsetMin);
        }

        const diffMin = Math.abs((now - triggerDate) / 60000);
        const windowStart = new Date(triggerDate.getTime() - TOLERANCE_MIN * 60000);

        if (diffMin <= TOLERANCE_MIN) {
          if (now >= windowStart) {
            try {
              const msg = "Reminder (day before): " + t.title + " | time " + t.time + " | " + t.date;
              await sendTelegramMessage(settings.bot_token, settings.chat_id, msg);
              await admin.from("tasks").update({ reminded_day_before: true }).eq("id", t.id);
              sent = sent + 1;
            } catch (e) {
              console.error("telegram send failed", e.message);
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true, checked: tasks.length, sent: sent });
}
