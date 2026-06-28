"use client";

import { useState, useEffect } from "react";
import { Shield, Save, RotateCcw } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { cacheClear } from "@/lib/utils";

const DNS_PROVIDERS = [
  { name: "ControlD", primary: "76.76.2.0", backup: "76.76.10.0" },
  { name: "AdGuard DNS", primary: "94.140.14.14", backup: "94.140.15.15" },
  { name: "Cloudflare", primary: "1.1.1.1", backup: "1.0.0.1" },
  { name: "Google DNS", primary: "8.8.8.8", backup: "8.8.4.4" },
];

export default function SettingsPage() {
  const [dnsProvider, setDnsProvider] = useState("ControlD");
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("streamtv_smart_dns");
    if (stored) {
      try {
        const config = JSON.parse(stored);
        setDnsProvider(config.provider || "ControlD");
        setProxyEnabled(config.proxyEnabled || false);
      } catch { /* ignore */ }
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem("streamtv_smart_dns", JSON.stringify({
      provider: dnsProvider,
      proxyEnabled,
      timestamp: Date.now(),
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearCache = () => {
    cacheClear();
    alert("Cache cleared!");
  };

  const provider = DNS_PROVIDERS.find(p => p.name === dnsProvider) || DNS_PROVIDERS[0];

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>

          {/* Smart DNS Section */}
          <section className="rounded-xl border border-border/40 bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5 text-[#3498db]" />
              <h2 className="text-lg font-semibold text-white">Smart DNS</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">DNS Provider</label>
                <select
                  value={dnsProvider}
                  onChange={(e) => setDnsProvider(e.target.value)}
                  className="w-full rounded-lg border border-border bg-[#1a1a2e] px-3 py-2 text-sm text-white"
                >
                  {DNS_PROVIDERS.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-[#1a1a2e] p-3">
                  <p className="text-xs text-muted-foreground">Primary DNS</p>
                  <p className="text-sm font-mono text-white mt-1">{provider.primary}</p>
                </div>
                <div className="rounded-lg bg-[#1a1a2e] p-3">
                  <p className="text-xs text-muted-foreground">Backup DNS</p>
                  <p className="text-sm font-mono text-white mt-1">{provider.backup}</p>
                </div>
              </div>

              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                <p className="text-xs text-yellow-400">
                  💡 To apply these DNS settings, run the setup script as Administrator.
                </p>
                <code className="block mt-1 text-xs text-muted-foreground font-mono">
                  scripts/set-dns-control-d.ps1
                </code>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="proxy"
                  checked={proxyEnabled}
                  onChange={(e) => setProxyEnabled(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="proxy" className="text-sm text-white">
                  Route streams through server proxy (bypasses geo-restrictions)
                </label>
              </div>

              {proxyEnabled && (
                <div className="rounded-lg bg-[#3498db]/10 border border-[#3498db]/20 p-3">
                  <p className="text-xs text-[#3498db]">
                    When enabled, stream URLs will be fetched through the Next.js server
                    instead of directly from the browser. This helps bypass network-level blocks.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Cache Section */}
          <section className="rounded-xl border border-border/40 bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <RotateCcw className="h-5 w-5 text-[#3498db]" />
              <h2 className="text-lg font-semibold text-white">Cache</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Channel data and EPG guide are cached to improve performance.
            </p>
            <button
              onClick={handleClearCache}
              className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Clear All Cache
            </button>
          </section>

          {/* Save */}
          <button
            onClick={saveSettings}
            className="flex items-center gap-2 rounded-lg bg-[#3498db] px-6 py-3 text-sm font-medium text-white hover:bg-[#3498db]/90 transition-colors"
          >
            <Save className="h-4 w-4" />
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
