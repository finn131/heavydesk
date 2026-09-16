"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function markAllReadAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("read", false)
    .or(`user_id.eq.${user.id},user_id.is.null`);
  redirect("/notifications");
}
