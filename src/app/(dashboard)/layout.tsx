'use client'

import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <DashboardContent>{children}</DashboardContent>
    </ProtectedRoute>
  )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/habitanimals" className="text-xl font-bold hover:text-gray-700 transition-colors">
            Habit Animals
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/habitanimals" className="text-gray-600 hover:text-gray-900">
              Habitanimals
            </Link>
            <Link href="/habits" className="text-gray-600 hover:text-gray-900">
              Habits
            </Link>
            <Link href="/settings" className="text-gray-600 hover:text-gray-900">
              Settings
            </Link>
            {user && (
              <span className="text-sm text-gray-500">
                {user.name || user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
