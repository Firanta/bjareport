// =============================================================
// BJA Report — /api/pdf API Route
// =============================================================
// Generates a PDF invoice. Supports:
// - POST: Generates PDF and uploads to Cloudinary (legacy support).
// - GET: Dynamically fetches from Firestore and streams PDF.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { InvoicePdfDocument } from "@/components/invoices/InvoicePdfDocument";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getFirebaseDb } from "@/lib/firebase/config";
import { getDoc, doc } from "firebase/firestore";
import { getTripsForInvoice, getCompanyProfile } from "@/lib/firebase/firestore";
import type { Invoice, Trip, CompanyProfile } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST: Generate PDF and upload to Cloudinary (used during invoice generation)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      invoice: Invoice;
      trips: Trip[];
      company: CompanyProfile;
    };

    const { invoice, trips, company } = body;

    // Generate PDF buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(
      createElement(InvoicePdfDocument, { invoice, trips, company }) as any
    );

    // Upload to Cloudinary
    const { url: pdfUrl } = await uploadToCloudinary(
      Buffer.from(buffer),
      "bjareport/invoices",
      {
        resourceType: "image",
        format: "pdf",
        publicId: invoice.nomorInvoice.replace(/[^a-zA-Z0-9-_]/g, "_"),
      }
    );

    return NextResponse.json({ pdfUrl });
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: err.message ?? "PDF generation failed" },
      { status: 500 }
    );
  }
}

// GET: Dynamically fetch invoice details from Firestore and stream generated PDF directly
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const plantId = searchParams.get("plantId") || undefined;
    const download = searchParams.get("download") === "true";

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const db = getFirebaseDb();
    const invoiceSnap = await getDoc(doc(db, "invoices", id));
    if (!invoiceSnap.exists()) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoice = { id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice;
    const trips = await getTripsForInvoice(id);
    const company = await getCompanyProfile() || {
      nama: "H. SUPANDI",
      alamat: "Kp. Tunggilis RT 002/007, Desa Situsari, Kec. Cileungsi, Kab. Bogor",
      noHp: "085882389089",
      bank: "BCA",
      rekening: "4060297636",
      atasNama: "H. SUPANDI",
    };

    // Render PDF buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(
      createElement(InvoicePdfDocument, { invoice, trips, company, plantId }) as any
    );

    // Determine filename
    let filename = invoice.nomorInvoice;
    if (plantId && invoice.subtotalPlant[plantId]) {
      const plantNameClean = invoice.subtotalPlant[plantId].plantNama.replace(/[^a-zA-Z0-9-_]/g, "_");
      filename = `${invoice.nomorInvoice}_${plantNameClean}`;
    }
    filename = `${filename}.pdf`;

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("Local PDF stream error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to stream PDF" },
      { status: 500 }
    );
  }
}
