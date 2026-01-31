"use client";

import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface FieldSelectProps {
    fields: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function FieldSelect({
    fields,
    value,
    onChange,
    placeholder = "Select field",
    className,
}: FieldSelectProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={className}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {fields.map((field) => (
                    <SelectItem key={field} value={field}>
                        {field}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
