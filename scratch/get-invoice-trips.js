async function main() {
  const url = "https://firestore.googleapis.com/v1/projects/bjainvoice/databases/(default)/documents/invoiceItems?pageSize=300";
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.documents) {
      console.log("No invoiceItems found");
      return;
    }
    const matching = data.documents.filter(doc => {
      const fields = doc.fields || {};
      return fields.invoiceId?.stringValue === "eIzjjeZ3U1Ds0qoBJAMt";
    });
    console.log(`Found ${matching.length} items for INV-2026-06-001:`);
    const tripIds = matching.map(m => m.fields.tripId?.stringValue);
    console.log("Trip IDs:", tripIds);

    // Fetch details for each trip
    const trips = [];
    for (const tid of tripIds) {
      const tr = await fetch(`https://firestore.googleapis.com/v1/projects/bjainvoice/databases/(default)/documents/trips/${tid}`);
      const tdata = await tr.json();
      const fields = tdata.fields || {};
      trips.push({
        id: tid,
        noSuratJalan: fields.noSuratJalan?.stringValue,
        tanggal: fields.tanggal?.stringValue,
        tonasePlan: fields.tonasePlan?.doubleValue || fields.tonasePlan?.integerValue || 0,
      });
    }
    console.table(trips);
  } catch (err) {
    console.error(err);
  }
}
main();
