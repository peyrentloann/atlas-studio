"use client";

import { useState } from "react";
import ImageGenerator, { ImagePreset } from "@/components/ImageGenerator";
import VideoGenerator, { VideoPreset } from "@/components/VideoGenerator";
import Library from "@/components/Library";
import CostSavings from "@/components/CostSavings";
import { Generation } from "@/hooks/useLibrary";

type Tab = "image" | "video" | "library";

export default function Home() {
  const [tab, setTab] = useState<Tab>("image");
  const [imagePreset, setImagePreset] = useState<ImagePreset | null>(null);
  const [videoPreset, setVideoPreset] = useState<VideoPreset | null>(null);

  function handleReuse(gen: Generation) {
    if (gen.type === "image") {
      setImagePreset({
        model: gen.model,
        prompt: gen.prompt,
        aspect_ratio: (gen.params.aspect_ratio as string) ?? "1:1",
      });
      setTab("image");
    } else {
      setVideoPreset({
        model: gen.model,
        prompt: gen.prompt,
        mode: (gen.params.mode as "t2v" | "i2v") ?? "t2v",
        duration: (gen.params.duration as number) ?? 5,
        aspect_ratio: (gen.params.aspect_ratio as string) ?? "16:9",
      });
      setTab("video");
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "image", label: "Image" },
    { id: "video", label: "Video" },
    { id: "library", label: "Library" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-3">
        <span className="text-lg font-semibold tracking-tight">Atlas Studio</span>
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">local</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg mb-8 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.id ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "image" && (
          <ImageGenerator
            preset={imagePreset}
            onPresetConsumed={() => setImagePreset(null)}
          />
        )}
        {tab === "video" && (
          <VideoGenerator
            preset={videoPreset}
            onPresetConsumed={() => setVideoPreset(null)}
          />
        )}
        {tab === "library" && <Library onReuse={handleReuse} />}

        <div className="mt-8">
          <CostSavings />
        </div>
      </main>
    </div>
  );
}
