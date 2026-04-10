import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt, aspect_ratio, model, image } = await req.json();

  const isEdit = model.endsWith("/edit") || model.endsWith("/edit-ultra");

  const body: Record<string, unknown> = { model, prompt };

  if (isEdit && image) {
    body.images = [image];
  } else {
    body.aspect_ratio = aspect_ratio;
    body.enable_base64_output = false;
    body.enable_sync_mode = false;
  }

  const res = await fetch("https://api.atlascloud.ai/api/v1/model/generateImage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ATLAS_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || data.code !== 200 || !data.data?.id) {
    const msg = data.message || data.data?.error || "Atlas API error";
    return NextResponse.json({ message: msg }, { status: 400 });
  }
  return NextResponse.json({ id: data.data.id });
}
