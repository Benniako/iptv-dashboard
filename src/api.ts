import type {
  CatalogSource,
  Category,
  Channel,
  Country,
  DashboardData,
  Logo,
  SourceLoadResult,
  SportsEvent,
  SportsEventTeam,
  Stream,
  TrendingSportsData,
  WorldCupData
} from "./types";

const API_ROOT = "https://iptv-org.github.io/api";
const CACHE_PREFIX = "iptv-dashboard:";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const ESPN_SCOREBOARD_ROOT = "https://site.api.espn.com/apis/site/v2/sports";
const WORLD_CUP_START = "20260611";
const WORLD_CUP_FINAL = "20260719";
const TRENDING_SPORTS_CACHE_TTL_MS = 1000 * 60 * 5;
const TRENDING_LOOKAHEAD_DAYS = 10;

type TrendingSportSource = {
  id: string;
  path: string;
  sport: string;
  league: string;
  priority: number;
  maxEvents: number;
  dateRange?: "world-cup" | "lookahead";
  searchTerms: string[];
};

const TRENDING_SPORT_SOURCES: TrendingSportSource[] = [
  {
    id: "fifa-world-cup",
    path: "soccer/fifa.world",
    sport: "Soccer",
    league: "FIFA World Cup",
    priority: 115,
    maxEvents: 40,
    dateRange: "world-cup",
    searchTerms: ["World Cup", "FIFA", "FOX", "FS1", "Telemundo", "Universo"]
  },
  {
    id: "mlb",
    path: "baseball/mlb",
    sport: "Baseball",
    league: "MLB",
    priority: 74,
    maxEvents: 32,
    searchTerms: ["MLB", "MLB Network", "ESPN", "FOX Sports", "TBS"]
  },
  {
    id: "wnba",
    path: "basketball/wnba",
    sport: "Basketball",
    league: "WNBA",
    priority: 70,
    maxEvents: 24,
    searchTerms: ["WNBA", "NBA TV", "ESPN", "ABC", "CBS Sports"]
  },
  {
    id: "f1",
    path: "racing/f1",
    sport: "Racing",
    league: "Formula 1",
    priority: 86,
    maxEvents: 8,
    searchTerms: ["Formula 1", "F1", "F1 TV", "Sky Sports F1", "ESPN"]
  },
  {
    id: "ufc",
    path: "mma/ufc",
    sport: "Combat Sports",
    league: "UFC",
    priority: 82,
    maxEvents: 8,
    searchTerms: ["UFC", "MMA", "Fight Night", "ESPN", "DAZN"]
  },
  {
    id: "tennis-atp",
    path: "tennis/atp",
    sport: "Tennis",
    league: "ATP",
    priority: 64,
    maxEvents: 10,
    searchTerms: ["Tennis", "ATP", "Wimbledon", "Tennis Channel", "Eurosport"]
  },
  {
    id: "tennis-wta",
    path: "tennis/wta",
    sport: "Tennis",
    league: "WTA",
    priority: 64,
    maxEvents: 10,
    searchTerms: ["Tennis", "WTA", "Wimbledon", "Tennis Channel", "Eurosport"]
  },
  {
    id: "pga",
    path: "golf/pga",
    sport: "Golf",
    league: "PGA Tour",
    priority: 58,
    maxEvents: 8,
    searchTerms: ["Golf", "PGA", "Golf Channel", "CBS Sports", "NBC Sports"]
  },
  {
    id: "nascar",
    path: "racing/nascar-premier",
    sport: "Racing",
    league: "NASCAR",
    priority: 58,
    maxEvents: 8,
    searchTerms: ["NASCAR", "Racing", "FOX Sports", "NBC Sports", "FS1"]
  },
  {
    id: "nba",
    path: "basketball/nba",
    sport: "Basketball",
    league: "NBA",
    priority: 68,
    maxEvents: 16,
    searchTerms: ["NBA", "NBA TV", "ESPN", "TNT Sports", "ABC"]
  },
  {
    id: "nfl",
    path: "football/nfl",
    sport: "American Football",
    league: "NFL",
    priority: 68,
    maxEvents: 16,
    searchTerms: ["NFL", "NFL Network", "ESPN", "FOX Sports", "CBS Sports"]
  },
  {
    id: "nhl",
    path: "hockey/nhl",
    sport: "Hockey",
    league: "NHL",
    priority: 62,
    maxEvents: 16,
    searchTerms: ["NHL", "NHL Network", "ESPN", "TNT Sports", "Sportsnet"]
  }
];

const IPTV_ORG_SOURCE: CatalogSource = {
  id: "iptv-org",
  name: "IPTV Org",
  description: "Primary normalized channel database and stream catalog",
  homepage: "https://github.com/iptv-org/iptv",
  kind: "primary",
  defaultEnabled: true,
  ingestable: true
};

const PLAYLIST_SOURCES: Array<
  CatalogSource & { url: string; defaultCountry: string; sportsBiased?: boolean }
> = [
  {
    id: "free-tv",
    name: "Free-TV",
    description: "Curated free-TV M3U with additional regional public channels",
    homepage: "https://github.com/Free-TV/IPTV",
    url: "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8",
    kind: "curated",
    defaultEnabled: true,
    defaultCountry: "INT"
  },
  {
    id: "openiptvitaly",
    name: "OpenIPTV Italy",
    description: "Italian public channels, including Rai Sport and FIFA+",
    homepage: "https://github.com/xN1ckuz/OpenIPTVItaly",
    url: "https://raw.githubusercontent.com/xN1ckuz/OpenIPTVItaly/main/OpenIPTVItaly.m3u",
    kind: "regional",
    defaultEnabled: true,
    defaultCountry: "IT"
  },
  {
    id: "alplox-json-teles",
    name: "Alplox TV",
    description: "Public free-to-air M3U with additional Spanish-language channels",
    homepage: "https://github.com/Alplox/json-teles",
    url: "https://raw.githubusercontent.com/Alplox/json-teles/main/channels.m3u",
    kind: "curated",
    defaultEnabled: true,
    defaultCountry: "INT"
  },
  {
    id: "freeview-asia",
    name: "Freeview Asia",
    description: "Free-to-air Malaysia, Singapore, Indonesia and international channels",
    homepage: "https://github.com/leopard888/iptv-1",
    url: "https://raw.githubusercontent.com/leopard888/iptv-1/master/playlist/tv.m3u",
    kind: "regional",
    defaultEnabled: true,
    defaultCountry: "MY"
  },
  {
    id: "migu-sports",
    name: "Migu Sports",
    description: "Experimental sports-heavy public playlist with regional availability",
    homepage: "https://github.com/zhmzjj310144/migu-sports",
    url: "https://raw.githubusercontent.com/zhmzjj310144/migu-sports/main/migu_sports_stable.m3u",
    kind: "experimental",
    defaultEnabled: true,
    defaultCountry: "CN",
    sportsBiased: true
  },
  {
    id: "eja-tv",
    name: "eja.tv Sports",
    description: "Directory-pulled public sports channels from eja.tv via the local proxy",
    homepage: "http://eja.tv/?search=sport",
    url: "/api/directory/eja-tv.m3u?search=sport",
    kind: "experimental",
    defaultEnabled: true,
    defaultCountry: "INT",
    sportsBiased: true
  }
];

const DIRECTORY_SOURCES: CatalogSource[] = [
  {
    id: "awesome-iptv",
    name: "Awesome IPTV",
    description: "Reference list of IPTV tools, players, guides and public resources",
    homepage: "https://github.com/iptv-org/awesome-iptv",
    kind: "directory",
    defaultEnabled: false,
    ingestable: false
  },
  {
    id: "iptvcat",
    name: "IPTV Cat",
    description: "Public IPTV directory with searchable channel and playlist pages",
    homepage: "https://iptvcat.net/home_7",
    kind: "directory",
    defaultEnabled: false,
    ingestable: false
  },
  {
    id: "searchtv",
    name: "SearchTV",
    description: "Channel discovery portal for finding live TV pages by name",
    homepage: "https://searchtv.net/",
    kind: "directory",
    defaultEnabled: false,
    ingestable: false
  },
  {
    id: "vacotv",
    name: "Vaco TV",
    description: "Activation-code IPTV app source; open playlist with code 22455",
    homepage: "https://vacotv.org/how-to-use.html",
    kind: "directory",
    defaultEnabled: false,
    ingestable: false
  }
];

const sportsTerms = [
  "sport",
  "sports",
  "football",
  "soccer",
  "futbol",
  "fussball",
  "fifa",
  "world cup",
  "tennis",
  "wimbledon",
  "golf",
  "pga",
  "racing",
  "formula",
  "formula 1",
  "f1",
  "nascar",
  "motogp",
  "baseball",
  "mlb",
  "basketball",
  "nba",
  "wnba",
  "nfl",
  "nhl",
  "hockey",
  "ufc",
  "mma",
  "boxing",
  "fight night",
  "combat sports",
  "cricket",
  "rugby",
  "cycling",
  "tour de france",
  "espn",
  "espn2",
  "fox sports",
  "fs1",
  "fs2",
  "deportes",
  "futbol",
  "fútbol",
  "futgo",
  "red bull",
  "redbull",
  "rtm sports",
  "tnt sports",
  "tbs",
  "cbs sports",
  "nbc sports",
  "mlb network",
  "nba tv",
  "nfl network",
  "nhl network",
  "tennis channel",
  "golf channel",
  "f1 tv",
  "dazn",
  "bein",
  "eurosport",
  "sky sport",
  "sport1",
  "migu",
  "cctv5",
  "event"
];

type CacheEntry<T> = {
  savedAt: number;
  value: T;
};

async function loadJson<T>(name: string): Promise<T> {
  const cacheKey = `${CACHE_PREFIX}${name}`;
  const cached = readCache<T>(cacheKey);

  if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    const response = await fetch(`${API_ROOT}/${name}.json`, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`${name}.json returned ${response.status}`);
    }

    const value = (await response.json()) as T;
    writeCache(cacheKey, value);
    return value;
  } catch (error) {
    if (cached) {
      return cached.value;
    }
    throw error;
  }
}

function readCache<T>(cacheKey: string): CacheEntry<T> | null {
  try {
    const raw = window.localStorage.getItem(cacheKey);
    return raw ? (JSON.parse(raw) as CacheEntry<T>) : null;
  } catch {
    return null;
  }
}

function writeCache<T>(cacheKey: string, value: T): void {
  try {
    window.localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), value }));
  } catch {
    // The dashboard still works if storage is full or blocked.
  }
}

export async function loadDashboardData(): Promise<DashboardData> {
  const [channels, streams, logos, countries, categories] = await Promise.all([
    loadJson<Channel[]>("channels"),
    loadJson<Stream[]>("streams"),
    loadJson<Logo[]>("logos"),
    loadJson<Country[]>("countries"),
    loadJson<Category[]>("categories")
  ]);
  const normalizedCountries = withAdditionalCountries(countries);
  const external = await loadPlaylistSources(channels, streams, logos, normalizedCountries);

  return {
    channels: [...channels, ...external.channels],
    streams: [...streams, ...external.streams],
    logos: [...logos, ...external.logos],
    countries: normalizedCountries,
    categories,
    sources: [
      IPTV_ORG_SOURCE,
      ...PLAYLIST_SOURCES.map(({ url: _url, defaultCountry: _country, sportsBiased: _sports, ...source }) => source),
      ...DIRECTORY_SOURCES
    ],
    sourceLoadResults: [
      {
        id: IPTV_ORG_SOURCE.id,
        status: "primary",
        entries: channels.length,
        channelsAdded: channels.length,
        duplicates: 0,
        sportsEntries: channels.filter((channel) => channel.categories.includes("sports")).length
      },
      ...external.results,
      ...DIRECTORY_SOURCES.map((source) => ({
        id: source.id,
        status: "directory" as const,
        entries: 0,
        channelsAdded: 0,
        duplicates: 0,
        sportsEntries: 0,
        message: source.id === "vacotv" ? "Activation code 22455" : "Reference directory"
      }))
    ],
    loadedAt: new Date().toISOString()
  };
}

type ParsedM3uEntry = {
  title: string;
  url: string;
  group: string;
  logo: string;
  tvgId: string;
};

async function loadPlaylistSources(
  baseChannels: Channel[],
  baseStreams: Stream[],
  baseLogos: Logo[],
  countries: Country[]
): Promise<{
  channels: Channel[];
  streams: Stream[];
  logos: Logo[];
  results: SourceLoadResult[];
}> {
  const existingUrls = new Set(baseStreams.map((stream) => normalizeStreamUrl(stream.url)));
  const existingLogoChannels = new Set(baseLogos.map((logo) => logo.channel));
  const countryMap = buildCountryMap(countries);
  const channels: Channel[] = [];
  const streams: Stream[] = [];
  const logos: Logo[] = [];
  const results: SourceLoadResult[] = [];

  for (const source of PLAYLIST_SOURCES) {
    try {
      const text = await loadTextWithCache(`playlist:${source.id}`, source.url, CACHE_TTL_MS);
      const entries = parseM3u(text);
      let duplicates = 0;
      let sportsEntries = 0;
      let channelsAdded = 0;

      for (const entry of entries) {
        const normalizedUrl = normalizeStreamUrl(entry.url);
        if (!normalizedUrl) continue;
        if (existingUrls.has(normalizedUrl)) {
          duplicates += 1;
          continue;
        }

        const sportsEntry = isSportsEntry(entry, source.sportsBiased);
        if (sportsEntry) sportsEntries += 1;

        const id = buildSyntheticChannelId(source.id, entry, channelsAdded);
        const country = inferCountry(entry.group, source.defaultCountry, countryMap);
        const categories = sportsEntry ? ["sports"] : ["general"];
        const title = cleanTitle(entry.title || entry.tvgId || entry.group || source.name);

        channels.push({
          id,
          name: title,
          alt_names: entry.tvgId && entry.tvgId !== title ? [entry.tvgId] : [],
          network: source.name,
          owners: [source.name],
          country,
          categories,
          is_nsfw: false,
          launched: null,
          closed: null,
          replaced_by: null,
          website: source.homepage,
          source_id: source.id,
          source_name: source.name
        });

        streams.push({
          channel: id,
          feed: null,
          title,
          url: entry.url,
          referrer: null,
          user_agent: null,
          quality: inferQuality(title),
          label: source.kind === "experimental" ? "Experimental source" : null,
          source_id: source.id
        });

        if (entry.logo && !existingLogoChannels.has(id)) {
          logos.push({
            channel: id,
            feed: null,
            in_use: true,
            tags: [source.id],
            width: 0,
            height: 0,
            format: inferLogoFormat(entry.logo),
            url: entry.logo
          });
        }

        existingUrls.add(normalizedUrl);
        channelsAdded += 1;
      }

      results.push({
        id: source.id,
        status: "loaded",
        entries: entries.length,
        channelsAdded,
        duplicates,
        sportsEntries
      });
    } catch (error) {
      results.push({
        id: source.id,
        status: "error",
        entries: 0,
        channelsAdded: 0,
        duplicates: 0,
        sportsEntries: 0,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return { channels, streams, logos, results };
}

async function loadTextWithCache(cacheId: string, url: string, ttlMs: number): Promise<string> {
  const cacheKey = `${CACHE_PREFIX}${cacheId}`;
  const cached = readCache<string>(cacheKey);

  if (cached && Date.now() - cached.savedAt < ttlMs) {
    return cached.value;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.apple.mpegurl,text/plain,*/*"
      }
    });

    if (!response.ok) {
      throw new Error(`${url} returned ${response.status}`);
    }

    const text = await response.text();
    writeCache(cacheKey, text);
    return text;
  } catch (error) {
    if (cached) return cached.value;
    throw error;
  }
}

function parseM3u(text: string): ParsedM3uEntry[] {
  const lines = text.split(/\r?\n/);
  const entries: ParsedM3uEntry[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line.startsWith("#EXTINF")) continue;

    const attrs = parseM3uAttributes(line);
    const title = cleanTitle(line.split(",").slice(1).join(",") || attrs["tvg-name"] || "");
    let url = "";

    for (let lookahead = index + 1; lookahead < Math.min(lines.length, index + 8); lookahead += 1) {
      const candidate = lines[lookahead].trim();
      if (candidate && !candidate.startsWith("#")) {
        url = candidate;
        break;
      }
    }

    if (!/^https?:\/\//i.test(url)) continue;

    entries.push({
      title,
      url,
      group: attrs["group-title"] ?? "",
      logo: attrs["tvg-logo"] ?? "",
      tvgId: attrs["tvg-id"] ?? ""
    });
  }

  return entries;
}

function parseM3uAttributes(line: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const matcher = /([\w:-]+)="([^"]*)"/g;
  let match = matcher.exec(line);

  while (match) {
    attrs[match[1]] = match[2];
    match = matcher.exec(line);
  }

  return attrs;
}

function isSportsEntry(entry: ParsedM3uEntry, sportsBiased = false): boolean {
  const value = normalizeText(`${entry.title} ${entry.group} ${entry.tvgId} ${entry.url}`);
  if (sportsBiased && /cctv5|sport|sports|event|migu/.test(value)) return true;
  return sportsTerms.some((term) => value.includes(term));
}

function inferCountry(group: string, fallback: string, countryMap: Map<string, string>): string {
  const normalized = normalizeText(group);
  if (!normalized) return fallback;
  return countryMap.get(normalized) ?? countryAliases[normalized] ?? fallback;
}

function buildCountryMap(countries: Country[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const country of countries) {
    map.set(normalizeText(country.name), country.code);
    map.set(normalizeText(country.code), country.code);
  }
  Object.entries(countryAliases).forEach(([name, code]) => map.set(name, code));
  return map;
}

function withAdditionalCountries(countries: Country[]): Country[] {
  const additions: Country[] = [{ code: "INT", name: "International" }];
  const existing = new Set(countries.map((country) => country.code));
  return [...countries, ...additions.filter((country) => !existing.has(country.code))];
}

const countryAliases: Record<string, string> = {
  usa: "US",
  us: "US",
  "united states": "US",
  uk: "UK",
  "united kingdom": "UK",
  russia: "RU",
  "south korea": "KR",
  "czech republic": "CZ"
};

function buildSyntheticChannelId(sourceId: string, entry: ParsedM3uEntry, index: number): string {
  const seed = `${sourceId}:${entry.tvgId}:${entry.title}:${entry.url}:${index}`;
  return `${sourceId}.${hashString(seed)}`;
}

function hashString(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

function normalizeStreamUrl(value: string): string {
  return value.trim();
}

function cleanTitle(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function inferQuality(value: string): string | null {
  const match = value.match(/\b(2160p|1080p|720p|576p|480p|360p)\b/i);
  return match ? match[1].toLowerCase() : null;
}

function inferLogoFormat(value: string): string | null {
  const match = value.match(/\.(svg|png|jpe?g|webp|gif|avif)(?:\?|$)/i);
  return match ? match[1].replace("jpg", "JPEG").replace("jpeg", "JPEG").toUpperCase() : null;
}

type EspnScoreboard = {
  events?: EspnEvent[];
};

type EspnEvent = {
  id?: string;
  name?: string;
  shortName?: string;
  date?: string;
  status?: {
    type?: {
      state?: string;
      description?: string;
    };
  };
  links?: Array<{ href?: string; rel?: string[]; text?: string }>;
  competitions?: Array<{
    altGameNote?: string;
    notes?: Array<{ headline?: string }>;
    venue?: {
      fullName?: string;
      address?: {
        city?: string;
      };
    };
    status?: {
      type?: {
        state?: string;
        description?: string;
      };
    };
    broadcasts?: Array<{ names?: string[] }>;
    competitors?: EspnCompetitor[];
  }>;
};

type EspnCompetitor = {
  homeAway?: string;
  displayName?: string;
  team?: EspnParticipant;
  athlete?: EspnParticipant;
};

type EspnParticipant = {
  abbreviation?: string;
  displayName?: string;
  shortDisplayName?: string;
  logo?: string;
  logos?: Array<{ href?: string }>;
};

type TrendingSportLoadResult = {
  source: TrendingSportSource;
  events: SportsEvent[];
  error?: string;
};

export async function loadTrendingSportsData(): Promise<TrendingSportsData> {
  const cacheKey = `${CACHE_PREFIX}trending-sports-v2`;
  const cached = readCache<TrendingSportsData>(cacheKey);

  if (cached && Date.now() - cached.savedAt < TRENDING_SPORTS_CACHE_TTL_MS) {
    return cached.value;
  }

  const loaded = await Promise.all(TRENDING_SPORT_SOURCES.map(loadTrendingSportSource));
  const events = loaded
    .flatMap((result) => result.events)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date) || b.priority - a.priority);
  const errors = loaded
    .filter((result) => result.error)
    .map((result) => ({
      id: result.source.id,
      name: result.source.league,
      message: result.error ?? "Failed to load"
    }));

  if (!events.length && cached) {
    return cached.value;
  }

  const data: TrendingSportsData = {
    events,
    loadedAt: new Date().toISOString(),
    source: "ESPN",
    errors
  };

  writeCache(cacheKey, data);
  return data;
}

export async function loadWorldCupData(): Promise<WorldCupData> {
  return loadTrendingSportsData();
}

async function loadTrendingSportSource(source: TrendingSportSource): Promise<TrendingSportLoadResult> {
  try {
    const response = await fetch(
      `${ESPN_SCOREBOARD_ROOT}/${source.path}/scoreboard?dates=${buildEspnDateRange(source)}&limit=200`,
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`${source.league} schedule returned ${response.status}`);
    }

    const raw = (await response.json()) as EspnScoreboard;
    const events = (raw.events ?? [])
      .map((event) => parseSportsEvent(event, source))
      .filter((event): event is SportsEvent => Boolean(event))
      .filter((event) => event.statusState !== "post")
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
      .slice(0, source.maxEvents);

    return { source, events };
  } catch (error) {
    return {
      source,
      events: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function parseSportsEvent(event: EspnEvent, source: TrendingSportSource): SportsEvent | null {
  if (!event.id || !event.date) return null;

  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const home = competitors.find((competitor) => competitor.homeAway === "home") ?? competitors[1];
  const away = competitors.find((competitor) => competitor.homeAway === "away") ?? competitors[0];
  const status = competition?.status?.type ?? event.status?.type;
  const sourceUrl = event.links?.find((link) => link.rel?.includes("summary"))?.href ?? event.links?.[0]?.href ?? null;
  const name = cleanTitle(event.name?.replace(" at ", " vs ") ?? event.shortName ?? `${source.league} event`);
  const shortName = cleanTitle(event.shortName?.replace(" @ ", " vs ") ?? name);
  const stage = cleanTitle(
    competition?.altGameNote?.replace("FIFA World Cup, ", "") ??
      competition?.notes?.find((note) => note.headline)?.headline ??
      source.league
  );
  const broadcasters = Array.from(
    new Set((competition?.broadcasts ?? []).flatMap((broadcast) => broadcast.names ?? []))
  ).slice(0, 6);

  return {
    id: `${source.id}:${event.id}`,
    name,
    shortName,
    date: event.date,
    stage,
    venue: competition?.venue?.fullName ?? "Venue TBD",
    city: competition?.venue?.address?.city ?? "City TBD",
    status: status?.description ?? "Scheduled",
    statusState: status?.state ?? "pre",
    broadcasters,
    home: parseSportsTeam(home, source),
    away: parseSportsTeam(away, source),
    sourceUrl,
    sport: source.sport,
    league: source.league,
    leagueId: source.id,
    priority: source.priority,
    searchTerms: buildSportsEventSearchTerms(source, name, shortName, broadcasters)
  };
}

function parseSportsTeam(competitor: EspnCompetitor | undefined, source: TrendingSportSource): SportsEventTeam {
  const participant = competitor?.team ?? competitor?.athlete;
  const name = participant?.displayName ?? participant?.shortDisplayName ?? competitor?.displayName ?? "TBD";
  const abbreviation = participant?.abbreviation ?? participant?.shortDisplayName ?? source.sport;

  return {
    name,
    abbreviation,
    logo: participant?.logo ?? participant?.logos?.find((logo) => logo.href)?.href ?? null,
    placeholder: isPlaceholderTeam(name, abbreviation)
  };
}

function isPlaceholderTeam(name: string, abbreviation: string): boolean {
  return /winner|loser|group|round|third place|quarterfinal|semifinal|tbd/i.test(
    `${name} ${abbreviation}`
  );
}

function buildSportsEventSearchTerms(
  source: TrendingSportSource,
  name: string,
  shortName: string,
  broadcasters: string[]
): string[] {
  return Array.from(new Set([...source.searchTerms, source.league, source.sport, name, shortName, ...broadcasters]));
}

function buildEspnDateRange(source: TrendingSportSource): string {
  if (source.dateRange === "world-cup") {
    return buildWorldCupRange();
  }

  const now = new Date();
  return `${formatEspnDate(now)}-${formatEspnDate(addDays(now, TRENDING_LOOKAHEAD_DAYS))}`;
}

function buildWorldCupRange(): string {
  const now = new Date();
  const today = formatEspnDate(now);
  const start = today < WORLD_CUP_START ? WORLD_CUP_START : today;
  return `${start}-${WORLD_CUP_FINAL}`;
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function formatEspnDate(value: Date): string {
  return `${value.getFullYear()}${pad2(value.getMonth() + 1)}${pad2(value.getDate())}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
