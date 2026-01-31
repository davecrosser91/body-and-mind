'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface WhoopStatus {
  connected: boolean
  lastSync: string | null
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  }

  return date.toLocaleDateString()
}

/**
 * Settings page component
 *
 * Sections:
 * - Profile (name, email - read only)
 * - Integrations (Whoop)
 * - Account (logout)
 */
export default function SettingsPage() {
  const { user, token, logout } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Whoop integration state
  const [whoopStatus, setWhoopStatus] = useState<WhoopStatus | null>(null)
  const [isLoadingWhoop, setIsLoadingWhoop] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  // Toast/notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Fetch Whoop connection status
  const fetchWhoopStatus = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch('/api/v1/integrations/whoop', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWhoopStatus(data.data)
      } else {
        setWhoopStatus({ connected: false, lastSync: null })
      }
    } catch {
      setWhoopStatus({ connected: false, lastSync: null })
    } finally {
      setIsLoadingWhoop(false)
    }
  }, [token])

  // Check URL params for success/error messages
  useEffect(() => {
    const whoopParam = searchParams.get('whoop')

    if (whoopParam === 'connected') {
      setNotification({
        type: 'success',
        message: 'Whoop connected successfully!',
      })
      // Clear the URL param
      router.replace('/settings', { scroll: false })
    } else if (whoopParam === 'error') {
      setNotification({
        type: 'error',
        message: 'Failed to connect Whoop. Please try again.',
      })
      router.replace('/settings', { scroll: false })
    }
  }, [searchParams, router])

  // Fetch Whoop status on mount
  useEffect(() => {
    fetchWhoopStatus()
  }, [fetchWhoopStatus])

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [notification])

  // Handle Whoop connect
  const handleConnectWhoop = async () => {
    if (!token) return

    setIsConnecting(true)
    try {
      const response = await fetch('/api/v1/integrations/whoop/connect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data?.authorizationUrl) {
          window.location.href = data.data.authorizationUrl
        }
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to initiate Whoop connection.',
        })
      }
    } catch {
      setNotification({
        type: 'error',
        message: 'Failed to connect to Whoop.',
      })
    } finally {
      setIsConnecting(false)
    }
  }

  // Handle Whoop sync
  const handleSyncWhoop = async () => {
    if (!token) return

    setIsSyncing(true)
    try {
      const response = await fetch('/api/v1/integrations/whoop/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Whoop data synced successfully!',
        })
        // Refresh status to get new lastSync
        await fetchWhoopStatus()
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to sync Whoop data.',
        })
      }
    } catch {
      setNotification({
        type: 'error',
        message: 'Failed to sync Whoop data.',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Handle Whoop disconnect
  const handleDisconnectWhoop = async () => {
    if (!token) return

    setIsDisconnecting(true)
    try {
      const response = await fetch('/api/v1/integrations/whoop', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setWhoopStatus({ connected: false, lastSync: null })
        setNotification({
          type: 'success',
          message: 'Whoop disconnected successfully.',
        })
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to disconnect Whoop.',
        })
      }
    } catch {
      setNotification({
        type: 'error',
        message: 'Failed to disconnect Whoop.',
      })
    } finally {
      setIsDisconnecting(false)
      setShowDisconnectConfirm(false)
    }
  }

  // Handle logout
  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Page Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and integrations</p>
      </motion.header>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="text-sm font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Name
              </label>
              <p className="text-gray-900">{user?.name || 'Not set'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Email
              </label>
              <p className="text-gray-900">{user?.email || 'Not available'}</p>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Integrations Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Whoop Integration */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {/* Whoop Logo/Icon */}
                <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">Whoop</h3>
                    {isLoadingWhoop ? (
                      <span className="text-xs text-gray-400">Loading...</span>
                    ) : whoopStatus?.connected ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Connected
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Sync your sleep and workout data automatically
                  </p>
                  {whoopStatus?.connected && whoopStatus.lastSync && (
                    <p className="text-xs text-gray-400 mt-1">
                      Last synced: {formatRelativeTime(whoopStatus.lastSync)}
                    </p>
                  )}
                </div>
              </div>

              {/* Whoop Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isLoadingWhoop ? (
                  <div className="w-20 h-8 bg-gray-100 rounded animate-pulse" />
                ) : whoopStatus?.connected ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSyncWhoop}
                      disabled={isSyncing}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSyncing ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Syncing
                        </span>
                      ) : (
                        'Sync Now'
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDisconnectConfirm(true)}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Disconnect
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConnectWhoop}
                    disabled={isConnecting}
                    className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Connecting
                      </span>
                    ) : (
                      'Connect Whoop'
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Account Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Sign out of your account on this device
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="px-4 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Disconnect Confirmation Modal */}
      <AnimatePresence>
        {showDisconnectConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowDisconnectConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 shadow-xl max-w-sm mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Disconnect Whoop?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                This will stop syncing your sleep and workout data. You can reconnect anytime.
              </p>
              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDisconnectConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDisconnectWhoop}
                  disabled={isDisconnecting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDisconnecting ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Disconnecting
                    </span>
                  ) : (
                    'Disconnect'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
