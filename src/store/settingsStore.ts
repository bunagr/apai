import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      selectedModel: 'anthropic/claude-2',
      setSelectedModel: (model) => set({ selectedModel: model }),
    }),
    {
      name: 'chat-settings',
    }
  )
);