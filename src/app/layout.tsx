import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Routine Game',
  description: 'Gamify your daily habits with Habitanimals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  )
}
