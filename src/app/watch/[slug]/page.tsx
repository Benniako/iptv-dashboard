import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VideoPlayer from "@/components/VideoPlayer";
import { getPopularLive, getCategories, getStreamSources } from "@/lib/iptv";
import { formatViewerCount } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function WatchPage({ params }: Props) {
  const { slug } = await params;
  const events = getPopularLive();
  const event = events.find((e) => e.id === slug);

  if (!event) {
    notFound();
  }

  const relatedEvents = events.filter((e) => e.id !== slug).slice(0, 6);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* Back link */}
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main content */}
            <div className="lg:col-span-2">
              <VideoPlayer src="" title={event.title} />

              {/* Event info */}
              <div className="mt-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-white">{event.title}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.category} | {event.channel} | {event.startTime}
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 shrink-0 rounded-full bg-live-red/10 px-3 py-1 text-xs font-semibold text-live-red">
                    <span className="h-2 w-2 rounded-full bg-live-red live-pulse" />
                    LIVE {formatViewerCount(event.viewers)}
                  </span>
                </div>
              </div>

              {/* Channel list placeholder */}
              <div className="mt-6 rounded-xl border border-border/40 bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Available Streams
                </h3>
                <div className="space-y-2">
                  {getStreamSources(slug).map((stream, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-border/30 bg-[#1a1a2e] px-3 py-2.5 text-sm hover:border-[#3498db]/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white">{stream.name}</span>
                        <span className="rounded bg-[#3498db]/10 px-1.5 py-0.5 text-xs text-[#3498db]">
                          {stream.quality}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {stream.lag} delay
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside>
              <h3 className="mb-3 text-sm font-semibold text-white">
                Related Live
              </h3>
              <div className="space-y-3">
                {relatedEvents.map((re) => (
                  <Link
                    key={re.id}
                    href={`/watch/${re.id}`}
                    className="group flex gap-3 rounded-lg border border-border/30 bg-card/50 p-3 transition-all hover:bg-[#242442]/80 hover:border-border/60"
                  >
                    <div className="h-16 w-28 shrink-0 rounded-md bg-gradient-to-br from-[#1a1a3e] to-[#0a0a1e] flex items-center justify-center text-2xl">
                      {re.category === "Rugby" && "🏉"}
                      {re.category === "Motor Sports" && "🏎️"}
                      {re.category === "AFL" && "🏏"}
                      {re.category === "Fight" && "🥊"}
                      {re.category === "Basketball" && "🏀"}
                      {(re.category === "Football" || re.category === "American Football") && "⚽"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-live-red" />
                        <span className="text-xs font-semibold text-live-red">
                          LIVE
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-medium text-white line-clamp-2 group-hover:text-[#3498db] transition-colors">
                        {re.title}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" /> {formatViewerCount(re.viewers)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
