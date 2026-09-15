"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type RegisterState = { error?: string; info?: string };

export async function registerAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "");

  if (password.length < 6) return { error: "Password minimal 6 karakter." };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) return { error: error.message };

  if (data.session) redirect("/dashboard");

  return { info: "Email konfirmasi dikirim. Cek inbox kamu lalu login." };
}
