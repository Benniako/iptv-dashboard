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
