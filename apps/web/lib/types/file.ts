/**
 * File Management Types
 * Centralized type definitions for file upload and management
 */

// File Upload
export interface UploadResponse {
  file: {
    id: string
    path: string
  }
  uploadSignedUrl?: string
}

export interface FileUploadOptions {
  onProgress?: (progress: number) => void
  bucket?: 'images' | 'documents' | 'avatars'
}

export interface UseFileUploadOptions extends FileUploadOptions {
  onSuccess?: (fileUrl: string, fileData: any) => void
  onError?: (error: Error) => void
}

// File Items
export interface FileItem {
  id?: string
  name: string
  url: string
  size?: number
  uploadedAt?: string
  type?: string
}

export interface FileListProps {
  files: FileItem[]
  onDelete?: (id: string) => void
}

// Image Gallery
export interface ImageGalleryProps {
  images: Array<{
    url: string
    name: string
    id?: string
  }>
  onDelete?: (id: string) => void
}

// Media Uploader
export interface MediaUploaderProps {
  value?: string
  onChange: (url: string) => void
  accept?: string
  maxSize?: number
  bucket?: 'images' | 'documents' | 'avatars'
}
