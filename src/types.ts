export type Channel = {
  id: string;
  name: string;
  alt_names?: string[];
  network: string | null;
  owners: string[];
  country: string;
  categories: string[];
  is_nsfw: boolean;
  launched: string | null;
  closed: string | null;
  replaced_by: string | null;
  website: string | null;
  source_id?: string;
  source_name?: string;
};

export type Stream = {
  channel: string | null;
  feed: string | null;
  title: string;
  url: string;
  referrer: string | null;
  user_agent: string | null;
  quality: string | null;
  label: string | null;
  source_id?: string;
};

export type Logo = {
  channel: string;
  feed: string | null;
  in_use: boolean;
  tags: string[];
  width: number;
  height: number;
  format: string | null;
  url: string;
};

export type Country = {
  code: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
};

export type DashboardData = {
  channels: Channel[];
  streams: Stream[];
  logos: Logo[];
  countries: Country[];
  categories: Category[];
  sources: CatalogSource[];
  sourceLoadResults: SourceLoadResult[];
  loadedAt: string;
};

export type CatalogSource = {
  id: string;
  name: string;
  description: string;
  homepage: string;
  kind: "primary" | "curated" | "regional" | "experimental" | "directory";
  defaultEnabled: boolean;
  ingestable?: boolean;
};

export type SourceLoadResult = {
  id: string;
  status: "loaded" | "error" | "primary" | "directory";
  entries: number;
  channelsAdded: number;
  duplicates: number;
  sportsEntries: number;
  message?: string;
};

export type SportsEventTeam = {
  name: string;
  abbreviation: string;
  logo: string | null;
  placeholder: boolean;
};

export type SportsEvent = {
  id: string;
  name: string;
  shortName: string;
  date: string;
  stage: string;
  venue: string;
  city: string;
  status: string;
  statusState: string;
  broadcasters: string[];
  home: SportsEventTeam;
  away: SportsEventTeam;
  sourceUrl: string | null;
  sport: string;
  league: string;
  leagueId: string;
  priority: number;
  searchTerms: string[];
};

export type TrendingSportsData = {
  events: SportsEvent[];
  loadedAt: string;
  source: string;
  errors: Array<{
    id: string;
    name: string;
    message: string;
  }>;
};

export type WorldCupTeam = SportsEventTeam;
export type WorldCupEvent = SportsEvent;
export type WorldCupData = TrendingSportsData;
