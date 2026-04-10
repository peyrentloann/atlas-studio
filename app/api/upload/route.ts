import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const uploadForm = new FormData();
  uploadForm.append("file", file);

  const res = await fetch("https://api.atlascloud.ai/api/v1/model/uploadMedia", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.ATLAS_API_KEY}` },
    body: uploadForm,
  });

  const data = await res.json();
  if (!res.ok || data.code !== 200 || !data.data?.download_url) {
    return NextResponse.json({ message: data.message || "Upload failed" }, { status: 400 });
  }
  return NextResponse.json({ url: data.data.download_url });
}
