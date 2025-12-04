'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { LoadingLogo } from '@/components/ui/loading-logo'

export default function CasdoorCallbackPage() {
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code')
            const state = searchParams.get('state')
            const error = searchParams.get('error')

            if (error) {
                console.error('Casdoor error:', error)
                router.push('/login?error=' + encodeURIComponent(error))
                return
            }

            if (!code) {
                console.error('No code received from Casdoor')
                router.push('/login?error=no_code')
                return
            }

            try {
                // Call backend to exchange code for token
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
                const response = await fetch(`${apiUrl}/auth/casdoor/callback`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code, state }),
                })

                if (!response.ok) {
                    throw new Error('Failed to authenticate')
                }

                const data = await response.json()

                // Sign in with NextAuth using the credentials provider
                const result = await signIn('credentials', {
                    redirect: false,
                    code: code,
                    state: state,
                    // Pass the backend response data
                    backendData: JSON.stringify(data),
                })

                if (result?.error) {
                    console.error('NextAuth sign in error:', result.error)
                    router.push('/login?error=signin_failed')
                    return
                }

                // Redirect to dashboard
                router.push('/dashboard')
            } catch (error) {
                console.error('Authentication error:', error)
                router.push('/login?error=auth_failed')
            }
        }

        handleCallback()
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <LoadingLogo size="lg" text="Completing authentication..." />
        </div>
    )
}
