"use client";

import Link from "next/link";
import { getCategories } from "@/lib/iptv";

export default function Footer() {
  const categories = getCategories();

  return (
    <footer className="border-t border-border/60 bg-[#0f0f1a]">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Sports
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="text-sm text-muted-foreground hover:text-white transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
          <p>Powered by iptv-org/iptv. This is a private dashboard for educational purposes.</p>
          <p className="mt-1">
            &copy; {new Date().getFullYear()} StreamTV Dashboard
          </p>
        </div>
      </div>
    </footer>
  );
}
