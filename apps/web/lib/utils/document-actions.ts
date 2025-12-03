/**
 * Document Actions - Download & Preview
 */

import { getKBDocumentDownloadUrl } from '../api/knowledge-base'
import toast from '../toast'

/**
 * Download document
 */
export async function downloadDocument(documentId: string, documentName?: string) {
  try {
    const { url, filename, mimeType } = await getKBDocumentDownloadUrl(documentId)

    // Fetch file as blob and trigger download
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch file')
    }

    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)

    // Create temporary link and trigger download
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = documentName || filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up blob URL
    window.URL.revokeObjectURL(blobUrl)

    toast.success('Download started')
  } catch (error) {
    console.error('Download failed:', error)
    toast.error('Failed to download document')
  }
}

/**
 * Preview document in new tab
 */
export async function previewDocument(documentId: string) {
  try {
    const { url, filename, mimeType } = await getKBDocumentDownloadUrl(documentId)

    // Open in new tab
    window.open(url, '_blank')

    toast.success('Opening preview')
  } catch (error) {
    console.error('Preview failed:', error)
    toast.error('Failed to preview document')
  }
}

/**
 * Check if document can be previewed in browser
 */
export function canPreviewDocument(mimeType?: string | null): boolean {
  if (!mimeType) return false

  const previewableMimeTypes = [
    'application/pdf',
    'text/plain',
    'text/html',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
  ]

  return previewableMimeTypes.includes(mimeType)
}
