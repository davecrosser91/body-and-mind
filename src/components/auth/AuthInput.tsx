'use client'

import { InputHTMLAttributes } from 'react'

interface AuthInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string
  error?: string
  hint?: string
}

export function AuthInput({
  label,
  error,
  hint,
  id,
  name,
  ...props
}: AuthInputProps) {
  const inputId = id || name

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-text-secondary"
      >
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        className={`
          w-full px-3 py-2.5 rounded-xl border bg-surface-light text-text-primary
          ${error ? 'border-red-500/50' : 'border-surface-lighter'}
          focus:outline-none focus:border-body focus:ring-1 focus:ring-body
          placeholder:text-text-muted
          transition-colors duration-200
        `}
        {...props}
      />
      {hint && !error && (
        <p className="text-text-muted text-xs">{hint}</p>
      )}
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </div>
  )
}
