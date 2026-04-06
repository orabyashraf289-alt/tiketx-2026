import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Music, Volume2, VolumeX, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const MUSIC_PROMPTS = [
  'Calm ambient electronic music with soft pads, gentle piano, and minimal beats. Perfect for focused studying and learning. Relaxing and non-distracting.',
  'Soft lo-fi hip hop beats with warm jazzy chords and vinyl crackle. Ideal background music for reading and concentration.',
  'Peaceful ambient soundscape with soft synth textures, gentle bells, and nature-inspired tones. Meditative and calming.',
  'Minimal classical-inspired ambient music with soft strings and piano. Elegant and serene, perfect for quiet study.',
];

export function TrainingMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const generateAndPlay = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const prompt = MUSIC_PROMPTS[Math.floor(Math.random() * MUSIC_PROMPTS.length)];

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-music`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt, duration: 60 }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      
      // Clean up previous blob URL
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      blobUrlRef.current = audioUrl;

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audio.volume = isMuted ? 0 : volume;
      audio.loop = true;
      audioRef.current = audio;

      await audio.play();
      setIsPlaying(true);
      toast.success('🎵 تم تشغيل الموسيقى الخلفية');
    } catch (error) {
      console.error('Music generation error:', error);
      toast.error('فشل في توليد الموسيقى. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, volume, isMuted]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) {
      generateAndPlay();
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, generateAndPlay]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (audioRef.current) {
        audioRef.current.volume = newMuted ? 0 : volume;
      }
      return newMuted;
    });
  }, [volume]);

  const handleVolumeChange = useCallback((val: number[]) => {
    const newVol = val[0];
    setVolume(newVol);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  }, []);

  const regenerate = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    generateAndPlay();
  }, [generateAndPlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={isPlaying ? 'default' : 'outline'}
          size="sm"
          className="gap-2 text-xs h-8"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Music className={`h-3.5 w-3.5 ${isPlaying ? 'animate-pulse' : ''}`} />
          )}
          {isLoading ? 'جاري التحميل...' : isPlaying ? 'موسيقى خلفية' : 'موسيقى'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 space-y-4" align="end">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">موسيقى خلفية</p>
          <p className="text-[10px] text-muted-foreground">ElevenLabs AI</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={togglePlay} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Music className="h-3.5 w-3.5" />}
            {isPlaying ? 'إيقاف' : 'تشغيل'}
          </Button>
          {audioRef.current && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={regenerate} disabled={isLoading} title="مقطع جديد">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={toggleMute}>
            {isMuted || volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.05}
            className="flex-1"
          />
          <span className="text-[10px] text-muted-foreground w-8 text-center">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
