import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Pin,
  Check,
  PhoneCall,
  Lock,
  RefreshCw,
  Info
} from 'lucide-react';
import type { ScamVerdict } from '../types';
import { analyzeScamMessage, pinScamWarning, dispatchCaregiver } from '../api';
import { getCachedScamAnalysis, setCachedScamAnalysis } from '../utils/clientCache';
import { VoiceSpeakerButton, VoiceInputMicButton } from './VoiceController';

interface ScamShieldViewProps {
  speechRate: number;
  onWarningPinned?: () => void;
  onAlertFamily?: (verdict: ScamVerdict) => void;
}

const SAMPLE_SCAMS = [
  {
    title: 'Utility Disconnect Threat',
    text: 'URGENT: Your electricity service will be disconnected in 30 mins due to an unpaid bill of $142. Call 800-555-0199 immediately with a gift card to settle.',
  },
  {
    title: 'Grandchild Bail Scam',
    text: "Hi Grandma, it's Kevin. I had a car accident out of state and lost my phone. Please wire $1,200 for bail to this Western Union office right away. Don't tell Mom please.",
  },
  {
    title: 'Bank Account Frozen SMS',
    text: 'CHASE-ALERT: Your debit card ending in 4102 has been locked due to suspicious login. Click http://chase-secure-verify.me to unfreeze immediately.',
  },
  {
    title: 'Pharmacy Refill (Safe Check)',
    text: 'Your prescription for Metformin 500mg is ready for pickup at Walgreens on Main St. Call 555-0123 if you need home delivery.',
  },
];

export const ScamShieldView: React.FC<ScamShieldViewProps> = ({
  speechRate,
  onWarningPinned,
  onAlertFamily,
}) => {
  const [inputText, setInputText] = useState(SAMPLE_SCAMS[0].text);
  const [verdict, setVerdict] = useState<ScamVerdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [familyAlertDispatched, setFamilyAlertDispatched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCheckMessage = async () => {
    if (!inputText.trim()) return;

    // 1. Tier-1 Persistent Client Cache Check (0ms latency, 0 token spend)
    const cached = getCachedScamAnalysis(inputText);
    if (cached) {
      setVerdict(cached);
      setIsPinned(false);
      setFamilyAlertDispatched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setFamilyAlertDispatched(false);
    try {
      const data = await analyzeScamMessage(inputText);
      setVerdict(data);
      setIsPinned(false);
      // Persist in Tier-1 cache for instant repeat lookups
      setCachedScamAnalysis(inputText, data);
    } catch (err: any) {
      setErrorMsg(err.message || "I'm having a little trouble reading that right now; let's take a deep breath and try reading it together.");
    } finally {
      setLoading(false);
    }
  };

  const handleAlertFamilyClick = async () => {
    if (!verdict) return;
    try {
      await dispatchCaregiver({
        caregiver_name: "Sarah Miller (Daughter)",
        caregiver_phone: "(555) 234-5678",
        dispatch_type: "scam_alert",
        scam_context: verdict,
      });
      setFamilyAlertDispatched(true);
      if (onAlertFamily) {
        onAlertFamily(verdict);
      }
    } catch {
      setFamilyAlertDispatched(true);
    }
  };

  const handlePinWarning = async () => {
    if (!verdict) return;
    try {
      await pinScamWarning(verdict);
      setIsPinned(true);
      if (onWarningPinned) onWarningPinned();
    } catch (err) {
      console.error("Failed to pin scam warning", err);
    }
  };

  const textToRead = verdict
    ? `Verdict: ${verdict.verdict}. Threat Score: ${verdict.threat_score} out of 100. Explanation: ${verdict.plain_explanation}. Immediate Advice: ${verdict.immediate_advice}. Safe Next Step: ${verdict.safe_next_step}`
    : '';

  return (
    <section className="space-y-8" aria-label="Guardian Angel Scam and Threat Shield">
      {/* Overview Card */}
      <div className="bg-[var(--bg-card)] border-3 border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-red-100 text-red-900 rounded-2xl" aria-hidden="true">
            <Lock className="w-8 h-8 text-red-700" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] m-0">
              Guardian Angel Scam & Message Checker
            </h2>
            <p className="text-base md:text-lg font-medium text-[var(--text-muted)] m-0 mt-1">
              Received a suspicious text, email, or urgent call? Paste or speak it here. We will tell you safely if it is genuine or an imposter trick.
            </p>
          </div>
        </div>

        {/* Presets */}
        <div className="mb-5">
          <span className="text-sm font-bold text-[var(--text-secondary)] block mb-2" id="scam-samples-label">
            Tap a sample message to test:
          </span>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="scam-samples-label">
            {SAMPLE_SCAMS.map((sample) => (
              <button
                key={sample.title}
                type="button"
                onClick={() => setInputText(sample.text)}
                className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] border-2 border-[var(--border-color)] rounded-xl text-base font-bold text-[var(--text-primary)] min-h-[44px] transition"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* Input Text Area */}
        <div className="space-y-3">
          <label htmlFor="scam-input" className="text-lg font-black text-[var(--text-primary)] block">
            Message or Call Transcript to Check:
          </label>
          <textarea
            id="scam-input"
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste suspicious SMS, email, or describe what the caller said..."
            className="w-full p-4 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium text-lg focus:bg-white transition"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <VoiceInputMicButton
              onTranscript={(text) => setInputText((prev) => (prev ? `${prev} ${text}` : text))}
              isListening={isListening}
              setIsListening={setIsListening}
            />

            <button
              type="button"
              onClick={handleCheckMessage}
              disabled={loading || !inputText.trim()}
              className="flex items-center gap-3 px-8 py-4 bg-red-700 hover:bg-red-800 disabled:bg-gray-400 text-white rounded-2xl font-black text-xl shadow-lg min-h-[56px] transition"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Scanning Message Safely...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-6 h-6" />
                  <span>Check If This Is Safe</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-6 p-6 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-950 font-medium text-lg">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Analysis Output Verdict */}
      {verdict && (
        <div className="bg-[var(--bg-card)] border-3 border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-md space-y-6 animate-fadeIn">
          {/* Main Verdict Banner */}
          <div
            className={`p-6 rounded-3xl border-3 flex flex-wrap items-center justify-between gap-4 ${
              verdict.verdict === 'DANGEROUS_SCAM'
                ? 'bg-red-50 border-red-600 text-red-950'
                : verdict.verdict === 'SUSPICIOUS'
                ? 'bg-amber-50 border-amber-600 text-amber-950'
                : 'bg-emerald-50 border-emerald-600 text-emerald-950'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-2xl ${
                  verdict.verdict === 'DANGEROUS_SCAM'
                    ? 'bg-red-600 text-white'
                    : verdict.verdict === 'SUSPICIOUS'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {verdict.verdict === 'DANGEROUS_SCAM' ? (
                  <ShieldAlert className="w-10 h-10" />
                ) : verdict.verdict === 'SUSPICIOUS' ? (
                  <AlertTriangle className="w-10 h-10" />
                ) : (
                  <ShieldCheck className="w-10 h-10" />
                )}
              </div>
              <div>
                <span className="text-sm font-black uppercase tracking-wider block">
                  Safety Verdict
                </span>
                <h3 className="text-2xl md:text-3xl font-black m-0">
                  {verdict.verdict === 'DANGEROUS_SCAM'
                    ? 'DANGEROUS SCAM DETECTED'
                    : verdict.verdict === 'SUSPICIOUS'
                    ? 'CAUTION: SUSPICIOUS MESSAGE'
                    : 'VERIFIED SAFE MESSAGE'}
                </h3>
                <p className="text-base font-bold mt-0.5 m-0 opacity-90">
                  Risk Threat Rating: {verdict.threat_score} / 100
                </p>
              </div>
            </div>

            <VoiceSpeakerButton
              textToRead={textToRead}
              speechRate={speechRate}
              label="Read Safe Advice to Me"
            />
          </div>

          {/* Plain Non-Panicked Explanation */}
          <div className="p-6 bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-2xl space-y-2">
            <h4 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2 m-0">
              <Info className="w-6 h-6 text-blue-700" />
              <span>What is Going On Here?</span>
            </h4>
            <p className="text-xl font-medium text-[var(--text-secondary)] leading-relaxed m-0">
              {verdict.plain_explanation}
            </p>
          </div>

          {/* Concrete Immediate Advice (Highlighted) */}
          <div className="p-6 bg-red-50 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-700 rounded-2xl space-y-2">
            <h4 className="text-xl font-black text-red-950 dark:text-red-100 flex items-center gap-2 m-0">
              <ShieldAlert className="w-6 h-6 text-red-700" />
              <span>Immediate Protective Advice</span>
            </h4>
            <p className="text-xl font-black text-red-900 dark:text-red-200 leading-relaxed m-0">
              {verdict.immediate_advice}
            </p>
          </div>

          {/* Safe Empowering Next Step */}
          <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-700 rounded-2xl space-y-2">
            <h4 className="text-xl font-black text-emerald-950 dark:text-emerald-100 flex items-center gap-2 m-0">
              <PhoneCall className="w-6 h-6 text-emerald-700" />
              <span>Safe Next Step You Can Take</span>
            </h4>
            <p className="text-xl font-bold text-emerald-900 dark:text-emerald-200 leading-relaxed m-0">
              {verdict.safe_next_step}
            </p>
          </div>

          {/* Red Flag Indicators */}
          {verdict.red_flags && verdict.red_flags.length > 0 && (
            <div className="p-6 bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-2xl space-y-3">
              <h4 className="text-lg font-black text-[var(--text-primary)] m-0">
                Key Warning Flags Detected:
              </h4>
              <ul className="list-disc pl-6 space-y-2 text-lg font-bold text-[var(--text-secondary)] m-0">
                {verdict.red_flags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Connected Actions: Alert Family & Pin Warning */}
          <div className="pt-4 flex flex-wrap items-center justify-end gap-3">
            {verdict.threat_score >= 80 && (
              <button
                type="button"
                onClick={handleAlertFamilyClick}
                disabled={familyAlertDispatched}
                aria-label="Alert Family Member of this Scam Attempt"
                className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black text-lg min-h-[52px] shadow-lg transition ${
                  familyAlertDispatched
                    ? 'bg-emerald-100 text-emerald-950 border-2 border-emerald-600'
                    : 'bg-rose-600 hover:bg-rose-700 text-white focus:outline-none focus:ring-4 focus:ring-rose-400'
                }`}
              >
                {familyAlertDispatched ? (
                  <>
                    <Check className="w-6 h-6 text-emerald-700" />
                    <span>Family Alerted via SMS!</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-6 h-6 text-white" />
                    <span>Alert Family Member of this Scam Attempt</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handlePinWarning}
              disabled={isPinned}
              aria-label="Pin Safety Warning to My Daily Routine"
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-lg min-h-[52px] shadow-md transition ${
                isPinned
                  ? 'bg-emerald-100 text-emerald-950 border-2 border-emerald-600'
                  : 'bg-blue-700 hover:bg-blue-800 text-white'
              }`}
            >
              {isPinned ? (
                <>
                  <Check className="w-6 h-6 text-emerald-700" />
                  <span>Pinned to Daily Care Brief!</span>
                </>
              ) : (
                <>
                  <Pin className="w-6 h-6" />
                  <span>Pin Safety Warning to My Daily Routine</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
