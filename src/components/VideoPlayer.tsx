"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Pause, Maximize, Volume2, VolumeX } from "lucide-react";
import type { StreamSource } from "@/types";

interface VideoPlayerProps {
  src: string;
  title: string;
  poster?: string;
  sources?: StreamSource[];
  onSourceChange?: (url: string) => void;
}

export default function VideoPlayer({ src, title, poster, sources }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [error, setError] = useState<string | null>(null);

  const loadStream = (url: string) => {
    setError(null);
    const video = videoRef.current;
    if (!video) return;

    // Destroy previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (url.endsWith(".m3u8") && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        setIsPlaying(true);
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError("Stream playback error. Try another source.");
        }
      });
      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = url;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(() => {});
        setIsPlaying(true);
      });
    } else {
      // Direct video file
      video.src = url;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(() => {});
        setIsPlaying(true);
      });
    }
  };

  useEffect(() => {
    if (currentSrc) loadStream(currentSrc);
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [currentSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      if (video.duration) setProgress((video.currentTime / video.duration) * 100);
    };
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); } else { videoRef.current.play().catch(() => {}); }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    videoRef.current.requestFullscreen().catch(() => {});
  };

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden group">
      <video
        ref={videoRef}
        poster={poster}
        className="h-full w-full object-contain"
        playsInline
        onClick={togglePlay}
      />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center px-4">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            {sources && sources.length > 1 && (
              <p className="text-xs text-muted-foreground">Try selecting a different source below.</p>
            )}
          </div>
        </div>
      )}

      {!isPlaying && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <button
            onClick={togglePlay}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3498db]/90 text-white transition-transform hover:scale-110"
          >
            <Play className="h-8 w-8 ml-1" />
          </button>
        </div>
      )}

      {isPlaying && (
        <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="text-sm font-medium text-white line-clamp-1">{title}</h3>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="mb-3 h-1 w-full rounded-full bg-white/20">
          <div className="h-full rounded-full bg-[#3498db] transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="text-white hover:text-[#3498db] transition-colors">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button onClick={toggleMute} className="text-white hover:text-[#3498db] transition-colors">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>
          <button onClick={toggleFullscreen} className="text-white hover:text-[#3498db] transition-colors">
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Source selector */}
      {sources && sources.length > 1 && (
        <div className="absolute right-2 top-2 flex gap-1">
          {sources.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrentSrc(s.url)}
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                currentSrc === s.url
                  ? "bg-[#3498db] text-white"
                  : "bg-black/60 text-white/70 hover:bg-black/80"
              }`}
            >
              {s.label || s.quality || `Source ${i + 1}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
