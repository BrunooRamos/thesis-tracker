import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Archivo muy grande (máx. 10MB)" },
        { status: 400 }
      );
    }

    // Validate type
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "text/markdown",
      "text/plain",
      "text/x-markdown",
      "application/octet-stream", // Some browsers send .md as this
    ];
    const isMd = file.name.toLowerCase().endsWith(".md") || file.name.toLowerCase().endsWith(".markdown");
    const isTxt = file.name.toLowerCase().endsWith(".txt");
    if (!allowedTypes.includes(file.type) && !isMd && !isTxt) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido (PDF, MD, TXT, PNG, JPG, GIF, WebP)" },
        { status: 400 }
      );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "File storage not configured. Add BLOB_READ_WRITE_TOKEN to environment variables." },
        { status: 500 }
      );
    }

    const blob = await put(file.name, file, {
      access: "private",
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Normalize fileType for markdown/txt files
    let fileType = file.type;
    if (isMd) fileType = "text/markdown";
    else if (isTxt) fileType = "text/plain";

    return NextResponse.json({
      url: blob.url,
      fileName: file.name,
      fileType,
    });
  } catch (err) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Error al subir archivo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
