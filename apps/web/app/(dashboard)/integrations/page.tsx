'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiLoader } from 'react-icons/fi'

export default function IntegrationsRedirect() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to channels page
        router.replace('/channels')
    }, [router])

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <FiLoader className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">
                    Redirecting to Channels & Integrations...
                </p>
            </div>
        </div>
    )
}
