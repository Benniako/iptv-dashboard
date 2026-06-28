"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Maximize, Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  title: string;
  poster?: string;
}

export default function VideoPlayer({ src, title, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // If we have an HLS/m3u8 URL, we'd load HLS.js here
    // For now, use native video with a test stream
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [src]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
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
        src={src || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"}
        poster={poster}
        className="h-full w-full object-contain"
        playsInline
        onClick={togglePlay}
      />

      {/* Loading overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <button
            onClick={togglePlay}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3498db]/90 text-white transition-transform hover:scale-110"
          >
            <Play className="h-8 w-8 ml-1" />
          </button>
        </div>
      )}

      {/* Title overlay */}
      {isPlaying && (
        <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="text-sm font-medium text-white line-clamp-1">{title}</h3>
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress bar */}
        <div className="mb-3 h-1 w-full rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-[#3498db] transition-all"
            style={{ width: `${progress}%` }}
          />
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
    </div>
  );
}
