'use client'

import { useState, useEffect } from 'react'
import { Zap, Lock, Eye, EyeOff } from 'lucide-react'

const CORRECT_PASSWORD = 'keboola2026go!'
const AUTH_KEY = 'gca_authenticated'

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Check if already authenticated
    const auth = sessionStorage.getItem(AUTH_KEY)
    setIsAuthenticated(auth === 'true')
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true')
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Invalid password')
      setPassword('')
    }
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="cyber-loader" />
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="cyber-card p-8 w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-cyan-100 to-purple-100 border border-cyan-200 rounded">
              <Zap className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <div className="font-cyber text-lg text-neon-cyan tracking-wider">SIGNAL.ANALYTICS</div>
              <div className="text-[9px] text-gray-500 tracking-widest">GATED CONTENT DASHBOARD</div>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[10px] font-cyber text-gray-500 tracking-wider mb-2">
                <Lock className="w-3 h-3 inline mr-1" />
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cyber-input w-full pr-10"
                  placeholder="Enter password..."
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 text-[11px] text-red-500 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-neon-cyan text-white font-cyber text-[11px] tracking-wider rounded hover:bg-cyan-600 transition-colors"
            >
              ACCESS DASHBOARD
            </button>
          </form>

          <div className="mt-6 text-center text-[10px] text-gray-400">
            Contact your administrator for access
          </div>
        </div>
      </div>
    )
  }

  // Authenticated - show children
  return <>{children}</>
}
