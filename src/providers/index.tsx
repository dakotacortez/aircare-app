import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { ServiceLineProvider } from './ServiceLine'
import { ReferenceCardProvider } from '@/hooks/useReferenceCard'
import { PushNotificationProvider } from './PushNotifications'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <ServiceLineProvider>
        <PushNotificationProvider>
          <HeaderThemeProvider>
            <ReferenceCardProvider>{children}</ReferenceCardProvider>
          </HeaderThemeProvider>
        </PushNotificationProvider>
      </ServiceLineProvider>
    </ThemeProvider>
  )
}
