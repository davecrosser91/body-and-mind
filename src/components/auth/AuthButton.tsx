'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface AuthButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  children: ReactNode
  isLoading?: boolean
}

export function AuthButton({
  children,
  isLoading = false,
  disabled,
  type = 'submit',
  ...props
}: AuthButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`
        w-full px-4 py-2.5 rounded-lg font-medium
        bg-gray-900 text-white
        hover:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        flex items-center justify-center gap-2
      `}
      {...props}
    >
      {isLoading && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  )
}
