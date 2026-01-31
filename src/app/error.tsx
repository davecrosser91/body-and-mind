'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { MiloIcon } from '@/components/habitanimals/icons/MiloIcon'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {/* Sad Habitanimal */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <MiloIcon mood="sad" size={120} className="mx-auto" />
        </motion.div>

        {/* Error message */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-semibold text-gray-900 mb-2"
        >
          Something went wrong
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-500 mb-8 max-w-md"
        >
          Milo is feeling a bit under the weather. An unexpected error occurred,
          but do not worry - you can try again.
        </motion.p>

        {/* Error details (only in development) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left max-w-md mx-auto"
          >
            <p className="text-xs font-mono text-red-600 break-all">{error.message}</p>
            {error.digest && (
              <p className="text-xs font-mono text-red-400 mt-1">Digest: {error.digest}</p>
            )}
          </motion.div>
        )}

        {/* Try again button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white
              bg-gray-900 rounded-lg hover:bg-gray-800
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900
              transition-colors min-h-[44px] min-w-[44px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700
              bg-white border border-gray-200 rounded-lg hover:bg-gray-50
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
              transition-colors min-h-[44px] min-w-[44px]"
          >
            Go home
          </a>
        </motion.div>
      </motion.div>
    </div>
  )
}
