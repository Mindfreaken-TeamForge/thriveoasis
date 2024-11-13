import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { storage, auth } from '@/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/components/ui/use-toast';

interface AudioPlayerProps {
  src: string;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: Error) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  src, 
  onPlay, 
  onPause,
  onError 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const durationCheckInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const loadAudio = async () => {
      if (!src) {
        setLoadError('No audio source provided');
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);

        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Get a fresh auth token
        const token = await user.getIdToken(true);

        // Get the download URL from Firebase Storage
        const storageRef = ref(storage, src);
        const url = await getDownloadURL(storageRef);

        // Create URL with auth token
        const audioUrl = new URL(url);
        audioUrl.searchParams.append('auth', token);
        setAudioUrl(audioUrl.toString());

        // Start checking for duration once audio is loaded
        startDurationCheck();

      } catch (error) {
        console.error('Error loading audio:', error);
        setLoadError('Failed to load audio. Please try again.');
        onError?.(error instanceof Error ? error : new Error('Failed to load audio'));
        
        toast({
          title: 'Error',
          description: 'Failed to load audio. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        URL.revokeObjectURL(audioRef.current.src);
        setAudioUrl(null);
      }
      if (durationCheckInterval.current) {
        clearInterval(durationCheckInterval.current);
      }
    };
  }, [src, onError, toast]);

  const startDurationCheck = () => {
    if (durationCheckInterval.current) {
      clearInterval(durationCheckInterval.current);
    }

    durationCheckInterval.current = setInterval(() => {
      if (audioRef.current && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
        clearInterval(durationCheckInterval.current);
      }
    }, 100);
  };

  const togglePlay = async () => {
    if (!audioRef.current || !audioUrl) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        onPause?.();
      } else {
        if (audioRef.current.readyState < 2) {
          setIsLoading(true);
          await new Promise((resolve, reject) => {
            if (!audioRef.current) return reject(new Error('Audio element not found'));
            
            const handleCanPlay = () => {
              audioRef.current?.removeEventListener('canplay', handleCanPlay);
              resolve(true);
            };
            
            const handleError = (e: Event) => {
              audioRef.current?.removeEventListener('error', handleError);
              reject(new Error('Failed to load audio'));
            };
            
            audioRef.current.addEventListener('canplay', handleCanPlay);
            audioRef.current.addEventListener('error', handleError);
          });
        }
        
        const playPromise = audioRef.current.play();
        if (playPromise) {
          await playPromise;
          onPlay?.();
        }
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error playing audio:', error);
      setLoadError('Failed to play audio. Please try again.');
      onError?.(error instanceof Error ? error : new Error('Failed to play audio'));
      
      toast({
        title: 'Error',
        description: 'Failed to play audio. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      if (!isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
        const currentTime = audioRef.current.currentTime;
        setCurrentTime(currentTime);
        const progress = (currentTime / audioRef.current.duration) * 100;
        setProgress(progress);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
      setLoadError(null);
    } else {
      startDurationCheck();
    }
  };

  const handleLoadError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio error:', e);
    setIsLoading(false);
    setLoadError('Failed to load audio. Please try again.');
    onError?.(new Error('Failed to load audio'));
    
    toast({
      title: 'Error',
      description: 'Failed to load audio. Please try again.',
      variant: 'destructive',
    });
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      const time = (value[0] / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setProgress(value[0]);
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loadError) {
    return (
      <div className="bg-red-500/10 p-4 rounded-lg flex items-center space-x-2 text-red-500">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm">{loadError}</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleLoadError}
          onEnded={() => {
            setIsPlaying(false);
            setProgress(0);
          }}
          preload="metadata"
        />
      )}
      
      <div className="flex items-center space-x-4">
        <Button
          onClick={togglePlay}
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0"
          disabled={isLoading || !audioUrl}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1">
          <Slider
            value={[progress]}
            max={100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
            disabled={isLoading || !audioUrl}
          />
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <Button
          onClick={toggleMute}
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0"
          disabled={isLoading || !audioUrl}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default AudioPlayer;