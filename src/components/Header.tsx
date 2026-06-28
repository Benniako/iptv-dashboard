"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Tv, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import SmartDnsStatus from "./SmartDnsStatus";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/guide", label: "Guide" },
  { href: "/favorites", label: "Favorites" },
  { href: "/multiview", label: "Multi Stream" },
  { href: "/settings", label: "Settings" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-[#0f0f1a]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-white shrink-0">
          <Tv className="h-5 w-5 text-[#3498db]" />
          <span className="text-lg tracking-tight">Stream<span className="text-[#3498db]">TV</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 ml-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-white hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden sm:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-56 rounded-lg border border-border bg-[#1a1a2e] pl-9 pr-3 text-sm text-white placeholder:text-muted-foreground focus:border-[#3498db] focus:outline-none focus:ring-1 focus:ring-[#3498db]/30 transition-colors"
            />
          </div>
        </form>

        {/* Action Links */}
        <div className="hidden md:flex items-center gap-2">
          <SmartDnsStatus />
          <a
            href="https://discord.gg/KHC4xTYZgv"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
          >
            Discord
          </a>
          <Link
            href="/docs"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
          >
            API
          </Link>
          <a
            href="https://status.strmd.link"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
          >
            Status
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-white"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/60 bg-[#0f0f1a] px-4 pb-4 pt-2">
          <form onSubmit={handleSearch} className="mb-3 sm:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-[#1a1a2e] pl-9 pr-3 text-sm text-white placeholder:text-muted-foreground focus:border-[#3498db] focus:outline-none focus:ring-1 focus:ring-[#3498db]/30 transition-colors"
              />
            </div>
          </form>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-border/60" />
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
            >
              Settings
            </Link>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
            >
              API
            </Link>
            <a
              href="https://discord.gg/KHC4xTYZgv"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
            >
              Discord
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
