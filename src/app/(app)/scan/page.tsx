"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Html5Qrcode } from "html5-qrcode";
import { ScanSearch, KeyboardIcon } from "lucide-react";

export function parseAssetCode(raw: string): string | null {
  const t = raw.trim();
  const m = t.match(/\/assets\/([0-9a-f-]{36})/i) ?? t.match(/^([0-9a-f]{8}-[0-9a-f-]{27,36})$/i);
  return m?.[1] ?? null;
}

export default function ScanPage() {
  const router = useRouter();
  const divRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    void (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled || !divRef.current) return;
      scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            const id = parseAssetCode(decoded);
            if (id) router.push(`/assets/${id}`);
          },
          () => {}
        );
      } catch {
        setCamError("Kamera tidak bisa diakses. Gunakan input manual di bawah.");
      }
    })();

    return () => {
      cancelled = true;
      void (async () => {
        if (!scanner) return;
        try {
          await scanner.stop();
          await scanner.clear();
        } catch {}
      })();
    };
  }, [router]);

  const openManual = () => {
    const id = parseAssetCode(manual);
    if (!id) {
      setManualError("Tidak ketemu ID unit yang valid.");
      return;
    }
    router.push(`/assets/${id}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Scan QR</h1>
        <p className="text-sm text-slate-500">Arahkan kamera ke QR unit, atau isi manual.</p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        {camError ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">{camError}</p>
        ) : (
          <div ref={divRef}>
            <div id="qr-reader" />
          </div>
        )}

        <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
          <KeyboardIcon className="h-5 w-5 text-slate-400" />
          <input
            value={manual}
            onChange={(e) => {
              setManual(e.target.value);
              setManualError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && openManual()}
            placeholder="Paste kode / URL unit, mis. /assets/2cc2e42a-..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button
            type="button"
            onClick={openManual}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            <ScanSearch className="h-4 w-4" />
            Buka
          </button>
        </div>
        {manualError && <p className="mt-2 text-sm text-red-600">{manualError}</p>}
      </div>
    </div>
  );
}
