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
        w-full px-4 py-2.5 rounded-xl font-medium
        bg-body text-background
        hover:bg-body/90
        focus:outline-none focus:ring-2 focus:ring-body focus:ring-offset-2 focus:ring-offset-background
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        flex items-center justify-center gap-2
      `}
      {...props}
    >
      {isLoading && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
      )}
      {children}
    </button>
  )
}
