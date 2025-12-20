"use client";

import {
  analysisOperations,
  geometryOperations,
  geoprocessingOperations,
  getOperationDetails,
  integrationOperations,
  OperationItem
} from "@/constants/operations";
import useLayerStore from "@/stores/layer";
import { useMapStore } from "@/stores/map";
import { executeOperation } from "@/tools/operation-executor";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Info, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../button";
import { Input } from "../input";
import { ScrollArea } from "../scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

export default function OperationComponents() {
  const { map } = useMapStore();
  const { layers } = useLayerStore();
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [operationOptions, setOperationOptions] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const operationDetails = getOperationDetails(layers);

  useEffect(() => {
    if (selectedOperation) {
      const op = operationDetails[selectedOperation.toLowerCase()];
      if (op) {
        const initial: Record<string, any> = {};
        op.options.forEach((opt) => {
          if (Array.isArray(opt.value) && opt.value.length > 0) {
            initial[opt.id] = typeof opt.value[0] === "object" ? opt.value[0].key : opt.value[0];
          } else if (typeof opt.value === "string") {
            initial[opt.id] = opt.value;
          }
        });
        setOperationOptions(initial);
      }
    }
  }, [selectedOperation, layers]);

  const handleRun = async () => {
    if (!selectedOperation) return;
    setIsLoading(true);
    try {
      await executeOperation(selectedOperation, operationOptions, map, layers.length);
    } catch (error) {
      console.error("Operation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOps = (ops: OperationItem[]) =>
    ops.filter((op) => op.label.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm overflow-hidden">
      <AnimatePresence mode="wait">
        {!selectedOperation ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full"
          >
            {/* Minimalist Search Area */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold tracking-tight">Tools</h1>
                <Sparkles className="h-5 w-5 text-primary/40" />
              </div>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Search geoprocessing tools..."
                  className="pl-10 h-10 bg-muted/40 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1 px-6 pb-6">
              <div className="space-y-8">
                <OperationSection title="Geoprocessing" items={filteredOps(geoprocessingOperations)} onSelect={setSelectedOperation} />
                <OperationSection title="Geometry" items={filteredOps(geometryOperations)} onSelect={setSelectedOperation} />
                <OperationSection title="Analysis" items={filteredOps(analysisOperations)} onSelect={setSelectedOperation} />
                <OperationSection title="Integration" items={filteredOps(integrationOperations)} onSelect={setSelectedOperation} />
              </div>
            </ScrollArea>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center gap-4 bg-background/80 sticky top-0 z-10 backdrop-blur-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedOperation(null)}
                className="h-9 w-9 rounded-full hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-semibold truncate leading-none">
                  {operationDetails[selectedOperation.toLowerCase()]?.title || selectedOperation}
                </h1>
                <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-1 italic">
                  {operationDetails[selectedOperation.toLowerCase()]?.description}
                </p>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {operationDetails[selectedOperation.toLowerCase()]?.options.map((opt) => (
                  <div key={opt.id} className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        {opt.name}
                      </label>
                      {opt.info && <Info className="h-3 w-3 text-muted-foreground/40" />}
                    </div>

                    {opt.type === "select" ? (
                      <Select
                        value={operationOptions[opt.id]}
                        onValueChange={(val) => setOperationOptions((p) => ({ ...p, [opt.id]: val }))}
                      >
                        <SelectTrigger className="h-9 bg-muted/30 border-none shadow-none focus:ring-1 focus:ring-primary/20">
                          <SelectValue placeholder={`Select ${opt.name}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(opt.value) &&
                            opt.value.map((item, idx) => {
                              const val = typeof item === "object" ? item.key : item;
                              const label = typeof item === "object" ? item.value : item;
                              return (
                                <SelectItem key={idx} value={val} className="text-xs">
                                  {label}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={opt.type === "number" ? "number" : "text"}
                        className="h-9 bg-muted/30 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20"
                        value={operationOptions[opt.id] || ""}
                        onChange={(e) => setOperationOptions((p) => ({ ...p, [opt.id]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer Action */}
            <div className="p-6 pt-2 border-t bg-muted/20">
              <Button
                className="w-full h-11 text-xs font-bold uppercase tracking-widest gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                onClick={handleRun}
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  "Execute Tool"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OperationSection({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: OperationItem[];
  onSelect: (label: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-4">
      <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60 px-1">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, id) => (
          <button
            key={id}
            onClick={() => onSelect(item.label)}
            className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/30 hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all duration-300 active:scale-[0.97]"
          >
            <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md group-hover:text-primary transition-all">
              {item.icon}
            </div>
            <span className="text-[11px] font-medium text-center leading-tight">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
