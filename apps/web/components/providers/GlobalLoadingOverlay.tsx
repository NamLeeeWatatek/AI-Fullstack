'use client'

import { useAppSelector } from '@/lib/store/hooks'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'

/**
 * Global loading overlay connected to Redux UI state
 * Shows when any part of the app sets global loading state
 */
export function GlobalLoadingOverlay() {
    const { isGlobalLoading, loadingMessage } = useAppSelector(state => state.ui)

    if (!isGlobalLoading) {
        return null
    }

    return <LoadingOverlay message={loadingMessage} />
}
