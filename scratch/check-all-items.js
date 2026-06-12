async function main() {
  const url = "https://firestore.googleapis.com/v1/projects/bjainvoice/databases/(default)/documents/invoiceItems?pageSize=300";
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.documents) {
      console.log("No invoiceItems found");
      return;
    }
    console.log(`Total invoiceItems: ${data.documents.length}`);
    data.documents.forEach(doc => {
      const fields = doc.fields || {};
      const id = doc.name.split('/').pop();
      console.log(`Item ID: ${id}, tripId: ${fields.tripId?.stringValue}, invoiceId: ${fields.invoiceId?.stringValue}`);
    });
  } catch (err) {
    console.error(err);
  }
}
main();
