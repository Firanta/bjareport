async function main() {
  const url = "https://firestore.googleapis.com/v1/projects/bjainvoice/databases/(default)/documents/invoices?pageSize=300";
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.documents) {
      console.log("No invoices found");
      return;
    }
    const summary = data.documents.map(doc => {
      const fields = doc.fields || {};
      const id = doc.name.split('/').pop();
      const nomorInvoice = fields.nomorInvoice?.stringValue || "";
      const grandTotal = fields.grandTotal?.doubleValue || fields.grandTotal?.integerValue || 0;
      const subtotalPlant = fields.subtotalPlant?.mapValue?.fields || {};
      const plants = Object.keys(subtotalPlant);
      const startDate = fields.startDate?.stringValue || "";
      const endDate = fields.endDate?.stringValue || "";
      return { id, nomorInvoice, grandTotal, plants, startDate, endDate };
    });
    console.table(summary);
  } catch (err) {
    console.error(err);
  }
}
main();
