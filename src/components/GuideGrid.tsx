"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import type { GuideEntry, LiveEvent } from "@/types";
import { getGuideForChannel } from "@/lib/iptv";

interface Props {
  channels: LiveEvent[];
}

export default function GuideGrid({ channels }: Props) {
  const [guides, setGuides] = useState<Record<string, GuideEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const results: Record<string, GuideEntry[]> = {};
      const batch = channels.slice(0, 20);
      await Promise.all(
        batch.map(async (ch) => {
          results[ch.id] = await getGuideForChannel(ch.id);
        })
      );
      setGuides(results);
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 600_000);
    return () => clearInterval(interval);
  }, [channels]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 200;
    }
  }, [loading]);

  const currentHour = new Date().getHours();
  const hours = Array.from({ length: 6 }, (_, i) => currentHour + i);

  if (loading) {
    return (
      <div className="rounded-xl border border-border/40 bg-card p-8 text-center">
        <p className="text-muted-foreground">Loading guide...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" ref={scrollRef}>
      <div className="min-w-[800px]">
        {/* Time header */}
        <div className="flex border-b border-border/40">
          <div className="w-48 shrink-0 p-2 text-xs text-muted-foreground font-semibold">Channel</div>
          {hours.map(h => (
            <div key={h} className="flex-1 min-w-[120px] p-2 text-xs text-muted-foreground text-center border-l border-border/20">
              {`${h.toString().padStart(2, "0")}:00`}
            </div>
          ))}
        </div>

        {/* Program rows */}
        {channels.slice(0, 20).map(ch => (
          <div key={ch.id} className="flex border-b border-border/20 hover:bg-[#242442]/50">
            <div className="w-48 shrink-0 p-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-live-red" />
              <Link href={`/watch/${ch.id}`} className="text-sm text-white hover:text-[#3498db] truncate">
                {ch.title}
              </Link>
            </div>
            {hours.map(h => {
              const entry = (guides[ch.id] || []).find(g => {
                const startHour = new Date(g.start * 1000).getHours();
                return startHour === h;
              });
              return (
                <div key={h} className="flex-1 min-w-[120px] p-1 border-l border-border/20">
                  {entry ? (
                    <Link
                      href={`/watch/${ch.id}`}
                      className="block rounded bg-[#1a1a3e] px-2 py-1 text-xs text-white hover:bg-[#3498db]/20 transition-colors"
                    >
                      <p className="truncate font-medium">{entry.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {new Date(entry.start * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
