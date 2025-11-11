import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { ServiceLineProvider } from './ServiceLine'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <ServiceLineProvider>
        <HeaderThemeProvider>{children}</HeaderThemeProvider>
      </ServiceLineProvider>
    </ThemeProvider>
  )
}
