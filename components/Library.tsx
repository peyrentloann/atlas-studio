"use client";

import { useState } from "react";
import { Trash2, RotateCcw, Download, X } from "lucide-react";
import { useLibrary, Generation } from "@/hooks/useLibrary";

interface Props {
  onReuse: (gen: Generation) => void;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("fr-CA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function modelShort(model: string) {
  const map: Record<string, string> = {
    "google/nano-banana-2/text-to-image": "NB2",
    "google/nano-banana-pro/text-to-image": "NB PRO",
    "google/nano-banana-2/edit": "NB2 Edit",
    "google/nano-banana-pro/edit": "NB PRO Edit",
    "kling-v3.0-std": "Kling 3 Std",
    "kling-v3.0-pro": "Kling 3 Pro",
  };
  return map[model] ?? model;
}

export default function Library({ onReuse }: Props) {
  const { items, remove, clear } = useLibrary();
  const [preview, setPreview] = useState<Generation | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
        <p className="text-sm">No generations yet.</p>
        <p className="text-xs mt-1 text-zinc-600">Generate images or videos to see them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">{items.length} generation{items.length > 1 ? "s" : ""}</span>
        {confirmClear ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-400">Clear all?</span>
            <button onClick={() => { clear(); setConfirmClear(false); }} className="text-red-400 hover:text-red-300">Yes</button>
            <button onClick={() => setConfirmClear(false)} className="text-zinc-400 hover:text-white">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmClear(true)} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((gen) => (
          <div key={gen.id} className="group relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-colors">
            <button className="w-full aspect-video block" onClick={() => setPreview(gen)}>
              {gen.type === "image" ? (
                <img src={gen.output} alt={gen.prompt} className="w-full h-full object-cover" />
              ) : (
                <video src={gen.output} className="w-full h-full object-cover" muted />
              )}
            </button>

            <div className="p-2 space-y-1">
              <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">{gen.prompt}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                  {modelShort(gen.model)}
                </span>
                <span className="text-[10px] text-zinc-600">{formatDate(gen.createdAt)}</span>
              </div>
            </div>

            <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onReuse(gen)}
                title="Reuse params"
                className="p-1.5 bg-zinc-800/90 rounded-md hover:bg-zinc-700 text-zinc-300"
              >
                <RotateCcw size={12} />
              </button>
              <button
                onClick={() => remove(gen.id)}
                title="Delete"
                className="p-1.5 bg-zinc-800/90 rounded-md hover:bg-red-900 text-zinc-300"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-zinc-900 rounded-2xl max-w-2xl w-full border border-zinc-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {preview.type === "image" ? (
              <img src={preview.output} alt={preview.prompt} className="w-full" />
            ) : (
              <video src={preview.output} controls autoPlay loop className="w-full" />
            )}
            <div className="p-4 space-y-3">
              <p className="text-sm text-zinc-200">{preview.prompt}</p>
              <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                <span className="bg-zinc-800 px-2 py-0.5 rounded">{modelShort(preview.model)}</span>
                {Object.entries(preview.params).map(([k, v]) => (
                  <span key={k} className="bg-zinc-800 px-2 py-0.5 rounded">{String(v)}</span>
                ))}
                <span className="bg-zinc-800 px-2 py-0.5 rounded">{formatDate(preview.createdAt)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { onReuse(preview); setPreview(null); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-zinc-900 text-sm font-medium hover:bg-zinc-200 transition-colors"
                >
                  <RotateCcw size={13} />
                  Reuse params
                </button>
                <a
                  href={preview.output}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm hover:bg-zinc-700 transition-colors"
                >
                  <Download size={13} />
                  Download
                </a>
                <button
                  onClick={() => { remove(preview.id); setPreview(null); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-red-400 text-sm hover:bg-red-950 transition-colors ml-auto"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
            <button onClick={() => setPreview(null)} className="absolute top-3 right-3 p-1.5 bg-zinc-800 rounded-full hover:bg-zinc-700">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
