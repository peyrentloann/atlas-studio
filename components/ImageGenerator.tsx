"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Loader2, Upload, X } from "lucide-react";
import { useLibrary } from "@/hooks/useLibrary";

const ASPECT_RATIOS = ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3"];

const IMAGE_MODELS = [
  { id: "google/nano-banana-2/text-to-image", label: "Nano Banana 2", mode: "t2i" },
  { id: "google/nano-banana-pro/text-to-image", label: "Nano Banana PRO", mode: "t2i" },
  { id: "google/nano-banana-2/edit", label: "Nano Banana 2 Edit", mode: "edit" },
  { id: "google/nano-banana-pro/edit", label: "Nano Banana PRO Edit", mode: "edit" },
];

function poll(id: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/poll?id=${id}`);
        const data = await res.json();
        if (data.status === "completed" || data.status === "succeeded") {
          clearInterval(interval);
          resolve(data.output);
        } else if (data.status === "failed") {
          clearInterval(interval);
          reject(new Error(data.error || "Generation failed"));
        }
      } catch (e) {
        clearInterval(interval);
        reject(e);
      }
    }, 3000);
  });
}

export interface ImagePreset {
  model: string;
  prompt: string;
  aspect_ratio: string;
  image?: string;
}

interface Props {
  preset?: ImagePreset | null;
  onPresetConsumed?: () => void;
}

export default function ImageGenerator({ preset, onPresetConsumed }: Props) {
  const [model, setModel] = useState(IMAGE_MODELS[0].id);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [refImage, setRefImage] = useState<File | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { save } = useLibrary();

  const selectedModel = IMAGE_MODELS.find((m) => m.id === model)!;
  const isEdit = selectedModel.mode === "edit";

  useEffect(() => {
    if (!preset) return;
    if (preset.model) setModel(preset.model);
    if (preset.prompt) setPrompt(preset.prompt);
    if (preset.aspect_ratio) setAspectRatio(preset.aspect_ratio);
    onPresetConsumed?.();
  }, [preset]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRefImage(file);
    setRefPreview(URL.createObjectURL(file));
  }

  function removeRef() {
    setRefImage(null);
    setRefPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      let imageUrl: string | undefined;

      if (isEdit && refImage) {
        setUploading(true);
        const form = new FormData();
        form.append("file", refImage);
        const upRes = await fetch("/api/upload", { method: "POST", body: form });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.message || "Upload failed");
        imageUrl = upData.url;
        setUploading(false);
      }

      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          aspect_ratio: aspectRatio,
          image: imageUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error starting generation");

      const output = await poll(data.id);
      setResult(output);

      save({
        type: "image",
        model,
        prompt,
        params: { aspect_ratio: aspectRatio },
        output,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  const canGenerate = prompt.trim() && (!isEdit || refImage) && !loading;

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Model</label>
        <div className="grid grid-cols-2 gap-2">
          {IMAGE_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setModel(m.id)}
              className={`px-3 py-2 rounded-lg text-sm text-left transition-colors border ${
                model === m.id
                  ? "bg-white text-zinc-900 border-white font-medium"
                  : "bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {isEdit && (
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Reference Image</label>
          {refPreview ? (
            <div className="relative w-fit">
              <img src={refPreview} alt="Ref" className="max-h-40 rounded-lg border border-zinc-700 object-cover" />
              <button onClick={removeRef} className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-1 hover:bg-zinc-700">
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-zinc-700 text-zinc-400 text-sm hover:border-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Upload size={15} />
              Upload reference image
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFileChange} />
        </div>
      )}

      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your image..."
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
        />
      </div>

      {!isEdit && (
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Aspect Ratio</label>
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r}
                onClick={() => setAspectRatio(r)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  aspectRatio === r ? "bg-white text-zinc-900 font-medium" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={generate}
        disabled={!canGenerate}
        className="w-full py-3 rounded-lg bg-white text-zinc-900 font-medium text-sm hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {uploading ? "Uploading..." : "Generating..."}
          </>
        ) : (
          "Generate  ⌘↵"
        )}
      </button>

      {error && (
        <div className="p-3 rounded-lg bg-red-950 border border-red-800 text-red-300 text-sm">{error}</div>
      )}

      {result && (
        <div className="space-y-3">
          <img src={result} alt="Generated" className="w-full rounded-xl border border-zinc-800" />
          <a
            href={result}
            download="image.png"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-zinc-800 text-zinc-200 text-sm hover:bg-zinc-700 transition-colors"
          >
            <Download size={15} />
            Download
          </a>
        </div>
      )}
    </div>
  );
}
