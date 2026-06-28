import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPopularLive } from "@/lib/iptv";
import { Monitor } from "lucide-react";

export default function MultiviewPage() {
  const events = getPopularLive().slice(0, 4);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Monitor className="h-6 w-6 text-[#3498db]" />
            <div>
              <h1 className="text-2xl font-bold text-white">Multi Stream</h1>
              <p className="text-sm text-muted-foreground">
                Watch up to 4 streams simultaneously
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="relative aspect-video rounded-lg bg-black border border-border/40 overflow-hidden"
              >
                {events[idx] ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-2xl">
                          {events[idx].category === "Rugby" && "🏉"}
                          {events[idx].category === "Motor Sports" && "🏎️"}
                          {events[idx].category === "AFL" && "🏏"}
                          {events[idx].category === "Fight" && "🥊"}
                          {events[idx].category === "Basketball" && "🏀"}
                          {events[idx].category === "Football" && "⚽"}
                        </span>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-xs text-white line-clamp-1">
                        {events[idx].title}
                      </p>
                    </div>
                    <div className="absolute left-2 top-2">
                      <span className="flex items-center gap-1 rounded bg-live-red/90 px-1.5 py-0.5 text-xs font-semibold text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        LIVE
                      </span>
                    </div>
                    <div className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-muted-foreground">
                      Stream {idx + 1}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-xs text-muted-foreground">
                      Select a stream
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-border/40 bg-card p-6 text-center">
            <p className="text-muted-foreground">
              Select streams to watch side by side. Click any stream box above to choose a channel.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
