import { get } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path } = await params;
    const blobUrl = decodeURIComponent(path.join("/"));

    if (!blobUrl.includes("blob.vercel-storage.com")) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    const result = await get(blobUrl, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Stream the file back with proper headers
    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || "application/octet-stream",
        "Content-Disposition": result.blob.contentDisposition || "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("File access error:", err);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
