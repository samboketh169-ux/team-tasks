import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "\u178f\u1798\u17d2\u179a\u17bc\u179c\u17a2\u17b6\u179f\u17a0\u17b6\u1798\u17d0\u1799\u17a2\u17c2\u1796\u17c1\u179b\u17bc\u17e2 Admin \u1796\u17b6\u1791\u17b6\u17c5" }, { status: 403 });
  }

  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  if (userId === user.id) {
    return NextResponse.json({ error: "\u1798\u17b7\u1793\u17a2\u17b6\u1785\u179b\u17bb\u1794\u1782\u178e\u1793\u17b8\u1781\u17d2\u179b\u17bd\u1793\u17a2\u17d2\u1793\u1780\u1794\u17b6\u1793\u178f\u17c1" }, { status: 400 });
  }

  const admin = createAdminClient();

  // delete profile row first
  await admin.from("profiles").delete().eq("id", userId);

  // then delete the auth user
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
