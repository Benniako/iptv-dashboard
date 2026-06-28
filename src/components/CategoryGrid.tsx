"use client";

import Link from "next/link";
import { getCategories } from "@/lib/iptv";

export default function CategoryGrid() {
  const categories = getCategories();

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-6 text-2xl font-bold text-white"># Sports</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card p-5 transition-all duration-200 hover:bg-[#242442] hover:border-[#3498db]/40 hover:scale-[1.02]"
            >
              <span className="mb-2 text-3xl">{cat.icon}</span>
              <span className="text-sm font-medium text-white group-hover:text-[#3498db] transition-colors text-center">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
