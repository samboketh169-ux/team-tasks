import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: settings } = await admin.from("telegram_settings").select("*").eq("id", 1).maybeSingle();

  if (!settings?.bot_token || !settings?.chat_id) {
    return NextResponse.json({ error: "សូមកំណត់ Bot Token និង Chat ID សិន" }, { status: 400 });
  }

  try {
    await sendTelegramMessage(settings.bot_token, settings.chat_id, "✅ ការតភ្ជាប់ Telegram ដំណើរការត្រឹមត្រូវ!");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
