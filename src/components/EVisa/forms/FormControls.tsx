import React from 'react';

interface RadioCardGroupProps<T extends string> {
  label: string;
  name: string;
  value: T | '';
  options: { value: T; label: string; description?: string }[];
  onChange: (value: T) => void;
  error?: string;
  columns?: 2 | 3 | 4;
}

export function RadioCardGroup<T extends string>({
  label,
  name,
  value,
  options,
  onChange,
  error,
  columns = 3,
}: RadioCardGroupProps<T>) {
  const gridClass =
    columns === 2 ? 'grid-cols-1 sm:grid-cols-2' :
    columns === 4 ? 'grid-cols-2 lg:grid-cols-4' :
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <fieldset className="space-y-2">
      <legend className="block text-sm font-medium text-gray-700 mb-2">{label}</legend>
      <div className={`grid ${gridClass} gap-3`}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`relative flex flex-col p-3 border-2 rounded-lg cursor-pointer transition-all ${
                selected
                  ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600'
                  : 'border-gray-200 hover:border-primary-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className={`font-medium text-sm ${selected ? 'text-primary-700' : 'text-gray-800'}`}>
                {option.label}
              </span>
              {option.description && (
                <span className="text-xs text-gray-500 mt-1">{option.description}</span>
              )}
            </label>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </fieldset>
  );
}

interface ToggleFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleField({ label, description, checked, onChange }: ToggleFieldProps) {
  return (
    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-checked:bg-primary-600 rounded-full transition-colors" />
        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
      </div>
      <div>
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        {description && <span className="block text-xs text-gray-500 mt-0.5">{description}</span>}
      </div>
    </label>
  );
}

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="space-y-4 pt-2 border-t border-gray-100 first:border-0 first:pt-0">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {children}
    </section>
  );
}

interface CheckboxGroupProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  error?: string;
}

export function CheckboxGroup({ label, options, selected, onChange, error }: CheckboxGroupProps) {
  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    );
  };

  return (
    <fieldset className="space-y-2">
      <legend className="block text-sm font-medium text-gray-700 mb-2">{label}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((option) => (
          <label
            key={option}
            className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
              selected.includes(option) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggle(option)}
              className="h-4 w-4 text-primary-600 rounded"
            />
            <span className="text-sm text-gray-800">{option}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </fieldset>
  );
}

const inputClass =
  'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm';

export function FormInput({
  label,
  required,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input className={`${inputClass} ${error ? 'border-red-400' : ''}`} {...props} />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function FormSelect({
  label,
  required,
  error,
  options,
  placeholder,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select className={`${inputClass} ${error ? 'border-red-400' : ''}`} {...props}>
        <option value="">{placeholder ?? 'Select...'}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function FormTextarea({
  label,
  required,
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <textarea
        className={`${inputClass} ${error ? 'border-red-400' : ''}`}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

interface DoesNotApplyFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  doesNotApply: boolean;
  onDoesNotApplyChange: (checked: boolean) => void;
  error?: string;
  type?: string;
  placeholder?: string;
}

export function DoesNotApplyField({
  label,
  value,
  onChange,
  doesNotApply,
  onDoesNotApplyChange,
  error,
  type = 'text',
  placeholder,
}: DoesNotApplyFieldProps) {
  return (
    <div className="space-y-2">
      <FormInput
        label={label}
        type={type}
        value={doesNotApply ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        disabled={doesNotApply}
        placeholder={doesNotApply ? 'Does Not Apply' : placeholder}
        error={error}
      />
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={doesNotApply}
          onChange={(e) => onDoesNotApplyChange(e.target.checked)}
          className="h-4 w-4 text-primary-600 rounded"
        />
        Does Not Apply
      </label>
    </div>
  );
}

interface AccordionPanelProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  stepLabel?: string;
}

export function AccordionPanel({ title, isOpen, onToggle, children, stepLabel }: AccordionPanelProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 text-left"
      >
        <div>
          {stepLabel && <span className="text-xs text-primary-600 font-medium block mb-0.5">{stepLabel}</span>}
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        <span className="text-gray-400 text-xl">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <div className="p-4 space-y-4 border-t border-gray-200">{children}</div>}
    </div>
  );
}

interface TagInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
}

export function TagInput({ label, tags, onChange, placeholder, error }: TagInputProps) {
  const [input, setInput] = React.useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput('');
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder={placeholder}
          className={inputClass}
        />
        <button type="button" onClick={addTag} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded text-sm">
              {tag}
              <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="text-primary-500">×</button>
            </span>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
