'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AlertDialogConfirm } from '@/components/ui/alert-dialog-confirm'
import { TreeTable } from '@/components/ui/tree-table'
import { fetchAPI } from '@/lib/api'
import toast from '@/lib/toast'
import {
    FiFacebook,
    FiInstagram,
    FiMessageCircle,
    FiMail,
    FiTrash2,
    FiCheckCircle,
    FiRefreshCw,
    FiSettings,
    FiX,
    FiYoutube,
    FiTwitter,
    FiLinkedin,
    FiSlack,
    FiGlobe,
    FiPhone,
    FiPlus,
    FiEdit2
} from 'react-icons/fi'
import { FaWhatsapp, FaTelegram, FaFacebookMessenger, FaTiktok, FaDiscord, FaShopify, FaGoogle, FaLine, FaViber, FaWeixin } from 'react-icons/fa'
import { SiZalo, SiNotion, SiAirtable, SiZapier, SiHubspot, SiSalesforce, SiMailchimp, SiIntercom } from 'react-icons/si'
import { cn } from '@/lib/utils'

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

// Platform metadata
const PLATFORM_META: Record<string, {
    name: string
    description: string
    category: 'messaging' | 'social' | 'ecommerce' | 'crm' | 'marketing' | 'support' | 'automation' | 'productivity' | 'business'
    icon: JSX.Element
    colorClass: string
    multiAccount: boolean
}> = {
    facebook: { name: 'Facebook Page', description: 'Manage posts and comments', category: 'social', icon: <FiFacebook className="w-5 h-5" />, colorClass: 'platform-facebook', multiAccount: true },
    messenger: { name: 'Messenger', description: 'Reply to messages', category: 'messaging', icon: <FaFacebookMessenger className="w-5 h-5" />, colorClass: 'platform-messenger', multiAccount: true },
    instagram: { name: 'Instagram', description: 'Manage DMs and comments', category: 'social', icon: <FiInstagram className="w-5 h-5" />, colorClass: 'platform-instagram', multiAccount: true },
    whatsapp: { name: 'WhatsApp Business', description: 'Connect WhatsApp Business API', category: 'messaging', icon: <FaWhatsapp className="w-5 h-5" />, colorClass: 'platform-whatsapp', multiAccount: true },
    telegram: { name: 'Telegram', description: 'Connect Telegram Bot', category: 'messaging', icon: <FaTelegram className="w-5 h-5" />, colorClass: 'platform-telegram', multiAccount: true },
    youtube: { name: 'YouTube', description: 'Manage channel and comments', category: 'social', icon: <FiYoutube className="w-5 h-5" />, colorClass: 'platform-youtube', multiAccount: true },
    twitter: { name: 'X / Twitter', description: 'Post tweets and manage DMs', category: 'social', icon: <FiTwitter className="w-5 h-5" />, colorClass: 'platform-twitter', multiAccount: true },
    linkedin: { name: 'LinkedIn', description: 'Post and manage messages', category: 'social', icon: <FiLinkedin className="w-5 h-5" />, colorClass: 'platform-linkedin', multiAccount: true },
    tiktok: { name: 'TikTok', description: 'Post videos and manage account', category: 'social', icon: <FaTiktok className="w-5 h-5" />, colorClass: 'platform-tiktok', multiAccount: true },
    discord: { name: 'Discord', description: 'Connect Discord bot', category: 'messaging', icon: <FaDiscord className="w-5 h-5" />, colorClass: 'platform-discord', multiAccount: true },
    slack: { name: 'Slack', description: 'Send notifications', category: 'messaging', icon: <FiSlack className="w-5 h-5" />, colorClass: 'platform-slack', multiAccount: true },
    zalo: { name: 'Zalo OA', description: 'Connect Zalo Official Account', category: 'messaging', icon: <SiZalo className="w-5 h-5" />, colorClass: 'platform-zalo', multiAccount: true },
    line: { name: 'LINE', description: 'Connect LINE Official Account', category: 'messaging', icon: <FaLine className="w-5 h-5" />, colorClass: 'platform-line', multiAccount: true },
    viber: { name: 'Viber', description: 'Connect Viber Business', category: 'messaging', icon: <FaViber className="w-5 h-5" />, colorClass: 'platform-viber', multiAccount: true },
    wechat: { name: 'WeChat', description: 'Connect WeChat Official Account', category: 'messaging', icon: <FaWeixin className="w-5 h-5" />, colorClass: 'platform-wechat', multiAccount: true },
    sms: { name: 'SMS', description: 'Send SMS via Twilio', category: 'messaging', icon: <FiPhone className="w-5 h-5" />, colorClass: 'platform-sms', multiAccount: false },
    email: { name: 'Email', description: 'Send emails via SMTP', category: 'messaging', icon: <FiMail className="w-5 h-5" />, colorClass: 'platform-email', multiAccount: false },
    webchat: { name: 'Web Chat', description: 'Embed chat widget', category: 'messaging', icon: <FiGlobe className="w-5 h-5" />, colorClass: 'platform-webchat', multiAccount: false },
    shopify: { name: 'Shopify', description: 'Sync orders and customers', category: 'ecommerce', icon: <FaShopify className="w-5 h-5" />, colorClass: 'platform-shopify', multiAccount: true },
    google: { name: 'Google Business', description: 'Manage reviews', category: 'business', icon: <FaGoogle className="w-5 h-5" />, colorClass: 'platform-google', multiAccount: true },
    hubspot: { name: 'HubSpot', description: 'Sync contacts and deals', category: 'crm', icon: <SiHubspot className="w-5 h-5" />, colorClass: 'platform-hubspot', multiAccount: false },
    salesforce: { name: 'Salesforce', description: 'Connect to Salesforce CRM', category: 'crm', icon: <SiSalesforce className="w-5 h-5" />, colorClass: 'platform-salesforce', multiAccount: false },
    mailchimp: { name: 'Mailchimp', description: 'Sync contacts for email marketing', category: 'marketing', icon: <SiMailchimp className="w-5 h-5" />, colorClass: 'platform-mailchimp', multiAccount: false },
    intercom: { name: 'Intercom', description: 'Sync conversations', category: 'support', icon: <SiIntercom className="w-5 h-5" />, colorClass: 'platform-intercom', multiAccount: false },
    zapier: { name: 'Zapier', description: 'Connect to 5000+ apps', category: 'automation', icon: <SiZapier className="w-5 h-5" />, colorClass: 'platform-zapier', multiAccount: false },
    notion: { name: 'Notion', description: 'Sync data with Notion', category: 'productivity', icon: <SiNotion className="w-5 h-5" />, colorClass: 'platform-notion', multiAccount: true },
    airtable: { name: 'Airtable', description: 'Connect to Airtable bases', category: 'productivity', icon: <SiAirtable className="w-5 h-5" />, colorClass: 'platform-airtable', multiAccount: true },
}

export default function ChannelsPageNew() {
    const [channels, setChannels] = useState<Channel[]>([])
    const [configs, setConfigs] = useState<Record<string, IntegrationConfig>>({})
    const [loading, setLoading] = useState(true)
    const [connecting, setConnecting] = useState<string | null>(null)
    const [configuring, setConfiguring] = useState<string | null>(null)
    const [disconnectId, setDisconnectId] = useState<number | null>(null)
    const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree')

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

            const configMap: Record<string, IntegrationConfig> = {}
            configsData.forEach((c: IntegrationConfig) => {
                configMap[c.provider] = c
            })
            setConfigs(configMap)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = async (provider: string) => {
        if (!configs[provider]?.client_id) {
            toast.error(`Please configure ${provider} settings first`)
            openConfig(provider)
            return
        }

        try {
            setConnecting(provider)
            const { url } = await fetchAPI(`/oauth/login/${provider}`)

            const width = 600
            const height = 700
            const left = window.screen.width / 2 - width / 2
            const top = window.screen.height / 2 - height / 2

            const popup = window.open(url, `Connect ${provider}`, `width=${width},height=${height},left=${left},top=${top}`)

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

            const checkClosed = setInterval(() => {
                if (popup?.closed) {
                    clearInterval(checkClosed)
                    setConnecting(null)
                    window.removeEventListener('message', messageHandler)
                }
            }, 1000)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            toast.error(`Failed to start connection: ${message}`)
            setConnecting(null)
        }
    }

    const handleDisconnect = async (id: number) => {
        setDisconnectId(id)
    }

    const confirmDisconnect = async () => {
        if (!disconnectId) return

        try {
            await fetchAPI(`/channels/${disconnectId}`, { method: 'DELETE' })
            toast.success('Channel disconnected')
            loadData()
        } catch {
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
        } catch {
            toast.error('Failed to save configuration')
        }
    }

    // Build tree data
    const treeData = Object.entries(configs).map(([provider, config]) => {
        const meta = PLATFORM_META[provider]
        const connectedChannels = channels.filter(c => c.type === provider)

        return {
            id: `config-${provider}`,
            icon: (
                <div className={cn('p-2 rounded-lg border', meta?.colorClass || 'platform-default')}>
                    {meta?.icon || <FiMessageCircle className="w-5 h-5" />}
                </div>
            ),
            label: (
                <div className="flex-1">
                    <div className="font-semibold">{meta?.name || provider}</div>
                    <div className="text-xs text-muted-foreground">{meta?.description || 'Configured'}</div>
                </div>
            ),
            badge: (
                <div className="flex items-center gap-2">
                    {connectedChannels.length > 0 && (
                        <span className="text-xs font-medium bg-success/10 text-success px-2 py-0.5 rounded-full">
                            {connectedChannels.length} connected
                        </span>
                    )}
                    <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        config.is_active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    )}>
                        {config.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            ),
            actions: (
                <>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConnect(provider)}
                        disabled={connecting === provider}
                    >
                        {connecting === provider ? (
                            <Spinner className="size-3 mr-1" />
                        ) : (
                            <FiPlus className="w-3 h-3 mr-1" />
                        )}
                        {connectedChannels.length > 0 ? 'Add Another' : 'Connect'}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openConfig(provider)}
                    >
                        <FiEdit2 className="w-3 h-3" />
                    </Button>
                </>
            ),
            children: connectedChannels.map(channel => ({
                id: `channel-${channel.id}`,
                icon: (
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                ),
                label: (
                    <div className="flex-1">
                        <div className="font-medium">{channel.name}</div>
                        <div className="text-xs text-muted-foreground">
                            Connected {new Date(channel.connected_at).toLocaleDateString()}
                        </div>
                    </div>
                ),
                badge: (
                    <span className="text-xs font-medium bg-success/10 text-success px-2 py-0.5 rounded-full flex items-center gap-1">
                        <FiCheckCircle className="w-3 h-3" />
                        Active
                    </span>
                ),
                actions: (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDisconnect(channel.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <FiTrash2 className="w-3 h-3" />
                    </Button>
                )
            }))
        }
    })

    // Unconfigured platforms
    const unconfiguredPlatforms = Object.entries(PLATFORM_META).filter(([id]) => !configs[id])

    return (
        <div className="h-full relative">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Channels & Integrations</h1>
                    <p className="text-muted-foreground">
                        Configure and connect your communication channels
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode(viewMode === 'tree' ? 'grid' : 'tree')}
                    >
                        {viewMode === 'tree' ? 'Grid View' : 'Tree View'}
                    </Button>
                    <Button variant="outline" onClick={loadData} disabled={loading}>
                        {loading ? (
                            <Spinner className="size-4 mr-2" />
                        ) : (
                            <FiRefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Tree View */}
            {viewMode === 'tree' && (
                <div className="space-y-6">
                    {treeData.length > 0 ? (
                        <>
                            <div>
                                <h2 className="text-lg font-semibold mb-4">Configured Integrations ({treeData.length})</h2>
                                <TreeTable data={treeData} />
                            </div>

                            {unconfiguredPlatforms.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold mb-4">Available to Configure ({unconfiguredPlatforms.length})</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {unconfiguredPlatforms.map(([id, meta]) => (
                                            <button
                                                key={id}
                                                onClick={() => openConfig(id)}
                                                className="landing-card p-4 text-left group"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className={cn('p-2 rounded-lg border', meta.colorClass)}>
                                                        {meta.icon}
                                                    </div>
                                                    <FiSettings className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <h3 className="font-semibold mb-1">{meta.name}</h3>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {meta.description}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
                                <FiMessageCircle className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No configurations yet</h3>
                            <p className="text-muted-foreground mb-6">
                                Configure your first integration to start connecting channels
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Configuration Modal */}
            {configuring && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="dashboard-card p-6 w-full max-w-md">
                        <div className="flex items-center gap-3 mb-6">
                            <div className={cn('p-2.5 rounded-xl border', PLATFORM_META[configuring]?.colorClass || 'platform-default')}>
                                {PLATFORM_META[configuring]?.icon || <FiMessageCircle className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold">{PLATFORM_META[configuring]?.name || configuring}</h3>
                                <p className="text-xs text-muted-foreground">API Configuration</p>
                            </div>
                            <button onClick={() => setConfiguring(null)} className="text-muted-foreground hover:text-foreground">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-info/10 border border-info/20 rounded-lg">
                            <p className="text-xs text-info">
                                💡 Get your API credentials from the {configuring} developer portal
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    App ID / Client ID <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={configForm.client_id}
                                    onChange={(e) => setConfigForm({ ...configForm, client_id: e.target.value })}
                                    className="w-full bg-input border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Enter App ID"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    App Secret / Client Secret <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={configForm.client_secret}
                                    onChange={(e) => setConfigForm({ ...configForm, client_secret: e.target.value })}
                                    className="w-full bg-input border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Enter App Secret"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Scopes (Optional)</label>
                                <input
                                    type="text"
                                    value={configForm.scopes}
                                    onChange={(e) => setConfigForm({ ...configForm, scopes: e.target.value })}
                                    className="w-full bg-input border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="e.g., pages_messaging, instagram_basic"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Comma separated permission scopes
                                </p>
                            </div>

                            {configs[configuring]?.client_id && (
                                <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                                    <p className="text-xs text-success flex items-center gap-2">
                                        <FiCheckCircle className="w-4 h-4" />
                                        This integration is already configured. Saving will update the settings.
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setConfiguring(null)}>
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={saveConfig}
                                    disabled={!configForm.client_id || !configForm.client_secret}
                                >
                                    {configs[configuring]?.client_id ? 'Update' : 'Save'} Configuration
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <AlertDialogConfirm
                open={disconnectId !== null}
                onOpenChange={(open) => !open && setDisconnectId(null)}
                title="Disconnect Channel"
                description="Are you sure you want to disconnect this channel? This action cannot be undone."
                confirmText="Disconnect"
                cancelText="Cancel"
                onConfirm={confirmDisconnect}
                variant="destructive"
            />
        </div>
    )
}
