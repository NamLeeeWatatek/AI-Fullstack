'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@wataomi/ui'
import { fetchAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import {
    FiSend,
    FiLoader,
    FiSettings,
    FiTrash2,
    FiCopy,
    FiCheck
} from 'react-icons/fi'

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

interface AIModel {
    provider: string
    model_name: string
    display_name: string
    is_available: boolean
}

export default function AIAssistantPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [models, setModels] = useState<AIModel[]>([])
    const [selectedModel, setSelectedModel] = useState('gemini-pro')
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadModels()
        // Load conversation from localStorage
        const saved = localStorage.getItem('ai_conversation')
        if (saved) {
            const parsed = JSON.parse(saved)
            setMessages(parsed.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp)
            })))
        }
    }, [])

    useEffect(() => {
        // Save conversation to localStorage
        if (messages.length > 0) {
            localStorage.setItem('ai_conversation', JSON.stringify(messages))
        }
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const loadModels = async () => {
        try {
            const data = await fetchAPI('/ai-assistant/models')
            const allModels = data.flatMap((provider: any) => provider.models)
            setModels(allModels.filter((m: AIModel) => m.is_available))
            
            // Set first available model as default
            const firstAvailable = allModels.find((m: AIModel) => m.is_available)
            if (firstAvailable) {
                setSelectedModel(firstAvailable.model_name)
            }
        } catch (e: any) {
            console.error('Failed to load models:', e)
        }
    }

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)

        try {
            const response = await fetchAPI('/ai-assistant/chat', {
                method: 'POST',
                body: JSON.stringify({
                    message: input,
                    model: selectedModel,
                    conversation_history: messages.map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                })
            })

            const assistantMessage: Message = {
                role: 'assistant',
                content: response.response,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (e: any) {
            toast.error('Failed to get AI response: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleClear = () => {
        if (confirm('Clear all messages?')) {
            setMessages([])
            localStorage.removeItem('ai_conversation')
        }
    }

    const handleCopy = (content: string, index: number) => {
        navigator.clipboard.writeText(content)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
        toast.success('Copied to clipboard')
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-border/40 flex items-center justify-between px-6 bg-background">
                <div>
                    <h1 className="text-xl font-bold">AI Assistant</h1>
                    <p className="text-xs text-muted-foreground">
                        Powered by {models.find(m => m.model_name === selectedModel)?.display_name || 'AI'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Model Selector */}
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="glass rounded-lg px-3 py-2 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        {models.map((model) => (
                            <option key={model.model_name} value={model.model_name}>
                                {model.display_name}
                            </option>
                        ))}
                    </select>
                    
                    <Button variant="ghost" size="icon" onClick={handleClear}>
                        <FiTrash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center max-w-md">
                            <div className="text-6xl mb-4">🤖</div>
                            <h2 className="text-2xl font-bold mb-2">AI Assistant</h2>
                            <p className="text-muted-foreground mb-6">
                                Ask me anything! I can help you with workflows, automation, coding, and more.
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <button
                                    onClick={() => setInput('How do I create a workflow?')}
                                    className="p-3 glass rounded-lg hover:bg-muted/50 transition-colors text-left"
                                >
                                    💡 How do I create a workflow?
                                </button>
                                <button
                                    onClick={() => setInput('Explain AI nodes')}
                                    className="p-3 glass rounded-lg hover:bg-muted/50 transition-colors text-left"
                                >
                                    🧠 Explain AI nodes
                                </button>
                                <button
                                    onClick={() => setInput('Help me with automation')}
                                    className="p-3 glass rounded-lg hover:bg-muted/50 transition-colors text-left"
                                >
                                    ⚡ Help me with automation
                                </button>
                                <button
                                    onClick={() => setInput('Best practices for bots')}
                                    className="p-3 glass rounded-lg hover:bg-muted/50 transition-colors text-left"
                                >
                                    🤖 Best practices for bots
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-wata-purple to-wata-pink flex items-center justify-center text-white font-bold flex-shrink-0">
                                        AI
                                    </div>
                                )}
                                <div
                                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                                        message.role === 'user'
                                            ? 'bg-primary text-white'
                                            : 'glass border border-border/40'
                                    }`}
                                >
                                    <div className="whitespace-pre-wrap break-words">
                                        {message.content}
                                    </div>
                                    <div className="flex items-center justify-between mt-2 gap-2">
                                        <div className={`text-xs ${message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                                            {formatTime(message.timestamp)}
                                        </div>
                                        {message.role === 'assistant' && (
                                            <button
                                                onClick={() => handleCopy(message.content, index)}
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {copiedIndex === index ? (
                                                    <FiCheck className="w-3 h-3" />
                                                ) : (
                                                    <FiCopy className="w-3 h-3" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {message.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-wata-blue to-wata-cyan flex items-center justify-center text-white font-bold flex-shrink-0">
                                        U
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-wata-purple to-wata-pink flex items-center justify-center text-white font-bold">
                                    AI
                                </div>
                                <div className="glass border border-border/40 rounded-2xl px-4 py-3">
                                    <FiLoader className="w-5 h-5 animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className="border-t border-border/40 p-4 bg-background">
                <div className="max-w-4xl mx-auto flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Ask me anything..."
                        className="flex-1 glass rounded-xl px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        disabled={loading}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="px-6"
                    >
                        {loading ? (
                            <FiLoader className="w-5 h-5 animate-spin" />
                        ) : (
                            <FiSend className="w-5 h-5" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
