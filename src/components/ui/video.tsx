import React, { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import Hls from "hls.js";

type VideoJsPlayerPluginOptions = Partial<typeof videojs.options.plugins>;

interface VideoPlayerProps {
  url: string;
  options?: Omit<VideoJsPlayerPluginOptions, "sources">;
  source_type?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  options = {},
  source_type = "video/mp4",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Dispose previous player if exists
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
    // Dispose previous HLS instance if exists
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;

    // Initialize Video.js player
    playerRef.current = videojs(video, {
      ...options,
      sources: [{ src: url, type: source_type }],
    });

    // Setup HLS if supported and video type is HLS
    if (
      source_type === "application/x-mpegURL" ||
      source_type === "application/vnd.apple.mpegurl"
    ) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      }
    }

    return () => {
      // Cleanup Video.js player
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      // Cleanup HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url, options, source_type]);

  return <video ref={videoRef} className="video-js" />;
};

export default VideoPlayer;
