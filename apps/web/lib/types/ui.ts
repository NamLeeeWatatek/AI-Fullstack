/**
 * UI Component Props Types
 * Centralized type definitions for UI components
 */

import type { ReactNode } from 'react'

// Alert Dialog
export interface AlertDialogConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  variant?: 'default' | 'destructive'
}

// Tree Table
export interface TreeNode {
  id: string
  label: ReactNode
  children?: TreeNode[]
  isExpanded?: boolean
  icon?: ReactNode
  actions?: ReactNode
  badge?: ReactNode
}

export interface TreeTableProps {
  data: TreeNode[]
  className?: string
}

// Pagination
export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

// Loading Logo
export interface LoadingLogoProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

// JSON Editor
export interface JsonEditorProps {
  value: any
  onChange: (value: any) => void
  height?: string
  readOnly?: boolean
}

// Icon Picker
export interface IconPickerProps {
  value?: string
  onChange: (iconName: string) => void
  className?: string
}

// Checkbox
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> { }

// File Upload
export interface FileUploadProps {
  onUploadComplete?: (fileUrl: string, fileData: any) => void
  onUploadError?: (error: Error) => void
  accept?: string
  maxSize?: number
  bucket?: 'images' | 'documents' | 'avatars'
  multiple?: boolean
  className?: string
}

export interface FileDropzoneProps extends FileUploadProps {
  height?: string
}

// Search Bar
export interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

// Filter Bar
export interface FilterState {
  status?: string
  category?: string
  search?: string
}

export interface FilterBarProps {
  onFilterChange?: (filters: FilterState) => void
}

// Stats Card
export interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

// Notification
export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  timestamp: string
  actionUrl?: string
}
