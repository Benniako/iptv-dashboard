import type { Category, LiveEvent, ScheduleEvent, Channel } from "@/types";

// IPTV-org API base
const API_BASE = "https://iptv-org.github.io/api/v2";

const CATEGORIES: Category[] = [
  { id: "1", name: "Basketball", slug: "basketball", count: 0, icon: "🏀" },
  { id: "2", name: "Football", slug: "football", count: 0, icon: "⚽" },
  { id: "3", name: "American Football", slug: "american-football", count: 0, icon: "🏈" },
  { id: "4", name: "Hockey", slug: "hockey", count: 0, icon: "🏒" },
  { id: "5", name: "Baseball", slug: "baseball", count: 0, icon: "⚾" },
  { id: "6", name: "Motor Sports", slug: "motor-sports", count: 0, icon: "🏎️" },
  { id: "7", name: "Fight", slug: "fight", count: 0, icon: "🥊" },
  { id: "8", name: "Tennis", slug: "tennis", count: 0, icon: "🎾" },
  { id: "9", name: "Rugby", slug: "rugby", count: 0, icon: "🏉" },
  { id: "10", name: "Golf", slug: "golf", count: 0, icon: "⛳" },
  { id: "11", name: "Billiards", slug: "billiards", count: 0, icon: "🎱" },
  { id: "12", name: "AFL", slug: "afl", count: 0, icon: "🏏" },
  { id: "13", name: "Darts", slug: "darts", count: 0, icon: "🎯" },
  { id: "14", name: "Cricket", slug: "cricket", count: 0, icon: "🏏" },
  { id: "15", name: "Other", slug: "other", count: 0, icon: "📺" },
];

const CATEGORY_MAP: Record<string, string> = {
  basketball: "sports",
  football: "sports",
  "american-football": "sports",
  hockey: "sports",
  baseball: "sports",
  "motor-sports": "sports",
  fight: "sports",
  tennis: "sports",
  rugby: "sports",
  golf: "sports",
  billiards: "sports",
  afl: "sports",
  darts: "sports",
  cricket: "sports",
  other: "other",
  news: "news",
  entertainment: "entertainment",
  music: "music",
  documentary: "documentary",
};

export function getCategories(): Category[] {
  return CATEGORIES;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

// Mock live events for the dashboard
// These simulate what streamed.pk shows
export function getPopularLive(): LiveEvent[] {
  return [
    {
      id: "1",
      title: "North Queensland Cowboys vs Penrith Panthers",
      category: "Rugby",
      categorySlug: "rugby",
      viewers: 397,
      startTime: "7:30 AM",
      channel: "Fox Sports",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      live: true,
    },
    {
      id: "2",
      title: "Formula 3: Austria - R5 | Formula 2: Austria - R6 🏁",
      category: "Motor Sports",
      categorySlug: "motor-sports",
      viewers: 163,
      startTime: "8:00 AM",
      channel: "ESPN",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      live: true,
    },
    {
      id: "3",
      title: "Collingwood Magpies vs Richmond Tigers",
      category: "AFL",
      categorySlug: "afl",
      viewers: 89,
      startTime: "6:15 AM",
      channel: "Fox Footy",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      live: true,
    },
    {
      id: "4",
      title: "World Rally Championship Greece 🏁",
      category: "Motor Sports",
      categorySlug: "motor-sports",
      viewers: 72,
      startTime: "5:30 AM",
      channel: "WRC+",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      live: true,
    },
    {
      id: "5",
      title: "Dolphins vs New Zealand Warriors",
      category: "Rugby",
      categorySlug: "rugby",
      viewers: 145,
      startTime: "5:00 AM",
      channel: "Sky Sport NZ",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      live: true,
    },
    {
      id: "6",
      title: "ONE Fight Night 44: Jarvis v Rungrawee II",
      category: "Fight",
      categorySlug: "fight",
      viewers: 234,
      startTime: "2:00 AM",
      channel: "ONE Championship",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      live: true,
    },
    {
      id: "7",
      title: "Fury Challenger Series 16",
      category: "Fight",
      categorySlug: "fight",
      viewers: 56,
      startTime: "2:00 AM",
      channel: "UFC Fight Pass",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      live: true,
    },
    {
      id: "8",
      title: "Cage Fury FC 156",
      category: "Fight",
      categorySlug: "fight",
      viewers: 41,
      startTime: "2:00 AM",
      channel: "Cage Fury",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      live: true,
    },
    {
      id: "9",
      title: "BKFC Fight Night: Vancamp v Cisneros",
      category: "Fight",
      categorySlug: "fight",
      viewers: 33,
      startTime: "2:00 AM",
      channel: "BKFC",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      live: true,
    },
    {
      id: "10",
      title: "Philadelphia 76ers vs Boston Celtics",
      category: "Basketball",
      categorySlug: "basketball",
      viewers: 512,
      startTime: "8:30 PM",
      channel: "TNT",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      live: true,
    },
  ];
}

// Get stream links for a specific event
export function getStreamSources(eventId: string): { name: string; quality: string; lag: string }[] {
  const sources: Record<string, { name: string; quality: string; lag: string }[]> = {
    "1": [
      { name: "Fox Sports HD", quality: "1080p", lag: "5s" },
      { name: "Fox Sports SD", quality: "720p", lag: "3s" },
      { name: "Kayo Sports", quality: "1080p", lag: "8s" },
    ],
    "2": [
      { name: "ESPN HD", quality: "1080p", lag: "4s" },
      { name: "ESPN 2", quality: "720p", lag: "2s" },
      { name: "F1 TV Pro", quality: "4K", lag: "10s" },
    ],
    "3": [
      { name: "Fox Footy HD", quality: "1080p", lag: "6s" },
      { name: "Fox Footy SD", quality: "720p", lag: "3s" },
      { name: "AFL Live Pass", quality: "1080p", lag: "12s" },
    ],
    "4": [
      { name: "WRC+ HD", quality: "1080p", lag: "15s" },
      { name: "Red Bull TV", quality: "720p", lag: "5s" },
      { name: "ESPN Extra", quality: "720p", lag: "4s" },
    ],
    "5": [
      { name: "Sky Sport NZ HD", quality: "1080p", lag: "5s" },
      { name: "Sky Sport NZ SD", quality: "720p", lag: "3s" },
      { name: "RugbyPass", quality: "1080p", lag: "7s" },
    ],
    "6": [
      { name: "ONE HD", quality: "1080p", lag: "5s" },
      { name: "YouTube PPV", quality: "720p", lag: "8s" },
      { name: "Watch Party", quality: "720p", lag: "12s" },
    ],
    "7": [
      { name: "UFC Fight Pass HD", quality: "1080p", lag: "4s" },
      { name: "UFC Fight Pass SD", quality: "720p", lag: "2s" },
    ],
    "8": [
      { name: "Cage Fury TV", quality: "1080p", lag: "3s" },
      { name: "Fight Network", quality: "720p", lag: "5s" },
    ],
    "9": [
      { name: "BKFC App", quality: "1080p", lag: "6s" },
      { name: "BKFC SD", quality: "720p", lag: "3s" },
    ],
    "10": [
      { name: "TNT HD", quality: "1080p", lag: "5s" },
      { name: "TNT 4K", quality: "4K", lag: "15s" },
      { name: "NBA League Pass", quality: "1080p", lag: "8s" },
      { name: "ESPN Alternate", quality: "720p", lag: "3s" },
    ],
  };
  return sources[eventId] || [
    { name: "Stream HD", quality: "1080p", lag: "5s" },
    { name: "Stream SD", quality: "720p", lag: "3s" },
    { name: "Backup Stream", quality: "480p", lag: "2s" },
  ];
}

export function getSchedule(): ScheduleEvent[] {
  return [
    {
      id: "s1",
      title: "NBA: Lakers vs Warriors",
      category: "Basketball",
      startTime: "2026-06-27 8:00 PM",
      channel: "ESPN",
    },
    {
      id: "s2",
      title: "Premier League: Arsenal vs Chelsea",
      category: "Football",
      startTime: "2026-06-28 3:00 PM",
      channel: "Sky Sports",
    },
    {
      id: "s3",
      title: "NFL: Chiefs vs 49ers",
      category: "American Football",
      startTime: "2026-06-29 1:00 PM",
      channel: "NFL Network",
    },
    {
      id: "s4",
      title: "Wimbledon Final 2026",
      category: "Tennis",
      startTime: "2026-07-02 2:00 PM",
      channel: "BBC Sport",
    },
    {
      id: "s5",
      title: "UFC 320: Main Card",
      category: "Fight",
      startTime: "2026-07-01 10:00 PM",
      channel: "ESPN+ PPV",
    },
  ];
}

// Fetch channels from iptv-org by category
export async function fetchChannelsByCategory(
  category: string
): Promise<Channel[]> {
  try {
    const mappedCategory = CATEGORY_MAP[category] || category;
    const res = await fetch(
      `${API_BASE}/channels.json?category=${mappedCategory}&limit=50`
    );
    if (!res.ok) throw new Error("Failed to fetch channels");
    const data = await res.json();
    return data.map((ch: any) => ({
      id: ch.id,
      name: ch.name,
      logo: ch.logo,
      url: ch.url?.[0] || "",
      category: ch.categories?.[0]?.name || category,
      country: ch.country?.name,
      language: ch.languages?.[0]?.name,
      live: true,
      viewers: Math.floor(Math.random() * 500) + 10,
    }));
  } catch {
    // Return filtered mock data as fallback
    const allLive = getPopularLive();
    return allLive
      .filter((e) => e.categorySlug === category)
      .map((e) => ({
        id: e.id,
        name: e.title,
        url: e.streamUrl,
        category: e.category,
        live: true,
        viewers: e.viewers,
      }));
  }
}

// Get M3U playlist URL for a category
export function getPlaylistUrl(category?: string): string {
  const base = "https://iptv-org.github.io/iptv";
  if (category && CATEGORY_MAP[category]) {
    return `${base}/categories/${CATEGORY_MAP[category]}.m3u`;
  }
  return `${base}/index.m3u`;
}

// Search channels from iptv-org
export async function searchChannels(query: string): Promise<Channel[]> {
  try {
    const res = await fetch(
      `${API_BASE}/channels.json?name=${encodeURIComponent(query)}&limit=20`
    );
    if (!res.ok) throw new Error("Failed to search");
    const data = await res.json();
    return data.map((ch: any) => ({
      id: ch.id,
      name: ch.name,
      logo: ch.logo,
      url: ch.url?.[0] || "",
      category: ch.categories?.[0]?.name || "Other",
      country: ch.country?.name,
      language: ch.languages?.[0]?.name,
      live: true,
    }));
  } catch {
    return [];
  }
}
