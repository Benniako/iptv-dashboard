"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { getPopularLive } from "@/lib/iptv";
import { formatViewerCount } from "@/lib/utils";

export default function PopularLive() {
  const events = getPopularLive();
  const topEvents = events.slice(0, 2);
  const listEvents = events.slice(2, 10);

  return (
    <section className="pb-12">
      <div className="mx-auto max-w-7xl px-4">
        {/* Top by viewers */}
        <h2 className="mb-4 text-2xl font-bold text-white">
          Popular Live <span className="text-muted-foreground">(by viewers)</span>
        </h2>
        <div className="grid gap-4 md:grid-cols-2 mb-10">
          {topEvents.map((event) => (
            <Link
              key={event.id}
              href={`/watch/${event.id}`}
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-200 hover:bg-[#242442] hover:border-[#3498db]/40"
            >
              {/* Thumbnail Placeholder */}
              <div className="aspect-video bg-gradient-to-br from-[#1a1a3e] to-[#0a0a1e] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-2">
                    {event.category === "Rugby" && "🏉"}
                    {event.category === "Motor Sports" && "🏎️"}
                    {event.category === "AFL" && "🏏"}
                    {event.category === "Fight" && "🥊"}
                    {event.category === "Basketball" && "🏀"}
                    {event.category === "Football" && "⚽"}
                    {event.category === "American Football" && "🏈"}
                  </div>
                  <div className="text-xs text-muted-foreground">Live Stream</div>
                </div>
              </div>

              {/* Overlay info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 text-xs font-semibold text-live-red">
                    <span className="h-2 w-2 rounded-full bg-live-red live-pulse inline-block" />
                    LIVE {formatViewerCount(event.viewers)}
                  </span>
                  <span className="text-xs text-muted-foreground">{event.category}</span>
                </div>
                <h3 className="font-semibold text-white group-hover:text-[#3498db] transition-colors line-clamp-1">
                  {event.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.category} | {event.startTime}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Popular Live list */}
        <h2 className="mb-4 text-2xl font-bold text-white">Popular Live</h2>
        <div className="space-y-2">
          {listEvents.map((event) => (
            <Link
              key={event.id}
              href={`/watch/${event.id}`}
              className="flex items-center gap-4 rounded-lg border border-border/30 bg-card/50 px-4 py-3 transition-all duration-200 hover:bg-[#242442]/80 hover:border-border/60"
            >
              <span className="flex h-2 w-2 shrink-0 rounded-full bg-live-red live-pulse" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-white line-clamp-1">
                  {event.title}
                </span>
              </div>
              <span className="hidden sm:block text-xs text-muted-foreground shrink-0">
                {event.category}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {event.startTime}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Eye className="h-3 w-3" />
                {formatViewerCount(event.viewers)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
