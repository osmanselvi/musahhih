import { create } from 'zustand';

export const useStore = create((set) => ({
  currentPdfPath: null,
  currentPdfData: null,
  numPages: null,
  corrections: [],
  selectedCorrectionId: null,

  appMode: null, // null | 'tashih' | 'kartoteks'
  cards: [], // Kartoteks kartları

  setAppMode: (mode) => set({ appMode: mode }),

  setPdf: (path, data) => set({ currentPdfPath: path, currentPdfData: data }),
  setNumPages: (num) => set({ numPages: num }),
  
  // --- Tashih İşlemleri ---
  addCorrection: (correction) => set((state) => ({
    corrections: [...state.corrections, { ...correction, id: Date.now().toString(), isCompleted: false }]
  })),
  
  updateCorrection: (id, updates) => set((state) => ({
    corrections: state.corrections.map(c => c.id === id ? { ...c, ...updates } : c)
  })),

  deleteCorrection: (id) => set((state) => ({
    corrections: state.corrections.filter(c => c.id !== id)
  })),

  toggleCompletion: (id) => set((state) => ({
    corrections: state.corrections.map(c => c.id === id ? { ...c, isCompleted: !c.isCompleted } : c)
  })),

  setSelectedCorrection: (id) => set({ selectedCorrectionId: id }),

  // --- Kartoteks İşlemleri ---
  addCard: (card) => set((state) => ({
    cards: [...state.cards, { ...card, id: Date.now().toString() }]
  })),

  updateCard: (id, updates) => set((state) => ({
    cards: state.cards.map(c => c.id === id ? { ...c, ...updates } : c)
  })),

  deleteCard: (id) => set((state) => ({
    cards: state.cards.filter(c => c.id !== id)
  })),

  loadState: (stateData) => set(stateData),
}));
