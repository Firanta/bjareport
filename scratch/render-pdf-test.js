const React = require("react");
const { createElement } = require("react");
const { renderToBuffer } = require("@react-pdf/renderer");
const fs = require("fs");

// Register ts-node or run via next context
// Since we are running in the Next.js project directory, we can compile on the fly.
// But we can also just run it by importing the built files or executing via a small test endpoint.
// Let's write a test script that does a fetch to the local running app!
async function main() {
  const url = "http://localhost:3000/api/pdf?id=q0Q1WxFDBHUpGc2Eghto";
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      console.log(`PDF generation failed: Status ${res.status}\nError: ${errText}`);
    } else {
      const buffer = await res.arrayBuffer();
      console.log(`PDF generated successfully! Size: ${buffer.byteLength} bytes`);
      fs.writeFileSync("scratch/test-out.pdf", Buffer.from(buffer));
      console.log("PDF saved to scratch/test-out.pdf");
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
main();
