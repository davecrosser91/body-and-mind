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
        className="text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        className={`
          w-full px-3 py-2 rounded-lg border
          ${error ? 'border-red-300' : 'border-gray-300'}
          focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500
          placeholder:text-gray-400
          transition-colors duration-200
        `}
        {...props}
      />
      {hint && !error && (
        <p className="text-gray-500 text-xs">{hint}</p>
      )}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  )
}
