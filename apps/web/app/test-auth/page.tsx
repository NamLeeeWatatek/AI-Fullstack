'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { useSession } from 'next-auth/react'

export default function TestAuthPage() {
  const { user, isAuthenticated, isLoading, accessToken } = useAuth()
  const { data: session, status } = useSession()

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">useAuth Hook:</h2>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
            {JSON.stringify({ 
              isAuthenticated, 
              isLoading,
              user,
              hasAccessToken: !!accessToken,
              accessToken: accessToken?.substring(0, 20) + '...'
            }, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">useSession Hook:</h2>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
            {JSON.stringify({ 
              status,
              session: session ? {
                user: session.user,
                hasAccessToken: !!session.accessToken,
                accessToken: session.accessToken?.substring(0, 20) + '...'
              } : null
            }, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">localStorage (old):</h2>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
            {JSON.stringify({
              hasToken: !!localStorage.getItem('wataomi_token'),
              token: localStorage.getItem('wataomi_token')?.substring(0, 20) + '...',
              hasUser: !!localStorage.getItem('wataomi_user')
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
