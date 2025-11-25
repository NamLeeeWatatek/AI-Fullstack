'use client'

import { useState, useEffect } from 'react'
import { Button } from '@wataomi/ui'
import { fetchAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import {
    FiArchive,
    FiRefreshCw,
    FiTrash2,
    FiFilter,
    FiLoader
} from 'react-icons/fi'

interface Archive {
    id: number
    entity_type: string
    entity_id: number
    entity_data: any
    archived_by: string
    archived_at: string
    archive_reason: string
    is_restored: boolean
}

export default function ArchivesPage() {
    const [archives, setArchives] = useState<Archive[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('all')
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        loadArchives()
        loadStats()
    }, [filter])

    const loadArchives = async () => {
        try {
            setLoading(true)
            const params = filter !== 'all' ? `?entity_type=${filter}` : ''
            const data = await fetchAPI(`/archives/${params}`)
            setArchives(data)
        } catch (e: any) {
            toast.error('Failed to load archives')
        } finally {
            setLoading(false)
        }
    }

    const loadStats = async () => {
        try {
            const data = await fetchAPI('/archives/stats/summary')
            setStats(data)
        } catch (e: any) {
            console.error('Failed to load stats:', e)
        }
    }

    const handleRestore = async (archive: Archive) => {
        const restorePromise = fetchAPI(`/archives/${archive.id}/restore`, {
            method: 'POST',
            body: JSON.stringify({})
        }).then(() => {
            loadArchives()
            loadStats()
        })

        toast.promise(restorePromise, {
            loading: 'Restoring...',
            success: `${archive.entity_type} restored successfully!`,
            error: (err) => `Failed to restore: ${err.message}`
        })
    }

    const handleDelete = async (archive: Archive) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <div>
                    <p className="font-semibold">Permanently delete this archive?</p>
                    <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600"
                        onClick={async () => {
                            toast.dismiss(t.id)
                            const deletePromise = fetchAPI(`/archives/${archive.id}`, {
                                method: 'DELETE'
                            }).then(() => {
                                loadArchives()
                                loadStats()
                            })

                            toast.promise(deletePromise, {
                                loading: 'Deleting...',
                                success: 'Archive deleted permanently',
                                error: (err) => `Failed to delete: ${err.message}`
                            })
                        }}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        ), {
            duration: Infinity,
        })
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getEntityIcon = (type: string) => {
        switch (type) {
            case 'flow': return '🔄'
            case 'bot': return '🤖'
            case 'user': return '👤'
            case 'channel': return '📢'
            default: return '📦'
        }
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Archives</h1>
                    <p className="text-muted-foreground">
                        Manage archived items across your workspace
                    </p>
                </div>
                <Button variant="outline" onClick={loadArchives}>
                    <FiRefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="glass rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FiArchive className="w-8 h-8 text-wata-purple" />
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats.total}</h3>
                        <p className="text-sm text-muted-foreground">Total Archived</p>
                    </div>
                    {Object.entries(stats.by_type || {}).map(([type, count]: [string, any]) => (
                        <div key={type} className="glass rounded-xl p-6">
                            <div className="text-3xl mb-2">{getEntityIcon(type)}</div>
                            <h3 className="text-2xl font-bold mb-1">{count}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{type}s</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="mb-6">
                <div className="glass rounded-lg p-1 flex items-center gap-1 w-fit">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            filter === 'all' 
                                ? 'bg-primary text-white' 
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        All ({stats?.total || 0})
                    </button>
                    {stats?.by_type && Object.keys(stats.by_type).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                                filter === type 
                                    ? 'bg-primary text-white' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {type}s ({stats.by_type[type]})
                        </button>
                    ))}
                </div>
            </div>

            {/* Archives List */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <FiLoader className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : archives.length === 0 ? (
                <div className="text-center py-20 glass rounded-xl">
                    <FiArchive className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-semibold mb-2">No archived items</h3>
                    <p className="text-muted-foreground">
                        {filter !== 'all' 
                            ? `No archived ${filter}s found`
                            : 'Archived items will appear here'
                        }
                    </p>
                </div>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Archived</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Reason</th>
                                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {archives.map((archive) => (
                                <tr key={archive.id} className="border-t border-border/40 hover:bg-muted/20">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{getEntityIcon(archive.entity_type)}</span>
                                            <span className="capitalize font-medium">{archive.entity_type}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium">{archive.entity_data.name || `${archive.entity_type} #${archive.entity_id}`}</div>
                                        {archive.entity_data.description && (
                                            <div className="text-sm text-muted-foreground truncate max-w-md">
                                                {archive.entity_data.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                        {formatDate(archive.archived_at)}
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                        {archive.archive_reason || '-'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRestore(archive)}
                                            >
                                                <FiRefreshCw className="w-4 h-4 mr-2" />
                                                Restore
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:bg-red-500/10"
                                                onClick={() => handleDelete(archive)}
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
