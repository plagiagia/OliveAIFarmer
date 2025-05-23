'use client'

import { useUser } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Notification from '../ui/Notification'
import AuthForm from './AuthForm'
import GoogleSignInButton from './GoogleSignInButton'
import InfoPanel from './InfoPanel'

export default function AuthPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    show: boolean
  }>({
    message: '',
    type: 'info',
    show: false
  })

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
    }
  }, [isLoaded, isSignedIn, router])

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen olive-gradient flex items-center justify-center">
        <div className="glass-effect rounded-3xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-olive-700" />
          <p className="text-olive-700 mt-4">Φόρτωση...</p>
        </div>
      </div>
    )
  }

  // If user is signed in, show loading while redirecting
  if (isSignedIn) {
    return (
      <div className="min-h-screen olive-gradient flex items-center justify-center">
        <div className="glass-effect rounded-3xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-olive-700" />
          <p className="text-olive-700 mt-4">Μεταφορά στον πίνακα ελέγχου...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen olive-gradient flex items-center justify-center p-5">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 glass-effect rounded-3xl shadow-2xl overflow-hidden min-h-[600px]">
        {/* Info Panel */}
        <InfoPanel />
        
        {/* Auth Panel */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-olive-800 mb-3">
              Καλώς ήρθατε
            </h2>
            <p className="text-gray-600 text-lg">
              Ξεκινήστε τη διαχείριση του ελαιώνα σας σήμερα
            </p>
          </div>

          {/* Auth Tabs */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all touch-target ${
                authMode === 'login'
                  ? 'bg-white text-olive-700 shadow-md'
                  : 'text-gray-600 hover:text-olive-700'
              }`}
            >
              Σύνδεση
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all touch-target ${
                authMode === 'register'
                  ? 'bg-white text-olive-700 shadow-md'
                  : 'text-gray-600 hover:text-olive-700'
              }`}
            >
              Εγγραφή
            </button>
          </div>

          {/* Google Sign In */}
          <GoogleSignInButton 
            onNotification={showNotification}
            mode={authMode}
          />

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-6 bg-white text-gray-500">ή με email</span>
            </div>
          </div>

          {/* Auth Form */}
          <AuthForm 
            mode={authMode}
            onNotification={showNotification}
          />
        </div>
      </div>

      {/* Notification */}
      <Notification 
        message={notification.message}
        type={notification.type}
        show={notification.show}
      />
    </div>
  )
} 