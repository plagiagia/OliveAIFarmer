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
      viewBox="0 0 32 32" 
      fill="none"
      aria-label="Olive Logo"
    >
      <path
        d="M17.5 9.4c1.1-2.7 3.4-4.7 6.5-5.4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M17.8 9.6c2.4-1 5.1-.7 7.4.9-2.4 1.7-5.2 2-7.8.9"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <ellipse
        cx="12.6"
        cy="19.4"
        rx="5.2"
        ry="8.1"
        transform="rotate(-24 12.6 19.4)"
        fill="currentColor"
      />
      <ellipse
        cx="19.6"
        cy="16.7"
        rx="4.2"
        ry="6.8"
        transform="rotate(18 19.6 16.7)"
        fill="currentColor"
        fillOpacity="0.7"
      />
      <ellipse
        cx="11"
        cy="15.8"
        rx="1.4"
        ry="2.1"
        transform="rotate(-24 11 15.8)"
        fill="white"
        fillOpacity="0.28"
      />
    </svg>
  )
}
