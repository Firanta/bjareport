
"use client";

import { useState, useCallback } from "react";
import { UploadZone } from "@/components/ocr/UploadZone";
import { OcrReviewTable } from "@/components/ocr/OcrReviewTable";
import { usePlants } from "@/hooks/usePlants";
import { useTrips } from "@/hooks/useTrips";
import { checkDuplicateNoSuratJalan } from "@/lib/firebase/firestore";
import type { OcrReviewItem } from "@/types";
import { Loader2, ScanLine, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

type Stage = "upload" | "processing" | "review";

export default function UploadPage() {
  const { plants } = usePlants();
  const { createTrip } = useTrips();
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<Stage>("upload");
  const [items, setItems] = useState<OcrReviewItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  async function handleProcess() {
    if (files.length === 0) {
      toast.error("Pilih minimal 1 file terlebih dahulu.");
      return;
    }
    setStage("processing");
    setProcessError(null);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "OCR gagal");
      }

      const { results } = await res.json();

      const reviewItems: OcrReviewItem[] = results.map((r: any) => ({
        tempId: uuidv4(),
        imageUrl: r.imageUrl,
        ocrResult: r,
        noSuratJalan: r.noSuratJalan.value?.toString() ?? "",
        noPolisi: r.noPolisi.value?.toString() ?? "",
        kubikasi: r.kubikasi.value as number | null,           // VOL.DITERIMA
        tonasePlan: r.tonasePlan?.value as number | null,      // TIMBANGAN NET ← NEW
        tonaseKuari: r.tonaseKuari.value as number | null,     // NETTO
        tanggal: r.tanggal.value?.toString() ?? "",
        plantId: "",
        plantNama: "",
        jenisBarang: "Split",
        needsVerification: r.overallConfidence < 80,
        status: "pending",
      }));

      setItems(reviewItems);
      setStage("review");
    } catch (err: any) {
      setProcessError(err.message ?? "Terjadi kesalahan saat memproses OCR.");
      setStage("upload");
    }
  }

  function handleUpdate(tempId: string, updates: Partial<OcrReviewItem>) {
    setItems((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, ...updates } : item
      )
    );
  }

  function handleDelete(tempId: string) {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  }

  async function handleSaveAll() {
    const pending = items.filter((i) => i.status === "pending");
    if (pending.length === 0) return;

    setSaving(true);
    
    try {
      const results = await Promise.all(
        pending.map(async (item) => {
          if (!item.noSuratJalan || !item.noPolisi || !item.kubikasi || !item.plantId) {
            toast.error(`Item ${item.noSuratJalan || "?"} belum lengkap, dilewati.`);
            return { success: false, tempId: item.tempId };
          }

          try {
            // Check duplicate No Surat Jalan
            const isDup = await checkDuplicateNoSuratJalan(item.noSuratJalan);
            if (isDup) {
              toast.error(`No SJ ${item.noSuratJalan} sudah ada, dilewati.`);
              handleUpdate(item.tempId, { status: "error" });
              return { success: false, tempId: item.tempId };
            }

            await createTrip(
              {
                tanggal: item.tanggal || new Date().toISOString().split("T")[0],
                noPolisi: item.noPolisi,
                noSuratJalan: item.noSuratJalan,
                plantId: item.plantId,
                plantNama: item.plantNama,
                jenisBarang: item.jenisBarang,
                kubikasi: item.kubikasi,
                tonaseKuari: item.tonaseKuari ?? 0,
                tonasePlan: item.tonasePlan ?? 0,
              },
              item.imageUrl
            );
            handleUpdate(item.tempId, { status: "saved" });
            return { success: true, tempId: item.tempId };
          } catch (err) {
            handleUpdate(item.tempId, { status: "error" });
            return { success: false, tempId: item.tempId };
          }
        })
      );

      const saved = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      if (saved > 0) toast.success(`${saved} trip berhasil disimpan.`);
      if (failed > 0) toast.error(`${failed} trip gagal disimpan.`);
    } catch (err) {
      console.error("Gagal menyimpan trips:", err);
      toast.error("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>
          Upload Surat Jalan (OCR)
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          Upload foto surat jalan. Sistem akan otomatis membaca data menggunakan
          Google Vision OCR. Periksa hasil sebelum menyimpan.
        </p>
      </div>

      {/* Stage indicators */}
      <div className="flex items-center gap-2">
        {["Upload", "Proses OCR", "Review & Simpan"].map((label, i) => {
          const stageMap: Stage[] = ["upload", "processing", "review"];
          const current = stageMap.indexOf(stage);
          const active = i === current;
          const done = i < current;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: done || active ? "var(--brand-600)" : "rgba(255,255,255,0.06)",
                  color: done || active ? "white" : "rgba(255,255,255,0.4)",
                }}
              >
                {i + 1}
              </div>
              <span
                className="text-sm font-medium"
                style={{
                  color: active ? "var(--brand-400)" : done ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)",
                }}
              >
                {label}
              </span>
              {i < 2 && (
                <div
                  className="w-10 h-px mx-1"
                  style={{ background: done ? "var(--brand-500)" : "rgba(255,255,255,0.06)" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {processError && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl border"
          style={{ background: "#fee2e2", borderColor: "#fca5a5", color: "#991b1b" }}
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">OCR Gagal</p>
            <p className="text-sm">{processError}</p>
          </div>
        </div>
      )}

      {/* Stage: Upload */}
      {stage === "upload" && (
        <div className="card p-6 space-y-5">
          <UploadZone onFilesSelected={setFiles} disabled={false} />
          <div className="flex justify-end">
            <button
              className="btn btn-primary"
              onClick={handleProcess}
              disabled={files.length === 0}
            >
              <ScanLine className="w-4 h-4" />
              Proses OCR ({files.length} file)
            </button>
          </div>
        </div>
      )}

      {/* Stage: Processing */}
      {stage === "processing" && (
        <div className="card p-16 flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(139,92,246,0.1)" }}
          >
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: "var(--brand-400)" }}
            />
          </div>
          <div className="text-center">
            <p className="font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
              Memproses OCR...
            </p>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
              Mengupload ke Cloudinary dan membaca teks dengan Google Vision AI
            </p>
          </div>
        </div>
      )}

      {/* Stage: Review */}
      {stage === "review" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Periksa dan koreksi data sebelum menyimpan. Item dengan badge{" "}
              <span className="badge badge-warning inline-flex">
                <AlertTriangle className="w-3 h-3 inline" />
                Perlu Verifikasi
              </span>{" "}
              memiliki confidence OCR di bawah 80%.
            </p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setStage("upload");
                setFiles([]);
                setItems([]);
              }}
            >
              Upload Ulang
            </button>
          </div>
          <OcrReviewTable
            items={items}
            plants={plants}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onSaveAll={handleSaveAll}
            saving={saving}
          />
        </div>
      )}
    </div>
  );
}

// Needed for uuid - install if not present
function AlertTriangle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}
