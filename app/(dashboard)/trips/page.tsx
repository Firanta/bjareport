
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  FilePlus,
  Camera,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useTrips } from "@/hooks/useTrips";
import { usePlants } from "@/hooks/usePlants";
import { useVehicles } from "@/hooks/useVehicles";
import type { Trip } from "@/types";
import { formatDate, formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

export default function TripsPage() {
  const { trips, loading, error, removeTrip } = useTrips();
  const { plants } = usePlants();
  const { vehicles } = useVehicles();

  const [search, setSearch] = useState("");
  const [filterPlant, setFilterPlant] = useState("");
  const [filterVehicle, setFilterVehicle] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "tanggal", desc: true },
  ]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filtered data
  const filteredData = useMemo(() => {
    return trips.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.noSuratJalan.toLowerCase().includes(q) ||
        t.noPolisi.toLowerCase().includes(q) ||
        t.plantNama.toLowerCase().includes(q);
      const matchPlant = !filterPlant || t.plantId === filterPlant;
      const matchVehicle = !filterVehicle || t.noPolisi === filterVehicle;
      const matchFrom = !filterDateFrom || t.tanggal >= filterDateFrom;
      const matchTo = !filterDateTo || t.tanggal <= filterDateTo;
      return matchSearch && matchPlant && matchVehicle && matchFrom && matchTo;
    });
  }, [trips, search, filterPlant, filterVehicle, filterDateFrom, filterDateTo]);

  const columns = useMemo<ColumnDef<Trip>[]>(
    () => [
      {
        accessorKey: "tanggal",
        header: "Tanggal",
        cell: ({ getValue }) => formatDate(getValue() as string),
      },
      {
        accessorKey: "noPolisi",
        header: "No Polisi",
        cell: ({ getValue }) => (
          <span className="badge badge-info">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "noSuratJalan",
        header: "No Surat Jalan",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "plantNama",
        header: "Plant",
        cell: ({ getValue }) => (
          <span className="badge badge-gray">
            {(getValue() as string).replace("Plant ", "")}
          </span>
        ),
      },
      {
        accessorKey: "kubikasi",
        header: "Kubikasi (m³)",
        cell: ({ getValue }) => (
          <span className="font-semibold">{formatNumber(getValue() as number)}</span>
        ),
      },
      {
        accessorKey: "tonaseKuari",
        header: "T. Kuari",
        cell: ({ getValue }) => {
          const val = getValue() as number | undefined | null;
          return val !== null && val !== undefined && val !== 0 ? `${val} t` : "—";
        },
      },
      {
        accessorKey: "tonasePlan",
        header: "T. Plan",
        cell: ({ getValue }) => {
          const val = getValue() as number | undefined | null;
          return val !== null && val !== undefined && val !== 0 ? `${val} t` : "—";
        },
      },
      {
        id: "aksi",
        header: "Aksi",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {row.original.fotoSuratJalan ? (
              <a
                href={row.original.fotoSuratJalan}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/8 transition-colors"
                title="Lihat Foto"
              >
                <Eye className="w-4 h-4" />
              </a>
            ) : (
              <div className="w-8 h-8" />
            )}
            <Link
              href={`/trips/${row.original.id}`}
              className="w-8 h-8 flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/8 transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </Link>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-md text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Hapus"
              onClick={() => setDeleteId(row.original.id)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await removeTrip(deleteId);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>
            Data Trip
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            {filteredData.length} dari {trips.length} trip
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/trips/upload" className="btn btn-secondary btn-sm">
            <Camera className="w-4 h-4" />
            Upload OCR
          </Link>
          <Link href="/trips/new" className="btn btn-primary btn-sm">
            <FilePlus className="w-4 h-4" />
            Input Manual
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--gray-400)" }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: "36px" }}
              placeholder="Cari No SJ, No Polisi, Plant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Plant */}
          <select
            className="form-input"
            value={filterPlant}
            onChange={(e) => setFilterPlant(e.target.value)}
          >
            <option value="">Semua Plant</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>

          {/* Filter Kendaraan */}
          <select
            className="form-input"
            value={filterVehicle}
            onChange={(e) => setFilterVehicle(e.target.value)}
          >
            <option value="">Semua Kendaraan</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.nomorPolisi}>
                {v.nomorPolisi}
              </option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex gap-1">
            <input
              type="date"
              className="form-input"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              title="Dari tanggal"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--brand-500)" }} />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-16" style={{ color: "var(--danger)" }}>
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => {
                        const isAction = header.column.id === "aksi";
                        return (
                          <th
                            key={header.id}
                            onClick={header.column.getToggleSortingHandler()}
                            style={{
                              cursor: header.column.getCanSort()
                                ? "pointer"
                                : "default",
                              textAlign: isAction ? "right" : "left",
                            }}
                          >
                            <div className={`flex items-center gap-1 ${isAction ? "justify-end w-full" : ""}`}>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.getIsSorted() === "asc" ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : null}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="text-center py-12"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        Tidak ada data trip.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => {
                          const isAction = cell.column.id === "aksi";
                          return (
                            <td key={cell.id} className={isAction ? "text-right" : ""}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div
              className="flex items-center justify-between px-5 py-3 border-t"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
                {table.getPageCount()}
              </span>
              <div className="flex items-center gap-1">
                <button
                  className="btn-icon"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="card p-6 w-full max-w-sm" style={{ boxShadow: "var(--shadow-modal)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#fee2e2" }}>
                <Trash2 className="w-5 h-5" style={{ color: "var(--danger)" }} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>Hapus Trip?</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-secondary btn-sm" onClick={() => setDeleteId(null)} disabled={deleting}>
                Batal
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
