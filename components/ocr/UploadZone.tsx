"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, X } from "lucide-react";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function UploadZone({
  onFilesSelected,
  maxFiles = 20,
  disabled = false,
}: UploadZoneProps) {
  const [previews, setPreviews] = useState<
    { file: File; previewUrl: string }[]
  >([]);

  // ✅ Safe: call onFilesSelected AFTER state settles, not during render
  useEffect(() => {
    onFilesSelected(previews.map((p) => p.file));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previews]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newPreviews = acceptedFiles.map((f) => ({
        file: f,
        previewUrl: URL.createObjectURL(f),
      }));
      setPreviews((prev) => [...prev, ...newPreviews].slice(0, maxFiles));
    },
    [maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic"] },
    maxFiles,
    disabled,
    multiple: true,
  });

  function removeFile(index: number) {
    setPreviews((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].previewUrl);
      next.splice(index, 1);
      return next;
    });
  }


  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className="relative flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all"
        style={{
          borderColor: isDragActive ? "var(--brand-500)" : "rgba(255,255,255,0.12)",
          background: isDragActive
            ? "rgba(168,85,247,0.12)"
            : disabled
            ? "rgba(255,255,255,0.02)"
            : "rgba(255,255,255,0.03)",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <input {...getInputProps()} />
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
          style={{
            background: isDragActive ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.06)",
          }}
        >
          <CloudUpload
            className="w-7 h-7"
            style={{
              color: isDragActive ? "var(--brand-400)" : "rgba(255,255,255,0.4)",
            }}
          />
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
            {isDragActive
              ? "Lepaskan file di sini..."
              : "Drag & drop atau klik untuk upload"}
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            JPG, PNG, WEBP — Maksimal {maxFiles} file
          </p>
        </div>
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
            {previews.length} file dipilih:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {previews.map((p, i) => (
              <div
                key={i}
                className="relative group rounded-xl overflow-hidden border"
                style={{
                  borderColor: "rgba(255,255,255,0.1)",
                  aspectRatio: "1",
                }}
              >
                <img
                  src={p.previewUrl}
                  alt={p.file.name}
                  className="w-full h-full object-cover"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{ background: "rgba(239,68,68,0.9)" }}
                    disabled={disabled}
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                {/* Name */}
                <div
                  className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs text-white truncate"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                >
                  {p.file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
