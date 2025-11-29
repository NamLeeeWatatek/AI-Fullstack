'use client'

import { casdoorSdk } from '@/lib/casdoor'
import { Button } from '@/components/ui/button'
import { MdAutoAwesome, MdWarning, MdInfo, MdCheckCircle } from 'react-icons/md'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingLogo } from '@/components/ui/loading-logo'
import { motion } from 'framer-motion'

export default function LoginPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuth()
    const [configError, setConfigError] = useState<string | null>(null)
    const [showSetupGuide, setShowSetupGuide] = useState(false)

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard')
        }
    }, [isAuthenticated, isLoading, router])

    useEffect(() => {
        // Validate Casdoor configuration on mount
        const endpoint = process.env.NEXT_PUBLIC_CASDOOR_ENDPOINT
        const clientId = process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID
        const orgName = process.env.NEXT_PUBLIC_CASDOOR_ORG_NAME
        const appName = process.env.NEXT_PUBLIC_CASDOOR_APP_NAME

        if (!endpoint || !clientId || !orgName || !appName) {
            const missing = []
            if (!endpoint) missing.push('NEXT_PUBLIC_CASDOOR_ENDPOINT')
            if (!clientId) missing.push('NEXT_PUBLIC_CASDOOR_CLIENT_ID')
            if (!orgName) missing.push('NEXT_PUBLIC_CASDOOR_ORG_NAME')
            if (!appName) missing.push('NEXT_PUBLIC_CASDOOR_APP_NAME')

            setConfigError(`Missing environment variables: ${missing.join(', ')}`)
        }
    }, [])

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-white">
                <LoadingLogo size="lg" text="Checking authentication..." />
            </div>
        )
    }

    // Don't render login form if already authenticated (will redirect)
    if (isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-white">
                <LoadingLogo size="lg" text="Redirecting to dashboard..." />
            </div>
        )
    }

    const handleLogin = () => {
        try {
            const casdoorLoginUrl = casdoorSdk.getSigninUrl()

            if (!casdoorLoginUrl || casdoorLoginUrl === 'undefined' || casdoorLoginUrl.includes('client_id=&')) {
                setConfigError('Casdoor is not properly configured. Please check your environment variables.')
                setShowSetupGuide(true)
                return
            }

            window.location.href = casdoorLoginUrl
        } catch (error) {
            console.error('Login error:', error)
            setConfigError('Failed to initialize Casdoor login. Please check the console for details.')
            setShowSetupGuide(true)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md p-6 relative z-10"
            >
                <div className="glass rounded-3xl p-8 shadow-2xl">
                    {/* Logo/Brand */}
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 mb-6 shadow-lg shadow-blue-500/20"
                        >
                            <MdAutoAwesome className="w-10 h-10 text-white" />
                        </motion.div>
                        <h1 className="text-4xl font-bold mb-3 gradient-text">
                            WataOmi
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            AI-Powered Omnichannel Platform
                        </p>
                    </div>

                    {/* Error Message */}
                    {configError && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
                        >
                            <div className="flex items-start gap-3">
                                <MdWarning className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-destructive mb-1">Configuration Error</h3>
                                    <p className="text-sm text-destructive/80">{configError}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Setup Guide */}
                    {showSetupGuide && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
                        >
                            <div className="flex items-start gap-3">
                                <MdInfo className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-blue-400 mb-2">Setup Instructions</h3>
                                    <ol className="text-sm text-blue-300/80 space-y-2 list-decimal list-inside">
                                        <li>Create <code className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200">.env.local</code></li>
                                        <li>Add required Casdoor variables</li>
                                        <li>Restart server</li>
                                    </ol>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Login Button */}
                    <div className="space-y-6">
                        <Button
                            onClick={handleLogin}
                            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-0 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]"
                            disabled={!!configError}
                        >
                            Sign in with Casdoor
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                            By signing in, you agree to our Terms of Service and Privacy Policy
                        </p>
                    </div>

                    {/* Features */}
                    <div className="mt-10 pt-8 border-t border-border/50">
                        <div className="grid gap-3">
                            {[
                                'AI-powered workflow automation',
                                'Omnichannel messaging',
                                'Advanced analytics & insights'
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + (i * 0.1) }}
                                    className="flex items-center gap-3 text-sm text-muted-foreground"
                                >
                                    <MdCheckCircle className="w-5 h-5 text-primary" />
                                    {feature}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
