export type UrgencyLevel = 'routine' | 'urgent' | 'emergency';
export type ScamVerdictType = 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS_SCAM';
export type TaskCategory = 'medication' | 'hydration' | 'activity' | 'wellness' | 'safety';

export interface ChecklistItem {
  id: string;
  title: string;
  time: string;
  category: TaskCategory;
  completed: boolean;
}

export interface AdvisoryNote {
  id: string;
  source: 'medical' | 'scam' | 'system';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
}

export interface DailyPulse {
  greeting: string;
  time_context: string;
  gentle_reminder: string;
  routine_checklist: ChecklistItem[];
  wellbeing_tip: string;
  advisory_notes: AdvisoryNote[];
}

export interface SimplifiedDoc {
  summary: string;
  analogy: string;
  action_items: string[];
  questions_for_doctor: string[];
  urgency_level: UrgencyLevel;
}

export interface ScamVerdict {
  verdict: ScamVerdictType;
  threat_score: number;
  plain_explanation: string;
  immediate_advice: string;
  safe_next_step: string;
  red_flags: string[];
}

export interface SafetyCheckResult {
  is_safe: boolean;
  flagged_reasons: string[];
  sanitized_text: string;
  pii_redacted_count: number;
}

export type TextSizeLevel = 'standard' | 'large' | 'jumbo';
export type ContrastMode = 'warm' | 'high-contrast' | 'night';
