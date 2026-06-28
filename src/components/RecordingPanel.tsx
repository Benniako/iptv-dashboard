"use client";

import { useState } from "react";
import { Radio } from "lucide-react";

interface Props {
  channelId: string;
  streamUrl: string;
  channelTitle: string;
}

export default function RecordingPanel({ channelId, streamUrl, channelTitle }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [scheduling, setScheduling] = useState(false);
  const [message, setMessage] = useState("");

  const handleSchedule = async () => {
    if (!startDate || !startTime) return;
    setScheduling(true);
    setMessage("");

    const startDateTime = new Date(`${startDate}T${startTime}`).getTime();
    const durationSec = duration * 60;

    try {
      const res = await fetch("/api/record/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          streamUrl,
          startTime: startDateTime,
          duration: durationSec,
          title: channelTitle,
        }),
      });

      if (res.ok) {
        setMessage("✅ Recording scheduled!");
        setShowForm(false);
      } else {
        const err = await res.json();
        setMessage(`❌ ${err.error || "Failed to schedule"}`);
      }
    } catch {
      setMessage("❌ Network error");
    }
    setScheduling(false);
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card p-4 mt-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 text-sm font-medium text-white hover:text-[#3498db] transition-colors"
      >
        <Radio className="h-4 w-4" />
        Record This Stream
      </button>

      {showForm && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-[#1a1a2e] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-border bg-[#1a1a2e] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Duration (minutes)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-[#1a1a2e] px-3 py-2 text-sm text-white"
            >
              <option value={30}>30 min</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
              <option value={360}>6 hours</option>
            </select>
          </div>

          <button
            onClick={handleSchedule}
            disabled={scheduling}
            className="w-full rounded-lg bg-[#3498db] px-4 py-2 text-sm font-medium text-white hover:bg-[#3498db]/90 disabled:opacity-50 transition-colors"
          >
            {scheduling ? "Scheduling..." : "Schedule Recording"}
          </button>

          {message && <p className="text-xs text-center">{message}</p>}
        </div>
      )}
    </div>
  );
}
