'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'
import axiosClient from '@/lib/axios-client'
import { FiSend, FiMessageCircle } from 'react-icons/fi'

export default function PublicBotPage() {
    const params = useParams()
    const botId = params.id as string
    const [bot, setBot] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadBot()
        createConversation()
    }, [botId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const loadBot = async () => {
        try {
            const response = await fetch(`/api/v1/public/bots/${botId}/config`)
            const data = await response.json()
            setBot(data)
        } catch (error) {
            console.error('Failed to load bot')
        }
    }

    const createConversation = async () => {
        try {
            const response = await fetch(`/api/v1/public/bots/${botId}/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metadata: {} }),
            })
            const data = await response.json()
            setConversationId(data.conversationId)
        } catch (error) {
            console.error('Failed to create conversation')
        }
    }

    const handleSend = async () => {
        if (!input.trim() || loading || !conversationId) return

        const userMessage = { role: 'user', content: input, timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, userMessage])
        const messageText = input
        setInput('')
        setLoading(true)

        try {
            const response = await fetch(`/api/v1/public/bots/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            })
            const data = await response.json()
            
            const assistantMessage = {
                role: 'assistant',
                content: data.content,
                timestamp: data.timestamp,
                metadata: data.metadata,
            }
            setMessages(prev => [...prev, assistantMessage])
        } catch (error) {
            console.error('Failed to send message:', error)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
                timestamp: new Date().toISOString(),
            }])
        } finally {
            setLoading(false)
        }
    }

    if (!bot) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner className="w-8 h-8" />
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            <header className="border-b p-4 bg-card">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                        <FiMessageCircle className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">{bot.name}</h1>
                        <p className="text-sm text-muted-foreground">{bot.description}</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.length === 0 ? (
                        <Card className="p-8 text-center">
                            <FiMessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <h2 className="text-lg font-semibold mb-2">Start chatting</h2>
                            <p className="text-muted-foreground">Send a message to begin</p>
                        </Card>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <Card className={`p-4 max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </Card>
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="flex justify-start">
                            <Card className="p-4">
                                <Spinner className="w-4 h-4" />
                            </Card>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="border-t p-4 bg-card">
                <div className="max-w-4xl mx-auto flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 rounded-lg border bg-background"
                        disabled={loading}
                    />
                    <Button onClick={handleSend} disabled={!input.trim() || loading}>
                        <FiSend className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
