export interface Channel {
  id: string;
  name: string;
  logo?: string;
  url: string;
  category: string;
  country?: string;
  language?: string;
  live?: boolean;
  viewers?: number;
}

export interface LiveEvent {
  id: string;
  title: string;
  category: string;
  categorySlug: string;
  viewers: number;
  startTime: string;
  channel: string;
  streamUrl: string;
  thumbnail?: string;
  live: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  icon: string;
}

export interface IptvPlaylist {
  channels: Channel[];
  total: number;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  category: string;
  startTime: string;
  endTime?: string;
  channel: string;
}

export interface StreamSource {
  channel: string;
  url: string;
  quality?: string;
  label?: string;
  referrer?: string;
  user_agent?: string;
}

export interface GuideEntry {
  channel: string;
  start: number;
  stop: number;
  title: string;
  description?: string;
  category?: string;
}

export interface IptvChannel {
  id: string;
  name: string;
  alt_names?: string[];
  network?: string;
  country?: string;
  categories: string[];
  is_nsfw: boolean;
  website?: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
