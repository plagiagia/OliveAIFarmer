'use client'

import { BarChart3, Cloud, Smartphone, Sprout } from 'lucide-react'
import OliveIcon from '../ui/OliveIcon'

export default function InfoPanel() {
  const benefits = [
    {
      icon: BarChart3,
      text: 'Παρακολούθηση παραγωγής & ποιότητας'
    },
    {
      icon: Sprout,
      text: 'Καταγραφή φροντίδας δέντρων'
    },
    {
      icon: Smartphone,
      text: 'Απλή χρήση από κινητό & υπολογιστή'
    },
    {
      icon: Cloud,
      text: 'Ασφαλής αποθήκευση στο cloud'
    }
  ]

  return (
    <div className="bg-gradient-to-br from-olive-800 to-olive-700 text-white p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute w-96 h-96 -top-48 -right-48 bg-white rounded-full animate-float" />
        <div className="absolute w-64 h-64 -bottom-32 -left-32 bg-white rounded-full animate-float" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10">
        {/* Brand */}
        <div className="text-center lg:text-left mb-12">
          <div className="mb-6 animate-float flex justify-center lg:justify-start">
            <OliveIcon size="2xl" className="text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            ΕλαιοLog
          </h1>
          <p className="text-xl lg:text-2xl leading-relaxed opacity-90">
            Το ψηφιακό ημερολόγιο που θα σας βοηθήσει να διαχειριστείτε τον ελαιώνα σας αποτελεσματικά
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-6">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="flex items-center space-x-4 text-lg"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <benefit.icon className="w-6 h-6" />
              </div>
              <span className="leading-relaxed">{benefit.text}</span>
            </div>
          ))}
        </div>

        {/* Decorative elements */}
        <div className="mt-12 flex justify-center lg:justify-start space-x-4 opacity-60">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>
    </div>
  )
} 