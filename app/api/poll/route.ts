import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const res = await fetch(`https://api.atlascloud.ai/api/v1/model/prediction/${id}`, {
    headers: { Authorization: `Bearer ${process.env.ATLAS_API_KEY}` },
  });

  const data = await res.json();
  if (!res.ok || !data.data) return NextResponse.json({ status: "failed", error: data.message || "Poll error" });

  const { status, outputs, error } = data.data;
  return NextResponse.json({ status, output: outputs?.[0] ?? null, error: error || null });
}
