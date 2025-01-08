import React from 'react';
import { PlusCircle, Trash2, GripVertical } from 'lucide-react';

export type RepeaterProps<T> = {
    items: T[];
    onChange: (items: T[]) => void;
    defaultValue: T;
    renderItem: (
        item: T,
        index: number,
        helpers: {
            remove: () => void;
            update: (value: T) => void;
        }
    ) => React.ReactNode;
    label?: string;
    maxItems?: number;
};

export function Repeater<T>({
    items,
    onChange,
    defaultValue,
    renderItem,
    label = 'Items',
    maxItems,
}: RepeaterProps<T>) {
    const addItem = () => {
        if (maxItems && items.length >= maxItems) return;
        onChange([...items, { ...defaultValue }]);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        onChange(newItems);
    };

    const updateItem = (index: number, value: T) => {
        const newItems = [...items];
        newItems[index] = value;
        onChange(newItems);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <button
                    type="button"
                    onClick={addItem}
                    disabled={maxItems ? items.length >= maxItems : false}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Add Item
                </button>
            </div>

            <div className="space-y-3">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="group relative flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-center text-gray-400">
                            <GripVertical className="w-5 h-5" />
                        </div>

                        <div className="flex-grow">
                            {renderItem(item, index, {
                                remove: () => removeItem(index),
                                update: (value: T) => updateItem(index, value),
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="absolute right-2 top-2 text-gray-400 hover:text-red-500 focus:outline-none"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-8 px-4 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-500">No items added yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}