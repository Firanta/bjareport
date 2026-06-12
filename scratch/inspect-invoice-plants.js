async function main() {
  const url = "https://firestore.googleapis.com/v1/projects/bjainvoice/databases/(default)/documents/invoices/eIzjjeZ3U1Ds0qoBJAMt";
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data.fields.subtotalPlant, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
