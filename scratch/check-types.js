async function main() {
  const url = "https://firestore.googleapis.com/v1/projects/bjainvoice/databases/(default)/documents/trips?pageSize=300";
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.documents) {
      console.log("No documents found");
      return;
    }
    console.log(`Checking ${data.documents.length} trips...`);
    data.documents.forEach(doc => {
      const fields = doc.fields || {};
      const noSuratJalan = fields.noSuratJalan?.stringValue || "";
      const tonasePlanField = fields.tonasePlan;
      if (tonasePlanField) {
        const type = Object.keys(tonasePlanField)[0];
        const val = tonasePlanField[type];
        console.log(`SJ: ${noSuratJalan}, type: ${type}, val: ${JSON.stringify(val)}`);
      } else {
        console.log(`SJ: ${noSuratJalan}, field tonasePlan is MISSING`);
      }
    });
  } catch (err) {
    console.error(err);
  }
}
main();
