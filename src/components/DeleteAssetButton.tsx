"use client";

import { Trash2 } from "lucide-react";

export default function DeleteAssetButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={() => {
        if (confirm("Hapus unit ini? Semua log servis & foto ikut terhapus.")) void action();
      }}
    >
      <button
        type="submit"
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        Hapus unit
      </button>
    </form>
  );
}
