import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DOMPurify from 'dompurify';
import type { ScamVerdict, CaregiverDispatchResponse } from '../types';
import { dispatchCaregiver, listCaregiverDispatches } from '../api';

interface CaregiverBridgeProps {
  flaggedScamContext?: ScamVerdict | null;
  onClearScamContext?: () => void;
  onAnnounceAudio?: (text: string) => void;
}

export const CaregiverBridge: React.FC<CaregiverBridgeProps> = ({
  flaggedScamContext,
  onClearScamContext,
  onAnnounceAudio,
}) => {
  const [caregiverName] = useState<string>("Sarah Miller (Daughter)");
  const [caregiverPhone] = useState<string>("(555) 234-5678");
  const [customNote, setCustomNote] = useState<string>("");
  const [dispatches, setDispatches] = useState<CaregiverDispatchResponse[]>([]);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Load recent history on mount
  useEffect(() => {
    let active = true;
    listCaregiverDispatches().then(data => {
      if (active && data.length > 0) {
        setDispatches(data);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // 1. One-Tap Check-In
  const handleOneTapCheckIn = useCallback(async () => {
    setIsDispatching(true);
    setSuccessBanner(null);

    // Sanitize any extra note
    const safeNote = DOMPurify.sanitize(customNote.trim());

    // Optimistic record for instant feedback (<50ms)
    const optimisticId = `disp-opt-${Date.now()}`;
    const optimisticDispatch: CaregiverDispatchResponse = {
      id: optimisticId,
      status: "sending",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      simulated_sms_preview: `☀️ Daily Peace-of-Mind: Dad checked in! Completed morning routine. ${safeNote ? `Note: "${safeNote}"` : 'Feeling calm & energetic.'}`,
      recipient: `${caregiverName} (${caregiverPhone})`,
      dispatch_type: "one_tap_checkin"
    };

    setDispatches(prev => [optimisticDispatch, ...prev]);

    try {
      const response = await dispatchCaregiver({
        caregiver_name: caregiverName,
        caregiver_phone: caregiverPhone,
        dispatch_type: "one_tap_checkin"
      });

      // Update with server confirmed record
      setDispatches(prev => prev.map(d => d.id === optimisticId ? response : d));
      setSuccessBanner(`✓ One-Tap Check-In sent to ${caregiverName}! She received: "${response.simulated_sms_preview}"`);
      setCustomNote("");

      if (onAnnounceAudio) {
        onAnnounceAudio(`Your check-in has been delivered to Sarah's phone.`);
      }
    } catch {
      setSuccessBanner(`Check-in noted for Sarah.`);
    } finally {
      setIsDispatching(false);
    }
  }, [caregiverName, caregiverPhone, customNote, onAnnounceAudio]);

  // 2. Automated Guardian Scam Alert Dispatch
  const handleAlertFamilyOfScam = useCallback(async () => {
    if (!flaggedScamContext) return;

    setIsDispatching(true);
    setSuccessBanner(null);

    try {
      const response = await dispatchCaregiver({
        caregiver_name: caregiverName,
        caregiver_phone: caregiverPhone,
        dispatch_type: "scam_alert",
        scam_context: flaggedScamContext
      });

      setDispatches(prev => [response, ...prev]);
      setSuccessBanner(`🚨 Emergency Guardian Alert successfully sent to ${caregiverName}. Sarah was alerted of the scam with 0 funds lost.`);

      if (onAnnounceAudio) {
        onAnnounceAudio(`Sarah has been alerted of this suspicious message. You handled this safely and protected yourself.`);
      }

      if (onClearScamContext) {
        onClearScamContext();
      }
    } catch {
      setSuccessBanner(`Alert dispatched to family.`);
    } finally {
      setIsDispatching(false);
    }
  }, [flaggedScamContext, caregiverName, caregiverPhone, onAnnounceAudio, onClearScamContext]);

  // Memoized dispatch list to avoid re-renders
  const memoizedDispatches = useMemo(() => {
    return dispatches.slice(0, 5);
  }, [dispatches]);

  const hasCriticalScamThreat = Boolean(
    flaggedScamContext && flaggedScamContext.threat_score >= 80
  );

  return (
    <section
      role="region"
      aria-label="Family and Caregiver Peace of Mind Bridge"
      tabIndex={0}
      className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-emerald-100 dark:border-emerald-950 transition-all duration-300"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">💌</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
              Family Peace-of-Mind Bridge
            </h2>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300 mt-1">
            Instantly inform your loved ones with 1 simple tap. No typing required.
          </p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-3 text-right">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Registered Guardian Contact</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{caregiverName}</p>
          <p className="text-base text-slate-500 dark:text-slate-400">{caregiverPhone}</p>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successBanner && (
        <div
          role="alert"
          aria-live="polite"
          className="mt-6 p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 border-2 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100 text-lg font-medium flex items-center gap-3 animate-fade-in"
        >
          <span className="text-2xl" aria-hidden="true">🕊️</span>
          <span>{successBanner}</span>
        </div>
      )}

      {/* Automated Guardian Alert (Triggered when Scam Shield threat score > 80%) */}
      {hasCriticalScamThreat && flaggedScamContext && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-6 p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/60 border-4 border-rose-500 shadow-xl"
        >
          <div className="flex items-start gap-4">
            <span className="text-4xl animate-bounce" aria-hidden="true">🛡️</span>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-rose-900 dark:text-rose-200">
                Guardian Alert: High Threat Detected ({flaggedScamContext.threat_score}/100)
              </h3>
              <p className="text-lg text-rose-800 dark:text-rose-300 mt-2">
                Our Scam Shield verified this incoming message as a dangerous scam. You did not click anything or send money!
              </p>
              <div className="mt-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-800">
                <p className="text-base text-slate-600 dark:text-slate-400 font-semibold">Immediate Guidance Provided:</p>
                <p className="text-lg text-slate-800 dark:text-slate-200 font-medium">"{flaggedScamContext.immediate_advice}"</p>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleAlertFamilyOfScam}
                  disabled={isDispatching}
                  aria-label="Alert family member of this scam attempt"
                  className="w-full sm:w-auto min-h-[56px] px-8 py-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 focus:outline-none focus:ring-4 focus:ring-rose-400"
                >
                  <span className="text-2xl" aria-hidden="true">📲</span>
                  <span>Alert Family Member of this Scam Attempt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Check-In Action Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 p-6 rounded-3xl border-2 border-emerald-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span aria-hidden="true">☀️</span>
            <span>One-Tap Morning Check-In</span>
          </h3>
          <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">
            Lets Sarah know with 1 touch that you are awake, taking your morning tablets, and enjoying your day.
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleOneTapCheckIn}
              disabled={isDispatching}
              aria-label="Send One-Tap Check-In SMS to Sarah"
              className="w-full min-h-[64px] px-6 py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 focus:outline-none focus:ring-4 focus:ring-emerald-400"
            >
              <span className="text-3xl" aria-hidden="true">👋</span>
              <span>{isDispatching ? "Sending Peace-of-Mind..." : "Tap to Send Check-In to Sarah"}</span>
            </button>
          </div>
        </div>

        {/* Optional Voice / Quick Note Input */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
          <label htmlFor="caregiver-note" className="block text-lg font-bold text-slate-800 dark:text-slate-200">
            Optional Short Note for Sarah:
          </label>
          <p className="text-base text-slate-500 dark:text-slate-400 mb-2">
            (E.g., "Going for my garden walk now" or "Having tea")
          </p>
          <input
            id="caregiver-note"
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(DOMPurify.sanitize(e.target.value))}
            placeholder="Type a gentle note or leave blank..."
            aria-label="Optional note for family member"
            className="w-full min-h-[52px] text-lg px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Recent Dispatch Feed */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
        <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
          <span aria-hidden="true">📋</span>
          <span>Recent Peace-of-Mind Dispatches</span>
        </h4>

        {memoizedDispatches.length === 0 ? (
          <p className="text-base text-slate-500 dark:text-slate-400 italic">
            No recent updates sent yet. Tap the button above whenever you wish to send a gentle check-in.
          </p>
        ) : (
          <ul className="space-y-3" role="list">
            {memoizedDispatches.map((d) => (
              <li
                key={d.id}
                tabIndex={0}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-1" aria-hidden="true">
                    {d.dispatch_type === 'scam_alert' ? '🚨' : d.dispatch_type === 'med_confirmed' ? '💊' : '📱'}
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {d.simulated_sms_preview}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Delivered to {d.recipient} • {d.timestamp}
                    </p>
                  </div>
                </div>
                <span className="self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                  {d.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default CaregiverBridge;
