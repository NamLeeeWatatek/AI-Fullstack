'use client'

import { useState, useEffect } from 'react'
import { Button } from '@wataomi/ui'
import { fetchAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiRefreshCw,
    FiMessageSquare,
    FiActivity,
    FiX
} from 'react-icons/fi'

interface Bot {
    id: number
    name: string
    description?: string
    is_active: boolean
    workspace_id: number
    created_at: string
    updated_at: string
}

export default function BotsPage() {
    const [bots, setBots] = useState<Bot[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingBot, setEditingBot] = useState<Bot | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        flow_id: null as number | null
    })
    const [flows, setFlows] = useState<any[]>([])

    useEffect(() => {
        loadBots()
        loadFlows()
    }, [])

    const loadFlows = async () => {
        try {
            const data = await fetchAPI('/flows/')
            setFlows(data)
        } catch (e: any) {
            console.error('Failed to load flows:', e)
        }
    }

    const loadBots = async () => {
        try {
            setLoading(true)
            const data = await fetchAPI('/bots/')
            setBots(data.bots || [])
        } catch (e: any) {
            toast.error('Failed to load bots')
        } finally {
            setLoading(false)
        }
    }

    const openModal = (bot?: Bot) => {
        if (bot) {
            setEditingBot(bot)
            setFormData({
                name: bot.name,
                description: bot.description || '',
                flow_id: (bot as any).flow_id || null
            })
        } else {
            setEditingBot(null)
            setFormData({ name: '', description: '', flow_id: null })
        }
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingBot(null)
        setFormData({ name: '', description: '', flow_id: null })
    }

    const saveBot = async () => {
        if (!formData.name.trim()) {
            toast.error('Bot name is required')
            return
        }

        try {
            if (editingBot) {
                await fetchAPI(`/bots/${editingBot.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                })
                toast.success('Bot updated')
            } else {
                await fetchAPI('/bots/', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                })
                toast.success('Bot created')
            }
            closeModal()
            loadBots()
        } catch (e: any) {
            toast.error('Failed to save bot')
        }
    }

    const deleteBot = async (id: number) => {
        if (!confirm('Are you sure you want to delete this bot?')) return

        try {
            await fetchAPI(`/bots/${id}`, { method: 'DELETE' })
            toast.success('Bot deleted')
            loadBots()
        } catch (e: any) {
            toast.error('Failed to delete bot')
        }
    }

    const toggleStatus = async (bot: Bot) => {
        try {
            await fetchAPI(`/bots/${bot.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    is_active: !bot.is_active
                })
            })
            toast.success('Bot status updated')
            loadBots()
        } catch (e: any) {
            toast.error('Failed to update status')
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Bots</h1>
                    <p className="text-muted-foreground">
                        Manage your AI bots and automation
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={loadBots}>
                        <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => openModal()}>
                        <FiPlus className="w-4 h-4 mr-2" />
                        Create Bot
                    </Button>
                </div>
            </div>

            {loading && bots.length === 0 ? (
                <div className="text-center py-12">
                    <FiRefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading bots...</p>
                </div>
            ) : bots.length === 0 ? (
                <div className="text-center py-12 glass rounded-xl border border-border/40">
                    <FiMessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No bots yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first bot to get started</p>
                    <Button onClick={() => openModal()}>
                        <FiPlus className="w-4 h-4 mr-2" />
                        Create Bot
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bots.map((bot) => (
                        <div key={bot.id} className="glass rounded-xl p-6 border border-border/40 hover:border-primary/20 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-wata flex items-center justify-center">
                                        <FiMessageSquare className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{bot.name}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${bot.is_active
                                                ? 'bg-green-500/10 text-green-500'
                                                : 'bg-gray-500/10 text-gray-500'
                                            }`}>
                                            {bot.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                                {bot.description || 'No description'}
                            </p>

                            <div className="flex items-center gap-2 pt-4 border-t border-border/40">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => toggleStatus(bot)}
                                >
                                    <FiActivity className="w-4 h-4 mr-2" />
                                    {bot.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openModal(bot)}
                                >
                                    <FiEdit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteBot(bot.id)}
                                    className="text-red-500 hover:bg-red-500/10"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold">
                                {editingBot ? 'Edit Bot' : 'Create Bot'}
                            </h3>
                            <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Bot Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="My Awesome Bot"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    rows={3}
                                    placeholder="Describe what this bot does..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Flow</label>
                                <select
                                    value={formData.flow_id || ''}
                                    onChange={(e) => setFormData({ ...formData, flow_id: e.target.value ? Number(e.target.value) : null })}
                                    className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">No flow (manual responses only)</option>
                                    {flows.map((flow) => (
                                        <option key={flow.id} value={flow.id}>
                                            {flow.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Select which flow this bot should execute when it receives messages
                                </p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={closeModal}>
                                    Cancel
                                </Button>
                                <Button className="flex-1" onClick={saveBot}>
                                    {editingBot ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
