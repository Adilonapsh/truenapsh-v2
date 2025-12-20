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
import { Trash2 } from "lucide-react";
import { KeyValueList } from "./key-value-list";
import { SettingInput } from "./settings-config";

interface SettingFieldProps {
    input: SettingInput;
    value: any;
    parameters: Record<string, any>;
    onChange: (value: any, id: string) => void;
    onRemove?: (id: string) => void;
    layerOptions: { label: string; value: string }[];
    updateNodeProperties: (data: object) => void;
}

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

    const renderInputControl = () => {
        switch (input.type) {
            case "text":
            case "url":
                return (
                    <Input
                        id={input.id}
                        type={input.type}
                        value={value}
                        onChange={(e) => onChange(e.target.value, input.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const payload = e.dataTransfer.getData("application/variable");
                            if (payload) {
                                const next = value ? `${value} ${payload}` : payload;
                                onChange(next, input.id);
                            }
                        }}
                        className="border rounded h-8 text-xs"
                    />
                );
            case "file":
                return (
                    <div className="flex flex-col gap-2">
                        <Input
                            id={input.id}
                            type="file"
                            accept={(() => {
                                const t = parameters.type;
                                if (t === "CSV") return ".csv";
                                if (t === "JSON") return ".json";
                                if (t === "GEOJSON") return ".geojson,.json";
                                if (t === "Excel") return ".xlsx,.xls";
                                return "*";
                            })()}
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
                        {parameters.fileName && (
                            <span className="text-[10px] text-muted-foreground">
                                Selected: {parameters.fileName}
                            </span>
                        )}
                    </div>
                );

            case "switch":
                return (
                    <div className="inline-flex items-center cursor-pointer">
                        <Switch
                            className="rounded-full bg-gray-300 transition-colors duration-200"
                            id={input.id}
                            checked={value === "true"}
                            onCheckedChange={(checked) =>
                                onChange(checked ? "true" : "false", input.id)
                            }
                        />
                    </div>
                );

            case "number":
                return (
                    <Input
                        id={input.id}
                        type="number"
                        value={value}
                        onChange={(e) => onChange(e.target.value, input.id)}
                        className="border rounded h-8 text-xs"
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

            case "select":
            default:
                return (
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
                );
        }
    };

    return (
        <div
            className={`${input.type === "switch" ? "flex gap-2 items-center" : "flex flex-col gap-2"
                }`}
        >
            <div className="flex justify-between items-center">
                {input.type !== "key-value-list" && (
                    <label htmlFor={input.id} className="text-xs font-semibold">
                        {input.label}
                    </label>
                )}
                {isOptional && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onRemove?.(input.id)}
                    >
                        <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                )}
            </div>
            {renderInputControl()}
        </div>
    );
};
