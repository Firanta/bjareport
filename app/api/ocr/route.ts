// =============================================================
// BJA Report — /api/ocr API Route
// =============================================================
// Accepts multipart form data with image files.
// Uploads to Cloudinary, then runs Google Vision OCR.
// Returns array of OcrResult.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { runGoogleVisionOcr } from "@/lib/ocr/google-vision";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      files.map(async (file) => {
        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary
        const { url: imageUrl } = await uploadToCloudinary(
          buffer,
          "bjareport/surat-jalan",
          { resourceType: "image" }
        );

        // Generate base64 directly from buffer
        const base64Image = buffer.toString("base64");

        // Run OCR
        const ocrResult = await runGoogleVisionOcr(base64Image, imageUrl);
        return ocrResult;
      })
    );

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("OCR Error:", err);
    return NextResponse.json(
      { error: err.message ?? "OCR processing failed" },
      { status: 500 }
    );
  }
}
