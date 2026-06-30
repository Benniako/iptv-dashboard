import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Hls from "hls.js";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  CircleOff,
  Clock3,
  Copy,
  Database,
  ExternalLink,
  Flame,
  Globe2,
  Image,
  ListFilter,
  Loader2,
  MapPin,
  Play,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Tv,
  Wifi
} from "lucide-react";
import { loadDashboardData, loadTrendingSportsData } from "./api";
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
  TrendingSportsData
} from "./types";

type LoadState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; message: string };

type StatusFilter = "all" | "streamed" | "missing" | "open" | "closed";
type SafetyFilter = "all" | "sfw" | "nsfw";
type SortMode = "event" | "name" | "streams" | "country" | "launched";
type ContentFocus = "events" | "all";
type ChannelSearchHandler = (term: string, event?: SportsEvent) => void;

type ChannelSearchContext = {
  query: string;
  broadcaster: string;
  eventName: string;
  sport: string;
  league: string;
  sourceUrl: string | null;
  terms: string[];
};

type DashboardModel = {
  streamMap: Map<string, Stream[]>;
  logoMap: Map<string, Logo>;
  countryMap: Map<string, Country>;
  categoryMap: Map<string, Category>;
  countryCounts: Array<{ code: string; name: string; count: number }>;
  categoryCounts: Array<{ id: string; name: string; count: number }>;
  sportsEventScoreMap: Map<string, number>;
  sportsEventChannelCount: number;
  sportsEventStreamedChannelCount: number;
  streamedChannelCount: number;
  logoChannelCount: number;
  orphanStreamCount: number;
  closedChannelCount: number;
  nsfwChannelCount: number;
  labeledStreamCount: number;
  headerStreamCount: number;
};

type SportsLoadState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; message: string };

const ROW_HEIGHT = 88;
const LIST_WINDOW_HEIGHT = 632;
const numberFormat = new Intl.NumberFormat("en-US");
const nameSort = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
const matchTimeFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});
const shortTimeFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});
const broadcastShortcuts = [
  "ESPN",
  "ESPN2",
  "ABC",
  "CBS Sports",
  "NBC Sports",
  "TNT Sports",
  "TBS",
  "FOX",
  "FS1",
  "FS2",
  "Fox Sports",
  "Deportes",
  "MLB Network",
  "NBA TV",
  "WNBA",
  "NFL Network",
  "NHL Network",
  "Formula 1",
  "F1 TV",
  "Sky Sports F1",
  "UFC",
  "MMA",
  "Tennis Channel",
  "Wimbledon",
  "Golf Channel",
  "Red Bull TV",
  "RTM Sports",
  "TSN",
  "DAZN",
  "Eurosport",
  "beIN Sports",
  "Telemundo",
  "Universo"
];
const sportsEventTerms = [
  "sports",
  "sport",
  "football",
  "soccer",
  "futbol",
  "fussball",
  "world cup",
  "fifa",
  "uefa",
  "champions league",
  "olympic",
  "formula",
  "formula 1",
  "f1",
  "racing",
  "motorsport",
  "nascar",
  "motogp",
  "tennis",
  "wimbledon",
  "golf",
  "pga",
  "cricket",
  "rugby",
  "baseball",
  "basketball",
  "hockey",
  "nba",
  "wnba",
  "nfl",
  "mlb",
  "nhl",
  "mma",
  "ufc",
  "boxing",
  "wrestling",
  "espn",
  "espn2",
  "fox sports",
  "fs1",
  "fs2",
  "fox deportes",
  "deportes",
  "futgo",
  "red bull",
  "redbull",
  "rtm sports",
  "universo",
  "telemundo",
  "tudn",
  "bein",
  "dazn",
  "eurosport",
  "sky sport",
  "sport1",
  "supersport",
  "sport tv",
  "sportsnet",
  "tnt sports",
  "tbs",
  "mlb network",
  "nba tv",
  "nfl network",
  "nhl network",
  "tennis channel",
  "golf channel",
  "f1 tv",
  "arena sport",
  "sportklub",
  "viaplay",
  "tsn",
  "rds",
  "premier sports",
  "events",
  "event"
].map(normalize);

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [trendingSportsData, setTrendingSportsData] = useState<TrendingSportsData | null>(null);
  const [trendingSportsState, setTrendingSportsState] = useState<SportsLoadState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [channelSearchContext, setChannelSearchContext] = useState<ChannelSearchContext | null>(null);
  const [activeSourceIds, setActiveSourceIds] = useState<Set<string> | null>(null);
  const [contentFocus, setContentFocus] = useState<ContentFocus>("events");
  const [countryFilter, setCountryFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("streamed");
  const [safetyFilter, setSafetyFilter] = useState<SafetyFilter>("sfw");
  const [sortMode, setSortMode] = useState<SortMode>("event");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedStreamIndex, setSelectedStreamIndex] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;

    loadDashboardData()
      .then((nextData) => {
        if (!alive) return;
        setData(nextData);
        setLoadState({ status: "ready" });
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setLoadState({
          status: "error",
          message: error instanceof Error ? error.message : String(error)
        });
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    loadTrendingSportsData()
      .then((nextData) => {
        if (!alive) return;
        setTrendingSportsData(nextData);
        setTrendingSportsState({ status: "ready" });
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setTrendingSportsState({
          status: "error",
          message: error instanceof Error ? error.message : String(error)
        });
      });

    return () => {
      alive = false;
    };
  }, []);

  const model = useMemo(() => (data ? buildModel(data) : null), [data]);
  const defaultSourceIds = useMemo(
    () =>
      new Set(
        data?.sources
          .filter((source) => source.ingestable !== false)
          .map((source) => source.id) ?? []
      ),
    [data]
  );
  const activeSourceIdList = useMemo(() => {
    if (!data) return [];
    return Array.from(activeSourceIds ?? defaultSourceIds).sort();
  }, [activeSourceIds, data, defaultSourceIds]);
  const activeSourceSet = useMemo(() => new Set(activeSourceIdList), [activeSourceIdList]);
  const activeSourceKey = activeSourceIdList.join("|");

  const filteredChannels = useMemo(() => {
    if (!data || !model) return [];
    const normalizedQuery = normalize(query);

    const filtered = data.channels.filter((channel) => {
      const streamCount = model.streamMap.get(channel.id)?.length ?? 0;
      const sportsEventScore = model.sportsEventScoreMap.get(channel.id) ?? 0;
      const sourceId = getChannelSourceId(channel);

      if (!activeSourceSet.has(sourceId)) return false;
      if (contentFocus === "events" && sportsEventScore <= 0) return false;
      if (countryFilter !== "all" && channel.country !== countryFilter) return false;
      if (categoryFilter !== "all" && !channel.categories.includes(categoryFilter)) return false;
      if (statusFilter === "streamed" && streamCount === 0) return false;
      if (statusFilter === "missing" && streamCount > 0) return false;
      if (statusFilter === "open" && channel.closed) return false;
      if (statusFilter === "closed" && !channel.closed) return false;
      if (safetyFilter === "sfw" && channel.is_nsfw) return false;
      if (safetyFilter === "nsfw" && !channel.is_nsfw) return false;

      if (!normalizedQuery) return true;

      return getSearchText(channel).includes(normalizedQuery);
    });

    return filtered.sort((a, b) => {
      if (channelSearchContext) {
        const contextDiff =
          getChannelSearchContextScore(b, model.streamMap.get(b.id) ?? [], channelSearchContext) -
          getChannelSearchContextScore(a, model.streamMap.get(a.id) ?? [], channelSearchContext);
        if (contextDiff !== 0) return contextDiff;
      }

      if (sortMode === "event") {
        const eventScoreDiff =
          (model.sportsEventScoreMap.get(b.id) ?? 0) - (model.sportsEventScoreMap.get(a.id) ?? 0);
        if (eventScoreDiff !== 0) return eventScoreDiff;

        const streamDiff =
          (model.streamMap.get(b.id)?.length ?? 0) - (model.streamMap.get(a.id)?.length ?? 0);
        if (streamDiff !== 0) return streamDiff;
      }

      if (sortMode === "streams") {
        const streamDiff =
          (model.streamMap.get(b.id)?.length ?? 0) - (model.streamMap.get(a.id)?.length ?? 0);
        if (streamDiff !== 0) return streamDiff;
      }

      if (sortMode === "country") {
        const countryA = model.countryMap.get(a.country)?.name ?? a.country;
        const countryB = model.countryMap.get(b.country)?.name ?? b.country;
        const countryDiff = nameSort.compare(countryA, countryB);
        if (countryDiff !== 0) return countryDiff;
      }

      if (sortMode === "launched") {
        const dateDiff = dateRank(b.launched) - dateRank(a.launched);
        if (dateDiff !== 0) return dateDiff;
      }

      return nameSort.compare(a.name, b.name);
    });
  }, [
    activeSourceKey,
    activeSourceSet,
    categoryFilter,
    channelSearchContext,
    contentFocus,
    countryFilter,
    data,
    model,
    query,
    safetyFilter,
    sortMode,
    statusFilter
  ]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
    setScrollTop(0);
  }, [activeSourceKey, categoryFilter, contentFocus, countryFilter, query, safetyFilter, sortMode, statusFilter]);

  useEffect(() => {
    if (filteredChannels.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !filteredChannels.some((channel) => channel.id === selectedId)) {
      setSelectedId(filteredChannels[0].id);
    }
  }, [filteredChannels, selectedId]);

  useEffect(() => {
    setSelectedStreamIndex(0);
  }, [selectedId]);

  const selectedChannel = useMemo(() => {
    if (!data || !selectedId) return null;
    return data.channels.find((channel) => channel.id === selectedId) ?? null;
  }, [data, selectedId]);

  const visibleRows = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 6);
    const visibleCount = Math.ceil(LIST_WINDOW_HEIGHT / ROW_HEIGHT) + 12;
    const end = Math.min(filteredChannels.length, start + visibleCount);

    return {
      channels: filteredChannels.slice(start, end),
      top: start * ROW_HEIGHT,
      bottom: Math.max(0, (filteredChannels.length - end) * ROW_HEIGHT)
    };
  }, [filteredChannels, scrollTop]);

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(label);
    } catch {
      setCopyStatus("Clipboard blocked");
    }

    window.setTimeout(() => setCopyStatus(""), 1600);
  }

  function refreshData() {
    try {
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith("iptv-dashboard:"))
        .forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // Ignore storage failures and reload anyway.
    }

    window.location.reload();
  }

  function jumpToChannelSearch(term: string, event?: SportsEvent) {
    const normalizedTerm = normalizeBroadcaster(term);

    setContentFocus("events");
    setQuery(normalizedTerm);
    setChannelSearchContext(event ? buildChannelSearchContext(normalizedTerm, event) : null);
    setCountryFilter("all");
    setCategoryFilter("all");
    setStatusFilter("streamed");
    setSafetyFilter("sfw");
    listRef.current?.scrollTo({ top: 0 });
    window.setTimeout(() => {
      document.querySelector(".toolbar")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function toggleSource(sourceId: string) {
    setActiveSourceIds((current) => {
      const next = new Set(current ?? defaultSourceIds);
      if (next.has(sourceId) && next.size > 1) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }
      return next;
    });
  }

  function resetSources() {
    setActiveSourceIds(null);
  }

  if (loadState.status === "loading" || !data || !model) {
    return (
      <main className="app-shell loading-shell">
        <div className="loading-panel">
          <Loader2 className="spin" size={30} aria-hidden="true" />
          <h1>IPTV Dashboard</h1>
          <p>Loading IPTV Org datasets</p>
        </div>
      </main>
    );
  }

  if (loadState.status === "error") {
    return (
      <main className="app-shell loading-shell">
        <div className="loading-panel error-panel">
          <AlertTriangle size={32} aria-hidden="true" />
          <h1>IPTV Dashboard</h1>
          <p>{loadState.message}</p>
          <button className="primary-action" type="button" onClick={refreshData}>
            <RefreshCw size={17} aria-hidden="true" />
            Reload
          </button>
        </div>
      </main>
    );
  }

  const selectedStreams = selectedChannel ? model.streamMap.get(selectedChannel.id) ?? [] : [];
  const activeStream = selectedStreams[selectedStreamIndex] ?? selectedStreams[0];
  const selectedLogo = selectedChannel ? model.logoMap.get(selectedChannel.id) : undefined;
  const totalChannels = data.channels.length;
  const focusedChannelCount =
    contentFocus === "events" ? model.sportsEventChannelCount : totalChannels;
  const focusedStreamedCount =
    contentFocus === "events" ? model.sportsEventStreamedChannelCount : model.streamedChannelCount;
  const logoCoverage = Math.round((model.logoChannelCount / totalChannels) * 100);
  const streamCoverage = Math.round((focusedStreamedCount / Math.max(focusedChannelCount, 1)) * 100);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">iptv-org live catalog</p>
          <h1>IPTV Dashboard</h1>
        </div>
        <div className="topbar-actions">
          {copyStatus ? <span className="copy-toast">{copyStatus}</span> : null}
          <button className="icon-action" type="button" onClick={refreshData} title="Refresh data">
            <RefreshCw size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="metrics" aria-label="Catalog metrics">
        <Metric
          icon={contentFocus === "events" ? <Trophy size={20} /> : <Database size={20} />}
          label={contentFocus === "events" ? "Sports/event" : "Channels"}
          value={formatNumber(focusedChannelCount)}
        />
        <Metric
          icon={<Wifi size={20} />}
          label="Streamed"
          value={`${formatNumber(focusedStreamedCount)} (${streamCoverage}%)`}
          tone="teal"
        />
        <Metric
          icon={<Image size={20} />}
          label="Logo coverage"
          value={`${formatNumber(model.logoChannelCount)} (${logoCoverage}%)`}
          tone="blue"
        />
        <Metric
          icon={<ShieldAlert size={20} />}
          label="Flagged"
          value={formatNumber(model.labeledStreamCount + model.headerStreamCount)}
          tone="coral"
        />
      </section>

      <TrendingSportsPanel
        data={trendingSportsData}
        state={trendingSportsState}
        onChannelSearch={jumpToChannelSearch}
      />

      <SourceRegistryPanel
        sources={data.sources}
        results={data.sourceLoadResults}
        activeSourceIds={activeSourceSet}
        onToggleSource={toggleSource}
        onResetSources={resetSources}
      />

      <section className="toolbar" aria-label="Dashboard filters">
        <label className="select-control focus-control">
          <Trophy size={17} aria-hidden="true" />
          <select
            value={contentFocus}
            onChange={(event) => setContentFocus(event.target.value as ContentFocus)}
            aria-label="Content focus"
          >
            <option value="events">Sports & events</option>
            <option value="all">All channels</option>
          </select>
        </label>

        <div className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setChannelSearchContext(null);
            }}
            placeholder="Search channel, network, owner, ID"
            aria-label="Search channels"
          />
        </div>

        <label className="select-control">
          <Globe2 size={17} aria-hidden="true" />
          <select
            value={countryFilter}
            onChange={(event) => setCountryFilter(event.target.value)}
            aria-label="Country"
          >
            <option value="all">All countries</option>
            {model.countryCounts.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name} ({country.count})
              </option>
            ))}
          </select>
        </label>

        <label className="select-control">
          <ListFilter size={17} aria-hidden="true" />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Category"
          >
            <option value="all">All categories</option>
            {model.categoryCounts.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.count})
              </option>
            ))}
          </select>
        </label>

        <label className="select-control">
          <Radio size={17} aria-hidden="true" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            aria-label="Stream status"
          >
            <option value="all">All statuses</option>
            <option value="streamed">With streams</option>
            <option value="missing">No streams</option>
            <option value="open">Open channels</option>
            <option value="closed">Closed channels</option>
          </select>
        </label>

        <label className="select-control">
          <ShieldAlert size={17} aria-hidden="true" />
          <select
            value={safetyFilter}
            onChange={(event) => setSafetyFilter(event.target.value as SafetyFilter)}
            aria-label="Safety"
          >
            <option value="sfw">SFW only</option>
            <option value="all">All safety</option>
            <option value="nsfw">NSFW only</option>
          </select>
        </label>

        <label className="select-control">
          <SlidersHorizontal size={17} aria-hidden="true" />
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            aria-label="Sort"
          >
            <option value="event">Sports relevance</option>
            <option value="streams">Most streams</option>
            <option value="name">Name</option>
            <option value="country">Country</option>
            <option value="launched">Launch date</option>
          </select>
        </label>
      </section>

      <section className="dashboard-grid">
        <div className="catalog-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{contentFocus === "events" ? "sports catalog" : "catalog"}</p>
              <h2>
                {formatNumber(filteredChannels.length)}{" "}
                {contentFocus === "events" ? "sports/event channels" : "channels"}
              </h2>
            </div>
            <BarChart3 size={21} aria-hidden="true" />
          </div>

          {channelSearchContext ? (
            <div className="event-search-note">
              <Badge tone="blue">{channelSearchContext.broadcaster}</Badge>
              <span>
                {channelSearchContext.eventName}: channel feeds can differ from the live tournament schedule.
              </span>
              {channelSearchContext.sourceUrl ? (
                <a href={channelSearchContext.sourceUrl} target="_blank" rel="noreferrer">
                  Event info
                </a>
              ) : null}
            </div>
          ) : null}

          {filteredChannels.length ? (
            <div
              className="channel-list"
              ref={listRef}
              onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
              style={{ height: LIST_WINDOW_HEIGHT }}
            >
              <div style={{ height: visibleRows.top }} />
              {visibleRows.channels.map((channel) => {
                const streams = model.streamMap.get(channel.id) ?? [];
                return (
                  <ChannelRow
                    key={channel.id}
                    channel={channel}
                    logo={model.logoMap.get(channel.id)}
                    streams={streams}
                    sportsEventScore={model.sportsEventScoreMap.get(channel.id) ?? 0}
                    sourceName={channel.source_name ?? "IPTV Org"}
                    countryName={model.countryMap.get(channel.country)?.name ?? channel.country}
                    selected={channel.id === selectedId}
                    onSelect={() => setSelectedId(channel.id)}
                  />
                );
              })}
              <div style={{ height: visibleRows.bottom }} />
            </div>
          ) : (
            <div className="empty-state">
              <CircleOff size={28} aria-hidden="true" />
              <p>
                {contentFocus === "events"
                  ? "No sports or event channels match the current filters"
                  : "No channels match the current filters"}
              </p>
            </div>
          )}
        </div>

        <aside className="detail-panel">
          {selectedChannel ? (
            <>
              <div className="detail-identity">
                <ChannelLogo channel={selectedChannel} logo={selectedLogo} size="large" />
                <div>
                  <p className="eyebrow">
                    {model.countryMap.get(selectedChannel.country)?.name ?? selectedChannel.country}
                  </p>
                  <h2>{selectedChannel.name}</h2>
                  <p className="muted">{selectedChannel.id}</p>
                </div>
              </div>

              <div className="badge-row">
                {selectedChannel.closed ? <Badge tone="muted">Closed</Badge> : <Badge>Open</Badge>}
                {selectedChannel.is_nsfw ? <Badge tone="coral">NSFW</Badge> : <Badge tone="teal">SFW</Badge>}
                <Badge tone="blue">{selectedStreams.length} streams</Badge>
              </div>

              <div className="detail-actions">
                {selectedChannel.website ? (
                  <a className="secondary-action" href={selectedChannel.website} target="_blank" rel="noreferrer">
                    <ExternalLink size={16} aria-hidden="true" />
                    Website
                  </a>
                ) : null}
                <button
                  className="secondary-action"
                  type="button"
                  disabled={selectedStreams.length === 0}
                  onClick={() =>
                    copyText(buildM3u(selectedChannel, selectedStreams, selectedLogo), "M3U copied")
                  }
                >
                  <Copy size={16} aria-hidden="true" />
                  M3U
                </button>
                {activeStream ? (
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => copyText(activeStream.url, "URL copied")}
                  >
                    <Copy size={16} aria-hidden="true" />
                    URL
                  </button>
                ) : null}
              </div>

              <div className="field-grid">
                <Field label="Network" value={selectedChannel.network || "Unknown"} />
                <Field
                  label="Categories"
                  value={
                    selectedChannel.categories
                      .map((category) => model.categoryMap.get(category)?.name ?? titleCase(category))
                      .join(", ") || "Uncategorized"
                  }
                />
                <Field label="Launched" value={selectedChannel.launched || "Unknown"} />
                <Field label="Owners" value={selectedChannel.owners.join(", ") || "Unknown"} />
              </div>

              <div className="stream-picker">
                <div className="section-label">
                  <Play size={16} aria-hidden="true" />
                  <span>Stream preview</span>
                </div>
                {selectedStreams.length > 1 ? (
                  <select
                    value={selectedStreamIndex}
                    onChange={(event) => setSelectedStreamIndex(Number(event.target.value))}
                    aria-label="Select stream"
                  >
                    {selectedStreams.map((stream, index) => (
                      <option key={`${stream.url}-${index}`} value={index}>
                        {stream.title || stream.url}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>

              <StreamPlayer
                stream={activeStream}
                hasNextStream={selectedStreams.length > 1}
                onNextStream={() => setSelectedStreamIndex((selectedStreamIndex + 1) % selectedStreams.length)}
              />

              <div className="stream-list">
                {selectedStreams.length ? (
                  selectedStreams.slice(0, 6).map((stream, index) => (
                    <button
                      key={`${stream.url}-${index}`}
                      className={`stream-row ${index === selectedStreamIndex ? "is-active" : ""}`}
                      type="button"
                      onClick={() => setSelectedStreamIndex(index)}
                    >
                      <span>{stream.title || selectedChannel.name}</span>
                      <small>
                        {stream.quality || "unknown"} {stream.label ? `- ${stream.label}` : ""}
                      </small>
                    </button>
                  ))
                ) : (
                  <div className="empty-state compact">
                    <CircleOff size={24} aria-hidden="true" />
                    <p>No linked stream</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <CircleOff size={28} aria-hidden="true" />
              <p>No channel selected</p>
            </div>
          )}
        </aside>
      </section>

      <section className="insight-grid" aria-label="Data health">
        <InsightPanel
          title="Top Countries"
          icon={<Globe2 size={19} />}
          rows={model.countryCounts.slice(0, 8).map((country) => ({
            label: country.name,
            value: country.count
          }))}
        />
        <InsightPanel
          title="Top Categories"
          icon={<Tv size={19} />}
          rows={model.categoryCounts.slice(0, 8).map((category) => ({
            label: category.name,
            value: category.count
          }))}
        />
        <div className="health-panel">
          <div className="panel-heading small">
            <div>
              <p className="eyebrow">data health</p>
              <h2>Failure points</h2>
            </div>
            <AlertTriangle size={19} aria-hidden="true" />
          </div>
          <HealthRow label="Channels without streams" value={totalChannels - model.streamedChannelCount} />
          <HealthRow label="Channels without logos" value={totalChannels - model.logoChannelCount} />
          <HealthRow label="Orphan streams" value={model.orphanStreamCount} />
          <HealthRow label="Closed channels" value={model.closedChannelCount} />
          <HealthRow label="NSFW channels" value={model.nsfwChannelCount} />
          <HealthRow label="Geo/header-labeled streams" value={model.labeledStreamCount + model.headerStreamCount} />
        </div>
      </section>
    </main>
  );
}

function TrendingSportsPanel({
  data,
  state,
  onChannelSearch
}: {
  data: TrendingSportsData | null;
  state: SportsLoadState;
  onChannelSearch: ChannelSearchHandler;
}) {
  const events = data?.events ?? [];
  const liveEventCount = events.filter((event) => event.statusState === "in").length;
  const nextEvent = events.find((event) => Date.parse(event.date) >= Date.now()) ?? events[0];
  const hotEvents = useMemo(() => buildHotEvents(events), [events]);
  const sportCount = new Set(events.map((event) => event.sport)).size;
  const nextLeague = nextEvent?.league ?? "Loading";

  return (
    <section className="world-cup-panel trending-sports-panel" aria-label="Trending sports events">
      <div className="world-cup-hero">
        <div className="world-cup-title">
          <span className="cup-mark">
            <Trophy size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">trending sports command center</p>
            <h2>Hot events across live sports</h2>
          </div>
        </div>
        <div className="cup-stats">
          <CupStat icon={<CalendarDays size={17} />} label="Events loaded" value={String(events.length)} />
          <CupStat
            icon={<Clock3 size={17} />}
            label={liveEventCount ? "Live now" : "Next event"}
            value={liveEventCount ? `${liveEventCount} events` : nextEvent ? formatShortDate(nextEvent.date) : "Loading"}
          />
          <CupStat icon={<BadgeCheck size={17} />} label="Sports" value={sportCount ? `${sportCount} active` : nextLeague} />
        </div>
      </div>

      <div className="world-cup-content">
        <div className="hot-events">
          <div className="section-heading">
            <div className="section-label">
              <Flame size={16} aria-hidden="true" />
              <span>Hot across sports</span>
            </div>
            {data?.loadedAt ? <span className="freshness">Updated {formatShortDate(data.loadedAt)}</span> : null}
          </div>

          {state.status === "loading" ? (
            <div className="cup-loading">
              <Loader2 className="spin" size={22} aria-hidden="true" />
              <span>Loading live sports schedule</span>
            </div>
          ) : null}

          {state.status === "error" ? (
            <div className="cup-alert">
              <AlertTriangle size={18} aria-hidden="true" />
              <span>{state.message}</span>
            </div>
          ) : null}

          {hotEvents.length ? (
            <div className="hot-card-grid">
              {hotEvents.map((event) => (
                <HotEventCard key={event.id} event={event} onChannelSearch={onChannelSearch} />
              ))}
            </div>
          ) : state.status !== "loading" ? (
            <div className="empty-state compact">
              <CircleOff size={24} aria-hidden="true" />
              <p>No trending sports events found</p>
            </div>
          ) : null}

          <div className="broadcast-strip" aria-label="Broadcast channel shortcuts">
            <span>
              <Sparkles size={15} aria-hidden="true" />
              Find channels
            </span>
            {broadcastShortcuts.map((term) => (
              <button key={term} type="button" onClick={() => onChannelSearch(term)}>
                {term}
              </button>
            ))}
          </div>
        </div>

        <div className="fixture-panel">
          <div className="section-heading">
            <div className="section-label">
              <CalendarDays size={16} aria-hidden="true" />
              <span>Live and upcoming</span>
            </div>
            <span className="fixture-count">{events.length}</span>
          </div>

          <div className="fixture-list">
            {events.map((event) => (
              <FixtureRow key={event.id} event={event} onChannelSearch={onChannelSearch} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SourceRegistryPanel({
  sources,
  results,
  activeSourceIds,
  onToggleSource,
  onResetSources
}: {
  sources: CatalogSource[];
  results: SourceLoadResult[];
  activeSourceIds: Set<string>;
  onToggleSource: (sourceId: string) => void;
  onResetSources: () => void;
}) {
  const resultMap = new Map(results.map((result) => [result.id, result]));

  return (
    <section className="source-registry-panel" aria-label="Channel sources">
      <div className="source-registry-heading">
        <div>
          <p className="eyebrow">channel sources</p>
          <h2>Curated playlists and source directories</h2>
        </div>
        <button className="secondary-action" type="button" onClick={onResetSources}>
          <RefreshCw size={15} aria-hidden="true" />
          Defaults
        </button>
      </div>

      <div className="source-card-grid">
        {sources.map((source) => {
          const result = resultMap.get(source.id);
          const ingestable = source.ingestable !== false;
          const active = ingestable && activeSourceIds.has(source.id);
          const error = result?.status === "error";
          const className = `source-card source-${source.kind} ${active ? "is-active" : ""} ${
            error ? "has-error" : ""
          } ${ingestable ? "" : "is-directory"}`;
          const content = (
            <>
              <span className="source-card-top">
                <strong>{source.name}</strong>
                <Badge tone={getSourceKindTone(source.kind)}>{source.kind}</Badge>
              </span>
              <span className="source-description">{source.description}</span>
              <span className={`source-meta ${ingestable ? "" : "source-meta-link"}`}>
                {ingestable ? (
                  formatSourceMeta(result, error)
                ) : (
                  <>
                    <ExternalLink size={14} aria-hidden="true" />
                    {result?.message ?? "Reference directory"}
                  </>
                )}
              </span>
            </>
          );

          if (!ingestable) {
            return (
              <a
                key={source.id}
                className={className}
                href={source.homepage}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${source.name}`}
              >
                {content}
              </a>
            );
          }

          return (
            <button
              key={source.id}
              type="button"
              className={className}
              onClick={() => onToggleSource(source.id)}
              aria-label={`${active ? "Disable" : "Enable"} ${source.name}`}
              aria-pressed={active}
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function formatSourceMeta(result: SourceLoadResult | undefined, error: boolean): string {
  if (error) return result?.message ?? "Failed to load";
  return `${formatNumber(result?.channelsAdded ?? 0)} channels - ${formatNumber(result?.sportsEntries ?? 0)} sports`;
}

function getSourceKindTone(kind: CatalogSource["kind"]): "default" | "teal" | "blue" | "coral" | "muted" {
  if (kind === "primary") return "blue";
  if (kind === "experimental") return "coral";
  if (kind === "directory") return "muted";
  return "teal";
}

function HotEventCard({
  event,
  onChannelSearch
}: {
  event: SportsEvent;
  onChannelSearch: ChannelSearchHandler;
}) {
  const heat = getEventHeat(event);
  const searchButtons = getEventSearchButtons(event, 3);
  const hasMatchup = hasEventMatchup(event);

  return (
    <article className={`hot-event-card heat-${heat.tone}`}>
      <div className="event-topline">
        <Badge tone={heat.badgeTone}>{heat.label}</Badge>
        <span>{formatMatchDate(event.date)}</span>
      </div>
      {hasMatchup ? (
        <div className="matchup">
          <TeamPill team={event.away} />
          <span className="versus">vs</span>
          <TeamPill team={event.home} />
        </div>
      ) : (
        <div className="event-title-block">
          <strong>{event.shortName}</strong>
          <span>{event.league}</span>
        </div>
      )}
      <p className="event-stage">
        {event.sport} / {event.league} - {event.stage}
      </p>
      <p className="event-venue">
        <MapPin size={14} aria-hidden="true" />
        {event.venue}, {event.city}
      </p>
      <div className="event-actions">
        {searchButtons.map((name) => (
          <button key={name} type="button" onClick={() => onChannelSearch(name, event)}>
            {name}
          </button>
        ))}
      </div>
    </article>
  );
}

function FixtureRow({
  event,
  onChannelSearch
}: {
  event: SportsEvent;
  onChannelSearch: ChannelSearchHandler;
}) {
  const heat = getEventHeat(event);
  const searchButtons = getEventSearchButtons(event, 2);

  return (
    <div className="fixture-row">
      <div className="fixture-time">
        <strong>{formatShortDate(event.date)}</strong>
        <span>{event.league}</span>
      </div>
      <div className="fixture-match">
        <span>{event.name}</span>
        <small>
          {event.sport} - {event.stage} - {event.venue}, {event.city}
        </small>
      </div>
      <div className="fixture-broadcasts">
        <Badge tone={heat.badgeTone}>{heat.shortLabel}</Badge>
        {searchButtons.map((name) => (
          <button key={name} type="button" onClick={() => onChannelSearch(name, event)}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

function TeamPill({ team }: { team: SportsEventTeam }) {
  return (
    <span className={`team-pill ${team.placeholder ? "is-placeholder" : ""}`}>
      {team.logo && !team.placeholder ? <img src={team.logo} alt="" loading="lazy" /> : null}
      <span>{team.abbreviation}</span>
    </span>
  );
}

function CupStat({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="cup-stat">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildHotEvents(events: SportsEvent[]): SportsEvent[] {
  const ranked = events
    .map((event) => ({ event, score: getHeatScore(event) }))
    .sort((a, b) => b.score - a.score || Date.parse(a.event.date) - Date.parse(b.event.date));

  const hot: SportsEvent[] = [];
  const usedLeagues = new Set<string>();

  for (const entry of ranked) {
    if (usedLeagues.has(entry.event.leagueId)) continue;
    hot.push(entry.event);
    usedLeagues.add(entry.event.leagueId);
    if (hot.length === 6) return hot;
  }

  for (const entry of ranked) {
    if (hot.some((event) => event.id === entry.event.id)) continue;
    hot.push(entry.event);
    if (hot.length === 6) return hot;
  }

  return hot.slice(0, 6);
}

function getHeatScore(event: SportsEvent): number {
  const hoursAway = (Date.parse(event.date) - Date.now()) / 36e5;
  const eventText = `${event.name} ${event.stage} ${event.league}`.toLowerCase();
  let score = event.priority;

  if (event.statusState === "in") score += 130;
  if (hoursAway >= 0 && hoursAway <= 8) score += 90;
  if (hoursAway > 8 && hoursAway <= 24) score += 70;
  if (hoursAway > 24 && hoursAway <= 72) score += 42;
  if (hoursAway > 72 && hoursAway <= 168) score += 18;
  if (hoursAway > 168) score -= 80;
  if (hoursAway < -24 && event.statusState !== "in") score -= 90;
  if (eventText.includes("semifinal")) score += 58;
  else if (eventText.includes("quarterfinal")) score += 42;
  else if (eventText.includes("final")) score += 80;
  if (eventText.includes("round of 16")) score += 30;
  if (eventText.includes("grand prix")) score += 34;
  if (eventText.includes("fight night") || eventText.includes("ufc")) score += 30;
  if (eventText.includes("wimbledon") || eventText.includes("open")) score += 22;
  if (hasEventMatchup(event)) score += 16;
  if (event.broadcasters.length) score += 8;

  return score;
}

function getEventHeat(event: SportsEvent): {
  label: string;
  shortLabel: string;
  tone: "now" | "prime" | "knockout";
  badgeTone: "default" | "teal" | "blue" | "coral" | "muted";
} {
  const hoursAway = (Date.parse(event.date) - Date.now()) / 36e5;
  const eventText = `${event.name} ${event.stage} ${event.league}`.toLowerCase();

  if (event.statusState === "in") {
    return { label: "Live now", shortLabel: "Live", tone: "now", badgeTone: "coral" };
  }

  if (hoursAway >= 0 && hoursAway <= 8) {
    return { label: "Next up", shortLabel: "Soon", tone: "now", badgeTone: "coral" };
  }

  if (hoursAway >= 0 && hoursAway <= 30) {
    return { label: "Today", shortLabel: "Today", tone: "prime", badgeTone: "teal" };
  }

  if (
    eventText.includes("final") ||
    eventText.includes("grand prix") ||
    eventText.includes("fight night") ||
    eventText.includes("wimbledon")
  ) {
    return { label: "Major event", shortLabel: "Major", tone: "knockout", badgeTone: "blue" };
  }

  return { label: "Upcoming", shortLabel: "Soon", tone: "prime", badgeTone: "default" };
}

function hasEventMatchup(event: SportsEvent): boolean {
  if (event.home.placeholder || event.away.placeholder) return false;

  const home = normalize(event.home.name);
  const away = normalize(event.away.name);
  const homeAbbreviation = normalize(event.home.abbreviation);
  const awayAbbreviation = normalize(event.away.abbreviation);
  const genericNames = new Set([normalize(event.sport), normalize(event.league), "sport", "sports"]);

  return Boolean(
    home &&
      away &&
      home !== away &&
      homeAbbreviation !== awayAbbreviation &&
      !genericNames.has(home) &&
      !genericNames.has(away) &&
      !genericNames.has(homeAbbreviation) &&
      !genericNames.has(awayAbbreviation)
  );
}

function getEventSearchButtons(event: SportsEvent, limit: number): string[] {
  const preferred = event.broadcasters.length ? event.broadcasters : event.searchTerms;
  const candidates = preferred
    .map((name) => ({
      name: normalizeBroadcaster(name),
      streamingOnly: isStreamingOnlyBroadcaster(name)
    }))
    .filter((candidate) => candidate.name);
  const linearCandidates = candidates.filter((candidate) => !candidate.streamingOnly);
  const usable = linearCandidates.length ? linearCandidates : candidates;

  return Array.from(new Set(prioritizeBroadcastersForEvent(event, usable.map((candidate) => candidate.name)))).slice(
    0,
    limit
  );
}

function isStreamingOnlyBroadcaster(value: string): boolean {
  const key = normalize(value).replace(/\+/g, " plus");
  return /\b(espn plus|peacock|prime video|apple tv|paramount plus|max|hulu|pga tour live|nbc sports app|fox sports app|espn app)\b/.test(
    key
  );
}

function prioritizeBroadcastersForEvent(event: SportsEvent, names: string[]): string[] {
  return [...names].sort((a, b) => getBroadcasterPriority(b, event) - getBroadcasterPriority(a, event));
}

function getBroadcasterPriority(name: string, event: SportsEvent): number {
  const normalizedName = normalize(name);
  const sport = normalize(event.sport);
  const league = normalize(event.league);
  let score = 0;

  if (sport === "golf" || league.includes("pga")) {
    if (normalizedName.includes("golf channel")) score += 100;
    if (normalizedName.includes("nbc")) score += 80;
    if (normalizedName.includes("cbs")) score += 62;
    if (normalizedName.includes("espn")) score -= 15;
  }

  return score;
}

function formatMatchDate(value: string): string {
  return matchTimeFormat.format(new Date(value));
}

function formatShortDate(value: string): string {
  return shortTimeFormat.format(new Date(value));
}

function normalizeBroadcaster(value: string): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  const key = normalize(cleaned).replace(/\+/g, " plus");
  const aliases: Record<string, string> = {
    "cbssn": "CBS Sports",
    "cbs sports network": "CBS Sports",
    "espn plus": "ESPN",
    "espn app": "ESPN",
    "fox sports app": "Fox Sports",
    "golf ch": "Golf Channel",
    "golf chnl": "Golf Channel",
    "golf channel": "Golf Channel",
    "nbc sports app": "NBC Sports",
    "nbcsn": "NBC Sports",
    "tele": "Telemundo",
    "tennis ch": "Tennis Channel",
    "tennis chnl": "Tennis Channel",
    "tnt": "TNT Sports"
  };

  return aliases[key] ?? cleaned;
}

function buildChannelSearchContext(query: string, event: SportsEvent): ChannelSearchContext {
  return {
    query,
    broadcaster: query,
    eventName: event.shortName || event.name,
    sport: event.sport,
    league: event.league,
    sourceUrl: event.sourceUrl,
    terms: Array.from(
      new Set(
        [
          query,
          event.sport,
          event.league,
          ...event.broadcasters.map(normalizeBroadcaster),
          ...getSportChannelTerms(event)
        ].filter(Boolean)
      )
    )
  };
}

function getSportChannelTerms(event: SportsEvent): string[] {
  const sport = normalize(event.sport);
  const league = normalize(event.league);

  if (sport === "golf" || league.includes("pga")) {
    return ["Golf Channel", "Golf", "PGA", "PGA Tour", "NBC", "NBC Sports", "CBS", "CBS Sports"];
  }

  if (sport === "tennis") {
    return ["Tennis Channel", "Tennis", "Wimbledon", "Eurosport"];
  }

  if (sport === "racing") {
    return ["Formula 1", "F1", "F1 TV", "Sky Sports F1", "ESPN", "NASCAR"];
  }

  return [];
}

function buildModel(data: DashboardData): DashboardModel {
  const streamMap = new Map<string, Stream[]>();
  let orphanStreamCount = 0;
  let labeledStreamCount = 0;
  let headerStreamCount = 0;

  for (const stream of data.streams) {
    if (stream.label) labeledStreamCount += 1;
    if (stream.referrer || stream.user_agent) headerStreamCount += 1;

    if (!stream.channel) {
      orphanStreamCount += 1;
      continue;
    }

    const bucket = streamMap.get(stream.channel) ?? [];
    bucket.push(stream);
    streamMap.set(stream.channel, bucket);
  }

  const logoMap = new Map<string, Logo>();
  for (const logo of data.logos) {
    const current = logoMap.get(logo.channel);
    if (!current || logoScore(logo) > logoScore(current)) {
      logoMap.set(logo.channel, logo);
    }
  }

  const countryMap = new Map(data.countries.map((country) => [country.code, country]));
  const categoryMap = new Map(data.categories.map((category) => [category.id, category]));
  const countryCounter = new Map<string, number>();
  const categoryCounter = new Map<string, number>();
  const sportsEventScoreMap = new Map<string, number>();
  let closedChannelCount = 0;
  let nsfwChannelCount = 0;
  let logoChannelCount = 0;
  let streamedChannelCount = 0;
  let sportsEventChannelCount = 0;
  let sportsEventStreamedChannelCount = 0;

  for (const channel of data.channels) {
    const streams = streamMap.get(channel.id) ?? [];
    const sportsEventScore = getSportsEventScore(channel, streams);

    sportsEventScoreMap.set(channel.id, sportsEventScore);
    countryCounter.set(channel.country, (countryCounter.get(channel.country) ?? 0) + 1);
    if (channel.closed) closedChannelCount += 1;
    if (channel.is_nsfw) nsfwChannelCount += 1;
    if (logoMap.has(channel.id)) logoChannelCount += 1;
    if (streamMap.has(channel.id)) streamedChannelCount += 1;
    if (sportsEventScore > 0) {
      sportsEventChannelCount += 1;
      if (streams.length > 0) sportsEventStreamedChannelCount += 1;
    }

    for (const category of channel.categories) {
      categoryCounter.set(category, (categoryCounter.get(category) ?? 0) + 1);
    }
  }

  const countryCounts = Array.from(countryCounter.entries())
    .map(([code, count]) => ({
      code,
      count,
      name: countryMap.get(code)?.name ?? code
    }))
    .sort((a, b) => b.count - a.count || nameSort.compare(a.name, b.name));

  const categoryCounts = Array.from(categoryCounter.entries())
    .map(([id, count]) => ({
      id,
      count,
      name: categoryMap.get(id)?.name ?? titleCase(id)
    }))
    .sort((a, b) => b.count - a.count || nameSort.compare(a.name, b.name));

  return {
    streamMap,
    logoMap,
    countryMap,
    categoryMap,
    countryCounts,
    categoryCounts,
    sportsEventScoreMap,
    sportsEventChannelCount,
    sportsEventStreamedChannelCount,
    streamedChannelCount,
    logoChannelCount,
    orphanStreamCount,
    closedChannelCount,
    nsfwChannelCount,
    labeledStreamCount,
    headerStreamCount
  };
}

function ChannelRow({
  channel,
  logo,
  streams,
  sportsEventScore,
  sourceName,
  countryName,
  selected,
  onSelect
}: {
  channel: Channel;
  logo?: Logo;
  streams: Stream[];
  sportsEventScore: number;
  sourceName: string;
  countryName: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const quality = streams.find((stream) => stream.quality)?.quality;

  return (
    <button className={`channel-row ${selected ? "is-selected" : ""}`} type="button" onClick={onSelect}>
      <ChannelLogo channel={channel} logo={logo} />
      <span className="channel-main">
        <strong>{channel.name}</strong>
        <span>{countryName}</span>
      </span>
      <span className="channel-tags">
        {sportsEventScore > 0 ? <Badge tone="teal">Sports</Badge> : null}
        <Badge tone={sourceName === "IPTV Org" ? "blue" : "default"}>{sourceName}</Badge>
        {channel.closed ? <Badge tone="muted">Closed</Badge> : null}
        {channel.is_nsfw ? <Badge tone="coral">NSFW</Badge> : null}
      </span>
      <span className="stream-count">
        <Wifi size={15} aria-hidden="true" />
        {streams.length}
        {quality ? <small>{quality}</small> : null}
      </span>
    </button>
  );
}

function ChannelLogo({
  channel,
  logo,
  size = "normal"
}: {
  channel: Channel;
  logo?: Logo;
  size?: "normal" | "large";
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [logo?.url]);

  const className = `channel-logo ${size === "large" ? "is-large" : ""}`;

  if (!logo || failed) {
    return <span className={`${className} logo-fallback`}>{channel.name.charAt(0).toUpperCase()}</span>;
  }

  return (
    <img
      className={className}
      src={logo.url}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function StreamPlayer({
  stream,
  hasNextStream,
  onNextStream
}: {
  stream?: Stream;
  hasNextStream: boolean;
  onNextStream: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    setMessage("");
    let hls: Hls | null = null;
    const isHls = /\.m3u8($|\?)/i.test(stream.url);

    if (isHls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setMessage(formatPlaybackIssue(data.details || data.type));
        }
      });
      hls.loadSource(stream.url);
      hls.attachMedia(video);
    } else {
      video.src = stream.url;
    }

    return () => {
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [stream]);

  if (!stream) {
    return (
      <div className="player-empty">
        <CircleOff size={28} aria-hidden="true" />
        <span>No stream</span>
      </div>
    );
  }

  return (
    <div className="player-shell">
      <video
        ref={videoRef}
        controls
        playsInline
        onError={() => setMessage("This stream failed to play in the browser.")}
      />
      {(stream.referrer || stream.user_agent || stream.label || message) && (
        <div className="player-flags">
          {stream.label ? <Badge tone="coral">{stream.label}</Badge> : null}
          {stream.referrer || stream.user_agent ? <Badge tone="blue">Headers</Badge> : null}
          {message ? <Badge tone="coral">{message}</Badge> : null}
          {message && hasNextStream ? (
            <button className="inline-action" type="button" onClick={onNextStream}>
              Try next stream
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function formatPlaybackIssue(reason: string): string {
  if (/manifestLoadError|levelLoadError|fragLoadError|keyLoadError/i.test(reason)) {
    return `Blocked, offline, or geo-restricted stream (${reason})`;
  }

  if (/manifestParsingError/i.test(reason)) {
    return `Invalid stream playlist (${reason})`;
  }

  if (/buffer|media/i.test(reason)) {
    return `Browser playback failed (${reason})`;
  }

  return reason || "This stream failed to play in the browser.";
}

function Metric({
  icon,
  label,
  value,
  tone = "ink"
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "ink" | "teal" | "blue" | "coral";
}) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Badge({
  children,
  tone = "default"
}: {
  children: ReactNode;
  tone?: "default" | "teal" | "blue" | "coral" | "muted";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InsightPanel({
  title,
  icon,
  rows
}: {
  title: string;
  icon: ReactNode;
  rows: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="insight-panel">
      <div className="panel-heading small">
        <div>
          <p className="eyebrow">rankings</p>
          <h2>{title}</h2>
        </div>
        {icon}
      </div>
      <div className="rank-list">
        {rows.map((row) => (
          <div className="rank-row" key={row.label}>
            <span>{row.label}</span>
            <div className="rank-bar">
              <i style={{ width: `${Math.max(5, (row.value / max) * 100)}%` }} />
            </div>
            <strong>{formatNumber(row.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="health-row">
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
    </div>
  );
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getSportsEventScore(channel: Channel, streams: Stream[]): number {
  const categories = channel.categories.map(normalize);
  const channelText = getSearchText(channel);
  const streamText = normalize(streams.map((stream) => `${stream.title} ${stream.url}`).join(" "));
  let score = 0;

  if (categories.includes("sports")) score += 90;
  if (categories.includes("auto")) score += 18;

  for (const term of sportsEventTerms) {
    if (channelText.includes(term)) score += term.length > 5 ? 18 : 12;
    if (streamText.includes(term)) score += term.length > 5 ? 12 : 8;
  }

  if (streams.length > 0) score += 18;
  if (streams.some((stream) => stream.quality === "1080p" || stream.quality === "720p")) score += 6;
  if (channel.closed) score -= 80;
  if (channel.is_nsfw) score -= 200;

  return Math.max(0, score);
}

function getChannelSearchContextScore(
  channel: Channel,
  streams: Stream[],
  context: ChannelSearchContext
): number {
  const categories = channel.categories.map(normalize);
  const channelText = getSearchText(channel);
  const streamText = normalize(streams.map((stream) => `${stream.title} ${stream.url}`).join(" "));
  const combinedText = `${channelText} ${streamText}`;
  const channelName = normalize(channel.name);
  const query = normalize(context.query);
  const sport = normalize(context.sport);
  const league = normalize(context.league);
  let score = 0;

  if (query) {
    if (channelName === query) score += 360;
    if (channelText.includes(query)) score += 240;
    if (streamText.includes(query)) score += 120;
  }

  if (categories.includes("sports")) score += 40;
  if ((sport === "golf" || league.includes("pga")) && combinedText.includes("golf")) score += 90;
  if (league.includes("pga") && combinedText.includes("pga")) score += 70;

  for (const term of context.terms) {
    const normalizedTerm = normalize(term);
    if (!normalizedTerm || normalizedTerm === query) continue;
    if (channelName === normalizedTerm) score += 84;
    if (channelText.includes(normalizedTerm)) score += 36;
    if (streamText.includes(normalizedTerm)) score += 22;
  }

  if (streams.length > 0) score += 18;
  if (streams.some((stream) => stream.quality === "1080p" || stream.quality === "720p")) score += 6;
  if (channel.closed) score -= 120;
  if (channel.is_nsfw) score -= 200;

  return Math.max(0, score);
}

function getChannelSourceId(channel: Channel): string {
  return channel.source_id ?? "iptv-org";
}

function getSearchText(channel: Channel): string {
  return normalize(
    [
      channel.id,
      channel.name,
      channel.network,
      channel.country,
      channel.alt_names?.join(" "),
      channel.owners?.join(" "),
      channel.categories?.join(" ")
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function logoScore(logo: Logo): number {
  let score = 0;
  if (logo.in_use) score += 1000;
  if (!logo.feed) score += 100;
  if (logo.tags?.includes("horizontal")) score += 20;
  if (logo.format === "SVG") score += 10;
  return score;
}

function dateRank(value: string | null): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildM3u(channel: Channel, streams: Stream[], logo?: Logo): string {
  const lines = ["#EXTM3U"];
  const group = channel.categories[0] ? titleCase(channel.categories[0]) : "Uncategorized";
  const logoAttr = logo ? ` tvg-logo="${stripQuotes(logo.url)}"` : "";

  for (const stream of streams) {
    lines.push(
      `#EXTINF:-1 tvg-id="${stripQuotes(channel.id)}"${logoAttr} group-title="${stripQuotes(group)}",${
        stream.title || channel.name
      }`,
      stream.url
    );
  }

  return lines.join("\n");
}

function stripQuotes(value: string): string {
  return value.replace(/"/g, "");
}

function formatNumber(value: number): string {
  return numberFormat.format(value);
}
