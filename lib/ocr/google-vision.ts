// =============================================================
// BJA Report — Google Vision / Gemini OCR Service
// =============================================================

import type { OcrResult } from "@/types";
import { parseOcrText } from "./parser";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/**
 * Run Gemini Multimodal OCR on an image URL.
 * Returns structured OcrResult with confidence scores.
 */
export async function runGoogleVisionOcr(
  base64Image: string,
  imageUrl: string
): Promise<OcrResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_VISION_API_KEY is not set");
  }

  // Determine MIME type
  let mimeType = "image/jpeg";
  if (imageUrl.toLowerCase().endsWith(".png")) mimeType = "image/png";
  else if (imageUrl.toLowerCase().endsWith(".webp")) mimeType = "image/webp";

  const prompt = `Anda adalah OCR engine khusus surat jalan logistik Indonesia.
Tugas Anda adalah membaca gambar surat jalan ini dan mengekstrak informasi berikut secara akurat.

PETUNJUK PENTING untuk setiap field:
- No Surat Jalan: nomor surat jalan (biasanya berupa angka 4-6 digit, contoh: 37885)
- No Polisi: plat nomor kendaraan (contoh: B 9437 JEU)
- VOL DITERIMA: nilai pada baris berlabel "VOL.TERIMA", "VOL.DITERIMA", atau "VOLUME DITERIMA" — ini adalah kubikasi dalam m³ (contoh: 16.830 m3)
- TIMBANGAN NET: nilai pada baris berlabel "TIMBANGAN NET" atau "TIMBANG NET" — ini berat dalam kg (contoh: 22650 kg)
- NETTO: nilai pada baris berlabel "NETTO" atau "BERAT NETTO" dari slip timbangan — ini berat dalam kg (contoh: 8910 kg)
- Tanggal: tanggal pengiriman dalam format DD/MM/YYYY

Tulis hasil dalam format tepat seperti ini (isi "—" jika tidak ditemukan):

No Surat Jalan: [nomor]
No Polisi: [plat nomor]
VOL Diterima: [angka] m3
Timbangan Net: [angka] kg
Netto: [angka] kg
Tanggal: [DD/MM/YYYY]`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  return parseOcrText(text, imageUrl);
}
