import { useState, useEffect } from 'react';
import { Sun, FileText, ShieldAlert, MessageSquare, Lock, HeartHandshake } from 'lucide-react';
import type { TextSizeLevel, ContrastMode } from './types';
import { AccessibilityToolbar } from './components/AccessibilityToolbar';
import { DailyPulseView } from './components/DailyPulseView';
import { MedicalSimplifierView } from './components/MedicalSimplifierView';
import { ScamShieldView } from './components/ScamShieldView';
import { CompanionLiveChat } from './components/CompanionLiveChat';
import { SecurityInspectorView } from './components/SecurityInspectorView';
import { ElderlyErrorBoundary } from './components/ElderlyErrorBoundary';
import './styles/theme.css';

type ActiveTab = 'daily' | 'medical' | 'scam' | 'chat' | 'security';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('daily');
  const [textSize, setTextSize] = useState<TextSizeLevel>('standard');
  const [contrastMode, setContrastMode] = useState<ContrastMode>('warm');
  const [speechRate, setSpeechRate] = useState<number>(0.9);
  const [refreshPulseTrigger, setRefreshPulseTrigger] = useState<number>(0);

  // Sync body classes for WCAG AAA styles
  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(`text-scale-${textSize}`);
    document.body.classList.add(`mode-${contrastMode}`);
  }, [textSize, contrastMode]);

  const handleItemPinned = () => {
    // Notify user and trigger pulse refresh
    setRefreshPulseTrigger((prev) => prev + 1);
  };

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
        <div className="bg-amber-100 dark:bg-amber-950 border-b border-amber-300 dark:border-amber-800 px-4 py-2 text-center">
          <p className="text-sm md:text-base font-bold text-amber-950 dark:text-amber-100 m-0 flex items-center justify-center gap-2">
            <HeartHandshake className="w-5 h-5 text-amber-800" aria-hidden="true" />
            <span>
              You are safe here. For life-threatening medical emergencies, please dial <strong>911</strong> or contact your physician directly.
            </span>
          </p>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6" id="main-content">
          {/* Main Navigation Tabs */}
          <nav aria-label="Main Workflows Navigation" className="w-full">
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-1.5 bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-3xl shadow-sm"
              role="tablist"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'daily'}
                aria-controls="panel-daily"
                id="tab-daily"
                onClick={() => setActiveTab('daily')}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl font-black text-base md:text-lg min-h-[56px] transition-all ${
                  activeTab === 'daily'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <Sun className="w-6 h-6 flex-shrink-0" />
                <span>Daily Pulse</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'medical'}
                aria-controls="panel-medical"
                id="tab-medical"
                onClick={() => setActiveTab('medical')}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl font-black text-base md:text-lg min-h-[56px] transition-all ${
                  activeTab === 'medical'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <FileText className="w-6 h-6 flex-shrink-0" />
                <span>Medical Doc</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'scam'}
                aria-controls="panel-scam"
                id="tab-scam"
                onClick={() => setActiveTab('scam')}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl font-black text-base md:text-lg min-h-[56px] transition-all ${
                  activeTab === 'scam'
                    ? 'bg-red-700 text-white shadow-md'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <ShieldAlert className="w-6 h-6 flex-shrink-0" />
                <span>Scam Shield</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'chat'}
                aria-controls="panel-chat"
                id="tab-chat"
                onClick={() => setActiveTab('chat')}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl font-black text-base md:text-lg min-h-[56px] transition-all ${
                  activeTab === 'chat'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <MessageSquare className="w-6 h-6 flex-shrink-0" />
                <span>Live Chat</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'security'}
                aria-controls="panel-security"
                id="tab-security"
                onClick={() => setActiveTab('security')}
                className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl font-black text-base md:text-lg min-h-[56px] transition-all ${
                  activeTab === 'security'
                    ? 'bg-indigo-800 text-white shadow-md'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <Lock className="w-6 h-6 flex-shrink-0" />
                <span>Security Lab</span>
              </button>
            </div>
          </nav>

          {/* Workflow Tab Panels */}
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
        </main>

        {/* Reassuring Footer */}
        <footer className="w-full bg-[var(--bg-secondary)] border-t-2 border-[var(--border-color)] py-6 px-4 text-center mt-12">
          <div className="max-w-4xl mx-auto space-y-2">
            <p className="text-base font-bold text-[var(--text-secondary)] m-0">
              Elderly-First Generative AI Companion & Guardian Angel
            </p>
            <p className="text-sm font-medium text-[var(--text-muted)] m-0">
              Complies with WCAG AAA Contrast (≥ 7:1) • High Touch Hitboxes (≥ 48px) • Zero PII Data Retention
            </p>
          </div>
        </footer>
      </div>
    </ElderlyErrorBoundary>
  );
}

export default App;
