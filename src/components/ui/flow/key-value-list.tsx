import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";

interface KeyValueListProps {
    id: string;
    label: string;
    value: { key: string; value: string }[];
    onChange: (value: { key: string; value: string }[], id: string) => void;
}

export const KeyValueList: React.FC<KeyValueListProps> = ({
    id,
    label,
    value,
    onChange,
}) => {
    const items = value || [];

    const handleAddItem = () => {
        const newItems = [...items, { key: "", value: "" }];
        onChange(newItems, id);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems, id);
    };

    const handleItemChange = (
        index: number,
        field: "key" | "value",
        val: string
    ) => {
        const newItems = items.map((item, i) =>
            i === index ? { ...item, [field]: val } : item
        );
        onChange(newItems, id);
    };

    return (
        <div className="flex flex-col gap-2 mt-2">
            <label className="text-xs font-semibold">{label}</label>
            {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                    <div className="flex flex-col gap-1 flex-1">
                        <label className="text-[10px] text-muted-foreground ml-1">Name</label>
                        <Input
                            placeholder="Key"
                            value={item.key}
                            onChange={(e) => handleItemChange(index, "key", e.target.value)}
                            className="h-8 text-xs"
                        />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                        <label className="text-[10px] text-muted-foreground ml-1">Value</label>
                        <Input
                            placeholder="Value"
                            value={item.value}
                            onChange={(e) => handleItemChange(index, "value", e.target.value)}
                            className="h-8 text-xs"
                        />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 mt-4"
                        onClick={() => handleRemoveItem(index)}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
            <Button
                variant="outline"
                size="sm"
                className="mt-1 h-8 text-xs border-dashed w-full"
                onClick={handleAddItem}
            >
                <Plus className="h-3 w-3 mr-2" />
                Add Item
            </Button>
        </div>
    );
};
