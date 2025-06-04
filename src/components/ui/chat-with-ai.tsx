'use client'

import { useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Copy, CopyIcon, Send, StopCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw';
import remarkGfm from "remark-gfm"
import '../../app/css/markdownStyle.css';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism"
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface ChatWithAIProps {
    title?: string;
    placeholder?: string;
    className?: string;
    onCommandReceived?: (command: string | Record<string, any>) => void;
}

export function ChatWithAI({ title = "Chat with Truenapsh Ai", placeholder = "Type your message...", className = "", onCommandReceived }: ChatWithAIProps) {
    const [error, setError] = useState<string | null>(null);
    const { messages, input, handleInputChange, isLoading, append, stop, status } = useChat({
        api: '/api/ai-chat',
        initialMessages: [
            // { id: '1', role: 'assistant', content: "Hello! How can I help you today?" }
        ],
        onFinish: (message) => {
            if (message?.role === 'assistant' && message.content) {
                executeCommands(message.content);
            }
        }
    })


    const executeCommands = (content?: string) => {
        const commands = content?.split('::CMD::');
        commands?.forEach(command => {
            if (command.includes('::ENDCMD::')) {
                const cmd = command?.split('::ENDCMD::')[0];
                const isLikelyJSON = cmd.startsWith('{') || cmd.startsWith('[');
                if (isLikelyJSON) {
                    try {
                        const parsed = JSON.parse(cmd);
                        if (parsed && typeof parsed === 'object') {
                            onCommandReceived?.(parsed);
                            return;
                        }
                    } catch (e) {
                        console.warn('Gagal parse JSON dari AI:', e);
                    }
                }
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        handleInputChange({
            target: { value: '' }
        } as React.ChangeEvent<HTMLInputElement>);
        if (!input.trim()) return;
        try {
            await append({
                content: input,
                role: 'user',
            });
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Terjadi kesalahan saat mengirim pesan. Pastikan LM Studio berjalan dan terhubung.');
        }
    };

    const handleStop = () => {
        stop();
    };

    return (
        <Card className={`w-full max-w-xl ${className}`}>
            <CardContent className='mb-2'>
                <div className="max-h-[70vh] min-h-96 overflow-auto">
                    {messages.length == 0 && (
                        <div className="h-96 flex items-center">
                            <div className="relative flex flex-1 flex-col items-center justify-center gap-8 self-stretch overflow-hidden py-4">
                                <div className="flex flex-col items-center justify-start gap-3">
                                    <img
                                        src="/assets/logo-dark.png"
                                        alt="Logo"
                                        className="h-10 w-10 block dark:hidden"
                                    />
                                    <img
                                        src="/assets/logo-light.png"
                                        alt="Logo"
                                        className="h-10 w-10 hidden dark:block"
                                    />
                                    <div className="text-base-gray-950 justify-start text-sm leading-none">
                                        Ask anything about your map
                                    </div>
                                    <div className="justify-start text-sm font-normal leading-none text-[#929292]">
                                        Ask to do or show anything using natural language
                                    </div>
                                </div>
                                <div className="relative inline-flex w-96 flex-col items-start justify-center gap-2">
                                    <div className="no-scrollbar relative flex w-full justify-center">
                                        <div className="flex items-center justify-start gap-2 whitespace-nowrap">
                                            <div className="flex h-7 flex-shrink-0 items-center justify-start gap-1.5 overflow-hidden rounded-md bg-background shadow-md border border-foreground/5 px-2 py-1.5">
                                                <div className="flex items-center justify-start gap-1 px-0.5">
                                                    <div className="justify-start text-sm leading-none text-[#8B8B8B]">
                                                        Show points of interest nearby
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex h-7 flex-shrink-0 items-center justify-start gap-1.5 overflow-hidden rounded-md bg-background shadow-md border border-foreground/5 px-2 py-1.5">
                                                <div className="flex items-center justify-start gap-1 px-0.5">
                                                    <div className="justify-start text-sm leading-none text-[#8B8B8B]">
                                                        Analysis this map
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex h-7 flex-shrink-0 items-center justify-start gap-1.5 overflow-hidden rounded-md bg-background shadow-md border border-foreground/5 px-2 py-1.5">
                                                <div className="flex items-center justify-start gap-1 px-0.5">
                                                    <div className="justify-start text-sm leading-none text-[#8B8B8B]">
                                                        Calculate route to airport
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute left-0 top-0 h-7 w-12 bg-gradient-to-l from-neutral-800/0 to-neutral-50 dark:to-neutral-950"></div>
                                        <div className="absolute right-0 top-0 h-7 w-12 bg-gradient-to-l from-neutral-50 dark:from-neutral-950 to-neutral-900/0"></div>
                                    </div>
                                    <div className="no-scrollbar relative flex w-full justify-center">
                                        <div className="flex items-center justify-start gap-2 whitespace-nowrap">
                                            {/* <div className="flex h-7 flex-shrink-0 items-center justify-start gap-1.5 overflow-hidden rounded-md bg-background shadow-md border border-foreground/5 px-2 py-1.5">
                                                <div className="flex items-center justify-start gap-1 px-0.5">
                                                    <div className="justify-start text-sm leading-none text-[#8B8B8B]">
                                                        Zoom to area
                                                    </div>
                                                </div>
                                            </div> */}
                                            <div className="flex h-7 flex-shrink-0 items-center justify-start gap-1.5 overflow-hidden rounded-md bg-background shadow-md border border-foreground/5 px-2 py-1.5">
                                                <div className="flex items-center justify-start gap-1 px-0.5">
                                                    <div className="justify-start text-sm leading-none text-[#8B8B8B]">
                                                        Show me all the interesting places and attractions in this area
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute left-0 top-0 h-7 w-12 bg-gradient-to-l from-neutral-800/0 to-neutral-50 dark:to-neutral-950"></div>
                                        <div className="absolute right-0 top-0 h-7 w-12 bg-gradient-to-l from-neutral-50 dark:from-neutral-950 to-neutral-800/0"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {messages.map(m => (
                        <div key={m.id} className={`mb-4 w-96 mt-5 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block p-2 max-w-96 rounded-lg ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>
                                <div className="text-bold">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ node, inline, className, children, ...props }) {
                                                const match = /language-(\w+)/.exec(className || "")
                                                return !inline && match ? (
                                                    <CodeBlock
                                                        language={match[1]}
                                                        value={String(children).replace(/\n$/, "")}
                                                        className={className}
                                                        {...props}
                                                    />
                                                ) : (
                                                    <code className={inline ? "px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded" : ""} {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            },
                                        }}
                                    >
                                        {m.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="text-left">
                            <div className="inline-block p-2 rounded-lg bg-gray-200 dark:bg-gray-800">
                                Truenapsh AI typing..
                            </div>
                        </div>
                    )}
                </div>
                {error && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                <form onSubmit={handleSubmit} className="flex w-full space-x-2">
                    <div className='relative w-full'>
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder={placeholder}
                            className=""
                        />
                        {isLoading && (
                            <Button type="button" onClick={handleStop} variant={"ghost"} className='absolute top-0 right-0 text-red-400'>
                                <StopCircle className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <Button type="submit" disabled={isLoading}>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
}

interface CodeBlockProps {
    language: string
    value: string
    className?: string
}

export default function CodeBlock({ language, value, className }: CodeBlockProps) {
    const [copied, setCopied] = useState(false)

    const extractedLanguage = className ? className.replace("language-", "") : language

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy text: ", err)
        }
    }

    return (
        <div className="relative rounded-md overflow-hidden my-2">
            <div className="flex items-center justify-between bg-zinc-800 px-4 py-1.5 text-xs text-zinc-100">
                <span>{extractedLanguage || "code"}</span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-100 hover:bg-zinc-700"
                    onClick={copyToClipboard}
                >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
            <SyntaxHighlighter
                language={extractedLanguage || "text"}
                style={atomDark}
                customStyle={{
                    margin: 0,
                    padding: "1rem",
                    borderRadius: 0,
                }}
            >
                {value}
            </SyntaxHighlighter>
        </div>
    )
}
