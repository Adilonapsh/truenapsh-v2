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
import { ToggleButton } from "./setting-field";
import { ExpressionEditor } from "./expression-editor";
import { ExpressionModal } from "./expression-modal";
import { Maximize2 } from "lucide-react";

interface SchedulerRule {
    id: string;
    interval: string;
    intervalValue: number | string;
    hour: number | string;
    minute: number | string;
    cron?: string;
    _expressions?: Record<string, boolean>;
}

interface SchedulerRulesProps {
    value: SchedulerRule;
    onChange: (value: SchedulerRule) => void;
    allNodes: any[];
    parameters: Record<string, any>;
}

const INTERVAL_OPTIONS = [
    "Seconds",
    "Minutes",
    "Hours",
    "Days",
    "Weeks",
    "Months",
    "Custom (Cron)",
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
    label: i === 0 ? "Midnight" : i === 12 ? "Noon" : `${i}:00`,
    value: i.toString(),
}));

const FieldWrapper = ({
    label,
    id,
    isExpression,
    onToggle,
    children,
    expressionEditor,
}: {
    label: string;
    id: string;
    isExpression: boolean;
    onToggle: (val: boolean) => void;
    children: React.ReactNode;
    expressionEditor: React.ReactNode;
}) => (
    <div className="space-y-1.5 flex flex-col">
        <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">{label}</label>
            <div className="flex items-center gap-0.5 bg-muted/30 p-0.5 rounded border border-border/50">
                <ToggleButton active={!isExpression} onClick={() => onToggle(false)}>Fixed</ToggleButton>
                <ToggleButton active={isExpression} onClick={() => onToggle(true)}>Expression</ToggleButton>
            </div>
        </div>
        {isExpression ? expressionEditor : children}
    </div>
);

export const SchedulerRules: React.FC<SchedulerRulesProps> = ({ value, onChange, allNodes, parameters }) => {
    const [modalConfig, setModalConfig] = React.useState<{ isOpen: boolean; fieldId: string; label: string } | null>(null);

    // Default rule if value is missing
    const defaultRule: SchedulerRule = {
        id: "default",
        interval: "Days",
        intervalValue: 1,
        hour: 0,
        minute: 0,
        _expressions: {},
    };

    // Handle legacy array data or missing value
    const rule = Array.isArray(value)
        ? (value[0] || defaultRule)
        : (value || defaultRule);

    const updateRule = (updates: Partial<SchedulerRule>) => {
        onChange({ ...rule, ...updates });
    };

    const toggleExpression = (field: string, isExpr: boolean) => {
        const nextExpr = { ...(safeGetExpressions()), [field]: isExpr };
        updateRule({ _expressions: nextExpr });
    };

    const safeGetExpressions = () => rule._expressions || {};

    const renderExpressionEditor = (fieldId: string) => (
        <div className="relative group/expr">
            <ExpressionEditor
                value={String(rule[fieldId as keyof SchedulerRule] || "")}
                onChange={(val: string) => updateRule({ [fieldId]: val })}
                placeholder="{{ expression }}"
            />
            <Button
                variant="outline"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover/expr:opacity-100 transition-opacity bg-background/90"
                onClick={() => setModalConfig({ isOpen: true, fieldId, label: fieldId })}
            >
                <Maximize2 size={10} />
            </Button>
        </div>
    );

    return (
        <div className="space-y-4 mt-2">
            <div className="relative space-y-4 p-3 rounded-lg border bg-muted/10">
                <FieldWrapper
                    label="Trigger Interval"
                    id="interval"
                    isExpression={!!safeGetExpressions().interval}
                    onToggle={(v) => toggleExpression("interval", v)}
                    expressionEditor={renderExpressionEditor("interval")}
                >
                    <Select
                        value={rule.interval}
                        onValueChange={(v: string) => updateRule({ interval: v })}
                    >
                        <SelectTrigger className="h-8 text-xs bg-background/50">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                            {INTERVAL_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt} className="text-xs">
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FieldWrapper>

                {rule.interval !== "Custom (Cron)" && (
                    <FieldWrapper
                        label={`${rule.interval} Between Triggers`}
                        id="intervalValue"
                        isExpression={!!safeGetExpressions().intervalValue}
                        onToggle={(v: boolean) => toggleExpression("intervalValue", v)}
                        expressionEditor={renderExpressionEditor("intervalValue")}
                    >
                        <Input
                            type="number"
                            value={rule.intervalValue}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRule({ intervalValue: parseInt(e.target.value) || 1 })}
                            className="h-8 text-xs bg-background/50"
                        />
                        {rule.interval === "Days" && (
                            <p className="text-[9px] text-muted-foreground italic px-0.5">Must be in range 1-31</p>
                        )}
                    </FieldWrapper>
                )}

                {["Days", "Weeks", "Months"].includes(rule.interval) && (
                    <div className="grid grid-cols-2 gap-3">
                        <FieldWrapper
                            label="Trigger at Hour"
                            id="hour"
                            isExpression={!!safeGetExpressions().hour}
                            onToggle={(v: boolean) => toggleExpression("hour", v)}
                            expressionEditor={renderExpressionEditor("hour")}
                        >
                            <Select
                                value={rule.hour.toString()}
                                onValueChange={(v: string) => updateRule({ hour: parseInt(v) })}
                            >
                                <SelectTrigger className="h-8 text-xs bg-background/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[100]">
                                    {HOUR_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldWrapper>

                        <FieldWrapper
                            label="Trigger at Minute"
                            id="minute"
                            isExpression={!!safeGetExpressions().minute}
                            onToggle={(v: boolean) => toggleExpression("minute", v)}
                            expressionEditor={renderExpressionEditor("minute")}
                        >
                            <Input
                                type="number"
                                min={0}
                                max={59}
                                value={rule.minute}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRule({ minute: parseInt(e.target.value) || 0 })}
                                className="h-8 text-xs bg-background/50"
                            />
                        </FieldWrapper>
                    </div>
                )}

                {rule.interval === "Custom (Cron)" && (
                    <FieldWrapper
                        label="Cron Expression"
                        id="cron"
                        isExpression={!!safeGetExpressions().cron}
                        onToggle={(v: boolean) => toggleExpression("cron", v)}
                        expressionEditor={renderExpressionEditor("cron")}
                    >
                        <Input
                            placeholder="* * * * *"
                            value={rule.cron || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRule({ cron: e.target.value })}
                            className="h-8 text-xs font-mono bg-background/50"
                        />
                    </FieldWrapper>
                )}
            </div>

            {modalConfig && (
                <ExpressionModal
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig(null)}
                    value={String(rule[modalConfig.fieldId as keyof SchedulerRule] || "")}
                    onChange={(val) => updateRule({ [modalConfig.fieldId]: val })}
                    nodes={allNodes}
                    fieldName={modalConfig.label}
                    inputData={parameters}
                />
            )}
        </div>
    );
};
