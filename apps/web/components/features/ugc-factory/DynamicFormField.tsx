'use client'

import React from 'react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger
} from '@/components/ui/DropdownMenu'
import { Label } from '@/components/ui/Label'
import { Spinner } from '@/components/ui/Spinner'
import { FiChevronDown } from 'react-icons/fi'
import { cn } from '@/lib/utils'
import axiosClient from '@/lib/axios-client'
import { useFileUpload } from '@/lib/hooks/use-file-upload'

interface FormField {
    id: string
    type: 'text' | 'url' | 'textarea' | 'json' | 'select' | 'boolean' | 'switch' | 'number' | 'file' | 'files' | 'image' | 'key-value' | 'multi-select' | 'dynamic-form' | 'channel-select'
    label: string
    placeholder?: string
    description?: string
    required?: boolean
    defaultValue?: any
    options?: Array<{ value: string; label: string }>
    accept?: string
    multiple?: boolean
    min?: number
    max?: number
}

interface DynamicFormFieldProps {
    field: FormField
    value: any
    onChange: (value: any) => void
    className?: string
}

export function DynamicFormField({
    field,
    value,
    onChange,
    className,
}: DynamicFormFieldProps) {
    const fieldId = `field-${field.id}`

    // File upload hook
    const { uploadFile, uploadMultipleFiles, uploading: fileUploading } = useFileUpload({
        bucket: 'images',
        onSuccess: (fileUrl) => {
            // File uploaded successfully, update value with URL (single file)
            onChange(fileUrl)
        },
    })

    const handleSingleFileChange = async (files: File[]) => {
        if (files.length > 0) {
            try {
                const result = await uploadFile(files[0])
                // onSuccess callback will handle setting the value
            } catch (error) {
                console.error('File upload failed:', error)
                // You might want to show an error toast here
            }
        }
    }

    const handleMultipleFileChange = async (files: File[]) => {
        if (files.length > 0) {
            try {
                const results = await uploadMultipleFiles(files)
                // Set array of URLs as value
                const urls = results.map(r => r.fileUrl)
                onChange(urls)
            } catch (error) {
                console.error('Multiple file upload failed:', error)
                // You might want to show an error toast here
            }
        }
    }

    return (
        <div className={cn('space-y-2', className)}>
            <Label htmlFor={fieldId}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {field.description && (
                <p className="text-sm text-muted-foreground">{field.description}</p>
            )}

            {/* Text Input */}
            {field.type === 'text' && (
                <Input
                    id={fieldId}
                    value={value !== undefined ? value : field.defaultValue ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                />
            )}

            {/* Textarea */}
            {field.type === 'textarea' && (
                <Textarea
                    id={fieldId}
                    value={value !== undefined ? value : field.defaultValue ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={4}

                />
            )}

            {/* Select Dropdown */}
            {field.type === 'select' && (
                <Select
                    value={value || field.defaultValue}
                    onValueChange={onChange}
                >
                    <SelectTrigger id={fieldId}>
                        <SelectValue placeholder={field.placeholder || 'Select...'} />
                    </SelectTrigger>
                    <SelectContent>
                        {(Array.isArray(field.options) ? field.options.map((opt) =>
                            typeof opt === 'string' ? { value: opt, label: opt }
                                : typeof opt === 'object' ? opt
                                    : { value: String(opt), label: String(opt) }
                        ) : [])?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {/* Number Input */}
            {field.type === 'number' && (
                <Input
                    id={fieldId}
                    type="number"
                    value={value ?? field.defaultValue ?? ''}
                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                    placeholder={field.placeholder}
                    min={field.min}
                    max={field.max}
                    required={field.required}
                />
            )}

            {/* Image Upload */}
            {field.type === 'image' && (
                <div className="space-y-2">
                    <Input
                        id={fieldId}
                        type="file"
                        onChange={(e) => {
                            const files = e.target.files
                            if (files && files.length > 0) {
                                if (field.multiple) {
                                    handleMultipleFileChange(Array.from(files))
                                } else {
                                    handleSingleFileChange(Array.from(files))
                                }
                            }
                        }}
                        accept={field.accept || 'image/*'}
                        multiple={field.multiple}
                        required={field.required && !value}
                        disabled={fileUploading}
                    />
                    {fileUploading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Spinner className="w-4 h-4" />
                            Uploading image...
                        </div>
                    )}
                    {value && ((typeof value === 'string') || (Array.isArray(value) && value.length > 0)) && !fileUploading && (
                        <div className="text-xs text-green-600">
                            {field.multiple ? `${Array.isArray(value) ? value.length : 0} images` : 'Image'} uploaded successfully
                        </div>
                    )}
                </div>
            )}

            {/* Switch/Toggle */}
            {field.type === 'switch' && (
                <div className="flex items-center space-x-2">
                    <Switch
                        id={fieldId}
                        checked={value ?? field.defaultValue ?? false}
                        onCheckedChange={onChange}
                    />
                    <Label
                        htmlFor={fieldId}
                        className="text-sm font-normal cursor-pointer"
                    >
                        {field.placeholder || 'Enable'}
                    </Label>
                </div>
            )}



            {/* File Upload (Single) */}
            {field.type === 'file' && (
                <div className="space-y-2">
                    <Input
                        id={fieldId}
                        type="file"
                        onChange={(e) => {
                            const files = e.target.files
                            if (files && files.length > 0) {
                                handleSingleFileChange(Array.from(files))
                            }
                        }}
                        accept={field.accept}
                        multiple={false}
                        required={field.required && !value}
                        disabled={fileUploading}
                    />
                    {fileUploading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Spinner className="w-4 h-4" />
                            Uploading file...
                        </div>
                    )}
                    {value && typeof value === 'string' && !fileUploading && (
                        <div className="text-xs text-green-600">
                            File uploaded successfully
                        </div>
                    )}
                </div>
            )}

            {/* Files Upload (Multiple) */}
            {field.type === 'files' && (
                <div className="space-y-2">
                    <Input
                        id={fieldId}
                        type="file"
                        onChange={(e) => {
                            const files = e.target.files
                            if (files && files.length > 0) {
                                handleMultipleFileChange(Array.from(files))
                            }
                        }}
                        accept={field.accept}
                        multiple={true}
                        required={field.required && (!value || (Array.isArray(value) && value.length === 0))}
                        disabled={fileUploading}
                    />
                    {fileUploading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Spinner className="w-4 h-4" />
                            Uploading files...
                        </div>
                    )}
                    {value && Array.isArray(value) && value.length > 0 && !fileUploading && (
                        <div className="text-xs text-green-600">
                            {value.length} files uploaded successfully
                        </div>
                    )}
                </div>
            )}

            {/* Multi-Select - Using Shadcn DropdownMenu */}
            {field.type === 'multi-select' && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            id={fieldId}
                            className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <span className={Array.isArray(value) && value.length > 0 ? "" : "text-muted-foreground"}>
                                {Array.isArray(value) && value.length > 0
                                    ? `${value.length} selected`
                                    : (field.placeholder || "Select options...")}
                            </span>
                            <FiChevronDown className="w-4 h-4 opacity-50" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full min-w-[200px] max-h-60 overflow-y-auto">
                        {field.options?.length === 0 && (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No options available
                            </div>
                        )}
                        {/* Normalize options for multi-select */}
                        {(Array.isArray(field.options) ? field.options.map((opt) =>
                            typeof opt === 'string' ? { value: opt, label: opt }
                                : typeof opt === 'object' ? opt
                                    : { value: String(opt), label: String(opt) }
                        ) : [])?.map((option) => {
                            const isChecked = Array.isArray(value) && value.includes(option.value)

                            return (
                                <DropdownMenuCheckboxItem
                                    key={option.value}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                        const currentValues = Array.isArray(value) ? [...value] : []
                                        if (checked) {
                                            onChange([...currentValues, option.value])
                                        } else {
                                            onChange(currentValues.filter((v: string) => v !== option.value))
                                        }
                                    }}
                                >
                                    {option.label}
                                </DropdownMenuCheckboxItem>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {/* Channel Select - Load from API */}
            {field.type === 'channel-select' && (
                <ChannelSelector
                    value={value}
                    onChange={onChange}
                    multiple={field.multiple}
                    required={field.required}
                />
            )}
        </div>
    )
}

// Channel Selector Component - loads channels from API
function ChannelSelector({
    value,
    onChange,
    multiple = false,
    required = false
}: {
    value: any
    onChange: (value: any) => void
    multiple?: boolean
    required?: boolean
}) {
    const [channels, setChannels] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        loadChannels()
    }, [])

    const loadChannels = async () => {
        try {
            setLoading(true)
            console.log('[ChannelSelector] Loading channels...')
            // Use axiosClient with auth - should include JWT token
            const data = await axiosClient.get('/channels')
            console.log('[ChannelSelector] Channels loaded:', data)
            console.log('[ChannelSelector] Data type:', typeof data, Array.isArray(data) ? 'array' : 'not array')

            // Ensure we have the expected channel structure
            const channelList = Array.isArray(data) ? data : []
            console.log('[ChannelSelector] Channel count:', channelList.length)

            setChannels(channelList)
        } catch (error: any) {
            console.error('[ChannelSelector] Failed to load channels:', error)
            console.error('[ChannelSelector] Error details:', error?.response?.status, error?.response?.data)
            setChannels([])

            // If 401 or auth related error, user needs to login
            if (error?.response?.status === 401) {
                console.warn('[ChannelSelector] Auth required for loading channels')
            }
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading channels...</div>
    }

    if (multiple) {
        return (
            <div className="space-y-2 border rounded-lg p-3">
                {channels.map((channel) => {
                    const isChecked = Array.isArray(value) && value.includes(channel.id)

                    return (
                        <div key={channel.id} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id={`channel-${channel.id}`}
                                checked={isChecked}
                                onChange={(e) => {
                                    const currentValues = Array.isArray(value) ? [...value] : []
                                    if (e.target.checked) {
                                        onChange([...currentValues, channel.id])
                                    } else {
                                        onChange(currentValues.filter((v) => v !== channel.id))
                                    }
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <label
                                htmlFor={`channel-${channel.id}`}
                                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                            >
                                {channel.name}
                            </label>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
                <SelectValue placeholder="Select a channel..." />
            </SelectTrigger>
            <SelectContent>
                {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                        <div className="flex items-center gap-2">
                            {channel.name}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
