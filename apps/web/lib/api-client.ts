import { getSession } from 'next-auth/react';

/**
 * Get API client with authentication headers
 */
export async function getApiClient() {
  const session = await getSession();
  const token = session?.user?.accessToken || session?.accessToken;

  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
}

/**
 * Fetch with authentication
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const client = await getApiClient();
  
  return fetch(url, {
    ...options,
    headers: {
      ...client.headers,
      ...options.headers,
    },
  });
}

/**
 * Get auth token from session
 */
export async function getAuthToken(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.accessToken || session?.accessToken || null;
}
