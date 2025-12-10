'use client'

import { useState, useEffect, memo } from 'react'
import { FiUpload, FiX, FiArrowRight } from 'react-icons/fi'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'
import { Spinner } from './Spinner'
import { axiosClient } from '@/lib/axios-client'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger
} from './DropdownMenu'
import { FiChevronDown } from 'react-icons/fi'
import { Input } from './Input'
import { Textarea } from './Textarea'
import { Label } from './Label'
import { useFileUpload } from '@/lib/hooks/use-file-upload'
import { cn } from '@/lib/utils'
import { KeyValueEditor } from '../features/workflow/KeyValueEditor'

// NodeProperty type from backend - this should match the backend definition
interface NodeProperty {
    name: string
    label: string
    type: 'string' | 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'multi-select' | 'json' | 'file' | 'files' | 'key-value' | 'dynamic-form' | 'channel-select'
    required?: boolean
    placeholder?: string
    description?: string
    options?: Array<{ value: string; label: string } | string> | string
    default?: any
    showWhen?: Record<string, any>
    min?: number
    max?: number
    step?: number
    pattern?: string
    maxLength?: number
    rows?: number
    accept?: string
    multiple?: boolean
    properties?: NodeProperty[]
}

interface DynamicFormFieldProps {
    field: NodeProperty
    value: any
    onChange: (key: string, value: any) => void
    allValues?: Record<string, any>
    className?: string
}

export const DynamicFormField = memo(function DynamicFormField({
    field,
    value,
    onChange,
    allValues = {},
    className
}: DynamicFormFieldProps) {
    const [jsonError, setJsonError] = useState<string | null>(null)
    const [uploadingFiles, setUploadingFiles] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [dynamicOptions, setDynamicOptions] = useState<any[]>([])
    const [loadingOptions, setLoadingOptions] = useState(false)

    const { uploadFile, uploadMultipleFiles } = useFileUpload({
        bucket: 'images',
        onSuccess: (fileUrl) => {
            onChange(field.name, fileUrl)
        },
    })

    if (field.showWhen) {
        const conditionMet = Object.entries(field.showWhen).every(
            ([key, val]) => allValues[key] === val
        )
        if (!conditionMet) return null
    }

    const currentValue = value !== undefined ? value : field.default

    const fieldId = `field-${field.name}`

    useEffect(() => {
        const options = field.options
        if (typeof options === 'string' && (options as string).startsWith('dynamic:')) {
            loadDynamicOptions(options as string)
        } else if (field.type === 'channel-select') {
            loadDynamicOptions('dynamic:channels')
        }
    }, [field.name])

    const loadDynamicOptions = async (optionsStr: string) => {
        const optionsConfig = optionsStr.replace('dynamic:', '')

        try {
            setLoadingOptions(true)

            if (optionsConfig.startsWith('ai-models:')) {
                const typeFilter = optionsConfig.split(':')[1]
                const data = await axiosClient.get('/ai-providers/models')

                let allModels: any[] = []

                if (typeFilter === 'chat' || typeFilter === 'image') {
                    data.forEach((providerData: any) => {
                        const filteredModels = providerData.models
                            .filter((m: any) => m.is_available && m.type === typeFilter)
                            .map((m: any) => ({
                                value: m.model_name,
                                label: m.display_name || m.name
                            }))
                        allModels = allModels.concat(filteredModels)
                    })
                } else {
                    const providerData = data.find((p: any) => p.provider === typeFilter)
                    if (providerData) {
                        allModels = providerData.models
                            .filter((m: any) => m.is_available)
                            .map((m: any) => ({
                                value: m.model_name,
                                label: m.display_name || m.name
                            }))
                    }
                }

                setDynamicOptions(allModels)
            }
            else if (optionsConfig === 'channels') {
                const data = await axiosClient.get('/channels')
                const options = data.map((c: any) => ({
                    value: c.id.toString(),
                    label: c.name
                }))
                setDynamicOptions(options)
            }
        } catch (error) {
            // Silent fail for options loading
        } finally {
            setLoadingOptions(false)
        }
    }

    const handleFileUpload = async (files: FileList) => {
        setUploadingFiles(true)
        setUploadError(null)

        try {
            const uploadedUrls: string[] = []

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const formData = new FormData()
                formData.append('file', file)

                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

                const { getSession } = await import('next-auth/react')
                const session = await getSession()
                const token = session?.accessToken

                const response = await fetch(`${API_URL}/media/upload/file`, {
                    method: 'POST',
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: formData
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(errorData.detail || 'Upload failed')
                }

                const data = await response.json()
                uploadedUrls.push(data.url)
            }

            if (field.multiple) {
                onChange(field.name, uploadedUrls)
            } else {
                onChange(field.name, uploadedUrls[0])
            }
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : 'Upload failed')
        } finally {
            setUploadingFiles(false)
        }
    }

    const renderField = () => {
        switch (field.type) {
            case 'string':
                return (
                    <Input
                        type="text"
                        value={currentValue || ''}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        maxLength={field.maxLength}
                        pattern={field.pattern}
                        className="glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                )

            case 'text':
                return (
                    <Textarea
                        value={currentValue || ''}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        className="glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        rows={field.rows || 4}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                )

            case 'textarea':
                return (
                    <Textarea
                        value={currentValue || ''}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        className="glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        rows={field.rows || 6}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                )

            case 'json':
                return (
                    <div>
                        <Textarea
                            value={typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2)}
                            onChange={(e) => {
                                const val = e.target.value
                                try {
                                    const parsed = JSON.parse(val)
                                    onChange(field.name, parsed)
                                    setJsonError(null)
                                } catch (err) {
                                    onChange(field.name, val)
                                    setJsonError('Invalid JSON format')
                                }
                            }}
                            className={cn(
                                "w-full glass rounded-lg px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs",
                                jsonError ? 'border-red-500' : 'border-border/40'
                            )}
                            rows={6}
                            placeholder='{"key": "value"}'
                            required={field.required}
                        />
                        {jsonError && (
                            <p className="text-xs text-red-500 mt-1">{jsonError}</p>
                        )}
                    </div>
                )

            case 'key-value':
                return (
                    <KeyValueEditor
                        value={currentValue || {}}
                        onChange={(value) => onChange(field.name, value)}
                        placeholder={
                            typeof field.placeholder === 'object' ? field.placeholder : undefined
                        }
                    />
                )

            case 'select':
            case 'channel-select':
                const options = (field.type === 'channel-select' || (typeof field.options === 'string' && field.options.startsWith('dynamic:')))
                    ? dynamicOptions
                    : (field.options as any[]) || []

                const selectValue = currentValue ? String(currentValue) : undefined
                const placeholder = loadingOptions ? "Loading channels..." : (field.type === 'channel-select' ? "Select a channel..." : "Select an option...")

                return (
                    <div className="space-y-2">
                        <Select
                            value={selectValue}
                            onValueChange={(value) => onChange(field.name, value)}
                            disabled={loadingOptions}
                        >
                            <SelectTrigger className="w-full glass border-border/40">
                                <SelectValue placeholder={placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                                {options.length === 0 && !loadingOptions && (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        {field.type === 'channel-select' ? 'No channels connected' : 'No options available'}
                                    </div>
                                )}
                                {options.map((opt: any) => {
                                    const optValue = typeof opt === 'string' ? opt : opt.value
                                    const optLabel = typeof opt === 'string' ? opt : opt.label
                                    return (
                                        <SelectItem key={optValue} value={String(optValue)}>
                                            {optLabel}
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>

                        {field.type === 'channel-select' && options.length === 0 && !loadingOptions && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                                    No channels connected yet. Connect a channel first to send messages.
                                </p>
                                <a
                                    href="/channels"
                                    target="_blank"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                >
                                    Go to Channels <FiArrowRight className="w-3 h-3" />
                                </a>
                            </div>
                        )}
                    </div>
                )

            case 'boolean':
                return (
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={currentValue || false}
                            onChange={(e) => onChange(field.name, e.target.checked)}
                            className="rounded"
                        />
                        <span className="text-sm">{field.label}</span>
                    </label>
                )

            case 'number':
                return (
                    <Input
                        type="number"
                        value={currentValue ?? field.default ?? ''}
                        onChange={(e) => onChange(field.name, e.target.value ? Number(e.target.value) : null)}
                        placeholder={field.placeholder}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        required={field.required}
                        className="glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                )

            case 'file':
                return (
                    <div className="space-y-2">
                        <div className="relative">
                            <input
                                type="file"
                                id={`file-${field.name}`}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        handleFileUpload(e.target.files)
                                    }
                                }}
                                className="hidden"
                                accept={field.accept}
                                multiple={field.multiple}
                                disabled={uploadingFiles}
                            />
                            <label
                                htmlFor={`file-${field.name}`}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                                    uploadingFiles
                                        ? 'border-gray-400 bg-gray-50 cursor-not-allowed'
                                        : 'border-border/40 hover:border-primary/50 hover:bg-muted/20'
                                )}
                            >
                                {uploadingFiles ? (
                                    <div className="flex flex-col items-center">
                                        <Spinner className="w-8 h-8 mb-2" />
                                        <span className="text-sm text-muted-foreground">Uploading...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <FiUpload className="w-8 h-8 text-muted-foreground mb-2" />
                                        <span className="text-sm text-muted-foreground">
                                            Click to upload {field.multiple ? 'files' : 'a file'}
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-1">
                                            {field.accept || 'Files'}
                                        </span>
                                    </div>
                                )}
                            </label>
                        </div>

                        {currentValue && (
                            <div className="space-y-2">
                                {Array.isArray(currentValue) ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {currentValue.map((url, idx) => {
                                            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
                                            return (
                                                <div key={idx} className="relative group">
                                                    {isImage ? (
                                                        <div className="relative aspect-square rounded-lg overflow-hidden border border-border/40 bg-muted/20">
                                                            <img
                                                                src={url}
                                                                alt={`Upload ${idx + 1}`}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none'
                                                                    e.currentTarget.parentElement!.innerHTML = `<div class="flex items-center justify-center h-full text-xs text-muted-foreground p-2 break-all">${url}</div>`
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newUrls = currentValue.filter((_: any, i: number) => i !== idx)
                                                                    onChange(field.name, newUrls.length > 0 ? newUrls : null)
                                                                }}
                                                                className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                            >
                                                                <FiX className="w-3 h-3 text-white" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border/40">
                                                            <span className="text-xs flex-1 truncate">{url}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newUrls = currentValue.filter((_: any, i: number) => i !== idx)
                                                                    onChange(field.name, newUrls.length > 0 ? newUrls : null)
                                                                }}
                                                                className="p-1 hover:bg-red-500/10 rounded"
                                                            >
                                                                <FiX className="w-4 h-4 text-red-500" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    (() => {
                                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(currentValue)
                                        return isImage ? (
                                            <div className="relative group">
                                                <div className="relative w-full rounded-lg overflow-hidden border border-border/40 bg-muted/20">
                                                    <img
                                                        src={currentValue}
                                                        alt="Uploaded image"
                                                        className="w-full h-auto max-h-64 object-contain"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none'
                                                            e.currentTarget.parentElement!.innerHTML = `<div class="flex items-center justify-center p-4 text-xs text-muted-foreground break-all">${currentValue}</div>`
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => onChange(field.name, null)}
                                                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                    >
                                                        <FiX className="w-4 h-4 text-white" />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 truncate">{currentValue}</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border/40">
                                                <span className="text-xs flex-1 truncate">{currentValue}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => onChange(field.name, null)}
                                                    className="p-1 hover:bg-red-500/10 rounded"
                                                >
                                                    <FiX className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        )
                                    })()
                                )}
                            </div>
                        )}

                        {uploadError && (
                            <p className="text-xs text-red-500">{uploadError}</p>
                        )}
                    </div>
                )

            case 'multi-select':
                const multiOptions = typeof field.options === 'string' && field.options.startsWith('dynamic:')
                    ? dynamicOptions
                    : (field.options as any[]) || []

                const selectedValues = Array.isArray(currentValue) ? currentValue : []

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-full flex items-center justify-between glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-left">
                                <span className={selectedValues.length === 0 ? "text-muted-foreground" : ""}>
                                    {selectedValues.length === 0
                                        ? "Select options..."
                                        : `${selectedValues.length} selected`}
                                </span>
                                <FiChevronDown className="w-4 h-4 opacity-50" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                            {multiOptions.length === 0 && !loadingOptions && (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    No options available
                                </div>
                            )}
                            {multiOptions.map((opt: any) => {
                                const optValue = typeof opt === 'string' ? opt : opt.value
                                const optLabel = typeof opt === 'string' ? opt : opt.label
                                const isChecked = selectedValues.includes(String(optValue))

                                return (
                                    <DropdownMenuCheckboxItem
                                        key={optValue}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                            let newValues
                                            if (checked) {
                                                newValues = [...selectedValues, String(optValue)]
                                            } else {
                                                newValues = selectedValues.filter((v: string) => v !== String(optValue))
                                            }
                                            onChange(field.name, newValues)
                                        }}
                                    >
                                        {optLabel}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )

            default:
                return (
                    <div className="text-sm text-muted-foreground">
                        Unsupported field type: {field.type}
                    </div>
                )
        }
    }

    return (
        <div className={cn('mb-4', className)}>
            <Label htmlFor={fieldId} className="block text-sm font-medium mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {renderField()}
            {field.description && (
                <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
            )}
        </div>
    )
})
