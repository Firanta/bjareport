"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Pencil,
  Save,
  Loader2,
  X,
} from "lucide-react";
import type { OcrReviewItem, Plant } from "@/types";
import { formatNumber } from "@/lib/utils";

interface OcrReviewTableProps {
  items: OcrReviewItem[];
  plants: Plant[];
  onUpdate: (tempId: string, updates: Partial<OcrReviewItem>) => void;
  onDelete: (tempId: string) => void;
  onSaveAll: () => Promise<void>;
  saving: boolean;
}

export function OcrReviewTable({
  items,
  plants,
  onUpdate,
  onDelete,
  onSaveAll,
  saving,
}: OcrReviewTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const savedCount = items.filter((i) => i.status === "saved").length;
  const needsVerCount = items.filter((i) => i.needsVerification).length;

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="badge badge-info">{pendingCount} Menunggu</span>
        <span className="badge badge-success">{savedCount} Tersimpan</span>
        {needsVerCount > 0 && (
          <span className="badge badge-warning">
            <AlertTriangle className="w-3 h-3" />
            {needsVerCount} Perlu Verifikasi Manual
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={onSaveAll}
            disabled={saving || pendingCount === 0}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Simpan Semua ({pendingCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Foto</th>
              <th>No SJ</th>
              <th>No Polisi</th>
              <th>Kubikasi</th>
              <th>Ton Plan</th>
              <th>Ton Kuari</th>
              <th>Tanggal</th>
              <th>Plant</th>
              <th>Barang</th>
              <th>Confidence</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isEditing = editingId === item.tempId;
              const conf = item.ocrResult.overallConfidence;
              const confColor =
                conf >= 80
                  ? "var(--success)"
                  : conf >= 60
                  ? "var(--warning)"
                  : "var(--danger)";

              return (
                <tr key={item.tempId}>
                  {/* Foto */}
                  <td>
                    <a href={item.imageUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={item.imageUrl}
                        alt="Surat Jalan"
                        className="w-14 h-14 object-cover rounded-lg border"
                        style={{ borderColor: "rgba(255,255,255,0.1)" }}
                      />
                    </a>
                  </td>

                  {/* No SJ */}
                  <td>
                    {isEditing ? (
                      <input
                        className="form-input font-mono"
                        style={{ width: 100 }}
                        value={item.noSuratJalan}
                        onChange={(e) =>
                          onUpdate(item.tempId, { noSuratJalan: e.target.value })
                        }
                      />
                    ) : (
                      <span className="font-mono text-xs">{item.noSuratJalan || "—"}</span>
                    )}
                  </td>

                  {/* No Polisi */}
                  <td>
                    {isEditing ? (
                      <select
                        className="form-input"
                        style={{ width: 130 }}
                        value={item.noPolisi}
                        onChange={(e) =>
                          onUpdate(item.tempId, { noPolisi: e.target.value })
                        }
                      >
                        <option value="">—</option>
                        {/* Vehicles are loaded in parent */}
                        <option value={item.noPolisi}>{item.noPolisi}</option>
                      </select>
                    ) : (
                      <span className="badge badge-info">{item.noPolisi || "—"}</span>
                    )}
                  </td>

                  {/* Kubikasi */}
                  <td>
                    {isEditing ? (
                      <input
                        className="form-input"
                        type="number"
                        step="any"
                        style={{ width: 90 }}
                        value={item.kubikasi || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          onUpdate(item.tempId, { kubikasi: val === "" ? null : parseFloat(val) });
                        }}
                      />
                    ) : (
                      <span className="font-semibold">
                        {item.kubikasi !== null && item.kubikasi !== undefined && item.kubikasi !== 0
                          ? `${formatNumber(item.kubikasi)} m³`
                          : "—"}
                      </span>
                    )}
                  </td>

                  {/* Ton Plan (TIMBANGAN NET) */}
                  <td>
                    {isEditing ? (
                      <input
                        className="form-input"
                        type="number"
                        step="any"
                        style={{ width: 80 }}
                        value={item.tonasePlan || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          onUpdate(item.tempId, { tonasePlan: val === "" ? null : parseFloat(val) });
                        }}
                      />
                    ) : (
                      <span>
                        {item.tonasePlan !== null && item.tonasePlan !== undefined && item.tonasePlan !== 0
                          ? `${item.tonasePlan} t`
                          : "—"}
                      </span>
                    )}
                  </td>

                  {/* Ton Kuari (NETTO) */}
                  <td>
                    {isEditing ? (
                      <input
                        className="form-input"
                        type="number"
                        step="any"
                        style={{ width: 80 }}
                        value={item.tonaseKuari || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          onUpdate(item.tempId, { tonaseKuari: val === "" ? null : parseFloat(val) });
                        }}
                      />
                    ) : (
                      <span>
                        {item.tonaseKuari !== null && item.tonaseKuari !== undefined && item.tonaseKuari !== 0
                          ? `${item.tonaseKuari} t`
                          : "—"}
                      </span>
                    )}
                  </td>

                  {/* Tanggal */}
                  <td>
                    {isEditing ? (
                      <input
                        className="form-input"
                        type="date"
                        style={{ width: 130 }}
                        value={item.tanggal}
                        onChange={(e) =>
                          onUpdate(item.tempId, { tanggal: e.target.value })
                        }
                      />
                    ) : (
                      <span>{item.tanggal || "—"}</span>
                    )}
                  </td>

                  {/* Plant */}
                  <td>
                    {isEditing ? (
                      <select
                        className="form-input"
                        style={{ width: 160 }}
                        value={item.plantId}
                        onChange={(e) => {
                          const plant = plants.find((p) => p.id === e.target.value);
                          onUpdate(item.tempId, {
                            plantId: e.target.value,
                            plantNama: plant?.nama ?? "",
                            jenisBarang: plant?.items && plant.items.length > 0 ? plant.items[0].nama : "Split"
                          });
                        }}
                      >
                        <option value="">-- Pilih Plant --</option>
                        {plants.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nama}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="badge badge-gray">
                        {item.plantNama?.replace("Plant ", "") || "—"}
                      </span>
                    )}
                  </td>

                  {/* Jenis Barang */}
                  <td>
                    {isEditing ? (
                      <select
                        className="form-input"
                        style={{ width: 110 }}
                        value={item.jenisBarang}
                        onChange={(e) => onUpdate(item.tempId, { jenisBarang: e.target.value })}
                        disabled={!item.plantId}
                      >
                        {(() => {
                          const p = plants.find(pl => pl.id === item.plantId);
                          const pItems = p?.items && p.items.length > 0 
                            ? p.items 
                            : [{ id: "def", nama: "Split", hargaPerM3: p?.hargaPerM3 || 0 }];
                          return pItems.map(it => <option key={it.id} value={it.nama}>{it.nama}</option>);
                        })()}
                      </select>
                    ) : (
                      <span className="badge badge-gray">
                        {item.jenisBarang || "—"}
                      </span>
                    )}
                  </td>

                  {/* Confidence */}
                  <td>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-xs font-bold"
                          style={{ color: confColor }}
                        >
                          {conf}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ width: 60, background: "rgba(255,255,255,0.1)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${conf}%`,
                            background: confColor,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    {item.status === "saved" ? (
                      <span className="badge badge-success">
                        <CheckCircle2 className="w-3 h-3" />
                        Tersimpan
                      </span>
                    ) : item.needsVerification ? (
                      <span className="badge badge-warning">
                        <AlertTriangle className="w-3 h-3" />
                        Perlu Verifikasi
                      </span>
                    ) : (
                      <span className="badge badge-gray">Menunggu</span>
                    )}
                  </td>

                  {/* Aksi */}
                  <td>
                    <div className="flex items-center gap-1">
                      {item.status !== "saved" && (
                        <>
                          {isEditing ? (
                            <button
                              className="btn-icon"
                              title="Selesai Edit"
                              style={{ color: "var(--success)" }}
                              onClick={() => setEditingId(null)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              className="btn-icon"
                              title="Edit"
                              onClick={() => setEditingId(item.tempId)}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            title="Hapus"
                            style={{ color: "var(--danger)" }}
                            onClick={() => onDelete(item.tempId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
