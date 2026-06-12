// =============================================================
// BJA Report — Utility Functions
// =============================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Number Formatting ----
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, decimals = 3): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

// ---- Date Formatting ----
export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd MMM yyyy", { locale: idLocale });
  } catch {
    return dateStr;
  }
}

export function formatMonthYear(bulan: number, tahun: number): string {
  const date = new Date(tahun, bulan - 1, 1);
  return format(date, "MMMM yyyy", { locale: idLocale });
}

export function getCurrentMonthYear(): { bulan: number; tahun: number } {
  const now = new Date();
  return { bulan: now.getMonth() + 1, tahun: now.getFullYear() };
}

// ---- Invoice Calculation ----
export function calculateInvoiceTotals(
  trips: { plantId: string; plantNama: string; jenisBarang: string; kubikasi: number }[],
  plants: { id: string; items?: { nama: string; hargaPerM3: number }[]; hargaPerM3?: number }[],
  additionalCosts: number
) {
  const plantMap = new Map(plants.map((p) => [p.id, p]));

  const subtotalPlant: Record<
    string,
    {
      plantNama: string;
      jenisBarang: string;
      totalKubikasi: number;
      hargaPerM3: number;
      subtotal: number;
    }
  > = {};

  for (const trip of trips) {
    // Normalize jenisBarang to lowercase for grouping key to avoid case-sensitivity splits
    const normalizedJenis = (trip.jenisBarang || "Split").trim().toLowerCase();
    const key = `${trip.plantId}_${normalizedJenis}`;
    if (!subtotalPlant[key]) {
      const plant = plantMap.get(trip.plantId);
      let harga = plant?.hargaPerM3 ?? 0;
      
      // Look up specific item price if plant has items
      if (plant && plant.items && plant.items.length > 0) {
        const matchedItem = plant.items.find(
          (i) => i.nama.toLowerCase() === normalizedJenis
        );
        if (matchedItem) {
          harga = matchedItem.hargaPerM3;
        }
      }

      // Display jenisBarang with title case for consistency (e.g. "Split" not "split")
      const displayJenis = (trip.jenisBarang || "Split").trim();
      const titleJenis = displayJenis.charAt(0).toUpperCase() + displayJenis.slice(1);

      subtotalPlant[key] = {
        plantNama: trip.plantNama,
        jenisBarang: titleJenis,
        totalKubikasi: 0,
        hargaPerM3: harga,
        subtotal: 0,
      };
    }
    subtotalPlant[key].totalKubikasi += trip.kubikasi;
  }

  for (const key of Object.keys(subtotalPlant)) {
    const item = subtotalPlant[key];
    item.subtotal = item.totalKubikasi * item.hargaPerM3;
  }

  const totalKubikasi = trips.reduce((acc, t) => acc + t.kubikasi, 0);
  const totalPlants = Object.values(subtotalPlant).reduce(
    (acc, p) => acc + p.subtotal,
    0
  );
  const grandTotal = totalPlants + additionalCosts;

  return { subtotalPlant, totalKubikasi, totalPlants, grandTotal };
}

// ---- Month/Year helpers ----
export const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function getMonthName(bulan: number): string {
  return MONTHS[bulan - 1] ?? "";
}
