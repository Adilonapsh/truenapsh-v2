import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface M3U8VideoPlayerProps {
    src: string;
    placeholderImage: string;
}

const M3U8VideoPlayer: React.FC<M3U8VideoPlayerProps> = ({ src, placeholderImage }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasError, setHasError] = useState(false); // State untuk menandai error

    useEffect(() => {
        const video = videoRef.current;

        if (video) {
            const handleError = () => {
                setHasError(true); // Set state error jika video tidak bisa diputar
            };

            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(src);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play();
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        setHasError(true); // Set state error jika terjadi fatal error
                    }
                });

                return () => {
                    hls.destroy();
                };
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Jika browser mendukung HLS secara native (misalnya Safari)
                video.src = src;
                video.addEventListener('loadedmetadata', () => {
                    video.play();
                });
            }

            // Tambahkan event listener untuk error
            video.addEventListener('error', handleError);

            // Cleanup event listener saat komponen di-unmount
            return () => {
                video.removeEventListener('error', handleError);
            };
        }
    }, [src]);

    // Jika terjadi error, tampilkan gambar placeholder
    if (hasError) {
        return (
            <div style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
                <img
                    src={placeholderImage}
                    alt="Video tidak dapat diputar"
                    style={{ width: '100%', height: 'auto' }}
                />
                <p>Video tidak dapat diputar.</p>
            </div>
        );
    }

    // Jika tidak ada error, tampilkan video player
    return (
        <video
            ref={videoRef}
            controls
            style={{ width: '100%', maxWidth: '800px' }}
        />
    );
};

export default M3U8VideoPlayer;