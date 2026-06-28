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
import type { Invoice, Trip, CompanyProfile } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Helper to map Firestore REST API fields to standard JS objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRestFields(doc: any): any {
  const fields = doc.fields || {};
  const result: any = {};
  if (doc && doc.name) {
    result.id = doc.name.split("/").pop();
  }
  for (const [key, val] of Object.entries(fields)) {
    const valueObj: any = val;
    if ("stringValue" in valueObj) result[key] = valueObj.stringValue;
    else if ("integerValue" in valueObj) result[key] = parseInt(valueObj.integerValue, 10);
    else if ("doubleValue" in valueObj) result[key] = parseFloat(valueObj.doubleValue);
    else if ("booleanValue" in valueObj) result[key] = valueObj.booleanValue;
    else if ("arrayValue" in valueObj) {
      result[key] = (valueObj.arrayValue.values || []).map((v: any) => {
        if ("mapValue" in v) return mapRestFields(v.mapValue);
        if ("stringValue" in v) return v.stringValue;
        if ("integerValue" in v) return parseInt(v.integerValue, 10);
        if ("doubleValue" in v) return parseFloat(v.doubleValue);
        if ("booleanValue" in v) return v.booleanValue;
        return v;
      });
    } else if ("mapValue" in valueObj) {
      result[key] = mapRestFields(valueObj.mapValue);
    } else if ("timestampValue" in valueObj) {
      result[key] = valueObj.timestampValue;
    } else {
      result[key] = valueObj;
    }
  }
  return result;
}

// REST API fetch helpers using User's ID token
async function fetchRestDoc(collectionName: string, docId: string, token: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${docId}`;

  console.log(`[fetchRestDoc] Fetching ${collectionName}/${docId}`);
  console.log(`[fetchRestDoc] URL: ${url}`);
  console.log(`[fetchRestDoc] Project ID: ${projectId}`);
  console.log(`[fetchRestDoc] Token: ${token ? `${token.substring(0, 15)}...${token.substring(token.length - 15)}` : "missing"}`);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    let errorDetails = "";
    try {
      errorDetails = await res.text();
    } catch (e) {
      errorDetails = `Failed to parse error response: ${e}`;
    }
    console.error(`[fetchRestDoc] Failed to fetch doc. Status: ${res.status} ${res.statusText}. Details:`, errorDetails);
    throw new Error(`Failed to fetch doc ${docId} from ${collectionName}: ${res.statusText} (${res.status}). Details: ${errorDetails}`);
  }
  const data = await res.json();
  return mapRestFields(data);
}

async function queryRestDocs(collectionName: string, filterField: string, filterValue: string, token: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collectionName }],
        where: {
          fieldFilter: {
            field: { fieldPath: filterField },
            op: "EQUAL",
            value: { stringValue: filterValue },
          },
        },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Query failed on ${collectionName}: ${res.statusText}`);
  }
  const data = await res.json();
  return data
    .filter((item: any) => item.document)
    .map((item: any) => mapRestFields(item.document));
}

// POST: Generate PDF and upload to Cloudinary (used during invoice generation)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      invoice: Invoice;
      trips: Trip[];
      company: CompanyProfile;
      isCombined?: boolean;
      combinedInvoices?: Invoice[];
      combinedTrips?: Trip[][];
    };

    const { invoice, trips, company, isCombined, combinedInvoices, combinedTrips } = body;

    // Generate PDF buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(
      createElement(InvoicePdfDocument, { invoice, trips, company, isCombined, combinedInvoices, combinedTrips }) as any
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

    // Get Auth Token from cookies
    const token = req.cookies.get("firebase-auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing auth token" }, { status: 401 });
    }

    // Fetch invoice details using REST API with authentication
    const invoice = await fetchRestDoc("invoices", id, token) as any;

    const isCombined = !!invoice.isCombined;
    const combinedInvoices: Invoice[] = [];
    const combinedTrips: Trip[][] = [];
    const trips: Trip[] = [];

    if (isCombined && invoice.combinedInvoiceIds) {
      for (const cid of invoice.combinedInvoiceIds) {
        const subInv = await fetchRestDoc("invoices", cid, token) as Invoice;
        combinedInvoices.push(subInv);

        // Fetch sub-invoice items
        const subItems = await queryRestDocs("invoiceItems", "invoiceId", cid, token);
        const subTripIds = subItems.map((item: any) => item.tripId).filter(Boolean);
        const subTrips: Trip[] = [];
        if (subTripIds.length > 0) {
          const tripPromises = subTripIds.map((tid: string) =>
            fetchRestDoc("trips", tid, token).catch(() => null)
          );
          const tripDocs = await Promise.all(tripPromises);
          subTrips.push(...(tripDocs.filter(Boolean) as Trip[]));
          subTrips.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
        }
        combinedTrips.push(subTrips);
      }
    } else {
      // Fetch related invoiceItems for single invoice
      const invoiceItems = await queryRestDocs("invoiceItems", "invoiceId", id, token);
      const tripIds = invoiceItems.map((item: any) => item.tripId).filter(Boolean);

      // Fetch trips details
      if (tripIds.length > 0) {
        const tripPromises = tripIds.map((tid: string) =>
          fetchRestDoc("trips", tid, token).catch((e) => {
            console.error(`Error loading trip ${tid}:`, e);
            return null;
          })
        );
        const tripDocs = await Promise.all(tripPromises);
        trips.push(...(tripDocs.filter(Boolean) as Trip[]));
        // Sort trips by date ascending
        trips.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
      }
    }

    // Fetch company profile
    let company: CompanyProfile;
    try {
      company = await fetchRestDoc("companyProfile", "default", token) as CompanyProfile;
    } catch {
      company = {
        nama: "H. SUPANDI",
        alamat: "Kp. Tunggilis RT 002/007, Desa Situsari, Kec. Cileungsi, Kab. Bogor",
        noHp: "085882389089",
        bank: "BCA",
        rekening: "4060297636",
        atasNama: "H. SUPANDI",
      };
    }

    // Render PDF buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(
      createElement(InvoicePdfDocument, {
        invoice,
        trips,
        company,
        plantId,
        isCombined,
        combinedInvoices: isCombined ? combinedInvoices : undefined,
        combinedTrips: isCombined ? combinedTrips : undefined
      }) as any
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
