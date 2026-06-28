import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { spawn, ChildProcess } from "child_process";

const RECORDINGS_FILE = path.join(process.cwd(), "recordings.json");
const RECORDINGS_DIR = path.join(process.cwd(), "recordings");
const activeProcesses = new Map<string, ChildProcess>();

interface Recording {
  id: string;
  channelId: string;
  streamUrl: string;
  title: string;
  startTime: number;
  duration: number;
  status: "scheduled" | "recording" | "completed" | "failed";
  outputFile?: string;
  error?: string;
  createdAt: number;
}

async function readRecordings(): Promise<Recording[]> {
  try {
    const data = await fs.readFile(RECORDINGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeRecordings(recordings: Recording[]): Promise<void> {
  await fs.writeFile(RECORDINGS_FILE, JSON.stringify(recordings, null, 2));
}

async function ensureDir() {
  try { await fs.mkdir(RECORDINGS_DIR, { recursive: true }); } catch { /* ignore */ }
}

export async function POST(request: NextRequest) {
  await ensureDir();
  const body = await request.json();
  const { channelId, streamUrl, startTime, duration, title } = body;

  if (!channelId || !streamUrl || !startTime || !duration) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const recordings = await readRecordings();
  const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const recording: Recording = {
    id, channelId, streamUrl, title: title || "Untitled",
    startTime, duration, status: "scheduled", createdAt: Date.now(),
  };
  recordings.push(recording);
  await writeRecordings(recordings);

  return NextResponse.json({ id, status: "scheduled" });
}

export async function GET() {
  const recordings = await readRecordings();
  return NextResponse.json(recordings);
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const recordings = await readRecordings();
  const idx = recordings.findIndex(r => r.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const proc = activeProcesses.get(id);
  if (proc) {
    proc.kill("SIGTERM");
    activeProcesses.delete(id);
  }

  recordings.splice(idx, 1);
  await writeRecordings(recordings);
  return NextResponse.json({ success: true });
}

// Scheduler checker — run every 30s to start due recordings
let schedulerStarted = false;
function startScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  setInterval(async () => {
    try {
      const recordings = await readRecordings();
      for (const rec of recordings) {
        if (rec.status !== "scheduled") continue;
        if (Date.now() >= rec.startTime) {
          rec.status = "recording";
          await writeRecordings(recordings);

          const outputFile = path.join(RECORDINGS_DIR, `${rec.id}.ts`);
          rec.outputFile = outputFile;

          const proc = spawn("ffmpeg", [
            "-i", rec.streamUrl,
            "-t", String(rec.duration),
            "-c", "copy",
            "-f", "mpegts",
            outputFile,
          ], { stdio: "ignore" });

          activeProcesses.set(rec.id, proc);

          proc.on("exit", async (code) => {
            activeProcesses.delete(rec.id);
            const current = await readRecordings();
            const r = current.find(x => x.id === rec.id);
            if (r) {
              r.status = code === 0 ? "completed" : "failed";
              r.error = code !== 0 ? `ffmpeg exited with code ${code}` : undefined;
              await writeRecordings(current);
            }
          });

          proc.on("error", async (err) => {
            activeProcesses.delete(rec.id);
            const current = await readRecordings();
            const r = current.find(x => x.id === rec.id);
            if (r) {
              r.status = "failed";
              r.error = err.message;
              await writeRecordings(current);
            }
          });
        }
      }
    } catch { /* ignore scheduler errors */ }
  }, 30_000);
}

startScheduler();
