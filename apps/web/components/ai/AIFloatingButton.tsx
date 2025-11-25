'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi'
import { Button } from '@wataomi/ui'

export function AIFloatingButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [message, setMessage] = useState('')
    const router = useRouter()

    const handleOpenFullChat = () => {
        router.push('/ai-assistant')
        setIsOpen(false)
    }

    const handleQuickSend = () => {
        if (message.trim()) {
            // Save message to localStorage and navigate
            localStorage.setItem('ai_quick_message', message)
            router.push('/ai-assistant')
            setIsOpen(false)
            setMessage('')
        }
    }

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-6 right-6 z-50">
                {!isOpen ? (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-wata-purple to-wata-pink shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center text-white group"
                    >
                        <FiMessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                    </button>
                ) : (
                    <div className="glass rounded-2xl shadow-2xl border border-border/40 w-80 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-wata-purple to-wata-pink p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    🤖
                                </div>
                                <div className="text-white">
                                    <div className="font-semibold">AI Assistant</div>
                                    <div className="text-xs opacity-80">Always here to help</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Quick Chat */}
                        <div className="p-4 space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Ask me anything or click below for full chat
                            </p>
                            
                            {/* Quick Actions */}
                            <div className="space-y-2">
                                <button
                                    onClick={() => {
                                        setMessage('How do I create a workflow?')
                                    }}
                                    className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                                >
                                    💡 How do I create a workflow?
                                </button>
                                <button
                                    onClick={() => {
                                        setMessage('Help me with automation')
                                    }}
                                    className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                                >
                                    ⚡ Help me with automation
                                </button>
                                <button
                                    onClick={() => {
                                        setMessage('Explain AI nodes')
                                    }}
                                    className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                                >
                                    🧠 Explain AI nodes
                                </button>
                            </div>

                            {/* Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleQuickSend()}
                                    placeholder="Type your question..."
                                    className="flex-1 glass rounded-lg px-3 py-2 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <button
                                    onClick={handleQuickSend}
                                    disabled={!message.trim()}
                                    className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <FiSend className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Full Chat Button */}
                            <Button
                                onClick={handleOpenFullChat}
                                variant="outline"
                                className="w-full"
                                size="sm"
                            >
                                Open Full Chat
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
