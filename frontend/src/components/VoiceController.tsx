import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Square, Play, Pause } from 'lucide-react';

interface VoiceSpeakerProps {
  textToRead: string;
  speechRate?: number;
  label?: string;
}

export const VoiceSpeakerButton: React.FC<VoiceSpeakerProps> = ({
  textToRead,
  speechRate = 0.9,
  label = 'Read Aloud to Me',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert("Speech playback is not supported on this device's browser.");
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel(); // cancel any ongoing speech

    const cleanText = textToRead.replace(/[*_#`[\]()]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if ('speechSynthesis' in window && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2 flex-wrap" role="group" aria-label="Audio read aloud controls">
      {!isPlaying ? (
        <button
          type="button"
          onClick={handleSpeak}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-md min-h-[48px] focus-visible:ring-4"
          aria-label={`${label}: Click to listen`}
        >
          <Volume2 className="w-6 h-6" aria-hidden="true" />
          <span>{label}</span>
        </button>
      ) : (
        <div className="inline-flex items-center gap-2 bg-blue-50 border-2 border-blue-600 rounded-xl p-1.5 shadow-sm">
          {/* Animated wave visualizer */}
          <div className="flex items-center gap-1 px-2" aria-hidden="true">
            <span className="wave-bar w-1.5 bg-blue-700 rounded-full inline-block"></span>
            <span className="wave-bar w-1.5 bg-blue-700 rounded-full inline-block"></span>
            <span className="wave-bar w-1.5 bg-blue-700 rounded-full inline-block"></span>
          </div>

          <span className="text-sm font-bold text-blue-900 mr-1" aria-live="polite">
            {isPaused ? 'Paused' : 'Reading...'}
          </span>

          {isPaused ? (
            <button
              type="button"
              onClick={handleSpeak}
              className="p-2 bg-blue-700 text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center font-bold"
              aria-label="Resume reading"
            >
              <Play className="w-5 h-5" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="p-2 bg-amber-600 text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center font-bold"
              aria-label="Pause reading"
            >
              <Pause className="w-5 h-5" aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            onClick={handleStop}
            className="p-2 bg-red-600 text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center font-bold"
            aria-label="Stop reading"
          >
            <Square className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

interface VoiceInputMicProps {
  onTranscript: (text: string) => void;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
}

export const VoiceInputMicButton: React.FC<VoiceInputMicProps> = ({
  onTranscript,
  isListening,
  setIsListening,
}) => {
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const hasSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setSupported(hasSpeech);
  }, []);

  const toggleListen = () => {
    if (!supported) {
      alert("Microphone voice recognition is not supported in this browser. You can type in the box directly.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Speech recognition could not start:", err);
      setIsListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListen}
      className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-lg min-h-[52px] shadow-md transition-all ${
        isListening
          ? 'bg-red-600 text-white mic-active ring-4 ring-red-300'
          : 'bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] border-2 border-[var(--border-color)]'
      }`}
      aria-label={isListening ? "Microphone active. Click to stop speaking" : "Click to speak your message using voice"}
    >
      {isListening ? (
        <>
          <MicOff className="w-6 h-6 animate-pulse" aria-hidden="true" />
          <span>Listening... Tap when done</span>
        </>
      ) : (
        <>
          <Mic className="w-6 h-6 text-blue-700" aria-hidden="true" />
          <span>Speak Instead of Typing</span>
        </>
      )}
    </button>
  );
};
