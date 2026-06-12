// scratch/test-upload.js
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

// Load .env.local manually
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const dummyPdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n/MediaBox [0 0 595.28 841.89]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000288 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n381\n%%EOF\n");

async function testUpload(resourceType) {
  return new Promise((resolve, reject) => {
    const publicId = "test_" + resourceType + "_" + Date.now();
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "bjareport/test",
        resource_type: resourceType,
        format: "pdf",
        public_id: publicId,
      },
      (error, result) => {
        if (error) {
          console.error(`Upload error as ${resourceType}:`, error);
          reject(error);
        } else {
          // Generate signed URL
          const signedUrl = cloudinary.url(result.public_id, {
            resource_type: resourceType,
            format: "pdf",
            secure: true,
            sign_url: true,
          });
          console.log(`Upload success as ${resourceType}. Public URL:`, result.secure_url);
          console.log(`Signed URL as ${resourceType}:`, signedUrl);
          resolve(result);
        }
      }
    );
    stream.end(dummyPdfBuffer);
  });
}

async function run() {
  await testUpload("image");
}

run();
