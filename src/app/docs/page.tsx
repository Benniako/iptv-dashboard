import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Code, BookOpen, Link2, Server } from "lucide-react";

export default function DocsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold text-white mb-2">API Documentation</h1>
          <p className="text-muted-foreground mb-8">
            Access IPTV channel data programmatically.
          </p>

          <div className="space-y-6">
            {/* Overview */}
            <div className="rounded-xl border border-border/40 bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-5 w-5 text-[#3498db]" />
                <h2 className="text-lg font-semibold text-white">Overview</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                StreamTV aggregates publicly available IPTV channel information from
                the iptv-org/iptv repository. This API provides access to channel
                listings, categories, and playlist files.
              </p>
            </div>

            {/* Base URL */}
            <div className="rounded-xl border border-border/40 bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Server className="h-5 w-5 text-[#3498db]" />
                <h2 className="text-lg font-semibold text-white">Base URL</h2>
              </div>
              <div className="rounded-lg bg-[#0a0a14] p-3">
                <code className="text-sm text-[#3498db]">
                  https://iptv-org.github.io/api/v2
                </code>
              </div>
            </div>

            {/* Endpoints */}
            <div className="rounded-xl border border-border/40 bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Code className="h-5 w-5 text-[#3498db]" />
                <h2 className="text-lg font-semibold text-white">Endpoints</h2>
              </div>
              <div className="space-y-4">
                <div className="rounded-lg border border-border/30 bg-[#0a0a14] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded bg-[#2ecc71]/10 px-2 py-0.5 text-xs font-mono text-[#2ecc71]">
                      GET
                    </span>
                    <code className="text-sm text-white">/channels.json</code>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Get all channels with optional filters.
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><span className="text-white">?category</span> - Filter by category (sports, news, etc.)</p>
                    <p><span className="text-white">?country</span> - Filter by country code</p>
                    <p><span className="text-white">?language</span> - Filter by language</p>
                    <p><span className="text-white">?name</span> - Search by name</p>
                    <p><span className="text-white">?limit</span> - Results limit (default 50)</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border/30 bg-[#0a0a14] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded bg-[#2ecc71]/10 px-2 py-0.5 text-xs font-mono text-[#2ecc71]">
                      GET
                    </span>
                    <code className="text-sm text-white">/categories.json</code>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get all available channel categories.
                  </p>
                </div>
              </div>
            </div>

            {/* Playlist URLs */}
            <div className="rounded-xl border border-border/40 bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Link2 className="h-5 w-5 text-[#3498db]" />
                <h2 className="text-lg font-semibold text-white">Playlists</h2>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-border/30 bg-[#0a0a14] p-3">
                  <p className="text-xs text-muted-foreground mb-1">Master playlist (all channels):</p>
                  <code className="text-sm text-[#3498db] break-all">
                    https://iptv-org.github.io/iptv/index.m3u
                  </code>
                </div>
                <div className="rounded-lg border border-border/30 bg-[#0a0a14] p-3">
                  <p className="text-xs text-muted-foreground mb-1">By category (example: sports):</p>
                  <code className="text-sm text-[#3498db] break-all">
                    https://iptv-org.github.io/iptv/categories/sports.m3u
                  </code>
                </div>
                <div className="rounded-lg border border-border/30 bg-[#0a0a14] p-3">
                  <p className="text-xs text-muted-foreground mb-1">By country (example: US):</p>
                  <code className="text-sm text-[#3498db] break-all">
                    https://iptv-org.github.io/iptv/countries/us.m3u
                  </code>
                </div>
              </div>
            </div>

            {/* Usage */}
            <div className="rounded-xl border border-border/40 bg-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Example Usage</h2>
              <div className="rounded-lg bg-[#0a0a14] p-4">
                <pre className="text-xs text-muted-foreground overflow-x-auto">
                  <code>{`// Fetch sports channels
fetch("https://iptv-org.github.io/api/v2/channels.json?category=sports&limit=10")
  .then(res => res.json())
  .then(data => console.log(data));

// Or use a playlist URL directly in your player:
// VLC, MPV, IPTV apps all support opening .m3u URLs`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
