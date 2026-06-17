async function checkInvoice(invoiceId) {
  const url = `https://firestore.googleapis.com/v1/projects/bjainvoice/databases/(default)/documents/invoiceItems?pageSize=300`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.documents) {
      console.log("No invoiceItems found");
      return;
    }
    const matching = data.documents.filter(doc => {
      const fields = doc.fields || {};
      return fields.invoiceId?.stringValue === invoiceId;
    });
    console.log(`Invoice ${invoiceId} has ${matching.length} items`);
  } catch (err) {
    console.error(err);
  }
}

async function main() {
  await checkInvoice("L1pTWpNvtDnIvV6mmun9");
  await checkInvoice("FDJDwjNl6FY514aLErCJ");
}
main();
