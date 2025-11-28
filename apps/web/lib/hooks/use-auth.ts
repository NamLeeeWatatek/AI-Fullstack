// DEPRECATED: This file is kept for backward compatibility
// Use lib/hooks/useAuth.ts instead (with NextAuth)
import { useRouter } from 'next/navigation'

export function useAuth() {
    const router = useRouter()

    const getToken = () => {
        console.warn('DEPRECATED: use useAuth from lib/hooks/useAuth.ts instead')
        if (typeof window === 'undefined') return null
        return localStorage.getItem('wataomi_token')
    }

    const getUser = () => {
        console.warn('DEPRECATED: use useAuth from lib/hooks/useAuth.ts instead')
        if (typeof window === 'undefined') return null
        const userStr = localStorage.getItem('wataomi_user')
        return userStr ? JSON.parse(userStr) : null
    }

    const isAuthenticated = () => {
        console.warn('DEPRECATED: use useAuth from lib/hooks/useAuth.ts instead')
        return !!getToken()
    }

    const login = (token: string, user: any) => {
        console.warn('DEPRECATED: use NextAuth signIn instead')
        localStorage.setItem('wataomi_token', token)
        localStorage.setItem('wataomi_user', JSON.stringify(user))
    }

    const logout = async () => {
        console.warn('DEPRECATED: use useAuth from lib/hooks/useAuth.ts instead')
        try {
            const token = getToken()
            if (token) {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api/v1'}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }).catch(() => {})
            }
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            localStorage.removeItem('wataomi_token')
            localStorage.removeItem('wataomi_user')
            router.push('/login')
        }
    }

    const requireAuth = () => {
        console.warn('DEPRECATED: use useAuth from lib/hooks/useAuth.ts instead')
        if (!isAuthenticated()) {
            router.push('/login')
            return false
        }
        return true
    }

    return {
        getToken,
        getUser,
        isAuthenticated,
        login,
        logout,
        requireAuth
    }
}
