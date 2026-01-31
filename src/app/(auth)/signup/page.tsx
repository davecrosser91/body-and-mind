'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AuthInput } from '@/components/auth/AuthInput'
import { AuthButton } from '@/components/auth/AuthButton'
import { useAuth } from '@/hooks/useAuth'

interface FieldErrors {
  email?: string
  password?: string
  confirmPassword?: string
  name?: string
}

function validatePassword(password: string): boolean {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  return hasMinLength && hasUppercase && hasLowercase && hasNumber
}

export default function SignupPage() {
  const router = useRouter()
  const { signup } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = (): boolean => {
    const errors: FieldErrors = {}

    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email'
    }

    if (!password) {
      errors.password = 'Password is required'
    } else if (!validatePassword(password)) {
      errors.password = 'Password does not meet requirements'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await signup(email, password, name.trim() || undefined)
      router.push('/onboarding')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const clearFieldError = (field: keyof FieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full"
    >
      {/* Logo/Title */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="text-gray-600 mt-2">Start your habit journey today</p>
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200"
        >
          <p className="text-sm text-red-600">{error}</p>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <AuthInput
            label="Name (optional)"
            type="text"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              clearFieldError('name')
            }}
            placeholder="Your name"
            error={fieldErrors.name}
            autoComplete="name"
            autoFocus
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <AuthInput
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearFieldError('email')
            }}
            placeholder="you@example.com"
            error={fieldErrors.email}
            autoComplete="email"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <AuthInput
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              clearFieldError('password')
            }}
            placeholder="Create a password"
            error={fieldErrors.password}
            hint="8+ characters, uppercase, lowercase, and number"
            autoComplete="new-password"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <AuthInput
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              clearFieldError('confirmPassword')
            }}
            placeholder="Confirm your password"
            error={fieldErrors.confirmPassword}
            autoComplete="new-password"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="pt-2"
        >
          <AuthButton type="submit" isLoading={isLoading}>
            Create account
          </AuthButton>
        </motion.div>
      </form>

      {/* Login link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="text-center mt-6 text-sm text-gray-600"
      >
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-gray-900 font-medium hover:underline"
        >
          Log in
        </Link>
      </motion.p>
    </motion.div>
  )
}
