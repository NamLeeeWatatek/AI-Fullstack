'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@wataomi/ui'
import { FiArrowLeft, FiCheck } from 'react-icons/fi'
import Link from 'next/link'
import { WORKFLOW_TEMPLATES, TEMPLATE_CATEGORIES } from '@/lib/workflowTemplates'
import { AISuggestWorkflow } from '@/components/ai-suggest-workflow'

export default function NewWorkflowPage() {
    const router = useRouter()
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
    const [workflowName, setWorkflowName] = useState('')

    const handleCreate = () => {
        if (!workflowName.trim()) {
            alert('Please enter a workflow name')
            return
        }

        // Redirect to editor with template ID
        const params = new URLSearchParams({
            name: workflowName,
            ...(selectedTemplate && { template: selectedTemplate })
        })
        router.push(`/flows/new/edit?${params.toString()}`)
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link href="/flows">
                    <Button variant="ghost" size="icon" className="mb-4">
                        <FiArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold mb-2">Create New Workflow</h1>
                <p className="text-muted-foreground">
                    Choose a template to get started or start from scratch
                </p>
            </div>

            {/* Workflow Name */}
            <div className="mb-8">
                <label className="block text-sm font-medium mb-2">Workflow Name</label>
                <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="w-full glass rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 text-lg"
                    placeholder="Enter workflow name..."
                    autoFocus
                />
            </div>

            {/* AI Suggest Section */}
            <div className="mb-8">
                <AISuggestWorkflow
                    onSuggest={(workflow) => {
                        // Set workflow name from AI suggestion
                        if (workflow.suggested_name && !workflowName) {
                            setWorkflowName(workflow.suggested_name)
                        }
                        // Store AI-generated workflow in localStorage for editor
                        localStorage.setItem('ai_suggested_workflow', JSON.stringify(workflow))
                        // Redirect to editor
                        const params = new URLSearchParams({
                            name: workflowName || workflow.suggested_name,
                            ai_generated: 'true'
                        })
                        router.push(`/flows/new/edit?${params.toString()}`)
                    }}
                />
            </div>

            {/* OR Divider */}
            <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/40"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 glass text-muted-foreground">OR</span>
                </div>
            </div>

            {/* Templates */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Choose a Template</h3>

                {/* Blank Template */}
                <div
                    onClick={() => setSelectedTemplate(null)}
                    className={`glass rounded-xl p-6 cursor-pointer transition-all mb-4 ${selectedTemplate === null
                        ? 'border-2 border-primary bg-primary/5'
                        : 'border border-border/40 hover:border-primary/50'
                        }`}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="text-4xl">📄</div>
                            <div>
                                <h4 className="font-semibold text-lg mb-1">Blank Workflow</h4>
                                <p className="text-sm text-muted-foreground">
                                    Start from scratch with an empty canvas
                                </p>
                            </div>
                        </div>
                        {selectedTemplate === null && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <FiCheck className="w-4 h-4 text-white" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Template Categories */}
                {TEMPLATE_CATEGORIES.map((category) => {
                    const templates = WORKFLOW_TEMPLATES.filter((t) => t.category === category)
                    if (templates.length === 0) return null

                    return (
                        <div key={category} className="mb-6">
                            <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                                {category}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        onClick={() => setSelectedTemplate(template.id)}
                                        className={`glass rounded-xl p-6 cursor-pointer transition-all ${selectedTemplate === template.id
                                            ? 'border-2 border-primary bg-primary/5'
                                            : 'border border-border/40 hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h4 className="font-semibold">{template.name}</h4>
                                            {selectedTemplate === template.id && (
                                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                                    <FiCheck className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {template.description}
                                        </p>
                                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{template.nodes.length} nodes</span>
                                            <span>•</span>
                                            <span>{template.edges.length} connections</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-border/40">
                <Link href="/flows">
                    <Button variant="outline">Cancel</Button>
                </Link>
                <Button onClick={handleCreate} disabled={!workflowName.trim()}>
                    Create Workflow
                </Button>
            </div>
        </div>
    )
}
