import React, { useEffect, useRef } from 'react';
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
    url: string; // URL video yang dapat diubah
    options?: Omit<VideoJsPlayerOptions, 'sources'>; // Opsi tambahan tanpa sources
    source_type?: string;
}
const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, options = {}, source_type = "video/mp4" }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<VideoJsPlayer | null>(null);

    useEffect(() => {
        if (videoRef.current && !playerRef.current) {
            // Inisialisasi Video.js player
            playerRef.current = videojs(videoRef.current, {
                ...options,
                sources: [{ src: url, type: source_type }], // Tambahkan URL sebagai sumber
            });
        } else if (playerRef.current) {
            // Jika player sudah ada, ubah sumber video
            playerRef.current.src({ src: url, type: source_type });
        }

        return () => {
            // Bersihkan player saat komponen di-unmount
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [url, options, source_type]); // Jalankan ulang jika URL atau opsi berubah

    return <video ref={videoRef} className="video-js" />;
};

export default VideoPlayer;
