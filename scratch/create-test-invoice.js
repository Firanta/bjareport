const projectId = "bjainvoice";

// Helper to write to Firestore REST API
async function postFirestore(collection, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}`;
  const fields = {};
  
  // Simple converter to Firestore REST format
  for (const [key, val] of Object.entries(data)) {
    if (val === null) {
      fields[key] = { nullValue: null };
    } else if (typeof val === "number") {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: val.toString() };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === "string") {
      fields[key] = { stringValue: val };
    } else if (typeof val === "object") {
      // assume it's already in firestore format or map
      fields[key] = val;
    }
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  const resData = await res.json();
  if (resData.error) {
    throw new Error(JSON.stringify(resData.error));
  }
  return resData.name.split("/").pop();
}

async function main() {
  try {
    console.log("Creating test invoice...");
    const invoiceId = await postFirestore("invoices", {
      nomorInvoice: "INV-TEST-001",
      bulan: 6,
      tahun: 2026,
      startDate: "2026-06-01",
      endDate: "2026-06-10",
      invoiceDate: "2026-06-11",
      totalKubikasi: 18.73,
      grandTotal: 1498400, // 18.73 * 80000
      biayaTambahan: 0,
      pdfUrl: "",
      subtotalPlant: {
        mapValue: {
          fields: {
            "39btcDTDttyW9YEiABjH_Split": {
              mapValue: {
                fields: {
                  plantNama: { stringValue: "Plant Readymix Cibubur" },
                  jenisBarang: { stringValue: "Split" },
                  totalKubikasi: { doubleValue: 18.73 },
                  hargaPerM3: { integerValue: "80000" },
                  subtotal: { integerValue: "1498400" }
                }
              }
            }
          }
        }
      }
    });

    console.log(`Invoice created successfully with ID: ${invoiceId}`);
    
    console.log("Linking trip 37887 (ur2OHxdpfoJ1tRqyLARZ) to invoice...");
    await postFirestore("invoiceItems", {
      invoiceId: invoiceId,
      tripId: "ur2OHxdpfoJ1tRqyLARZ"
    });

    console.log("Successfully linked!");
    console.log(`Open in browser: http://localhost:3000/api/pdf?id=${invoiceId}`);
  } catch (err) {
    console.error("Error creating test invoice:", err);
  }
}

main();
