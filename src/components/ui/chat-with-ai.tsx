'use client'

import { useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { ScrollArea } from "@/components/ui/scroll-area"
import { CopyIcon, Send, StopCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw';
import '../../app/css/markdownStyle.css';

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
            { id: '1', role: 'assistant', content: "Hello! How can I help you today?" }
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

    const CodeBlockWithCopy = ({ code }: { code: string }) => {
        const [copied, setCopied] = useState(false);

        const handleCopy = async () => {
            try {
                await navigator.clipboard.writeText(code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error("Gagal menyalin teks:", err);
            }
        };

        return (
            <div className="relative">
                <pre className="bg-gray-900 text-white p-4 rounded overflow-auto">
                    <code>{code}</code>
                </pre>
                <Button variant={'ghost'} onClick={handleCopy} className='absolute top-2 right-2 text-white text-sm'>{copied ? 'Copied!' : <CopyIcon />}</Button>
            </div>
        );
    }

    return (
        <Card className={`w-full max-w-xl ${className}`}>
            <CardContent className='mb-2'>
                <div className="max-h-[70vh] overflow-auto pr-4">
                    {messages.map(m => (
                        <div key={m.id} className={`mb-4 w-96 mt-5 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block p-2 max-w-96 rounded-lg ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>
                                <div className="prose max-w-none prose-headings:text-blue-600 prose-strong:text-red-500 prose-em:text-green-500 prose-code:bg-gray-100 prose-code:rounded-lg prose-code:p-2">
                                    <ReactMarkdown
                                        className="prose dark:prose-invert flex flex-col gap-2"
                                        rehypePlugins={[rehypeRaw]}
                                        components={{
                                            code({ inline, children }) {
                                                if (inline) {
                                                    return (
                                                        <code className="bg-gray-200 px-1 rounded">
                                                            {children}
                                                        </code>
                                                    );
                                                }
                                                return (
                                                    <CodeBlockWithCopy code={String(children)} />
                                                );
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

