import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { ServiceLineProvider } from './ServiceLine'
import { ReferenceCardProvider } from '@/hooks/useReferenceCard'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <ServiceLineProvider>
        <HeaderThemeProvider>
          <ReferenceCardProvider>{children}</ReferenceCardProvider>
        </HeaderThemeProvider>
      </ServiceLineProvider>
    </ThemeProvider>
  )
}
