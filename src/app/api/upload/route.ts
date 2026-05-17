import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { rateLimitAsync, getRateLimitKey } from "@/lib/rate-limit";

// Allow larger request bodies for image uploads (default is 4.5MB on Vercel)
export const maxDuration = 60; // seconds

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "munsel-mn";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 30 uploads per minute
    const rlKey = getRateLimitKey(req, "upload");
    const rl = await rateLimitAsync(rlKey, { limit: 30, windowMs: 60_000 });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed` }, { status: 400 });
    }

    // Validate all files before uploading
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, AVIF` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum 10MB` },
          { status: 400 }
        );
      }
    }

    const urls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");
      const dataUri = `data:${file.type};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: CLOUDINARY_FOLDER,
        transformation: [
          { width: 1200, height: 1200, crop: "limit", quality: "auto", format: "webp" },
        ],
      });

      urls.push(result.secure_url);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Upload error:", error instanceof Error ? error.message : error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
