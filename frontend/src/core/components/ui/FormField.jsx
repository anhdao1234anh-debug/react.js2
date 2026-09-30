import { cn } from '@/core/lib/cn';
import { Input, Select, Textarea } from './Input';

export function Label({ className, children, ...props }) {
  return (
    <label className={cn('block text-sm font-medium text-gray-700', className)} {...props}>
      {children}
    </label>
  );
}

/** Khung field: label + control + lỗi/gợi ý (liên kết aria để screen reader đọc lỗi). */
export function FormField({ id, label, error, hint, required, className, children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500"> *</span>}
        </Label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-gray-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function describedBy(id, error, hint) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

/** Field hoàn chỉnh = FormField + control (Input / Textarea / Select). */
function Field({ control: Control, label, error, hint, required, className, id, name, ...props }) {
  const fieldId = id ?? name;
  return (
    <FormField
      id={fieldId}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <Control
        id={fieldId}
        name={name}
        invalid={Boolean(error)}
        aria-describedby={describedBy(fieldId, error, hint)}
        {...props}
      />
    </FormField>
  );
}

/**
 * Các field dùng trực tiếp với react-hook-form:
 * @example <TextField label="Email" error={errors.email?.message} {...register('email')} />
 */
export function TextField(props) {
  return <Field control={Input} {...props} />;
}

export function TextareaField(props) {
  return <Field control={Textarea} {...props} />;
}

export function SelectField(props) {
  return <Field control={Select} {...props} />;
}
