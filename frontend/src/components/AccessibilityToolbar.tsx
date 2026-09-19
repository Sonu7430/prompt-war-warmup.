import React from 'react';
import { Type, Sun, Moon, Eye, Volume2 } from 'lucide-react';
import type { TextSizeLevel, ContrastMode } from '../types';

interface AccessibilityToolbarProps {
  textSize: TextSizeLevel;
  setTextSize: (size: TextSizeLevel) => void;
  contrastMode: ContrastMode;
  setContrastMode: (mode: ContrastMode) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({
  textSize,
  setTextSize,
  contrastMode,
  setContrastMode,
  speechRate,
  setSpeechRate,
}) => {
  return (
    <header
      role="banner"
      aria-label="Accessibility and view settings"
      className="w-full bg-[var(--bg-secondary)] border-b-2 border-[var(--border-color)] px-4 py-3 shadow-sm transition-colors"
    >
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Branding & Senior Friendly Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xl shadow" aria-hidden="true">
            🛡️
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight m-0 text-[var(--text-primary)]">
              Senior Companion & Guardian Angel
            </h1>
            <p className="text-sm font-medium text-[var(--text-muted)] m-0">
              WCAG AAA Accessible • Voice Enabled • High-Contrast Protection
            </p>
          </div>
        </div>

        {/* Accessibility Controls */}
        <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Display and speech controls">
          {/* Text Size Selector */}
          <div className="flex items-center bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-xl p-1 shadow-sm">
            <span className="flex items-center gap-1.5 px-2 text-sm font-bold text-[var(--text-secondary)]" id="text-size-label">
              <Type className="w-5 h-5" aria-hidden="true" />
              <span>Text Size:</span>
            </span>
            <div className="flex gap-1" role="radiogroup" aria-labelledby="text-size-label">
              <button
                type="button"
                role="radio"
                aria-checked={textSize === 'standard'}
                onClick={() => setTextSize('standard')}
                className={`px-3 py-1.5 rounded-lg text-base font-bold min-h-[44px] transition-all ${
                  textSize === 'standard'
                    ? 'bg-blue-700 text-white shadow'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
                title="Standard 18px text"
              >
                18px
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={textSize === 'large'}
                onClick={() => setTextSize('large')}
                className={`px-3 py-1.5 rounded-lg text-lg font-bold min-h-[44px] transition-all ${
                  textSize === 'large'
                    ? 'bg-blue-700 text-white shadow'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
                title="Large 22px text"
              >
                22px
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={textSize === 'jumbo'}
                onClick={() => setTextSize('jumbo')}
                className={`px-3 py-1.5 rounded-lg text-xl font-black min-h-[44px] transition-all ${
                  textSize === 'jumbo'
                    ? 'bg-blue-700 text-white shadow'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
                title="Jumbo 26px text"
              >
                26px
              </button>
            </div>
          </div>

          {/* Color & Contrast Mode */}
          <div className="flex items-center bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-xl p-1 shadow-sm">
            <span className="flex items-center gap-1 px-2 text-sm font-bold text-[var(--text-secondary)]" id="contrast-label">
              <Eye className="w-5 h-5" aria-hidden="true" />
              <span>Theme:</span>
            </span>
            <div className="flex gap-1" role="radiogroup" aria-labelledby="contrast-label">
              <button
                type="button"
                role="radio"
                aria-checked={contrastMode === 'warm'}
                onClick={() => setContrastMode('warm')}
                className={`px-3 py-1.5 rounded-lg font-bold min-h-[44px] flex items-center gap-1.5 ${
                  contrastMode === 'warm'
                    ? 'bg-amber-100 text-amber-900 border-2 border-amber-600'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
                title="Warm Cream Default"
              >
                <Sun className="w-4 h-4" aria-hidden="true" />
                <span>Warm</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={contrastMode === 'high-contrast'}
                onClick={() => setContrastMode('high-contrast')}
                className={`px-3 py-1.5 rounded-lg font-bold min-h-[44px] flex items-center gap-1.5 ${
                  contrastMode === 'high-contrast'
                    ? 'bg-yellow-400 text-black border-2 border-black font-black'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
                title="High Contrast Extreme Visibility (7:1+)"
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
                <span>Contrast AAA</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={contrastMode === 'night'}
                onClick={() => setContrastMode('night')}
                className={`px-3 py-1.5 rounded-lg font-bold min-h-[44px] flex items-center gap-1.5 ${
                  contrastMode === 'night'
                    ? 'bg-slate-800 text-white border-2 border-slate-400'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
                title="Restful Dark Mode"
              >
                <Moon className="w-4 h-4" aria-hidden="true" />
                <span>Night</span>
              </button>
            </div>
          </div>

          {/* Voice Pace Speed Toggle */}
          <div className="flex items-center bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-xl px-3 py-1 shadow-sm min-h-[48px]">
            <Volume2 className="w-5 h-5 mr-1.5 text-blue-700" aria-hidden="true" />
            <label htmlFor="voice-speed-select" className="text-sm font-bold text-[var(--text-secondary)] mr-2">
              Voice Pace:
            </label>
            <select
              id="voice-speed-select"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="bg-transparent font-bold text-[var(--text-primary)] rounded py-1 px-2 border border-[var(--border-color)] cursor-pointer"
            >
              <option value="0.85">Calm & Slow (0.85x)</option>
              <option value="1.0">Normal (1.0x)</option>
              <option value="1.15">Brisk (1.15x)</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
