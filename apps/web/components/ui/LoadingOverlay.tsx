'use client'

import React from 'react'
import { LoadingLogo } from './LoadingLogo'

interface LoadingOverlayProps {
    /** Loading message to display */
    message?: string | null
    /** Allow click through overlay */
    allowInteraction?: boolean
}

/**
 * Global loading overlay that covers entire screen
 * Used for system-wide loading states like uploading, saving, etc.
 */
export function LoadingOverlay({ message, allowInteraction = false }: LoadingOverlayProps) {
    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${
                allowInteraction ? 'pointer-events-none' : 'pointer-events-auto'
            }`}
        >
            <div className="flex flex-col items-center space-y-4 p-8 bg-background rounded-lg shadow-lg border">
                <LoadingLogo size="lg" />
                {message && (
                    <p className="text-sm text-muted-foreground font-medium text-center">
                        {message}
                    </p>
                )}
            </div>
        </div>
    )
}

// Alternative: Full screen overlay without background
export function LoadingFullscreen({ message }: { message?: string | null }) {
    return (
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
                <LoadingLogo size="lg" />
                {message && (
                    <p className="text-sm text-muted-foreground font-medium text-center">
                        {message}
                    </p>
                )}
            </div>
        </div>
    )
}
