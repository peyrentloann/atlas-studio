import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt, image, duration, model: modelId, aspect_ratio, mode } = await req.json();

  const model =
    mode === "i2v"
      ? `kwaivgi/${modelId}/image-to-video`
      : `kwaivgi/${modelId}/text-to-video`;

  const body: Record<string, unknown> = {
    model,
    prompt,
    duration: Number(duration),
    aspect_ratio,
  };

  if (mode === "i2v" && image) {
    body.image = image;
  }

  const res = await fetch("https://api.atlascloud.ai/api/v1/model/generateVideo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ATLAS_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });
  return NextResponse.json({ id: data.data.id });
}
