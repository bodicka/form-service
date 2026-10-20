import * as Dialog from '@radix-ui/react-dialog'
import { Trash2, X } from 'lucide-react'

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteDialog({ open, onOpenChange, onConfirm }: DeleteDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-card">
          <Dialog.Close className="dialog-close" aria-label="Закрыть">
            <X size={18} />
          </Dialog.Close>
          <div className="dialog-icon">
            <Trash2 size={20} />
          </div>
          <Dialog.Title>Удалить форму?</Dialog.Title>
          <Dialog.Description>
            Форма и все собранные ответы будут удалены без возможности
            восстановления.
          </Dialog.Description>
          <div className="dialog-actions">
            <Dialog.Close className="button outline">Отмена</Dialog.Close>
            <button
              className="button danger-button"
              onClick={() => void onConfirm()}
            >
              Удалить форму
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
