"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AssetFormState = { error?: string };

export async function createAssetAction(_prev: AssetFormState, formData: FormData): Promise<AssetFormState> {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const unitNo = String(formData.get("unit_no") ?? "").trim();
  const category = String(formData.get("category") ?? "") || null;
  const hmInitial = Number(formData.get("hm_initial") ?? 0);

  if (!name || !unitNo) return { error: "Nama dan nomor unit wajib diisi." };
  if (!Number.isFinite(hmInitial) || hmInitial < 0) return { error: "Jam meter awal harus angka ≥ 0." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  if (!profile?.org_id) return { error: "Akun tidak terhubung ke organisasi." };

  const { data: asset, error } = await supabase
    .from("assets")
    .insert({ org_id: profile.org_id, name, unit_no: unitNo, category, hm_initial: hmInitial })
    .select("id")
    .single();

  if (error) return { error: error.message };
  redirect(`/assets/${asset.id}`);
}

export async function deleteAssetAction(assetId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("assets").delete().eq("id", assetId);
  if (error) throw new Error(error.message);
  redirect("/assets");
}
