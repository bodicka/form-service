import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'
import { api, ApiError, save, update, type Form, type FormField } from '../../../shared/api'
import { useBuilderStore } from '../builderStore'

interface UseFormEditorResult {
  form: Form | null
  busy: boolean
  notice: string
  error: string
  confirmDelete: boolean
  setConfirmDelete: (value: boolean) => void
  title: string
  description: string
  fields: FormField[]
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  setFields: (fields: FormField[]) => void
  move: (index: number, direction: number) => void
  persist: (publish?: boolean) => Promise<void>
  copyLink: () => Promise<void>
  remove: () => Promise<void>
  onDragEnd: (event: DragEndEvent) => void
}

export function useFormEditor(id: string): UseFormEditorResult {
  const navigate = useNavigate()
  const title = useBuilderStore((state) => state.title)
  const setTitle = useBuilderStore((state) => state.setTitle)
  const description = useBuilderStore((state) => state.description)
  const setDescription = useBuilderStore((state) => state.setDescription)
  const fields = useBuilderStore((state) => state.fields)
  const setFields = useBuilderStore((state) => state.setFields)

  const [form, setForm] = useState<Form | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    let active = true
    api<Form>(`/api/admin/forms/${id}`)
      .then((loaded) => {
        if (!active) return
        setForm(loaded)
        setTitle(loaded.title)
        setDescription(loaded.description)
        setFields(loaded.fields)
      })
      .catch((caught: unknown) => {
        if (active)
          setError(
            caught instanceof Error ? caught.message : 'Форма не найдена',
          )
      })
    return () => {
      active = false
    }
  }, [id, setDescription, setFields, setTitle])

  const move = useCallback((index: number, direction: number) => {
    const next = [...fields]
    const target = index + direction
    if (target >= 0 && target < next.length) {
      [next[index], next[target]] = [next[target], next[index]]
      setFields(next)
    }
  }, [fields, setFields])

  const persist = useCallback(async (publish = false) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const payload = { title: title.trim(), description, fields }
      const saved = form ? await update(form.id, payload) : await save(payload)
      let result = saved
      if (publish)
        result = await api<Form>(`/api/admin/forms/${saved.id}/publish`, {
          method: 'POST',
        })
      setForm(result)
      setTitle(result.title)
      setDescription(result.description)
      setFields(result.fields)
      setNotice(
        publish
          ? `Опубликовано: ${window.location.origin}/f/${result.slug}`
          : 'Изменения сохранены',
      )
      if (!form) navigate(`/admin/forms/${result.id}`, { replace: true })
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : 'Не удалось сохранить форму',
      )
    } finally {
      setBusy(false)
    }
  }, [title, description, fields, form, navigate, setDescription, setFields, setTitle])

  const copyLink = useCallback(async () => {
    if (!form?.slug) return
    await navigator.clipboard.writeText(
      `${window.location.origin}/f/${form.slug}`,
    )
    setNotice('Ссылка скопирована')
  }, [form?.slug])

  const remove = useCallback(async () => {
    try {
      await api(`/api/admin/forms/${id}`, { method: 'DELETE' })
      navigate('/admin')
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Не удалось удалить форму',
      )
    }
  }, [id, navigate])

  const onDragEnd = useCallback((event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return
    const oldIndex = fields.findIndex((field) => field.id === event.active.id)
    const newIndex = fields.findIndex((field) => field.id === event.over?.id)
    setFields(arrayMove(fields, oldIndex, newIndex))
  }, [fields, setFields])

  return {
    form,
    busy,
    notice,
    error,
    confirmDelete,
    setConfirmDelete,
    title,
    description,
    fields,
    setTitle,
    setDescription,
    setFields,
    move,
    persist,
    copyLink,
    remove,
    onDragEnd,
  }
}
