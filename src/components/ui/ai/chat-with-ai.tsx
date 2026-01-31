"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import useLayerStore from "@/stores/layer";
import {
    ChatMessage,
    ChatSession,
    ChatSessionResponse,
    Paginated,
    PaginationMeta,
} from "@/types/ai.type";
import { useChat } from "@ai-sdk/react";
import {
    Bot,
    Check,
    CheckIcon,
    ChevronDown,
    ChevronRight,
    CircleCheck,
    Copy,
    Eye,
    ImageIcon,
    Menu,
    Pencil,
    Plus,
    ScanSearch,
    Send,
    SendIcon,
    Sparkles,
    StopCircle,
    Trash2
} from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { BiDotsVertical } from "react-icons/bi";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import "../../../app/css/markdownStyle.css";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../accordion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../dropdown-menu";
import { TextShimmer } from "../text-shimmer";
import { Textarea } from "../textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { Skeleton } from "../skeleton";
import { Label } from "../label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ChatWithAIProps {
    title?: string;
    placeholder?: string;
    className?: string;
    onCommandReceived?: (command: string | Record<string, any>) => void;
    commandProgress?: {
        status: "idle" | "start" | "running" | "success" | "error";
        action?: string;
        step?: string;
        progress?: number;
    };
    projectId?: string;
}

// Memoized Message Component to prevent unnecessary re-renders
const MessageBubble = memo(
    ({ content, isUser }: { content: string; isUser: boolean }) => {
        return (
            <div
                className={`rounded-2xl px-5 py-1 shadow-sm will-change-auto ${isUser
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none"
                    : "bg-muted/50 backdrop-blur-sm border border-border/50 rounded-tl-none"
                    }`}
            >
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code({ node, inline, className, children, ...props }) {
                            const langMatch = /language-(\w+)/.exec(className || "");
                            const text = String(children);

                            if (!inline && langMatch) {
                                return (
                                    <CodeBlock
                                        language={langMatch[1]}
                                        value={text.replace(/\n$/, "")}
                                        className={className}
                                        {...props}
                                    />
                                );
                            }

                            if (text.includes("dataset:") || text.includes("option:")) {
                                const [key] = text.split("→");
                                const type = text.split(":")[0];
                                const label = type == "option" ? text.split(":")[2] : type;
                                return (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="inline-flex items-center gap-1.5 my-1 mx-1 border border-blue-400/50 rounded-lg py-1.5 px-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-foreground capitalize text-sm hover:border-blue-400 transition-all cursor-pointer hover:shadow-md">
                                                <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                                                {label}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="bottom"
                                            sideOffset={4}
                                            className="bg-background border shadow-lg"
                                        >
                                            {type === "dataset" ? (
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <ScanSearch className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <SendIcon className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <CheckIcon className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            }

                            return (
                                <code
                                    className={
                                        inline
                                            ? "px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded text-sm font-mono"
                                            : ""
                                    }
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        },
                        ul({ children }) {
                            return <ul className="list-disc pl-5">{children}</ul>;
                        },
                        ol({ children }) {
                            return <ol className="list-decimal pl-5">{children}</ol>;
                        },
                        li({ children }) {
                            return <li className="leading-relaxed">{children}</li>;
                        },
                        p({ children }) {
                            return <p className="leading-relaxed my-2">{children}</p>;
                        },
                        strong({ children }) {
                            return <strong className="font-semibold">{children}</strong>;
                        },
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        );
    }
);

MessageBubble.displayName = "MessageBubble";

export function ChatWithAI({
    title = "Chat with Truenapsh Ai",
    placeholder = "Type your message...",
    className = "",
    onCommandReceived,
    commandProgress,
    projectId = "",
}: ChatWithAIProps) {
    const { layers } = useLayerStore();
    const [activeTab, setActiveTab] = useState("Build");
    const [error, setError] = useState<string | null>(null);
    const [aiStatus, setAiStatus] = useState<
        "idle" | "thinking" | "building" | "done" | "failed"
    >("idle");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [animatedMessages, setAnimatedMessages] = useState<Set<string>>(
        new Set()
    );
    const [showSidebar, setShowSidebar] = useState(false);

    const baseURL = "/api/chat/sessions";
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [sessionsMeta, setSessionsMeta] = useState<PaginationMeta | null>(null);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
        null
    );
    const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
    const [messagesMeta, setMessagesMeta] = useState<PaginationMeta | null>(null);
    const [sessionsOpen, setSessionsOpen] = useState(false);
    const [sessionSearch, setSessionSearch] = useState("");
    const [isFetchingMessages, setIsFetchingMessages] = useState(false);

    // Command dropdown state
    const [cmdOpen, setCmdOpen] = useState(false);
    const [cmdTrigger, setCmdTrigger] = useState<
        "hash" | "mention" | "slash" | null
    >(null);
    const [cmdQuery, setCmdQuery] = useState("");
    const [cmdSuggestions, setCmdSuggestions] = useState<
        Array<{
            label: string;
            insert: string;
            group: "command" | "dataset" | "topic";
        }>
    >([]);
    const [cmdHighlight, setCmdHighlight] = useState(0);

    const stableInitialMessages = useMemo(
        () =>
            (selectedSession ? sessionMessages : []).map((m) => ({
                id: String(m.id),
                role: m.role,
                content: m.content,
                parts: m?.parts || [],
            })),
        [sessionMessages]
    );

    const chatBody = useMemo(() => ({
        layers: layers,
        tools: "map",
        sessionId: selectedSession?.id,
    }), [layers, selectedSession?.id]);

    const {
        messages,
        setMessages,
        input,
        handleInputChange,
        isLoading,
        append,
        stop,
        status,
    } = useChat({
        api: "/api/ai-chat",
        body: chatBody,
        onError: (error) => {
            setError(error.message);
            setAiStatus("failed");
        },

        onToolCall: (toolCall) => {
            if (toolCall.toolCall.toolName == "perform_map_action") {
                const actionArg: any = toolCall.toolCall.args;
                onCommandReceived?.({ action: actionArg.action || "", params: actionArg.parameters || {} });
            }
            console.log(toolCall);
        },
        onResponse: async (response) => {
            setIsTyping(true);
            setAiStatus("thinking");
        },
        onFinish: (message) => {
            if (message?.role === "assistant" && message.content) {
                if (selectedSession) {
                    persistAssistantMessage(selectedSession.id, message.content, message.parts as any[]);
                }
            }
            setIsTyping(false);
            setAiStatus("done");
        },
    });

    const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
    };

    const fetchSessions = async (projectId?: string) => {
        console.log("Ini Project ID", projectId);

        const url = projectId ? `${baseURL}?project_id=${projectId}` : `${baseURL}`;
        const res = await fetch(url, { headers });
        if (!res.ok) return;
        const json: Paginated<ChatSession> = await res.json();
        setSessions(json.data);
        setSessionsMeta(json.meta || null);
    };

    const fetchMessages = async (sessionId: number, page?: number) => {
        setIsFetchingMessages(true);
        try {
            const url = `${baseURL}/${sessionId}/messages${page ? `?page=${page}` : ""
                }`;
            const res = await fetch(url, { headers });
            if (!res.ok) return;
            const json: Paginated<ChatMessage> = await res.json();
            setSessionMessages(json.data);
            setMessagesMeta(json.meta || null);

            // Sync with useChat
            setMessages(json.data.map(m => {
                const hasParts = m.parts && m.parts.length > 0;
                return {
                    id: String(m.id),
                    role: m.role as any,
                    content: m.content,
                    parts: hasParts ? m.parts : [{ type: 'text', text: m.content }]
                };
            }));
        } finally {
            setIsFetchingMessages(false);
        }
    };

    const createSession = async (title?: string, projectId?: string) => {
        const res = await fetch(`${baseURL}`, {
            method: "POST",
            headers,
            body: JSON.stringify({ title, project_id: projectId }),
        });
        if (!res.ok) return null;
        const json: ChatSessionResponse = await res.json();
        setSelectedSession(json.data);
        await fetchSessions(projectId);
        return json.data;
    };

    const persistAssistantMessage = async (
        sessionId: number,
        content: string,
        parts: any[]
    ) => {
        await fetch(`${baseURL}/${sessionId}/messages`, {
            method: "POST",
            headers,
            body: JSON.stringify({ role: "assistant", content, parts }),
        });
        // await fetchMessages(sessionId);
    };

    const renameSession = async (id: number, title: string) => {
        const res = await fetch(`${baseURL}/${id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ title }),
        });
        if (!res.ok) return;
        await fetchSessions(projectId);
        setSelectedSession((prev) =>
            prev && prev.id === id ? { ...prev, title } : prev
        );
    };

    const deleteSession = async (id: number) => {
        const res = await fetch(`${baseURL}/${id}`, {
            method: "DELETE",
            headers,
            body: JSON.stringify({ id }), // Assuming body might be needed or just empty
        });
        if (!res.ok) return;
        await fetchSessions(projectId);
        if (selectedSession?.id === id) {
            setSelectedSession(null);
            setSessionMessages([]);
            setMessages([]);
        }
    };

    useEffect(() => {
        fetchSessions(projectId);
    }, [projectId]);



    const handleNewChat = () => {
        setSelectedSession(null);
        setSessionMessages([]);
        setMessages([]);
        setSessionsOpen(false);
        setAiStatus("idle");
    };

    const executeCommands = (content?: string) => {
        if (!content) return;

        const commands = content.split("::CMD::");
        for (const command of commands) {
            const endIdx = command.indexOf("::ENDCMD::");
            if (endIdx === -1) continue;

            const cmd = command.slice(0, endIdx).trim();
            if (!cmd) continue;

            const isLikelyJSON = cmd.startsWith("{") || cmd.startsWith("[");
            if (!isLikelyJSON) continue;

            try {
                const parsed = JSON.parse(cmd);
                if (parsed && typeof parsed === "object") {
                    setAiStatus("building");
                    onCommandReceived?.(parsed);
                    return;
                }
            } catch (e) {
                setAiStatus("failed");
                console.warn("Gagal parse JSON dari AI:", e);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const content = (input || "").trim();
        if (!content) return;
        handleInputChange({ target: { value: "" } } as any);

        // Optimistic UI update
        // We let useChat handle the message locally first

        let currentSession = selectedSession;

        try {
            if (!currentSession) {
                const autoTitle = content.slice(0, 60);
                const newSession = await createSession(autoTitle || undefined, projectId);
                if (newSession) {
                    currentSession = newSession;
                }
            }

            await append(
                { content, role: "user" },
                {
                    body: {
                        ...chatBody,
                        sessionId: currentSession?.id,
                    },
                }
            );

            if (currentSession) {
                setSessionMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now(),
                        user_id: null,
                        role: "user",
                        content,
                        metadata: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                ]);
            }
        } catch (err) {
            console.error("Error sending message:", err);
            setError(
                "Terjadi kesalahan saat mengirim pesan. Pastikan LM Studio berjalan dan terhubung."
            );
        }
    };

    const handleStop = () => {
        stop();
    };

    const handleSuggestionClick = (suggestion: string) => {
        handleInputChange({
            target: { value: suggestion },
        } as React.ChangeEvent<HTMLInputElement>);
    };

    const updateCommandMenu = (value: string) => {
        const triggerMatch = value.match(/(^|[\s])([#@\/])([^\s]*)$/);
        if (!triggerMatch) {
            setCmdOpen(false);
            setCmdTrigger(null);
            setCmdQuery("");
            setCmdSuggestions([]);
            setCmdHighlight(0);
            return;
        }
        const triggerChar = triggerMatch[2];
        const query = triggerMatch[3] || "";
        let trigger: "hash" | "mention" | "slash" | null = null;
        if (triggerChar === "#") trigger = "hash";
        else if (triggerChar === "@") trigger = "mention";
        else if (triggerChar === "/") trigger = "slash";

        const mk = (
            label: string,
            insert: string,
            group: "command" | "dataset" | "topic"
        ) => ({ label, insert, group });
        let suggestions: Array<{
            label: string;
            insert: string;
            group: "command" | "dataset" | "topic";
        }>;
        if (trigger === "slash") {
            const actions = [
                "flyTo",
                "easeTo",
                "filterLayer",
                "zoomToLayer",
                "toggleLayer",
            ];
            suggestions = actions
                .filter((a) => a.toLowerCase().includes(query.toLowerCase()))
                .map((a) => mk(`/${a}`, `${a} `, "command"));
        } else if (trigger === "mention") {
            const names = (layers || []).map((l) => l.name || "").filter(Boolean);
            suggestions = names
                .filter((n) => n.toLowerCase().includes(query.toLowerCase()))
                .map((n) => mk(`@dataset:${n}`, `${n}`, "dataset"));
        } else {
            const topics = [
                "ndvi",
                "style",
                "filter",
                "analysis",
                "geoserver",
                "arcgis",
            ];
            suggestions = topics
                .filter((t) => t.toLowerCase().includes(query.toLowerCase()))
                .map((t) => mk(`#${t}`, `${t}`, "topic"));
        }

        setCmdOpen(true);
        setCmdTrigger(trigger);
        setCmdQuery(query);
        setCmdSuggestions(suggestions.slice(0, 6));
        setCmdHighlight(0);
    };

    const applyCmdSuggestion = (s: {
        label: string;
        insert: string;
        group: "command" | "dataset" | "topic";
    }) => {
        const value = input || "";
        const m = value.match(/(^|[\s])([#@\/])([^\s]*)$/);
        if (!m) {
            setCmdOpen(false);
            return;
        }
        const lead = m[1] || "";
        const trigChar = m[2];
        const before = value.slice(0, m.index! + lead.length + trigChar.length);
        const newVal = `${before}${s.insert}`;
        handleInputChange({ target: { value: newVal } } as any);
        setCmdOpen(false);
    };

    function parseThinkTags(text: string) {
        const parts: Array<{ type: "think" | "answer"; content: string }> = [];

        // Split dulu berdasarkan tag pembuka <think>
        const segments = text.split("<think>");

        // Segment pertama pasti answer (sebelum <think> pertama)
        if (segments[0].trim()) {
            parts.push({ type: "answer", content: segments[0].trim() });
        }

        // Process segments sisanya (yang dimulai dari dalam <think>)
        for (let i = 1; i < segments.length; i++) {
            const segment = segments[i];

            // Cari closing tag </think>
            const closeIndex = segment.indexOf("</think>");

            if (closeIndex !== -1) {
                // Ada closing tag
                const thinkContent = segment.substring(0, closeIndex).trim();
                const afterThink = segment.substring(closeIndex + 8).trim();

                if (thinkContent) {
                    parts.push({ type: "think", content: thinkContent });
                }

                if (afterThink) {
                    parts.push({ type: "answer", content: afterThink });
                }
            } else {
                // Tidak ada closing tag (masih streaming atau malformed)
                if (segment.trim()) {
                    parts.push({ type: "think", content: segment.trim() });
                }
            }
        }

        return parts;
    }

    const statusMessage = {
        idle: "",
        thinking: "AI is analyzing your command...",
        building: "Building map layers...",
        done: "",
        failed: "Failed to process command. Please try again.",
    }[aiStatus];

    const tabs = ["Build", "Analyze", "Ask"];

    const suggestions: Record<string, string[]> = {
        Build: [
            "Create a style layer for NDVI Bogor raster using color gradients.",
            "Filter Centroids to show only points with fcode 'F001'.",
            "Generate a dashboard visualizing NDVI values across the district.",
        ],
        Analyze: [
            "Analyze trends in NDVI data over the past year.",
            "Compare NDVI values between different regions.",
            "Identify areas with declining vegetation coverage.",
        ],
        Ask: [
            "What is NDVI and how is it calculated?",
            "How can I improve data visualization quality?",
            "What are best practices for spatial data analysis?",
        ],
    };

    useEffect(() => {
        // if (status === "streaming" || isTyping) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        // }
    }, [messages, status, isTyping, selectedSession]);

    return (
        <div className="flex flex-col h-full bg-background to-muted/20">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-9 w-9 hover:bg-accent"
                        onClick={() => setShowSidebar((v) => !v)}
                    >
                        <Menu className="w-5 h-5" />
                    </Button>
                    <Popover open={sessionsOpen} onOpenChange={setSessionsOpen}>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                                <span>Chats</span>
                                <ChevronRight className="w-4 h-4" />
                                <span className="text-foreground font-semibold">
                                    {selectedSession?.title || "New chat"}
                                </span>
                                <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                            <div className="p-3 border-b flex items-center justify-between">
                                <span className="text-sm font-medium">Chat Sessions</span>
                                <Button size="sm" onClick={handleNewChat}>
                                    New
                                </Button>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {sessions.map((s) => (
                                    <div
                                        key={s.id}
                                        className={`w-full px-4 py-2 text-sm hover:bg-muted flex items-center justify-between ${selectedSession?.id === s.id ? "bg-muted" : ""
                                            }`}
                                    >
                                        <button
                                            className="flex items-center gap-2 flex-1 text-left"
                                            onClick={async () => {
                                                setSelectedSession(s);
                                                await fetchMessages(s.id);
                                                setSessionsOpen(false);
                                            }}
                                        >
                                            <Bot className="w-4 h-4" />
                                            <span className="truncate">
                                                {s.title || `Session #${s.id}`}
                                            </span>
                                        </button>
                                    </div>
                                ))}
                                {sessions.length === 0 && (
                                    <div className="px-4 py-3 text-sm text-muted-foreground">
                                        No sessions
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-9 w-9 hover:bg-accent"
                    onClick={handleNewChat}
                >
                    <Plus className="w-5 h-5" />
                </Button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div
                    className={`${showSidebar ? "w-full md:w-full block" : "hidden"
                        } border-r border-border/50`}
                >
                    <div className="p-3 space-y-3 h-full flex flex-col">
                        <div className="flex items-center gap-2">
                            <Input
                                value={sessionSearch}
                                onChange={(e) => setSessionSearch(e.target.value)}
                                placeholder="Search sessions"
                            />
                            <Button size="sm" onClick={handleNewChat}>
                                New
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {sessions
                                .filter((s) =>
                                    (s.title || `Session #${s.id}`)
                                        .toLowerCase()
                                        .includes(sessionSearch.toLowerCase())
                                )
                                .map((s) => (
                                    <div
                                        key={s.id}
                                        className={`w-full px-3 py-2 text-sm hover:bg-muted flex items-center justify-between ${selectedSession?.id === s.id ? "bg-muted" : ""
                                            }`}
                                    >
                                        <button
                                            className="flex items-center gap-2 flex-1 text-left"
                                            onClick={async () => {
                                                setSelectedSession(s);
                                                await fetchMessages(s.id);
                                            }}
                                        >
                                            <Bot className="w-4 h-4" />
                                            <div className="flex-1 min-w-0">
                                                <div className="truncate">
                                                    {s.title || `Session #${s.id}`}
                                                </div>
                                            </div>
                                        </button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <BiDotsVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-56" align="start">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const name = prompt(
                                                            "Rename session",
                                                            s.title || ""
                                                        );
                                                        if (name !== null) renameSession(s.id, name);
                                                    }}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteSession(s.id);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            {sessions.length === 0 && (
                                <div className="px-4 py-3 text-sm text-muted-foreground">
                                    No sessions
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div
                    ref={scrollContainerRef}
                    className={`flex-1 flex flex-col ${(
                        selectedSession
                            ? sessionMessages.length === 0
                            : messages.length === 0
                    )
                        ? "items-center justify-center"
                        : ""
                        } px-6 overflow-y-auto scroll-smooth`}
                >
                    {sessionMessages.length === 0 ? (
                        <div className="max-w-2xl w-full mx-auto text-center">
                            <div className="flex flex-col items-center justify-center gap-0 mb-8">
                                <div className="relative">
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
                                </div>
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent">
                                    What would you like to build?
                                </h1>
                                <p className="text-foreground text-lg">
                                    Use AI to create beautiful maps, understand data and automate
                                    processes
                                </p>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-8 mb-8 border-b border-border/50 justify-center">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-3 px-2 font-medium transition-all relative ${activeTab === tab
                                            ? "text-primary"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {tab}
                                        {activeTab === tab && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full"></div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Suggestions */}
                            <div className="space-y-3">
                                {suggestions[activeTab].map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="group w-full text-left px-5 py-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all text-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Sparkles className="w-4 h-4 text-primary mt-0.5 group-hover:rotate-12 transition-transform" />
                                            <span className="flex-1">{suggestion}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3 py-6 max-w-full mx-auto w-full text-sm">
                            {isFetchingMessages ? (
                                <div className="space-y-6">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className={`flex gap-4 ${i % 2 === 0 ? "flex-row-reverse" : "flex-row"}`}>
                                            <div className={`flex flex-col gap-2 max-w-[80%] ${i % 2 === 0 ? "items-end" : "items-start"}`}>
                                                <Skeleton className="w-full h-12" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {messages.map((message) => {
                                        const isUser = message.role === "user";
                                        return (
                                            <div key={message.id}>
                                                <div
                                                    className={`flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"
                                                        } animate-in fade-in slide-in-from-bottom-4 duration-300`}
                                                >
                                                    <div
                                                        className={`flex-1 max-w-full ${isUser ? "items-end" : "items-start"
                                                            } flex flex-col`}
                                                    >
                                                        {message.parts.map((part, index) => {
                                                            if (part.type === "text") {
                                                                const cleaned = part.text
                                                                    .replace(/```json([\s\S]*?)```/g, "")
                                                                    .replace(/```text([\s\S]*?)```/g, "")
                                                                    .replace(/::CMD::[\s\S]*?::ENDCMD::/g, "")
                                                                    .trim();
                                                                if (!cleaned) return null;
                                                                if (part.text.includes("<think>")) {
                                                                    const parsedParts = parseThinkTags(part.text);
                                                                    const isThinking =
                                                                        message.id ===
                                                                        messages[messages.length - 1].id &&
                                                                        status === "streaming";
                                                                    return (
                                                                        <>
                                                                            {parsedParts.map((parsed, idx) => {
                                                                                if (parsed.type === "think") {
                                                                                    return (
                                                                                        <Accordion
                                                                                            type="single"
                                                                                            key={`${index}-think-${idx}`}
                                                                                            collapsible
                                                                                            className="w-full mb-2 my-6"
                                                                                            defaultValue={
                                                                                                isThinking
                                                                                                    ? `item-${index}-${idx}`
                                                                                                    : ""
                                                                                            }
                                                                                        >
                                                                                            <AccordionItem
                                                                                                value={`item-${index}-${idx}`}
                                                                                                className="rounded-lg"
                                                                                            >
                                                                                                <AccordionTrigger className="flex justify-between items-center hover:no-underline px-6 py-1">
                                                                                                    <TextShimmer
                                                                                                        duration={isThinking ? 0.5 : 0}
                                                                                                        className={`text-xs font-medium ${isThinking
                                                                                                            ? "text-blue-500"
                                                                                                            : "text-muted-foreground"
                                                                                                            }`}
                                                                                                    >
                                                                                                        {isThinking
                                                                                                            ? "Thinking..."
                                                                                                            : "Thought"}
                                                                                                    </TextShimmer>
                                                                                                </AccordionTrigger>
                                                                                                <AccordionContent className="flex flex-col gap-4 text-balance px-6 overflow-auto text-xs text-justify">
                                                                                                    <p>{parsed.content}</p>
                                                                                                </AccordionContent>
                                                                                            </AccordionItem>
                                                                                        </Accordion>
                                                                                    );
                                                                                } else {
                                                                                    return (
                                                                                        <MessageBubble
                                                                                            key={`${index}-answer-${idx}`}
                                                                                            content={parsed.content}
                                                                                            isUser={isUser}
                                                                                        />
                                                                                    );
                                                                                }
                                                                            })}
                                                                        </>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <MessageBubble
                                                                            key={index}
                                                                            content={cleaned}
                                                                            isUser={isUser}
                                                                        />
                                                                    );
                                                                }
                                                            } else if (part.type === "tool-invocation") {
                                                                return (
                                                                    <Accordion
                                                                        type="single"
                                                                        key={index}
                                                                        collapsible
                                                                        className="w-full my-2"
                                                                        defaultValue={``}
                                                                    >
                                                                        <AccordionItem
                                                                            value={`item-${index}`}
                                                                            className="border border-foreground/10 rounded-lg"
                                                                        >
                                                                            <AccordionTrigger className="flex justify-between items-center hover:no-underline px-6 bg-background/50 rounded-lg">
                                                                                <h5 className="text-primary text-md font-bold capitalize flex items-center gap-2">
                                                                                    {part.toolInvocation.state === "call" ? (
                                                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                                                                                    ) : (
                                                                                        <CircleCheck className="w-5 h-5 text-white bg-blue-500 rounded-full" />
                                                                                    )}
                                                                                    {part.toolInvocation.toolName.replaceAll(
                                                                                        "_",
                                                                                        " "
                                                                                    )}{" "}
                                                                                </h5>
                                                                            </AccordionTrigger>

                                                                            <AccordionContent className="flex flex-col gap-4 text-balance p-3 overflow-auto">
                                                                                {part.toolInvocation.state === "call" ? (
                                                                                    <p>
                                                                                        Calling function{" "}
                                                                                        {part.toolInvocation.toolName.replaceAll(
                                                                                            "_",
                                                                                            " "
                                                                                        )}
                                                                                    </p>
                                                                                ) : (
                                                                                    <div className="flex flex-col gap-4">
                                                                                        <div>
                                                                                            <Label>Parameters : </Label>
                                                                                            <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">
                                                                                                {JSON.stringify(part.toolInvocation.args, null, 2)}
                                                                                            </pre>
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label>Result : </Label>
                                                                                            <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">
                                                                                                {Array.isArray(
                                                                                                    part.toolInvocation.state === "result"
                                                                                                        ? part.toolInvocation.result
                                                                                                        : undefined
                                                                                                ) ? (
                                                                                                    part.toolInvocation &&
                                                                                                        "result" in part.toolInvocation ? (
                                                                                                        part.toolInvocation.result.join(
                                                                                                            "\n"
                                                                                                        )
                                                                                                    ) : undefined
                                                                                                ) : (
                                                                                                    <p>
                                                                                                        {part.toolInvocation.state ===
                                                                                                            "result"
                                                                                                            ? (part.toolInvocation as any)
                                                                                                                .result
                                                                                                            : ""}
                                                                                                    </p>
                                                                                                )}
                                                                                            </pre>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </AccordionContent>
                                                                        </AccordionItem>
                                                                    </Accordion>
                                                                );
                                                            }
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            {status === "streaming" && (
                <TextShimmer
                    duration={1}
                    className="text-sm font-medium mb-2 text-blue-500 dark:text-blue-500 text-center w-full"
                >
                    {statusMessage}
                </TextShimmer>
            )}

            {error && (
                <div className="px-4 pb-2">
                    <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription className="text-xs">
                            {error}
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm p-4 sticky bottom-0">
                <div className="max-w-4xl mx-auto">
                    <div className="relative group">
                        <Textarea
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask me anything, @ for mentions, / for commands"
                            className="w-full px-5 py-4 pr-14 rounded-2xl border-2 border-border/50 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 resize-none transition-all shadow-sm hover:shadow-md bg-background/50 backdrop-blur-sm"
                            rows={1}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = "auto";
                                target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                                updateCommandMenu(target.value);
                            }}
                            onKeyDown={(e) => {
                                if (cmdOpen) {
                                    if (e.key === "ArrowDown") {
                                        e.preventDefault();
                                        setCmdHighlight((i) =>
                                            Math.min(i + 1, Math.max(cmdSuggestions.length - 1, 0))
                                        );
                                        return;
                                    }
                                    if (e.key === "ArrowUp") {
                                        e.preventDefault();
                                        setCmdHighlight((i) => Math.max(i - 1, 0));
                                        return;
                                    }
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        if (cmdSuggestions[cmdHighlight]) {
                                            applyCmdSuggestion(cmdSuggestions[cmdHighlight]);
                                        }
                                        return;
                                    }
                                    if (e.key === "Escape") {
                                        e.preventDefault();
                                        setCmdOpen(false);
                                        return;
                                    }
                                }
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                        {cmdOpen && cmdSuggestions.length > 0 && (
                            <div className="absolute left-4 right-14 bottom-14 bg-background border border-border/50 rounded-xl shadow-lg overflow-hidden z-20">
                                <div className="max-h-48 overflow-auto py-2">
                                    {cmdSuggestions.map((s, i) => {
                                        const prevGroup =
                                            i > 0 ? cmdSuggestions[i - 1].group : null;
                                        const showHeader = i === 0 || s.group !== prevGroup;
                                        const groupTitle =
                                            s.group === "command"
                                                ? "Commands"
                                                : s.group === "dataset"
                                                    ? "Datasets"
                                                    : "Topics";
                                        return (
                                            <div key={`${s.label}-${i}`}>
                                                {showHeader && (
                                                    <div className="px-4 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70 bg-muted/40">
                                                        {groupTitle}
                                                    </div>
                                                )}
                                                <button
                                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${i === cmdHighlight
                                                        ? "bg-accent text-foreground"
                                                        : "hover:bg-muted"
                                                        }`}
                                                    onMouseDown={(ev) => {
                                                        ev.preventDefault();
                                                        applyCmdSuggestion(s);
                                                    }}
                                                >
                                                    {s.label}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <Button
                            onClick={status === "streaming" ? handleStop : handleSubmit}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl transition-all shadow-md ${status === "streaming"
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-background/50"
                                } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95`}
                            disabled={!input.trim() && status !== "streaming"}
                            size="icon"
                        >
                            {status === "streaming" ? (
                                <StopCircle className="w-5 h-5 text-white" />
                            ) : (
                                <Send className="w-5 h-5 text-foreground" />
                            )}
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center mt-3">
                        Press{" "}
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd>{" "}
                        to send,{" "}
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">
                            Shift + Enter
                        </kbd>{" "}
                        for new line
                    </p>
                </div>
            </div>
        </div>
    );
}

interface CodeBlockProps {
    language: string;
    value: string;
    className?: string;
}

export default function CodeBlock({
    language,
    value,
    className,
}: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const extractedLanguage = className
        ? className.replace("language-", "")
        : language;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <div className="relative rounded-xl overflow-hidden my-4 shadow-lg">
            <div className="flex items-center justify-between bg-gradient-to-r from-zinc-800 to-zinc-900 px-4 py-2.5 text-xs text-zinc-100">
                <span className="font-mono font-medium">
                    {extractedLanguage || "code"}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-100 hover:bg-zinc-700 rounded-lg transition-all"
                    onClick={copyToClipboard}
                >
                    {copied ? (
                        <Check className="h-4 w-4 text-green-400" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                </Button>
            </div>
            <SyntaxHighlighter
                language={extractedLanguage || "text"}
                style={atomDark}
                customStyle={{
                    margin: 0,
                    padding: "1.25rem",
                    borderRadius: 0,
                    fontSize: "0.875rem",
                }}
            >
                {value}
            </SyntaxHighlighter>
        </div>
    );
}
