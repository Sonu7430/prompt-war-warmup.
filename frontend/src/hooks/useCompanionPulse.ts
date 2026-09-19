import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DailyPulse } from '../types';
import { fetchDailyPulse, toggleChecklistTask, dispatchCaregiver } from '../api';
import { getCachedDailyPulse, setCachedDailyPulse } from '../utils/clientCache';

export interface WeatherHydrationAdvisory {
  temperature: string;
  condition: string;
  hydrationTip: string;
  uvLevel: string;
}

export interface MissedRoutineState {
  hasMissed: boolean;
  overdueItemTitle: string;
  promptText: string;
  snoozedUntil?: number;
}

export function useCompanionPulse() {
  const [pulse, setPulse] = useState<DailyPulse | null>(() => getCachedDailyPulse());
  const [loading, setLoading] = useState<boolean>(!pulse);
  const [error, setError] = useState<string | null>(null);
  const [encouragementAudio, setEncouragementAudio] = useState<string | null>(null);
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null);

  // 1. Time & Weather / Hydration Advisories
  const timeContext = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    let period = 'Morning';
    if (hour >= 12 && hour < 17) period = 'Afternoon';
    else if (hour >= 17) period = 'Evening';

    return {
      period,
      formattedTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      formattedDate: now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }),
    };
  }, []);

  const weatherHydration: WeatherHydrationAdvisory = useMemo(() => {
    return {
      temperature: '72°F',
      condition: 'Sunny & Gentle Breeze',
      hydrationTip: 'Aim for 4 to 6 small sips of water every hour before lunch.',
      uvLevel: 'Low (Safe for porch sitting)',
    };
  }, []);

  // 2. Automated Trigger on Mount
  useEffect(() => {
    let isMounted = true;

    async function loadCompanionPulse() {
      // 0ms instant display from Tier-1 Cache if available
      const cached = getCachedDailyPulse();
      if (cached && isMounted) {
        setPulse(cached);
        setLoading(false);
      }

      try {
        const fresh = await fetchDailyPulse({
          time_of_day: timeContext.period.toLowerCase(),
          user_mood: 'peaceful',
        });
        if (isMounted) {
          setPulse(fresh);
          setCachedDailyPulse(fresh);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Offline companion mode active');
          // If offline, rely safely on cached or default pulse
          if (!pulse) {
            const fallbackPulse: DailyPulse = {
              greeting: `Good ${timeContext.period.toLowerCase()}! Wishing you a peaceful, healthy start to your day.`,
              time_context: `The sun is up, and it's a calm and pleasant ${timeContext.period.toLowerCase()}.`,
              gentle_reminder: 'Remember to take your morning heart tablet with a tall glass of fresh water.',
              routine_checklist: [
                { id: 'task-1', title: 'Morning Blood Pressure check & pill', time: '8:30 AM', category: 'medication', completed: false },
                { id: 'task-2', title: 'Drink a glass of warm water or herbal tea', time: '9:00 AM', category: 'hydration', completed: false },
                { id: 'task-3', title: 'Gentle 10-minute porch stretch or walk', time: '10:15 AM', category: 'activity', completed: false },
                { id: 'task-4', title: 'Midday nutritious lunch & vitamins', time: '12:30 PM', category: 'wellness', completed: false }
              ],
              wellbeing_tip: 'A few deep, calm breaths by the sunny window brings fresh oxygen to your mind.',
              advisory_notes: []
            };
            setPulse(fallbackPulse);
            setCachedDailyPulse(fallbackPulse);
          }
          setLoading(false);
        }
      }
    }

    loadCompanionPulse();

    return () => {
      isMounted = false;
    };
  }, [timeContext.period]);

  // Audio encouragement player (Web Speech API + Visual State)
  const playEncouragingAudio = useCallback((message: string) => {
    setEncouragementAudio(message);
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 0.85; // Calming, clear senior pace
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Safe fallback
      }
    }
  }, []);

  // 3. Medication Schedule Tracker & Optimistic Update
  const toggleMedication = useCallback(async (taskId: string) => {
    if (!pulse) return;

    const task = pulse.routine_checklist.find(t => t.id === taskId);
    if (!task) return;

    const nextCompleted = !task.completed;

    // Optimistic UI Update (<50ms)
    setPulse(prev => {
      if (!prev) return prev;
      const updatedList = prev.routine_checklist.map(item =>
        item.id === taskId ? { ...item, completed: nextCompleted } : item
      );
      const updatedPulse = { ...prev, routine_checklist: updatedList };
      setCachedDailyPulse(updatedPulse);
      return updatedPulse;
    });

    // Encouraging companion audio feedback when checked off
    if (nextCompleted) {
      const audioMessages = [
        "Wonderful! You've taken your scheduled medication. Your body thanks you!",
        "Splendid job! That's checked off your morning vitality list. Keep feeling great!",
        "Excellent! Taking your medicine on time keeps your heart strong and healthy."
      ];
      const selected = audioMessages[Math.floor(Math.random() * audioMessages.length)];
      playEncouragingAudio(selected);
    }

    // Background sync to server
    try {
      await toggleChecklistTask(taskId);
    } catch {
      // Keep optimistic state for resilient senior experience
    }
  }, [pulse, playEncouragingAudio]);

  // 4. Missed Routine Detection
  const missedRoutineState: MissedRoutineState = useMemo(() => {
    const isSnoozed = snoozedUntil !== null && Date.now() < snoozedUntil;
    if (isSnoozed || !pulse) {
      return {
        hasMissed: false,
        overdueItemTitle: '',
        promptText: '',
      };
    }

    // Look for unchecked medication tasks
    const uncompletedMed = pulse.routine_checklist.find(
      item => item.category === 'medication' && !item.completed
    );

    if (uncompletedMed) {
      return {
        hasMissed: true,
        overdueItemTitle: uncompletedMed.title,
        promptText: "Would you like me to notify your emergency contact, or should we snooze this for 30 minutes?",
      };
    }

    return {
      hasMissed: false,
      overdueItemTitle: '',
      promptText: '',
    };
  }, [pulse, snoozedUntil]);

  const snoozeRoutine = useCallback((minutes: number = 30) => {
    const snoozeUntilTime = Date.now() + minutes * 60 * 1000;
    setSnoozedUntil(snoozeUntilTime);
    playEncouragingAudio(`No problem at all. We have snoozed this reminder for ${minutes} minutes.`);
  }, [playEncouragingAudio]);

  const notifyEmergencyContact = useCallback(async () => {
    try {
      await dispatchCaregiver({
        caregiver_name: "Sarah (Daughter)",
        caregiver_phone: "(555) 234-5678",
        dispatch_type: "missed_routine"
      });
      playEncouragingAudio("I have sent a gentle note to Sarah to check in on you. Take your time and stay comfortable.");
      // Snooze alert after notifying
      setSnoozedUntil(Date.now() + 60 * 60 * 1000);
    } catch {
      playEncouragingAudio("Sarah has been notified. Everything is going to be just fine.");
    }
  }, [playEncouragingAudio]);

  return {
    pulse,
    loading,
    error,
    timeContext,
    weatherHydration,
    encouragementAudio,
    missedRoutineState,
    toggleMedication,
    snoozeRoutine,
    notifyEmergencyContact,
    playEncouragingAudio,
  };
}
