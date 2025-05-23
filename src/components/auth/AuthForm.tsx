'use client'

import { useSignIn, useSignUp } from '@clerk/nextjs'
import { Building2, Eye, EyeOff, Loader2, Lock, Mail, MapPin, User } from 'lucide-react'
import { useState } from 'react'

interface AuthFormProps {
  mode: 'login' | 'register'
  onNotification: (message: string, type: 'success' | 'error' | 'info') => void
}

export default function AuthForm({ mode, onNotification }: AuthFormProps) {
  const { signIn, setActive } = useSignIn()
  const { signUp } = useSignUp()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    farmName: '',
    location: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === 'login') {
        onNotification('Συνδέεστε...', 'info')
        
        if (!signIn) {
          throw new Error('Sign in not available')
        }

        const result = await signIn.create({
          identifier: formData.email,
          password: formData.password,
        })

        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId })
          onNotification('Επιτυχής σύνδεση! Καλώς ήρθατε στο ΕλαιοLog.', 'success')
        }
      } else {
        onNotification('Δημιουργία λογαριασμού...', 'info')
        
        if (!signUp) {
          throw new Error('Sign up not available')
        }

        await signUp.create({
          emailAddress: formData.email,
          password: formData.password,
          firstName: formData.fullName.split(' ')[0] || formData.fullName,
          lastName: formData.fullName.split(' ').slice(1).join(' ') || ''
        })

        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        onNotification(
          `Καλώς ήρθατε ${formData.fullName}! Παρακαλώ ελέγξτε το email σας για επιβεβαίωση.`,
          'success'
        )
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      const errorMessage = error?.errors?.[0]?.message || 
        (mode === 'login' 
          ? 'Σφάλμα κατά τη σύνδεση. Παρακαλώ ελέγξτε τα στοιχεία σας.'
          : 'Σφάλμα κατά τη δημιουργία λογαριασμού. Παρακαλώ δοκιμάστε ξανά.')
      onNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Διεύθυνση Email
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-lg bg-gray-50 focus:bg-white focus:border-olive-600 focus:outline-none transition-all touch-target"
            placeholder="example@email.gr"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Κωδικός Πρόσβασης
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-2xl text-lg bg-gray-50 focus:bg-white focus:border-olive-600 focus:outline-none transition-all touch-target"
            placeholder="Εισάγετε τον κωδικό σας"
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-target"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Registration fields */}
      {mode === 'register' && (
        <>
          {/* Full Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Πλήρες Όνομα
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-lg bg-gray-50 focus:bg-white focus:border-olive-600 focus:outline-none transition-all touch-target"
                placeholder="π.χ. Γιάννης Παπαδόπουλος"
              />
            </div>
          </div>

          {/* Farm Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Όνομα Ελαιώνα
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                required
                value={formData.farmName}
                onChange={(e) => handleInputChange('farmName', e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-lg bg-gray-50 focus:bg-white focus:border-olive-600 focus:outline-none transition-all touch-target"
                placeholder="π.χ. Ελαιώνας Μεσσηνίας"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Τοποθεσία
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-lg bg-gray-50 focus:bg-white focus:border-olive-600 focus:outline-none transition-all touch-target"
                placeholder="π.χ. Καλαμάτα, Μεσσηνία"
              />
            </div>
          </div>
        </>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-olive-700 to-olive-600 hover:from-olive-800 hover:to-olive-700 text-white py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 touch-target focus-visible-olive disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{mode === 'login' ? 'Συνδέεστε...' : 'Δημιουργία...'}</span>
          </div>
        ) : (
          <span className="uppercase tracking-wide">
            {mode === 'login' ? 'Σύνδεση' : 'Εγγραφή'}
          </span>
        )}
      </button>
    </form>
  )
} 