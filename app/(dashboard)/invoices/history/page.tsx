
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
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function InvoiceHistoryPage() {
  const { grouped, invoices, loading, removeInvoice } = useInvoices();
  const [expandedYears, setExpandedYears] = useState<Set<number>>(
    new Set([new Date().getFullYear()])
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

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
                              <div>
                                <div className="flex items-center gap-2">
                                  <FileText
                                    className="w-4 h-4"
                                    style={{ color: "var(--brand-500)" }}
                                  />
                                  <span
                                    className="font-mono text-sm font-semibold"
                                    style={{ color: "rgba(255,255,255,0.85)" }}
                                  >
                                    {inv.nomorInvoice}
                                  </span>
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
    </div>
  );
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(n);
}
