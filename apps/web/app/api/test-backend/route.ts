import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    // Debug: Log toàn bộ session để xem có gì
    console.log('🔍 [test-backend] Full session:', JSON.stringify(session, null, 2))

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    const token = (session as any).accessToken

    console.log('🔍 [test-backend] Token exists:', !!token)
    console.log('🔍 [test-backend] Token preview:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN')

    // Nếu không có token, trả về thông tin debug
    if (!token) {
      return NextResponse.json({
        sessionExists: !!session,
        hasToken: false,
        tokenPreview: null,
        sessionKeys: Object.keys(session),
        sessionData: session,
        error: 'No access token in session'
      })
    }

    // Test backend connection
    const response = await fetch(`${apiUrl}/flows/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    return NextResponse.json({
      sessionExists: !!session,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
      backendStatus: response.status,
      backendResponse: data,
    })
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
