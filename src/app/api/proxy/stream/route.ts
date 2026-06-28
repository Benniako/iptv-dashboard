import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const referrer = request.nextUrl.searchParams.get("referrer");
  const userAgent = request.nextUrl.searchParams.get("ua");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = {};
    if (referrer) headers["Referer"] = referrer;
    if (userAgent) headers["User-Agent"] = userAgent;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream returned ${response.status}` }, { status: 502 });
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=30",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stream" }, { status: 502 });
  }
}
