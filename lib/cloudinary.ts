// =============================================================
// BJA Report — Cloudinary Upload Service
// =============================================================
// All uploads happen server-side via API routes/Server Actions.
// =============================================================

"use server";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Upload a file buffer to Cloudinary.
 * @param buffer  - File data as Buffer
 * @param folder  - Cloudinary folder (e.g., "bjareport/surat-jalan")
 * @param options - Additional options
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  options: {
    resourceType?: "image" | "raw" | "auto";
    format?: string;
    publicId?: string;
  } = {}
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: options.resourceType ?? "auto",
          format: options.format,
          public_id: options.publicId,
          overwrite: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Upload failed"));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      )
      .end(buffer);
  });
}

/**
 * Delete a resource from Cloudinary by public ID.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "raw" = "image"
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}
