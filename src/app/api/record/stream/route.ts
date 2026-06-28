import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { readFileSync } from "fs";

const RECORDINGS_FILE = path.join(process.cwd(), "recordings.json");
const RECORDINGS_DIR = path.join(process.cwd(), "recordings");

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const data = await fs.readFile(RECORDINGS_FILE, "utf-8");
  const recordings = JSON.parse(data);
  const rec = recordings.find((r: any) => r.id === id);

  if (!rec || !rec.outputFile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const filePath = path.join(RECORDINGS_DIR, `${rec.id}.ts`);
    const buffer = readFileSync(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "video/MP2T",
        "Content-Disposition": `attachment; filename="${rec.title.replace(/[^a-zA-Z0-9]/g, "_")}.ts"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
