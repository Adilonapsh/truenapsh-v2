"use client";

import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState, memo } from "react";
import useLayerStore from "@/stores/layer";
import {
  Check,
  CheckIcon,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  ImageIcon,
  Plus,
  ScanSearch,
  Send,
  SendIcon,
  StopCircle,
  Sparkles,
  Bot,
  User,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import "../../../app/css/markdownStyle.css";
import { Textarea } from "../textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { TextShimmer } from "../text-shimmer";

interface ChatWithAIProps {
  title?: string;
  placeholder?: string;
  className?: string;
  onCommandReceived?: (command: string | Record<string, any>) => void;
  commandProgress?: {
    status: 'idle' | 'start' | 'running' | 'success' | 'error';
    action?: string;
    step?: string;
    progress?: number;
  };
}

// Memoized Message Component to prevent unnecessary re-renders
const MessageBubble = memo(({ content, isUser }: { content: string; isUser: boolean }) => {
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
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ScanSearch className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <SendIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
});

MessageBubble.displayName = "MessageBubble";

export function ChatWithAI({
  title = "Chat with Truenapsh Ai",
  placeholder = "Type your message...",
  className = "",
  onCommandReceived,
  commandProgress,
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
  const [animatedMessages, setAnimatedMessages] = useState<Set<string>>(new Set());

  // Command dropdown state
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdTrigger, setCmdTrigger] = useState<'hash' | 'mention' | 'slash' | null>(null);
  const [cmdQuery, setCmdQuery] = useState("");
  const [cmdSuggestions, setCmdSuggestions] = useState<Array<{ label: string; insert: string }>>([]);
  const [cmdHighlight, setCmdHighlight] = useState(0);

  const {
    messages,
    input,
    handleInputChange,
    isLoading,
    append,
    stop,
    status,
  } = useChat({
    api: "/api/ai-chat",
    body: {
      layers: layers,
      tools: "map",
    },
    initialMessages: [
      // {
      //   id: "f236ca1c-1bf8-43ee-9494-a9f71729b85c",
      //   role: "user",
      //   content: "Buatkan saya clipping bangunan yang didalamnya ada ndvi",
      // },
      // {
      //   id: "80f15df8-2468-44eb-95a9-104c5afd9675",
      //   role: "assistant",
      //   content:
      //     "Maksud Anda perlu diperjelas sedikit:\n\nAnda ingin:\n- **Memotong (clip) dataset bangunan** menggunakan **batas raster NDVI**, atau  \n- **Mengambil bangunan yang berada di area tertentu berdasarkan nilai NDVI** (misal NDVI > 0.3), atau  \n- **Membuat potongan raster NDVI di dalam setiap bangunan**?\n\nPilih salah satu agar saya bisa langsung buatkan clipp‑ingnya.",
      // },
      // {
      //   id: "b9ada576-d009-4b73-8657-181e6e67eb41",
      //   role: "user",
      //   content: "Ya yang pertama",
      // },
      // {
      //   id: "f0f112b1-33a7-4c87-ab28-da1f0a4deabf",
      //   role: "assistant",
      //   content:
      //     "I encountered an issue processing your request. Please try rephrasing your request or contact support if this continues.",
      // },
      // {
      //   id: "25cab741-fc04-4dde-bf46-e3fc44e5ce43",
      //   role: "user",
      //   content: "buatkan ndvi di kota bogor",
      // },
      // {
      //   id: "036a1a26-1b2a-405c-b28c-bee5a4b800d9",
      //   role: "assistant",
      //   content:
      //     "NDVI untuk Kota Bogor **sudah ada** di proyek Anda dalam dua dataset berikut:\n\n- `dataset:39a10dd9-4018-44c1-a2d9-6c0710808641` → **NDVI Bogor**\n- `dataset:d9a33426-1dc8-4dfe-acbb-be874a4ca62b` → **NDVI**\n\nKalau yang Anda maksud adalah **membuat ulang NDVI Kota Bogor dari citra mentah (NIR & Red)**, saya bisa bangunkan workflow‑nya.  \nTapi saya perlu **1 hal** dulu:\n\n**Dataset mana yang merupakan citra mentah (Red + NIR) Kota Bogor?**  \nPilih salah satu:\n\n`option:use_existing_ndvi:Pakai NDVI Bogor yang sudah ada`  \n`option:make_new_ndvi:Hitung NDVI baru dari citra mentah (sebutkan datasetnya)`",
      // },
      // {
      //   id: "edf7a81e-dc45-4100-a1e3-4fee6d66fa97",
      //   role: "user",
      //   content: "buat ndvi baru di kota bogor",
      // },
      // {
      //   id: "7df71e8c-6b88-4019-b9ec-dc37971576f0",
      //   role: "assistant",
      //   content:
      //     "Baik, saya bisa buat NDVI baru — tapi saya **perlu tahu dulu dataset citra mentahnya** (yang berisi band **Red** dan **NIR**).\n\nDi proyek Anda **belum ada** dataset raster dengan beberapa band Red/NIR. NDVI hanya bisa dihitung kalau ada citra multispektral tersebut.\n\nPilih salah satu:\n\n`option:sebutkan_dataset:Saya punya dataset Red/NIR, saya sebutkan namanya`  \n`option:tidak_ada:Belum ada citra Red/NIR, bantu saya siapkan datanya`",
      // },
      // {
      //   id: "b8d7f025-8969-44e7-8664-1a7fb5127f10",
      //   role: "user",
      //   content: "Saya punya dataset Red/NIR, saya sebutkan namanya",
      // },
      // {
      //   id: "fb987437-afa3-47e3-b943-e2237fcc9db1",
      //   role: "assistant",
      //   content:
      //     "Silakan sebutkan **nama dataset** yang berisi band **Red** dan **NIR** agar saya bisa langsung membuat NDVI baru untuk Kota Bogor.",
      // },
    ],
    onResponse: () => {
      setIsTyping(true);
      setAiStatus("thinking");
    },
    onFinish: (message) => {
      setIsTyping(false);
      if (message?.role === "assistant" && message.content) {
        executeCommands(message.content);
      }
      setAiStatus("done");
    },
  });

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (!animatedMessages.has(lastMessage.id)) {
        setAnimatedMessages(new Set([...animatedMessages, lastMessage.id]));
      }
    }
  }, [messages.length]);

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
    handleInputChange({
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>);
    if (!input.trim()) return;
    try {
      await append({ content: input, role: "user" });
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
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
    let trigger: 'hash' | 'mention' | 'slash' | null = null;
    if (triggerChar === '#') trigger = 'hash';
    else if (triggerChar === '@') trigger = 'mention';
    else if (triggerChar === '/') trigger = 'slash';

    const mk = (label: string, insert: string) => ({ label, insert });
    let suggestions: Array<{ label: string; insert: string }>;
    if (trigger === 'slash') {
      const actions = ['flyTo', 'easeTo', 'filterLayer', 'zoomToLayer', 'toggleLayer'];
      suggestions = actions
        .filter(a => a.toLowerCase().includes(query.toLowerCase()))
        .map(a => mk(`/${a}`, `${a} `));
    } else if (trigger === 'mention') {
      const names = (layers || []).map(l => l.name || '').filter(Boolean);
      suggestions = names
        .filter(n => n.toLowerCase().includes(query.toLowerCase()))
        .map(n => mk(`@${n}`, `${n}`));
    } else {
      const topics = ['ndvi', 'style', 'filter', 'analysis', 'geoserver', 'arcgis'];
      suggestions = topics
        .filter(t => t.toLowerCase().includes(query.toLowerCase()))
        .map(t => mk(`#${t}`, `${t}`));
    }

    setCmdOpen(true);
    setCmdTrigger(trigger);
    setCmdQuery(query);
    setCmdSuggestions(suggestions.slice(0, 6));
    setCmdHighlight(0);
  };

  const applyCmdSuggestion = (s: { label: string; insert: string }) => {
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
    if (status === "streaming" || isTyping) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, status, isTyping]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="hover:text-foreground transition-colors cursor-pointer">Chats</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-semibold">New chat</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
        </div>
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-accent">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 flex flex-col ${messages.length === 0 ? "items-center justify-center" : ""
          } px-6 overflow-y-auto scroll-smooth`}
      >
        {messages.length === 0 ? (
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
                Use AI to create beautiful maps, understand data and automate processes
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
          <div className="space-y-6 py-6 max-w-4xl mx-auto w-full text-sm">
            {messages.map((m, idx) => {
              const cleaned = m.content
                .replace(/```json([\s\S]*?)```/g, "")
                .replace(/```text([\s\S]*?)```/g, "")
                .replace(/::CMD::[\s\S]*?::ENDCMD::/g, "")
                .trim();
              if (!cleaned) return null;

              const isUser = m.role === "user";
              const isLastMessage = idx === messages.length - 1;
              const isStreaming = isLastMessage && status === "streaming";
              const shouldAnimate = !animatedMessages.has(m.id);

              return (
                <div key={m.id}>
                  <div className={`flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"} ${shouldAnimate && !isStreaming ? "animate-in fade-in slide-in-from-bottom-4 duration-300" : ""}`}
                  >

                    {status === "streaming" && (
                      <TextShimmer
                        duration={1.2}
                        className="text-xs font-medium mb-2 text-foreground/80 dark:text-foreground/80"
                      >
                        {statusMessage}
                      </TextShimmer>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`flex-1 max-w-[85%] ${isUser ? "items-end" : "items-start"
                        } flex flex-col`}
                    >
                      <MessageBubble content={cleaned} isUser={isUser} />
                    </div>
                  </div>
                </div>
              );
            })}



            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
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
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setCmdHighlight((i) => Math.min(i + 1, Math.max(cmdSuggestions.length - 1, 0)));
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setCmdHighlight((i) => Math.max(i - 1, 0));
                    return;
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (cmdSuggestions[cmdHighlight]) {
                      applyCmdSuggestion(cmdSuggestions[cmdHighlight]);
                    }
                    return;
                  }
                  if (e.key === 'Escape') {
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
                  {cmdSuggestions.map((s, i) => (
                    <button
                      key={`${s.label}-${i}`}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${i === cmdHighlight ? 'bg-accent text-foreground' : 'hover:bg-muted'}`}
                      onMouseDown={(ev) => {
                        ev.preventDefault();
                        applyCmdSuggestion(s);
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button
              onClick={status === "streaming" ? handleStop : handleSubmit}
              className={`absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl transition-all shadow-md ${status === "streaming"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-foreground"
                } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95`}
              disabled={!input.trim() && status !== "streaming"}
              size="icon"
            >
              {status === "streaming" ? (
                <StopCircle className="w-5 h-5 text-white" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3">
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send,{" "}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Shift + Enter</kbd> for new line
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
        <span className="font-mono font-medium">{extractedLanguage || "code"}</span>
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