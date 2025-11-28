/**
 * Server-side Axios Configuration with NextAuth
 * Use this in server components and API routes
 */
import axios from 'axios'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api/v1'

export const axiosServer = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Helper function to create axios instance with auth token
export async function getAuthenticatedAxios() {
  const session = await getServerSession(authOptions)
  
  const instance = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.accessToken && {
        Authorization: `Bearer ${session.accessToken}`,
      }),
    },
  })

  instance.interceptors.response.use(
    (response) => response.data,
    (error) => {
      const message = error.response?.data?.detail || error.message || 'An error occurred'
      return Promise.reject(new Error(message))
    }
  )

  return instance
}

export default axiosServer
