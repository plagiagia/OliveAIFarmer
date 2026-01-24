interface OliveIconProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const sizeMap = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-24 h-24',
}

export default function OliveIcon({ className = '', size = 'md' }: OliveIconProps) {
  const sizeClass = sizeMap[size]
  
  return (
    <svg 
      className={`${sizeClass} ${className}`}
      viewBox="0 0 24 24" 
      fill="currentColor"
      aria-label="Olive Logo"
    >
      <ellipse cx="12" cy="12" rx="5" ry="8" transform="rotate(-30 12 12)" />
      <path d="M12 4 Q14 2 16 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  )
}
