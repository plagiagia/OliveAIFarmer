'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PhotoUploadProps {
  context: 'activity' | 'tree' | 'farm'
  contextId: string
  onUpload: (url: string) => void
  onRemove?: (url: string) => void
  existingPhotos?: string[]
  maxPhotos?: number
  className?: string
}

export function PhotoUpload({
  context,
  contextId,
  onUpload,
  onRemove,
  existingPhotos = [],
  maxPhotos = 5,
  className
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>(existingPhotos)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canAddMore = photos.length < maxPhotos

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setError(null)
    setIsUploading(true)

    try {
      for (const file of Array.from(files)) {
        if (photos.length >= maxPhotos) break

        const formData = new FormData()
        formData.append('file', file)
        formData.append('context', context)
        formData.append('contextId', contextId)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Upload failed')
        }

        const data = await response.json()
        setPhotos(prev => [...prev, data.url])
        onUpload(data.url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία μεταφόρτωσης')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [context, contextId, maxPhotos, onUpload, photos.length])

  const handleRemove = useCallback(async (url: string) => {
    try {
      const response = await fetch(`/api/upload?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPhotos(prev => prev.filter(p => p !== url))
        onRemove?.(url)
      }
    } catch (err) {
      console.error('Failed to delete photo:', err)
    }
  }, [onRemove])

  const handleCameraCapture = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*'
      fileInputRef.current.capture = 'environment'
      fileInputRef.current.click()
    }
  }, [])

  const handleGallerySelect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/jpeg,image/png,image/webp,image/heic'
      fileInputRef.current.removeAttribute('capture')
      fileInputRef.current.click()
    }
  }, [])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
              <img
                src={url}
                alt={`Φωτογραφία ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleRemove(url)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload controls */}
      {canAddMore && (
        <div className="flex gap-2">
          <button
            onClick={handleCameraCapture}
            disabled={isUploading}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed transition-colors',
              isUploading
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 hover:border-olive-400 hover:bg-olive-50 text-gray-600 hover:text-olive-700'
            )}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">Κάμερα</span>
          </button>

          <button
            onClick={handleGallerySelect}
            disabled={isUploading}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed transition-colors',
              isUploading
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 hover:border-olive-400 hover:bg-olive-50 text-gray-600 hover:text-olive-700'
            )}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">Συλλογή</span>
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Photo count */}
      <p className="text-xs text-gray-500 text-center">
        {photos.length} / {maxPhotos} φωτογραφίες
      </p>
    </div>
  )
}

// Simple single photo upload for profile/cover images
interface SinglePhotoUploadProps {
  onUpload: (url: string) => void
  currentPhoto?: string | null
  placeholder?: string
  className?: string
}

export function SinglePhotoUpload({
  onUpload,
  currentPhoto,
  placeholder = 'Προσθήκη φωτογραφίας',
  className
}: SinglePhotoUploadProps) {
  const [photo, setPhoto] = useState<string | null>(currentPhoto || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('context', 'profile')
      formData.append('contextId', 'photo')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setPhoto(data.url)
      onUpload(data.url)
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setIsUploading(false)
    }
  }, [onUpload])

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="relative w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-olive-400 transition-colors overflow-hidden"
      >
        {photo ? (
          <img src={photo} alt="Uploaded" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm">{placeholder}</span>
              </>
            )}
          </div>
        )}
      </button>
    </div>
  )
}
