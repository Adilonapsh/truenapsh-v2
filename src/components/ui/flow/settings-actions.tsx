import React from "react";
import { Node } from "@xyflow/react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLayers } from "@/stores/layer";
import { settingsInputs } from "./settings-config";
import { SettingField } from "./setting-field";

const SettingActions = ({
    selectedNode,
    updateNodeProperties,
}: {
    selectedNode: Node | null;
    updateNodeProperties: (data: object) => void;
}) => {
    const layers = useLayers();
    const layerOptions = layers.map((l) => ({
        label: l.name,
        value: l.id,
    }));

    const handleInputChange = (value: any, id: string) => {
        updateNodeProperties({
            parameters: {
                ...(selectedNode?.data?.parameters || {}),
                [id]: value,
            },
        });
    };

    if (!selectedNode || !selectedNode.type) return null;

    const allInputs = settingsInputs[selectedNode.type] || [];
    const mandatoryInputs = allInputs.filter((i) => !i.isOptional);
    const optionalInputs = allInputs.filter((i) => i.isOptional);

    const parameters = (selectedNode.data?.parameters || {}) as Record<string, any>;
    const enabledOptions = (parameters.enabledOptions || []) as string[];

    const visibleMandatory = mandatoryInputs.filter((input) => {
        if (input.showIf) return input.showIf(parameters);
        return true;
    });

    const visibleOptional = optionalInputs.filter((input) =>
        enabledOptions.includes(input.id)
    );

    const availableOptions = optionalInputs.filter(
        (input) => !enabledOptions.includes(input.id)
    );

    const handleAddOption = (optionId: string) => {
        const newEnabled = [...enabledOptions, optionId];
        handleInputChange(newEnabled, "enabledOptions");
    };

    const handleRemoveOption = (optionId: string) => {
        const newEnabled = enabledOptions.filter((id) => id !== optionId);
        // Clear the value of the removed option and update enabledOptions
        const { [optionId]: _, ...rest } = parameters;
        updateNodeProperties({
            parameters: {
                ...rest,
                enabledOptions: newEnabled,
            },
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <Accordion type="multiple" defaultValue={["general", "parameters"]}>
                <AccordionItem value="general">
                    <AccordionTrigger className="text-xs">General</AccordionTrigger>
                    <AccordionContent className="px-1 flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="nodeLabel" className="text-xs font-semibold">
                                Label
                            </label>
                            <Input
                                id="nodeLabel"
                                type="text"
                                value={parameters?.label?.toString() || ""}
                                onChange={(e) =>
                                    handleInputChange(e.target.value, "label")
                                }
                                className="border rounded h-8 text-xs"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="DescLabel" className="text-xs font-semibold">
                                Description
                            </label>
                            <Input
                                id="DescLabel"
                                type="text"
                                value={parameters?.desc?.toString() || ""}
                                onChange={(e) =>
                                    handleInputChange(e.target.value, "desc")
                                }
                                className="border rounded h-8 text-xs"
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="parameters">
                    <AccordionTrigger className="text-xs">Parameters</AccordionTrigger>
                    <AccordionContent className="px-1 flex flex-col gap-4">
                        {/* Mandatory Section */}
                        <div className="flex flex-col gap-4">
                            {visibleMandatory.map((input) => (
                                <SettingField
                                    key={input.id}
                                    input={input}
                                    value={parameters[input.id] ?? ""}
                                    parameters={parameters}
                                    onChange={handleInputChange}
                                    layerOptions={layerOptions}
                                    updateNodeProperties={updateNodeProperties}
                                />
                            ))}
                        </div>

                        <div className="h-px bg-border my-2" />

                        {/* Optional Section */}
                        <div className="flex flex-col gap-3">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Options
                            </div>

                            {visibleOptional.length > 0 ? (
                                <div className="flex flex-col gap-4">
                                    {visibleOptional.map((input) => (
                                        <SettingField
                                            key={input.id}
                                            input={input}
                                            value={parameters[input.id] ?? ""}
                                            parameters={parameters}
                                            onChange={handleInputChange}
                                            onRemove={handleRemoveOption}
                                            layerOptions={layerOptions}
                                            updateNodeProperties={updateNodeProperties}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground py-2 text-center">
                                    No properties
                                </div>
                            )}

                            <Select onValueChange={handleAddOption}>
                                <SelectTrigger className="w-full text-xs h-8 bg-muted/50 border-dashed">
                                    <SelectValue placeholder="Add option" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableOptions.map((opt) => (
                                        <SelectItem key={opt.id} value={opt.id}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
};

export default SettingActions;
