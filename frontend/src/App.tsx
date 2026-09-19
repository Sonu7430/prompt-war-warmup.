import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import {
  Sun,
  FileText,
  ShieldAlert,
  MessageSquare,
  Lock,
  HeartHandshake,
  Heart,
  BookOpen
} from 'lucide-react';
import type { TextSizeLevel, ContrastMode, ScamVerdict } from './types';
import { AccessibilityToolbar } from './components/AccessibilityToolbar';
import { DailyPulseView } from './components/DailyPulseView';
import { CompanionLiveChat } from './components/CompanionLiveChat';
import { ElderlyErrorBoundary } from './components/ElderlyErrorBoundary';
import './styles/theme.css';

// Dynamic code splitting for heavy interactive workflows
const CaregiverBridge = lazy(() => import('./components/CaregiverBridge'));
const ReminiscenceJournal = lazy(() => import('./components/ReminiscenceJournal'));
const MedicalSimplifierView = lazy(() =>
  import('./components/MedicalSimplifierView').then((m) => ({ default: m.MedicalSimplifierView }))
);
const ScamShieldView = lazy(() =>
  import('./components/ScamShieldView').then((m) => ({ default: m.ScamShieldView }))
);
const SecurityInspectorView = lazy(() =>
  import('./components/SecurityInspectorView').then((m) => ({ default: m.SecurityInspectorView }))
);

type ActiveTab = 'daily' | 'caregiver' | 'journal' | 'medical' | 'scam' | 'chat' | 'security';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('daily');
  const [textSize, setTextSize] = useState<TextSizeLevel>('standard');
  const [contrastMode, setContrastMode] = useState<ContrastMode>('warm');
  const [speechRate, setSpeechRate] = useState<number>(0.9);
  const [refreshPulseTrigger, setRefreshPulseTrigger] = useState<number>(0);
  const [flaggedScamContext, setFlaggedScamContext] = useState<ScamVerdict | null>(null);

  // Sync body classes for WCAG AAA styles
  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(`text-scale-${textSize}`);
    document.body.classList.add(`mode-${contrastMode}`);
  }, [textSize, contrastMode]);

  const handleItemPinned = useCallback(() => {
    setRefreshPulseTrigger((prev) => prev + 1);
  }, []);

  const handleScamAlertTriggered = useCallback((scam: ScamVerdict) => {
    setFlaggedScamContext(scam);
    setActiveTab('caregiver');
  }, []);

  const handleAnnounceAudio = useCallback(
    (text: string) => {
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = speechRate || 0.85;
          window.speechSynthesis.speak(utterance);
        } catch {
          // Graceful fallback
        }
      }
    },
    [speechRate]
  );

  return (
    <ElderlyErrorBoundary>
      <div className="min-h-screen flex flex-col transition-colors duration-200">
        {/* Top Accessibility & Display Bar */}
        <AccessibilityToolbar
          textSize={textSize}
          setTextSize={setTextSize}
          contrastMode={contrastMode}
          setContrastMode={setContrastMode}
          speechRate={speechRate}
          setSpeechRate={setSpeechRate}
        />

        {/* Emergency & Reassurance Banner */}
        <div className="bg-amber-100 dark:bg-amber-950 border-b border-amber-300 dark:border-amber-800 px-4 py-2.5 text-center">
          <p className="text-base md:text-lg font-bold text-amber-950 dark:text-amber-100 m-0 flex items-center justify-center gap-2">
            <HeartHandshake className="w-5 h-5 text-amber-800 flex-shrink-0" aria-hidden="true" />
            <span>
              You are safe here. For life-threatening medical emergencies, please dial <strong>911</strong> or contact your doctor directly.
            </span>
          </p>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6" id="main-content">
          {/* Main Navigation Tabs */}
          <nav aria-label="Main Workflows Navigation" className="w-full">
            <div
              className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 p-2 bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-3xl shadow-sm"
              role="tablist"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'daily'}
                aria-controls="panel-daily"
                id="tab-daily"
                onClick={() => setActiveTab('daily')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-black text-base md:text-lg min-h-[56px] transition-all ${
                  activeTab === 'daily'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <Sun className="w-5 h-5 flex-shrink-0" />
                <span>Daily Pulse</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'caregiver'}
                aria-controls="panel-caregiver"
                id="tab-caregiver"
                onClick={() => setActiveTab('caregiver')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-black text-base md:text-lg min-h-[56px] transition-all ${
                  activeTab === 'caregiver'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <Heart className="w-5 h-5 flex-shrink-0" />
                <span>Family Bridge</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'journal'}
                aria-controls="panel-journal"
                id="tab-journal"
                onClick={() => setActiveTab('journal')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-black text-base md:text-lg min-h-[56px] transition-all ${
                  activeTab === 'journal'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <BookOpen className="w-5 h-5 flex-shrink-0" />
                <span>Life Stories</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'medical'}
                aria-controls="panel-medical"
                id="tab-medical"
                onClick={() => setActiveTab('medical')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-black text-base md:text-lg min-h-[56px] transition-all ${
                  activeTab === 'medical'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <FileText className="w-5 h-5 flex-shrink-0" />
                <span>Medical Doc</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'scam'}
                aria-controls="panel-scam"
                id="tab-scam"
                onClick={() => setActiveTab('scam')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-black text-base md:text-lg min-h-[56px] transition-all ${
                  activeTab === 'scam'
                    ? 'bg-rose-700 text-white shadow-md'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <span>Scam Shield</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'chat'}
                aria-controls="panel-chat"
                id="tab-chat"
                onClick={() => setActiveTab('chat')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-black text-base md:text-lg min-h-[56px] transition-all ${
                  activeTab === 'chat'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                <span>Live Chat</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'security'}
                aria-controls="panel-security"
                id="tab-security"
                onClick={() => setActiveTab('security')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-black text-base md:text-lg min-h-[56px] transition-all ${
                  activeTab === 'security'
                    ? 'bg-indigo-800 text-white shadow-md'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <Lock className="w-5 h-5 flex-shrink-0" />
                <span>Security Lab</span>
              </button>
            </div>
          </nav>

          {/* Workflow Tab Panels with Suspense */}
          <Suspense
            fallback={
              <div className="py-16 text-center" aria-live="polite">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-700 border-t-transparent mb-4"></div>
                <p className="text-xl font-bold text-[var(--text-secondary)]">
                  Loading your calm companion view...
                </p>
              </div>
            }
          >
            <div className="pt-2">
              {activeTab === 'daily' && (
                <div id="panel-daily" role="tabpanel" aria-labelledby="tab-daily">
                  <DailyPulseView
                    key={refreshPulseTrigger}
                    onNavigateToTab={(tab) => setActiveTab(tab)}
                    speechRate={speechRate}
                  />
                </div>
              )}

              {activeTab === 'caregiver' && (
                <div id="panel-caregiver" role="tabpanel" aria-labelledby="tab-caregiver">
                  <CaregiverBridge
                    flaggedScamContext={flaggedScamContext}
                    onClearScamContext={() => setFlaggedScamContext(null)}
                    onAnnounceAudio={handleAnnounceAudio}
                  />
                </div>
              )}

              {activeTab === 'journal' && (
                <div id="panel-journal" role="tabpanel" aria-labelledby="tab-journal">
                  <ReminiscenceJournal onAnnounceAudio={handleAnnounceAudio} />
                </div>
              )}

              {activeTab === 'medical' && (
                <div id="panel-medical" role="tabpanel" aria-labelledby="tab-medical">
                  <MedicalSimplifierView
                    speechRate={speechRate}
                    onItemPinned={handleItemPinned}
                  />
                </div>
              )}

              {activeTab === 'scam' && (
                <div id="panel-scam" role="tabpanel" aria-labelledby="tab-scam">
                  <ScamShieldView
                    speechRate={speechRate}
                    onWarningPinned={handleItemPinned}
                    onAlertFamily={handleScamAlertTriggered}
                  />
                </div>
              )}

              {activeTab === 'chat' && (
                <div id="panel-chat" role="tabpanel" aria-labelledby="tab-chat">
                  <CompanionLiveChat speechRate={speechRate} />
                </div>
              )}

              {activeTab === 'security' && (
                <div id="panel-security" role="tabpanel" aria-labelledby="tab-security">
                  <SecurityInspectorView />
                </div>
              )}
            </div>
          </Suspense>
        </main>

        {/* Reassuring Footer */}
        <footer className="w-full bg-[var(--bg-secondary)] border-t-2 border-[var(--border-color)] py-6 px-4 text-center mt-12">
          <div className="max-w-4xl mx-auto space-y-2">
            <p className="text-base font-bold text-[var(--text-secondary)] m-0">
              Nestor — Senior-First Generative AI Companion & Guardian Angel
            </p>
            <p className="text-sm font-medium text-[var(--text-muted)] m-0">
              WCAG AAA Compliant (≥ 7:1 Contrast) • Touch Targets ≥ 48px • Strict Token Budgeting • Zero PII Retention
            </p>
          </div>
        </footer>
      </div>
    </ElderlyErrorBoundary>
  );
}

export default App;
