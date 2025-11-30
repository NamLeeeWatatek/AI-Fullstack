'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialogConfirm } from '@/components/ui/alert-dialog-confirm'
import { fetchAPI } from '@/lib/api'
import toast from '@/lib/toast'
import {
    FiPlus,
    FiUpload,
    FiTrash2,
    FiEdit2,
    FiDatabase,
    FiFileText,
    FiSearch,
    FiRefreshCw,
    FiFile,
    FiGlobe,
    FiMessageSquare,
    FiShoppingBag,
    FiCheckCircle,
    FiAlertCircle,
    FiClock
} from 'react-icons/fi'

interface KnowledgeDocument {
    id: string
    title: string
    content: string
    source: string
    metadata?: Record<string, any>
    created_at: string
    updated_at: string
    embedding_status: 'pending' | 'processing' | 'completed' | 'failed'
}

export default function KnowledgeBasePage() {
    const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [importDialogOpen, setImportDialogOpen] = useState(false)
    const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null)
    const [deleteDocId, setDeleteDocId] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        source: 'manual'
    })

    const [importData, setImportData] = useState({
        type: 'file',
        url: '',
        faqPairs: [{ question: '', answer: '' }],
        products: '',
        policies: ''
    })

    useEffect(() => {
        loadDocuments()
    }, [])

    const loadDocuments = async () => {
        try {
            setLoading(true)
            const data = await fetchAPI('/knowledge-base/documents')
            setDocuments(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Failed to load documents:', error)
            toast.error('Failed to load knowledge base')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            toast.error('Title and content are required')
            return
        }

        try {
            if (editingDoc) {
                await fetchAPI(`/knowledge-base/documents/${editingDoc.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(formData)
                })
                toast.success('Document updated')
            } else {
                await fetchAPI('/knowledge-base/documents', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                })
                toast.success('Document created and embedding started')
            }

            setDialogOpen(false)
            setEditingDoc(null)
            setFormData({ title: '', content: '', source: 'manual' })
            loadDocuments()
        } catch (error) {
            toast.error('Failed to save document')
        }
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        try {
            setUploading(true)
            const session = await import('next-auth/react').then(m => m.getSession())
            const token = (await session)?.accessToken

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/knowledge-base/documents/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) throw new Error('Upload failed')

            const data = await response.json()
            toast.success(`File uploaded: ${data.chunks} chunks created`)
            setImportDialogOpen(false)
            loadDocuments()
        } catch (error) {
            toast.error('Failed to upload file')
        } finally {
            setUploading(false)
        }
    }

    const handleFAQImport = async () => {
        const validPairs = importData.faqPairs.filter(p => p.question.trim() && p.answer.trim())

        if (validPairs.length === 0) {
            toast.error('Please add at least one FAQ pair')
            return
        }

        try {
            setUploading(true)
            const documents = validPairs.map(pair => ({
                content: `Q: ${pair.question}\nA: ${pair.answer}`,
                metadata: { type: 'faq', question: pair.question }
            }))

            await fetchAPI('/knowledge-base/documents/batch', {
                method: 'POST',
                body: JSON.stringify({ documents })
            })

            toast.success(`${validPairs.length} FAQ pairs imported`)
            setImportDialogOpen(false)
            setImportData({ ...importData, faqPairs: [{ question: '', answer: '' }] })
            loadDocuments()
        } catch (error) {
            toast.error('Failed to import FAQs')
        } finally {
            setUploading(false)
        }
    }

    const handleEdit = (doc: KnowledgeDocument) => {
        setEditingDoc(doc)
        setFormData({
            title: doc.title,
            content: doc.content,
            source: doc.source
        })
        setDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!deleteDocId) return

        try {
            await fetchAPI(`/knowledge-base/documents/${deleteDocId}`, {
                method: 'DELETE'
            })
            toast.success('Document deleted')
            setDocuments(prev => prev.filter(d => d.id !== deleteDocId))
        } catch (error) {
            toast.error('Failed to delete document')
        } finally {
            setDeleteDocId(null)
        }
    }

    const filteredDocs = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const stats = {
        total: documents.length,
        embedded: documents.filter(d => d.embedding_status === 'completed').length,
        processing: documents.filter(d => d.embedding_status === 'processing').length,
        failed: documents.filter(d => d.embedding_status === 'failed').length
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge variant="success" className="gap-1"><FiCheckCircle className="w-3 h-3" /> Embedded</Badge>
            case 'processing':
                return <Badge variant="default" className="gap-1"><FiClock className="w-3 h-3" /> Processing</Badge>
            case 'failed':
                return <Badge variant="destructive" className="gap-1"><FiAlertCircle className="w-3 h-3" /> Failed</Badge>
            default:
                return <Badge variant="default">Pending</Badge>
        }
    }

    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'file': return <FiFile className="w-4 h-4" />
            case 'website': return <FiGlobe className="w-4 h-4" />
            case 'faq': return <FiMessageSquare className="w-4 h-4" />
            case 'product': return <FiShoppingBag className="w-4 h-4" />
            default: return <FiFileText className="w-4 h-4" />
        }
    }

    return (
        <div className="h-full">
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
                    <p className="text-muted-foreground">
                        Train your AI with documents, FAQs, products, and policies
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadDocuments}>
                        <FiRefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                        <FiUpload className="w-4 h-4 mr-2" />
                        Import Data
                    </Button>
                    <Button onClick={() => {
                        setEditingDoc(null)
                        setFormData({ title: '', content: '', source: 'manual' })
                        setDialogOpen(true)
                    }}>
                        <FiPlus className="w-4 h-4 mr-2" />
                        Add Document
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="glass p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <FiDatabase className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Documents</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                    </div>
                </Card>
                <Card className="glass p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                            <FiCheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Embedded</p>
                            <p className="text-2xl font-bold">{stats.embedded}</p>
                        </div>
                    </div>
                </Card>
                <Card className="glass p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                            <FiClock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Processing</p>
                            <p className="text-2xl font-bold">{stats.processing}</p>
                        </div>
                    </div>
                </Card>
                <Card className="glass p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                            <FiAlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Failed</p>
                            <p className="text-2xl font-bold">{stats.failed}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Documents List */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner className="size-8 text-primary" />
                </div>
            ) : filteredDocs.length === 0 ? (
                <Card className="text-center py-20">
                    <FiFileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchQuery ? 'Try adjusting your search' : 'Import data to train your AI assistant'}
                    </p>
                    {!searchQuery && (
                        <div className="flex gap-2 justify-center">
                            <Button onClick={() => setImportDialogOpen(true)}>
                                <FiUpload className="w-4 h-4 mr-2" />
                                Import Data
                            </Button>
                            <Button variant="outline" onClick={() => setDialogOpen(true)}>
                                <FiPlus className="w-4 h-4 mr-2" />
                                Add Manually
                            </Button>
                        </div>
                    )}
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredDocs.map((doc) => (
                        <Card key={doc.id} className="p-6 hover:shadow-lg transition-all hover:border-primary/20">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            {getSourceIcon(doc.source)}
                                        </div>
                                        <h3 className="text-lg font-semibold">{doc.title}</h3>
                                        {getStatusBadge(doc.embedding_status)}
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {doc.source}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3 ml-11">
                                        {doc.content}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground ml-11">
                                        <span>Created: {new Date(doc.created_at).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>Updated: {new Date(doc.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(doc)}
                                    >
                                        <FiEdit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeleteDocId(doc.id)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Import Dialog */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Import Knowledge Base Data</DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="file" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="file">
                                <FiFile className="w-4 h-4 mr-2" />
                                Files
                            </TabsTrigger>
                            <TabsTrigger value="website">
                                <FiGlobe className="w-4 h-4 mr-2" />
                                Website
                            </TabsTrigger>
                            <TabsTrigger value="faq">
                                <FiMessageSquare className="w-4 h-4 mr-2" />
                                FAQ
                            </TabsTrigger>
                            <TabsTrigger value="products">
                                <FiShoppingBag className="w-4 h-4 mr-2" />
                                Products
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="file" className="space-y-4">
                            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                                <FiUpload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">Upload Documents</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Support: PDF, Word, Excel, Text files
                                </p>
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                                <Button
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? <Spinner className="size-4 mr-2" /> : <FiUpload className="w-4 h-4 mr-2" />}
                                    Choose File
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="website" className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Website URL</label>
                                <Input
                                    placeholder="https://example.com"
                                    value={importData.url}
                                    onChange={(e) => setImportData({ ...importData, url: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    We'll crawl and extract content from this website
                                </p>
                            </div>
                            <Button disabled className="w-full">
                                <FiGlobe className="w-4 h-4 mr-2" />
                                Coming Soon
                            </Button>
                        </TabsContent>

                        <TabsContent value="faq" className="space-y-4">
                            <div className="space-y-3">
                                {importData.faqPairs.map((pair, index) => (
                                    <div key={index} className="p-4 border border-border rounded-lg space-y-2">
                                        <Input
                                            placeholder="Question"
                                            value={pair.question}
                                            onChange={(e) => {
                                                const newPairs = [...importData.faqPairs]
                                                newPairs[index].question = e.target.value
                                                setImportData({ ...importData, faqPairs: newPairs })
                                            }}
                                        />
                                        <Textarea
                                            placeholder="Answer"
                                            value={pair.answer}
                                            onChange={(e) => {
                                                const newPairs = [...importData.faqPairs]
                                                newPairs[index].answer = e.target.value
                                                setImportData({ ...importData, faqPairs: newPairs })
                                            }}
                                            rows={3}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setImportData({
                                        ...importData,
                                        faqPairs: [...importData.faqPairs, { question: '', answer: '' }]
                                    })}
                                    className="flex-1"
                                >
                                    <FiPlus className="w-4 h-4 mr-2" />
                                    Add More
                                </Button>
                                <Button onClick={handleFAQImport} disabled={uploading} className="flex-1">
                                    {uploading ? <Spinner className="size-4 mr-2" /> : <FiMessageSquare className="w-4 h-4 mr-2" />}
                                    Import FAQs
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="products" className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Product List (CSV or JSON)</label>
                                <Textarea
                                    placeholder="Paste your product data here..."
                                    value={importData.products}
                                    onChange={(e) => setImportData({ ...importData, products: e.target.value })}
                                    rows={10}
                                />
                            </div>
                            <Button disabled className="w-full">
                                <FiShoppingBag className="w-4 h-4 mr-2" />
                                Coming Soon
                            </Button>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingDoc ? 'Edit Document' : 'Add Document'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Title</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Document title..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Content</label>
                            <Textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Document content..."
                                rows={10}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Source</label>
                            <Input
                                value={formData.source}
                                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                placeholder="e.g., manual, upload, api"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingDoc ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialogConfirm
                open={deleteDocId !== null}
                onOpenChange={(open) => !open && setDeleteDocId(null)}
                title="Delete Document"
                description="Are you sure you want to delete this document? This will also remove its embeddings from the vector database."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                variant="destructive"
            />
        </div>
    )
}
