import React from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableItemData {
    id: string;
    text: string;
    checked: boolean;
    extra?: any; // Used for "order" in order-by
}

interface SortableListProps {
    id: string;
    label: string;
    value: SortableItemData[];
    onChange: (value: SortableItemData[], id: string) => void;
    type: "multi-select" | "sortable-list";
}

const SortableItem = ({
    item,
    onRemove,
    onChange,
    isSortable,
}: {
    item: SortableItemData;
    onRemove: () => void;
    onChange: (item: SortableItemData) => void;
    isSortable: boolean;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id, disabled: !isSortable });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-2 bg-muted/20 p-1.5 rounded border border-border/50 group/item transition-shadow",
                isDragging && "shadow-lg z-50 bg-background border-primary/50"
            )}
        >
            {isSortable && (
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab hover:text-primary active:cursor-grabbing p-1 text-muted-foreground/50 hover:text-muted-foreground"
                >
                    <GripVertical size={14} />
                </div>
            )}

            <Checkbox
                checked={item.checked}
                onCheckedChange={(checked) => onChange({ ...item, checked: !!checked })}
                className="h-3.5 w-3.5"
            />

            <Input
                value={item.text}
                onChange={(e) => onChange({ ...item, text: e.target.value })}
                placeholder="Field name"
                className="h-7 text-xs flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1"
            />

            {item.extra !== undefined && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => onChange({ ...item, extra: item.extra === "Ascending" ? "Descending" : "Ascending" })}
                >
                    {item.extra === "Ascending" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    <span className="sr-only">{item.extra}</span>
                </Button>
            )}

            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover/item:opacity-100 transition-opacity hover:text-destructive"
                onClick={onRemove}
            >
                <Trash2 size={12} />
            </Button>
        </div>
    );
};

export const SortableList: React.FC<SortableListProps> = ({
    id,
    label,
    value = [],
    onChange,
    type,
}) => {
    const items = value || [];
    const isSortable = true; // Both types now support reordering

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleAddItem = () => {
        const newItem: SortableItemData = {
            id: Math.random().toString(36).substr(2, 9),
            text: "",
            checked: true,
            extra: type === "sortable-list" ? "Ascending" : undefined,
        };
        onChange([...items, newItem], id);
    };

    const handleRemoveItem = (itemId: string) => {
        onChange(items.filter((item) => item.id !== itemId), id);
    };

    const handleItemChange = (updatedItem: SortableItemData) => {
        onChange(items.map((item) => (item.id === updatedItem.id ? updatedItem : item)), id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            onChange(arrayMove(items, oldIndex, newIndex), id);
        }
    };

    const [isDraggingOver, setIsDraggingOver] = React.useState(false);

    const onDragOver = (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes("application/field-name")) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setIsDraggingOver(true);
        }
    };

    const onDragLeave = () => {
        setIsDraggingOver(false);
    };

    const onDrop = (e: React.DragEvent) => {
        setIsDraggingOver(false);
        const fieldName = e.dataTransfer.getData("application/field-name");
        if (fieldName) {
            e.preventDefault();
            const newItem: SortableItemData = {
                id: Math.random().toString(36).substr(2, 9),
                text: fieldName,
                checked: true,
                extra: type === "sortable-list" ? "Ascending" : undefined,
            };
            onChange([...items, newItem], id);
        }
    };

    const allChecked = items.length > 0 && items.every((item) => item.checked);
    const someChecked = items.some((item) => item.checked) && !allChecked;

    const handleToggleAll = (checked: boolean) => {
        onChange(items.map((item) => ({ ...item, checked })), id);
    };

    return (
        <div
            className={cn(
                "flex flex-col gap-2 group/list transition-all duration-200 rounded-md",
                isDraggingOver && "ring-2 ring-primary ring-inset bg-primary/5"
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {items.length > 0 && (
                <div className="flex items-center gap-2 px-1.5 py-1 mb-1 border-b border-border/50">
                    <div className="w-4 h-4 flex items-center justify-center">
                        {/* Spacer for drag handle */}
                        {isSortable && <div className="w-[14px]" />}
                    </div>
                    <Checkbox
                        checked={allChecked}
                        onCheckedChange={(checked) => handleToggleAll(!!checked)}
                        className={cn("h-3.5 w-3.5", someChecked && "opacity-70")}
                    />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        Select All ({items.filter(i => i.checked).length}/{items.length})
                    </span>
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
            >
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-1.5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar group-hover/list:border-primary/20 border border-transparent rounded transition-colors">
                        {items.map((item) => (
                            <SortableItem
                                key={item.id}
                                item={item}
                                isSortable={isSortable}
                                onRemove={() => handleRemoveItem(item.id)}
                                onChange={handleItemChange}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {items.length === 0 && (
                <div className="text-[10px] text-center p-4 border border-dashed rounded border-muted-foreground/20 text-muted-foreground italic">
                    {isDraggingOver ? "Drop to add field" : "Drag fields from Input Schema or click add"}
                </div>
            )}

            <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] border-dashed font-normal bg-muted/10 hover:bg-muted/30"
                onClick={handleAddItem}
            >
                <Plus size={10} className="mr-1.5" />
                Add Field
            </Button>
        </div>
    );
};
