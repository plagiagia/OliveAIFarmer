'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import {
  getMarketingConsent,
  MARKETING_CONSENT_CHANGED_EVENT,
} from '@/lib/tracking-consent'

interface MetaPixelProps {
  pixelId?: string
}

export default function MetaPixel({ pixelId }: MetaPixelProps) {
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    const updateConsent = () => {
      setHasConsent(getMarketingConsent() === 'granted')
    }

    updateConsent()
    window.addEventListener(MARKETING_CONSENT_CHANGED_EVENT, updateConsent)

    return () => {
      window.removeEventListener(MARKETING_CONSENT_CHANGED_EVENT, updateConsent)
    }
  }, [])

  if (!pixelId || !hasConsent) return null

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `,
      }}
    />
  )
}
