'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { TemplateManager } from '@/components/training'

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
        const data = await response.json()
        const result = data.data || {}

        // Build a detailed message
        const parts: string[] = []
        if (result.sleepSynced > 0) {
          parts.push(`${result.sleepSynced} sleep record${result.sleepSynced > 1 ? 's' : ''}`)
        }
        if (result.workoutsSynced > 0) {
          parts.push(`${result.workoutsSynced} workout${result.workoutsSynced > 1 ? 's' : ''}`)
        }
        if (result.autoTriggersActivated > 0) {
          parts.push(`${result.autoTriggersActivated} auto-trigger${result.autoTriggersActivated > 1 ? 's' : ''} fired`)
        }

        const message = parts.length > 0
          ? `Synced: ${parts.join(', ')}`
          : 'Whoop synced - no new data'

        setNotification({
          type: 'success',
          message,
        })
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
      className="max-w-2xl mx-auto space-y-6 pb-8"
    >
      {/* Page Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted mt-1">Manage your account and integrations</p>
      </motion.header>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-4 left-1/2 z-50 px-4 py-3 rounded-xl shadow-lg backdrop-blur-lg ${
              notification.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
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
                className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
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
        <div className="bg-surface/60 backdrop-blur-lg rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-text-primary">Profile</h2>
          </div>
          <div className="p-5 space-y-5">
            {/* Avatar and Name */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-body to-mind flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="text-xl font-semibold text-text-primary">{user?.name || 'User'}</p>
                <p className="text-sm text-text-muted">{user?.email || 'No email'}</p>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid gap-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Name</p>
                  <p className="text-text-primary">{user?.name || 'Not set'}</p>
                </div>
                <button className="text-sm text-text-muted hover:text-text-primary transition-colors">
                  Edit
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Email</p>
                  <p className="text-text-primary">{user?.email || 'Not available'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Integrations Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="bg-surface/60 backdrop-blur-lg rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-text-primary">Integrations</h2>
          </div>
          <div className="p-5">
            {/* Whoop Integration */}
            <div className="flex items-start gap-4">
              {/* Whoop Logo */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>

              {/* Whoop Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-text-primary">Whoop</h3>
                  {isLoadingWhoop ? (
                    <span className="text-xs text-text-muted">Loading...</span>
                  ) : whoopStatus?.connected ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-text-muted border border-white/10">
                      Not connected
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-muted">
                  Sync your sleep, recovery, and workout data automatically
                </p>
                {whoopStatus?.connected && whoopStatus.lastSync && (
                  <p className="text-xs text-text-muted mt-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last synced {formatRelativeTime(whoopStatus.lastSync)}
                  </p>
                )}
              </div>

              {/* Whoop Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isLoadingWhoop ? (
                  <div className="w-24 h-9 bg-white/5 rounded-lg animate-pulse" />
                ) : whoopStatus?.connected ? (
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSyncWhoop}
                      disabled={isSyncing}
                      className="px-4 py-2 text-sm font-medium text-text-primary bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSyncing ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Syncing
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Sync
                        </span>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDisconnectConfirm(true)}
                      className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-all"
                    >
                      Disconnect
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConnectWhoop}
                    disabled={isConnecting}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-lg shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Connecting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Connect Whoop
                      </span>
                    )}
                  </motion.button>
                )}
              </div>
            </div>

            {/* More integrations placeholder */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center gap-4 opacity-50">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-dashed border-white/20">
                  <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-text-muted">More integrations coming soon</h3>
                  <p className="text-sm text-text-muted/70">Apple Health, Oura, Garmin, and more</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Training Templates Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <div className="bg-surface/60 backdrop-blur-lg rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-text-primary">Training Templates</h2>
            <p className="text-sm text-text-muted mt-1">Manage your saved workout templates</p>
          </div>
          <TemplateManager embedded />
        </div>
      </motion.section>

      {/* Account Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <div className="bg-surface/60 backdrop-blur-lg rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-text-primary">Account</h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Sign Out */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Sign out</p>
                  <p className="text-xs text-text-muted">Sign out of your account on this device</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-all"
              >
                Logout
              </motion.button>
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Delete account</p>
                    <p className="text-xs text-text-muted">Permanently delete your account and all data</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 text-sm font-medium text-red-400/50 hover:text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-all cursor-not-allowed"
                  disabled
                >
                  Delete
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* App Info */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="text-center py-4"
      >
        <p className="text-xs text-text-muted">
          Routine Game v1.0.0
        </p>
        <p className="text-xs text-text-muted/50 mt-1">
          Built with care for your daily wellness
        </p>
      </motion.section>

      {/* Disconnect Confirmation Modal */}
      <AnimatePresence>
        {showDisconnectConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDisconnectConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-2xl p-6 shadow-2xl max-w-sm mx-4 border border-white/10"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary text-center mb-2">
                Disconnect Whoop?
              </h3>
              <p className="text-sm text-text-muted text-center mb-6">
                This will stop syncing your sleep and workout data. You can reconnect anytime.
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDisconnectConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-text-primary bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDisconnectWhoop}
                  disabled={isDisconnecting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDisconnecting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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
