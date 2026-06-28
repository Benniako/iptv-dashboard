import type { Category, LiveEvent, ScheduleEvent, Channel, StreamSource, GuideEntry } from "@/types";
import { cacheGet, cacheSet } from "./utils";

// IPTV-org API base
const API_BASE = "https://iptv-org.github.io/api";

// ---------------------------------------------------------------------------
// Mock fallback data — preserved for offline use
// ---------------------------------------------------------------------------

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

const CATEGORY_ICONS: Record<string, string> = {
  auto: "🏎️",
  animation: "🎬",
  business: "💼",
  classic: "🎭",
  comedy: "😂",
  cooking: "🍳",
  culture: "🎨",
  documentary: "🎥",
  education: "📚",
  entertainment: "🎉",
  family: "👨‍👩‍👧‍👦",
  fashion: "👗",
  food: "🍽️",
  general: "📺",
  health: "💪",
  history: "📜",
  hobby: "🎯",
  kids: "🧸",
  lifestyle: "🌿",
  movies: "🎬",
  music: "🎵",
  news: "📰",
  religion: "⛪",
  science: "🔬",
  series: "📺",
  shopping: "🛍️",
  sports: "⚽",
  tech: "💻",
  travel: "✈️",
  weather: "🌤️",
};

// ---------------------------------------------------------------------------
// Synchronous functions (existing signatures preserved)
// ---------------------------------------------------------------------------

export function getCategories(): Category[] {
  return CATEGORIES;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getPopularLive(): LiveEvent[] {
  return [
    {
      id: "1", title: "North Queensland Cowboys vs Penrith Panthers",
      category: "Rugby", categorySlug: "rugby", viewers: 397,
      startTime: "7:30 AM", channel: "Fox Sports",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", live: true,
    },
    {
      id: "2", title: "Formula 3: Austria - R5 | Formula 2: Austria - R6 🏁",
      category: "Motor Sports", categorySlug: "motor-sports", viewers: 163,
      startTime: "8:00 AM", channel: "ESPN",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", live: true,
    },
    {
      id: "3", title: "Collingwood Magpies vs Richmond Tigers",
      category: "AFL", categorySlug: "afl", viewers: 89,
      startTime: "6:15 AM", channel: "Fox Footy",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", live: true,
    },
    {
      id: "4", title: "World Rally Championship Greece 🏁",
      category: "Motor Sports", categorySlug: "motor-sports", viewers: 72,
      startTime: "5:30 AM", channel: "WRC+",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", live: true,
    },
    {
      id: "5", title: "Dolphins vs New Zealand Warriors",
      category: "Rugby", categorySlug: "rugby", viewers: 145,
      startTime: "5:00 AM", channel: "Sky Sport NZ",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", live: true,
    },
    {
      id: "6", title: "ONE Fight Night 44: Jarvis v Rungrawee II",
      category: "Fight", categorySlug: "fight", viewers: 234,
      startTime: "2:00 AM", channel: "ONE Championship",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", live: true,
    },
    {
      id: "7", title: "Fury Challenger Series 16",
      category: "Fight", categorySlug: "fight", viewers: 56,
      startTime: "2:00 AM", channel: "UFC Fight Pass",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", live: true,
    },
    {
      id: "8", title: "Cage Fury FC 156",
      category: "Fight", categorySlug: "fight", viewers: 41,
      startTime: "2:00 AM", channel: "Cage Fury",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", live: true,
    },
    {
      id: "9", title: "BKFC Fight Night: Vancamp v Cisneros",
      category: "Fight", categorySlug: "fight", viewers: 33,
      startTime: "2:00 AM", channel: "BKFC",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", live: true,
    },
    {
      id: "10", title: "Philadelphia 76ers vs Boston Celtics",
      category: "Basketball", categorySlug: "basketball", viewers: 512,
      startTime: "8:30 PM", channel: "TNT",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", live: true,
    },
  ];
}

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

/** Returns empty array — replaced by getGuideForChannel() */
export function getSchedule(): ScheduleEvent[] {
  return [];
}

export function getPlaylistUrl(category?: string): string {
  const base = "https://iptv-org.github.io/iptv";
  if (category && CATEGORY_MAP[category]) {
    return `${base}/categories/${CATEGORY_MAP[category]}.m3u`;
  }
  return `${base}/index.m3u`;
}

// ---------------------------------------------------------------------------
// Async API functions with caching
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Categories (async)
// ---------------------------------------------------------------------------

/**
 * Fetch real categories from iptv-org API.
 * Falls back to mock CATEGORIES array on failure.
 * Cache: 24 hours.
 */
export async function fetchCategories(): Promise<Category[]> {
  const cacheKey = "categories";
  const cached = cacheGet<Category[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}/categories.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw: { id: string; name: string; description: string }[] = await res.json();

    const categories: Category[] = raw.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.id,
      count: 0,
      icon: CATEGORY_ICONS[c.id] || "📺",
    }));

    cacheSet(cacheKey, categories, 24 * 60 * 60 * 1000);
    return categories;
  } catch {
    return CATEGORIES;
  }
}

// ---------------------------------------------------------------------------
// Live Events
// ---------------------------------------------------------------------------

/**
 * Fetch live events by combining channels.json and streams.json.
 * Falls back to getPopularLive() mock data on failure.
 * Cache: 1 hour.
 */
export async function getLiveEvents(): Promise<LiveEvent[]> {
  const cacheKey = "live_events";
  const cached = cacheGet<LiveEvent[]>(cacheKey);
  if (cached) return cached;

  try {
    const [channels, streams] = await Promise.all([
      fetch(`${API_BASE}/channels.json`),
      fetch(`${API_BASE}/streams.json`),
    ]);

    if (!channels.ok || !streams.ok) throw new Error("Failed to fetch data");

    const channelsData: any[] = await channels.json();
    const streamsData: any[] = await streams.json();

    const channelMap = new Map<string, any>();
    for (const ch of channelsData) {
      channelMap.set(ch.id, ch);
    }

    const events: LiveEvent[] = [];
    const seenChannels = new Set<string>();

    for (const stream of streamsData) {
      if (!stream.channel) continue;
      if (seenChannels.has(stream.channel)) continue;
      seenChannels.add(stream.channel);

      const ch = channelMap.get(stream.channel);
      const categoryRaw = ch?.categories?.[0] || "general";
      const categoryName = categoryRaw.charAt(0).toUpperCase() + categoryRaw.slice(1);

      events.push({
        id: stream.channel,
        title: stream.title || ch?.name || stream.channel,
        category: categoryName,
        categorySlug: categoryRaw,
        viewers: Math.floor(Math.random() * 500) + 10,
        startTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        channel: ch?.name || stream.channel,
        streamUrl: stream.url,
        live: true,
      });

      if (events.length >= 100) break;
    }

    cacheSet(cacheKey, events, 60 * 60 * 1000);
    return events;
  } catch {
    return getPopularLive();
  }
}

// ---------------------------------------------------------------------------
// Channels by category
// ---------------------------------------------------------------------------

/**
 * Fetch channels from iptv-org and filter by category.
 * Cache: 1 hour.
 */
export async function fetchChannelsByCategory(category: string): Promise<Channel[]> {
  const cacheKey = `channels_${category}`;
  const cached = cacheGet<Channel[]>(cacheKey);
  if (cached) return cached;

  try {
    const mappedCategory = CATEGORY_MAP[category] || category;
    const res = await fetch(`${API_BASE}/channels.json`);
    if (!res.ok) throw new Error("Failed to fetch channels");
    const data: any[] = await res.json();

    const filtered = data.filter(
      (ch: any) =>
        ch.categories &&
        ch.categories.some(
          (cat: string) => cat === mappedCategory || cat === category
        )
    );

    const channels: Channel[] = filtered.slice(0, 50).map((ch: any) => ({
      id: ch.id,
      name: ch.name,
      logo: `https://raw.githubusercontent.com/iptv-org/iptv/master/logos/${ch.id}.png`,
      url: "",
      category: ch.categories?.[0] || category,
      country: ch.country || undefined,
      language: undefined,
      live: true,
      viewers: Math.floor(Math.random() * 500) + 10,
    }));

    cacheSet(cacheKey, channels, 60 * 60 * 1000);
    return channels;
  } catch {
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

// ---------------------------------------------------------------------------
// Stream sources (real API)
// ---------------------------------------------------------------------------

/**
 * Fetch stream sources for a specific channel from streams.json.
 */
export async function getStreamSourcesForEvent(eventId: string): Promise<StreamSource[]> {
  const cacheKey = "stream_sources_all";
  const cached = cacheGet<any[]>(cacheKey);
  let streams: any[] = cached ?? [];

  if (streams.length === 0) {
    try {
      const res = await fetch(`${API_BASE}/streams.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      streams = await res.json();
      cacheSet(cacheKey, streams, 60 * 60 * 1000);
    } catch {
      streams = [];
    }
  }

  return streams
    .filter((s: any) => s.channel === eventId)
    .map((s: any) => ({
      channel: s.channel,
      url: s.url,
      quality: s.quality || undefined,
      label: s.label || undefined,
      referrer: s.referrer || undefined,
      user_agent: s.user_agent || undefined,
    }));
}

// ---------------------------------------------------------------------------
// Guide / EPG
// ---------------------------------------------------------------------------

/**
 * Fetch guide (EPG) entries for a channel.
 * Cache: 30 minutes.
 */
export async function getGuideForChannel(channelId: string): Promise<GuideEntry[]> {
  const cacheKey = `guide_${channelId}`;
  const cached = cacheGet<GuideEntry[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `${API_BASE}/guides.json?channel=${encodeURIComponent(channelId)}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();

    // If the response is too large, fall back to empty
    if (text.length > 5_000_000) {
      cacheSet(cacheKey, [], 30 * 60 * 1000);
      return [];
    }

    const all: GuideEntry[] = JSON.parse(text);
    const filtered = all.filter((g) => g.channel === channelId);

    cacheSet(cacheKey, filtered, 30 * 60 * 1000);
    return filtered;
  } catch {
    cacheSet(cacheKey, [], 30 * 60 * 1000);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Search channels from iptv-org by name or category.
 * Cache: 1 hour.
 */
export async function searchChannels(query: string): Promise<Channel[]> {
  if (!query.trim()) return [];

  const cacheKey = `search_${query.toLowerCase().replace(/\s+/g, "_")}`;
  const cached = cacheGet<Channel[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}/channels.json`);
    if (!res.ok) throw new Error("Failed to search");
    const data: any[] = await res.json();

    const q = query.toLowerCase();
    const filtered = data.filter(
      (ch: any) =>
        ch.name?.toLowerCase().includes(q) ||
        (ch.categories &&
          ch.categories.some((cat: string) => cat.toLowerCase().includes(q))) ||
        (ch.country && ch.country.toLowerCase().includes(q))
    );

    const channels: Channel[] = filtered.slice(0, 50).map((ch: any) => ({
      id: ch.id,
      name: ch.name,
      logo: `https://raw.githubusercontent.com/iptv-org/iptv/master/logos/${ch.id}.png`,
      url: "",
      category: ch.categories?.[0] || "Other",
      country: ch.country || undefined,
      language: undefined,
      live: true,
    }));

    cacheSet(cacheKey, channels, 60 * 60 * 1000);
    return channels;
  } catch {
    return [];
  }
}
