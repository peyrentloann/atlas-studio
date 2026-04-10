"use client";

import { useLibrary } from "@/hooks/useLibrary";

// Atlas Cloud pricing (per unit)
const ATLAS_PRICES: Record<string, number> = {
  "google/nano-banana-2/text-to-image": 0.013,
  "google/nano-banana-pro/text-to-image": 0.02,
  "google/nano-banana-2/edit": 0.013,
  "google/nano-banana-pro/edit": 0.02,
  "kling-v3.0-std": 0.126, // per second
  "kling-v3.0-pro": 0.28,  // per second
};

// Monthly subscription costs
const SUBSCRIPTIONS = [
  { name: "Krea.ai Pro", monthly: 35 },
  { name: "Higgsfield", monthly: 29 },
];

function calcAtlasCost(model: string, params: Record<string, unknown>): number {
  const price = ATLAS_PRICES[model] ?? 0;
  if (model.includes("kling")) {
    const duration = (params.duration as number) ?? 5;
    return price * duration;
  }
  return price;
}

export default function CostSavings() {
  const { items } = useLibrary();

  const totalAtlas = items.reduce((sum, g) => sum + calcAtlasCost(g.model, g.params), 0);

  const images = items.filter((g) => g.type === "image").length;
  const videos = items.filter((g) => g.type === "video").length;

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-200">Cost tracker</h3>
        <span className="text-xs text-zinc-500">{items.length} génération{items.length > 1 ? "s" : ""}</span>
      </div>

      <div className="flex gap-4 text-sm">
        <div className="flex-1 rounded-lg bg-zinc-800 px-4 py-3">
          <div className="text-zinc-400 text-xs mb-1">Payé via Atlas</div>
          <div className="text-white font-semibold">${totalAtlas.toFixed(3)}</div>
          <div className="text-zinc-500 text-xs mt-1">{images} img · {videos} vidéo{videos > 1 ? "s" : ""}</div>
        </div>

        {SUBSCRIPTIONS.map((sub) => {
          const saved = sub.monthly - totalAtlas;
          return (
            <div key={sub.name} className="flex-1 rounded-lg bg-zinc-800 px-4 py-3">
              <div className="text-zinc-400 text-xs mb-1">Économisé vs {sub.name}</div>
              <div className={`font-semibold ${saved >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {saved >= 0 ? "+" : ""}${saved.toFixed(2)}
              </div>
              <div className="text-zinc-500 text-xs mt-1">${sub.monthly}/mois abonnement</div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-zinc-600">
        Basé sur les tarifs Atlas Cloud en vigueur. Vidéos calculées sur la durée choisie.
      </div>
    </div>
  );
}
