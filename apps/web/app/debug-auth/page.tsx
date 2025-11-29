'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function DebugAuthPage() {
  const { data: session, status } = useSession()
  const [apiTest, setApiTest] = useState<any>(null)

  const testAPI = async () => {
    try {
      const response = await fetch('/api/test-backend')
      const data = await response.json()
      setApiTest(data)
    } catch (error) {
      setApiTest({ error: String(error) })
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>

      <div className="space-y-6">
        {/* Actions */}
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Actions</h2>
          <div className="flex gap-2">
            <Button onClick={handleLogout} variant="destructive">Logout & Clear Session</Button>
            <Button onClick={() => window.location.href = '/login'}>Go to Login</Button>
          </div>
        </div>

        {/* Session Status */}
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Session Status</h2>
          <p>Status: <code className="bg-muted px-2 py-1 rounded">{status}</code></p>
        </div>

        {/* Session Data */}
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Session Data</h2>
          <pre className="bg-muted p-4 rounded overflow-auto text-xs">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        {/* Access Token */}
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Access Token</h2>
          <p className="break-all text-xs">
            {(session as any)?.accessToken || 'No token'}
          </p>
        </div>

        {/* API Test */}
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Backend API Test</h2>
          <Button onClick={testAPI} className="mb-4">Test Backend Connection</Button>
          {apiTest && (
            <pre className="bg-muted p-4 rounded overflow-auto text-xs">
              {JSON.stringify(apiTest, null, 2)}
            </pre>
          )}
        </div>

        {/* Environment */}
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Environment</h2>
          <p>API URL: <code className="bg-muted px-2 py-1 rounded text-xs">{process.env.NEXT_PUBLIC_API_URL}</code></p>
        </div>
      </div>
    </div>
  )
}
