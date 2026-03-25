import React, { useState, useEffect, useRef } from 'react';
import { Play, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import Button from './ui/Button';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  courseId?: string;
  lessonId?: string;
  startTime?: number;
  totalDuration?: number;
  onProgress?: (currentTime: number) => void;
  onComplete?: () => void;
  onDurationLoaded?: (duration: number) => void;
  className?: string;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export default function VideoPlayer({ 
  videoId, 
  title, 
  courseId,
  lessonId,
  startTime = 0, 
  totalDuration,
  onProgress,
  onComplete,
  onDurationLoaded,
  className = "" 
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load YouTube API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      stopTracking();
    };
  }, [videoId, retryCount]);

  const initPlayer = () => {
    if (!window.YT || !window.YT.Player) return;

    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player(`youtube-player-${videoId}`, {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        fs: 1,
        start: Math.floor(startTime)
      },
      events: {
        onReady: (event: any) => {
          setIsLoading(false);
          setHasError(false);
          if (event.target && event.target.getDuration) {
            const duration = event.target.getDuration();
            onDurationLoaded?.(duration);
          }
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            startTracking();
          } else {
            stopTracking();
          }
          
          if (event.data === window.YT.PlayerState.ENDED) {
            onComplete?.();
          }
        },
        onError: () => {
          setHasError(true);
          setIsLoading(false);
        }
      }
    });
  };

  const startTracking = () => {
    stopTracking();
    
    // UI tracking (every 1s)
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = playerRef.current.getCurrentTime();
        onProgress?.(currentTime);
      }
    }, 1000); 

    // We'll let the parent (learn.tsx) decide when to sync to backend (e.g. every 15s)
    // Or we can add an onSync callback. For now, onProgress at 1s is enough
    // but the parent needs to throttle the backend call.
  };

  const stopTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    setHasError(false);
  };

  const openInYouTube = () => {
    const time = playerRef.current ? Math.floor(playerRef.current.getCurrentTime()) : Math.floor(startTime);
    const url = `https://www.youtube.com/watch?v=${videoId}${time > 30 ? `&t=${time}s` : ''}`;
    window.open(url, '_blank');
  };

  return (
    <div ref={containerRef} className={`relative aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Container for YT Player */}
      <div id={`youtube-player-${videoId}`} className="w-full h-full" />

      {/* Loading State */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Loading video...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
          <div className="text-center max-w-md px-6">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Video Unavailable</h3>
            <p className="text-gray-300 mb-6">
              Unable to load the video. This might be due to network issues or restrictions.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRetry} variant="outline" className="text-white border-white">
                Retry
              </Button>
              <Button onClick={openInYouTube} className="bg-red-600">
                Open in YouTube
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}