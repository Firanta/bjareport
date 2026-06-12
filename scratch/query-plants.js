async function main() {
  const url = "https://firestore.googleapis.com/v1/projects/bjainvoice/databases/(default)/documents/plants?pageSize=100";
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.documents) {
      console.log("No plants found");
      return;
    }
    data.documents.forEach(doc => {
      const fields = doc.fields || {};
      const name = fields.nama?.stringValue || "";
      const itemsField = fields.items || {};
      console.log(`Plant: ${name}`);
      if (itemsField.arrayValue && itemsField.arrayValue.values) {
        itemsField.arrayValue.values.forEach(item => {
          const itemFields = item.mapValue?.fields || {};
          console.log(` - Item: ${itemFields.nama?.stringValue}, Harga: ${itemFields.hargaPerM3?.integerValue || itemFields.hargaPerM3?.doubleValue}`);
        });
      }
    });
  } catch (err) {
    console.error(err);
  }
}
main();
