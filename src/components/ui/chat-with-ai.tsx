'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from 'lucide-react'

interface ChatWithAIProps {
    title?: string;
    placeholder?: string;
    className?: string;
}

export function ChatWithAI({ title = "Chat dengan AI", placeholder = "Ketik pesan Anda...", className = "" }: ChatWithAIProps) {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()

    return (
        <Card className={`w-full max-w-2xl ${className}`}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className='h-96 overflow-auto'>
                    {messages.map(m => (
                        <div key={m.id} className={`mb-4 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block p-2 rounded-lg ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                                {m.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="text-left">
                            <div className="inline-block p-2 rounded-lg bg-gray-200">
                                AI sedang mengetik...
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <form onSubmit={handleSubmit} className="flex w-full space-x-2">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        className="flex-grow"
                    />
                    <Button type="submit" disabled={isLoading}>
                        <Send className="h-4 w-4 mr-2" />
                        Kirim
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
}

