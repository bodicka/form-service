import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type Answers = Record<string, string | string[]>
type FillState = {
  drafts: Record<string, Answers>
  setAnswer: (slug: string, fieldId: string, value: string | string[]) => void
  clearDraft: (slug: string) => void
}

export const useFillStore = create<FillState>()(persist((set) => ({
  drafts: {},
  setAnswer: (slug, fieldId, value) => set((state) => ({ drafts: { ...state.drafts, [slug]: { ...state.drafts[slug], [fieldId]: value } } })),
  clearDraft: (slug) => set((state) => {
    const drafts = { ...state.drafts }
    delete drafts[slug]
    return { drafts }
  }),
}), { name: 'form-service-answer-drafts', storage: createJSONStorage(() => localStorage) }))
