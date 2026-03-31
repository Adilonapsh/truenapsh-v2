import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, GripVertical } from "lucide-react";

interface RoutingRule {
    condition: string;
    operator: string;
    value: string;
    renameOutput: boolean;
    outputName: string;
}

interface RoutingRulesProps {
    value: RoutingRule[];
    onChange: (value: RoutingRule[]) => void;
}

const OPERATORS = [
    { label: "is equal to", value: "==" },
    { label: "is not equal to", value: "!=" },
    { label: "is greater than", value: ">" },
    { label: "is less than", value: "<" },
    { label: "contains", value: "contains" },
    { label: "matches regex", value: "regex" },
];

export const RoutingRules: React.FC<RoutingRulesProps> = ({ value, onChange }) => {
    const rules = value || [];

    const handleAddRule = () => {
        const newRules = [
            ...rules,
            {
                condition: "",
                operator: "==",
                value: "",
                renameOutput: false,
                outputName: `output ${rules.length + 1}`,
            },
        ];
        onChange(newRules);
    };

    const handleRemoveRule = (index: number) => {
        const newRules = rules.filter((_, i) => i !== index);
        onChange(newRules);
    };

    const handleRuleChange = (index: number, updates: Partial<RoutingRule>) => {
        const newRules = rules.map((rule, i) =>
            i === index ? { ...rule, ...updates } : rule
        );
        onChange(newRules);
    };

    return (
        <div className="space-y-4 mt-2">
            <div className="flex flex-col gap-3">
                {rules.map((rule, index) => (
                    <div key={index} className="p-3 rounded-lg border bg-muted/10 space-y-3 relative group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Rule {index + 1}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveRule(index)}
                            >
                                <Trash2 size={12} />
                            </Button>
                        </div>

                        <div className="grid gap-2">
                            <Input
                                placeholder="Value (e.g. data.id)"
                                value={rule.condition}
                                onChange={(e) => handleRuleChange(index, { condition: e.target.value })}
                                className="h-8 text-xs bg-background"
                            />

                            <Select
                                value={rule.operator}
                                onValueChange={(v) => handleRuleChange(index, { operator: v })}
                            >
                                <SelectTrigger className="h-8 text-xs bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {OPERATORS.map((op) => (
                                        <SelectItem key={op.value} value={op.value} className="text-xs">
                                            {op.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                placeholder="Comparison value"
                                value={rule.value}
                                onChange={(e) => handleRuleChange(index, { value: e.target.value })}
                                className="h-8 text-xs bg-background"
                            />
                        </div>

                        <div className="pt-2 border-t border-border/50 space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-medium text-muted-foreground uppercase">Rename Output</label>
                                <Switch
                                    checked={rule.renameOutput}
                                    onCheckedChange={(v) => handleRuleChange(index, { renameOutput: v })}
                                    className="scale-75"
                                />
                            </div>

                            {rule.renameOutput && (
                                <div className="space-y-1">
                                    <label className="text-[10px] text-muted-foreground ml-1 font-semibold uppercase">Output Name</label>
                                    <Input
                                        placeholder="Output Name"
                                        value={rule.outputName}
                                        onChange={(e) => handleRuleChange(index, { outputName: e.target.value })}
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs border-dashed"
                onClick={handleAddRule}
            >
                <Plus className="h-3 w-3 mr-2" />
                Add Routing Rule
            </Button>
        </div>
    );
};
