import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import styles from './AudioPlayer.module.css';

interface AudioPlayerProps {
    src: string;
    isMine?: boolean;
}

export const AudioPlayer = ({ src, isMine = false }: AudioPlayerProps) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [waveform, setWaveform] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch and analyze audio for real waveform
    useEffect(() => {
        let isMounted = true;
        const fetchAudioData = async () => {
            // Avoid re-fetching if we already have data for this src (simple check)
            if (!src) return;
            // Prevent multiple fetches for same src if we already have data
            if (waveform.length > 0 && !isLoading) return;

            try {
                setIsLoading(true);
                const response = await fetch(src);
                const arrayBuffer = await response.arrayBuffer();

                if (!isMounted) return;

                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                try {
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                    // Downsample to ~40-50 bars
                    const channelData = audioBuffer.getChannelData(0); // Mono is enough for visuals
                    const samples = 40;
                    const blockSize = Math.floor(channelData.length / samples);
                    const peaks = [];

                    for (let i = 0; i < samples; i++) {
                        const start = i * blockSize;
                        let sum = 0;
                        for (let j = 0; j < blockSize; j++) {
                            sum += Math.abs(channelData[start + j]);
                        }
                        peaks.push(sum / blockSize);
                    }

                    // Normalize peaks to be between 0.3 and 1 for better visuals
                    const max = Math.max(...peaks);
                    const normalizedPeaks = peaks.map(p => Math.max(0.2, (p / max)));

                    setWaveform(normalizedPeaks);
                    setDuration(audioBuffer.duration); // Get precise duration
                } finally {
                    await audioContext.close();
                }

            } catch (error) {
                console.warn("Waveform generation failed:", error);
                // Fallback to random waveform
                setWaveform(Array.from({ length: 40 }, () => Math.random() * 0.5 + 0.3));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchAudioData();
        return () => { isMounted = false; };
    }, [src]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => {
            // Only use timeupdate event for low-freq updates when NOT playing (e.g. seeking, loading)
            if (!isPlaying) setCurrentTime(audio.currentTime);
        };

        const updateDuration = () => {
            if (!Number.isFinite(duration) || duration === 0) {
                setDuration(audio.duration);
            }
        };
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', onEnded);
        };
    }, [duration, isPlaying]);

    // Use requestAnimationFrame for smooth 60fps UI updates during playback
    useEffect(() => {
        if (!isPlaying || !audioRef.current) return;

        let animationFrameId: number;

        const animate = () => {
            if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => {
                console.error("Audio playback failed:", e);
                setIsPlaying(false);
            });
        }
        setIsPlaying(!isPlaying);
    };

    const changePlaybackRate = () => {
        const rates = [1, 1.5, 2];
        const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
        setPlaybackRate(nextRate);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextRate;
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !containerRef.current || duration === 0) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percentage = Math.min(Math.max(0, x / width), 1);

        const newTime = percentage * duration;
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const formatTime = (time: number) => {
        if (isNaN(time) || !Number.isFinite(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Calculate progress percentage
    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className={`${styles.audioPlayerContainer} ${isMine ? styles.bubbleOut : ''}`}>
            <audio ref={audioRef} src={src} preload="metadata" crossOrigin="anonymous" />

            <button className={styles.playButton} onClick={togglePlay} disabled={isLoading}>
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />}
            </button>

            <div className={styles.progressArea}>
                <div
                    className={styles.waveform}
                    ref={containerRef}
                    onClick={handleSeek}
                >
                    {/* Render visual bars */}
                    {waveform.map((height, index) => {
                        const barPos = (index / waveform.length) * 100;
                        const isActive = barPos <= progressPercent; // Use <= to include current

                        return (
                            <div
                                key={index}
                                className={`${styles.waveBar} ${isActive ? styles.waveBarActive : ''}`}
                                style={{
                                    height: `${height * 24}px`, // Scale height to max 24px
                                }}
                            />
                        );
                    })}
                </div>
                <div className={styles.timeDisplay}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            <button className={styles.speedButton} onClick={changePlaybackRate}>
                {playbackRate}x
            </button>
        </div>
    );
};
