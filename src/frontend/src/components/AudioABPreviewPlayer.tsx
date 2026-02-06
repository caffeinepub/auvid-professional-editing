import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';

interface AudioABPreviewPlayerProps {
  originalUrl: string | null;
  editedUrl: string | null;
  onAudioElementReady?: (element: HTMLAudioElement) => void;
}

export default function AudioABPreviewPlayer({
  originalUrl,
  editedUrl,
  onAudioElementReady,
}: AudioABPreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [activeSource, setActiveSource] = useState<'original' | 'edited'>('original');

  const audioRef = useRef<HTMLAudioElement>(null);

  // Notify parent when audio element is ready
  useEffect(() => {
    if (audioRef.current && onAudioElementReady) {
      onAudioElementReady(audioRef.current);
    }
  }, [onAudioElementReady]);

  // Update audio source when switching between original and edited
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const wasPlaying = !audio.paused;
    const currentTimeSnapshot = audio.currentTime;

    // Switch source
    if (activeSource === 'original' && originalUrl) {
      audio.src = originalUrl;
    } else if (activeSource === 'edited' && editedUrl) {
      audio.src = editedUrl;
    }

    // Restore playback state
    audio.currentTime = currentTimeSnapshot;
    if (wasPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [activeSource, originalUrl, editedUrl]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((error) => {
        console.error('Playback error:', error);
      });
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasEditedAudio = editedUrl !== null;

  return (
    <div className="space-y-4">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={originalUrl || undefined}
        preload="metadata"
      />

      {/* A/B Source Selector */}
      {hasEditedAudio && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={activeSource === 'original' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSource('original')}
          >
            Original
          </Button>
          <Button
            variant={activeSource === 'edited' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSource('edited')}
          >
            Edited
          </Button>
          <Badge variant="secondary" className="ml-2">
            {activeSource === 'original' ? 'Playing Original' : 'Playing Edited'}
          </Badge>
        </div>
      )}

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleSkip(-10)}
          disabled={!originalUrl}
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="default"
          size="icon"
          className="h-12 w-12"
          onClick={handlePlayPause}
          disabled={!originalUrl}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => handleSkip(10)}
          disabled={!originalUrl}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          onValueChange={handleSeek}
          min={0}
          max={duration || 100}
          step={0.1}
          className="w-full"
          disabled={!originalUrl}
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <Slider
          value={[volume]}
          onValueChange={([value]) => setVolume(value)}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
        <span className="text-sm text-muted-foreground w-12 text-right">
          {volume}%
        </span>
      </div>
    </div>
  );
}
