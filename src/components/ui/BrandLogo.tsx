import { cn } from '@/lib/utils'
import Image from 'next/image'

const SIZES = {
  sm: 24,
  md: 28,
  lg: 36,
  xl: 56,
  '2xl': 72,
} as const

type BrandLogoSize = keyof typeof SIZES

interface BrandLogoProps {
  size?: BrandLogoSize
  className?: string
  priority?: boolean
}

export default function BrandLogo({ size = 'md', className, priority = false }: BrandLogoProps) {
  const px = SIZES[size]

  return (
    <Image
      src="/images/logo-monogram.png"
      alt="OliveIQ"
      width={px}
      height={px}
      priority={priority}
      className={cn('shrink-0 object-contain', className)}
    />
  )
}
