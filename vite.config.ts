import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { Connect } from "vite";

type EjaChannel = {
  title: string;
  country: string;
  poster: string;
  url: string;
};

function directorySourceMiddleware(): Connect.HandleFunction {
  return async (...args: Parameters<Connect.HandleFunction>) => {
    const [req, res, next] = args;
    const url = new URL(req.url ?? "/", "http://127.0.0.1");

    if (url.pathname !== "/api/directory/eja-tv.m3u") {
      next();
      return;
    }

    try {
      const search = url.searchParams.get("search") || "sport";
      const channels = await loadEjaTvChannels(search);
      const playlist = buildDirectoryM3u(channels);

      res.statusCode = 200;
      res.setHeader("content-type", "application/vnd.apple.mpegurl; charset=utf-8");
      res.setHeader("cache-control", "public, max-age=300");
      res.end(playlist);
    } catch (error) {
      res.statusCode = 502;
      res.setHeader("content-type", "text/plain; charset=utf-8");
      res.end(error instanceof Error ? error.message : String(error));
    }
  };
}

async function loadEjaTvChannels(search: string): Promise<EjaChannel[]> {
  const pages = await Promise.all([0, 6, 12].map((offset) => fetchEjaPage(search, offset)));
  const seen = new Set<string>();
  const channels: EjaChannel[] = [];

  for (const page of pages) {
    for (const channel of parseEjaChannels(page)) {
      const key = stripUrlFragment(channel.url);
      if (seen.has(key)) continue;
      seen.add(key);
      channels.push(channel);
    }
  }

  return channels;
}

async function fetchEjaPage(search: string, offset: number): Promise<string> {
  const pageUrl = new URL("http://eja.tv/");
  pageUrl.searchParams.set("country", "");
  pageUrl.searchParams.set("language", "");
  pageUrl.searchParams.set("category", "");
  pageUrl.searchParams.set("search", search);
  if (offset > 0) pageUrl.searchParams.set("offset", String(offset));

  const response = await fetch(pageUrl, {
    headers: {
      accept: "text/html,*/*"
    }
  });

  if (!response.ok) {
    throw new Error(`eja.tv returned ${response.status}`);
  }

  return response.text();
}

function parseEjaChannels(html: string): EjaChannel[] {
  const cards = html.match(/<div class="col-md-4 mb-3">[\s\S]*?(?=<div class="col-md-4 mb-3">|<footer|$)/g) ?? [];

  return cards
    .map((card) => {
      const title = decodeHtml(matchValue(card, /<span class="text-muted">([\s\S]*?)<\/span>/));
      const country = decodeHtml(matchValue(card, /<a href="\?country=[^"]*">([^<]*)<\/a>/));
      const poster = decodeHtml(matchValue(card, /poster="([^"]*)"/));
      const url = decodeHtml(matchValue(card, /<source src="([^"]*)"/));

      if (!title || !/^https?:\/\/.+\.m3u8/i.test(url)) return null;

      return {
        title,
        country: country.replace(/\s+/g, " ").replace(/^[^\w]+/u, "").trim() || "International",
        poster,
        url
      };
    })
    .filter((channel): channel is EjaChannel => Boolean(channel));
}

function buildDirectoryM3u(channels: EjaChannel[]): string {
  const lines = ["#EXTM3U"];

  for (const channel of channels) {
    const logo = channel.poster ? ` tvg-logo="${escapeM3uAttr(new URL(channel.poster, "http://eja.tv/").href)}"` : "";
    lines.push(
      `#EXTINF:-1${logo} group-title="${escapeM3uAttr(channel.country)}" tvg-country="${escapeM3uAttr(channel.country)}",${escapeM3uAttr(
        channel.title
      )}`,
      channel.url
    );
  }

  return `${lines.join("\n")}\n`;
}

function matchValue(value: string, pattern: RegExp): string {
  return value.match(pattern)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeM3uAttr(value: string): string {
  return value.replace(/"/g, "'");
}

function stripUrlFragment(value: string): string {
  return value.replace(/#.*$/, "");
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "directory-source-middleware",
      configureServer(server) {
        server.middlewares.use(directorySourceMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(directorySourceMiddleware());
      }
    }
  ],
  server: {
    port: 5173
  }
});
