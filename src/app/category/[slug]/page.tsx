import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCategoryBySlug, getPopularLive, getCategories } from "@/lib/iptv";
import { formatViewerCount } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const allEvents = getPopularLive();
  const categoryEvents = allEvents.filter(
    (e) => e.categorySlug === slug
  );
  const otherCategories = getCategories().filter((c) => c.slug !== slug);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Back link */}
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <span className="text-3xl">{category.icon}</span>
            <div>
              <h1 className="text-2xl font-bold text-white">{category.name}</h1>
              <p className="text-sm text-muted-foreground">
                {categoryEvents.length} live now
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-4">
            {/* Sidebar - other categories */}
            <aside className="lg:col-span-1">
              <div className="rounded-xl border border-border/40 bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">Categories</h3>
                <div className="space-y-1">
                  {otherCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span>{cat.icon}</span>
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>

            {/* Events list */}
            <div className="lg:col-span-3">
              {categoryEvents.length === 0 ? (
                <div className="rounded-xl border border-border/40 bg-card p-8 text-center">
                  <p className="text-muted-foreground">
                    No live {category.name.toLowerCase()} streams right now.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {categoryEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/watch/${event.id}`}
                      className="group overflow-hidden rounded-xl border border-border/40 bg-card transition-all hover:bg-[#242442]/80 hover:border-[#3498db]/40"
                    >
                      <div className="aspect-video bg-gradient-to-br from-[#1a1a3e] to-[#0a0a1e] flex items-center justify-center">
                        <span className="text-5xl">{category.icon}</span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="h-2 w-2 rounded-full bg-live-red live-pulse" />
                          <span className="text-xs font-semibold text-live-red">
                            LIVE
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                            <Eye className="h-3 w-3" /> {formatViewerCount(event.viewers)}
                          </span>
                        </div>
                        <h3 className="font-medium text-white group-hover:text-[#3498db] transition-colors line-clamp-1">
                          {event.title}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {event.channel} | {event.startTime}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
