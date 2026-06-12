
const fs = require('fs');

async function main() {
  const url = "https://firestore.googleapis.com/v1/projects/bjainvoice/databases/(default)/documents/trips?pageSize=300";
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.documents) {
      console.log("No documents found or error:", data);
      return;
    }
    console.log(`Total documents fetched: ${data.documents.length}`);
    const summary = data.documents.map(doc => {
      const fields = doc.fields || {};
      const id = doc.name.split('/').pop();
      const noSuratJalan = fields.noSuratJalan?.stringValue || "";
      const tanggal = fields.tanggal?.stringValue || "";
      const tonasePlanField = fields.tonasePlan || {};
      const tonasePlan = tonasePlanField.doubleValue !== undefined 
        ? parseFloat(tonasePlanField.doubleValue) 
        : (tonasePlanField.integerValue !== undefined 
          ? parseInt(tonasePlanField.integerValue) 
          : (tonasePlanField.nullValue !== undefined ? null : undefined));
      const kubikasi = fields.kubikasi?.doubleValue || fields.kubikasi?.integerValue || 0;
      return { id, noSuratJalan, tanggal, tonasePlan, kubikasi };
    });

    console.log("Trips summary (first 50):");
    console.table(summary.slice(0, 50));

    console.log("\nTrips where tonasePlan is empty, 0, or null:");
    const emptyPlan = summary.filter(s => s.tonasePlan === 0 || s.tonasePlan === null || s.tonasePlan === undefined);
    console.table(emptyPlan);

  } catch (err) {
    console.error(err);
  }
}

main();
