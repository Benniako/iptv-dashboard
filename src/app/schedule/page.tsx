import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSchedule, getCategories } from "@/lib/iptv";
import { Calendar, Clock } from "lucide-react";

export default function SchedulePage() {
  const schedule = getSchedule();
  const categories = getCategories();

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="text-2xl font-bold text-white mb-6">Schedule</h1>

          <div className="grid gap-8 lg:grid-cols-4">
            {/* Category filter sidebar */}
            <aside className="lg:col-span-1">
              <div className="rounded-xl border border-border/40 bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">Categories</h3>
                <div className="space-y-1">
                  <button className="w-full rounded-md px-3 py-2 text-left text-sm bg-[#3498db]/10 text-[#3498db] font-medium">
                    All Sports
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Schedule list */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span>Upcoming events</span>
              </div>

              {schedule.length === 0 ? (
                <div className="rounded-xl border border-border/40 bg-card p-8 text-center">
                  <p className="text-muted-foreground">
                    No upcoming events scheduled. Check back later.
                  </p>
                </div>
              ) : (
                schedule.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 rounded-xl border border-border/40 bg-card p-4 transition-all hover:bg-[#242442]/80"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1a1a3e] text-xl">
                      {event.category === "Basketball" && "🏀"}
                      {event.category === "Football" && "⚽"}
                      {event.category === "American Football" && "🏈"}
                      {event.category === "Tennis" && "🎾"}
                      {event.category === "Fight" && "🥊"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white">{event.title}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {event.category} &middot; {event.channel}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                      <Clock className="h-4 w-4" />
                      <span>{event.startTime}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
