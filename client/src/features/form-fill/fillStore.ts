import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type Answers = Record<string, string | string[]>
type FillState = {
  drafts: Record<string, Answers>
  setAnswer: (slug: string, fieldId: string, value: string | string[]) => void
  replaceDraft: (slug: string, answers: Answers) => void
  clearDraft: (slug: string) => void
}

export const useFillStore = create<FillState>()(persist((set) => ({
  drafts: {},
  setAnswer: (slug, fieldId, value) => set((state) => ({ drafts: { ...state.drafts, [slug]: { ...state.drafts[slug], [fieldId]: value } } })),
  replaceDraft: (slug, answers) => set((state) => {
    const drafts = { ...state.drafts }
    if (Object.keys(answers).length) drafts[slug] = answers
    else delete drafts[slug]
    return { drafts }
  }),
  clearDraft: (slug) => set((state) => {
    const drafts = { ...state.drafts }
    delete drafts[slug]
    return { drafts }
  }),
}), { name: 'form-service-answer-drafts', storage: createJSONStorage(() => localStorage) }))
