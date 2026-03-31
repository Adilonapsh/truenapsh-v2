import React, { useState, useEffect, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ChevronRight, Code, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

interface CodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    value: string;
    onChange: (value: string) => void;
    nodes: any[];
    inputData?: any;
    fieldName: string;
}

export const CodeModal: React.FC<CodeModalProps> = ({
    isOpen,
    onClose,
    value,
    onChange,
    nodes,
    inputData,
    fieldName,
}) => {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredNodes = nodes.filter(n =>
        n.data?.parameters?.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] w-[1200px] h-[85vh] p-0 flex flex-col gap-0 overflow-hidden bg-background border-border shadow-2xl">
                <div className="sr-only">
                    <DialogTitle>JavaScript Code Editor</DialogTitle>
                    <DialogDescription>
                        Configure custom JavaScript for {fieldName}
                    </DialogDescription>
                </div>

                <div className="px-4 py-3 border-b bg-background flex items-center gap-3 shrink-0">
                    <div className="bg-yellow-500/10 p-2 rounded-lg text-yellow-500 shrink-0">
                        <Code size={18} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-base font-bold tracking-tight">
                            JavaScript Editor
                        </h2>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                            Configure custom script for <span className="font-medium text-foreground">{fieldName}</span>
                        </p>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Variables and Documentation */}
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
                                        <ChevronRight size={10} /> Runtime Context
                                    </h4>
                                    <div className="space-y-1">
                                        <VariableItem label="data" payload="data" detail="Primary node input" />
                                        <VariableItem label="turf" payload="turf" detail="Turf.js library" />
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
                                                payload={`nodes["${node.id}"]`}
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
                            <span className="text-[10px] font-medium text-muted-foreground">JAVASCRIPT SOURCE</span>
                            <Badge variant="outline" className="text-[10px] h-5 font-mono">JS</Badge>
                        </div>
                        <div className="flex-1 relative overflow-auto bg-[#1e1e1e]">
                            <CodeMirror
                                value={value}
                                onChange={onChange}
                                theme={oneDark}
                                extensions={[
                                    javascript({ jsx: true }),
                                    EditorView.domEventHandlers({
                                        drop(event, view) {
                                            const variablePayload = event.dataTransfer?.getData("application/variable");
                                            const textPayload = event.dataTransfer?.getData("text/plain");
                                            let payload = variablePayload || textPayload;

                                            if (payload) {
                                                event.preventDefault();
                                                // Convert expression-style payload {{ $nodes["ID"].data.path }} to nodes["ID"].data.path
                                                // and {{ $input.path }} to data.path
                                                if (payload.startsWith("{{") && payload.endsWith("}}")) {
                                                    payload = payload.slice(2, -2).trim();
                                                    if (payload.startsWith("$nodes")) {
                                                        payload = payload.replace("$nodes", "nodes");
                                                    } else if (payload.startsWith("$input")) {
                                                        payload = payload.replace("$input", "data");
                                                    }
                                                }

                                                // Insert at cursor position
                                                const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
                                                if (pos !== null) {
                                                    view.dispatch({
                                                        changes: { from: pos, insert: payload },
                                                        selection: { anchor: pos + payload.length }
                                                    });
                                                } else {
                                                    const length = view.state.doc.length;
                                                    view.dispatch({
                                                        changes: { from: length, insert: payload },
                                                        selection: { anchor: length + payload.length }
                                                    });
                                                }
                                                return true;
                                            }
                                            return false;
                                        },
                                        dragover(event) {
                                            if (
                                                event.dataTransfer?.types.includes("application/variable") ||
                                                event.dataTransfer?.types.includes("text/plain")
                                            ) {
                                                event.preventDefault();
                                                return true;
                                            }
                                            return false;
                                        }
                                    })
                                ]}
                                className="h-full text-sm"
                                height="100%"
                                basicSetup={{
                                    lineNumbers: true,
                                    foldGutter: true,
                                    highlightActiveLine: true,
                                    crosshairCursor: true,
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-3 border-t bg-muted/30 flex justify-between items-center">
                    <p className="text-[10px] text-muted-foreground">
                        Available variables: <code className="text-primary">data</code>, <code className="text-primary">nodes</code>, <code className="text-primary">turf</code>. Return a value at the end.
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
                e.dataTransfer.setData("text/plain", payload);
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
