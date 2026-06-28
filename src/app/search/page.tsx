import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPopularLive } from "@/lib/iptv";
import { formatViewerCount } from "@/lib/utils";
import Link from "next/link";
import { Eye, Search } from "lucide-react";
import { getCategories } from "@/lib/iptv";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q || "";
  const events = getPopularLive();

  const results = query
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(query.toLowerCase()) ||
          e.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];
  const categories = getCategories();
  const matchingCategory = query
    ? categories.find((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">
              {query ? `Results for "${query}"` : "Search"}
            </h1>
            {query && (
              <p className="mt-1 text-sm text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </p>
            )}
          </div>

          {!query ? (
            <div className="rounded-xl border border-border/40 bg-card p-12 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Enter a search term to find channels and streams
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card p-12 text-center">
              <p className="text-muted-foreground mb-4">
                No results found for "{query}"
              </p>
              {matchingCategory && (
                <Link
                  href={`/category/${matchingCategory.slug}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#3498db]/10 px-4 py-2 text-sm text-[#3498db] hover:bg-[#3498db]/20 transition-colors"
                >
                  Browse {matchingCategory.icon} {matchingCategory.name}
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((event) => (
                <Link
                  key={event.id}
                  href={`/watch/${event.id}`}
                  className="flex items-center gap-4 rounded-lg border border-border/30 bg-card/50 px-4 py-3 transition-all hover:bg-[#242442]/80 hover:border-border/60"
                >
                  <span className="flex h-2 w-2 shrink-0 rounded-full bg-live-red live-pulse" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-white line-clamp-1">
                      {event.title}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {event.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Eye className="h-3 w-3" />
                    {formatViewerCount(event.viewers)}
                  </span>
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
