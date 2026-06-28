// =============================================================
// BJA Report — TypeScript Types
// =============================================================

import { Timestamp } from "firebase/firestore";

// ---- Auth ----
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// ---- Plants ----
export interface PlantItem {
  id: string;
  nama: string;
  hargaPerM3: number;
}

export interface Plant {
  id: string;
  nama: string;
  hargaPerM3?: number; // Deprecated, keep for backward compatibility
  items?: PlantItem[]; // Array of items and their prices
  createdAt: Timestamp;
}

// ---- Vehicles ----
export interface Vehicle {
  id: string;
  nomorPolisi: string;
  createdAt: Timestamp;
}

// ---- Trips ----
export interface Trip {
  id: string;
  tanggal: string;           // "YYYY-MM-DD"
  noPolisi: string;
  noSuratJalan: string;
  plantId: string;
  plantNama: string;
  jenisBarang: string;       // default: "Split"
  kubikasi: number;
  tonaseKuari?: number;          // optional — 0 or undefined shows "-" in invoice
  tonasePlan?: number;           // optional — 0 or undefined shows "-" in invoice
  fotoSuratJalan: string;    // Cloudinary URL
  createdAt: Timestamp;
}

export type TripFormData = Omit<Trip, "id" | "createdAt" | "fotoSuratJalan">;

// ---- Additional Costs ----
export interface AdditionalCost {
  id: string;
  nama: string;
  nominal: number;
}

// ---- Invoices ----
export interface SubtotalPerPlant {
  [key: string]: { // key: plantId_jenisBarang
    plantNama: string;
    jenisBarang: string;
    totalKubikasi: number;
    hargaPerM3: number;
    subtotal: number;
  };
}

export interface Invoice {
  id: string;
  nomorInvoice: string;      // "INV-YYYY-MM-001"
  bulan: number;             // 1–12
  tahun: number;
  startDate: string;         // "YYYY-MM-DD"
  endDate: string;           // "YYYY-MM-DD"
  invoiceDate: string;       // "YYYY-MM-DD"
  totalKubikasi: number;
  subtotalPlant: SubtotalPerPlant;
  biayaTambahan: number;
  biayaTambahanDetail?: { nama: string; nominal: number }[];
  grandTotal: number;
  pdfUrl: string;            // Cloudinary URL
  isCombined?: boolean;
  combinedInvoiceIds?: string[];
  createdAt: Timestamp;
}

// ---- Invoice Items ----
export interface InvoiceItem {
  id: string;
  invoiceId: string;
  tripId: string;
}

// ---- Company Profile ----
export interface CompanyProfile {
  nama: string;
  alamat: string;
  noHp: string;
  bank: string;
  rekening: string;
  atasNama: string;
}

// ---- OCR ----
export interface OcrFieldResult {
  value: string | number | null;
  confidence: number; // 0–100
}

export interface OcrResult {
  noSuratJalan: OcrFieldResult;
  noPolisi: OcrFieldResult;
  kubikasi: OcrFieldResult;       // VOL.DITERIMA / VOL.TERIMA
  tonasePlan: OcrFieldResult;     // TIMBANGAN NET
  tonaseKuari: OcrFieldResult;    // NETTO / BERAT NETTO
  tanggal: OcrFieldResult;
  overallConfidence: number;
  rawText: string;
  imageUrl: string;
}

export type OcrReviewItem = {
  tempId: string;               // client-side uuid
  imageUrl: string;
  ocrResult: OcrResult;
  // Editable fields (initialized from OCR result)
  noSuratJalan: string;
  noPolisi: string;
  kubikasi: number | null;
  tonaseKuari: number | null;
  tanggal: string;
  plantId: string;
  plantNama: string;
  tonasePlan: number | null;
  jenisBarang: string;
  needsVerification: boolean;   // confidence < 80%
  status: "pending" | "saved" | "error";
};

// ---- Dashboard Stats ----
export interface DashboardStats {
  totalTripsThisMonth: number;
  totalKubikasiThisMonth: number;
  totalPendapatanThisMonth: number;
  totalInvoicesThisMonth: number;
}

// ---- Chart Data ----
export interface ChartDataItem {
  plant: string;
  trips: number;
  pendapatan: number;
  kubikasi: number;
}
