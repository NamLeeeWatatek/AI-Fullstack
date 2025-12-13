import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/Sonner'

import { WorkspaceProvider } from '@/lib/context/workspace-context'
import { ReduxProvider } from '@/lib/store/Provider'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { TokenRefreshProvider } from '@/components/providers/TokenRefreshProvider'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { GlobalLoadingOverlay } from '@/components/providers/GlobalLoadingOverlay'

const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'WataOmi - One AI. Every Channel. Zero Code.',
    description: 'AI-powered omnichannel customer engagement platform with zero-code flow builder and unified inbox.',
    keywords: ['AI', 'chatbot', 'omnichannel', 'customer engagement', 'automation', 'n8n'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} font-sans antialiased`}>
                <SessionProvider>
                    <TokenRefreshProvider>
                        <QueryProvider>
                            <ThemeProvider
                                attribute="class"
                                defaultTheme="system"
                                enableSystem
                                disableTransitionOnChange
                            >
                                <WorkspaceProvider>
                                    <ReduxProvider>
                                        {children}
                                        <GlobalLoadingOverlay />
                                        <Toaster />
                                    </ReduxProvider>
                                </WorkspaceProvider>
                            </ThemeProvider>
                        </QueryProvider>
                    </TokenRefreshProvider>
                </SessionProvider>
            </body>
        </html>
    )
}
