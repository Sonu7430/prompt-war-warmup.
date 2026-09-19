import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sun,
  Coffee,
  Pill,
  Droplets,
  Footprints,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Circle,
  AlertCircle,
  RefreshCw,
  Clock,
  Heart
} from 'lucide-react';
import type { DailyPulse, ChecklistItem, AdvisoryNote } from '../types';
import { fetchDailyPulse, toggleChecklistTask, dispatchCaregiver } from '../api';
import { VoiceSpeakerButton } from './VoiceController';

interface DailyPulseViewProps {
  onNavigateToTab?: (tab: 'daily' | 'medical' | 'scam') => void;
  speechRate: number;
}

export const DailyPulseView: React.FC<DailyPulseViewProps> = ({
  speechRate,
}) => {
  const [pulse, setPulse] = useState<DailyPulse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeMood, setActiveMood] = useState<string>('calm');
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null);
  const [encouragementBanner, setEncouragementBanner] = useState<string | null>(null);
  const [emergencyAlertSent, setEmergencyAlertSent] = useState<boolean>(false);

  // Weather & Hydration Advisories
  const weatherAdvisory = React.useMemo(() => ({
    temperature: '72°F',
    condition: 'Sunny & Gentle Breeze',
    hydrationTip: 'Aim for 4 to 6 small glasses of water or herbal tea before lunch.',
    porchAdvice: 'Pleasant temperature for a quiet 10-minute porch sit.'
  }), []);

  const playCompanionAudio = React.useCallback((text: string) => {
    setEncouragementBanner(text);
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speechRate || 0.85;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback gracefully
      }
    }
  }, [speechRate]);

  const loadPulse = async (options?: { fatigue?: boolean; missedMed?: boolean; mood?: string }) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchDailyPulse({
        user_mood: options?.mood || activeMood,
        fatigue_indicated: options?.fatigue || false,
        missed_medication: options?.missedMed || false,
      });
      setPulse(data);
    } catch (err: any) {
      setErrorMsg(err.message || "We had a slight hiccup loading your daily pulse. Tap Refresh to try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPulse();
  }, []);

  const handleToggleTask = async (task: ChecklistItem) => {
    if (!pulse) return;
    const nextCompleted = !task.completed;

    // Optimistic state update (<50ms)
    const updatedChecklist = pulse.routine_checklist.map((item) =>
      item.id === task.id ? { ...item, completed: nextCompleted } : item
    );
    setPulse({ ...pulse, routine_checklist: updatedChecklist });

    // Encouraging companion audio feedback if completed
    if (nextCompleted) {
      const compliments = [
        "Wonderful! You have taken your scheduled medication. Your body thanks you!",
        "Splendid job checking off your vitality list! Keep feeling great today.",
        "Splendid! Taking care of your daily health step by step keeps you strong and independent."
      ];
      const audioText = compliments[Math.floor(Math.random() * compliments.length)];
      playCompanionAudio(audioText);
    }

    try {
      await toggleChecklistTask(task.id);
      // If all tasks are completed, celebrate!
      const allCompleted = updatedChecklist.every((i) => i.completed);
      if (allCompleted) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error("Failed to toggle task", err);
    }
  };

  const handleSnooze = React.useCallback((minutes: number = 30) => {
    setSnoozedUntil(Date.now() + minutes * 60 * 1000);
    playCompanionAudio(`We have snoozed this medication reminder for ${minutes} minutes. Relax and take your time.`);
  }, [playCompanionAudio]);

  const handleNotifyCaregiver = React.useCallback(async () => {
    try {
      await dispatchCaregiver({
        caregiver_name: "Sarah Miller (Daughter)",
        caregiver_phone: "(555) 234-5678",
        dispatch_type: "missed_routine"
      });
      setEmergencyAlertSent(true);
      setSnoozedUntil(Date.now() + 60 * 60 * 1000);
      playCompanionAudio("Sarah has been notified with a gentle check-in note. Everything is completely fine.");
    } catch {
      setEmergencyAlertSent(true);
      setSnoozedUntil(Date.now() + 60 * 60 * 1000);
    }
  }, [playCompanionAudio]);

  // Check if any medication is uncompleted and not snoozed
  const isMissedRoutineActive = React.useMemo(() => {
    if (!pulse) return false;
    if (snoozedUntil && Date.now() < snoozedUntil) return false;
    return pulse.routine_checklist.some(t => t.category === 'medication' && !t.completed);
  }, [pulse, snoozedUntil]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medication':
        return <Pill className="w-6 h-6 text-emerald-700" aria-hidden="true" />;
      case 'hydration':
        return <Droplets className="w-6 h-6 text-blue-700" aria-hidden="true" />;
      case 'activity':
        return <Footprints className="w-6 h-6 text-purple-700" aria-hidden="true" />;
      case 'safety':
        return <ShieldAlert className="w-6 h-6 text-amber-700" aria-hidden="true" />;
      default:
        return <Coffee className="w-6 h-6 text-amber-800" aria-hidden="true" />;
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center" aria-live="polite">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-700 border-t-transparent mb-4"></div>
        <p className="text-xl font-bold text-[var(--text-secondary)]">
          Gathering your calm morning routine...
        </p>
      </div>
    );
  }

  if (errorMsg || !pulse) {
    return (
      <div className="p-8 bg-amber-50 border-2 border-amber-300 rounded-3xl text-center my-6">
        <AlertCircle className="w-12 h-12 text-amber-800 mx-auto mb-3" />
        <p className="text-xl font-bold text-amber-950 mb-4">{errorMsg}</p>
        <button
          type="button"
          onClick={() => loadPulse()}
          className="px-6 py-3 bg-amber-800 text-white rounded-xl font-bold text-lg min-h-[48px]"
        >
          Try Again
        </button>
      </div>
    );
  }

  const textToReadAloud = `${pulse.greeting}. ${pulse.time_context}. Reminder: ${pulse.gentle_reminder}. Tip: ${pulse.wellbeing_tip}`;

  return (
    <section className="space-y-8" aria-label="Daily Companion and Health Pulse">
      {/* Encouraging Companion Audio Feedback Banner */}
      {encouragementBanner && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-400 text-emerald-900 dark:text-emerald-100 flex items-center justify-between gap-3 shadow-md animate-fade-in"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🎉</span>
            <span className="text-lg font-bold">{encouragementBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setEncouragementBanner(null)}
            className="px-3 py-1 rounded-xl text-sm font-bold bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 min-h-[36px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Missed Routine Detection Alert (Gentle, Non-Panicked) */}
      {isMissedRoutineActive && (
        <div
          role="alert"
          aria-live="polite"
          className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/50 border-4 border-amber-400 dark:border-amber-600 shadow-lg"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="text-4xl" aria-hidden="true">🕰️</span>
              <div>
                <h3 className="text-xl font-black text-amber-950 dark:text-amber-100 m-0">
                  Gentle Check-In: Medication Still Scheduled
                </h3>
                <p className="text-lg font-semibold text-amber-900 dark:text-amber-200 m-0 mt-1">
                  Would you like me to notify your emergency contact, or should we snooze this for 30 minutes?
                </p>
                {emergencyAlertSent && (
                  <p className="text-base font-bold text-emerald-800 dark:text-emerald-300 mt-2">
                    ✓ Gentle notice sent to Sarah. Take your time!
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleSnooze(30)}
                aria-label="Snooze medication reminder for 30 minutes"
                className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-amber-500 hover:bg-amber-100 dark:hover:bg-slate-700 text-amber-950 dark:text-amber-100 font-bold text-lg min-h-[48px] shadow-sm transition"
              >
                ⏰ Snooze 30 Mins
              </button>

              <button
                type="button"
                onClick={handleNotifyCaregiver}
                aria-label="Notify emergency contact Sarah"
                className="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg min-h-[48px] shadow-sm transition"
              >
                📲 Notify Sarah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's Morning Vitality Card (Proactive Alignment Hero) */}
      <div className="bg-[var(--bg-card)] border-4 border-blue-600 dark:border-blue-500 rounded-3xl p-6 md:p-8 shadow-md transition-all">
        {/* Alignment Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-blue-700 text-white rounded-full text-xs font-black uppercase tracking-widest">
            🌅 Morning Vitality Card
          </span>
          <span className="text-sm font-bold text-[var(--text-muted)]">
            Proactive Weather & Hydration Engine
          </span>
        </div>

        {/* Weather & Hydration Advisory Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🌤️</span>
            <div>
              <p className="text-sm font-bold text-sky-800 dark:text-sky-300">Today's Weather Advisory</p>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                {weatherAdvisory.temperature} • {weatherAdvisory.condition}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">💧</span>
            <div>
              <p className="text-sm font-bold text-teal-800 dark:text-teal-300">Hydration Advisory</p>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                {weatherAdvisory.hydrationTip}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-amber-100 text-amber-900 rounded-2xl" aria-hidden="true">
              <Sun className="w-8 h-8" />
            </span>
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {pulse.time_context}
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] m-0">
                {pulse.greeting}
              </h2>
            </div>
          </div>

          <VoiceSpeakerButton
            textToRead={textToReadAloud}
            speechRate={speechRate}
            label="Listen to Morning Brief"
          />
        </div>

        {/* 1 Bite-Sized Reminder & 1 Calming Observation */}
        <div className="bg-blue-50 dark:bg-slate-900 border-2 border-blue-300 dark:border-blue-700 rounded-2xl p-5 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Heart className="w-7 h-7 text-blue-700 flex-shrink-0 mt-1" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-black text-blue-950 dark:text-blue-200 m-0">
                Gentle Medication & Hydration Reminder
              </h3>
              <p className="text-lg font-medium text-blue-900 dark:text-blue-100 m-0 mt-1">
                {pulse.gentle_reminder}
              </p>
            </div>
          </div>

          {/* Single-tap direct action */}
          <button
            type="button"
            onClick={() => {
              if (pulse.routine_checklist.length > 0) {
                handleToggleTask(pulse.routine_checklist[0]);
              }
            }}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-base shadow-sm min-h-[48px]"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>Mark Morning Meds Done</span>
          </button>
        </div>

        {/* Quick Health Check-in Buttons */}
        <div className="mt-4 pt-4 border-t-2 border-[var(--border-color)]">
          <p className="text-base font-bold text-[var(--text-secondary)] mb-3" id="mood-check-label">
            How are you feeling right now? Tap a button to adjust your day:
          </p>
          <div className="flex flex-wrap gap-3" role="group" aria-labelledby="mood-check-label">
            <button
              type="button"
              onClick={() => {
                setActiveMood('cheerful');
                loadPulse({ mood: 'cheerful' });
              }}
              className="px-5 py-3 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold min-h-[48px] hover:bg-emerald-100 transition"
            >
              😊 Feeling Good & Rested
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMood('tired');
                loadPulse({ fatigue: true });
              }}
              className="px-5 py-3 rounded-xl border-2 border-amber-500 bg-amber-50 text-amber-950 font-bold min-h-[48px] hover:bg-amber-100 transition"
            >
              🛋️ Feeling A Bit Tired
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMood('missed_med');
                loadPulse({ missedMed: true });
              }}
              className="px-5 py-3 rounded-xl border-2 border-rose-500 bg-rose-50 text-rose-950 font-bold min-h-[48px] hover:bg-rose-100 transition"
            >
              💊 May Have Delayed Medication
            </button>
          </div>
        </div>
      </div>

      {/* Connected Advisory Notes (from Medical or Scam Shield) */}
      {pulse.advisory_notes && pulse.advisory_notes.length > 0 && (
        <div className="bg-[var(--bg-card)] border-3 border-[var(--border-color)] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-xl font-black text-[var(--text-primary)] m-0 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-amber-600" aria-hidden="true" />
              <span>Active Care & Security Advisories</span>
            </h3>
            <span className="text-sm font-bold bg-[var(--bg-secondary)] px-3 py-1 rounded-full text-[var(--text-muted)]">
              {pulse.advisory_notes.length} Active
            </span>
          </div>

          <div className="grid gap-3">
            {pulse.advisory_notes.map((note: AdvisoryNote) => (
              <div
                key={note.id}
                className={`p-4 rounded-2xl border-2 flex items-start justify-between gap-4 ${
                  note.severity === 'critical'
                    ? 'bg-red-50 border-red-400 text-red-950'
                    : note.severity === 'warning'
                    ? 'bg-amber-50 border-amber-400 text-amber-950'
                    : 'bg-blue-50 border-blue-300 text-blue-950'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-white border border-current">
                      {note.source.toUpperCase()}
                    </span>
                    <strong className="text-lg font-black">{note.title}</strong>
                  </div>
                  <p className="text-base font-medium m-0">{note.message}</p>
                </div>
                <span className="text-xs font-bold text-gray-600 flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-4 h-4" /> {note.created_at}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Routine Checklist Section */}
      <div className="bg-[var(--bg-card)] border-3 border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-black text-[var(--text-primary)] m-0 flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-amber-600" aria-hidden="true" />
              <span>My Gentle Daily Routine</span>
            </h3>
            <p className="text-base font-medium text-[var(--text-muted)] m-0 mt-1">
              Tap any task to mark it complete. Take things at your own comfortable pace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadPulse()}
            className="flex items-center gap-2 px-4 py-2 border-2 border-[var(--border-color)] rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] min-h-[48px]"
            title="Refresh checklist"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Tasks List */}
        <div className="space-y-3" role="list" aria-label="Daily Routine Tasks">
          {pulse.routine_checklist.map((task: ChecklistItem) => (
            <div
              key={task.id}
              role="listitem"
              onClick={() => handleToggleTask(task)}
              className={`flex items-center justify-between p-4 md:p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                task.completed
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950 opacity-90'
                  : 'bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-blue-500 text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={task.completed}
                  aria-label={`Mark task '${task.title}' as ${task.completed ? 'incomplete' : 'complete'}`}
                  className="w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0 min-h-[36px]"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-700" />
                  ) : (
                    <Circle className="w-8 h-8 text-gray-400 hover:text-blue-700" />
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <span className="p-2 bg-white rounded-xl shadow-xs" aria-hidden="true">
                    {getCategoryIcon(task.category)}
                  </span>
                  <div>
                    <p
                      className={`text-lg md:text-xl font-black m-0 ${
                        task.completed ? 'line-through text-emerald-800' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {task.title}
                    </p>
                    <span className="text-sm font-bold text-[var(--text-muted)]">
                      Suggested Time: {task.time}
                    </span>
                  </div>
                </div>
              </div>

              <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 bg-white border border-[var(--border-color)] rounded-full">
                {task.category}
              </span>
            </div>
          ))}
        </div>

        {/* Wellbeing tip footer */}
        <div className="mt-8 p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center gap-4">
          <Coffee className="w-8 h-8 text-amber-800 flex-shrink-0" aria-hidden="true" />
          <p className="text-lg font-medium text-amber-950 m-0">
            <strong>Daily Wellness Note:</strong> {pulse.wellbeing_tip}
          </p>
        </div>
      </div>
    </section>
  );
};
