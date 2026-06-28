"use client";

import { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";

const STORAGE_KEY = "streamtv_favorites";

function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(getFavorites);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setFavorites(getFavorites());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const toggle = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, toggle, isFavorite };
}

interface Props {
  channelId: string;
  isFavorite: boolean;
  onToggle: (id: string) => void;
  className?: string;
}

export default function FavoriteButton({ channelId, isFavorite, onToggle, className = "" }: Props) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(channelId); }}
      className={`transition-colors ${
        isFavorite ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400"
      } ${className}`}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Star className={`h-5 w-5 ${isFavorite ? "fill-yellow-400" : ""}`} />
    </button>
  );
}
