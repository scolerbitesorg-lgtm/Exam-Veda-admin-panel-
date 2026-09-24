import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Tv,
} from 'lucide-react';

interface EduVedaVideoPlayerProps {
  videoUrl: string;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
  onEnded?: () => void;
}

// Utility to parse YouTube video IDs
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Utility to parse Vimeo video IDs
export function getVimeoVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /vimeo.*(?:\/|clip_id=)([0-9]+)/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// Utility to parse Google Drive preview links
export function getGoogleDrivePreviewUrl(url: string): string | null {
  if (!url) return null;
  if (url.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
  }
  return null;
}

export const EduVedaVideoPlayer: React.FC<EduVedaVideoPlayerProps> = ({
  videoUrl,
  title,
  poster,
  autoPlay = false,
  className = '',
  onEnded,
}) => {
  const [currentUrl, setCurrentUrl] = useState(videoUrl || '');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCurrentUrl(videoUrl || '');
    setHasError(false);
    setErrorMessage('');
    setIsPlaying(false);
    setCurrentTime(0);
  }, [videoUrl]);

  // Check special URL types
  const youtubeId = getYouTubeVideoId(currentUrl);
  const vimeoId = getVimeoVideoId(currentUrl);
  const gDriveUrl = getGoogleDrivePreviewUrl(currentUrl);

  const isEmbedType = Boolean(youtubeId || vimeoId || gDriveUrl);

  // Auto-hide controls when playing
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Playback error:', err);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
    setHasError(false);
    if (autoPlay) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const skipSeconds = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration || 1000, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const formatSec = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const loadFallbackDemo = () => {
    setHasError(false);
    setCurrentUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  };

  // 1. YOUTUBE EMBED PLAYER
  if (youtubeId) {
    return (
      <div
        className={`relative aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-800 ${className}`}
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=${autoPlay ? '1' : '0'}&rel=0&modestbranding=1&playsinline=1`}
          title={title || 'Edu Veda Video Lecture'}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  // 2. VIMEO EMBED PLAYER
  if (vimeoId) {
    return (
      <div
        className={`relative aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-800 ${className}`}
      >
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=${autoPlay ? '1' : '0'}&title=0&byline=0&portrait=0`}
          title={title || 'Edu Veda Lecture'}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // 3. GOOGLE DRIVE EMBED
  if (gDriveUrl) {
    return (
      <div
        className={`relative aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-800 ${className}`}
      >
        <iframe
          src={gDriveUrl}
          title={title || 'Edu Veda Google Drive Stream'}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  // 4. NATIVE HTML5 VIDEO PLAYER WITH CONTROLS & ERROR RECOVERY
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative aspect-video bg-slate-950 rounded-2xl overflow-hidden group select-none shadow-2xl border border-slate-800 flex items-center justify-center ${className}`}
    >
      {hasError ? (
        <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col items-center justify-center text-center space-y-3 z-30">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">Unable to Play Video Stream</h4>
            <p className="text-xs text-slate-400 max-w-sm font-mono break-all">
              {errorMessage || 'The video source link could not be loaded or is blocked by CORS/Format restrictions.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {currentUrl && (
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <span>Open URL Directly</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={loadFallbackDemo}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Load Sample Lecture Stream</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={currentUrl}
            poster={poster}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => {
              setIsPlaying(false);
              if (onEnded) onEnded();
            }}
            onError={() => {
              setHasError(true);
              setErrorMessage('Video failed to stream. Try a direct MP4, YouTube link, or test sample stream.');
            }}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer"
          />

          {/* Big Center Play/Pause button when paused */}
          {!isPlaying && !hasError && (
            <button
              onClick={togglePlay}
              className="absolute z-20 w-16 h-16 rounded-2xl bg-indigo-600/90 hover:bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-900/50 backdrop-blur-xs transition transform hover:scale-110 active:scale-95"
            >
              <Play className="w-7 h-7 fill-current ml-1" />
            </button>
          )}

          {/* Bottom Control Bar */}
          <div
            className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pt-8 pb-3 px-4 transition-opacity duration-300 z-20 ${
              showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Scrubber Progress Bar */}
            <div className="relative mb-2.5 group/scrub flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-white">
              {/* Left Controls */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition"
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={() => skipSeconds(-10)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition hidden sm:flex items-center"
                  title="Rewind 10s"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => skipSeconds(10)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition hidden sm:flex items-center"
                  title="Forward 10s"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                {/* Duration indicator */}
                <div className="font-mono text-[11px] sm:text-xs text-slate-300">
                  <span>{formatSec(currentTime)}</span>
                  <span className="text-slate-500 mx-1">/</span>
                  <span className="text-slate-400">{formatSec(duration)}</span>
                </div>

                {/* Volume slider */}
                <div className="flex items-center gap-1.5 ml-1">
                  <button
                    onClick={handleToggleMute}
                    className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-14 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400 hidden sm:block"
                  />
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Speed buttons */}
                <div className="flex items-center gap-0.5 bg-slate-800/90 px-1.5 py-0.5 rounded-lg text-[10px] font-mono">
                  {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleSpeedChange(spd)}
                      className={`px-1 py-0.5 rounded transition ${
                        playbackSpeed === spd
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
