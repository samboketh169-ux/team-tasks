import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram";

const TOLERANCE_MIN = 4;
const CAMBODIA_OFFSET = "+07:00";

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

function cambodiaMidnightUtc(dateStr) {
  return new Date(dateStr + "T00:00:00" + CAMBODIA_OFFSET);
}

var ICON_REMIND = "\u{1f514}";
var ICON_DAYBEFORE = "\u{1f4c6}";
var ICON_TASK = "\u{1f4dd}";
var ICON_DUE = "\u23f0";
var ICON_COUNTDOWN = "\u23f3";

var TITLE_REMIND = "\u1780\u17b6\u179a\u1784\u17b6\u179a\u178f\u17d2\u179a\u17bc\u179c\u179a\u17c6\u179b\u17b9\u1780";
var LABEL_TASK = "\u1780\u17b6\u179a\u1784\u17b6\u179a\u17d6";
var LABEL_DUE = "\u1780\u17b6\u179a\u1784\u17b6\u179a\u1793\u17b9\u1784\u178a\u179b\u17cb\u1796\u17c1\u179b\u179c\u17c1\u179b\u17b6 \u1798\u17c9\u17c4\u1784 \u1790\u17d2\u1784\u17c3 \u1781\u17c2 \u1786\u17d2\u1793\u17b6\u17c6\u17d6";
var LABEL_DAYS_BEFORE_PREFIX = "\u1780\u17b6\u179a\u179a\u17c6\u179b\u17b9\u1780\u1780\u17b6\u179a\u1784\u17b6\u179a \u1798\u17bb\u1793\u1790\u17d2\u1784\u17c3";
var WORD_DAY_SUFFIX = "\u1790\u17d2\u1784\u17c3";

var WORD_HOUR = "\u1798\u17c9\u17c4\u1784";
var WORD_DATE = "\u1790\u17d2\u1784\u17c3\u1791\u17b8";
var WORD_MONTH = "\u1781\u17c2";
var WORD_YEAR = "\u1786\u17d2\u1793\u17b6\u17c6";

var PERIOD_MORNING = "\u1796\u17d2\u179a\u17b9\u1780";
var PERIOD_AFTERNOON = "\u179a\u179f\u17c0\u179b";
var PERIOD_EVENING = "\u179b\u17d2\u1784\u17b6\u1785";
var PERIOD_NIGHT = "\u1799\u1794\u17cb";

var MONTHS_KM = [
  "",
  "\u1798\u1780\u179a\u17b6",
  "\u1780\u17bb\u1798\u17d2\u1797\u17c8",
  "\u1798\u17b8\u1793\u17b6",
  "\u1798\u17c1\u179f\u17b6",
  "\u17a7\u179f\u1797\u17b6",
  "\u1798\u17b7\u1790\u17bb\u1793\u17b6",
  "\u1780\u1780\u17d2\u1780\u178a\u17b6",
  "\u179f\u17b8\u17a0\u17b6",
  "\u1780\u1789\u17d2\u1789\u17b6",
  "\u178f\u17bb\u179b\u17b6",
  "\u179c\u17b7\u1785\u17d2\u1786\u17b7\u1780\u17b6",
  "\u1792\u17d2\u1793\u17bc",
];

var KHMER_DIGITS = ["\u17e0", "\u17e1", "\u17e2", "\u17e3", "\u17e4", "\u17e5", "\u17e6", "\u17e7", "\u17e8", "\u17e9"];

function toKhmerDigits(numStr) {
  var out = "";
  for (var i = 0; i < numStr.length; i++) {
    var ch = numStr[i];
    if (ch >= "0" && ch <= "9") {
      out += KHMER_DIGITS[Number(ch)];
    } else {
      out += ch;
    }
  }
  return out;
}

function pad2(n) {
  if (n < 10) {
    return "0" + n;
  }
  return "" + n;
}

function formatKhmerTime(timeStr) {
  var parts = (timeStr || "00:00").split(":");
  var h = Number(parts[0]);
  var m = Number(parts[1]);
  var period = PERIOD_NIGHT;
  if (h < 5) {
    period = PERIOD_NIGHT;
  } else if (h < 12) {
    period = PERIOD_MORNING;
  } else if (h < 17) {
    period = PERIOD_AFTERNOON;
  } else if (h < 20) {
    period = PERIOD_EVENING;
  } else {
    period = PERIOD_NIGHT;
  }
  var h12 = h % 12;
  if (h12 === 0) {
    h12 = 12;
  }
  var timeKh = toKhmerDigits("" + h12) + ":" + toKhmerDigits(pad2(m));
  return WORD_HOUR + " " + timeKh + " " + period;
}

function formatKhmerDate(dateStr) {
  var parts = (dateStr || "").split("-");
  var year = parts[0];
  var monthIndex = Number(parts[1]);
  var day = Number(parts[2]);
  var monthName = MONTHS_KM[monthIndex] || "";
  return WORD_DATE + toKhmerDigits("" + day) + " " + WORD_MONTH + monthName + " " + WORD_YEAR + toKhmerDigits(year);
}

function buildSameDayMessage(title, time, date) {
  var msg = ICON_REMIND + " " + TITLE_REMIND;
  msg = msg + "\n";
  msg = msg + ICON_TASK + " " + LABEL_TASK + " " + title;
  msg = msg + "\n";
  msg = msg + ICON_DUE + " " + LABEL_DUE + " " + formatKhmerTime(time) + " " + formatKhmerDate(date);
  return msg;
}

function buildDayBeforeMessage(title, time, date, dayCount) {
  var msg = ICON_DAYBEFORE + " " + TITLE_REMIND;
  msg = msg + "\n";
  msg = msg + ICON_TASK + " " + LABEL_TASK + " " + title;
  msg = msg + "\n";
  msg = msg + ICON_COUNTDOWN + " " + LABEL_DAYS_BEFORE_PREFIX + " " + toKhmerDigits("" + dayCount) + " " + WORD_DAY_SUFFIX;
  msg = msg + "\n";
  msg = msg + ICON_DUE + " " + LABEL_DUE + " " + formatKhmerTime(time) + " " + formatKhmerDate(date);
  return msg;
}

// Resolve the trigger Date (UTC instant) for the "day before" reminder,
// and the day-count to show in the message.
// Supports new format: plain integer string "1".."5" = N days before, same clock time.
// Also supports legacy formats for tasks created before this update:
//   "0"            => 07:00 on the day before
//   negative number => minutes offset from the task's date midnight (old hour-based system)
function resolveDayBeforeTrigger(remindDayBefore, taskDateMidnight, taskDateTimeMin) {
  var n = parseInt(remindDayBefore, 10);

  if (remindDayBefore === "0") {
    var t0 = new Date(taskDateMidnight);
    t0.setDate(t0.getDate() - 1);
    t0.setHours(7, 0, 0, 0);
    return { triggerDate: t0, dayCount: 1 };
  }

  if (n >= 1 && n <= 5) {
    var t1 = new Date(taskDateMidnight);
    t1.setMinutes(t1.getMinutes() + taskDateTimeMin - n * 1440);
    return { triggerDate: t1, dayCount: n };
  }

  // legacy negative-minute-offset format
  var t2 = new Date(taskDateMidnight);
  t2.setMinutes(t2.getMinutes() + taskDateTimeMin + n);
  return { triggerDate: t2, dayCount: 1 };
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
  const debugInfo = [];

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const taskDateTimeMin = parseTimeToMinutes(t.time);
    const taskDateMidnight = cambodiaMidnightUtc(t.date);

    if (!t.reminded_same_day) {
      const triggerDate = new Date(taskDateMidnight);
      let remindSameDay = t.remind_same_day;
      if (!remindSameDay) {
        remindSameDay = 0;
      }
      const triggerMin = taskDateTimeMin - remindSameDay;
      triggerDate.setMinutes(triggerDate.getMinutes() + triggerMin);

      const diffMin = Math.abs((now - triggerDate) / 60000);
      const windowStart = new Date(triggerDate.getTime() - TOLERANCE_MIN * 60000);

      debugInfo.push({
        task: t.title,
        type: "same_day",
        triggerUtc: triggerDate.toISOString(),
        nowUtc: now.toISOString(),
        diffMin: diffMin,
      });

      if (diffMin <= TOLERANCE_MIN) {
        if (now >= windowStart) {
          try {
            const msg = buildSameDayMessage(t.title, t.time, t.date);
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
        const resolved = resolveDayBeforeTrigger(t.remind_day_before, taskDateMidnight, taskDateTimeMin);
        const triggerDate = resolved.triggerDate;
        const dayCount = resolved.dayCount;

        const diffMin = Math.abs((now - triggerDate) / 60000);
        const windowStart = new Date(triggerDate.getTime() - TOLERANCE_MIN * 60000);

        if (diffMin <= TOLERANCE_MIN) {
          if (now >= windowStart) {
            try {
              const msg = buildDayBeforeMessage(t.title, t.time, t.date, dayCount);
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

  return NextResponse.json({ ok: true, checked: tasks.length, sent: sent, debug: debugInfo });
}
