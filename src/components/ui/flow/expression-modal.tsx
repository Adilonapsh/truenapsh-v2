import React, { useState, useEffect, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ExpressionEditor } from "./expression-editor";
import { evaluateExpression } from "@/tools/expression-evaluator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ChevronRight, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ExpressionModalProps {
    isOpen: boolean;
    onClose: () => void;
    value: string;
    onChange: (value: string) => void;
    nodes: any[];
    inputData?: any;
    fieldName: string;
}

export const ExpressionModal: React.FC<ExpressionModalProps> = ({
    isOpen,
    onClose,
    value,
    onChange,
    nodes,
    inputData,
    fieldName,
}) => {
    const [previewResult, setPreviewResult] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const nodesContext = useMemo(() => {
        const ctx: Record<string, any> = {};
        nodes.forEach((n) => {
            ctx[n.id] = n.data?.output || {};
        });
        return ctx;
    }, [nodes]);

    useEffect(() => {
        if (isOpen) {
            try {
                const result = evaluateExpression(value, {
                    input: inputData,
                    nodes: nodesContext,
                });
                setPreviewResult(result);
            } catch (err) {
                setPreviewResult(`[Error: ${err instanceof Error ? err.message : String(err)}]`);
            }
        }
    }, [value, inputData, nodesContext, isOpen]);

    const filteredNodes = nodes.filter(n =>
        n.data?.parameters?.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] w-[1200px] h-[85vh] p-0 flex flex-col gap-0 overflow-hidden bg-background border-border shadow-2xl">
                <DialogHeader className="p-4 border-b flex-row items-center justify-between space-y-0">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
                            <Play size={18} />
                        </div>
                        Expression Editor: <span className="text-muted-foreground font-normal">{fieldName}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Variables and Context */}
                    <div className="w-[300px] border-r border-border bg-muted/20 flex flex-col">
                        <div className="p-3 border-b bg-background/50">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search variables..."
                                    className="pl-8 h-9 text-xs"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-3 space-y-4">
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                                        <ChevronRight size={10} /> Workflow Input
                                    </h4>
                                    <div className="space-y-1">
                                        <VariableItem label="$input" payload="{{$input}}" detail="Current node input" />
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                                        <ChevronRight size={10} /> Upstream Nodes
                                    </h4>
                                    <div className="space-y-1">
                                        {filteredNodes.map(node => (
                                            <VariableItem
                                                key={node.id}
                                                label={node.data?.parameters?.label || node.id}
                                                payload={`{{$nodes["${node.id}"].data}}`}
                                                detail={`Node ID: ${node.id.slice(0, 8)}...`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Middle Panel: Code Editor */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="p-2 border-b bg-muted/10 flex items-center justify-between">
                            <span className="text-[10px] font-medium text-muted-foreground">EXPRESSION</span>
                            <Badge variant="outline" className="text-[10px] h-5 font-mono">JavaScript</Badge>
                        </div>
                        <div className="flex-1 relative overflow-auto bg-background">
                            <ExpressionEditor
                                value={value}
                                onChange={onChange}
                                placeholder="{{ expression }}"
                                className="h-full"
                            />
                        </div>
                    </div>

                    {/* Right Panel: Preview Result */}
                    <div className="w-[350px] border-l border-border bg-muted/20 flex flex-col">
                        <div className="p-2 border-b bg-muted/10 flex items-center justify-between">
                            <span className="text-[10px] font-medium text-muted-foreground">RESULT PREVIEW</span>
                            <div className="flex items-center gap-1">
                                {typeof previewResult === 'string' && previewResult.startsWith('[Error:') ? (
                                    <Badge variant="destructive" className="h-5 text-[10px] gap-1 px-1.5">
                                        <AlertCircle size={10} /> Error
                                    </Badge>
                                ) : (
                                    <Badge variant="default" className="h-5 text-[10px] bg-green-500/20 text-green-600 border-green-500/30 gap-1 px-1.5 hover:bg-green-500/20">
                                        <CheckCircle2 size={10} /> Valid
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <ScrollArea className="flex-1 bg-background/50">
                            <div className="p-4">
                                <pre className="text-xs font-mono whitespace-pre-wrap break-words text-foreground selection:bg-primary/20">
                                    {typeof previewResult === 'object'
                                        ? JSON.stringify(previewResult, null, 2)
                                        : String(previewResult ?? 'undefined')}
                                </pre>
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <div className="p-3 border-t bg-muted/30 flex justify-between items-center">
                    <p className="text-[10px] text-muted-foreground">
                        Drag variables from the left or press <kbd className="px-1 py-0.5 rounded border bg-background text-[9px]">Ctrl+Space</kbd> for autocomplete.
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const VariableItem = ({ label, payload, detail }: { label: string, payload: string, detail: string }) => {
    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData("application/variable", payload);
                e.dataTransfer.effectAllowed = "move";
            }}
            className="group p-2 rounded-md hover:bg-primary/5 border border-transparent hover:border-primary/20 cursor-grab active:cursor-grabbing transition-all overflow-hidden"
        >
            <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold truncate text-foreground group-hover:text-primary transition-colors">{label}</span>
                <Badge variant="secondary" className="text-[9px] px-1 h-4 bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">VAR</Badge>
            </div>
            <div className="text-[9px] text-muted-foreground group-hover:text-muted-foreground/80 truncate font-mono">{detail}</div>
        </div>
    );
};
