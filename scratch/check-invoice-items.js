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
      return fields.tripId?.stringValue === "ur2OHxdpfoJ1tRqyLARZ";
    });
    console.log(`Found ${matching.length} invoiceItems matching trip ID:`);
    console.log(JSON.stringify(matching, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
