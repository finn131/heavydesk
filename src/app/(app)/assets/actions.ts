"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { computeNextDue } from "@/lib/intervals";

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

export type LogFormState = { error?: string };

export async function createLogAction(
  assetId: string,
  _prev: LogFormState,
  formData: FormData,
): Promise<LogFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir, silakan login ulang." };

  const logType = String(formData.get("log_type") ?? "");
  const hm = Number(formData.get("hm"));
  const cost = Number(formData.get("cost") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();
  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  if (logType !== "rutin" && logType !== "perbaikan") return { error: "Jenis servis tidak valid." };
  if (!Number.isFinite(hm) || hm < 0) return { error: "Jam meter harus angka ≥ 0." };
  if (!Number.isFinite(cost) || cost < 0) return { error: "Biaya harus angka ≥ 0." };

  const { data: asset, error: assetErr } = await supabase
    .from("assets")
    .select("id, org_id, category, hm_initial, next_due_hm")
    .eq("id", assetId)
    .single();
  if (assetErr || !asset) return { error: "Unit tidak ditemukan." };

  const { data: lastLog } = await supabase
    .from("maintenance_logs")
    .select("hm")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const lastHm = lastLog?.hm ?? asset.hm_initial ?? 0;
  if (hm < lastHm) return { error: `Jam meter mundur? Terakhir ${lastHm} HM.` };

  const { data: log, error: logErr } = await supabase
    .from("maintenance_logs")
    .insert({ asset_id: assetId, org_id: asset.org_id, log_type: logType, hm, cost, notes, author_id: user.id })
    .select("id, created_at")
    .single();
  if (logErr) return { error: logErr.message };

  const failed: string[] = [];
  for (const file of photos) {
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${asset.org_id}/${log.id}/${randomUUID()}.${ext || "jpg"}`;
    const { error: upErr } = await supabase.storage.from("fotos").upload(path, file, {
      contentType: file.type || "image/jpeg",
    });
    if (upErr) {
      failed.push(file.name);
      continue;
    }
    await supabase.from("photos").insert({ log_id: log.id, storage_path: path });
  }

  const { dueHm, dueDate } = computeNextDue({ hm, date: log.created_at }, asset.category);
  await supabase.from("assets").update({ next_due_hm: dueHm, next_due_date: dueDate }).eq("id", assetId);

  if (failed.length > 0) return { error: `Log tersimpan, ${failed.length} foto gagal diunggah.` };
  redirect(`/assets/${assetId}#riwayat`);
}