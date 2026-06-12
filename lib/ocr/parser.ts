// =============================================================
// BJA Report — OCR Text Parser
// =============================================================
// Extracts structured data from raw OCR text with confidence scores.
//
// Field mapping from surat jalan document:
//   VOL.TERIMA / VOL.DITERIMA  → kubikasi   (m³)
//   TIMBANGAN NET               → tonasePlan (kg → ton)
//   NETTO / BERAT NETTO         → tonaseKuari (kg → ton)
// =============================================================

import type { OcrFieldResult, OcrResult } from "@/types";

// ---- Confidence scoring helpers ----
function scoreField(value: string | number | null, pattern?: RegExp): number {
  if (value === null || value === undefined) return 0;
  const str = String(value).trim();
  if (!str) return 0;
  if (pattern && !pattern.test(str)) return 40;
  return 100;
}

// Helper: parse a number string like "16.830", "22,650.0", "8910" → number
function parseNum(raw: string): number {
  // Remove thousand separators (dot or comma before 3 digits), keep decimal
  // Handles: "16.830" (ID format, dot=thousand) → 16830? No — in this doc "16.830" means 16.830 m³
  // Handles: "22,650.0" (US format) → 22650.0
  // Handles: "8,910" → 8910
  const clean = raw
    .replace(/\s/g, "")
    // If there's a comma followed by digits (US thousands or decimal):
    .replace(/,(\d{3})(?!\d)/g, "$1") // "22,650" → "22650", "8,910" → "8910"
    .replace(/,(\d{1,2})$/, ".$1");   // "16,83" → "16.83"
  return parseFloat(clean);
}

// ---- Parsers per field ----

function extractNoSuratJalan(text: string): OcrFieldResult {
  const patterns = [
    /no\.?\s*surat\s*jalan\s*[:\-]?\s*(\d{4,8})/i,
    /nomor\s*surat\s*jalan\s*[:\-]?\s*(\d{4,8})/i,
    /no\s*sj\s*[:\-]?\s*(\d{4,8})/i,
    /surat\s*jalan\s*[:\-]?\s*#?\s*(\d{4,8})/i,
    // "SURAT JALAN\n37885" style
    /surat\s*jalan\s*\n\s*(\d{4,8})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return { value: match[1].trim(), confidence: 95 };
    }
  }
  // Fallback: standalone 5-6 digit number
  const fallback = text.match(/\b(\d{5,6})\b/);
  if (fallback) {
    return { value: fallback[1], confidence: 50 };
  }
  return { value: null, confidence: 0 };
}

function extractNoPolisi(text: string): OcrFieldResult {
  const patterns = [
    /no\.?\s*polisi\s*[:\-]?\s*([A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{2,3})/i,
    /nopol\s*[:\-]?\s*([A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{2,3})/i,
    /no\.?\s*polisi\s*[:\-]?\s*([A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{2,3})/i,
    /kendaraan\s*[:\-]?\s*([A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{2,3})/i,
    /plat\s*[:\-]?\s*([A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{2,3})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const cleaned = match[1].toUpperCase().replace(/\s+/g, " ").trim();
      return { value: cleaned, confidence: 90 };
    }
  }
  // Fallback: license plate pattern anywhere in text
  const platePattern = /\b([A-Z]{1,2})\s*(\d{1,4})\s*([A-Z]{2,3})\b/gi;
  const plateMatch = platePattern.exec(text);
  if (plateMatch) {
    const cleaned = `${plateMatch[1].toUpperCase()} ${plateMatch[2]} ${plateMatch[3].toUpperCase()}`;
    return { value: cleaned, confidence: 65 };
  }
  return { value: null, confidence: 0 };
}

// Kubikasi = VOL.TERIMA / VOL.DITERIMA (m³)
function extractKubikasi(text: string): OcrFieldResult {
  const patterns = [
    // From Gemini structured output: "VOL Diterima: 16.830 m3"
    /vol\.?\s*diterima\s*[:\-]?\s*([\d.,]+)\s*m3?/i,
    /vol\.?\s*terima\s*[:\-]?\s*([\d.,]+)\s*m3?/i,
    /volume\s*diterima\s*[:\-]?\s*([\d.,]+)\s*m3?/i,
    // Generic m3 with label nearby
    /vol\s*[:\-]?\s*([\d.,]+)\s*m3?/i,
    // Old patterns (fallback)
    /kubikasi\s*[:\-]?\s*([\d.,]+)\s*m3?/i,
    /volume\s*[:\-]?\s*([\d.,]+)\s*m3?/i,
    /([\d]{1,3}[.,]\d{3})\s*m3?/i,  // "16.830 m3" pattern
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseNum(match[1]);
      if (!isNaN(num) && num > 0 && num < 200) {
        return { value: Math.round(num * 1000) / 1000, confidence: 90 };
      }
    }
  }
  return { value: null, confidence: 0 };
}

// Tonase Plan = TIMBANGAN NET (kg → ton)
function extractTonasePlan(text: string): OcrFieldResult {
  const patterns = [
    // From Gemini structured output: "Timbangan Net: 22650 kg"
    /timbangan\s*net\s*[:\-]?\s*([\d.,]+)\s*kg/i,
    /timbang\s*net\s*[:\-]?\s*([\d.,]+)\s*kg/i,
    /timbangan\s*bersih\s*[:\-]?\s*([\d.,]+)\s*kg/i,
    // Fallback: any "net" near weight
    /net\s*[:\-]?\s*([\d.,]+)\s*kg/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const numKg = parseNum(match[1]);
      if (!isNaN(numKg) && numKg > 0) {
        // Convert kg → ton
        const ton = numKg > 500 ? numKg / 1000 : numKg;
        return { value: Math.round(ton * 100) / 100, confidence: 88 };
      }
    }
  }
  return { value: null, confidence: 0 };
}

// Tonase Kuari = NETTO dari slip timbangan (kg → ton)
function extractTonaseKuari(text: string): OcrFieldResult {
  const patterns = [
    // From Gemini structured output: "Netto: 8910 kg"
    /^netto\s*[:\-]?\s*([\d.,]+)\s*kg/im,
    /berat\s*netto\s*[:\-]?\s*([\d.,]+)\s*kg/i,
    /netto\s*[:\-]?\s*([\d.,]+)\s*kg/i,
    // Old fallbacks
    /tonase\s*kuari\s*[:\-]?\s*([\d.,]+)/i,
    /berat\s*[:\-]?\s*([\d.,]+)\s*kg/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const numKg = parseNum(match[1]);
      if (!isNaN(numKg) && numKg > 0) {
        // Convert kg → ton
        const ton = numKg > 500 ? numKg / 1000 : numKg;
        return { value: Math.round(ton * 100) / 100, confidence: 88 };
      }
    }
  }
  return { value: null, confidence: 0 };
}

function extractTanggal(text: string): OcrFieldResult {
  const patterns = [
    // DD/MM/YYYY or DD-MM-YYYY with label
    /tanggal\s*[:\-]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
    /tgl\s*[:\-]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
    // Standalone date
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const day = String(match[1]).padStart(2, "0");
      const month = String(match[2]).padStart(2, "0");
      const year = match[3];
      const isoDate = `${year}-${month}-${day}`;
      const d = new Date(isoDate);
      if (!isNaN(d.getTime())) {
        return { value: isoDate, confidence: 85 };
      }
    }
  }
  return { value: null, confidence: 0 };
}

// ============================================================
// MAIN PARSER
// ============================================================
export function parseOcrText(rawText: string, imageUrl: string): OcrResult {
  const noSuratJalan = extractNoSuratJalan(rawText);
  const noPolisi = extractNoPolisi(rawText);
  const kubikasi = extractKubikasi(rawText);       // VOL.DITERIMA → m³
  const tonasePlan = extractTonasePlan(rawText);   // TIMBANGAN NET → ton  ← NEW
  const tonaseKuari = extractTonaseKuari(rawText); // NETTO → ton
  const tanggal = extractTanggal(rawText);

  const fields = [noSuratJalan, noPolisi, kubikasi, tonasePlan, tonaseKuari, tanggal];
  const overallConfidence =
    fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length;

  return {
    noSuratJalan,
    noPolisi,
    kubikasi,
    tonasePlan,   // ← NEW field
    tonaseKuari,
    tanggal,
    overallConfidence: Math.round(overallConfidence),
    rawText,
    imageUrl,
  };
}
