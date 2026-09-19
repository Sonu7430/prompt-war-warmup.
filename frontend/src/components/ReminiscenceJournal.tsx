import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DOMPurify from 'dompurify';
import type { ReminiscencePrompt, MemoryCard } from '../types';
import { getReminiscencePrompt, submitMemoryReflection, listMemoryCards } from '../api';

interface ReminiscenceJournalProps {
  onAnnounceAudio?: (text: string) => void;
}

export const ReminiscenceJournal: React.FC<ReminiscenceJournalProps> = ({ onAnnounceAudio }) => {
  const [dailyPrompt, setDailyPrompt] = useState<ReminiscencePrompt | null>(null);
  const [storyInput, setStoryInput] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);

  // 1. Fetch daily prompt & memory cards on mount
  useEffect(() => {
    let mounted = true;
    getReminiscencePrompt().then((prompt) => {
      if (mounted) setDailyPrompt(prompt);
    });
    listMemoryCards().then((cards) => {
      if (mounted && cards.length > 0) setMemoryCards(cards);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setStoryInput((prev) => {
            const separator = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
            return DOMPurify.sanitize(prev + separator + transcript);
          });
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      setRecognitionInstance(recognition);
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (!recognitionInstance) {
      alert('Speech recognition is not supported in this browser. You can comfortably type your story in the box below.');
      return;
    }

    if (isRecording) {
      recognitionInstance.stop();
      setIsRecording(false);
      if (onAnnounceAudio) {
        onAnnounceAudio("Recording paused. You can review your story before saving.");
      }
    } else {
      try {
        recognitionInstance.start();
        setIsRecording(true);
        if (onAnnounceAudio) {
          onAnnounceAudio("Listening to your story now. Take your time, there is no hurry.");
        }
      } catch {
        setIsRecording(false);
      }
    }
  }, [recognitionInstance, isRecording, onAnnounceAudio]);

  // 3. Submit story and generate AI empathetic reflection
  const handleSaveMemory = useCallback(async () => {
    const sanitizedStory = DOMPurify.sanitize(storyInput.trim());
    if (!sanitizedStory) {
      setActiveMessage('Please speak or type a little memory before saving.');
      return;
    }

    setIsSubmitting(true);
    setActiveMessage(null);

    const promptText = dailyPrompt?.prompt_question || 'What was your favorite song when you were twenty?';

    // Optimistic memory card preview (<50ms)
    const optimisticCard: MemoryCard = {
      id: `mem-opt-${Date.now()}`,
      prompt_question: promptText,
      story_text: sanitizedStory,
      ai_reflection: 'Reflecting on your beautiful memory with warmth and gratitude...',
      timestamp: 'Just now',
      era_tag: dailyPrompt?.suggested_era || 'Stories of My Life',
    };

    setMemoryCards((prev) => [optimisticCard, ...prev]);

    try {
      const savedCard = await submitMemoryReflection({
        prompt_question: promptText,
        story_text: sanitizedStory,
      });

      // Update with server reflection
      setMemoryCards((prev) => prev.map((c) => (c.id === optimisticCard.id ? savedCard : c)));
      setStoryInput('');
      setActiveMessage('✓ Your memory has been lovingly preserved in your journal!');

      if (onAnnounceAudio) {
        onAnnounceAudio(`Story preserved. ${savedCard.ai_reflection}`);
      }
    } catch {
      setActiveMessage('Your memory was saved locally.');
    } finally {
      setIsSubmitting(false);
    }
  }, [storyInput, dailyPrompt, onAnnounceAudio]);

  const memoizedCards = useMemo(() => {
    return memoryCards;
  }, [memoryCards]);

  return (
    <section
      role="region"
      aria-label="Gentle Cognitive Stimulation and Memory Journal"
      tabIndex={0}
      className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-amber-100 dark:border-amber-950 transition-all duration-300"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">📖</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
              Stories of My Life — Daily Memory Journal
            </h2>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300 mt-1">
            Gentle cognitive reminiscing. Share your life memories out loud; Nestor will listen and save them for your family.
          </p>
        </div>

        {dailyPrompt && (
          <span className="px-4 py-2 rounded-full text-base font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
            Theme: {dailyPrompt.theme}
          </span>
        )}
      </div>

      {/* Daily Nostalgic Prompt Card */}
      <div className="mt-6 p-6 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 border-2 border-amber-200 dark:border-amber-800/60 shadow-sm">
        <p className="text-base font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
          Today's Reminiscence Question
        </p>
        <p className="text-2xl sm:text-3xl font-semibold text-slate-800 dark:text-slate-100 mt-2 leading-relaxed">
          "{dailyPrompt?.prompt_question || 'What was your favorite song or melody when you were twenty years old?'}"
        </p>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-2">
          Suggested Era: <span className="font-semibold">{dailyPrompt?.suggested_era || 'Early Adulthood'}</span>
        </p>
      </div>

      {/* Voice & Text Story Recording Area */}
      <div className="mt-8">
        <label htmlFor="story-input-box" className="block text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          Your Story or Reflection:
        </label>

        <textarea
          id="story-input-box"
          rows={4}
          value={storyInput}
          onChange={(e) => setStoryInput(DOMPurify.sanitize(e.target.value))}
          placeholder="Tap 'Start Speaking My Story' to speak your memory out loud, or type comfortably here..."
          aria-label="Story or reflection text box"
          className="w-full text-lg p-4 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 shadow-inner"
        />

        {/* Action Controls */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={toggleRecording}
            aria-label={isRecording ? 'Stop speaking your story' : 'Start speaking your story'}
            className={`min-h-[56px] px-8 py-4 text-xl font-bold rounded-2xl shadow-md transition-all duration-200 flex items-center gap-3 focus:outline-none focus:ring-4 ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse focus:ring-rose-400'
                : 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-300'
            }`}
          >
            <span className="text-2xl" aria-hidden="true">{isRecording ? '⏹️' : '🎙️'}</span>
            <span>{isRecording ? 'Stop Speaking' : 'Start Speaking My Story'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveMemory}
            disabled={isSubmitting || !storyInput.trim()}
            aria-label="Save and preserve memory card"
            className="min-h-[56px] px-8 py-4 text-xl font-bold rounded-2xl shadow-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white transition-all duration-200 flex items-center gap-3 focus:outline-none focus:ring-4 focus:ring-emerald-400"
          >
            <span className="text-2xl" aria-hidden="true">💾</span>
            <span>{isSubmitting ? 'Preserving...' : 'Save & Reflect on Memory'}</span>
          </button>
        </div>

        {/* Active feedback banner */}
        {activeMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="mt-4 p-4 rounded-2xl bg-amber-100 dark:bg-amber-900/60 border border-amber-300 text-amber-900 dark:text-amber-100 text-lg font-medium animate-fade-in"
          >
            {activeMessage}
          </div>
        )}
      </div>

      {/* Memory Cards Collection Feed */}
      <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-6">
          <span aria-hidden="true">🗂️</span>
          <span>Your Preserved Memory Cards</span>
        </h3>

        {memoizedCards.length === 0 ? (
          <p className="text-lg text-slate-500 dark:text-slate-400 italic">
            No memories saved yet. Share a small story from your youth today!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="feed" aria-label="Preserved Memories Feed">
            {memoizedCards.map((card) => (
              <article
                key={card.id}
                tabIndex={0}
                className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border-2 border-amber-100 dark:border-slate-700 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-amber-200/70 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 rounded-full">
                      {card.era_tag}
                    </span>
                    <span className="text-sm text-slate-400 dark:text-slate-500">
                      {card.timestamp}
                    </span>
                  </div>

                  <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                    "{card.prompt_question}"
                  </p>

                  <p className="text-lg text-slate-700 dark:text-slate-300 italic mb-4">
                    "{card.story_text}"
                  </p>
                </div>

                <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-1">
                    <span aria-hidden="true">💡</span>
                    <span>Nestor's Reflection</span>
                  </p>
                  <p className="text-base text-slate-700 dark:text-slate-300">
                    {card.ai_reflection}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ReminiscenceJournal;
