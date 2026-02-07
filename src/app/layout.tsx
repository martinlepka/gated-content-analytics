import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthGate } from '@/components/auth/AuthGate'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Gated Content Analytics | Keboola',
  description: 'Analytics dashboard for gated content downloads and lead quality',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthGate>
          {children}
        </AuthGate>
      </body>
    </html>
  )
}
