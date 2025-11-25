'use client'

import { useState, useEffect } from 'react'
import { Button } from '@wataomi/ui'
import { fetchAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import {
    FiFacebook,
    FiInstagram,
    FiMessageCircle,
    FiMail,
    FiTrash2,
    FiExternalLink,
    FiCheckCircle,
    FiRefreshCw,
    FiSettings,
    FiX
} from 'react-icons/fi'
import { FaWhatsapp, FaTelegram, FaFacebookMessenger } from 'react-icons/fa'

interface Channel {
    id: number
    name: string
    type: string
    icon?: string
    status: string
    connected_at: string
}

interface IntegrationConfig {
    provider: string
    client_id: string
    client_secret: string
    scopes?: string
    is_active: boolean
}

export default function ChannelsPage() {
    const [channels, setChannels] = useState<Channel[]>([])
    const [configs, setConfigs] = useState<Record<string, IntegrationConfig>>({})
    const [loading, setLoading] = useState(true)
    const [connecting, setConnecting] = useState<string | null>(null)
    const [configuring, setConfiguring] = useState<string | null>(null)

    // Config Form State
    const [configForm, setConfigForm] = useState({
        client_id: '',
        client_secret: '',
        scopes: ''
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [channelsData, configsData] = await Promise.all([
                fetchAPI('/channels/'),
                fetchAPI('/integrations/')
            ])
            setChannels(channelsData)

            // Map configs by provider
            const configMap: Record<string, IntegrationConfig> = {}
            configsData.forEach((c: IntegrationConfig) => {
                configMap[c.provider] = c
            })
            setConfigs(configMap)

        } catch (e: any) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = async (provider: string) => {
        // Check if configured
        if (!configs[provider]?.client_id) {
            toast.error(`Please configure ${provider} settings first`)
            openConfig(provider)
            return
        }

        try {
            setConnecting(provider)

            // Get OAuth URL
            const { url } = await fetchAPI(`/oauth/login/${provider}`)

            // Open popup
            const width = 600
            const height = 700
            const left = window.screen.width / 2 - width / 2
            const top = window.screen.height / 2 - height / 2

            const popup = window.open(
                url,
                `Connect ${provider}`,
                `width=${width},height=${height},left=${left},top=${top}`
            )

            // Listen for message from popup
            const messageHandler = (event: MessageEvent) => {
                if (event.data?.status === 'success') {
                    toast.success(`Connected to ${event.data.channel}`)
                    loadData()
                    popup?.close()
                    window.removeEventListener('message', messageHandler)
                } else if (event.data?.status === 'error') {
                    toast.error(`Connection failed: ${event.data.message}`)
                    popup?.close()
                    window.removeEventListener('message', messageHandler)
                }
            }

            window.addEventListener('message', messageHandler)

            // Check if popup closed manually
            const checkClosed = setInterval(() => {
                if (popup?.closed) {
                    clearInterval(checkClosed)
                    setConnecting(null)
                    window.removeEventListener('message', messageHandler)
                }
            }, 1000)

        } catch (e: any) {
            toast.error(`Failed to start connection: ${e.message}`)
            setConnecting(null)
        }
    }

    const handleDisconnect = async (id: number) => {
        if (!confirm('Are you sure you want to disconnect this channel?')) return

        try {
            await fetchAPI(`/channels/${id}`, { method: 'DELETE' })
            toast.success('Channel disconnected')
            loadData()
        } catch (e: any) {
            toast.error('Failed to disconnect')
        }
    }

    const openConfig = (provider: string) => {
        const existing = configs[provider]
        setConfigForm({
            client_id: existing?.client_id || '',
            client_secret: existing?.client_secret || '',
            scopes: existing?.scopes || ''
        })
        setConfiguring(provider)
    }

    const saveConfig = async () => {
        if (!configuring) return

        try {
            await fetchAPI('/integrations/', {
                method: 'POST',
                body: JSON.stringify({
                    provider: configuring,
                    ...configForm
                })
            })
            toast.success('Configuration saved')
            setConfiguring(null)
            loadData()
        } catch (e: any) {
            toast.error('Failed to save configuration')
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'facebook': return <FiFacebook className="w-6 h-6" />
            case 'messenger': return <FaFacebookMessenger className="w-6 h-6" />
            case 'instagram': return <FiInstagram className="w-6 h-6" />
            case 'whatsapp': return <FaWhatsapp className="w-6 h-6" />
            case 'telegram': return <FaTelegram className="w-6 h-6" />
            case 'email': return <FiMail className="w-6 h-6" />
            default: return <FiMessageCircle className="w-6 h-6" />
        }
    }

    const getColor = (type: string) => {
        switch (type) {
            case 'facebook': return 'text-blue-600 bg-blue-50 border-blue-200'
            case 'messenger': return 'text-blue-500 bg-blue-50 border-blue-200'
            case 'instagram': return 'text-pink-600 bg-pink-50 border-pink-200'
            case 'whatsapp': return 'text-green-600 bg-green-50 border-green-200'
            case 'telegram': return 'text-sky-500 bg-sky-50 border-sky-200'
            default: return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    const AVAILABLE_CHANNELS = [
        { id: 'facebook', name: 'Facebook Page', description: 'Connect your Facebook Page to manage posts and comments' },
        { id: 'messenger', name: 'Messenger', description: 'Reply to messages from your Facebook Page' },
        { id: 'instagram', name: 'Instagram', description: 'Manage Instagram DMs and comments' },
        { id: 'whatsapp', name: 'WhatsApp', description: 'Connect WhatsApp Business API' },
        { id: 'telegram', name: 'Telegram', description: 'Connect Telegram Bot' },
    ]

    return (
        <div className="p-8 max-w-6xl mx-auto relative">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Channels & Integrations</h1>
                    <p className="text-muted-foreground">
                        Connect your communication channels to start automating
                    </p>
                </div>
                <Button variant="outline" onClick={loadData}>
                    <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Connected Channels */}
            {channels.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-xl font-semibold mb-4">Connected Channels</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {channels.map((channel) => (
                            <div key={channel.id} className="glass rounded-xl p-6 border border-border/40">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${getColor(channel.type)}`}>
                                        {getIcon(channel.type)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                                            <FiCheckCircle className="w-3 h-3 mr-1" />
                                            Active
                                        </span>
                                        <button
                                            onClick={() => handleDisconnect(channel.id)}
                                            className="text-muted-foreground hover:text-red-500 transition-colors"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-semibold text-lg mb-1">{channel.name}</h3>
                                <p className="text-sm text-muted-foreground capitalize mb-4">
                                    {channel.type}
                                </p>
                                <div className="text-xs text-muted-foreground">
                                    Connected {new Date(channel.connected_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Available Channels */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Available Integrations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {AVAILABLE_CHANNELS.map((channel) => {
                        const isConnected = channels.some(c => c.type === channel.id)
                        const isConfigured = !!configs[channel.id]?.client_id

                        return (
                            <div key={channel.id} className="glass rounded-xl p-6 border border-border/40 hover:border-primary/20 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${getColor(channel.id)}`}>
                                        {getIcon(channel.id)}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openConfig(channel.id)}
                                            className={`p-2 rounded-lg transition-colors ${isConfigured ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'}`}
                                            title="Configure Settings"
                                        >
                                            <FiSettings className="w-4 h-4" />
                                        </button>
                                        <FiExternalLink className="w-4 h-4 text-muted-foreground mt-2" />
                                    </div>
                                </div>
                                <h3 className="font-semibold text-lg mb-1">{channel.name}</h3>
                                <p className="text-sm text-muted-foreground mb-6 h-10">
                                    {channel.description}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        className="w-full"
                                        variant={isConnected ? "outline" : "default"}
                                        onClick={() => handleConnect(channel.id)}
                                        disabled={connecting === channel.id}
                                    >
                                        {connecting === channel.id ? 'Connecting...' : isConnected ? 'Connect Another' : 'Connect'}
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Configuration Modal */}
            {configuring && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold capitalize">Configure {configuring}</h3>
                            <button onClick={() => setConfiguring(null)} className="text-muted-foreground hover:text-foreground">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">App ID / Client ID</label>
                                <input
                                    type="text"
                                    value={configForm.client_id}
                                    onChange={(e) => setConfigForm({ ...configForm, client_id: e.target.value })}
                                    className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Enter App ID"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">App Secret / Client Secret</label>
                                <input
                                    type="password"
                                    value={configForm.client_secret}
                                    onChange={(e) => setConfigForm({ ...configForm, client_secret: e.target.value })}
                                    className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Enter App Secret"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Scopes (Optional)</label>
                                <input
                                    type="text"
                                    value={configForm.scopes}
                                    onChange={(e) => setConfigForm({ ...configForm, scopes: e.target.value })}
                                    className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Comma separated scopes"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setConfiguring(null)}>
                                    Cancel
                                </Button>
                                <Button className="flex-1" onClick={saveConfig}>
                                    Save Configuration
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
