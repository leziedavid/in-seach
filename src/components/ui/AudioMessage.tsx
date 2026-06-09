'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';

interface AudioMessageProps {
    src: string;
    isMe: boolean;
}

export default function AudioMessage({ src, isMe }: AudioMessageProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const animFrameRef = useRef<number>(0);

    // Fake waveform bars (35 bars with varied heights for visual effect)
    const bars = [3,5,8,6,10,14,10,7,12,16,12,9,14,18,14,10,7,12,16,12,9,6,10,14,10,7,5,8,6,4,7,10,7,5,3];

    const formatTime = (s: number) => {
        if (!isFinite(s) || isNaN(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const updateProgress = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        setCurrentTime(audio.currentTime);
        if (!audio.paused) {
            animFrameRef.current = requestAnimationFrame(updateProgress);
        }
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onLoaded = () => {
            setDuration(audio.duration);
            setIsLoaded(true);
        };
        const onEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            cancelAnimationFrame(animFrameRef.current);
        };
        const onError = () => setIsLoaded(true);

        audio.addEventListener('loadedmetadata', onLoaded);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);
        audio.load();

        return () => {
            audio.removeEventListener('loadedmetadata', onLoaded);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            cancelAnimationFrame(animFrameRef.current);
        };
    }, [src]);

    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
            cancelAnimationFrame(animFrameRef.current);
        } else {
            try {
                await audio.play();
                setIsPlaying(true);
                animFrameRef.current = requestAnimationFrame(updateProgress);
            } catch (e) {
                console.error('Audio play error:', e);
            }
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audio.currentTime = ratio * duration;
        setCurrentTime(audio.currentTime);
    };

    const cycleSpeed = () => {
        const rates = [1, 1.5, 2];
        const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
        setPlaybackRate(next);
        if (audioRef.current) audioRef.current.playbackRate = next;
    };

    const progress = duration > 0 ? currentTime / duration : 0;
    const activeBarCount = Math.floor(progress * bars.length);

    const mutedColor = isMe ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.18)';
    const activeColor = isMe ? 'rgba(255,255,255,0.95)' : 'var(--color-primary, #b07b5e)';
    const textColor = isMe ? 'text-white/75' : 'text-muted-foreground';

    return (
        <div className="flex items-center gap-2.5 w-full min-w-[200px] max-w-[260px]">
            <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

            {/* Bouton Play/Pause */}
            <button
                onClick={togglePlay}
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition active:scale-90 ${
                    isMe
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : 'bg-primary/15 hover:bg-primary/25 text-primary'
                }`}
            >
                {!isLoaded ? (
                    <Icon icon="solar:spinner-bold" className="w-4 h-4 animate-spin opacity-60" />
                ) : isPlaying ? (
                    <Icon icon="solar:pause-bold" className="w-4 h-4" />
                ) : (
                    <Icon icon="solar:play-bold" className="w-4 h-4 ml-0.5" />
                )}
            </button>

            {/* Waveform + durée */}
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                {/* Waveform cliquable */}
                <div
                    className="flex items-center gap-[2px] h-8 cursor-pointer"
                    onClick={handleSeek}
                >
                    {bars.map((h, i) => (
                        <div
                            key={i}
                            className="rounded-full transition-all duration-150 flex-1"
                            style={{
                                height: `${(isPlaying && i === activeBarCount) ? Math.min(h + 4, 20) : h}px`,
                                backgroundColor: i < activeBarCount ? activeColor : mutedColor,
                                minWidth: '2px',
                                maxWidth: '3px',
                            }}
                        />
                    ))}
                </div>

                {/* Durée + vitesse */}
                <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold tabular-nums ${textColor}`}>
                        {isPlaying || currentTime > 0 ? formatTime(currentTime) : formatTime(duration)}
                    </span>
                    <button
                        onClick={cycleSpeed}
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md transition ${
                            isMe
                                ? 'text-white/60 hover:text-white hover:bg-white/10'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        } ${playbackRate !== 1 ? (isMe ? 'text-white bg-white/10' : 'text-primary bg-primary/10') : ''}`}
                    >
                        {playbackRate}×
                    </button>
                </div>
            </div>
        </div>
    );
}
