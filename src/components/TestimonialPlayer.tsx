
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { textToSpeech, type TextToSpeechOutput } from "@/ai/flows/tts-flow";
import { Play, Pause, Loader2 } from "lucide-react";

interface TestimonialPlayerProps {
  textToSpeech: string;
}

export default function TestimonialPlayer({ textToSpeech }: TestimonialPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioData, setAudioData] = useState<TextToSpeechOutput | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioData && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await textToSpeech(textToSpeech);
      setAudioData(result);
    } catch (error) {
      console.error("Failed to generate speech:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (audioData && !audioRef.current) {
      const audio = new Audio(audioData.media);
      audioRef.current = audio;
      audio.play();
      setIsPlaying(true);

      audio.onended = () => {
        setIsPlaying(false);
      };
    }
  }, [audioData]);

  return (
    <div>
      <Button onClick={handlePlayPause} disabled={isLoading} variant="outline">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-5 w-5 mr-2" />
        ) : (
          <Play className="h-5 w-5 mr-2" />
        )}
        {isPlaying ? 'Pause' : 'Écouter le témoignage'}
      </Button>
    </div>
  );
}
