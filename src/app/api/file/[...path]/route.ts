import { getDownloadUrl } from "@vercel/blob";
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

    const downloadUrl = getDownloadUrl(blobUrl);
    return NextResponse.redirect(downloadUrl);
  } catch (err) {
    console.error("File access error:", err);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
