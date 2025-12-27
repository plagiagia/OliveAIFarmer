'use client'

import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PDFExportButtonProps {
  farmId: string
  farmName: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PDFExportButton({
  farmId,
  farmName,
  variant = 'secondary',
  size = 'md',
  className
}: PDFExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleExport = async () => {
    if (isGenerating) return

    setIsGenerating(true)

    try {
      // Dynamically import react-pdf to avoid SSR issues
      const { pdf } = await import('@react-pdf/renderer')
      const { FarmPDFReport } = await import('./FarmPDFReport')

      // Fetch farm data
      const response = await fetch(`/api/farms/${farmId}/report`)
      if (!response.ok) throw new Error('Failed to fetch farm data')

      const data = await response.json()

      // Generate PDF
      const blob = await pdf(<FarmPDFReport data={data} />).toBlob()

      // Download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${farmName.replace(/\s+/g, '_')}_αναφορά_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Αποτυχία δημιουργίας PDF. Παρακαλώ δοκιμάστε ξανά.')
    } finally {
      setIsGenerating(false)
    }
  }

  const variantStyles = {
    primary: 'bg-olive-600 text-white hover:bg-olive-700',
    secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2'
  }

  return (
    <button
      onClick={handleExport}
      disabled={isGenerating}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200',
        variantStyles[variant],
        sizeStyles[size],
        isGenerating && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      <span>{isGenerating ? 'Δημιουργία PDF...' : 'Εξαγωγή PDF'}</span>
    </button>
  )
}
