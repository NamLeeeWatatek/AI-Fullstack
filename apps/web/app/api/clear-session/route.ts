import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    
    // Xóa tất cả cookies liên quan đến NextAuth
    const allCookies = cookieStore.getAll()
    allCookies.forEach(cookie => {
      if (cookie.name.includes('next-auth') || cookie.name.includes('authjs')) {
        cookieStore.delete(cookie.name)
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Session cleared. Please login again.',
      clearedCookies: allCookies.filter(c => 
        c.name.includes('next-auth') || c.name.includes('authjs')
      ).map(c => c.name)
    })
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
