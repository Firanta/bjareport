
"use client";

import { useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { formatRupiah, getMonthName, formatDate } from "@/lib/utils";
import {
  Download,
  Eye,
  Trash2,
  FileText,
  ChevronDown,
  ChevronRight,
  Loader2,
  FilePlus,
  Pencil,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  getTripsForInvoice,
  getCompanyProfile,
  addInvoice,
  addInvoiceItems,
  updateInvoicePdfUrl,
} from "@/lib/firebase/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";
import type { Invoice, Trip } from "@/types";

export default function InvoiceHistoryPage() {
  const { grouped, invoices, loading, removeInvoice } = useInvoices();
  const [expandedYears, setExpandedYears] = useState<Set<number>>(
    new Set([new Date().getFullYear()])
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Merge states
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [newInvoiceNo, setNewInvoiceNo] = useState("");
  const [newInvoiceDate, setNewInvoiceDate] = useState("");
  const [merging, setMerging] = useState(false);

  // Edit states
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);
  const [editInvoiceNo, setEditInvoiceNo] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function toggleYear(year: number) {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await removeInvoice(deleteId);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  async function handleMerge() {
    if (selectedInvoiceIds.size < 2 || !newInvoiceNo) return;
    setMerging(true);
    try {
      const selectedInvoices = invoices.filter((inv) => selectedInvoiceIds.has(inv.id));
      
      // 1. Fetch all trips for all selected invoices in parallel
      const tripsPromises = selectedInvoices.map((inv) => getTripsForInvoice(inv.id));
      const tripsArrays = await Promise.all(tripsPromises);
      const allTrips = tripsArrays.flat();
      const uniqueTrips = allTrips.filter(
        (t, index, self) => self.findIndex((x) => x.id === t.id) === index
      );

      // 2. Fetch company profile
      const company = await getCompanyProfile();

      // 3. Combine subtotalPlant
      const mergedSubtotalPlant: Record<string, any> = {};
      selectedInvoices.forEach((inv) => {
        Object.entries(inv.subtotalPlant).forEach(([oldKey, data]) => {
          const parsedPlantId = oldKey.includes("_") ? oldKey.split("_")[0] : oldKey;
          const parsedJenisBarang = oldKey.includes("_") ? (oldKey.split("_").length > 2 ? oldKey.split("_").slice(1, -1).join("_") : oldKey.split("_").slice(1).join("_")) : "Split";
          
          // Group by plantId + jenisBarang + price
          const key = `${parsedPlantId}_${parsedJenisBarang}_${data.hargaPerM3}`.replace(/[^a-zA-Z0-9-_]/g, "_");
          
          if (!mergedSubtotalPlant[key]) {
            mergedSubtotalPlant[key] = {
              plantNama: data.plantNama,
              jenisBarang: data.jenisBarang,
              totalKubikasi: 0,
              hargaPerM3: data.hargaPerM3,
              subtotal: 0,
            };
          }
          mergedSubtotalPlant[key].totalKubikasi += data.totalKubikasi;
          mergedSubtotalPlant[key].subtotal += data.subtotal;
        });
      });

      // 4. Combine additional costs detail
      const combinedDetails = selectedInvoices.flatMap((inv) => inv.biayaTambahanDetail || []);
      const groupedDetailsMap = new Map<string, number>();
      combinedDetails.forEach((d) => {
        const existing = groupedDetailsMap.get(d.nama) || 0;
        groupedDetailsMap.set(d.nama, existing + d.nominal);
      });
      const mergedDetails = Array.from(groupedDetailsMap.entries()).map(([nama, nominal]) => ({
        nama,
        nominal,
      }));

      // Sort additional costs
      mergedDetails.sort((a, b) => {
        if (a.nominal >= 0 && b.nominal < 0) return -1;
        if (a.nominal < 0 && b.nominal >= 0) return 1;
        return 0;
      });

      const totalAdditional = mergedDetails.reduce((sum, d) => sum + d.nominal, 0);
      const totalKubikasi = uniqueTrips.reduce((sum, t) => sum + (t.kubikasi ?? 0), 0);
      const grandTotal = Object.values(mergedSubtotalPlant).reduce((sum: number, p: any) => sum + p.subtotal, 0) + totalAdditional;

      const invDateObj = new Date(newInvoiceDate);
      const invoiceData = {
        nomorInvoice: newInvoiceNo,
        bulan: invDateObj.getMonth() + 1,
        tahun: invDateObj.getFullYear(),
        startDate: selectedInvoices.map((i) => i.startDate).filter(Boolean).sort()[0] || "",
        endDate: selectedInvoices.map((i) => i.endDate).filter(Boolean).sort().reverse()[0] || "",
        invoiceDate: newInvoiceDate,
        totalKubikasi,
        subtotalPlant: mergedSubtotalPlant,
        biayaTambahan: totalAdditional,
        biayaTambahanDetail: mergedDetails,
        grandTotal,
        pdfUrl: "",
        isCombined: true,
        combinedInvoiceIds: selectedInvoices.map((inv) => inv.id),
      };

      // 5. Save Invoice doc to Cloud Firestore
      const newInvoiceId = await addInvoice(invoiceData);

      // 6. Save mapping relation uniqueTrips -> newInvoiceId
      await addInvoiceItems(newInvoiceId, uniqueTrips.map((t) => t.id));

      // 7. Call PDF service endpoint to render & upload PDF
      const invoiceForPdf = { id: newInvoiceId, ...invoiceData, createdAt: null as any };
      const pdfRes = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice: invoiceForPdf,
          trips: uniqueTrips,
          company: company ?? {
            nama: "H. SUPANDI",
            alamat: "Kp. Tunggilis RT 002/007, Desa Situsari, Kec. Cileungsi, Kab. Bogor",
            noHp: "085882389089",
            bank: "BCA",
            rekening: "4060297636",
            atasNama: "H. SUPANDI",
          },
          isCombined: true,
          combinedInvoices: selectedInvoices,
          combinedTrips: tripsArrays
        }),
      });

      if (!pdfRes.ok) {
        throw new Error("Gagal memproses file PDF invoice gabungan.");
      }

      const { pdfUrl } = await pdfRes.json();
      await updateInvoicePdfUrl(newInvoiceId, pdfUrl);

      toast.success("Invoice berhasil digabungkan!");
      setSelectedInvoiceIds(new Set());
      setShowMergeModal(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal menggabungkan invoice.");
    } finally {
      setMerging(false);
    }
  }

  async function handleUpdateInvoiceNo(id: string, newNo: string) {
    if (!newNo.trim()) {
      toast.error("Nomor invoice tidak boleh kosong.");
      return;
    }
    setUpdatingId(id);
    try {
      const inv = invoices.find((i) => i.id === id);
      if (!inv) throw new Error("Invoice tidak ditemukan.");

      // 1. Update Firestore document
      const db = getFirebaseDb();
      await updateDoc(doc(db, "invoices", id), { nomorInvoice: newNo.trim() });

      // 2. Fetch trips for the invoice
      let trips: Trip[] = [];
      const company = await getCompanyProfile();

      const isCombined = !!inv.isCombined;
      const combinedInvoices: Invoice[] = [];
      const combinedTrips: Trip[][] = [];

      if (isCombined && inv.combinedInvoiceIds) {
        for (const cid of inv.combinedInvoiceIds) {
          const actualSubInv = invoices.find((i) => i.id === cid);
          if (actualSubInv) {
            combinedInvoices.push(actualSubInv);
            const subTrips = await getTripsForInvoice(cid);
            combinedTrips.push(subTrips);
          }
        }
      } else {
        trips = await getTripsForInvoice(id);
      }

      // 3. Call PDF service endpoint to regenerate & upload PDF with the new filename and details
      const invoiceForPdf = { ...inv, nomorInvoice: newNo.trim(), createdAt: null as any };
      const pdfRes = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice: invoiceForPdf,
          trips,
          company: company ?? {
            nama: "H. SUPANDI",
            alamat: "Kp. Tunggilis RT 002/007, Desa Situsari, Kec. Cileungsi, Kab. Bogor",
            noHp: "085882389089",
            bank: "BCA",
            rekening: "4060297636",
            atasNama: "H. SUPANDI",
          },
          isCombined,
          combinedInvoices: isCombined ? combinedInvoices : undefined,
          combinedTrips: isCombined ? combinedTrips : undefined
        }),
      });

      if (!pdfRes.ok) {
        throw new Error("Gagal meregenerasi file PDF invoice.");
      }

      const { pdfUrl } = await pdfRes.json();
      await updateInvoicePdfUrl(id, pdfUrl);

      toast.success("Nomor invoice berhasil diubah!");
      setEditInvoiceId(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal mengubah nomor invoice.");
    } finally {
      setUpdatingId(null);
    }
  }

  const years = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>
            Histori Invoice
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            {invoices.length} invoice tersimpan
          </p>
        </div>
        <Link href="/invoices/create" className="btn btn-primary btn-sm">
          <FilePlus className="w-4 h-4" />
          Buat Invoice Baru
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--brand-500)" }} />
        </div>
      ) : invoices.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText
            className="w-12 h-12 mx-auto mb-3 opacity-20"
            style={{ color: "rgba(255,255,255,0.25)" }}
          />
          <p className="font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
            Belum ada invoice
          </p>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Buat invoice pertama dari halaman Generate Invoice.
          </p>
          <Link href="/invoices/create" className="btn btn-primary btn-sm mt-4 inline-flex">
            Buat Invoice
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {years.map((year) => {
            const isOpen = expandedYears.has(year);
            const months = Object.keys(grouped[year])
              .map(Number)
              .sort((a, b) => b - a);
            const totalInvoicesYear = months.reduce(
              (s, m) => s + grouped[year][m].length,
              0
            );

            return (
              <div key={year} className="card">
                {/* Year header */}
                <button
                  className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                  onClick={() => toggleYear(year)}
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? (
                      <ChevronDown className="w-5 h-5" style={{ color: "var(--brand-500)" }} />
                    ) : (
                      <ChevronRight className="w-5 h-5" style={{ color: "rgba(255,255,255,0.4)" }} />
                    )}
                    <span className="text-lg font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>
                      {year}
                    </span>
                    <span className="badge badge-info">{totalInvoicesYear} invoice</span>
                  </div>
                </button>

                {/* Months */}
                {isOpen && (
                  <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    {months.map((month) => {
                      const monthInvoices = grouped[year][month];
                      const monthTotal = monthInvoices.reduce(
                        (s, i) => s + i.grandTotal,
                        0
                      );

                      return (
                        <div key={month}>
                          {/* Month header */}
                          <div
                            className="flex items-center justify-between px-5 py-3"
                            style={{
                              background: "rgba(255,255,255,0.02)",
                              borderBottom: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <div className="flex items-center gap-2 ml-8">
                              <span className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                                {getMonthName(month)} {year}
                              </span>
                              <span className="badge badge-gray">
                                {monthInvoices.length} invoice
                              </span>
                            </div>
                            <span className="text-sm font-semibold" style={{ color: "var(--brand-400)" }}>
                              {formatRupiah(monthTotal)}
                            </span>
                          </div>

                          {/* Invoice rows */}
                          {monthInvoices.map((inv) => (
                            <div
                              key={inv.id}
                              className="flex items-center justify-between px-5 py-4 ml-8 border-b last:border-0 hover:bg-white/5 transition-colors"
                              style={{ borderColor: "rgba(255,255,255,0.05)" }}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedInvoiceIds.has(inv.id)}
                                  onChange={(e) => {
                                    setSelectedInvoiceIds((prev) => {
                                      const next = new Set(prev);
                                      if (e.target.checked) next.add(inv.id);
                                      else next.delete(inv.id);
                                      return next;
                                    });
                                  }}
                                  className="rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <FileText
                                      className="w-4 h-4"
                                      style={{ color: "var(--brand-500)" }}
                                    />
                                    {editInvoiceId === inv.id ? (
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="text"
                                          className="form-input text-xs font-mono py-1 px-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                          value={editInvoiceNo}
                                          onChange={(e) => setEditInvoiceNo(e.target.value)}
                                          disabled={updatingId === inv.id}
                                          style={{ width: 220 }}
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => handleUpdateInvoiceNo(inv.id, editInvoiceNo)}
                                          disabled={updatingId === inv.id}
                                          className="p-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg flex items-center justify-center"
                                          title="Simpan"
                                          style={{ height: 28, width: 28 }}
                                        >
                                          {updatingId === inv.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Check className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                        <button
                                          onClick={() => setEditInvoiceId(null)}
                                          disabled={updatingId === inv.id}
                                          className="p-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg flex items-center justify-center"
                                          title="Batal"
                                          style={{ height: 28, width: 28 }}
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className="font-mono text-sm font-semibold"
                                          style={{ color: "rgba(255,255,255,0.85)" }}
                                        >
                                          {inv.nomorInvoice}
                                        </span>
                                        <button
                                          onClick={() => {
                                            setEditInvoiceId(inv.id);
                                            setEditInvoiceNo(inv.nomorInvoice);
                                          }}
                                          className="p-1 text-white/40 hover:text-white/80 transition-colors"
                                          title="Ubah Nomor Invoice"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs mt-0.5 text-white/40">
                                    {formatNumber(inv.totalKubikasi)} m³ total kubikasi
                                    {inv.startDate && inv.endDate && (
                                      <span className="ml-2 pl-2 border-l border-white/10">
                                        Periode: {formatDate(inv.startDate)} – {formatDate(inv.endDate)}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <span className="font-bold" style={{ color: "var(--brand-400)" }}>
                                  {formatRupiah(inv.grandTotal)}
                                </span>
                                <div className="flex items-center gap-1">
                                  <a
                                    href={`/api/pdf?id=${inv.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-icon"
                                    title="Preview PDF"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </a>

                                  <div className="relative">
                                    <button
                                      onClick={() => setActiveDropdownId(activeDropdownId === inv.id ? null : inv.id)}
                                      className={`btn-icon ${activeDropdownId === inv.id ? 'bg-white/10' : ''}`}
                                      title="Download PDF"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                    {activeDropdownId === inv.id && (
                                      <>
                                        <div className="fixed inset-0 z-30" onClick={() => setActiveDropdownId(null)} />
                                        <div className="absolute right-0 mt-1 w-56 rounded-xl border border-white/10 bg-[#0f0719] p-2 shadow-2xl z-40 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                                          <div className="px-2 py-1 text-[10px] font-semibold text-white/45 uppercase tracking-wider">
                                            Opsi Cetak PDF
                                          </div>
                                          <div className="my-1 border-t border-white/5" />
                                          <a
                                            href={`/api/pdf?id=${inv.id}&download=true`}
                                            onClick={() => setActiveDropdownId(null)}
                                            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:bg-purple-600 hover:text-white transition-colors"
                                          >
                                            <FileText className="w-3.5 h-3.5 text-purple-400" />
                                            Download Semua (Combined)
                                          </a>
                                          <div className="my-1 border-t border-white/5" />
                                          <div className="px-2 py-1 text-[10px] font-semibold text-white/45 uppercase tracking-wider">
                                            Download Per Plant
                                          </div>
                                          {Object.keys(inv.subtotalPlant).map((plantId) => {
                                            const plantName = inv.subtotalPlant[plantId].plantNama;
                                            return (
                                              <a
                                                key={plantId}
                                                href={`/api/pdf?id=${inv.id}&plantId=${plantId}&download=true`}
                                                onClick={() => setActiveDropdownId(null)}
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

                                  <button
                                    className="btn-icon"
                                    style={{ color: "var(--danger)" }}
                                    title="Hapus Invoice"
                                    onClick={() => setDeleteId(inv.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div
            className="card p-6 w-full max-w-sm"
            style={{ boxShadow: "var(--shadow-modal)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "#fee2e2" }}
              >
                <Trash2 className="w-5 h-5" style={{ color: "var(--danger)" }} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                  Hapus Invoice?
                </p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Invoice dan semua item terkait akan dihapus permanen.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
              >
                Batal
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar for Merge */}
      {selectedInvoiceIds.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0f0719]/80 backdrop-blur-md border border-white/10 px-6 py-4 rounded-full shadow-2xl z-50 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="text-sm font-semibold text-white/90">
            {selectedInvoiceIds.size} Invoice Terpilih
          </span>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedInvoiceIds(new Set())}
              className="btn btn-secondary btn-sm text-xs"
            >
              Batal
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
                setNewInvoiceNo(`INV-GAB-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`);
                setNewInvoiceDate(today.toISOString().slice(0, 10));
                setShowMergeModal(true);
              }}
              className="btn btn-primary btn-sm text-xs bg-purple-600 hover:bg-purple-700 border-none"
            >
              Gabungkan
            </button>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="card p-6 w-full max-w-md shadow-2xl border border-white/10 space-y-4"
            style={{ boxShadow: "var(--shadow-modal)", background: "#0f0719" }}
          >
            <div>
              <p className="font-bold text-lg text-white/95">Gabungkan Invoice</p>
              <p className="text-sm text-white/45 mt-1">
                Gabungkan {selectedInvoiceIds.size} invoice menjadi 1 file invoice gabungan baru. Invoice asli tidak akan dihapus.
              </p>
            </div>

            <div className="space-y-3">
              <div className="form-group">
                <label className="text-xs text-white/60 block mb-1">Nomor Invoice Baru</label>
                <input
                  type="text"
                  className="form-input text-sm w-full py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  value={newInvoiceNo}
                  onChange={(e) => setNewInvoiceNo(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="text-xs text-white/60 block mb-1">Tanggal Invoice</label>
                <input
                  type="date"
                  className="form-input text-sm w-full py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  value={newInvoiceDate}
                  onChange={(e) => setNewInvoiceDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowMergeModal(false)}
                disabled={merging}
              >
                Batal
              </button>
              <button
                className="btn btn-primary btn-sm bg-purple-600 hover:bg-purple-700 border-none flex items-center gap-1.5"
                onClick={handleMerge}
                disabled={merging || !newInvoiceNo}
              >
                {merging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menggabungkan...
                  </>
                ) : (
                  "Ya, Gabungkan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(n);
}
