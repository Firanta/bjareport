// =============================================================
// BJA Report — Create Invoice Page (Flexible Range & Multi-Plant)
// =============================================================

"use client";

import { useState, useEffect, useMemo } from "react";
import { useTripsByDateRange } from "@/hooks/useTrips";
import { useInvoiceItems } from "@/hooks/useInvoiceItems";
import { useInvoices } from "@/hooks/useInvoices";
import { usePlants } from "@/hooks/usePlants";
import {
  getAdditionalCosts,
  getCompanyProfile,
  addInvoice,
  addInvoiceItems,
  getNextInvoiceNumber,
  updateInvoicePdfUrl,
} from "@/lib/firebase/firestore";
import { calculateInvoiceTotals, formatRupiah, formatNumber, formatDate } from "@/lib/utils";
import { Loader2, FileText, CheckCircle2, AlertCircle, Download, Calendar, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Trip } from "@/types";

// Date formatting helpers
function formatDateLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function CreateInvoicePage() {
  const { plants } = usePlants();
  const { invoices } = useInvoices();
  const { invoicedTrips, loading: itemsLoading } = useInvoiceItems();

  // Initialize dates: 14 days ago to today
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return formatDateLocal(d);
  });
  const [endDate, setEndDate] = useState(() => formatDateLocal(new Date()));
  const [invoiceDate, setInvoiceDate] = useState(() => formatDateLocal(new Date()));

  // Fetch trips in range
  const { trips, loading: tripsLoading } = useTripsByDateRange(startDate, endDate);

  // States
  const [selectedTripIds, setSelectedTripIds] = useState<Set<string>>(new Set());
  const [additionalCosts, setAdditionalCosts] = useState<{ id: string; nama: string; nominal: number }[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<{
    id: string;
    nomorInvoice: string;
    pdfUrl: string;
    grandTotal: number;
    subtotalPlant: Record<string, any>;
  } | null>(null);
  const [showSuccessDropdown, setShowSuccessDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map of invoiceId -> nomorInvoice for lookup
  const invoiceMap = useMemo(() => {
    return new Map(invoices.map((inv) => [inv.id, inv.nomorInvoice]));
  }, [invoices]);

  // Load default additional costs on page mount
  useEffect(() => {
    async function loadCosts() {
      try {
        const dbCosts = await getAdditionalCosts();
        setAdditionalCosts(
          dbCosts.map((c) => ({
            id: c.id,
            nama: c.nama,
            nominal: c.nominal ?? 0,
          }))
        );
      } catch (err) {
        console.error("Gagal memuat biaya tambahan:", err);
      }
    }
    loadCosts();
  }, []);

  // Auto-select all UNINVOICED trips in the selected range
  useEffect(() => {
    if (trips.length > 0) {
      const uninvoicedIds = trips.filter((t) => !invoicedTrips[t.id]).map((t) => t.id);
      setSelectedTripIds(new Set(uninvoicedIds));
    } else {
      setSelectedTripIds(new Set());
    }
  }, [trips, invoicedTrips]);

  // Handle date range shortcuts
  const applyShortcut = (shortcut: string) => {
    const today = new Date();
    setGeneratedInvoice(null);
    setError(null);

    if (shortcut === "this-week") {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
      const monday = new Date(today.setDate(diff));
      setStartDate(formatDateLocal(monday));
      setEndDate(formatDateLocal(new Date()));
    } else if (shortcut === "last-week") {
      const temp = new Date();
      const day = temp.getDay();
      const diffToLastMonday = temp.getDate() - day - 6;
      const lastMonday = new Date(temp.setDate(diffToLastMonday));
      const lastSunday = new Date(temp.getTime());
      lastSunday.setDate(lastMonday.getDate() + 6);
      setStartDate(formatDateLocal(lastMonday));
      setEndDate(formatDateLocal(lastSunday));
    } else if (shortcut === "last-14") {
      const temp = new Date();
      temp.setDate(temp.getDate() - 14);
      setStartDate(formatDateLocal(temp));
      setEndDate(formatDateLocal(new Date()));
    } else if (shortcut === "this-month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDateLocal(firstDay));
      setEndDate(formatDateLocal(new Date()));
    }
  };

  // Checkbox toggle helpers
  const toggleTrip = (id: string) => {
    setGeneratedInvoice(null);
    setSelectedTripIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllUninvoiced = () => {
    setGeneratedInvoice(null);
    const uninvoiced = trips.filter((t) => !invoicedTrips[t.id]);
    const allSelected = uninvoiced.every((t) => selectedTripIds.has(t.id));

    setSelectedTripIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        // Deselect all uninvoiced
        uninvoiced.forEach((t) => next.delete(t.id));
      } else {
        // Select all uninvoiced
        uninvoiced.forEach((t) => next.add(t.id));
      }
      return next;
    });
  };

  // Filter selected trips for preview calculations
  const selectedTrips = useMemo(() => {
    return trips.filter((t) => selectedTripIds.has(t.id));
  }, [trips, selectedTripIds]);

  // Auto-calculate Karang Taruna (Rp 100,000 per surat jalan)
  useEffect(() => {
    setAdditionalCosts((prev) => {
      const ktIndex = prev.findIndex((c) => c.nama.toLowerCase().includes("karang taruna"));
      const calculatedNominal = selectedTripIds.size * 100000;
      
      if (ktIndex !== -1) {
        if (prev[ktIndex].nominal !== calculatedNominal) {
          const next = [...prev];
          next[ktIndex] = { ...next[ktIndex], nominal: calculatedNominal };
          return next;
        }
      } else if (calculatedNominal > 0) {
        return [...prev, { id: "karang-taruna-auto", nama: "Karang Taruna", nominal: calculatedNominal }];
      }
      return prev;
    });
  }, [selectedTripIds.size]);

  const totalAdditional = useMemo(() => {
    return additionalCosts.reduce((sum, c) => sum + c.nominal, 0);
  }, [additionalCosts]);

  // Run totals calculation for preview
  const plantsForCalc = useMemo(() => {
    return plants.map((p) => ({ id: p.id, hargaPerM3: p.hargaPerM3, items: p.items }));
  }, [plants]);

  const { subtotalPlant, totalKubikasi, grandTotal } = useMemo(() => {
    return calculateInvoiceTotals(
      selectedTrips.map((t) => ({ 
        plantId: t.plantId, 
        plantNama: t.plantNama, 
        jenisBarang: t.jenisBarang, 
        kubikasi: t.kubikasi 
      })),
      plantsForCalc,
      totalAdditional
    );
  }, [selectedTrips, plantsForCalc, totalAdditional]);

  // Form submit / Generate PDF
  const handleGenerate = async () => {
    if (selectedTrips.length === 0) {
      toast.error("Silakan pilih minimal satu trip untuk membuat invoice.");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const company = await getCompanyProfile();
      const invDateObj = new Date(invoiceDate);
      const bulan = invDateObj.getMonth() + 1;
      const tahun = invDateObj.getFullYear();

      // Auto numbering prefix INV-YYYY-MM
      const nomorInvoice = await getNextInvoiceNumber(bulan, tahun);

      const sortedDetails = [...additionalCosts]
        .filter((c) => c.nominal !== 0)
        .sort((a, b) => {
          if (a.nominal >= 0 && b.nominal < 0) return -1;
          if (a.nominal < 0 && b.nominal >= 0) return 1;
          return 0;
        })
        .map(({ nama, nominal }) => ({ nama, nominal }));

      const invoiceData = {
        nomorInvoice,
        bulan,
        tahun,
        startDate,
        endDate,
        invoiceDate,
        totalKubikasi,
        subtotalPlant,
        biayaTambahan: totalAdditional,
        biayaTambahanDetail: sortedDetails,
        grandTotal,
        pdfUrl: "", // Cloudinary URL updated below
      };

      // Save Invoice doc to Cloud Firestore
      const invoiceId = await addInvoice(invoiceData);

      // Save mapping relation tripIds -> invoiceId
      await addInvoiceItems(
        invoiceId,
        selectedTrips.map((t) => t.id)
      );

      // Call PDF service endpoint
      const invoiceForPdf = { id: invoiceId, ...invoiceData, createdAt: null as any };
      const pdfRes = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice: invoiceForPdf,
          trips: selectedTrips,
          company: company ?? {
            nama: "H. SUPANDI",
            alamat: "Kp. Tunggilis RT 002/007, Desa Situsari, Kec. Cileungsi, Kab. Bogor",
            noHp: "085882389089",
            bank: "BCA",
            rekening: "4060297636",
            atasNama: "H. SUPANDI",
          },
        }),
      });

      if (!pdfRes.ok) {
        throw new Error("Gagal memproses file PDF invoice.");
      }

      const { pdfUrl } = await pdfRes.json();
      await updateInvoicePdfUrl(invoiceId, pdfUrl);

      setGeneratedInvoice({
        id: invoiceId,
        nomorInvoice,
        pdfUrl,
        grandTotal,
        subtotalPlant,
      });
      toast.success(`Invoice ${nomorInvoice} berhasil dibuat!`);
    } catch (err: any) {
      setError(err.message ?? "Terjadi kesalahan saat generate invoice.");
      toast.error("Gagal membuat invoice.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>
            Buat Invoice Baru
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Rekap trips mingguan/dua mingguan per plant dan generate PDF otomatis.
          </p>
        </div>
        <Link href="/invoices/history" className="btn btn-secondary btn-sm">
          <FileText className="w-4 h-4" />
          Histori Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Config Forms */}
        <div className="space-y-6 lg:col-span-1">
          {/* Section 1: Period Selection */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5" style={{ color: "var(--brand-400)" }} />
              <h2 className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                1. Periode & Tanggal
              </h2>
            </div>

            {/* Quick Shortcuts */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={() => applyShortcut("this-week")} className="btn btn-secondary btn-sm text-xs py-1 px-2.5">
                Minggu Ini
              </button>
              <button onClick={() => applyShortcut("last-week")} className="btn btn-secondary btn-sm text-xs py-1 px-2.5">
                Minggu Lalu
              </button>
              <button onClick={() => applyShortcut("last-14")} className="btn btn-secondary btn-sm text-xs py-1 px-2.5">
                14 Hari Ini
              </button>
              <button onClick={() => applyShortcut("this-month")} className="btn btn-secondary btn-sm text-xs py-1 px-2.5">
                Bulan Ini
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Tanggal Mulai</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setGeneratedInvoice(null);
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tanggal Selesai</label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setGeneratedInvoice(null);
                }}
              />
            </div>

            <div className="form-group pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <label className="form-label">Tanggal Cetak Invoice</label>
              <input
                type="date"
                className="form-input"
                value={invoiceDate}
                onChange={(e) => {
                  setInvoiceDate(e.target.value);
                  setGeneratedInvoice(null);
                }}
              />
            </div>
          </div>

          {/* Section 2: Additional Costs */}
          <div className="card p-5 space-y-4">
            <h2 className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
              2. Biaya Tambahan (Rp)
            </h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Sesuaikan nominal biaya operasional atau potongan Karang Taruna jika ada.
            </p>

            <div className="space-y-3">
              {additionalCosts.map((cost, idx) => (
                <div key={cost.id} className="form-group">
                  <label className="form-label">{cost.nama}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={cost.nominal}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAdditionalCosts((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], nominal: val };
                        return next;
                      });
                      setGeneratedInvoice(null);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Trip Selector Checklist & Preview */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section 3: Trips Table selection */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                3. Pilih Trip untuk Direkap ({selectedTrips.length} terpilih)
              </h2>
              {trips.length > 0 && (
                <button
                  onClick={toggleSelectAllUninvoiced}
                  className="text-xs font-semibold"
                  style={{ color: "var(--brand-400)" }}
                >
                  {trips.filter((t) => !invoicedTrips[t.id]).every((t) => selectedTripIds.has(t.id))
                    ? "Deselect All Uninvoiced"
                    : "Select All Uninvoiced"}
                </button>
              )}
            </div>

            {tripsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--brand-500)" }} />
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-16" style={{ color: "rgba(255,255,255,0.3)" }}>
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Tidak ada data trip pada periode tanggal yang dipilih.</p>
                <p className="text-xs mt-1">Coba sesuaikan Tanggal Mulai dan Tanggal Selesai.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto pr-1">
                <table className="data-table text-xs">
                  <thead>
                    <tr>
                      <th className="w-8">
                        <input
                          type="checkbox"
                          checked={
                            trips.filter((t) => !invoicedTrips[t.id]).length > 0 &&
                            trips.filter((t) => !invoicedTrips[t.id]).every((t) => selectedTripIds.has(t.id))
                          }
                          onChange={toggleSelectAllUninvoiced}
                          disabled={trips.filter((t) => !invoicedTrips[t.id]).length === 0}
                          className="rounded border-gray-700 bg-black text-brand-600 focus:ring-brand-500"
                        />
                      </th>
                      <th>Tanggal</th>
                      <th>No Polisi</th>
                      <th>No Surat Jalan</th>
                      <th>Plant</th>
                      <th>Jenis</th>
                      <th className="text-right">Kubikasi</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((t) => {
                      const isAlreadyInvoiced = !!invoicedTrips[t.id];
                      const invoiceNo = isAlreadyInvoiced ? invoiceMap.get(invoicedTrips[t.id]) : null;

                      return (
                        <tr
                          key={t.id}
                          className={isAlreadyInvoiced ? "opacity-40" : "cursor-pointer"}
                          onClick={() => {
                            if (!isAlreadyInvoiced) toggleTrip(t.id);
                          }}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedTripIds.has(t.id)}
                              disabled={isAlreadyInvoiced}
                              onChange={() => toggleTrip(t.id)}
                              className="rounded border-gray-700 bg-black text-brand-600 focus:ring-brand-500 disabled:opacity-50"
                            />
                          </td>
                          <td>{formatDate(t.tanggal)}</td>
                          <td>{t.noPolisi}</td>
                          <td className="font-mono">{t.noSuratJalan}</td>
                          <td>{t.plantNama.replace("Plant ", "")}</td>
                          <td>{t.jenisBarang}</td>
                          <td className="text-right font-semibold">{formatNumber(t.kubikasi, 2)} m³</td>
                          <td>
                            {isAlreadyInvoiced ? (
                              <span className="badge badge-warning text-[10px] py-0 px-2 font-medium">
                                Invoiced: {invoiceNo ?? "..."}
                              </span>
                            ) : (
                              <span className="badge badge-gray text-[10px] py-0 px-2 font-medium text-emerald-400">
                                Ready
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Live Preview & Generator */}
          <div className="card p-5 space-y-4">
            <h2 className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
              4. Preview Kalkulasi & Estimasi
            </h2>

            {selectedTrips.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
                Pilih minimal satu trip di atas untuk menampilkan preview kalkulasi.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Plant list */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(subtotalPlant).map(([plantId, data]) => (
                    <div
                      key={plantId}
                      className="p-3.5 rounded-xl border flex flex-col justify-between"
                      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
                    >
                      <div>
                        <p className="font-bold text-xs flex justify-between" style={{ color: "rgba(255,255,255,0.5)" }}>
                          <span>{data.plantNama.toUpperCase()}</span>
                          <span style={{ color: "var(--brand-300)" }}>{data.jenisBarang}</span>
                        </p>
                        <p className="text-sm font-semibold mt-1.5" style={{ color: "rgba(255,255,255,0.85)" }}>
                          {formatNumber(data.totalKubikasi, 3)} m³
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                          Harga: {formatRupiah(data.hargaPerM3)}/m³
                        </p>
                      </div>
                      <p className="font-bold text-sm mt-3 text-right" style={{ color: "var(--brand-400)" }}>
                        {formatRupiah(data.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Subtotals & Grand Total details */}
                <div className="border-t pt-3.5 space-y-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="flex justify-between">
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>Total Trip</span>
                    <span className="font-semibold">{selectedTrips.length} trip</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>Total Kubikasi</span>
                    <span className="font-semibold">{formatNumber(totalKubikasi, 3)} m³</span>
                  </div>
                  {[...additionalCosts]
                    .sort((a, b) => {
                      if (a.nominal >= 0 && b.nominal < 0) return -1;
                      if (a.nominal < 0 && b.nominal >= 0) return 1;
                      return 0;
                    })
                    .map(
                      (cost) =>
                        cost.nominal !== 0 && (
                          <div key={cost.id} className="flex justify-between text-xs">
                            <span style={{ color: "rgba(255,255,255,0.45)" }}>
                              {cost.nominal > 0 ? `+ ${cost.nama}` : `– ${cost.nama}`}
                            </span>
                            <span className="font-medium">{formatRupiah(Math.abs(cost.nominal))}</span>
                          </div>
                        )
                    )}

                  {/* Grand total bar */}
                  <div
                    className="flex items-center justify-between mt-3 p-3.5 rounded-xl border border-brand-500/20"
                    style={{ background: "rgba(168,85,247,0.08)" }}
                  >
                    <div>
                      <span className="font-bold text-xs block" style={{ color: "var(--brand-300)" }}>
                        ESTIMASI GRAND TOTAL
                      </span>
                      <span className="text-[10px] block mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Mencakup subtotal plant + biaya tambahan
                      </span>
                    </div>
                    <span className="text-xl font-bold" style={{ color: "var(--brand-400)" }}>
                      {formatRupiah(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                className="flex items-center gap-3 p-4 rounded-xl border text-xs"
                style={{ background: "#fee2e2", borderColor: "#fca5a5", color: "#991b1b" }}
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {/* Success Invoice Result */}
            {generatedInvoice && (
              <div
                className="flex items-center gap-3 p-4 rounded-xl border text-xs"
                style={{ background: "#f0fdf4", borderColor: "#86efac", color: "#15803d" }}
              >
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold">Invoice {generatedInvoice.nomorInvoice} berhasil dibuat!</p>
                  <p className="text-xs">Grand Total: {formatRupiah(generatedInvoice.grandTotal)}</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowSuccessDropdown(!showSuccessDropdown)}
                    className="btn btn-secondary btn-sm flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-800 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4 text-emerald-700" />
                    Cetak / Download PDF
                  </button>
                  {showSuccessDropdown && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowSuccessDropdown(false)} />
                      <div className="absolute right-0 mt-1 w-56 rounded-xl border border-white/10 bg-[#0f0719] p-2 shadow-2xl z-40 text-left text-white">
                        <div className="px-2 py-1 text-[10px] font-semibold text-white/45 uppercase tracking-wider">
                          Opsi Cetak PDF
                        </div>
                        <div className="my-1 border-t border-white/5" />
                        <a
                          href={`/api/pdf?id=${generatedInvoice.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setShowSuccessDropdown(false)}
                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:bg-purple-600 hover:text-white transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-purple-400" />
                          Preview PDF (Semua)
                        </a>
                        <a
                          href={`/api/pdf?id=${generatedInvoice.id}&download=true`}
                          onClick={() => setShowSuccessDropdown(false)}
                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:bg-purple-600 hover:text-white transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-400" />
                          Download Semua (Combined)
                        </a>
                        <div className="my-1 border-t border-white/5" />
                        <div className="px-2 py-1 text-[10px] font-semibold text-white/45 uppercase tracking-wider">
                          Download Per Plant
                        </div>
                        {Object.keys(generatedInvoice.subtotalPlant).map((plantId) => {
                          const plantName = generatedInvoice.subtotalPlant[plantId].plantNama;
                          return (
                            <a
                              key={plantId}
                              href={`/api/pdf?id=${generatedInvoice.id}&plantId=${plantId}&download=true`}
                              onClick={() => setShowSuccessDropdown(false)}
                              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:bg-purple-600 hover:text-white transition-colors pl-4 truncate"
                              title={`Download ${plantName}`}
                            >
                              • {plantName.replace("Plant ", "")}
                            </a>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Action trigger button */}
            <div className="flex justify-end pt-2">
              <button
                className="btn btn-primary w-full md:w-auto"
                onClick={handleGenerate}
                disabled={generating || selectedTrips.length === 0 || !!generatedInvoice}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {generating ? "Membuat Invoice & PDF..." : "Generate Invoice & PDF"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
