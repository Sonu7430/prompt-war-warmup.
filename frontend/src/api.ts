import type { DailyPulse, SimplifiedDoc, ScamVerdict, SafetyCheckResult } from './types';

const API_BASE = '/api';

export const fallbackElderlyMessage =
  "I'm having a little trouble reading that right now; let's take a deep breath and try reading it together.";

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchDailyPulse(params?: {
  time_of_day?: string;
  user_mood?: string;
  fatigue_indicated?: boolean;
  missed_medication?: boolean;
}): Promise<DailyPulse> {
  const res = await fetch(`${API_BASE}/workflows/daily-pulse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {}),
  });
  if (!res.ok) {
    throw new Error(fallbackElderlyMessage);
  }
  return res.json();
}

export async function toggleChecklistTask(taskId: string): Promise<{ task_id: string; completed: boolean }> {
  const res = await fetch(`${API_BASE}/workflows/daily-pulse/toggle-task/${taskId}`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error("Unable to update checklist");
  }
  return res.json();
}

export async function simplifyMedicalDocument(documentText: string): Promise<SimplifiedDoc> {
  const res = await fetch(`${API_BASE}/workflows/medical-simplifier`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_text: documentText }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || fallbackElderlyMessage);
  }
  return res.json();
}

export async function pinMedicalAction(actionItem: string, title?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/workflows/medical-simplifier/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action_item: actionItem, title: title || "Doctor Advice" }),
  });
  return res.json();
}

export async function analyzeScamMessage(messageText: string, sourceType = 'SMS'): Promise<ScamVerdict> {
  const res = await fetch(`${API_BASE}/workflows/scam-shield`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message_text: messageText, source_type: sourceType }),
  });
  if (!res.ok) {
    throw new Error(fallbackElderlyMessage);
  }
  return res.json();
}

export async function pinScamWarning(verdict: ScamVerdict): Promise<any> {
  const res = await fetch(`${API_BASE}/workflows/scam-shield/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(verdict),
  });
  return res.json();
}

export async function checkSecurity(text: string): Promise<SafetyCheckResult> {
  const res = await fetch(`${API_BASE}/security/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export async function streamChatResponse(
  prompt: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: string) => void
) {
  try {
    const res = await fetch(`${API_BASE}/workflows/stream-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, stream: true }),
    });

    if (!res.ok || !res.body) {
      throw new Error(fallbackElderlyMessage);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          try {
            const data = JSON.parse(trimmed.slice(5).trim());
            if (data.token) {
              onToken(data.token);
            }
            if (data.done) {
              onDone();
              return;
            }
          } catch {
            // Ignore parse hiccups on partial chunks
          }
        }
      }
    }
    onDone();
  } catch (err: any) {
    onError(err.message || fallbackElderlyMessage);
  }
}
