'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExportButtonProps {
  onExport: () => void | Promise<void>
  label?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
}

export function ExportButton({
  onExport,
  label = 'Εξαγωγή CSV',
  variant = 'secondary',
  size = 'md',
  className,
  disabled = false
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (isExporting || disabled) return

    setIsExporting(true)
    try {
      await onExport()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
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
      disabled={isExporting || disabled}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200',
        variantStyles[variant],
        sizeStyles[size],
        (isExporting || disabled) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="w-4 h-4" />
      )}
      <span>{isExporting ? 'Εξαγωγή...' : label}</span>
    </button>
  )
}

interface ExportDropdownProps {
  options: Array<{
    label: string
    onExport: () => void | Promise<void>
  }>
  label?: string
  className?: string
}

export function ExportDropdown({
  options,
  label = 'Εξαγωγή',
  className
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (exportFn: () => void | Promise<void>) => {
    setIsExporting(true)
    setIsOpen(false)
    try {
      await exportFn()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200',
          'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
          isExporting && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isExporting ? 'Εξαγωγή...' : label}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleExport(option.onExport)}
                className="w-full px-4 py-3 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-gray-400" />
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
