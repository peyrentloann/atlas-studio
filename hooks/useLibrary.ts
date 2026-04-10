"use client";

import { useState, useEffect, useCallback } from "react";

export interface Generation {
  id: string;
  type: "image" | "video";
  model: string;
  prompt: string;
  params: Record<string, unknown>;
  output: string;
  createdAt: number;
}

const KEY = "atlas_studio_library";

function load(): Generation[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function useLibrary() {
  const [items, setItems] = useState<Generation[]>([]);

  useEffect(() => {
    setItems(load());
  }, []);

  const save = useCallback((gen: Omit<Generation, "id" | "createdAt">) => {
    const entry: Generation = {
      ...gen,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setItems((prev) => {
      const next = [entry, ...prev];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((g) => g.id !== id);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setItems([]);
  }, []);

  return { items, save, remove, clear };
}
