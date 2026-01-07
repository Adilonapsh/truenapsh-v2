import React from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { KeyValueList } from "./key-value-list";
import { SettingInput } from "./settings-config";
import { cn } from "@/lib/utils";
import { ExpressionEditor } from "./expression-editor";
import { ExpressionModal } from "./expression-modal";
import { Maximize2, Trash2 } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { evaluateExpression } from "@/tools/expression-evaluator";

interface SettingFieldProps {
    input: SettingInput;
    value: any;
    parameters: Record<string, any>;
    onChange: (value: any, id: string) => void;
    onRemove?: (id: string) => void;
    layerOptions: { label: string; value: string }[];
    updateNodeProperties: (data: object) => void;
}

const ToggleButton = ({
    active,
    onClick,
    children
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode
}) => (
    <button
        onClick={onClick}
        className={cn(
            "px-2 py-0.3 text-[10px] rounded border transition-all duration-200 semibold",
            active
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/50 text-muted-foreground border-transparent hover:border-muted-foreground/20"
        )}
    >
        {children}
    </button>
);

export const SettingField: React.FC<SettingFieldProps> = ({
    input,
    value,
    parameters,
    onChange,
    onRemove,
    layerOptions,
    updateNodeProperties,
}) => {
    const isOptional = input.isOptional;
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const { getNodes } = useReactFlow();

    const allNodes = getNodes();

    const nodesContext = React.useMemo(() => {
        const ctx: Record<string, any> = {};
        allNodes.forEach((n: any) => {
            ctx[n.id] = n.data?.output || {};
        });
        return ctx;
    }, [allNodes]);

    const resultPreview = React.useMemo(() => {
        if (!parameters._expressions?.[input.id]) return null;
        try {
            return evaluateExpression(value, {
                input: parameters,
                nodes: nodesContext,
            });
        } catch (e) {
            return null;
        }
    }, [value, parameters, input.id, nodesContext]);

    const renderInputControl = () => {
        const isExpression = !!parameters._expressions?.[input.id];

        switch (input.type) {
            case "text":
            case "url":
            case "number":
                return (
                    <div className="flex flex-col gap-1.5">
                        <div className="relative group/input-area">
                            {isExpression ? (
                                <ExpressionEditor
                                    value={value}
                                    onChange={(val: string) => onChange(val, input.id)}
                                    placeholder={input.type === "number" ? "{{ 0 }}" : "{{ expression }}"}
                                />
                            ) : (
                                <Input
                                    id={input.id}
                                    type={input.type}
                                    value={value}
                                    onChange={(e) => onChange(e.target.value, input.id)}
                                    className="border rounded h-8 text-xs"
                                />
                            )}
                            {isExpression && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="absolute right-1.5 top-1.5 h-6 w-6 opacity-0 group-hover/input-area:opacity-100 transition-opacity bg-background/95 hover:bg-background border-border shadow-md z-[60]"
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    <Maximize2 size={12} className="text-foreground" />
                                </Button>
                            )}
                        </div>
                        {resultPreview !== null && (
                            <div className="mt-0.5 px-2 py-1.5 rounded bg-muted/20 border-l-2 border-primary/30">
                                <span className="text-[10px] font-mono whitespace-pre-wrap break-words text-muted-foreground leading-tight">
                                    result: <span className="text-foreground/80">{typeof resultPreview === 'object' ? JSON.stringify(resultPreview).slice(0, 100) : String(resultPreview)}</span>
                                </span>
                            </div>
                        )}
                    </div>
                );

            case "select":
                return (
                    <div className="flex flex-col gap-1.5">
                        <div className="relative group/input-area">
                            {isExpression ? (
                                <ExpressionEditor
                                    value={value}
                                    onChange={(val: string) => onChange(val, input.id)}
                                    placeholder="{{ value }}"
                                />
                            ) : (
                                <Select
                                    value={value || input.defaultValue || ""}
                                    onValueChange={(e) => onChange(e, input.id)}
                                >
                                    <SelectTrigger className="w-full text-xs h-8">
                                        <SelectValue placeholder={`Select ${input.label}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(input.id === "layer-input" || input.id === "layer-overlay"
                                            ? layerOptions
                                            : input.options || []
                                        ).map((option) => {
                                            const label = typeof option === "string" ? option : option.label;
                                            const val = typeof option === "string" ? option : option.value;
                                            return (
                                                <SelectItem key={val} value={val}>
                                                    {label}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            )}
                            {isExpression && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="absolute right-1.5 top-1.5 h-6 w-6 opacity-0 group-hover/input-area:opacity-100 transition-opacity bg-background/95 hover:bg-background border-border shadow-md z-[60]"
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    <Maximize2 size={12} className="text-foreground" />
                                </Button>
                            )}
                        </div>
                        {resultPreview !== null && (
                            <div className="mt-0.5 px-2 py-1.5 rounded bg-muted/20 border-l-2 border-primary/30">
                                <span className="text-[10px] font-mono whitespace-pre-wrap break-words text-muted-foreground leading-tight">
                                    result: <span className="text-foreground/80">{typeof resultPreview === 'object' ? JSON.stringify(resultPreview).slice(0, 100) : String(resultPreview)}</span>
                                </span>
                            </div>
                        )}
                    </div>
                );

            case "file":
                return (
                    <div className="flex flex-col gap-2">
                        <Input
                            id={input.id}
                            type="file"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => {
                                    const content = String(reader.result ?? "");
                                    updateNodeProperties({
                                        parameters: {
                                            ...parameters,
                                            [input.id]: content,
                                            fileName: file.name,
                                        },
                                    });
                                };
                                reader.readAsText(file);
                            }}
                            className="border rounded h-8 text-xs file:text-xs file:h-6"
                        />
                    </div>
                );

            case "switch":
                return (
                    <Switch
                        id={input.id}
                        checked={value === "true"}
                        onCheckedChange={(checked) =>
                            onChange(checked ? "true" : "false", input.id)
                        }
                    />
                );

            case "key-value-list":
                return (
                    <KeyValueList
                        id={input.id}
                        label={input.label}
                        value={value as any}
                        onChange={onChange}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className={cn(
            "group flex flex-col gap-2.5 p-1 rounded-lg transition-colors",
            input.type === "switch" && "flex-row items-center justify-between"
        )}>
            <div className="flex justify-between items-center gap-2">
                <div className="flex items-center justify-between w-full">
                    <label className="text-[11px] font-semibold text-foreground/80 uppercase tracking-tight self-end">
                        {input.label}
                    </label>
                    {(input.type === "text" || input.type === "url" || input.type === "number" || input.type === "select") && (
                        <div className="flex items-center gap-0.5 bg-muted/30 p-0.5 rounded border border-border/50">
                            <ToggleButton
                                active={!parameters._expressions?.[input.id]}
                                onClick={() => {
                                    const next = { ...(parameters._expressions || {}), [input.id]: false };
                                    onChange(next, "_expressions");
                                }}
                            >
                                Fixed
                            </ToggleButton>
                            <ToggleButton
                                active={!!parameters._expressions?.[input.id]}
                                onClick={() => {
                                    const next = { ...(parameters._expressions || {}), [input.id]: true };
                                    onChange(next, "_expressions");
                                }}
                            >
                                Expression
                            </ToggleButton>
                        </div>
                    )}
                </div>
                {isOptional && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive shrink-0"
                        onClick={() => onRemove?.(input.id)}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                )}
            </div>

            <div className="w-full">
                {renderInputControl()}
            </div>

            <ExpressionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                value={value}
                onChange={(val: string) => onChange(val, input.id)}
                nodes={allNodes}
                fieldName={input.label}
                inputData={parameters}
            />
        </div>
    );
};
