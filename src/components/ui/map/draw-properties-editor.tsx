"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, X, Type, Hash, List, CheckCircle2 } from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../card";
import { Label } from "../label";
import { ScrollArea } from "../scroll-area";
import { PropertyValueType } from "@/types/map.types";

interface PropertyField {
    key: string;
    value: any;
    type: PropertyValueType;
}

interface DrawPropertiesEditorProps {
    feature: GeoJSON.Feature;
    onUpdate: (properties: Record<string, any>) => void;
    onClose: () => void;
}

export function DrawPropertiesEditor({
    feature,
    onUpdate,
    onClose,
}: DrawPropertiesEditorProps) {
    const [fields, setFields] = useState<PropertyField[]>([]);

    useEffect(() => {
        if (feature && feature.properties) {
            const initialFields: PropertyField[] = Object.entries(feature.properties).map(
                ([key, value]) => {
                    let type: PropertyValueType = "string";
                    if (Array.isArray(value)) type = "array";
                    else if (typeof value === "number") type = "number";
                    else if (typeof value === "boolean") type = "boolean";
                    return { key, value, type };
                }
            );
            setFields(initialFields);
        } else {
            setFields([]);
        }
    }, [feature]);

    const handleAddField = () => {
        const newField: PropertyField = {
            key: `field_${fields.length + 1}`,
            value: "",
            type: "string",
        };
        const newFields = [...fields, newField];
        setFields(newFields);
        updateProperties(newFields);
    };

    const handleRemoveField = (index: number) => {
        const newFields = fields.filter((_, i) => i !== index);
        setFields(newFields);
        updateProperties(newFields);
    };

    const handleFieldChange = (index: number, updates: Partial<PropertyField>) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...updates };

        // Convert value if type changed
        if (updates.type) {
            const newType = updates.type;
            let val = newFields[index].value;
            if (newType === "number") val = Number(val) || 0;
            else if (newType === "boolean") val = val === "true" || val === true;
            else if (newType === "array") val = Array.isArray(val) ? val : [];
            else if (newType === "string") val = String(val);
            newFields[index].value = val;
        }

        setFields(newFields);
        updateProperties(newFields);
    };

    const updateProperties = (currentFields: PropertyField[]) => {
        const properties: Record<string, any> = {};
        currentFields.forEach((field) => {
            if (field.key) {
                properties[field.key] = field.value;
            }
        });
        onUpdate(properties);
    };

    const renderValueInput = (field: PropertyField, index: number) => {
        switch (field.type) {
            case "number":
                return (
                    <Input
                        type="number"
                        value={field.value}
                        onChange={(e) =>
                            handleFieldChange(index, { value: Number(e.target.value) })
                        }
                        className="h-8"
                    />
                );
            case "boolean":
                return (
                    <Select
                        value={String(field.value)}
                        onValueChange={(val) =>
                            handleFieldChange(index, { value: val === "true" })
                        }
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                    </Select>
                );
            case "array":
                return (
                    <Input
                        placeholder="Comma separated values"
                        value={Array.isArray(field.value) ? field.value.join(", ") : field.value}
                        onChange={(e) =>
                            handleFieldChange(index, {
                                value: e.target.value.split(",").map((s) => s.trim()),
                            })
                        }
                        className="h-8"
                    />
                );
            default:
                return (
                    <Input
                        value={field.value}
                        onChange={(e) => handleFieldChange(index, { value: e.target.value })}
                        className="h-8"
                    />
                );
        }
    };

    return (
        <Card className="w-full shadow-lg border-primary/20 bg-background/95 backdrop-blur">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        Feature Properties
                    </CardTitle>
                    <CardDescription className="text-xs">
                        ID: {feature.id?.toString().substring(0, 8)}...
                    </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={index} className="flex flex-col gap-2 p-3 rounded-lg border bg-muted/30">
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Key"
                                        value={field.key}
                                        onChange={(e) =>
                                            handleFieldChange(index, { key: e.target.value })
                                        }
                                        className="h-8 font-mono text-xs"
                                    />
                                    <Select
                                        value={field.type}
                                        onValueChange={(val: PropertyValueType) =>
                                            handleFieldChange(index, { type: val })
                                        }
                                    >
                                        <SelectTrigger className="w-[100px] h-8 text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="string">String</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="boolean">Boolean</SelectItem>
                                            <SelectItem value="array">Array</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveField(index)}
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="pl-1">
                                    {renderValueInput(field, index)}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <Button
                    variant="outline"
                    className="w-full mt-4 h-9 border-dashed border-primary/50 hover:border-primary"
                    onClick={handleAddField}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                </Button>
            </CardContent>
        </Card>
    );
}
