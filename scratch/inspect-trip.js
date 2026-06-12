async function main() {
  const url = "https://firestore.googleapis.com/v1/projects/bjainvoice/databases/(default)/documents/trips/ur2OHxdpfoJ1tRqyLARZ";
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
