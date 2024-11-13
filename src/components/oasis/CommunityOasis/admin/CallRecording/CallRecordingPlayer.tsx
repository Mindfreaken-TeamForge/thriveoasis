import React, { useState, useRef, useEffect } from 'react';
import { storage, auth } from '@/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/components/ui/use-toast';
import PlaybackControls from './PlaybackControls';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';
import ErrorDisplay from './ErrorDisplay';

interface CallRecordingPlayerProps {
  src: string;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: Error) => void;
}

const CallRecordingPlayer: React.FC<CallRecordingPlayerProps> = ({
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
        const errorMessage = error instanceof Error ? error.message : 'Failed to load audio';
        setLoadError(errorMessage);
        onError?.(error instanceof Error ? error : new Error(errorMessage));
        
        toast({
          title: 'Error',
          description: 'Failed to load audio recording. Please check your permissions.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAudio();

    return () => cleanup();
  }, [src, onError, toast]);

  const cleanup = () => {
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to play audio';
      setLoadError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      
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

  const handleSeek = (value: number[]) => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      const time = (value[0] / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setProgress(value[0]);
    }
  };

  if (loadError) {
    return <ErrorDisplay error={loadError} />;
  }

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (audioRef.current && !isNaN(audioRef.current.duration)) {
              setDuration(audioRef.current.duration);
              setIsLoading(false);
              setLoadError(null);
            } else {
              startDurationCheck();
            }
          }}
          onError={(e) => {
            console.error('Audio error:', e);
            setIsLoading(false);
            setLoadError('Failed to load audio. Please check your permissions.');
            onError?.(new Error('Failed to load audio'));
            
            toast({
              title: 'Error',
              description: 'Failed to load audio recording. Please check your permissions.',
              variant: 'destructive',
            });
          }}
          onEnded={() => {
            setIsPlaying(false);
            setProgress(0);
          }}
          preload="metadata"
        />
      )}
      
      <div className="flex items-center space-x-4">
        <PlaybackControls
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlayPause={togglePlay}
          disabled={!audioUrl}
        />

        <ProgressBar
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          disabled={isLoading || !audioUrl}
        />

        <VolumeControl
          isMuted={isMuted}
          onToggleMute={toggleMute}
          disabled={isLoading || !audioUrl}
        />
      </div>
    </div>
  );
};

export default CallRecordingPlayer;