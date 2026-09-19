import React, { useState } from 'react';
import {
  FileText,
  HelpCircle,
  Stethoscope,
  Pin,
  Check,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import type { SimplifiedDoc } from '../types';
import { simplifyMedicalDocument, pinMedicalAction } from '../api';
import { VoiceSpeakerButton, VoiceInputMicButton } from './VoiceController';

interface MedicalSimplifierViewProps {
  speechRate: number;
  onItemPinned?: () => void;
}

const SAMPLE_DOCS = [
  {
    title: 'Blood Pressure Slip',
    text: 'Patient presents with Stage 1 Essential Hypertension. Systolic 138, Diastolic 88. Prescribed Amlodipine 5mg QD. Monitor sodium intake and daily activity.',
  },
  {
    title: 'Cholesterol Lab Panel',
    text: 'Lipid Panel: Total Cholesterol 242 mg/dL, LDL Cholesterol 164 mg/dL (Elevated). Triglycerides 180 mg/dL. Prescribed Atorvastatin 20mg daily at bedtime.',
  },
  {
    title: 'High Potassium (Urgent)',
    text: 'Comprehensive Metabolic Panel reveals serum potassium 5.8 mEq/L (Hyperkalemia). ECG demonstrates peaked T waves. Immediate doctor evaluation indicated.',
  },
];

export const MedicalSimplifierView: React.FC<MedicalSimplifierViewProps> = ({
  speechRate,
  onItemPinned,
}) => {
  const [inputText, setInputText] = useState(SAMPLE_DOCS[0].text);
  const [result, setResult] = useState<SimplifiedDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pinnedItems, setPinnedItems] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSimplify = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await simplifyMedicalDocument(inputText);
      setResult(data);
      setPinnedItems({});
    } catch (err: any) {
      setErrorMsg(err.message || "I'm having a little trouble reading that right now; let's try reading it together.");
    } finally {
      setLoading(false);
    }
  };

  const handlePinAction = async (actionItem: string, index: number) => {
    try {
      await pinMedicalAction(actionItem, 'Doctor Recommendation');
      setPinnedItems((prev) => ({ ...prev, [index]: true }));
      if (onItemPinned) onItemPinned();
    } catch (err) {
      console.error("Failed to pin medical item", err);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-100 border-2 border-red-600 text-red-950 font-black rounded-full text-base">
            <AlertTriangle className="w-5 h-5 text-red-600" /> Urgent: Prompt Medical Attention Needed
          </span>
        );
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-100 border-2 border-amber-600 text-amber-950 font-black rounded-full text-base">
            <AlertTriangle className="w-5 h-5 text-amber-600" /> Follow-Up Needed Soon
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-100 border-2 border-emerald-600 text-emerald-950 font-black rounded-full text-base">
            <Check className="w-5 h-5 text-emerald-600" /> Routine Care & Wellness Check
          </span>
        );
    }
  };

  const textToRead = result
    ? `Summary: ${result.summary}. Analogy: ${result.analogy}. Action Items: ${result.action_items.join(
        '. '
      )}. Questions for your doctor: ${result.questions_for_doctor.join('. ')}`
    : '';

  return (
    <section className="space-y-8" aria-label="Translate to Plain English Medical Simplifier">
      {/* Introduction Card */}
      <div className="bg-[var(--bg-card)] border-3 border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl" aria-hidden="true">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] m-0">
              Translate to Plain English
            </h2>
            <p className="text-base md:text-lg font-medium text-[var(--text-muted)] m-0 mt-1">
              Paste or speak any lab report, prescription slip, or doctor's letter. We translate medical jargon into clear, comforting everyday words.
            </p>
          </div>
        </div>

        {/* Preset Sample Buttons */}
        <div className="mb-5">
          <span className="text-sm font-bold text-[var(--text-secondary)] block mb-2" id="preset-label">
            Or try one of these common examples:
          </span>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="preset-label">
            {SAMPLE_DOCS.map((sample) => (
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
          <label htmlFor="medical-input" className="text-lg font-black text-[var(--text-primary)] block">
            Your Medical or Official Document Text:
          </label>
          <textarea
            id="medical-input"
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste medical text here..."
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
              onClick={handleSimplify}
              disabled={loading || !inputText.trim()}
              className="flex items-center gap-3 px-8 py-4 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white rounded-2xl font-black text-xl shadow-lg min-h-[56px] transition"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Translating Plain English...</span>
                </>
              ) : (
                <>
                  <FileText className="w-6 h-6" />
                  <span>Simplify for Me</span>
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

      {/* Result Presentation Card */}
      {result && (
        <div className="bg-[var(--bg-card)] border-3 border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-md space-y-8 animate-fadeIn">
          {/* Header with Urgency and Read Aloud */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b-2 border-[var(--border-color)]">
            <div>
              <div className="mb-2">{getUrgencyBadge(result.urgency_level)}</div>
              <h3 className="text-2xl font-black text-[var(--text-primary)] m-0">
                Here is what your document says in Plain English:
              </h3>
            </div>

            <VoiceSpeakerButton
              textToRead={textToRead}
              speechRate={speechRate}
              label="Read This Summary to Me"
            />
          </div>

          {/* Section 1: Summary & Analogy */}
          <div className="space-y-4">
            <div className="p-6 bg-blue-50 dark:bg-slate-900 border-2 border-blue-200 dark:border-blue-700 rounded-2xl">
              <h4 className="text-xl font-black text-blue-950 dark:text-blue-100 flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-blue-700" />
                <span>1. What This Means (The Big Picture)</span>
              </h4>
              <p className="text-xl text-blue-900 dark:text-blue-200 font-medium leading-relaxed m-0">
                {result.summary}
              </p>
            </div>

            {/* Everyday Analogy */}
            <div className="p-6 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-2xl">
              <h4 className="text-xl font-black text-amber-950 dark:text-amber-200 flex items-center gap-2 mb-2">
                <Lightbulb className="w-6 h-6 text-amber-700" />
                <span>An Everyday Analogy to Picture It</span>
              </h4>
              <p className="text-xl text-amber-900 dark:text-amber-100 font-medium leading-relaxed m-0 italic">
                "{result.analogy}"
              </p>
            </div>
          </div>

          {/* Section 2: Action Items */}
          <div className="space-y-4">
            <h4 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-2">
              <Check className="w-7 h-7 text-emerald-700" />
              <span>2. What You Need To Do (Simple Steps)</span>
            </h4>
            <div className="grid gap-3">
              {result.action_items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-2xl"
                >
                  <div className="flex items-start gap-3 max-w-xl">
                    <span className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black text-base flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-lg md:text-xl font-bold text-[var(--text-primary)] m-0">
                      {item}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePinAction(item, idx)}
                    disabled={pinnedItems[idx]}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-base min-h-[48px] shadow-sm transition ${
                      pinnedItems[idx]
                        ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-600'
                        : 'bg-blue-700 hover:bg-blue-800 text-white'
                    }`}
                  >
                    {pinnedItems[idx] ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Pinned to Daily Routine!</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-5 h-5" />
                        <span>Pin to My Daily Routine</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Questions For Your Doctor */}
          <div className="space-y-4">
            <h4 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-2">
              <HelpCircle className="w-7 h-7 text-purple-700" />
              <span>3. Questions You Can Ask Your Doctor Next Visit</span>
            </h4>
            <div className="space-y-3">
              {result.questions_for_doctor.map((q, idx) => (
                <div
                  key={idx}
                  className="p-4 md:p-5 bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-2xl flex items-start gap-3"
                >
                  <ArrowRight className="w-6 h-6 text-purple-700 flex-shrink-0 mt-1" />
                  <p className="text-lg md:text-xl font-bold text-[var(--text-primary)] m-0">
                    "{q}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
