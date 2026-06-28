"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Eye } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FavoriteButton, { useFavorites } from "@/components/FavoriteButton";
import { getPopularLive } from "@/lib/iptv";
import { formatViewerCount } from "@/lib/utils";
import type { LiveEvent } from "@/types";

export default function FavoritesPage() {
  const { favorites, toggle, isFavorite } = useFavorites();
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    setEvents(getPopularLive().filter(e => favorites.includes(e.id)));
  }, [favorites]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Star className="h-6 w-6 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">My Favorites</h1>
          </div>

          {events.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card p-12 text-center">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No favorites yet</p>
              <p className="text-sm text-muted-foreground">
                Click the <Star className="h-4 w-4 inline" /> star icon on any channel or stream to save it here.
              </p>
              <Link href="/" className="mt-4 inline-block rounded-lg bg-[#3498db] px-4 py-2 text-sm text-white hover:bg-[#3498db]/90">
                Browse Channels
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map(event => (
                <Link
                  key={event.id}
                  href={`/watch/${event.id}`}
                  className="group rounded-xl border border-border/50 bg-card p-4 transition-all hover:bg-[#242442] hover:border-[#3498db]/40"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-white group-hover:text-[#3498db] transition-colors">
                        {event.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">{event.category} &middot; {event.channel}</p>
                    </div>
                    <FavoriteButton channelId={event.id} isFavorite={isFavorite(event.id)} onToggle={toggle} />
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-live-red" />
                      LIVE
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {formatViewerCount(event.viewers)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
