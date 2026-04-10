"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Loader2, Upload, X } from "lucide-react";
import { useLibrary } from "@/hooks/useLibrary";

const ASPECT_RATIOS = ["16:9", "9:16", "1:1"];
const DURATIONS = [5, 10];

const VIDEO_MODELS = [
  { id: "kling-v3.0-std", label: "Kling 3.0 Standard" },
  { id: "kling-v3.0-pro", label: "Kling 3.0 Pro" },
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
    }, 4000);
  });
}

export interface VideoPreset {
  model: string;
  prompt: string;
  mode: "t2v" | "i2v";
  duration: number;
  aspect_ratio: string;
}

interface Props {
  preset?: VideoPreset | null;
  onPresetConsumed?: () => void;
}

export default function VideoGenerator({ preset, onPresetConsumed }: Props) {
  const [mode, setMode] = useState<"t2v" | "i2v">("t2v");
  const [model, setModel] = useState("kling-v3.0-std");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { save } = useLibrary();

  useEffect(() => {
    if (!preset) return;
    if (preset.model) setModel(preset.model);
    if (preset.prompt) setPrompt(preset.prompt);
    if (preset.mode) setMode(preset.mode);
    if (preset.duration) setDuration(preset.duration);
    if (preset.aspect_ratio) setAspectRatio(preset.aspect_ratio);
    onPresetConsumed?.();
  }, [preset]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function generate() {
    if (!prompt.trim()) return;
    if (mode === "i2v" && !imageFile) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      let imageUrl: string | undefined;

      if (mode === "i2v" && imageFile) {
        setUploading(true);
        const form = new FormData();
        form.append("file", imageFile);
        const upRes = await fetch("/api/upload", { method: "POST", body: form });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.message || "Upload failed");
        imageUrl = upData.url;
        setUploading(false);
      }

      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode, model, duration, aspect_ratio: aspectRatio, image: imageUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error starting generation");

      const output = await poll(data.id);
      setResult(output);

      save({
        type: "video",
        model,
        prompt,
        params: { mode, duration, aspect_ratio: aspectRatio },
        output,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  const canGenerate = prompt.trim() && (mode === "t2v" || imageFile) && !loading;

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Model</label>
        <div className="grid grid-cols-2 gap-2">
          {VIDEO_MODELS.map((m) => (
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

      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Mode</label>
        <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg w-fit">
          <button
            onClick={() => setMode("t2v")}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
              mode === "t2v" ? "bg-white text-zinc-900 font-medium" : "text-zinc-400 hover:text-white"
            }`}
          >
            Text to Video
          </button>
          <button
            onClick={() => setMode("i2v")}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
              mode === "i2v" ? "bg-white text-zinc-900 font-medium" : "text-zinc-400 hover:text-white"
            }`}
          >
            Image to Video
          </button>
        </div>
      </div>

      {mode === "i2v" && (
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">First Frame</label>
          {imagePreview ? (
            <div className="relative w-fit">
              <img src={imagePreview} alt="First frame" className="max-h-48 rounded-lg border border-zinc-700 object-cover" />
              <button onClick={removeImage} className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-1 hover:bg-zinc-700">
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-zinc-700 text-zinc-400 text-sm hover:border-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Upload size={15} />
              Upload first frame
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
          placeholder="Describe your video..."
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Duration</label>
          <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex-1 py-1.5 rounded-md text-sm transition-colors ${
                  duration === d ? "bg-white text-zinc-900 font-medium" : "text-zinc-400 hover:text-white"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Format</label>
          <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg">
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r}
                onClick={() => setAspectRatio(r)}
                className={`flex-1 py-1.5 rounded-md text-xs transition-colors ${
                  aspectRatio === r ? "bg-white text-zinc-900 font-medium" : "text-zinc-400 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={generate}
        disabled={!canGenerate}
        className="w-full py-3 rounded-lg bg-white text-zinc-900 font-medium text-sm hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {uploading ? "Uploading..." : "Generating... (1-2 min)"}
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
          <video src={result} controls autoPlay loop className="w-full rounded-xl border border-zinc-800" />
          <a
            href={result}
            download="video.mp4"
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
