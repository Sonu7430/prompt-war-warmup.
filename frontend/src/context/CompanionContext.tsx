import React, { createContext, useContext, useState } from 'react';

export interface CaregiverAlert {
  id: string;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  source: string;
  summary: string;
  timestamp: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  time: string;
  completed: boolean;
}

export interface DailyRoutineState {
  greeting: string;
  medications: MedicationItem[];
  hydrationGoalOz: number;
  currentHydrationOz: number;
}

export interface CompanionContextType {
  dailyRoutine: DailyRoutineState;
  setDailyRoutine: React.Dispatch<React.SetStateAction<DailyRoutineState>>;
  caregiverAlerts: CaregiverAlert[];
  setCaregiverAlerts: React.Dispatch<React.SetStateAction<CaregiverAlert[]>>;
  logScamThreat: (scamData: { threatScore: number; explanation: string; sender: string }) => void;
  toggleMedicationCompletion: (id: string) => void;
  incrementHydration: (oz?: number) => void;
}

export const CompanionContext = createContext<any>(null);

export const CompanionProvider = ({ children }: { children: React.ReactNode }) => {
  const [dailyRoutine, setDailyRoutine] = useState<DailyRoutineState>({
    greeting: "Good morning! It's 72°F and sunny today.",
    medications: [
      { id: '1', name: 'Blood Pressure Tablet (Amlodipine)', time: '08:00 AM', completed: false }
    ],
    hydrationGoalOz: 64,
    currentHydrationOz: 16
  });

  const [caregiverAlerts, setCaregiverAlerts] = useState<CaregiverAlert[]>([]);

  // Proactive Workflow Interlink: Scam Shield logs straight to Caregiver Bridge
  const logScamThreat = (scamData: { threatScore: number; explanation: string; sender: string }) => {
    if (scamData.threatScore > 75) {
      const generatedId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const newAlert: CaregiverAlert = {
        id: generatedId,
        threatLevel: 'HIGH',
        source: scamData.sender,
        summary: scamData.explanation,
        timestamp: new Date().toLocaleTimeString()
      };
      setCaregiverAlerts((prev) => [newAlert, ...prev]);
    }
  };

  const toggleMedicationCompletion = (id: string) => {
    setDailyRoutine((prev) => ({
      ...prev,
      medications: prev.medications.map((m) =>
        m.id === id ? { ...m, completed: !m.completed } : m
      )
    }));
  };

  const incrementHydration = (oz: number = 8) => {
    setDailyRoutine((prev) => ({
      ...prev,
      currentHydrationOz: Math.min(prev.hydrationGoalOz, prev.currentHydrationOz + oz)
    }));
  };

  return (
    <CompanionContext.Provider
      value={{
        dailyRoutine,
        setDailyRoutine,
        caregiverAlerts,
        setCaregiverAlerts,
        logScamThreat,
        toggleMedicationCompletion,
        incrementHydration
      }}
    >
      {children}
    </CompanionContext.Provider>
  );
};

export const useCompanionContext = () => {
  const context = useContext(CompanionContext);
  if (!context) {
    throw new Error('useCompanionContext must be used within a CompanionProvider');
  }
  return context;
};
