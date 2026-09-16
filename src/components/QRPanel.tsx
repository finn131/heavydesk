"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";

export default function QRPanel({ assetId, label }: { assetId: string; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}/assets/${assetId}`;
    void QRCode.toCanvas(canvasRef.current, url, {
      width: 512,
      margin: 2,
      color: { dark: "#1e293b", light: "#ffffff" },
    });
  }, [assetId]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${label}.png`.replace(/[^a-zA-Z0-9._-]/g, "_");
    a.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-4">
        <canvas ref={canvasRef} width={512} height={512} className="h-56 w-56" />
      </div>
      <button
        type="button"
        onClick={download}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 text-sm font-medium text-white hover:bg-slate-700"
      >
        <Download className="h-4 w-4" />
        Download QR PNG
      </button>
    </div>
  );
}
