"use client";

import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
// import { ScrollArea } from "@/components/ui/scroll-area"
import useLayerStore from "@/stores/layer";
import {
  Check,
  CheckIcon,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  Fullscreen,
  ImageIcon,
  Plus,
  ScanSearch,
  Send,
  SendIcon,
  StopCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import "../../../app/css/markdownStyle.css";
import { Textarea } from "../textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

interface ChatWithAIProps {
  title?: string;
  placeholder?: string;
  className?: string;
  onCommandReceived?: (command: string | Record<string, any>) => void;
}

export function ChatWithAI({
  title = "Chat with Truenapsh Ai",
  placeholder = "Type your message...",
  className = "",
  onCommandReceived,
}: ChatWithAIProps) {
  const { layers } = useLayerStore();
  const [activeTab, setActiveTab] = useState("Build");
  const [error, setError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<
    "idle" | "thinking" | "building" | "done" | "failed"
  >("idle");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

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
      {
        id: "f236ca1c-1bf8-43ee-9494-a9f71729b85c",
        role: "user",
        content: "Buatkan saya clipping bangunan yang didalamnya ada ndvi",
      },
      {
        id: "80f15df8-2468-44eb-95a9-104c5afd9675",
        role: "assistant",
        content:
          "Maksud Anda perlu diperjelas sedikit:\n\nAnda ingin:\n- **Memotong (clip) dataset bangunan** menggunakan **batas raster NDVI**, atau  \n- **Mengambil bangunan yang berada di area tertentu berdasarkan nilai NDVI** (misal NDVI > 0.3), atau  \n- **Membuat potongan raster NDVI di dalam setiap bangunan**?\n\nPilih salah satu agar saya bisa langsung buatkan clipp‑ingnya.",
      },
      {
        id: "b9ada576-d009-4b73-8657-181e6e67eb41",
        role: "user",
        content: "Ya yang pertama",
      },
      {
        id: "f0f112b1-33a7-4c87-ab28-da1f0a4deabf",
        role: "assistant",
        content:
          "I encountered an issue processing your request. Please try rephrasing your request or contact support if this continues.",
      },
      {
        id: "25cab741-fc04-4dde-bf46-e3fc44e5ce43",
        role: "user",
        content: "buatkan ndvi di kota bogor",
      },
      {
        id: "036a1a26-1b2a-405c-b28c-bee5a4b800d9",
        role: "assistant",
        content:
          "NDVI untuk Kota Bogor **sudah ada** di proyek Anda dalam dua dataset berikut:\n\n- `dataset:39a10dd9-4018-44c1-a2d9-6c0710808641` → **NDVI Bogor**\n- `dataset:d9a33426-1dc8-4dfe-acbb-be874a4ca62b` → **NDVI**\n\nKalau yang Anda maksud adalah **membuat ulang NDVI Kota Bogor dari citra mentah (NIR & Red)**, saya bisa bangunkan workflow‑nya.  \nTapi saya perlu **1 hal** dulu:\n\n**Dataset mana yang merupakan citra mentah (Red + NIR) Kota Bogor?**  \nPilih salah satu:\n\n`option:use_existing_ndvi:Pakai NDVI Bogor yang sudah ada`  \n`option:make_new_ndvi:Hitung NDVI baru dari citra mentah (sebutkan datasetnya)`",
      },
      {
        id: "edf7a81e-dc45-4100-a1e3-4fee6d66fa97",
        role: "user",
        content: "buat ndvi baru di kota bogor",
      },
      {
        id: "7df71e8c-6b88-4019-b9ec-dc37971576f0",
        role: "assistant",
        content:
          "Baik, saya bisa buat NDVI baru — tapi saya **perlu tahu dulu dataset citra mentahnya** (yang berisi band **Red** dan **NIR**).\n\nDi proyek Anda **belum ada** dataset raster dengan beberapa band Red/NIR. NDVI hanya bisa dihitung kalau ada citra multispektral tersebut.\n\nPilih salah satu:\n\n`option:sebutkan_dataset:Saya punya dataset Red/NIR, saya sebutkan namanya`  \n`option:tidak_ada:Belum ada citra Red/NIR, bantu saya siapkan datanya`",
      },
      {
        id: "b8d7f025-8969-44e7-8664-1a7fb5127f10",
        role: "user",
        content: "Saya punya dataset Red/NIR, saya sebutkan namanya",
      },
      {
        id: "fb987437-afa3-47e3-b943-e2237fcc9db1",
        role: "assistant",
        content:
          "Silakan sebutkan **nama dataset** yang berisi band **Red** dan **NIR** agar saya bisa langsung membuat NDVI baru untuk Kota Bogor.",
      },
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

  const shimmer =
    "before:content-[''] before:absolute before:inset-0 before:animate-pulse before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:rounded";

  const statusMessage = {
    idle: "",
    thinking: "🧠 AI is analyzing your command...",
    building: "🗺️ Building map layers...",
    done: "",
    failed: "⚠️ Failed to process command. Please try again.",
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="font-medium">Chats</span>
            <ChevronRight className="w-4 h-4 " />
            <span className="font-medium">New chat</span>
            <ChevronDown className="w-4 h-4  ml-1" />
          </div>
          <button className="p-1 hover:bg-accent rounded">
            <Plus className="w-5 h-5 " />
          </button>
        </div>

        <div
          className={`flex-1 flex flex-col ${
            messages.length === 0 ? "items-center justify-center" : ""
          } px-6 overflow-y-auto`}
        >
          {messages.length === 0 ? (
            <div className="max-w-md w-full mx-auto text-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <div>
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
                <h1 className="text-2xl font-semibold mb-3">
                  What would you like to build?
                </h1>

                <p className="mb-8">
                  Use AI to create beautiful maps, understand data and automate
                  processes
                </p>
              </div>

              <div className="flex gap-6 mb-6 border-b border-border">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 px-1 font-medium transition-colors relative ${
                      activeTab === tab ? "text-primary" : "hover:"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {suggestions[activeTab].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-border hover:bg-accent transition-colors text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((m) => {
                const cleaned = m.content
                  .replace(/```json([\s\S]*?)```/g, "")
                  .replace(/```text([\s\S]*?)```/g, "")
                  .replace(/::CMD::[\s\S]*?::ENDCMD::/g, "")
                  .trim();
                if (!cleaned) return null;

                return (
                  <div
                    key={m.id}
                    className={`mb-4 w-full mt-5 ${
                      m.role === "user" ? "text-right " : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block p-2 max-w-full md:max-w-2xl rounded-lg break-words text-sm ${
                        m.role === "user" ? "bg-blue-500 text-white rounded-br-none" : ""
                      }`}
                    >
                      <div className="">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({
                              node,
                              inline,
                              className,
                              children,
                              ...props
                            }) {
                              const langMatch = /language-(\w+)/.exec(
                                className || ""
                              );
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

                              // Render dataset/option tag
                              if (
                                text.includes("dataset:") ||
                                text.includes("option:")
                              ) {
                                const [key] = text.split("→");
                                const type = text.split(":")[0];
                                const label =
                                  type == "option" ? text.split(":")[2] : type;
                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="my-5 border border-blue-400 rounded-sm py-1 px-2 bg-gradient-to-tr from-blue-500/5 to-transparent text-foreground capitalize">
                                        <ImageIcon className="w-4 h-4 inline mr-1 text-blue-400" />
                                        {label}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="bottom"
                                      sideOffset={4}
                                      className="bg-background border"
                                    >
                                      {type === "dataset" ? (
                                        <div className="flex gap-3">
                                          <Button
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-1"
                                          >
                                            <Eye className="w-4 h-4 text-foreground" />
                                          </Button>
                                          <Button
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-1"
                                          >
                                            <ScanSearch className="w-4 h-4 text-foreground" />
                                          </Button>
                                          <Button
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-1"
                                          >
                                            <SendIcon className="w-4 h-4 text-foreground" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button
                                          variant="link"
                                          size="sm"
                                          className="h-auto p-1"
                                        >
                                          <CheckIcon className="w-4 h-4 text-foreground" />
                                        </Button>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              }

                              // Default inline code
                              return (
                                <code
                                  className={
                                    inline
                                      ? "px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded"
                                      : ""
                                  }
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                            ul({ children }) {
                              return (
                                <ul className="list-disc pl-5 space-y-1">
                                  {children}
                                </ul>
                              );
                            },
                            ol({ children }) {
                              return (
                                <ol className="list-decimal pl-5 space-y-1">
                                  {children}
                                </ol>
                              );
                            },
                            li({ children }) {
                              return (
                                <li className="leading-relaxed my-2">
                                  {children}
                                </li>
                              );
                            },
                            p({ children }) {
                              return (
                                <p className="leading-relaxed">{children}</p>
                              );
                            },
                          }}
                        >
                          {cleaned}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Ask me anything, @ for mentions, / for commands"
                className="w-full px-4 py-3 pr-12 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <Button
                onClick={status === "streaming" ? handleStop : handleSubmit}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!input.trim() && status !== "streaming"}
                variant="link"
              >
                {status === "streaming" ? (
                  <StopCircle className="w-5 h-5" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
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
    <div className="relative rounded-md overflow-hidden my-2">
      <div className="flex items-center justify-between bg-zinc-800 px-4 py-1.5 text-xs text-zinc-100">
        <span>{extractedLanguage || "code"}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-100 hover:bg-zinc-700"
          onClick={copyToClipboard}
        >
          {copied ? (
            <Check className="h-4 w-4" />
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
          padding: "1rem",
          borderRadius: 0,
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
