import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Select from "@radix-ui/react-select";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  GripVertical,
  Trash2,
} from "lucide-react";
import type { FormField, FieldType } from "../../../../shared/api";
import { FIELD_TYPES } from "../../constants/fieldTypes";

interface FieldCardProps {
  field: FormField;
  index: number;
  count: number;
  onChange: (field: FormField) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (direction: number) => void;
}

export function FieldCard({
  field,
  index,
  count,
  onChange,
  onDelete,
  onDuplicate,
  onMove,
}: FieldCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  const hasOptions = ["radio", "select", "checkbox"].includes(field.type);

  return (
    <section className="field-card" ref={setNodeRef} style={style}>
      <div className="field-top">
        <button
          className="drag-handle"
          aria-label="Перетащить поле"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>
        <span className="field-number">
          Вопрос {String(index + 1).padStart(2, "0")}
        </span>
        <div className="field-tools">
          <button
            className="icon-button tiny"
            title="Дублировать"
            onClick={onDuplicate}
          >
            <Copy size={14} />
          </button>
          <button
            className="icon-button tiny danger"
            title="Удалить"
            onClick={onDelete}
          >
            <Trash2 size={15} />
          </button>
          <button
            className="icon-button tiny"
            title="Выше"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUpRight className="rotate-up" size={14} />
          </button>
          <button
            className="icon-button tiny"
            title="Ниже"
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown size={14} />
          </button>
        </div>
      </div>
      <div className="field-form-grid">
        <label className="label">
          Название вопроса
          <input
            value={field.label}
            onChange={(event) =>
              onChange({ ...field, label: event.target.value })
            }
          />
        </label>
        <label className="label">
          Тип поля
          <Select.Root
            value={field.type}
            onValueChange={(value) =>
              onChange({ ...field, type: value as FieldType })
            }
          >
            <Select.Trigger className="select-trigger">
              <Select.Value />
              <Select.Icon>
                <ChevronDown size={15} />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="select-content" position="popper">
                <Select.Viewport>
                  {FIELD_TYPES.map((item) => (
                    <Select.Item
                      className="select-item"
                      value={item.value}
                      key={item.value}
                    >
                      <Select.ItemText>{item.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </label>
      </div>
      <div className="field-form-grid secondary-grid">
        <label className="label">
          Подсказка
          <textarea
            rows={2}
            value={field.description}
            onChange={(event) =>
              onChange({ ...field, description: event.target.value })
            }
            placeholder="Необязательное пояснение к вопросу"
          />
        </label>
        <label className="label">
          Текст в поле
          <input
            value={field.placeholder}
            onChange={(event) =>
              onChange({ ...field, placeholder: event.target.value })
            }
            placeholder="Например, ваш ответ"
          />
        </label>
      </div>
      {hasOptions && (
        <label className="label options-label">
          Варианты ответа
          <textarea
            rows={3}
            value={field.options.join("\n")}
            onChange={(event) =>
              onChange({ ...field, options: event.target.value.split("\n") })
            }
            placeholder="Каждый вариант — с новой строки"
          />
        </label>
      )}
      <label className="required-toggle">
        <Checkbox.Root
          className="checkbox"
          checked={field.required}
          onCheckedChange={(checked) =>
            onChange({ ...field, required: checked === true })
          }
        >
          <Checkbox.Indicator>
            <Check size={13} />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <span>Обязательный вопрос</span>
        <span className="required-note">
          Студент не сможет отправить форму без ответа
        </span>
      </label>
    </section>
  );
}
