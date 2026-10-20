import { create } from 'zustand'
import type { FormField } from '../../shared/api'

type BuilderState = {
  title: string
  description: string
  fields: FormField[]
  setForm: (form: { title: string; description: string; fields: FormField[] }) => void
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  setFields: (fields: FormField[]) => void
}

export const useBuilderStore = create<BuilderState>((set) => ({
  title: 'Новая форма',
  description: '',
  fields: [],
  setForm: (form) => set(form),
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setFields: (fields) => set({ fields }),
}))
