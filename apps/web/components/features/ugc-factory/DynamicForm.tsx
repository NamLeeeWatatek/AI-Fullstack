'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DynamicFormField } from '@/components/ui/DynamicFormField'

// Using the shared NodeProperty interface that matches backend
interface NodeProperty {
    name: string
    label: string
    type: 'string' | 'text' | 'number' | 'boolean' | 'select' | 'multi-select' | 'json' | 'file' | 'files' | 'key-value' | 'dynamic-form' | 'channel-select' | 'textarea'
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

interface DynamicFormProps {
    properties: NodeProperty[]
    formData: Record<string, any>
    onFormDataChange: (data: Record<string, any>) => void
    onSubmit: () => void
}

export function DynamicForm({
    properties,
    formData,
    onFormDataChange,
    onSubmit
}: DynamicFormProps) {
    console.log('DynamicForm render - properties:', properties)
    console.log('DynamicForm render - properties length:', properties.length)

    const handleFieldChange = (fieldId: string, value: any) => {
        console.log('Field change:', fieldId, value)
        onFormDataChange({
            ...formData,
            [fieldId]: value
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Form submit, calling onSubmit')
        onSubmit()
    }

    if (properties.length === 0) {
        return (
            <Card className="p-6">
                <div className="text-center text-muted-foreground">
                    <div className="text-4xl mb-2">ðŸ“</div>
                    <p className="text-sm font-medium">No Form Fields</p>
                    <p className="text-xs mt-1">
                        This workflow doesn't have any configurable inputs.
                    </p>
                </div>
            </Card>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {properties.map((field) => {
                console.log('Rendering field:', field.name, field.type, field.label)
                return (
                    <DynamicFormField
                        key={field.name}
                        field={field}
                        value={formData[field.name]}
                        onChange={(value) => handleFieldChange(field.name, value)}
                    />
                )
            })}

            <Button type="submit" className="w-full">
                Execute Flow
            </Button>
        </form>
    )
}
